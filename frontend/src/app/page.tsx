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
      // Normalize response data to match RunWithData interface
      const normalizedData: RunWithData = {
        run_id: data.run_id || runId,
        client_name: data.client_name || '',
        created_at: data.created_at || new Date().toISOString(),
        data: data.data || [],
      };
      setCurrentRun(normalizedData);
      showSuccess(
        'Run Loaded',
        `Successfully loaded run ${runId} with ${normalizedData.data?.length || 0} records`
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
      <header className="bg-leaf shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="text-3xl font-bold text-white">
                Boston Bioprocess: Fermentation Data Platform
              </h1>
              <p className="text-gray-100 text-sm">
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
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin mb-4">
                    <svg
                      className="h-8 w-8 text-primary"
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
                  <span className="text-gray-600 text-lg font-medium">Loading run data...</span>
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
                  className="mx-auto h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No run selected</h3>
                <p className="text-gray-600 mb-6">
                  Upload a CSV file above or select a run from the history to view its data visualization.
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
