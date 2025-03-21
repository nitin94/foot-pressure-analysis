import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { processFootImage } from '../utils/imageProcessing';
import type { FootAnalysis } from '../types';

export default function FootAnalyzer() {
  const [leftFoot, setLeftFoot] = useState<FootAnalysis | null>(null);
  const [rightFoot, setRightFoot] = useState<FootAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const originalImageUrl = URL.createObjectURL(file);
      const { heatmapUrl, stats } = await processFootImage(file);
      
      const analysis: FootAnalysis = {
        originalImage: originalImageUrl,
        heatmapImage: heatmapUrl,
        stats,
      };

      if (side === 'left') {
        setLeftFoot(analysis);
      } else {
        setRightFoot(analysis);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    }
    setLoading(false);
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Foot Pressure Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Upload foot pressure images to generate pressure map analysis
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Foot */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Left Foot</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'left')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {leftFoot && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Original</h3>
                    <img
                      src={leftFoot.originalImage}
                      alt="Left foot original"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Pressure Map</h3>
                    <img
                      src={leftFoot.heatmapImage}
                      alt="Left foot pressure map"
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={() => downloadImage(leftFoot.heatmapImage, 'left-foot-pressure-map.png')}
                      className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Map
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Statistics</h3>
                  <dl className="grid grid-cols-3 gap-4">
                    <div>
                      <dt className="text-xs text-gray-500">Average Pressure</dt>
                      <dd className="text-sm font-medium">{leftFoot.stats.averagePressure.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Max Pressure</dt>
                      <dd className="text-sm font-medium">{leftFoot.stats.maxPressure}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Total Area (px)</dt>
                      <dd className="text-sm font-medium">{leftFoot.stats.totalArea}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Right Foot */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Right Foot</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'right')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {rightFoot && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Original</h3>
                    <img
                      src={rightFoot.originalImage}
                      alt="Right foot original"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Pressure Map</h3>
                    <img
                      src={rightFoot.heatmapImage}
                      alt="Right foot pressure map"
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={() => downloadImage(rightFoot.heatmapImage, 'right-foot-pressure-map.png')}
                      className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Map
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Statistics</h3>
                  <dl className="grid grid-cols-3 gap-4">
                    <div>
                      <dt className="text-xs text-gray-500">Average Pressure</dt>
                      <dd className="text-sm font-medium">{rightFoot.stats.averagePressure.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Max Pressure</dt>
                      <dd className="text-sm font-medium">{rightFoot.stats.maxPressure}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Total Area (px)</dt>
                      <dd className="text-sm font-medium">{rightFoot.stats.totalArea}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-lg">Processing image...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}