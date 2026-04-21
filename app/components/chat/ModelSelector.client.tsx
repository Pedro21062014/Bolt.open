import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { IconButton } from '~/components/ui/IconButton';
import {
  llmStore,
  setApiKey,
  setModel,
  setProvider,
  type ProviderId,
} from '~/lib/stores/llm';

interface ModelInfo {
  id: string;
  label: string;
}

const PROVIDERS: { id: ProviderId; label: string; placeholder: string; helpUrl: string }[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    placeholder: 'sk-or-...',
    helpUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'google',
    label: 'Google Gemini',
    placeholder: 'AIza... (Gemini API key)',
    helpUrl: 'https://aistudio.google.com/app/apikey',
  },
];

export function ModelSelector() {
  const state = useStore(llmStore);
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const providerInfo = PROVIDERS.find((p) => p.id === state.provider)!;
  const currentKey = state.keys[state.provider] || '';

  async function loadModels(provider: ProviderId, key: string) {
    if (!key) {
      setModels([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/models?provider=${provider}`, {
        headers: { 'x-api-key': key },
      });
      const data = (await res.json()) as { models?: ModelInfo[]; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setModels(data.models ?? []);
      if (data.models && data.models.length > 0) {
        const stillThere = data.models.find((m) => m.id === llmStore.get().model);
        if (!stillThere) setModel(data.models[0].id);
      }
    } catch (err) {
      toast.error(`Could not load models: ${err instanceof Error ? err.message : err}`);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModels(state.provider, currentKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.provider, currentKey]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme border border-bolt-elements-borderColor"
        title="Select provider and model"
      >
        <div className="i-ph:cpu text-base" />
        <span className="font-medium">{providerInfo.label}</span>
        <span className="opacity-60">/</span>
        <span className="truncate max-w-[180px]">{state.model || 'no model'}</span>
        <div className={`i-ph:caret-down text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-[360px] z-50 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-lg p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Provider</label>
            <div className="flex gap-1">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs border transition-theme ${
                    state.provider === p.id
                      ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border-bolt-elements-item-contentAccent'
                      : 'border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-bolt-elements-textSecondary">
                {providerInfo.label} API Key
              </label>
              <a
                href={providerInfo.helpUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary underline"
              >
                Get key
              </a>
            </div>
            <input
              type="password"
              value={currentKey}
              onChange={(e) => setApiKey(state.provider, e.target.value)}
              placeholder={providerInfo.placeholder}
              className="w-full px-2 py-1.5 rounded text-xs bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
            />
            <p className="mt-1 text-[10px] text-bolt-elements-textTertiary">
              Stored locally in your browser. Sent only to the server for each request.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-bolt-elements-textSecondary">Model</label>
              <button
                onClick={() => loadModels(state.provider, currentKey)}
                disabled={!currentKey || loading}
                className="text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {models.length > 0 ? (
              <select
                value={state.model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-2 py-1.5 rounded text-xs bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={state.model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={currentKey ? 'Enter a model id' : 'Add an API key to load models'}
                className="w-full px-2 py-1.5 rounded text-xs bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
              />
            )}
          </div>

          <div className="flex justify-end pt-1">
            <IconButton onClick={() => setOpen(false)} title="Close">
              <span className="text-xs px-2">Done</span>
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
