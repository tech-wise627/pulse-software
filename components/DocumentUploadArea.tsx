'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash2, File } from 'lucide-react';

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
}

interface DocumentUploadAreaProps {
  onFilesSelected: (files: DocumentFile[]) => void;
  maxFiles?: number;
  acceptedFormats?: string;
}

export default function DocumentUploadArea({ 
  onFilesSelected, 
  maxFiles = 5,
  acceptedFormats = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
}: DocumentUploadAreaProps) {
  const [uploadedFiles, setUploadedFiles] = useState<DocumentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList) => {
    const newFiles: DocumentFile[] = [];
    
    for (let i = 0; i < Math.min(files.length, maxFiles - uploadedFiles.length); i++) {
      const file = files[i];
      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        file: file,
      });
    }

    const combined = [...uploadedFiles, ...newFiles];
    setUploadedFiles(combined);
    onFilesSelected(combined);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const updated = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updated);
    onFilesSelected(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-1">
            Drag and drop documents here or click to select
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Supported formats: PDF, DOC, DOCX, JPG, PNG (Max {maxFiles} files)
          </p>
          <input
            type="file"
            multiple
            accept={acceptedFormats}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            id="document-upload"
          />
          <label htmlFor="document-upload">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <span>Select Files</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
