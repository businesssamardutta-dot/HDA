import React, { useState, useEffect } from 'react';

export const Toast = ({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white font-medium ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      {message}
    </div>
  );
};
