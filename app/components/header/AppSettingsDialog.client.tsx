import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface AppSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AppSettingsDialog({ open, onClose }: AppSettingsDialogProps) {
  // Como as variáveis são lidas do ambiente, não precisamos mais editar a config via UI
  // Mantemos o estado apenas para exibição se necessário
  const [sbUrl] = useState(import.meta.env.VITE_SUPABASE_URL || 'Configurado via ambiente');
  const [sbKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY ? '********' : 'Não configurado');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[92vw] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="i-ph:sliders-horizontal text-2xl text-bolt-elements-textPrimary" />
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Project Settings</h2>
          </div>
          <button onClick={onClose} className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
            <div className="i-ph:x text-lg" />
          </button>
        </div>

        <section>
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary mb-3 uppercase tracking-wider">Supabase Configuration</h3>
          <div className="space-y-3 p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Project URL</label>
              <input
                type="text"
                value={sbUrl}
                disabled
                className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Anon Key</label>
              <input
                type="text"
                value={sbKey}
                disabled
                className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary opacity-70"
              />
            </div>
            <p className="text-xs text-bolt-elements-textTertiary">
              As configurações do Supabase são gerenciadas via variáveis de ambiente do projeto.
            </p>
          </div>
        </section>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary hover:brightness-110 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}