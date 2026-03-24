import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Impulse Guard Prototype</h1>
        <p className="text-gray-600 mb-6 text-lg">
          This is the prototype MVP for Impulse Guard. It includes a Node.js backend and a Chrome Extension.
        </p>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-3">How to install the extension:</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100">
          <li>The extension files are located in the <code>/extension</code> folder of this project.</li>
          <li>Open Google Chrome and navigate to <code>chrome://extensions/</code></li>
          <li>Enable <strong>Developer mode</strong> in the top right corner.</li>
          <li>Click <strong>Load unpacked</strong> and select the <code>/extension</code> folder (you may need to download the project files first).</li>
          <li>Visit any e-commerce site and click a "Buy" or "Checkout" button to see it in action!</li>
        </ol>

        <h2 className="text-xl font-semibold text-gray-800 mb-3">Backend API Status</h2>
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
          The Node.js backend is running and ready to analyze impulse purchases at <code>/api/analyze</code>.
        </div>
      </div>
    </div>
  );
}
