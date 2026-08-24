import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Map,
  Layers,
  Globe,
  Navigation,
  X,
  AlertCircle
} from 'lucide-react';
import { Zone, Location } from '../../types';
import { dbService } from '../../services/dbService';

interface ZonesViewProps {
  zones: Zone[];
  onRefresh?: () => void;
}

export const ZonesView: React.FC<ZonesViewProps> = ({ zones, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'zones' | 'locations' | 'map'>('overview');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isAddLocOpen, setIsAddLocOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  // New Zone Form
  const [zoneForm, setZoneForm] = useState({
    name: '',
    zone_code: '',
    description: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    color: '#16a34a',
    base_delivery_charge: 40,
    minimum_order_amount: 199,
    pincodes: '226001, 226002',
    is_active: true
  });

  // New Location Form
  const [locForm, setLocForm] = useState({
    zone_id: '',
    name: '',
    address: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postal_code: '226001',
    latitude: 26.8467,
    longitude: 80.9462,
    is_active: true
  });

  const loadLocationsData = async () => {
    setLoadingLocations(true);
    try {
      const locs = await dbService.getLocations();
      setLocations(locs);
    } catch (e) {
      console.error('Error loading locations:', e);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    loadLocationsData();
  }, []);

  // Filtered zones & locations
  const filteredZones = zones.filter(
    z => z.name.toLowerCase().includes(search.toLowerCase()) ||
         z.city.toLowerCase().includes(search.toLowerCase()) ||
         z.zone_code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLocations = locations.filter(
    l => l.name.toLowerCase().includes(search.toLowerCase()) ||
         l.city.toLowerCase().includes(search.toLowerCase()) ||
         l.zone_name.toLowerCase().includes(search.toLowerCase())
  );

  // Save Zone (Create or Update)
  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.name) return;

    const pincodeArr = zoneForm.pincodes.split(',').map(p => p.trim()).filter(Boolean);

    if (editingZone) {
      await dbService.updateZone(editingZone.id, {
        name: zoneForm.name,
        zone_code: zoneForm.zone_code || `ZN-${zones.length + 1}`,
        description: zoneForm.description,
        city: zoneForm.city,
        state: zoneForm.state,
        color: zoneForm.color,
        base_delivery_charge: Number(zoneForm.base_delivery_charge),
        minimum_order_amount: Number(zoneForm.minimum_order_amount),
        pincodes: pincodeArr,
        is_active: zoneForm.is_active
      });
    } else {
      await dbService.addZone({
        name: zoneForm.name,
        zone_code: zoneForm.zone_code || `ZN-${zones.length + 1}`,
        description: zoneForm.description,
        city: zoneForm.city,
        state: zoneForm.state,
        color: zoneForm.color,
        base_delivery_charge: Number(zoneForm.base_delivery_charge),
        minimum_order_amount: Number(zoneForm.minimum_order_amount),
        pincodes: pincodeArr,
        is_active: zoneForm.is_active
      });
    }

    setIsAddZoneOpen(false);
    setEditingZone(null);
    setZoneForm({
      name: '',
      zone_code: '',
      description: '',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      color: '#16a34a',
      base_delivery_charge: 40,
      minimum_order_amount: 199,
      pincodes: '226001, 226002',
      is_active: true
    });
    if (onRefresh) onRefresh();
  };

  // Save Location (Create or Update)
  const handleSaveLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name) return;

    const selectedZone = zones.find(z => z.id === locForm.zone_id);

    if (editingLoc) {
      await dbService.updateLocation(editingLoc.id, {
        zone_id: locForm.zone_id,
        zone_name: selectedZone?.name || locForm.zone_id,
        name: locForm.name,
        address: locForm.address,
        city: locForm.city,
        state: locForm.state,
        postal_code: locForm.postal_code,
        latitude: Number(locForm.latitude),
        longitude: Number(locForm.longitude),
        is_active: locForm.is_active
      });
    } else {
      await dbService.addLocation({
        zone_id: locForm.zone_id,
        zone_name: selectedZone?.name || 'General',
        name: locForm.name,
        address: locForm.address,
        city: locForm.city,
        state: locForm.state,
        postal_code: locForm.postal_code,
        latitude: Number(locForm.latitude),
        longitude: Number(locForm.longitude),
        is_active: locForm.is_active
      });
    }

    setIsAddLocOpen(false);
    setEditingLoc(null);
    setLocForm({
      zone_id: '',
      name: '',
      address: '',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      postal_code: '226001',
      latitude: 26.8467,
      longitude: 80.9462,
      is_active: true
    });
    loadLocationsData();
  };

  const handleDeleteZone = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      await dbService.deleteZone(id);
      if (onRefresh) onRefresh();
    }
  };

  const handleDeleteLoc = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location point?')) {
      await dbService.deleteLocation(id);
      loadLocationsData();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Delivery Zones & Coverage</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              01_zones & 01_locations
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure geofenced delivery zones, delivery fees, and order caps.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingZone(null);
              setIsAddZoneOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Zone</span>
          </button>

          <button
            onClick={() => {
              setEditingLoc(null);
              setIsAddLocOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <MapPin className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 bg-white px-4 pt-2 rounded-t-xl">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Overview</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('zones')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'zones'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Zones ({zones.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'locations'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Locations ({locations.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('map')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'map'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Map className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </div>
        </button>
      </div>

      {/* Search Filter */}
      {activeSubTab !== 'map' && (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter zones or locations by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Active City: <strong>Lucknow Hub</strong>
          </span>
        </div>
      )}

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Total Configured Zones</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{zones.length}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Geofenced delivery areas</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Registered Hub Locations</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{locations.length}</div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">Dark stores & pick points</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Avg. Base Delivery Charge</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                ₹{zones.length > 0 ? Math.round(zones.reduce((a, b) => a + (b.base_delivery_charge || 40), 0) / zones.length) : 40}
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Standard rider dispatch fee</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Zones Summary Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Active Delivery Zones</h3>
                <button
                  onClick={() => setActiveSubTab('zones')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-2">
                {zones.map((z) => (
                  <div key={z.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: z.color || '#16a34a' }}
                      />
                      <div>
                        <div className="font-bold text-gray-900">{z.name}</div>
                        <div className="text-[11px] text-gray-500">{z.city}, {z.state}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">₹{z.base_delivery_charge ?? 40} Fee</div>
                      <div className="text-[10px] text-gray-400">Min Order: ₹{z.minimum_order_amount ?? 199}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locations Summary Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Registered Dispatch Locations</h3>
                <button
                  onClick={() => setActiveSubTab('locations')}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-2">
                {locations.slice(0, 5).map((loc) => (
                  <div key={loc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">{loc.name}</div>
                        <div className="text-[11px] text-gray-500">{loc.address}, {loc.city}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {loc.zone_name || 'Zone Hub'}
                    </span>
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="text-center p-6 text-gray-400 text-xs">
                    No location points created yet. Click "Add Location" to register dark stores.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ZONES */}
      {activeSubTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredZones.map((z) => (
            <div key={z.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: z.color || '#16a34a' }}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{z.name}</h3>
                      <p className="text-xs text-gray-500">{z.city}, {z.state}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    z.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {z.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 my-2">{z.description || 'Geofenced delivery zone'}</p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-gray-400 text-[10px]">Base Charge:</span>
                    <div className="font-bold text-gray-800">₹{z.base_delivery_charge ?? 40}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Min. Order:</span>
                    <div className="font-bold text-gray-800">₹{z.minimum_order_amount ?? 199}</div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 mt-2">
                  Coverage Pincodes:{' '}
                  <strong className="text-gray-700">
                    {z.pincodes && z.pincodes.length > 0 ? z.pincodes.join(', ') : '226001, 226002'}
                  </strong>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setEditingZone(z);
                    setZoneForm({
                      name: z.name,
                      zone_code: z.zone_code,
                      description: z.description || '',
                      city: z.city,
                      state: z.state,
                      color: z.color || '#16a34a',
                      base_delivery_charge: z.base_delivery_charge || 40,
                      minimum_order_amount: z.minimum_order_amount || 199,
                      pincodes: z.pincodes ? z.pincodes.join(', ') : '226001',
                      is_active: z.is_active !== false
                    });
                    setIsAddZoneOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Zone</span>
                </button>

                <button
                  onClick={() => handleDeleteZone(z.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {filteredZones.length === 0 && (
            <div className="col-span-full bg-white p-8 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
              No zones found matching search filter.
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: LOCATIONS */}
      {activeSubTab === 'locations' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Assigned Zone</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Coordinates (Lat / Lng)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{loc.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {loc.zone_name || 'Central Hub'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{loc.address}, {loc.city}, {loc.postal_code}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        loc.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {loc.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingLoc(loc);
                          setLocForm({
                            zone_id: loc.zone_id,
                            name: loc.name,
                            address: loc.address,
                            city: loc.city,
                            state: loc.state,
                            postal_code: loc.postal_code,
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                            is_active: loc.is_active !== false
                          });
                          setIsAddLocOpen(true);
                        }}
                        className="text-gray-500 hover:text-emerald-700 cursor-pointer p-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteLoc(loc.id)}
                        className="text-gray-400 hover:text-rose-600 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLocations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                      No locations found. Click "Add Location" to register stores or pick-up points.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: INTERACTIVE MAP */}
      {activeSubTab === 'map' && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Geofenced Coverage Map</h3>
              <p className="text-xs text-gray-500">Center points and location nodes for Lucknow delivery network</p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              {zones.length} Zones • {locations.length} Points
            </span>
          </div>

          <div className="h-96 w-full rounded-xl overflow-hidden border border-gray-200 relative bg-slate-100 flex items-center justify-center">
            {/* Visual Coverage Map Canvas */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-slate-50 to-blue-50 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-gray-200 text-xs shadow-xs space-y-1">
                  <div className="font-bold text-gray-900">Lucknow Operations Hub</div>
                  <div className="text-[11px] text-gray-500">Center: 26.8467° N, 80.9462° E</div>
                  <div className="flex items-center space-x-2 pt-1 text-[10px]">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Active Zone Center</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Hub Node</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {zones.map((z) => (
                    <div
                      key={z.id}
                      className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-gray-200 text-xs shadow-xs flex items-center space-x-2"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: z.color || '#16a34a' }}
                      />
                      <span className="font-bold text-gray-800">{z.name}</span>
                      <span className="text-gray-400 text-[10px]">({z.city})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Nodes Visualizer */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full my-auto text-center">
                {zones.map((z, idx) => (
                  <div
                    key={z.id}
                    className="p-3 rounded-xl bg-white/80 border border-emerald-200 shadow-xs flex flex-col items-center justify-center space-y-1 transform hover:scale-105 transition-transform"
                  >
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <div className="font-bold text-gray-900 text-xs">{z.name}</div>
                    <div className="text-[10px] text-gray-500">₹{z.base_delivery_charge || 40} base fee</div>
                  </div>
                ))}
              </div>

              <div className="text-center text-[11px] text-gray-400 bg-white/80 py-1.5 px-3 rounded-lg border border-gray-200 w-fit mx-auto">
                All coordinates synchronized with real-time route optimization engine
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ZONE MODAL */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingZone ? 'Edit Zone' : 'Create Delivery Zone'}
              </h3>
              <button
                onClick={() => setIsAddZoneOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Lucknow Zone"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Zone Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ZN-NL1"
                    value={zoneForm.zone_code}
                    onChange={(e) => setZoneForm({ ...zoneForm, zone_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Color Theme</label>
                  <input
                    type="color"
                    value={zoneForm.color}
                    onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                    className="w-full h-9 p-1 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Base Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={zoneForm.base_delivery_charge}
                    onChange={(e) => setZoneForm({ ...zoneForm, base_delivery_charge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={zoneForm.minimum_order_amount}
                    onChange={(e) => setZoneForm({ ...zoneForm, minimum_order_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Coverage Pincodes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="226001, 226002, 226020"
                  value={zoneForm.pincodes}
                  onChange={(e) => setZoneForm({ ...zoneForm, pincodes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={zoneForm.state}
                    onChange={(e) => setZoneForm({ ...zoneForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="zone-active-cb"
                  checked={zoneForm.is_active}
                  onChange={(e) => setZoneForm({ ...zoneForm, is_active: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="zone-active-cb" className="text-gray-700 font-medium">
                  Active Zone
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingZone ? 'Save Changes' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT LOCATION MODAL */}
      {isAddLocOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingLoc ? 'Edit Location' : 'Add Location Point'}
              </h3>
              <button
                onClick={() => setIsAddLocOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Zone *</label>
                <select
                  required
                  value={locForm.zone_id}
                  onChange={(e) => setLocForm({ ...locForm, zone_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select Zone...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Location / Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hazratganj Dark Store Hub"
                  value={locForm.name}
                  onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="Building No, Street, Landmark"
                  value={locForm.address}
                  onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locForm.latitude}
                    onChange={(e) => setLocForm({ ...locForm, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locForm.longitude}
                    onChange={(e) => setLocForm({ ...locForm, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="loc-active-cb"
                  checked={locForm.is_active}
                  onChange={(e) => setLocForm({ ...locForm, is_active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="loc-active-cb" className="text-gray-700 font-medium">
                  Active Dispatch Point
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddLocOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingLoc ? 'Save Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
