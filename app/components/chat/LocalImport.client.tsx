import { useState } from 'react';
import { toast } from 'react-toastify';
import JSZip from 'jszip';

interface LocalImportProps {
  onImport: (files: { path: string; content: string }[]) => void | Promise<void>;
}

export function LocalImport({ onImport }: LocalImportProps) {
  const [loading, setLoading] = useState(false);

  const handleFolderImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    const importedFiles: { path: string; content: string }[] = [];

    try {
      for (const file of Array.from(files)) {
        // Ignorar pastas comuns de sistema/dependências
        if (file.webkitRelativePath.includes('node_modules/') || file.webkitRelativePath.includes('.git/')) continue;
        
        const content = await file.text();
        importedFiles.push({
          path: file.webkitRelativePath,
          content
        });
      }

      if (importedFiles.length > 0) {
        await onImport(importedFiles);
        toast.success(`Imported ${importedFiles.length} files from folder.`);
      }
    } catch (err) {
      toast.error('Failed to import folder');
      console.error(err);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleZipImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const importedFiles: { path: string; content: string }[] = [];

      for (const [path, zipEntry] of Object.entries(contents.files)) {
        if (zipEntry.dir || path.includes('node_modules/') || path.includes('.git/')) continue;
        
        const content = await zipEntry.async('string');
        importedFiles.push({ path, content });
      }

      if (importedFiles.length > 0) {
        await onImport(importedFiles);
        toast.success(`Imported ${importedFiles.length} files from ZIP.`);
      }
    } catch (err) {
      toast.error('Failed to process ZIP file');
      console.error(err);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme cursor-pointer">
        <div className="i-ph:folder-open text-base" />
        {loading ? 'Importing...' : 'Import Folder'}
        <input
          type="file"
          className="hidden"
          webkitdirectory=""
          directory=""
          onChange={handleFolderImport}
          disabled={loading}
        />
      </label>
      <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-theme cursor-pointer">
        <div className="i-ph:file-zip text-base" />
        {loading ? 'Importing...' : 'Import ZIP'}
        <input
          type="file"
          className="hidden"
          accept=".zip"
          onChange={handleZipImport}
          disabled={loading}
        />
      </label>
    </div>
  );
}