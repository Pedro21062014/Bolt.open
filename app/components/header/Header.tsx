import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { AuthButton } from './AuthButton.client';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ModelPicker } from './ModelPicker.client';
import { SettingsDialog } from './SettingsDialog.client';
import { GitHubPush } from '~/components/chat/GitHubPush.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { workbenchStore } from '~/lib/stores/workbench';
import { toast } from 'react-toastify';

export function Header() {
  const chat = useStore(chatStore);

  const handleSaveAll = async () => {
    try {
      await workbenchStore.saveAllFiles();
      toast.success('Project and files saved successfully!');
    } catch (err) {
      toast.error('Failed to save project');
    }
  };

  return (
    <header
      className={classNames(
        'flex items-center justify-between bg-bolt-elements-background-depth-1 p-5 border-b h-[var(--header-height)]',
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
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
              <ModelPicker />
              {chat.started && (
                <button
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent hover:brightness-110 transition-all"
                  title="Save all files and settings"
                >
                  <div className="i-ph:floppy-disk-bold" />
                  <span className="hidden md:inline">Save App</span>
                </button>
              )}
              {chat.started && <GitHubPush />}
              <SettingsDialog />
              <AuthButton />
              {chat.started && <HeaderActionButtons />}
            </>
          )}
        </ClientOnly>
      </div>
    </header>
  );
}