import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { githubProviderTokenStore } from '~/lib/stores/auth';
import { activeProjectIdStore, getActiveProject, updateActiveProjectSettings } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';

export function GitHubPush({ trigger }: { trigger?: React.ReactNode }) {
  const project = getActiveProject();
  const files = useStore(workbenchStore.files);
  const ghToken = useStore(githubProviderTokenStore);
  const [open, setOpen] = useState(false);
  const [repo, setRepo] = useState(project.settings.github.repo);
  const [branch, setBranch] = useState(project.settings.github.branch || 'main');
  const [message, setMessage] = useState('Sync from Bolt');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const useToken = (ghToken || '').trim();
    if (!useToken || !repo.trim()) {
      toast.error('Token GitHub ou Repositório não configurados.');
      return;
    }

    setLoading(true);
    try {
      await workbenchStore.saveAllFiles();
      updateActiveProjectSettings({ github: { token: useToken, repo: repo.trim(), branch: branch.trim() } });

      const res = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: useToken,
          repo: repo.trim(),
          branch: branch.trim(),
          message,
          files: Object.entries(files)
            .filter(([_, f]) => f?.type === 'file' && !f.isBinary)
            .map(([path, f]) => ({ path: path.replace(/^\/+/, ''), content: (f as any).content })),
        }),
      });

      if (!res.ok) throw new Error('Falha ao realizar push');
      toast.success('Código enviado ao GitHub com sucesso!');
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme">
        <div className="i-ph:git-branch text-base" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="w-[450px] bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-bolt-elements-textPrimary">Push para GitHub</h2>
            
            <div className="space-y-3">
              <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="usuario/repositorio" className="w-full p-2.5 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg text-sm" />
              <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="branch (ex: main)" className="w-full p-2.5 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg text-sm" />
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Mensagem do commit" className="w-full p-2.5 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg text-sm" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-bolt-elements-textSecondary">Cancelar</button>
              <button onClick={submit} disabled={loading} className="px-4 py-2 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded-lg text-sm font-bold">
                {loading ? 'Enviando...' : 'Confirmar Push'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}