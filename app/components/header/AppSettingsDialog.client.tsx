import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { activeProjectIdStore, projectsStore, updateActiveProjectSettings } from '~/lib/stores/project';

interface AppSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AppSettingsDialog({ open, onClose }: AppSettingsDialogProps) {
  const activeId = useStore(activeProjectIdStore);
  const projects = useStore(projectsStore);
  const project = projects[activeId];

  const [tab, setTab] = useState<'general' | 'env' | 'github'>('general');
  const [name, setName] = useState(project?.name || '');
  const [desc, setDesc] = useState(project?.settings.description || '');
  const [envVars, setEnvVars] = useState(project?.settings.envVars || []);

  const save = async () => {
    await updateActiveProjectSettings({ name, description: desc, envVars });
    toast.success('Configurações salvas!');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-[500px] bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-xl p-6">
        <div className="flex gap-4 mb-6 border-b border-bolt-elements-borderColor pb-2">
          {['general', 'env', 'github'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={`capitalize ${tab === t ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="space-y-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do App" className="w-full p-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded" />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição" className="w-full p-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded" />
          </div>
        )}

        {tab === 'env' && (
          <div className="space-y-2">
            {envVars.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input value={v.key} onChange={e => { const n = [...envVars]; n[i].key = e.target.value; setEnvVars(n); }} placeholder="KEY" className="w-1/2 p-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded" />
                <input value={v.value} onChange={e => { const n = [...envVars]; n[i].value = e.target.value; setEnvVars(n); }} placeholder="VALUE" className="w-1/2 p-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded" />
              </div>
            ))}
            <button onClick={() => setEnvVars([...envVars, { key: '', value: '' }])} className="text-xs text-bolt-elements-item-contentAccent">+ Adicionar Variável</button>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm">Cancelar</button>
          <button onClick={save} className="px-4 py-2 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded">Salvar</button>
        </div>
      </div>
    </div>
  );
}