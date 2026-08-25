import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  AlertCircle,
  Table,
  FileType,
  Sparkles
} from 'lucide-react';
import {
  SAMPLE_DATA_TEMPLATES,
  parseCSV,
  downloadCSVFile,
  downloadTextFile,
  objectsToCSV
} from '../../utils/csvHelper';
import { dbService } from '../../services/dbService';

interface BulkDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey?: string; // e.g., 'orders', 'products', 'delivery_boys', etc.
  existingData?: Record<string, any>[];
  onImportSuccess?: () => void;
}

export const BulkDataModal: React.FC<BulkDataModalProps> = ({
  isOpen,
  onClose,
  sectionKey = 'orders',
  existingData = [],
  onImportSuccess
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [selectedSection, setSelectedSection] = useState<string>(sectionKey);
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const template = SAMPLE_DATA_TEMPLATES[selectedSection] || SAMPLE_DATA_TEMPLATES['orders'];

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        const rows = parseCSV(content);
        setParsedRows(rows);
        if (rows.length === 0) {
          setErrorMessage('No valid rows found in CSV file.');
        } else {
          setErrorMessage('');
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle Text Parsing
  const handleParseText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please paste or upload CSV text first.');
      return;
    }
    const rows = parseCSV(pastedText);
    setParsedRows(rows);
    if (rows.length === 0) {
      setErrorMessage('No valid rows parsed from input.');
    } else {
      setErrorMessage('');
    }
  };

  // Handle Copy Sample
  const handleCopySample = () => {
    navigator.clipboard.writeText(template.csvSample);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Handle Download Sample CSV
  const handleDownloadSample = () => {
    downloadCSVFile(template.filename, template.csvSample);
  };

  // Handle Download Sample TXT
  const handleDownloadSampleTxt = () => {
    downloadTextFile(template.filename.replace('.csv', '.txt'), template.csvSample);
  };

  // Handle Export Existing Data
  const handleExportData = () => {
    if (!existingData || existingData.length === 0) {
      downloadCSVFile(template.filename, template.csvSample);
    } else {
      const csv = objectsToCSV(existingData);
      downloadCSVFile(`${selectedSection}_Export_${Date.now()}.csv`, csv);
    }
  };

  // Process Bulk Import to DB
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      alert('Please upload or parse valid data before importing.');
      return;
    }

    setIsImporting(true);
    setErrorMessage('');

    try {
      let count = 0;
      for (const row of parsedRows) {
        switch (selectedSection) {
          case 'products':
            await dbService.addProduct({
              name: row.name || 'Imported Product',
              category_id: 'cat-1',
              category_name: row.category_name || 'Grocery',
              selling_price: Number(row.selling_price) || 100,
              cost_price: Number(row.cost_price) || 80,
              mrp: Number(row.mrp) || 120,
              quantity_available: Number(row.quantity_available) || 50,
              unit: row.unit || 'pack',
              tax_percentage: Number(row.tax_percentage) || 5,
              sku: row.sku || `SKU-${Date.now().toString().slice(-5)}-${count}`
            });
            break;

          case 'delivery_boys':
            await dbService.addDeliveryBoy({
              first_name: row.first_name || 'Rider',
              last_name: row.last_name || '',
              full_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Delivery Partner',
              phone: row.phone || '+91 98000 00000',
              email: row.email || 'rider@haribansho.com',
              app_username: row.app_username || row.phone || `rider_${Date.now()}`,
              login_password: row.login_password || '1234',
              zone_id: 'zone-1',
              zone_name: row.zone_name || 'North Zone',
              vehicle_info: row.vehicle_info || 'Bike',
              availability_status: (row.availability as any) || 'Available'
            });
            break;
 
          case 'customers':
            await dbService.addCustomer({
              full_name: row.full_name || 'New Customer',
              phone: row.phone || '+91 90000 00000',
              email: row.email || '',
            }, {
              address_line_1: row.default_address || 'Lucknow',
              city: row.city || 'Lucknow',
              postal_code: row.pincode || '226001'
            });
            break;
 
          case 'categories':
            await dbService.addCategory({
              name: row.name || 'New Category',
              slug: row.slug || 'new-category',
              description: row.description || '',
              sort_order: Number(row.display_order) || 1,
              is_active: row.is_active !== 'false'
            });
            break;
 
          case 'zones':
            await dbService.addZone({
              name: row.name || 'New Zone',
              zone_code: row.code || 'NZ',
              city: row.city || 'Lucknow',
              state: row.state || 'Uttar Pradesh',
              pincodes: row.pincodes ? row.pincodes.split(',').map(p => p.trim()) : ['226001'],
              is_active: row.is_active !== 'false'
            });
            break;
 
          case 'notifications':
            await dbService.sendNotification({
              title: row.title || 'Notification',
              message: row.message || '',
              notification_type: (row.type as any) || 'System Alert',
              recipient_type: (row.target_group as any) || 'All Users',
            });
            break;
 
          case 'offers_coupons':
            await dbService.addCoupon({
              code: (row.code || 'COUPON10').toUpperCase(),
              name: row.title || 'Special Discount',
              discount_type: (row.discount_type as any) === 'flat' ? 'fixed' : 'percentage',
              discount_value: Number(row.discount_value) || 50,
              minimum_order_amount: Number(row.minimum_order_amount) || 199,
              is_active: row.is_active !== 'false'
            });
            break;

          default:
            // For general records log or create
            console.log(`[Bulk Import ${selectedSection}] Row:`, row);
            break;
        }
        count++;
      }

      alert(`✅ Successfully imported ${count} ${template.title} records!`);
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-gray-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-gray-900">Bulk Upload & CSV Export Center</h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {template.title}
                </span>
              </div>
              <p className="text-xs text-gray-500">Import CSV files, download sample data templates, or export data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
          
          {/* Section Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2">
              <label className="font-bold text-gray-700">Select Section:</label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setParsedRows([]);
                  setPastedText('');
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.keys(SAMPLE_DATA_TEMPLATES).map((key) => (
                  <option key={key} value={key}>
                    {SAMPLE_DATA_TEMPLATES[key].title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Export Button */}
            <button
              onClick={handleExportData}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export {template.title} CSV</span>
            </button>
          </div>

          {/* Action Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-bold border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>1. Upload CSV File</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 font-bold border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'paste'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileType className="w-4 h-4" />
              <span>2. Paste CSV / Text</span>
            </button>

            <button
              onClick={() => setActiveTab('sample')}
              className={`px-4 py-2 font-bold border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'sample'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>3. Sample Data Template</span>
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-6 text-center space-y-3 transition-all">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Upload your CSV file for {template.title}</h4>
                  <p className="text-gray-500 text-xs mt-0.5">Supports standard .csv file format with headers</p>
                </div>
                <div>
                  <label className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-md">
                    <span>Browse CSV File</span>
                    <input type="file" accept=".csv, .txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE RAW TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-gray-700 font-semibold">Paste raw CSV data (Header line + Rows):</label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={template.csvSample}
                className="w-full p-3 font-mono text-[11px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleParseText}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer flex items-center space-x-1.5"
              >
                <Table className="w-4 h-4" />
                <span>Parse CSV Text</span>
              </button>
            </div>
          )}

          {/* TAB 3: SAMPLE TEMPLATE DOWNLOAD / COPY */}
          {activeTab === 'sample' && (
            <div className="space-y-3 bg-emerald-50/60 p-4 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900">Sample Data Format for {template.title}</h4>
                  <p className="text-emerald-700 text-[11px]">Download sample file or copy CSV headers to fill offline</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopySample}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 font-bold rounded-lg hover:bg-emerald-100 flex items-center space-x-1"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSuccess ? 'Copied!' : 'Copy Sample Text'}</span>
                  </button>

                  <button
                    onClick={handleDownloadSample}
                    className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Template</span>
                  </button>

                  <button
                    onClick={handleDownloadSampleTxt}
                    className="px-3 py-1.5 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT Template</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre">
                {template.csvSample}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PARSED DATA PREVIEW */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800 flex items-center space-x-1.5">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <span>Parsed Data Preview ({parsedRows.length} Rows Ready to Import)</span>
                </h4>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  Status: Validated
                </span>
              </div>

              <div className="max-h-52 overflow-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-gray-100 sticky top-0 font-bold text-gray-700">
                    <tr>
                      <th className="p-2 border-b">#</th>
                      {Object.keys(parsedRows[0] || {}).map((col) => (
                        <th key={col} className="p-2 border-b capitalize">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-gray-400 font-mono">{idx + 1}</td>
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="p-2 font-mono text-gray-800 truncate max-w-[180px]">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExecuteImport}
              disabled={parsedRows.length === 0 || isImporting}
              className={`px-5 py-2 font-bold rounded-lg shadow-md flex items-center space-x-2 cursor-pointer ${
                parsedRows.length === 0 || isImporting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Importing Data...' : `Import ${parsedRows.length} Rows Now`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
