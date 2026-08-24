import React from 'react';
import { Upload, Download, FileSpreadsheet, Plus } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  sectionKey: string;
  onOpenBulkModal: (sectionKey: string) => void;
  onExportCSV?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionIcon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  sectionKey,
  onOpenBulkModal,
  onExportCSV,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionIcon
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <span>{title}</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk Upload CSV Button */}
        <button
          onClick={() => onOpenBulkModal(sectionKey)}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
          title={`Bulk Upload & Sample Templates for ${title}`}
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bulk Upload / CSV</span>
        </button>

        {/* Export CSV Button */}
        <button
          onClick={() => {
            if (onExportCSV) {
              onExportCSV();
            } else {
              onOpenBulkModal(sectionKey);
            }
          }}
          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
          title={`Export ${title} data to CSV file`}
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          <span>Export CSV</span>
        </button>

        {/* Sample Data Download Button */}
        <button
          onClick={() => onOpenBulkModal(sectionKey)}
          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg text-xs flex items-center space-x-1 transition-all shadow-2xs cursor-pointer"
          title="View & Copy Sample Data"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Sample CSV</span>
        </button>

        {/* Primary Add/Action Button */}
        {primaryActionLabel && onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            {primaryActionIcon || <Plus className="w-3.5 h-3.5" />}
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
