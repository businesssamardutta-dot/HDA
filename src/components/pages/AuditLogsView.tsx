import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  Clock,
  Eye,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Layers,
  Database
} from 'lucide-react';
import { AuditLog } from '../../types';
import { exportToCSV, exportToExcel, printReport } from '../../utils/exportUtils';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.entity_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.entity_id || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEntity = entityFilter === 'All' || log.entity_type === entityFilter;
      const matchesAction = actionFilter === 'All' || log.action.toUpperCase().includes(actionFilter.toUpperCase());

      return matchesSearch && matchesEntity && matchesAction;
    });
  }, [logs, searchQuery, entityFilter, actionFilter]);

  const handleExportCSV = () => {
    exportToCSV('Haribansho_Audit_Trail', filteredLogs.map(l => ({
      Timestamp: l.created_at,
      Actor: l.user_name,
      Action: l.action,
      Entity: l.entity_type || '-',
      Entity_ID: l.entity_id || '-',
      IP_Address: l.ip_address || 'Internal'
    })));
  };

  const handleExportExcel = () => {
    exportToExcel('Haribansho_Audit_Trail', filteredLogs.map(l => ({
      Timestamp: l.created_at,
      Actor: l.user_name,
      Action: l.action,
      Entity: l.entity_type || '-',
      Entity_ID: l.entity_id || '-',
      IP_Address: l.ip_address || 'Internal'
    })));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Security & Audit Logs</h1>
            <p className="text-xs text-gray-500">Immutable chronological records of order assignments, state transitions, and user actions</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => printReport('Haribansho_Audit_Trail')}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="All">All Entities</option>
            <option value="ORDER">Orders</option>
            <option value="COUPON">Coupons</option>
            <option value="USER">Users</option>
            <option value="ROLE">Roles</option>
            <option value="NOTIFICATION">Notifications</option>
            <option value="CUSTOMER">Customers</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="All">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="ASSIGN">Assign</option>
            <option value="RESET">Reset</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Target ID</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">
                    No audit log records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">{log.user_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-800' :
                        log.action.includes('DELETE') ? 'bg-rose-100 text-rose-800' :
                        log.action.includes('ASSIGN') ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-semibold">{log.entity_type || '-'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">{log.entity_id || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {(log.new_data || log.old_data) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold text-xs flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT LOG PAYLOAD MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{selectedLog.action}</h3>
                  <p className="text-[11px] text-gray-400">By {selectedLog.user_name} on {new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {selectedLog.old_data && (
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Previous State (Old Data):</span>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl overflow-x-auto font-mono text-[11px] text-gray-800">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Applied State (New Data):</span>
                  <pre className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl overflow-x-auto font-mono text-[11px] text-emerald-950">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
