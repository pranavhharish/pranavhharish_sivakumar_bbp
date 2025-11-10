'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TimeSeriesData } from '@/types';

// Dynamically import plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading chart...</div>,
});

interface DataVisualizationProps {
  runId: string;
  clientName: string;
  data: TimeSeriesData[];
}

export function DataVisualization({
  runId,
  clientName,
  data,
}: DataVisualizationProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }

    // Group data by parameter
    const groupedData: { [key: string]: TimeSeriesData[] } = {};
    data.forEach(point => {
      if (!groupedData[point.parameter]) {
        groupedData[point.parameter] = [];
      }
      groupedData[point.parameter].push(point);
    });

    // Color scheme as per PRD
    const colorMap: { [key: string]: string } = {
      'pH': '#3B82F6',
      'Temperature': '#EF4444',
      'Glucose': '#F97316',
      'Glycerol': '#F97316',
      'Base': '#10B981',
      'Acid': '#10B981',
    };

    // Determine which parameters use right Y-axis
    const rightAxisParams = ['Temperature'];

    // Create traces
    const traces = Object.entries(groupedData).map(([parameter, values]) => {
      const isRightAxis = rightAxisParams.includes(parameter);

      return {
        x: values.map(v => v.time_stamp),
        y: values.map(v => v.process_value),
        name: parameter,
        type: 'scatter',
        mode: 'lines',
        line: {
          color: colorMap[parameter] || '#3B82F6',
          width: 2,
        },
        hovertemplate: `<b>${parameter}</b><br>Time: %{x}<br>Value: %{y} ${values[0]?.units}<extra></extra>`,
        yaxis: isRightAxis ? 'y2' : 'y',
      };
    });

    setChartData(traces);
  }, [data]);

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(data.length / itemsPerPage);

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Run {runId}
          </h2>
          <p className="text-gray-600">{clientName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTable(false)}
            className={`px-4 py-2 rounded ${
              !showTable
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setShowTable(true)}
            className={`px-4 py-2 rounded ${
              showTable
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => downloadChartAsImage(runId, clientName)}
            className="px-4 py-2 bg-leaf text-white rounded hover:bg-green-600"
          >
            Export PNG
          </button>
        </div>
      </div>

      {!showTable ? (
        <div className="w-full overflow-x-auto">
          {chartData.length > 0 && (
            <div data-plotly-div>
              <Plot
                data={chartData}
                layout={{
                  title: `Run ${runId} - ${clientName}`,
                  hovermode: 'x unified',
                  xaxis: {
                    title: 'Time (seconds)',
                  },
                  yaxis: {
                    title: 'pH / Percentage (%)',
                  },
                  yaxis2: {
                    title: 'Temperature (°C)',
                    overlaying: 'y',
                    side: 'right',
                  },
                  legend: {
                    x: 1.05,
                    y: 1,
                    yanchor: 'top',
                    xanchor: 'left',
                  },
                  margin: { r: 120, t: 80, b: 60, l: 80 },
                } as any}
                config={{ 
                  responsive: true, 
                  displayModeBar: true, 
                  displaylogo: false,
                  toImageButtonOptions: {
                    format: 'png',
                    filename: `fermentation_run_${runId}_${clientName}`,
                    height: 700,
                    width: 1400,
                    scale: 2
                  },
                  modeBarButtonsToAdd: ['toImage'] as any
                }}
                style={{ width: '100%', height: '500px' }}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Time</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Parameter</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Value</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Units</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2">{item.time_stamp.toFixed(3)}</td>
                    <td className="px-4 py-2">{item.parameter}</td>
                    <td className="px-4 py-2">{item.process_value.toFixed(2)}</td>
                    <td className="px-4 py-2">{item.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Previous
              </button>
              <span className="px-3 py-1">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function downloadChartAsImage(runId: string, clientName: string) {
  try {
    // Find the plotly div
    const plotDiv = document.querySelector('.js-plotly-plot') as any;
    
    if (!plotDiv) {
      console.error('Chart element not found');
      alert('Chart not found. Please wait for the chart to load.');
      return;
    }

    // Try to use Plotly's built-in toImage function
    const Plotly = (window as any).Plotly;
    if (Plotly && Plotly.toImage) {
      try {
        const imgData = await Plotly.toImage(plotDiv, {
          format: 'png',
          width: 1400,
          height: 700,
        });
        
        // Create download link
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `fermentation_run_${runId}_${clientName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (plotlyError) {
        console.warn('Plotly toImage failed, trying fallback:', plotlyError);
      }
    }

    // Fallback: Find the canvas element directly
    const canvas = plotDiv.querySelector('canvas.main-svg');
    if (!canvas) {
      console.error('Canvas element not found');
      alert('Unable to export chart. Please try again.');
      return;
    }

    // Convert canvas to blob and download
    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fermentation_run_${runId}_${clientName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Failed to download chart:', error);
    alert('Failed to export chart. Please check the console for details.');
  }
}
