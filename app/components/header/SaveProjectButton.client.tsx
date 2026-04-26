import { useStore } from '@nanostores/react';
import { memo, useState } from 'react';
import { toast } from 'react-toastify';
import { projectsStore, activeProjectIdStore, updateActiveProjectSettings } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';

interface SaveProjectButtonProps {}

export const SaveProjectButton = memo(({}: SaveProjectButtonProps) => {
  const projects = useStore(projectsStore);
  const activeId = useStore(activeProjectIdStore);
  const [saving, setSaving] = useState(false);
  
  const currentProject = projects[activeId];

  // Only show if we have an active project that isn't the default one
  if (!activeId || activeId === 'default') {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save project settings
      const newSettings = {
        ...currentProject.settings,
        name: currentProject.name || 'Untitled Project',
        description: currentProject.settings?.description || '',
        envVars: currentProject.settings?.envVars || [],
        github: {
          token: currentProject.settings?.github?.token || '',
          repo: currentProject.settings?.github?.repo || '',
          branch: currentProject.settings?.github?.branch || 'main',
        },
      };

      await updateActiveProjectSettings(newSettings);

      // 2. Save all files in the workspace to Supabase
      await workbenchStore.saveEntireProject();
      
      toast.success('Project and all files saved successfully');
    } catch (error) {
      toast.error(`Failed to save: ${error instanceof Error ? error.message : error}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme disabled:opacity-50"
      title="Save entire project"
    >
      {saving ? (
        <div className="i-svg-spinners:90-ring-with-bg text-base" />
      ) : (
        <div className="i-ph:floppy-disk-duotone text-base" />
      )}
    </button>
  );
});