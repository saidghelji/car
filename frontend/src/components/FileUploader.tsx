import { useState, useRef } from 'react';
import { Upload, Maximize2, X, FileText, Trash2 } from 'lucide-react';
import CloseButton from './CloseButton'; // Assuming CloseButton is in the same components directory

export interface Document {
  name: string;
  type: string;
  size: number;
  url: string;
  isNew?: boolean; // To differentiate between newly uploaded files and existing ones
}

interface FilePreviewProps {
  file: Document;
  api_url: string;
  onRemove?: (file: Document) => void;
}

export const FilePreview = ({ file, api_url, onRemove }: FilePreviewProps) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const serverBaseUrl = new URL(api_url).origin;
  let fileUrl = file.url;

  // For new files (blob: or data: URLs), use them directly
  if (file.url?.startsWith('blob:') || file.url?.startsWith('data:')) {
    fileUrl = file.url;
  } else {
    // For existing files from the backend, construct the correct URL
    // The file.url from backend is like "C:/Users/yassi/Documents/car/project/backend/uploads/filename.pdf"
    // We need it to be "http://localhost:5000/uploads/filename.pdf"

    // Extract the filename from the full path
    const filename = file.url.split(/[\\/]/).pop(); // Handles both / and \ path separators
    if (filename) {
      fileUrl = `${serverBaseUrl}/uploads/${filename}`;
    } else {
      // Fallback if filename extraction fails
      fileUrl = `${serverBaseUrl}/${file.url.replace(/\\/g, '/')}`;
    }
  }

  const getFileIcon = () => {
    const fileExtension = file.name?.split('.').pop()?.toLowerCase();
    const isImage = file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPdf = file.type === 'application/pdf' || fileExtension === 'pdf';

    if (isImage) {
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
            <img src={fileUrl} alt={file.name} className="max-h-full max-w-full object-cover" />
          </div>
        </div>
      );
    } else if (isPdf) {
      return <FileText size={16} className="mr-2 text-red-500" />;
    } else {
      return <FileText size={16} className="mr-2 text-blue-500" />;
    }
  };

  const renderPreview = () => {
    const fileExtension = file.name?.split('.').pop()?.toLowerCase();
    const isImage = file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPdf = file.type === 'application/pdf' || fileExtension === 'pdf';

    if (isImage) {
      return (
        <div className="flex flex-col items-center">
          <img
            src={fileUrl}
            alt={file.name}
            className="max-h-[70vh] max-w-full object-contain shadow-lg rounded"
          />
        </div>
      );
    } else if (isPdf) {
      return (
        <div className="w-full h-[70vh] flex flex-col">
          <iframe
            src={fileUrl}
            className="w-full flex-grow border rounded shadow-lg"
            title={file.name}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-lg font-medium">{file.name}</p>
          <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
            L'aperçu n'est pas disponible pour ce type de fichier.
          </p>
        </div>
      );
    }
  };

  return (
    <>
      <div
        className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
        onClick={() => setShowPreviewModal(true)}
      >
        {getFileIcon()}
        <span className="text-sm flex-grow">{file.name}</span>
        <Maximize2 size={14} className="ml-2 text-gray-500" />
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(file);
            }}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col relative">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">{file.name}</h3>
              <CloseButton onClick={() => setShowPreviewModal(false)} />
            </div>
            <div className="flex-grow overflow-auto p-4 flex items-center justify-center">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface FileUploaderProps {
  api_url: string;
  existingDocuments: Document[];
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  onRemoveExistingDocument: (doc: Document) => Promise<void>;
  label?: string;
  readOnly?: boolean;
  multiple?: boolean; // Add multiple prop
}

const FileUploader = ({
  api_url,
  existingDocuments,
  newFiles,
  onNewFilesChange,
  onRemoveExistingDocument,
  label = "Documents",
  readOnly = false,
  multiple = true // Default to true for existing usages
}: FileUploaderProps) => {
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // If multiple is false, only take the first file
      onNewFilesChange(multiple ? [...newFiles, ...files] : files.slice(0, 1));
    }
  };

  const handleRemoveNewFile = (fileToRemove: File) => {
    onNewFilesChange(newFiles.filter(file => file !== fileToRemove));
  };

  const allDocuments = multiple
    ? [
        ...existingDocuments.map(doc => ({ ...doc, isNew: false, _file: null })),
        ...newFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          isNew: true,
          _file: file
        }))
      ]
    : (newFiles.length > 0
      ? newFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          isNew: true,
          _file: file
        }))
      : existingDocuments.map(doc => ({ ...doc, isNew: false, _file: null }))
    );

  return (
    <section className="pb-4">
      {label && <h3 className="font-semibold mb-3">{label}</h3>}
      {!readOnly && (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="attachment-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Télécharger des fichiers</span>
                <input id="attachment-upload" name="documents" type="file" multiple className="sr-only" onChange={handleAttachmentChange} ref={attachmentInputRef} />
              </label>
              <p className="pl-1">ou glisser-déposer</p>
            </div>
            <p className="text-xs text-gray-500">Tous types de fichiers</p>
          </div>
        </div>
      )}
      {allDocuments.length > 0 && (
        <div className="space-y-2 mt-4">
          {allDocuments.map((doc, index) => (
            <div key={`${doc.url}-${index}`} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
              <FilePreview
                file={doc}
                api_url={api_url}
                onRemove={!readOnly ? () => {
                  if (doc.isNew && doc._file) {
                    handleRemoveNewFile(doc._file);
                  } else if (!doc.isNew) {
                    onRemoveExistingDocument(doc);
                  }
                } : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FileUploader;
