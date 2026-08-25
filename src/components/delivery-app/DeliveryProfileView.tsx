import React, { useState } from 'react';
import { 
  User, 
  Bike, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  LogOut, 
  Banknote, 
  Calendar, 
  MapPin, 
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Power
} from 'lucide-react';
import { DeliveryBoy, Order } from '../../types';

interface DeliveryProfileViewProps {
  rider: DeliveryBoy;
  orders: Order[];
  onLogout: () => void;
  onToggleOnline: () => void;
}

export const DeliveryProfileView: React.FC<DeliveryProfileViewProps> = ({
  rider,
  orders,
  onLogout,
  onToggleOnline
}) => {
  const isOnline = rider.availability_status === 'Available' || rider.availability_status === 'Busy';

  const deliveredOrders = orders.filter(o => o.order_status === 'Delivered');
  const codOrders = deliveredOrders.filter(o => o.payment_method === 'COD');
  const totalCodCollected = codOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 1. Header Identity Card */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-16 bg-linear-to-r from-emerald-600/30 to-teal-500/30 blur-xl" />
        
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-emerald-500 to-teal-300 p-1 mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center font-bold text-2xl text-emerald-300">
              {rider.full_name?.charAt(0) || 'D'}
            </div>
          </div>

          <h3 className="font-bold text-lg text-white">{rider.full_name}</h3>
          <p className="text-xs text-emerald-300 font-mono font-semibold mt-0.5">
            {rider.employee_code || 'DB-0834'} • {rider.zone_name || 'North Zone'}
          </p>

          {/* Quick status pill */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={onToggleOnline}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isOnline ? 'Active Online' : 'Currently Offline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Lifetime Delivery Performance */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Performance & Stats
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Rating</p>
            <p className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-amber-400" /> {rider.rating || 4.9}
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Total Trips</p>
            <p className="text-lg font-bold text-white mt-0.5">{rider.total_deliveries || deliveredOrders.length}</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Success</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">99.4%</p>
          </div>
        </div>
      </div>

      {/* 3. Cash on Delivery (COD) Collection Breakdown */}
      <div className="bg-slate-900 border border-teal-500/20 rounded-3xl p-4 space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-teal-400" />
            COD Cash in Hand
          </h4>
          <span className="text-sm font-extrabold text-teal-300">₹{totalCodCollected}</span>
        </div>

        <div className="space-y-2">
          {codOrders.length > 0 ? (
            codOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex justify-between items-center text-xs"
              >
                <div>
                  <p className="font-semibold text-white">Order #{ord.order_number || ord.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-slate-400">{ord.customer_name || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-300">₹{ord.total_amount}</p>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded">
                    Pending Deposit
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No COD cash collected yet today.</p>
          )}
        </div>
      </div>

      {/* 4. Partner Account Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
          Account Information
        </h4>

        <div className="flex justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Phone Number</span>
          <span className="font-semibold text-white">{rider.phone}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Assigned Vehicle</span>
          <span className="font-semibold text-white">{rider.vehicle_info || 'Motorcycle'}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Driving License</span>
          <span className="font-semibold text-white font-mono">{rider.license_number || 'WB-DL-0834199'}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-800/80">
          <span className="text-slate-400">Operating Zone</span>
          <span className="font-semibold text-white">{rider.zone_name || 'Kolkata North Hub'}</span>
        </div>
      </div>

      {/* 5. Logout Action */}
      <button
        onClick={onLogout}
        className="w-full py-3.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout from Driver Account</span>
      </button>
    </div>
  );
};
