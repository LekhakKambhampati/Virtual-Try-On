
import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-t-indigo-600 border-r-indigo-600 border-b-indigo-600 border-l-gray-200 rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};
