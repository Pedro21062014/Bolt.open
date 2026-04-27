import { useStore } from '@nanostores/react';
import { useState, useEffect } from 'react';
import { authStore, signOut, supabaseEnabled } from '~/lib/stores/auth';
import { AuthDialog } from './AuthDialog.client';
import { getSupabaseConfig } from '~/lib/supabase';
import { toast } from 'react-toastify';

interface AppSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AppSettingsDialog({ open, onClose }: AppSettingsDialogProps) {
  const { user, initialized } = useStore(authStore);
  const [authOpen, setAuthOpen] = useState(false);
  
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

  useEffect(() => {
    if (open) {
      const config = getSupabaseConfig();
      setSbUrl(config.url);
      setSbKey(config.key);
    }
  }, [open]);

  const saveSupabaseConfig = () => {
    if (!sbUrl.trim() || !sbKey.trim()) {
      toast.error('Supabase URL and Anon Key are required.');
      return;
    }
    
    localStorage.setItem('bolt.supabase.url', sbUrl.trim());
    localStorage.setItem('bolt.supabase.key', sbKey.trim());
    
    toast.success('Supabase configuration saved. Please refresh to apply changes.');
  };

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
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">App Settings</h2>
          </div>
          <button onClick={onClose} className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
            <div className="i-ph:x text-lg" />
          </button>
        </div>

        <div className="space-y-4">
          <section>
            <h3 className="text-sm font-medium text-bolt-elements-textSecondary mb-3 uppercase tracking-wider">Supabase Configuration</h3>
            <div className="space-y-3 p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
              <div>
                <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Project URL</label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Anon Key</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="your-anon-key"
                  className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                />
              </div>
              <button
                onClick={saveSupabaseConfig}
                className="w-full px-3 py-2 rounded text-sm font-medium bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent hover:brightness-110 transition-all"
              >
                Save Configuration
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-bolt-elements-textSecondary mb-3 uppercase tracking-wider">Cloud Connection</h3>
            <div className="p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <div className="i-ph:database text-emerald-500 text-xl" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-bolt-elements-textPrimary">Supabase Auth</div>
                    <div className="text-xs text-bolt-elements-textTertiary">
                      {user ? `Connected as ${user.email}` : 'Not connected'}
                    </div>
                  </div>
                </div>
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 rounded text-xs font-medium border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-item-contentDanger hover:border-bolt-elements-item-contentDanger transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    disabled={!supabaseEnabled || !initialized}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary hover:brightness-110 transition-all"
          >
            Done
          </button>
        </div>
      </div>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}