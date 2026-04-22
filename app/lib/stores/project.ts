import { map } from 'nanostores';

export interface EnvVar {
  key: string;
  value: string;
}

export interface ProjectState {
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

const STORAGE_KEY = 'bolt.project.settings';

const DEFAULT_STATE: ProjectState = {
  name: '',
  description: '',
  logo: '',
  envVars: [],
  github: { token: '', repo: '', branch: 'main' },
};

function loadInitial(): ProjectState {
  if (typeof localStorage === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      github: { ...DEFAULT_STATE.github, ...(parsed.github ?? {}) },
      envVars: Array.isArray(parsed.envVars) ? parsed.envVars : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export const projectStore = map<ProjectState>(loadInitial());

if (typeof window !== 'undefined') {
  projectStore.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  });
}

export function envVarsToFile(envVars: EnvVar[]): string {
  return envVars
    .filter((v) => v.key.trim())
    .map((v) => `${v.key.trim()}=${v.value}`)
    .join('\n') + '\n';
}

export async function writeEnvFile(envVars: EnvVar[]) {
  if (envVars.filter((v) => v.key.trim()).length === 0) return;
  const { webcontainer } = await import('~/lib/webcontainer');
  const { WORK_DIR } = await import('~/utils/constants');
  const nodePath = await import('node:path');
  const wc = await webcontainer;
  await wc.fs.writeFile(nodePath.join(WORK_DIR, '.env'), envVarsToFile(envVars));
}
