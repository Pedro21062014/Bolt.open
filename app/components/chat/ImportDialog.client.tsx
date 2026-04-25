import { useState } from 'react';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ImportDialog');

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

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<'zip' | 'folder'>('zip');
  const [folderPath, setFolderPath] = useState('');

  const handleZipImport = async (file: File) => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import-zip', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as ImportResult;
      await onImport(result);
      onClose();
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderImport = async () => {
    if (!folderPath) return;

    setLoading(true);
    try {
      // For folder import, we'll use the File System Access API
      // This is only available in secure contexts (HTTPS or localhost)
      const dirHandle = await (window as any).showDirectoryPicker();

      const files: ImportedFile[] = [];
      const processEntry = async (entry: FileSystemDirectoryEntry | FileSystemFileEntry, path = '') => {
        if (entry.isFile) {
          const file = await (entry as FileSystemFileEntry).file();
          if (file.size > 200 * 1024) { // Skip files larger than 200KB
            return;
          }
          const content = await file.text();
          files.push({ path: `${path}${file.name}`, content });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const dirReader = dirEntry.createReader();
          const entries = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries(resolve);
          });
          for (const childEntry of entries) {
            await processEntry(childEntry, `${path}${dirEntry.name}/`);
          }
        }
      };

      await processEntry(dirHandle);

      const result: ImportResult = {
        files,
        stats: {
          totalBlobs: files.length,
          imported: files.length,
          skipped: 0,
          truncated: false,
        },
      };

      await onImport(result);
      onClose();
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleZipImport(file);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[460px] max-w-[92vw] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Import Project</h2>
          <button onClick={onClose} className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
            <div className="i-ph:x text-lg" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Import Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportType('zip')}
                className={`px-3 py-2 rounded text-sm border ${
                  importType === 'zip'
                    ? 'border-bolt-elements-item-contentAccent text-bolt-elements-item-contentAccent'
                    : 'border-bolt-elements-borderColor text-bolt-elements-textSecondary'
                }`}
              >
                ZIP File
              </button>
              <button
                type="button"
                onClick={() => setImportType('folder')}
                className={`px-3 py-2 rounded text-sm border ${
                  importType === 'folder'
                    ? 'border-bolt-elements-item-contentAccent text-bolt-elements-item-contentAccent'
                    : 'border-bolt-elements-borderColor text-bolt-elements-textSecondary'
                }`}
              >
                Folder
              </button>
            </div>
          </div>

          {importType === 'zip' && (
            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                ZIP File
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-item-contentAccent"
              />
              <p className="text-[11px] text-bolt-elements-textTertiary mt-1">
                Upload a ZIP file containing your project files.
              </p>
            </div>
          )}

          {importType === 'folder' && (
            <div>
              <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                Select Folder
              </label>
              <button
                onClick={handleFolderImport}
                disabled={loading}
                className="w-full px-3 py-2 rounded text-sm bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Select Folder'}
              </button>
              <p className="text-[11px] text-bolt-elements-textTertiary mt-1">
                Select a folder from your computer to import.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 rounded text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}