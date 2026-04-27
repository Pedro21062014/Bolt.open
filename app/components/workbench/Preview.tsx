import { useStore } from '@nanostores/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { PortDropdown } from './PortDropdown';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isLandscape, setIsLandscape] = useState(false);
  
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const [url, setUrl] = useState('');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!activePreview) {
      setUrl('');
      setIframeUrl(undefined);
      return;
    }
    setUrl(activePreview.baseUrl);
    setIframeUrl(activePreview.baseUrl);
  }, [activePreview]);

  const reloadPreview = () => {
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
  };

  const openInNewTab = () => {
    if (iframeUrl) window.open(iframeUrl, '_blank');
  };

  const getDeviceStyles = () => {
    if (device === 'mobile') return isLandscape ? 'w-[844px] h-[390px]' : 'w-[390px] h-[844px]';
    if (device === 'tablet') return isLandscape ? 'w-[1024px] h-[768px]' : 'w-[768px] h-[1024px]';
    return 'w-full h-full';
  };

  return (
    <div className="w-full h-full flex flex-col bg-bolt-elements-background-depth-1">
      <div className="bg-bolt-elements-background-depth-2 p-2 flex items-center gap-2 border-b border-bolt-elements-borderColor">
        <IconButton icon="i-ph:arrow-clockwise" onClick={reloadPreview} />
        <IconButton icon="i-ph:arrow-square-out" onClick={openInNewTab} title="Open in new tab" />
        
        <div className="flex items-center gap-1 bg-bolt-elements-background-depth-3 rounded-md p-0.5">
          <IconButton icon="i-ph:monitor" onClick={() => setDevice('desktop')} className={device === 'desktop' ? 'bg-bolt-elements-item-backgroundActive' : ''} />
          <IconButton icon="i-ph:tablet" onClick={() => setDevice('tablet')} className={device === 'tablet' ? 'bg-bolt-elements-item-backgroundActive' : ''} />
          <IconButton icon="i-ph:device-mobile" onClick={() => setDevice('mobile')} className={device === 'mobile' ? 'bg-bolt-elements-item-backgroundActive' : ''} />
        </div>

        {device !== 'desktop' && (
          <IconButton icon="i-ph:arrows-clockwise" onClick={() => setIsLandscape(!isLandscape)} title="Rotate" />
        )}

        <div className="flex-grow" />
        
        {previews.length > 1 && (
          <PortDropdown
            activePreviewIndex={activePreviewIndex}
            setActivePreviewIndex={setActivePreviewIndex}
            isDropdownOpen={isPortDropdownOpen}
            setHasSelectedPreview={(value) => (hasSelectedPreview.current = value)}
            setIsDropdownOpen={setIsPortDropdownOpen}
            previews={previews}
          />
        )}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {activePreview ? (
          <div className={`transition-all duration-300 shadow-2xl border-4 border-bolt-elements-borderColor rounded-lg overflow-hidden ${getDeviceStyles()}`}>
            <iframe ref={iframeRef} className="w-full h-full bg-white" src={iframeUrl} />
          </div>
        ) : (
          <div className="text-bolt-elements-textTertiary">No preview available</div>
        )}
      </div>
    </div>
  );
});