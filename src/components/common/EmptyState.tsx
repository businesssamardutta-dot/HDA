import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-xs flex flex-col items-center justify-center my-4">
      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center space-x-1.5 bg-[#15803d] hover:bg-[#166534] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
