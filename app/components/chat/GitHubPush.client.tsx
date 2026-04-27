import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { githubProviderTokenStore } from '~/lib/stores/auth';
import {
  activeProjectIdStore,
  getActiveProject,
  projectsStore,
  updateActiveProjectSettings,
} from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';
import { GitHubRepoSelect } from './GitHubRepoSelect.client';

export function GitHubPush({ trigger }: { trigger?: React.ReactNode }) {
  useStore(activeProjectIdStore);
  useStore(projectsStore);
  const project = getActiveProject();
  const files = useStore(workbenchStore.files);
  const ghToken = useStore(githubProviderTokenStore);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(project.settings.github.token);
  const [repo, setRepo] = useState(project.settings.github.repo);
  const [branch, setBranch] = useState(project.settings.github.branch || 'main');
  const [message, setMessage] = useState('Sync from Bolt');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);

  function collectFiles() {
    const out: { path: string; content: string }[] = [];
    for (const [fullPath, file] of Object.entries(files)) {
      if (!file || file.type !== 'file' || file.isBinary) continue;
      // Only skip .git folder
      if (fullPath.startsWith('/.git/')) continue;
      const rel = fullPath.replace(/^\/+/, '');
      if (!rel) continue;
      out.push({ path: rel, content: file.content });
    }
    return out;
  }

  async function submit() {
    const useToken = (token.trim() || ghToken || '').trim();
    if (!useToken || !repo.trim()) {
      toast.error('Token and repository are required.');
      return;
    }
    const collected = collectFiles();
    if (collected.length === 0) {
      toast.error('Nothing to push — workspace is empty.');
      return;
    }

    setLoading(true);
    try {
      await workbenchStore.saveAllFiles();
      updateActiveProjectSettings({ github: { token: token.trim(), repo: repo.trim(), branch: branch.trim() || 'main' } });

      const res = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: useToken,
          repo: repo.trim(),
          branch: branch.trim() || 'main',
          message: message.trim() || 'Sync from Bolt',
          files: collected,
          createIfMissing: true,
          private: isPrivate,
        }),
      });
      const data = (await res.json()) as { error?: string; url?: string; pushed?: number; commit?: string };
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(`Pushed ${data.pushed} files to ${repo}`);
      if (data.url) window.open(data.url, '_blank', 'noopener');
      setOpen(false);
    } catch (err) {
      toast.error(`Push failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Push to GitHub"
          className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme"
        >
          <div className="i-ph:git-branch text-base" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => !loading && setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] max-w-[92vw] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Push to GitHub</h2>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
              className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor"
            />
            <label className="flex items-center gap-2 text-xs text-bolt-elements-textSecondary cursor-pointer">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              Create as private if missing
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded text-sm">Cancel</button>
              <button onClick={submit} disabled={loading} className="px-3 py-1.5 rounded text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent">
                {loading ? 'Pushing...' : 'Push'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}