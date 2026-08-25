import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Bike, 
  Compass, 
  Phone, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Order, DeliveryBoy } from '../../types';
import { dbService } from '../../services/dbService';

interface DeliveryTrackingViewProps {
  orders: Order[];
  rider: DeliveryBoy;
  onSelectOrder: (order: Order) => void;
}

export const DeliveryTrackingView: React.FC<DeliveryTrackingViewProps> = ({
  orders,
  rider,
  onSelectOrder
}) => {
  const activeOrders = orders.filter(o => o.order_status === 'Out for Delivery' || o.assignment_status === 'Accepted');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(activeOrders[0] || orders[0] || null);
  const [isSimulatingLocation, setIsSimulatingLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: rider.current_latitude || 22.5726,
    lng: rider.current_longitude || 88.3639
  });
  const [speedKmh, setSpeedKmh] = useState(28);

  useEffect(() => {
    if (activeOrders.length > 0 && !selectedOrder) {
      setSelectedOrder(activeOrders[0]);
    }
  }, [activeOrders, selectedOrder]);

  // Simulate real GPS location update to Supabase
  const handleUpdateLiveGps = async () => {
    setIsSimulatingLocation(true);
    // Slight delta movement
    const newLat = currentCoords.lat + (Math.random() - 0.5) * 0.003;
    const newLng = currentCoords.lng + (Math.random() - 0.5) * 0.003;
    setCurrentCoords({ lat: newLat, lng: newLng });

    try {
      await dbService.updateRiderLiveLocation(
        rider.id,
        selectedOrder?.id,
        newLat,
        newLng,
        'Live Rider Navigation Point'
      );
    } catch (e) {
      console.warn('GPS sync error:', e);
    } finally {
      setTimeout(() => setIsSimulatingLocation(false), 600);
    }
  };

  const openExternalMaps = () => {
    if (!selectedOrder) return;
    const q = encodeURIComponent(selectedOrder.delivery_address_text || (selectedOrder as any).delivery_address || 'Destination');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 1. Active Order Selector if multiple */}
      {activeOrders.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {activeOrders.map((ord) => (
            <button
              key={ord.id}
              onClick={() => setSelectedOrder(ord)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedOrder?.id === ord.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Order #{ord.order_number || ord.id.slice(0, 8)}
            </button>
          ))}
        </div>
      )}

      {/* 2. Interactive Navigation Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Map Header */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Live Route Navigation
            </span>
          </div>
          <button
            onClick={openExternalMaps}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </button>
        </div>

        {/* Visual Map Canvas Representation */}
        <div className="relative h-64 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Stylized Grid Roads */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Destination Marker */}
          <div className="absolute top-10 right-12 flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 animate-bounce">
              <MapPin className="w-5 h-5 fill-white" />
            </div>
            <span className="text-[10px] font-bold bg-slate-900/90 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 mt-1 shadow-md">
              Customer Doorstep
            </span>
          </div>

          {/* Route path line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d="M 80 180 Q 150 160 200 110 T 260 55"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="animate-[dash_2s_linear_infinite]"
            />
          </svg>

          {/* Rider Marker */}
          <div className="absolute bottom-12 left-14 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Bike className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 mt-1 shadow-md">
              You (Rider)
            </span>
          </div>

          {/* Turn-by-Turn HUD Banner */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 p-2.5 rounded-2xl shadow-lg flex items-center space-x-2.5 max-w-[200px]">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white leading-tight">In 200m Turn Right</p>
              <p className="text-[9px] text-emerald-300/80">Towards Delivery Point</p>
            </div>
          </div>
        </div>

        {/* Live Trip Telemetry */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-[10px] text-slate-400">Distance</p>
            <p className="text-sm font-bold text-white">1.8 km</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-[10px] text-slate-400">Est. Time (ETA)</p>
            <p className="text-sm font-bold text-emerald-400">6 mins</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-[10px] text-slate-400">GPS Status</p>
            <p className="text-sm font-bold text-teal-300">Live 5G</p>
          </div>
        </div>
      </div>

      {/* 3. Sync Location Button (Sends coordinates to Supabase) */}
      <button
        onClick={handleUpdateLiveGps}
        disabled={isSimulatingLocation}
        className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
      >
        <RefreshCw className={`w-4 h-4 ${isSimulatingLocation ? 'animate-spin text-emerald-400' : ''}`} />
        <span>Broadcast Live Coordinates to Dispatch Server</span>
      </button>

      {/* 4. Active Destination Details */}
      {selectedOrder && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">Target Destination</span>
              <h5 className="font-bold text-white text-sm mt-0.5">{selectedOrder.customer_name}</h5>
              <p className="text-xs text-slate-400">{selectedOrder.customer_phone}</p>
            </div>
            <button
              onClick={() => onSelectOrder(selectedOrder)}
              className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Deliver</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start space-x-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{selectedOrder.delivery_address_text || (selectedOrder as any).delivery_address || 'Customer Delivery Address'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
