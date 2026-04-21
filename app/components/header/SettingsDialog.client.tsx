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
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<ProviderId, string>>(keys);
  const [revealed, setRevealed] = useState<Record<ProviderId, boolean>>({
    anthropic: false,
    openrouter: false,
    google: false,
  });

  useEffect(() => {
    if (open) setDrafts(keys);
  }, [open, keys]);

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme"
        title="API key settings"
      >
        <div className="i-ph:gear text-base" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[520px] max-w-[92vw] max-h-[90vh] overflow-y-auto rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="i-ph:gear text-2xl text-bolt-elements-textPrimary" />
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">API Keys</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
                <div className="i-ph:x text-lg" />
              </button>
            </div>

            <p className="text-xs text-bolt-elements-textTertiary">
              Add your own API keys. Models from each provider with a valid key will appear in the model selector.
              Keys are stored only in your browser.
            </p>

            <div className="space-y-4">
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
                      <a
                        href={p.helpUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary underline"
                      >
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
                          title={revealed[p.id] ? 'Hide' : 'Show'}
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

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
