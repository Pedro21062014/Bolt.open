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
  files: ImportedFile[];
  stats: { totalBlobs: number; imported: number; skipped: number; truncated: boolean };
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (result: ImportResult) => void | Promise<void>;
}

export function GitHubImport({ onImport, trigger }: {
  onImport: (result: ImportResult) => void | Promise<void>;
  trigger?: React.ReactNode;
}) {
  const ghToken = useStore(githubProviderTokenStore);
  const [open, setOpen] = useState(false);
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSource, setImportSource] = useState<'github' | 'zip' | 'folder'>('github');

  async function submit() {
    if (!repo.trim()) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const useToken = (token.trim() || ghToken || '').trim();
      if (useToken) headers['x-github-token'] = useToken;
      
      let endpoint = `/api/github-import?repo=${encodeURIComponent(repo.trim())}`;
      if (importSource === 'folder') {
        endpoint = '/api/folder-import';
      }

      const res = await fetch(endpoint, { headers });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.files?.length) throw new Error('No importable files found in repo/folder.');
      await onImport(data);
      setOpen(false);
      setRepo('');
      setImportSource('github');
      toast.success(`Imported ${data.stats.imported} files`);
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
            onClick={() => setImportSource('zip')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme"
            title="Import ZIP file"
          >
            <div className="i-ph:archive text-base" />
            Import ZIP
          </button>
          <button
            onClick={() => setImportSource('folder')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme"
            title="Import folder from local device"
          >
            <div className="i-ph:folder-open text-base" />
            Import Folder
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
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Import Project</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                Repository {ghToken ? '(your repos auto-loaded)' : 'URL or folder name'}
              </label>
              <GitHubRepoSelect value={repo} onChange={(v) => setRepo(v)} placeholder="vercel/next.js or a folder name" />
            </div>

            {!ghToken && !importSource.startsWith('zip') && (
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
                Cancel              </button>
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

      {importSource === 'zip' && open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[460px] max-w-[92vw] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="i-ph:archive text-2xl text-bolt-elements-textPrimary" />
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Import ZIP File</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                Select ZIP file
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    fetch('/api/import-zip', { method: 'POST', body: formData })
                      .then(r => r.json())
                      .then(result => {
                        importImportResult(result);
                      })
                      .catch(err => toast.error(`Import failed: ${err instanceof Error ? err.message : err}`));
                    setOpen(false);
                  }
                }}
                className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setOpen(false)} disabled={loading} className="px-3 py-1.5 rounded text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {importSource === 'folder' && open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[460px] max-w-[92vw] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="i-ph:folder-open text-2xl text-bolt-elements-textPrimary" />
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Import Folder</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                Select folder from device
              </label>
              <input
                type="file"
                directory
                onChange={async (e) => {
                  const directory = e.data?.directory;
                  if (!directory) return;
                  setLoading(true);
                  try {
                    const files: ImportedFile[] = [];
                    const handleEntry = async (entry: FileSystemDirectoryEntry | FileSystemFileEntry, path = '') => {
                      if (entry.isFile) {
                        const file = await (entry as FileSystemFileEntry).file();
                        if (file.size > 200 * 1024) { skipped++; return; }
                        const content = await file.text();
                        files.push({ path: `${path}${file.name}`, content });
                      } else if (entry.isDirectory) {
                        const dirEntry = entry as FileSystemDirectoryEntry;
                        const dirReader = dirEntry.createReader();
                        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                          dirReader.readEntries(resolve);
                        });
                        for (const child of entries) {
                          await handleEntry(child, `${path}${dirEntry.name}/`);
                        }
                      }
                    };
                    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                      directory.addEventListener('load', () => resolve(directory.items));
                    });
                    for (const entry of entries) {
                      await handleEntry(entry, '');
                    }
                    await onImport({ files, stats: { totalBlobs: entries.length, imported: files.length, skipped: 0, truncated: false } });
                    setOpen(false);
                  } catch (err) {
                    toast.error(`Import failed: ${err instanceof Error ? err.message : err}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setOpen(false)} disabled={loading} className="px-3 py-1.5 rounded text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function importImportResult(result: ImportResult) {
  // Forward the imported result to the parent component
  // This assumes the parent handles the onImport callback
  const event = new CustomEvent('import-result', { detail: result });
  window.dispatchEvent(event);
}