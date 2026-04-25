import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { githubProviderTokenStore } from '~/lib/stores/auth';
import { GitHubRepoSelect } from './GitHubRepoSelect.client';
import { ImportDialog } from './ImportDialog.client';

interface ImportedFile {
  path: string;
  content: string;
}

interface ImportResult {
  owner: string;
  repo: string;
  ref: string;
  files: ImportedFile[];
  stats: { totalBlobs: number; imported: number; skipped: number; truncated: boolean };
}

interface GitHubImportProps {
  onImport: (result: ImportResult) => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function GitHubImport({ onImport, trigger }: GitHubImportProps) {
  const ghToken = useStore(githubProviderTokenStore);
  const [open, setOpen] = useState(false);
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  async function submit() {
    if (!repo.trim()) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const useToken = (token.trim() || ghToken || '').trim();
      if (useToken) headers['x-github-token'] = useToken;
      const res = await fetch(`/api/github-import?repo=${encodeURIComponent(repo.trim())}`, { headers });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.files?.length) throw new Error('No importable files found in repo.');
      await onImport(data);
      setOpen(false);
      setRepo('');
      toast.success(`Imported ${data.stats.imported} files from ${data.owner}/${data.repo}`);
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme"
          >
            <div className="i-ph:github-logo text-base" />
            Import from GitHub
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme"
          >
            <div className="i-ph:folder-open text-base" />
            Import Local
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => !loading && setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[460px] max-w-[92vw] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="i-ph:github-logo text-2xl text-bolt-elements-textPrimary" />
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Import from GitHub</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                Repository {ghToken ? '(your repos auto-loaded)' : 'URL or owner/name'}
              </label>
              <GitHubRepoSelect value={repo} onChange={(v) => setRepo(v)} placeholder="vercel/next.js or https://github.com/vercel/next.js" />
            </div>

            {!ghToken && (
              <div>
                <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                  GitHub token (optional, for private repos / higher rate limit)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
                />
                <p className="text-[11px] text-bolt-elements-textTertiary mt-1">
                  Tip: sign in with GitHub to skip this and pick from your repos.
                </p>
              </div>
            )}

            <p className="text-[11px] text-bolt-elements-textTertiary">
              Imports up to 250 text files (≤200KB each). Binaries, node_modules, build folders are skipped.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-3 py-1.5 rounded text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading || !repo.trim()}
                className="px-3 py-1.5 rounded text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent disabled:opacity-50"
              >
                {loading ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={async (result) => {
          await onImport({
            owner: 'local',
            repo: 'local',
            ref: 'main',
            files: result.files,
            stats: result.stats,
          });
          setShowImportDialog(false);
        }}
      />
    </>
  );
}