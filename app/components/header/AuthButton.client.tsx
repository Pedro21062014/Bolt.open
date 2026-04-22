import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { authStore, githubProviderTokenStore, initAuth, signOut, supabaseEnabled } from '~/lib/stores/auth';
import { AuthDialog } from './AuthDialog.client';

let initialized = false;

export function AuthButton() {
  const { user, initialized: authInit } = useStore(authStore);
  const ghToken = useStore(githubProviderTokenStore);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initialized = true;
      initAuth();
    }
  }, []);

  if (!supabaseEnabled) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          disabled={!authInit}
          className="px-3 py-1.5 rounded-md text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent disabled:opacity-50"
        >
          Sign in
        </button>
        <AuthDialog open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  const provider = user.app_metadata?.provider as string | undefined;
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const displayName =
    (user.user_metadata?.user_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    'Account';

  return (
    <div className="relative">
      <button
        onClick={() => setMenu(!menu)}
        className="flex items-center gap-2 px-2 py-1 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive"
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent flex items-center justify-center text-xs font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[120px] truncate">{displayName}</span>
        <div className="i-ph:caret-down text-xs" />
      </button>

      {menu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setMenu(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-lg z-[91] py-1 text-sm">
            <div className="px-3 py-2 border-b border-bolt-elements-borderColor">
              <div className="font-medium text-bolt-elements-textPrimary truncate">{displayName}</div>
              <div className="text-[11px] text-bolt-elements-textTertiary truncate">{user.email}</div>
              {provider && (
                <div className="text-[11px] text-bolt-elements-textTertiary mt-0.5 flex items-center gap-1">
                  <div className={`text-xs ${provider === 'github' ? 'i-ph:github-logo' : provider === 'google' ? 'i-ph:google-logo' : 'i-ph:envelope'}`} />
                  via {provider}
                  {provider === 'github' && ghToken && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent">repo access</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                setMenu(false);
                await signOut();
              }}
              className="w-full text-left px-3 py-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive flex items-center gap-2"
            >
              <div className="i-ph:sign-out text-base" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
