import { atom, map } from 'nanostores';

export interface EnvVar {
  key: string;
  value: string;
}

export interface ProjectSettings {
  name: string;
  description: string;
  logo: string;
  envVars: EnvVar[];
  github: {
    token: string;
    repo: string;
    branch: string;
  };
}

export interface ProjectRecord {
  id: string;
  name: string;
  settings: ProjectSettings;
}

const PROJECTS_KEY = 'bolt.project.records';
const ACTIVE_PROJECT_KEY = 'bolt.project.active';

const DEFAULT_SETTINGS: ProjectSettings = {
  name: '',
  description: '',
  logo: '',
  envVars: [],
  github: { token: '', repo: '', branch: 'main' },
};

function loadProjects(): Record<string, ProjectRecord> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProjectRecord>;
  } catch {
    return {};
  }
}

function loadActiveProjectId(): string {
  if (typeof localStorage === 'undefined') return 'default';
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || 'default';
}

export const activeProjectIdStore = atom<string>(loadActiveProjectId());
export const projectsStore = map<Record<string, ProjectRecord>>(loadProjects());

if (typeof window !== 'undefined') {
  projectsStore.subscribe((state) => {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  });
  activeProjectIdStore.subscribe((value) => {
    try {
      localStorage.setItem(ACTIVE_PROJECT_KEY, value);
    } catch {
      /* ignore */
    }
  });
}

export function getActiveProject(): ProjectRecord {
  const projects = projectsStore.get();
  const id = activeProjectIdStore.get();
  return projects[id] ?? { id, name: '', settings: DEFAULT_SETTINGS };
}

export function setActiveProject(id: string, name = '') {
  activeProjectIdStore.set(id);
  const projects = projectsStore.get();
  if (!projects[id]) {
    projectsStore.setKey(id, { id, name, settings: DEFAULT_SETTINGS });
  }
}

export function updateActiveProjectSettings(patch: Partial<ProjectSettings>) {
  const id = activeProjectIdStore.get();
  const current = getActiveProject();
  projectsStore.setKey(id, {
    ...current,
    settings: {
      ...DEFAULT_SETTINGS,
      ...current.settings,
      ...patch,
      github: { ...DEFAULT_SETTINGS.github, ...current.settings.github, ...(patch.github ?? {}) },
    },
  });
}

export function envVarsToFile(envVars: EnvVar[]): string {
  return envVars.filter((v) => v.key.trim()).map((v) => `${v.key.trim()}=${v.value}`).join('\n') + '\n';
}

export async function writeEnvFile(envVars: EnvVar[]) {
  if (envVars.filter((v) => v.key.trim()).length === 0) return;
  const { webcontainer } = await import('~/lib/webcontainer');
  const { WORK_DIR } = await import('~/utils/constants');
  const nodePath = await import('node:path');
  const wc = await webcontainer;
  await wc.fs.writeFile(nodePath.join(WORK_DIR, '.env'), envVarsToFile(envVars));
}
