import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Edit2,
  UserCheck,
  Calendar,
  X,
  ShieldAlert,
  Fuel
} from 'lucide-react';
import { Vehicle, DeliveryBoy } from '../../types';
import { dbService } from '../../services/dbService';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  deliveryBoys: DeliveryBoy[];
  onRefresh?: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles: initialVehicles,
  deliveryBoys,
  onRefresh,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [form, setForm] = useState({
    vehicle_number: '',
    vehicle_type: 'Bike' as any,
    brand: '',
    model: '',
    fuel_type: 'Petrol' as any,
    capacity: '25 kg',
    assigned_delivery_boy_id: '',
    registration_expiry: '',
    insurance_expiry: '',
    status: 'active' as any
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await dbService.getVehicles();
      setVehicles(data);
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
      v.brand?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      (v.assigned_delivery_boy_name && v.assigned_delivery_boy_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'All' || v.vehicle_type === selectedType;
    const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary metrics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const assignedVehicles = vehicles.filter(v => v.assigned_delivery_boy_id).length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance' || v.status === 'inactive').length;

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_number) return;

    const assignedBoy = deliveryBoys.find(b => b.id === form.assigned_delivery_boy_id);

    if (editingVehicle) {
      await dbService.updateVehicle(editingVehicle.id, {
        vehicle_number: form.vehicle_number.toUpperCase(),
        vehicle_type: form.vehicle_type,
        brand: form.brand,
        model: form.model,
        fuel_type: form.fuel_type,
        capacity: form.capacity,
        assigned_delivery_boy_id: form.assigned_delivery_boy_id || null,
        assigned_delivery_boy_name: assignedBoy ? assignedBoy.full_name : undefined,
        registration_expiry: form.registration_expiry,
        insurance_expiry: form.insurance_expiry,
        status: form.status
      });
    } else {
      await dbService.addVehicle({
        vehicle_number: form.vehicle_number.toUpperCase(),
        vehicle_type: form.vehicle_type,
        brand: form.brand,
        model: form.model,
        fuel_type: form.fuel_type,
        capacity: form.capacity,
        assigned_delivery_boy_id: form.assigned_delivery_boy_id || null,
        assigned_delivery_boy_name: assignedBoy ? assignedBoy.full_name : undefined,
        registration_expiry: form.registration_expiry,
        insurance_expiry: form.insurance_expiry,
        status: form.status
      });
    }

    setIsModalOpen(false);
    setEditingVehicle(null);
    setForm({
      vehicle_number: '',
      vehicle_type: 'Bike',
      brand: '',
      model: '',
      fuel_type: 'Petrol',
      capacity: '25 kg',
      assigned_delivery_boy_id: '',
      registration_expiry: '',
      insurance_expiry: '',
      status: 'active'
    });
    fetchVehicles();
    if (onRefresh) onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle from fleet?')) {
      await dbService.deleteVehicle(id);
      fetchVehicles();
      if (onRefresh) onRefresh();
    }
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      vehicle_number: v.vehicle_number,
      vehicle_type: v.vehicle_type || 'Bike',
      brand: v.brand || '',
      model: v.model || '',
      fuel_type: v.fuel_type || 'Petrol',
      capacity: v.capacity || '25 kg',
      assigned_delivery_boy_id: v.assigned_delivery_boy_id || '',
      registration_expiry: v.registration_expiry || '',
      insurance_expiry: v.insurance_expiry || '',
      status: v.status || 'active'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Vehicle Fleet Management</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              01_vehicles
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your delivery fleet, registration & insurance validity, and rider vehicle assignments.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setForm({
              vehicle_number: '',
              vehicle_type: 'Bike',
              brand: '',
              model: '',
              fuel_type: 'Petrol',
              capacity: '25 kg',
              assigned_delivery_boy_id: '',
              registration_expiry: '',
              insurance_expiry: '',
              status: 'active'
            });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Total Fleet</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{totalVehicles}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Active Status</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{activeVehicles}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Assigned Riders</div>
          <div className="text-xl font-bold text-purple-700 mt-1">{assignedVehicles}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Maintenance / Inactive</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{maintenanceVehicles}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by vehicle number, model, driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
          >
            <option value="All">All Types</option>
            <option value="Bike">Bike</option>
            <option value="Scooter">Scooter</option>
            <option value="Electric Bike">Electric Bike (EV)</option>
            <option value="Bicycle">Bicycle</option>
            <option value="Van">Van / Auto</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          Showing <strong>{filteredVehicles.length}</strong> vehicles
        </span>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Vehicle No</th>
                <th className="py-3 px-4">Type & Fuel</th>
                <th className="py-3 px-4">Brand / Model</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Assigned Rider</th>
                <th className="py-3 px-4">Reg. Expiry</th>
                <th className="py-3 px-4">Insurance Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((veh) => {
                const boy = deliveryBoys.find(b => b.id === veh.assigned_delivery_boy_id);
                return (
                  <tr key={veh.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{veh.vehicle_number}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-gray-800">{veh.vehicle_type}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-100 text-gray-600">
                          {veh.fuel_type || 'Petrol'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {veh.brand ? `${veh.brand} ${veh.model || ''}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{veh.capacity || '20 kg'}</td>
                    <td className="py-3 px-4">
                      {boy || veh.assigned_delivery_boy_name ? (
                        <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 w-fit">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{boy?.full_name || veh.assigned_delivery_boy_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                      {veh.registration_expiry || '2028-12-31'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                      {veh.insurance_expiry || '2026-11-15'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        veh.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : veh.status === 'maintenance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {veh.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(veh)}
                        className="text-gray-500 hover:text-emerald-700 p-1 cursor-pointer"
                        title="Edit Vehicle"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(veh.id)}
                        className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-gray-400">
                    No vehicles found in fleet catalog. Click "Add Vehicle" to register new vehicles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT VEHICLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP 32 AB 1234"
                  value={form.vehicle_number}
                  onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Vehicle Type *</label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm({ ...form, vehicle_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Bike">Electric Bike (EV)</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Van">Van / Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Fuel Type</label>
                  <select
                    value={form.fuel_type}
                    onChange={(e) => setForm({ ...form, fuel_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Activa 6G"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Assigned Delivery Rider</label>
                <select
                  value={form.assigned_delivery_boy_id}
                  onChange={(e) => setForm({ ...form, assigned_delivery_boy_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="">Unassigned (Available in Pool)</option>
                  {deliveryBoys.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} ({b.zone_name}) - {b.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Reg. Expiry Date</label>
                  <input
                    type="date"
                    value={form.registration_expiry}
                    onChange={(e) => setForm({ ...form, registration_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Insurance Expiry Date</label>
                  <input
                    type="date"
                    value={form.insurance_expiry}
                    onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="inactive">Inactive / Decommissioned</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingVehicle ? 'Save Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
