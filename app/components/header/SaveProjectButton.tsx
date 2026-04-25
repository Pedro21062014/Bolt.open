import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { projectsStore, activeProjectIdStore } from '~/lib/stores/project';
import { updateActiveProjectSettings } from '~/lib/stores/project';

interface SaveProjectButtonProps {}

export const SaveProjectButton = memo(({}: SaveProjectButtonProps) => {
  const navigate = useNavigate();
  const projects = useStore(projectsStore);
  const activeId = useStore(activeProjectIdStore);
  const currentProject = projects[activeId.get()] || {};

  const handleSave = async () => {
    try {
      // Collect current project settings from the UI (this is a simplified version)
      // In a real app, you'd collect from the SettingsDialog state
      const newSettings = {
        ...currentProject.settings,
        name: currentProject.settings.name || 'Untitled Project',
        description: currentProject.settings.description || '',
        envVars: currentProject.settings.envVars || [],
        github: {
          ...currentProject.settings.github,
          token: currentProject.settings.github.token || '',
          repo: currentProject.settings.github.repo || '',
          branch: currentProject.settings.github.branch || 'main',
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
      className="px-3 py-1.5 rounded text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent"
      title="Save project settings"
    >
      <div className="i-ph:save-duotone" />
      Save
    </button>
  );
}