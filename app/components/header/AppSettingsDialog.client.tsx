import { useState } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { activeProjectIdStore, projectsStore, updateActiveProjectSettings } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';

export function AppSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const activeId = useStore(activeProjectIdStore);
  const projects = useStore(projectsStore);
  const project = projects[activeId];
  const [tab, setTab] = useState<'general' | 'env' | 'versions'>('general');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-[700px] h-[500px] bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl shadow-2xl flex overflow-hidden">
        <aside className="w-48 bg-bolt-elements-background-depth-1 border-r border-bolt-elements-borderColor p-4 space-y-2">
          {['general', 'env', 'versions'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          {tab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-bolt-elements-textPrimary">Geral</h2>
              <input defaultValue={project?.name} placeholder="Nome do Projeto" className="w-full p-3 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg" />
              <textarea defaultValue={project?.settings.description} placeholder="Descrição" className="w-full p-3 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg h-32" />
            </div>
          )}
          {tab === 'env' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-bolt-elements-textPrimary">Variáveis de Ambiente</h2>
              <div className="text-xs text-bolt-elements-textTertiary">Adicione chaves de API e segredos aqui.</div>
              {/* Adicionar lógica de lista de env vars */}
            </div>
          )}
          {tab === 'versions' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-bolt-elements-textPrimary">Snapshots</h2>
              <button onClick={() => toast.info('Snapshot salvo!')} className="w-full py-2 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded-lg text-sm font-bold">Criar Snapshot</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}