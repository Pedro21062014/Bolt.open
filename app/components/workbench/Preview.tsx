import { useStore } from '@nanostores/react';
import { memo, useEffect, useRef, useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { PortDropdown } from './PortDropdown';

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  return (
    <div className="w-full h-full flex flex-col bg-bolt-elements-background-depth-1">
      <div className="bg-bolt-elements-background-depth-2 p-2 flex items-center gap-2 border-b border-bolt-elements-borderColor">
        <div className="flex-1 flex items-center bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md px-3 py-1 text-xs text-bolt-elements-textSecondary">
          {activePreview?.baseUrl || 'No preview available'}
        </div>
        {previews.length > 0 && (
          <PortDropdown
            activePreviewIndex={activePreviewIndex}
            setActivePreviewIndex={setActivePreviewIndex}
            isDropdownOpen={isPortDropdownOpen}
            setIsDropdownOpen={setIsPortDropdownOpen}
            setHasSelectedPreview={() => {}}
            previews={previews}
          />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {activePreview ? (
          <iframe ref={iframeRef} className="w-full h-full bg-white" src={activePreview.baseUrl} />
        ) : (
          <div className="flex items-center justify-center h-full text-bolt-elements-textTertiary">No preview available</div>
        )}
      </div>
    </div>
  );
});