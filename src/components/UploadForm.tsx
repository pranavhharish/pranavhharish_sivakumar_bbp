'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { validateFile, parseCSVFile } from '@/lib/csvParser';
import { useToast } from '@/hooks/useToast';

interface UploadFormProps {
  onUploadSuccess?: (runId: string, clientName: string) => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pump1, setPump1] = useState('');
  const [pump2, setPump2] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  const isFormValid = file && pump1 && pump2;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      showError('Validation Failed', validation.error || 'Invalid file');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !pump1 || !pump2) {
      showError('Form Error', 'Please fill all fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate CSV file structure on client-side
      await parseCSVFile(file, pump1, pump2);

      // Simulate progress
      setUploadProgress(50);

      // Upload to API
      const response = await apiClient.uploadFile(file, pump1, pump2);

      if (!response.success) {
        throw new Error(response.error || 'Upload failed');
      }

      setUploadProgress(100);

      // Success
      success(
        'Upload Successful',
        `Run ${response.runId} uploaded with ${response.recordsInserted} records`
      );

      // Reset form
      setFile(null);
      setPump1('');
      setPump2('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent
      if (onUploadSuccess) {
        onUploadSuccess(response.runId, response.clientName);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      showError('Upload Error', message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Fermentation Data</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Drop Area */}
        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V16z"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 20h40M24 4v16M16 12l8 8 8-8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {file ? (
            <div>
              <p className="text-lg font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Change File
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-900 font-medium">
                Drag and drop your CSV file here
              </p>
              <p className="text-gray-500 text-sm mt-1">
                or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-gray-400 text-xs mt-2">
                CSV files up to 10MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Pump Selections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pump1" className="block text-sm font-medium text-gray-700 mb-2">
              Pump1 Parameter <span className="text-red-600">*</span>
            </label>
            <select
              id="pump1"
              value={pump1}
              onChange={(e) => setPump1(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select parameter</option>
              <option value="Glucose">Glucose</option>
              <option value="Glycerol">Glycerol</option>
            </select>
          </div>

          <div>
            <label htmlFor="pump2" className="block text-sm font-medium text-gray-700 mb-2">
              Pump2 Parameter <span className="text-red-600">*</span>
            </label>
            <select
              id="pump2"
              value={pump2}
              onChange={(e) => setPump2(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select parameter</option>
              <option value="Base">Base</option>
              <option value="Acid">Acid</option>
            </select>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Uploading and processing...
              </span>
              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload and Process'}
        </button>
      </form>
    </div>
  );
}
