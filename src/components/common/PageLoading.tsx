import React from 'react';

export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading module data...' }) => {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
          <div className="h-3 w-64 bg-gray-100 rounded-md"></div>
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-28 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-3">
        <div className="h-5 w-36 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg w-full"></div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 pt-2 font-medium">
        {message}
      </div>
    </div>
  );
};
