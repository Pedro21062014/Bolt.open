import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { AuthButton } from './AuthButton.client';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { SettingsDialog } from './SettingsDialog.client';
import { AppSettingsDialog } from './AppSettingsDialog.client';
import { GitHubPush } from '~/components/chat/GitHubPush.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { SaveProjectButton } from './SaveProjectButton.client';

export function Header() {
  const chat = useStore(chatStore);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [deployMenu, setDeployMenu] = useState(false);
  const [deployModal, setDeployModal] = useState(false);

  return (
    <header className="flex items-center justify-between bg-bolt-elements-background-depth-1 p-5 border-b h-[var(--header-height)] border-bolt-elements-borderColor">
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <span className="i-bolt:logo-text?mask w-[46px] inline-block" />
        </a>
      </div>
      <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </span>
      <div className="flex items-center gap-2 shrink-0 relative z-[50]">
        <ClientOnly>
          {() => (
            <>
              {chat.started && (
                <>
                  <div className="relative">
                    <button onClick={() => setDeployMenu(!deployMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium shadow-sm">
                      <div className="i-ph:rocket-launch-duotone" /> Deploy
                    </button>
                    {deployMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md shadow-lg py-1">
                        <button onClick={() => { setDeployModal(true); setDeployMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-bolt-elements-item-backgroundActive">Netlify</button>
                      </div>
                    )}
                  </div>
                  <SaveProjectButton />
                  <GitHubPush />
                  <button onClick={() => setAppSettingsOpen(true)} className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme">
                    <div className="i-ph:sliders-horizontal text-base" />
                  </button>
                  <AppSettingsDialog open={appSettingsOpen} onClose={() => setAppSettingsOpen(false)} />
                </>
              )}
              <SettingsDialog />
              <AuthButton />
              <HeaderActionButtons />
            </>
          )}
        </ClientOnly>
      </div>

      {deployModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={() => setDeployModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-bolt-elements-background-depth-2 p-6 rounded-lg border border-bolt-elements-borderColor w-[400px]">
            <h2 className="text-lg font-bold mb-4">Deploy para Netlify</h2>
            <p className="text-sm text-bolt-elements-textSecondary mb-4">Conecte sua conta Netlify para iniciar o deploy automático do seu projeto.</p>
            <button className="w-full py-2 bg-blue-600 text-white rounded">Conectar Netlify</button>
          </div>
        </div>
      )}
    </header>
  );
}