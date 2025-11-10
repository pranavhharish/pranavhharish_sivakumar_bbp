'use client';

import { useState, useEffect } from 'react';
import { RunData } from '@/types';
import { apiClient } from '@/lib/apiClient';

interface RunHistoryProps {
  onRunSelect?: (run: RunData) => void;
  refreshTrigger?: number;
}

export function RunHistory({ onRunSelect, refreshTrigger }: RunHistoryProps) {
  const [runs, setRuns] = useState<RunData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRuns();
  }, [refreshTrigger]);

  const fetchRuns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.listRuns(50, 0);
      if (response.success) {
        setRuns(response.runs);
      } else {
        setError('Failed to load runs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRuns = runs.filter(
    run =>
      run.run_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Run History</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search runs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          {/* Refresh Button */}
          <button
            onClick={fetchRuns}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-leaf text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Runs List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Loading...</p>
              </div>
            )}

            {!isLoading && filteredRuns.length === 0 && !error && (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No runs found</p>
              </div>
            )}

            {filteredRuns.map(run => (
              <button
                key={run.run_id}
                onClick={() => onRunSelect?.(run)}
                className="w-full text-left p-3 rounded border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors"
              >
                <p className="font-semibold text-gray-900 text-sm">{run.run_id}</p>
                <p className="text-gray-600 text-xs">{run.client_name}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(run.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
