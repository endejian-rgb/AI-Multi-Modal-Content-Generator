
import React from 'react';

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-white/50 rounded-lg">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
    <p className="mt-4 text-lg font-semibold text-gray-700">Generating Content...</p>
    <p className="text-sm text-gray-500">The AI is thinking. This may take a moment.</p>
  </div>
);

export default Loader;
