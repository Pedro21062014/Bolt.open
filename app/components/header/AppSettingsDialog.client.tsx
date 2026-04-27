import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { activeProjectIdStore, projectsStore, updateActiveProjectSettings } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';

interface AppSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AppSettingsDialog({ open, onClose }: AppSettingsDialogProps) {
  const activeId = useStore(activeProjectIdStore);
  const projects = useStore(projectsStore);
  const project = projects[activeId];

  const [tab, setTab] = useState<'general' | 'env' | 'github' | 'versions'>('general');
  const [snapshots, setSnapshots] = useState<{ id: number; name: string; timestamp: string }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`bolt.snapshots.${activeId}`);
    if (saved) setSnapshots(JSON.parse(saved));
  }, [activeId]);

  const saveSnapshot = () => {
    const files = workbenchStore.files.get();
    const snapshot = {
      id: Date.now(),
      name: `Versão ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      files: { ...files }
    };
    const newSnapshots = [...snapshots, { id: snapshot.id, name: snapshot.name, timestamp: snapshot.timestamp }];
    localStorage.setItem(`bolt.snapshots.${activeId}`, JSON.stringify(newSnapshots));
    localStorage.setItem(`bolt.snapshot.data.${snapshot.id}`, JSON.stringify(snapshot.files));
    setSnapshots(newSnapshots);
    toast.success('Snapshot salvo!');
  };

  const restoreSnapshot = (id: number) => {
    const data = localStorage.getItem(`bolt.snapshot.data.${id}`);
    if (data) {
      const files = JSON.parse(data);
      workbenchStore.files.set(files);
      toast.success('Versão restaurada!');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-[500px] bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-xl p-6">
        <div className="flex gap-4 mb-6 border-b border-bolt-elements-borderColor pb-2">
          {['general', 'env', 'github', 'versions'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={`capitalize ${tab === t ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'versions' && (
          <div className="space-y-4">
            <button onClick={saveSnapshot} className="w-full p-2 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded text-sm">Salvar Snapshot Atual</button>
            <div className="space-y-2">
              {snapshots.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 bg-bolt-elements-background-depth-1 rounded">
                  <span className="text-sm">{s.name}</span>
                  <button onClick={() => restoreSnapshot(s.id)} className="text-xs text-bolt-elements-item-contentAccent">Restaurar</button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ... manter abas anteriores ... */}
        
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm">Fechar</button>
        </div>
      </div>
    </div>
  );
}