import React, { useState, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Clock, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  PenTool, 
  RotateCcw, 
  Check, 
  ArrowRight, 
  AlertTriangle,
  Package,
  Bike,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Order, DeliveryBoy } from '../../types';
import { dbService } from '../../services/dbService';

interface DeliveryDetailViewProps {
  order: Order;
  rider: DeliveryBoy;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const DeliveryDetailView: React.FC<DeliveryDetailViewProps> = ({
  order,
  rider,
  onClose,
  onStatusUpdated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'pod'>('details');
  const [codReceived, setCodReceived] = useState(true);
  const [driverNotes, setDriverNotes] = useState('');
  const [podPhotoUrl, setPodPhotoUrl] = useState<string | null>(null);
  const [isSuccessDelivered, setIsSuccessDelivered] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const isCOD = order.payment_method === 'COD';
  const orderStatus = order.order_status;
  const assignmentStatus = order.assignment_status;

  // Canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#059669';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Step Handlers
  const handleAcceptOrder = async () => {
    setIsSubmitting(true);
    try {
      await dbService.acceptDeliveryAssignment(order.id, rider.id);
      onStatusUpdated();
    } catch (e) {
      console.error('Error accepting order:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDelivery = async () => {
    setIsSubmitting(true);
    try {
      await dbService.startDelivery(order.id, rider.id, {
        lat: rider.current_latitude || 22.5726,
        lng: rider.current_longitude || 88.3639,
        name: 'En route to customer'
      });
      onStatusUpdated();
    } catch (e) {
      console.error('Error starting delivery:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReachCustomer = async () => {
    setIsSubmitting(true);
    try {
      await dbService.reachCustomer(order.id, rider.id);
      setShowPodModal(true);
      onStatusUpdated();
    } catch (e) {
      console.error('Error reaching customer:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsSubmitting(true);
    try {
      let signatureDataUrl: string | undefined = undefined;
      if (canvasRef.current && hasSignature) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      }

      await dbService.markOrderDelivered(order.id, rider.id, {
        signatureUrl: signatureDataUrl,
        photoUrl: podPhotoUrl || undefined,
        codCollectedAmount: isCOD && codReceived ? Number(order.total_amount) : 0,
        notes: driverNotes || 'Customer received packet in good condition'
      });

      setIsSuccessDelivered(true);
      setTimeout(() => {
        onStatusUpdated();
        onClose();
      }, 1800);
    } catch (e) {
      console.error('Error confirming delivery:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPodPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Google maps navigation helper
  const openGoogleMaps = () => {
    const query = encodeURIComponent(order.delivery_address_text || (order as any).delivery_address || 'Haribansho Fresh');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center">
      <div className="bg-slate-900 border border-emerald-500/20 text-white w-full sm:max-w-md h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Top App Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">
                  Order #{order.order_number || order.id.slice(0, 8)}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  orderStatus === 'Delivered' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : orderStatus === 'Out for Delivery'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                }`}>
                  {orderStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.payment_method}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Total Bill</p>
            <p className="text-lg font-bold text-emerald-400">₹{order.total_amount}</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Delivery Details
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'items'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Packet Items ({order.items?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('pod')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pod'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Proof of Delivery
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'details' && (
            <>
              {/* Customer Contact Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Recipient Customer</span>
                    <h4 className="font-bold text-white text-base mt-0.5">{order.customer_name || 'Haribansho Customer'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{order.customer_phone || '+91 98000 00000'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {order.customer_phone && (
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-400/30 transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {order.customer_phone && (
                      <a
                        href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl border border-teal-400/30 transition-colors"
                        title="WhatsApp Customer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Destination Address</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {order.delivery_address_text || (order as any).delivery_address || 'Customer Delivery Address'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={openGoogleMaps}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shrink-0 text-xs flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span>Map</span>
                  </button>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className={`p-4 rounded-2xl border ${
                isCOD 
                  ? 'bg-amber-950/30 border-amber-500/30'
                  : 'bg-emerald-950/30 border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {isCOD ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                        <Banknote className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {isCOD ? 'Cash On Delivery (Collect Cash)' : 'Prepaid Online Payment'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isCOD ? 'Collect exact cash before handing over parcel' : 'Order fully paid via UPI / Netbanking'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-white">₹{order.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-3">
                  Workflow Lifecycle
                </span>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">1. Assigned by Dispatcher</p>
                      <p className="text-[10px] text-slate-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      orderStatus !== 'Pending'
                        ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}>
                      {orderStatus !== 'Pending' ? '✓' : '2'}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${orderStatus !== 'Pending' ? 'text-white' : 'text-slate-500'}`}>
                        2. Order Accepted
                      </p>
                      <p className="text-[10px] text-slate-400">Rider acknowledges dispatch</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      orderStatus === 'Out for Delivery' || orderStatus === 'Delivered'
                        ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}>
                      {orderStatus === 'Out for Delivery' || orderStatus === 'Delivered' ? '✓' : '3'}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${orderStatus === 'Out for Delivery' || orderStatus === 'Delivered' ? 'text-white' : 'text-slate-500'}`}>
                        3. Out for Delivery & GPS Active
                      </p>
                      <p className="text-[10px] text-slate-400">Live coordinates synced with admin</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      orderStatus === 'Delivered'
                        ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}>
                      {orderStatus === 'Delivered' ? '✓' : '4'}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${orderStatus === 'Delivered' ? 'text-white' : 'text-slate-500'}`}>
                        4. Delivered with Proof of Delivery (POD)
                      </p>
                      <p className="text-[10px] text-slate-400">Signature, COD cash settled</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-300">Items Manifest Checklist</span>
                <span className="text-xs text-emerald-400 font-mono">Verify packet contents</span>
              </div>
              <div className="space-y-2">
                {(order.items && order.items.length > 0) ? (
                  order.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-white">{item.product_name || `Item ${idx + 1}`}</p>
                          <p className="text-[10px] text-slate-400">Qty: {item.quantity} {(item as any).unit ? `(${(item as any).unit})` : ''}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">₹{item.total_amount || item.unit_price * item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-xs text-white">Fresh Grocery Packet</p>
                        <p className="text-[10px] text-slate-400">Full Order Box</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">₹{order.total_amount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pod' && (
            <div className="space-y-4">
              {/* Cash Collection Confirmation */}
              {isCOD && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300">Cash on Delivery Verification</span>
                    <span className="text-sm font-extrabold text-amber-400">₹{order.total_amount}</span>
                  </div>
                  <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codReceived}
                      onChange={(e) => setCodReceived(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>I have physically collected <strong>₹{order.total_amount}</strong> cash</span>
                  </label>
                </div>
              )}

              {/* Digital Signature Canvas */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                    Customer E-Signature (Optional)
                  </span>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden touch-none relative">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full bg-slate-900/90 cursor-crosshair"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-500">
                      Sign with finger or stylus inside box (Optional)
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Remarks */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Delivery Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  placeholder="e.g. Handed to customer at doorstep"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Button Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          {isSuccessDelivered ? (
            <div className="w-full py-3.5 bg-emerald-500 text-slate-950 font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Marked Delivered Successfully!</span>
            </div>
          ) : orderStatus === 'Delivered' ? (
            <div className="flex space-x-2">
              <div className="flex-1 py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-2xl flex items-center justify-center space-x-2 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Already Delivered</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : orderStatus === 'Assigned' && assignmentStatus !== 'Accepted' ? (
            <button
              onClick={handleAcceptOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="text-xs font-semibold">Updating...</span>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Accept Order Assignment</span>
                </>
              )}
            </button>
          ) : orderStatus === 'Assigned' || assignmentStatus === 'Accepted' ? (
            <button
              onClick={handleStartDelivery}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="text-xs font-semibold">Starting Trip...</span>
              ) : (
                <>
                  <Bike className="w-5 h-5 stroke-[2.5]" />
                  <span>Start Delivery (Out for Delivery)</span>
                </>
              )}
            </button>
          ) : orderStatus === 'Out for Delivery' ? (
            <div className="space-y-2">
              <button
                onClick={handleConfirmDelivery}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                {isSubmitting ? (
                  <span className="text-xs font-semibold">Marking Delivered...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>✓ Mark as Delivered</span>
                  </>
                )}
              </button>
              {activeTab !== 'pod' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('pod')}
                  className="w-full py-1.5 text-center text-[11px] text-emerald-400/80 hover:text-emerald-300 underline font-medium cursor-pointer"
                >
                  Add E-Signature / Notes First
                </button>
              )}
            </div>
          ) : activeTab === 'pod' ? (
            <button
              onClick={handleConfirmDelivery}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="text-xs font-semibold">Saving POD...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Confirm & Mark Delivered</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              Close Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
