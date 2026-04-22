import { atom, map } from 'nanostores';
import { getSupabase } from '~/lib/supabase';

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
  owner_id?: string;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  name: '',
  description: '',
  logo: '',
  envVars: [],
  github: { token: '', repo: '', branch: 'main' },
};

const NO_DEVICE_ID = 'no-device-id';

// Gerar ID único do dispositivo
function getDeviceId(): string {
  if (typeof window === 'undefined') return NO_DEVICE_ID;
  const key = 'bolt.device.id';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return NO_DEVICE_ID;
  }
}

async function loadProjectsFromSupabase(): Promise<Record<string, ProjectRecord>> {
  const sb = getSupabase();
  if (!sb) return {};
  
  const deviceId = getDeviceId();
  if (deviceId === NO_DEVICE_ID) return {};
  
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .eq('owner_id', deviceId);
    
  if (error) {
    console.error('Error loading projects:', error);
    return {};
  }
  
  const projects: Record<string, ProjectRecord> = {};
  for (const row of data || []) {
    projects[row.id] = {
      id: row.id,
      name: row.name || '',
      owner_id: row.owner_id,
      settings: {
        name: row.name || '',
        description: row.description || '',
        logo: row.logo || '',
        envVars: row.env_vars || [],
        github: {
          token: row.github_token || '',
          repo: row.github_repo || '',
          branch: row.github_branch || 'main',
        },
      },
    };
  }
  return projects;
}

async function loadActiveProjectIdFromSupabase(deviceId: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  
  const { data, error } = await sb
    .from('projects')
    .select('id')
    .eq('owner_id', deviceId)
    .eq('is_active', true)
    .limit(1)
    .single();
    
  if (error || !data) return null;
  return data.id;
}

export async function saveProjectToSupabase(project: ProjectRecord) {
  const sb = getSupabase();
  if (!sb) return;
  
  const deviceId = getDeviceId();
  if (deviceId === NO_DEVICE_ID) return;
  
  await sb.from('projects').upsert({
    id: project.id,
    owner_id: deviceId,
    name: project.settings.name,
    description: project.settings.description,
    logo: project.settings.logo,
    github_repo: project.settings.github.repo,
    github_branch: project.settings.github.branch,
    github_token: project.settings.github.token,
    env_vars: project.settings.envVars,
  }, { onConflict: 'id' });
}

export const activeProjectIdStore = atom<string>('default');
export const projectsStore = map<Record<string, ProjectRecord>>({});

// Carregar projetos do Supabase ao inicializar
export async function initProjectsStore() {
  const deviceId = getDeviceId();
  if (deviceId === NO_DEVICE_ID) return;
  
  const projects = await loadProjectsFromSupabase();
  if (Object.keys(projects).length > 0) {
    projectsStore.set(projects);
  }
  
  const activeId = await loadActiveProjectIdFromSupabase(deviceId);
  if (activeId) {
    activeProjectIdStore.set(activeId);
  }
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
    const newProject = { id, name, settings: DEFAULT_SETTINGS };
    projectsStore.setKey(id, newProject);
    saveProjectToSupabase(newProject); // Salvar no Supabase
  }
}

export function updateActiveProjectSettings(patch: Partial<ProjectSettings>) {
  const id = activeProjectIdStore.get();
  const current = getActiveProject();
  const updated = {
    ...current,
    settings: {
      ...DEFAULT_SETTINGS,
      ...current.settings,
      ...patch,
      github: { ...DEFAULT_SETTINGS.github, ...current.settings.github, ...(patch.github ?? {}) },
    },
  };
  projectsStore.setKey(id, updated);
  saveProjectToSupabase(updated); // Salvar no Supabase
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
