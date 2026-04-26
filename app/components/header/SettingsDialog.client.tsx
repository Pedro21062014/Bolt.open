import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  fetchModelsFor,
  llmStore,
  modelsStore,
  modelsLoadingStore,
  PROVIDER_LABELS,
  setApiKey,
  type ProviderId,
} from '~/lib/stores/llm';
import {
  activeProjectIdStore,
  getActiveProject,
  projectsStore,
  updateActiveProjectSettings,
  writeEnvFile,
  type EnvVar,
} from '~/lib/stores/project';

type Tab = 'keys' | 'project';

const PROVIDERS: { id: ProviderId; placeholder: string; helpUrl: string; helpText: string }[] = [
  {
    id: 'anthropic',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpText: 'Get a key from console.anthropic.com',
  },
  {
    id: 'openrouter',
    placeholder: 'sk-or-...',
    helpUrl: 'https://openrouter.ai/keys',
    helpText: 'OpenRouter gives access to 200+ models from one key',
  },
  {
    id: 'google',
    placeholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpText: 'Free Gemini API key from Google AI Studio',
  },
];

export function SettingsDialog() {
  const { keys } = useStore(llmStore);
  const models = useStore(modelsStore);
  const loading = useStore(modelsLoadingStore);
  const projectId = useStore(activeProjectIdStore);
  const projects = useStore(projectsStore);
  const active = projects[projectId] ?? getActiveProject();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('keys');
  const [drafts, setDrafts] = useState<Record<ProviderId, string>>(keys);
  const [revealed, setRevealed] = useState<Record<ProviderId, boolean>>({ anthropic: false, openrouter: false, google: false });
  const [pName, setPName] = useState(active.name);
  const [pDesc, setPDesc] = useState(active.settings.description);
  const [pLogo, setPLogo] = useState(active.settings.logo);
  const [pEnv, setPEnv] = useState<EnvVar[]>(active.settings.envVars);

  const isProjectActive = projectId && projectId !== 'default';

  useEffect(() => {
    if (open) {
      setDrafts(keys);
      const current = projects[projectId] ?? getActiveProject();
      setPName(current.name);
      setPDesc(current.settings.description);
      setPLogo(current.settings.logo);
      setPEnv(current.settings.envVars.length ? current.settings.envVars : []);
    }
  }, [open, keys, projectId, projects]);

  useEffect(() => {
    if (!isProjectActive && tab === 'project') {
      setTab('keys');
    }
  }, [isProjectActive, tab]);

  async function saveAndTest(provider: ProviderId) {
    const value = drafts[provider].trim();
    setApiKey(provider, value);
    if (!value) {
      toast.info(`${PROVIDER_LABELS[provider]} key cleared.`);
      return;
    }
    const list = await fetchModelsFor(provider);
    if (list.length > 0) {
      toast.success(`${PROVIDER_LABELS[provider]}: ${list.length} models available.`);
    } else {
      toast.error(`${PROVIDER_LABELS[provider]}: could not load models. Check the key.`);
    }
  }

  async function handleLogoUpload(file: File) {
    if (file.size > 1024 * 1024) {
      toast.error('Logo must be smaller than 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProject() {
    const cleanedEnv = pEnv.filter((v) => v.key.trim());
    updateActiveProjectSettings({
      name: pName,
      description: pDesc,
      logo: pLogo,
      envVars: cleanedEnv,
    });
    if (cleanedEnv.length > 0) {
      try {
        await writeEnvFile(cleanedEnv);
        toast.success(`Project saved. .env written with ${cleanedEnv.length} variables.`);
      } catch (err) {
        toast.error(`Saved settings but failed to write .env: ${err instanceof Error ? err.message : err}`);
      }
    } else {
      toast.success('Project settings saved.');
    }
  }

  function updateEnv(idx: number, patch: Partial<EnvVar>) {
    setPEnv(pEnv.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  function addEnv() {
    setPEnv([...pEnv, { key: '', value: '' }]);
  }
  function removeEnv(idx: number) {
    setPEnv(pEnv.filter((_, i) => i !== idx));
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme"
        title="Settings"
      >
        <div className="i-ph:gear text-base" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[560px] max-w-[92vw] max-h-[90vh] overflow-y-auto rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="i-ph:gear text-2xl text-bolt-elements-textPrimary" />
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Settings</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
                <div className="i-ph:x text-lg" />
              </button>
            </div>

            <div className="flex gap-1 px-5 mt-4 border-b border-bolt-elements-borderColor">
              {[
                { id: 'keys' as Tab, label: 'API Keys' },
                ...(isProjectActive ? [{ id: 'project' as Tab, label: 'Project' }] : []),
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                    tab === t.id
                      ? 'border-bolt-elements-item-contentAccent text-bolt-elements-textPrimary'
                      : 'border-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'keys' && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-bolt-elements-textTertiary">
                  Add your own API keys. Models from each provider with a valid key will appear in the model selector. Keys are stored only in your browser.
                </p>
                {PROVIDERS.map((p) => {
                  const count = models[p.id].length;
                  const isLoading = loading[p.id];
                  const hasKey = !!keys[p.id];
                  return (
                    <div key={p.id} className="border border-bolt-elements-borderColor rounded-md p-3 space-y-2 bg-bolt-elements-background-depth-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-bolt-elements-textPrimary">{PROVIDER_LABELS[p.id]}</span>
                          {hasKey && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                count > 0
                                  ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent'
                                  : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary'
                              }`}
                            >
                              {isLoading ? 'loading…' : count > 0 ? `${count} models` : 'no models'}
                            </span>
                          )}
                        </div>
                        <a href={p.helpUrl} target="_blank" rel="noreferrer" className="text-[11px] text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary underline">
                          Get key
                        </a>
                      </div>
                      <p className="text-[11px] text-bolt-elements-textTertiary">{p.helpText}</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={revealed[p.id] ? 'text' : 'password'}
                            value={drafts[p.id]}
                            onChange={(e) => setDrafts({ ...drafts, [p.id]: e.target.value })}
                            placeholder={p.placeholder}
                            className="w-full px-2 py-1.5 pr-8 rounded text-xs bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                          />
                          <button
                            onClick={() => setRevealed({ ...revealed, [p.id]: !revealed[p.id] })}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
                            type="button"
                          >
                            <div className={revealed[p.id] ? 'i-ph:eye-slash text-sm' : 'i-ph:eye text-sm'} />
                          </button>
                        </div>
                        <button
                          onClick={() => saveAndTest(p.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded text-xs bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent disabled:opacity-50"
                        >
                          {isLoading ? '…' : 'Save & Test'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'project' && isProjectActive && (
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 flex items-center justify-center overflow-hidden">
                      {pLogo ? <img src={pLogo} alt="logo" className="w-full h-full object-cover" /> : <div className="i-ph:image text-2xl text-bolt-elements-textTertiary" />}
                    </div>
                    <label className="text-[11px] text-bolt-elements-textTertiary cursor-pointer hover:text-bolt-elements-textPrimary">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                      />
                      Upload logo
                    </label>
                    {pLogo && (
                      <button onClick={() => setPLogo('')} className="text-[11px] text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Project name</label>
                      <input
                        type="text"
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        placeholder="My awesome project"
                        className="w-full px-2 py-1.5 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Description</label>
                      <textarea
                        value={pDesc}
                        onChange={(e) => setPDesc(e.target.value)}
                        rows={3}
                        placeholder="A short description of what you're building"
                        className="w-full px-2 py-1.5 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-bolt-elements-textSecondary">
                      Environment variables ({pEnv.filter((v) => v.key.trim()).length})
                    </label>
                    <button
                      onClick={addEnv}
                      className="text-[11px] px-2 py-1 rounded border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive flex items-center gap-1"
                    >
                      <div className="i-ph:plus text-xs" /> Add
                    </button>
                  </div>
                  <p className="text-[11px] text-bolt-elements-textTertiary mb-2">Saved to a <code>.env</code> file in your workspace on save.</p>
                  <div className="space-y-1.5">
                    {pEnv.length === 0 && <p className="text-[11px] text-bolt-elements-textTertiary italic">No variables yet — click Add.</p>}
                    {pEnv.map((v, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => updateEnv(i, { key: e.target.value.replace(/[^A-Z0-9_]/gi, '_').toUpperCase() })}
                          placeholder="KEY"
                          className="w-1/3 px-2 py-1 rounded text-xs font-mono bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                        />
                        <input
                          type="text"
                          value={v.value}
                          onChange={(e) => updateEnv(i, { value: e.target.value })}
                          placeholder="value"
                          className="flex-1 px-2 py-1 rounded text-xs font-mono bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                        />
                        <button
                          onClick={() => removeEnv(i)}
                          className="px-2 rounded text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor"
                          title="Remove"
                        >
                          <div className="i-ph:trash text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={saveProject}
                    className="px-3 py-1.5 rounded text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent"
                  >
                    Save project
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end px-5 pb-5">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}