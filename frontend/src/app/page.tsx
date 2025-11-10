'use client';

import { useState } from 'react';
import { UploadForm } from '@/components/UploadForm';
import { DataVisualization } from '@/components/DataVisualization';
import { RunHistory } from '@/components/RunHistory';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';
import { RunData, RunWithData } from '@/types';

export default function Home() {
  const [currentRun, setCurrentRun] = useState<RunWithData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();

  const handleUploadSuccess = (runId: string, _clientName: string) => {
    // Trigger run history refresh
    setRefreshTrigger(prev => prev + 1);

    // Optionally load the newly uploaded run
    loadRun(runId);
  };

  const handleRunSelect = async (run: RunData) => {
    await loadRun(run.run_id);
  };

  const loadRun = async (runId: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.getRunData(runId);
      setCurrentRun(data as RunWithData);
      showSuccess(
        'Run Loaded',
        `Successfully loaded run ${runId} with ${data.data?.length || 0} records`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load run';
      showError('Load Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Fermentation Data Platform
              </h1>
              <p className="text-gray-600 text-sm">
                Upload, store, and visualize fermentation run data
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - History */}
          <div className="lg:col-span-1">
            <RunHistory
              onRunSelect={handleRunSelect}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Section */}
            <section>
              <UploadForm onUploadSuccess={handleUploadSuccess} />
            </section>

            {/* Visualization Section */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  <span className="text-gray-600">Loading run data...</span>
                </div>
              </div>
            )}

            {currentRun && !isLoading && (
              <section>
                <DataVisualization
                  runId={currentRun.run_id}
                  clientName={currentRun.client_name}
                  data={currentRun.data}
                />
              </section>
            )}

            {!currentRun && !isLoading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No Run Selected
                </h3>
                <p className="mt-2 text-gray-600">
                  Upload a CSV file or select a previous run from the history to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
