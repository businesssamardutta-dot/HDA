import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, CheckCircle } from 'lucide-react';
import { Order } from '../../types';
import { dbService } from '../../services/dbService';

interface PODModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PODModal: React.FC<PODModalProps> = ({ order, isOpen, onClose, onSuccess }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }
    
    // In a real app, we would upload sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    setIsSubmitting(true);
    try {
      await dbService.updateOrderStatus(order.id, 'Delivered');
      // Assume success
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to submit POD.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Proof of Delivery</h2>
            <p className="text-xs text-gray-500">Order: {order.order_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Customer Signature
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
            <SignatureCanvas 
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-40 cursor-crosshair'
              }}
            />
          </div>
          <div className="flex justify-end mt-2">
            <button 
              onClick={clearSignature}
              className="text-xs font-medium text-gray-500 hover:text-rose-500 transition-colors"
            >
              Clear Signature
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Confirm Delivery'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
