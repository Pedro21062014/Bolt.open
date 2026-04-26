import { useStore } from '@nanostores/react';
import { memo } from 'react';
import { toast } from 'react-toastify';
import { projectsStore, activeProjectIdStore, updateActiveProjectSettings } from '~/lib/stores/project';

interface SaveProjectButtonProps {}

export const SaveProjectButton = memo(({}: SaveProjectButtonProps) => {
  const projects = useStore(projectsStore);
  const activeId = useStore(activeProjectIdStore);
  const currentProject = projects[activeId] || { settings: {} };

  const handleSave = async () => {
    try {
      const newSettings = {
        ...currentProject.settings,
        name: currentProject.settings?.name || 'Untitled Project',
        description: currentProject.settings?.description || '',
        envVars: currentProject.settings?.envVars || [],
        github: {
          token: currentProject.settings?.github?.token || '',
          repo: currentProject.settings?.github?.repo || '',
          branch: currentProject.settings?.github?.branch || 'main',
        },
      };

      await updateActiveProjectSettings(newSettings);
      toast.success('Project settings saved');
    } catch (error) {
      toast.error(`Failed to save: ${error instanceof Error ? error.message : error}`);
    }
  };

  return (
    <button
      onClick={handleSave}
      className="flex items-center justify-center w-8 h-8 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor transition-theme"
      title="Save project settings"
    >
      <div className="i-ph:floppy-disk-duotone text-base" />
    </button>
  );
});