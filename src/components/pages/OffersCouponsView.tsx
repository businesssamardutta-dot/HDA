import React, { useState, useMemo } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Edit,
  Trash2,
  Calendar,
  IndianRupee,
  Percent,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  Tag,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Coupon, Offer, Category, Zone } from '../../types';
import { dbService } from '../../services/dbService';

interface OffersCouponsViewProps {
  coupons: Coupon[];
  categories?: Category[];
  zones?: Zone[];
  onRefresh: () => void;
}

export const OffersCouponsView: React.FC<OffersCouponsViewProps> = ({
  coupons,
  categories = [],
  zones = [],
  onRefresh
}) => {
  const [tab, setTab] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<number>(299);
  const [maximumDiscountAmount, setMaximumDiscountAmount] = useState<number>(100);
  const [usageLimit, setUsageLimit] = useState<number>(500);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isActive, setIsActive] = useState(true);

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const now = new Date();

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const start = new Date(c.start_date || now);
      const end = new Date(c.end_date || now);
      end.setHours(23, 59, 59, 999);

      let matchesTab = true;
      if (tab === 'active') {
        matchesTab = c.is_active && now >= start && now <= end;
      } else if (tab === 'expired') {
        matchesTab = now > end || !c.is_active;
      } else if (tab === 'scheduled') {
        matchesTab = now < start;
      }

      return matchesSearch && matchesTab;
    });
  }, [coupons, searchQuery, tab]);

  // Analytics Metrics
  const stats = useMemo(() => {
    const activeList = coupons.filter((c) => {
      const end = new Date(c.end_date || now);
      return c.is_active && now <= end;
    });
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usage_count || 0), 0);
    const totalSavings = coupons.reduce((acc, c) => {
      const avgDisc = c.discount_type === 'percentage' ? 45 : c.discount_value;
      return acc + (c.usage_count || 0) * avgDisc;
    }, 0);

    return {
      activeCoupons: activeList.length,
      totalCoupons: coupons.length,
      totalRedemptions,
      totalSavings
    };
  }, [coupons]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(15);
    setMinimumOrderAmount(299);
    setMaximumDiscountAmount(100);
    setUsageLimit(500);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || '');
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinimumOrderAmount(c.minimum_order_amount);
    setMaximumDiscountAmount(c.maximum_discount_amount || 100);
    setUsageLimit(c.usage_limit || 500);
    setStartDate(c.start_date || new Date().toISOString().split('T')[0]);
    setEndDate(c.end_date || new Date().toISOString().split('T')[0]);
    setIsActive(c.is_active);
    setIsModalOpen(true);
  };

  const handleGenerateRandomCode = () => {
    const prefixes = ['HARI', 'FESTIVE', 'DELIVERY', 'SAVER', 'SUPER', 'FRESH'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setCode(`${randomPrefix}${randomNum}`);
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (c: Coupon) => {
    try {
      await dbService.updateCoupon(c.id, { is_active: !c.is_active });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this coupon?')) return;
    try {
      await dbService.deleteCoupon(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Please provide a coupon code.');
      return;
    }

    setIsSaving(true);
    try {
      const couponPayload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        minimum_order_amount: Number(minimumOrderAmount) || 0,
        maximum_discount_amount: Number(maximumDiscountAmount) || 0,
        usage_limit: Number(usageLimit) || 100,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive
      };

      if (editingCoupon) {
        await dbService.updateCoupon(editingCoupon.id, couponPayload);
      } else {
        await dbService.addCoupon(couponPayload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save coupon:', err);
      alert(err.message || 'Failed to save coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview Calculations on cart value ₹600
  const sampleCart = 600;
  const calculatedDiscount =
    discountType === 'percentage'
      ? Math.min((sampleCart * (discountValue || 0)) / 100, maximumDiscountAmount || 9999)
      : Math.min(discountValue || 0, sampleCart);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <TicketPercent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Offers & Promo Coupons</h1>
            <p className="text-xs text-gray-500">Configure promotional discounts, festive campaigns, and order savings</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Promo Coupon</span>
        </button>
      </div>

      {/* Quick KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-500">Active Coupons</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{stats.activeCoupons}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Ready for checkout</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-500">Total Created</span>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{stats.totalCoupons}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Historical catalog</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-500">Total Redemptions</span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">{stats.totalRedemptions}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Applied in orders</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-500">Customer Savings</span>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
            ₹{stats.totalSavings.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">Estimated gross savings</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupons by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Tab filters */}
        <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-xl p-1 text-xs">
          {(['all', 'active', 'scheduled', 'expired'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                tab === t ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400 text-xs">
            <TicketPercent className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700">No promo coupons found</p>
            <p className="text-gray-400 mt-1">Create your first coupon using the button above.</p>
          </div>
        ) : (
          filteredCoupons.map((coupon) => {
            const isCouponActive =
              coupon.is_active &&
              new Date() <= new Date(coupon.end_date ? `${coupon.end_date}T23:59:59` : Date.now());

            return (
              <div
                key={coupon.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col justify-between space-y-4 relative group hover:border-emerald-200 transition-all"
              >
                <div>
                  {/* Top Bar: Code and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 tracking-wider">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Copy code"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCouponActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isCouponActive ? 'Active' : 'Inactive / Expired'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    {coupon.description || 'Special promo discount for customers'}
                  </p>

                  {/* Discount details */}
                  <div className="mt-3 p-2.5 bg-gray-50 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Discount:</span>
                      <span className="font-bold text-emerald-800">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}% OFF (Up to ₹${coupon.maximum_discount_amount || 100})`
                          : `₹${coupon.discount_value} FLAT OFF`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Min Order: ₹{coupon.minimum_order_amount}</span>
                      <span>Redeemed: {coupon.usage_count || 0} / {coupon.usage_limit || 500}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer: Validity & Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-gray-400">
                    Valid till: <strong>{new Date(coupon.end_date).toLocaleDateString()}</strong>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleStatus(coupon)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      {coupon.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      className="p-1.5 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">
                  {editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 font-bold">Coupon Code *</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase tracking-wider font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Campaign Description</label>
                <input
                  type="text"
                  placeholder="e.g. 15% OFF on fresh grocery orders over ₹299"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Amount Discount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Discount Value ({discountType === 'percentage' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minimumOrderAmount}
                    onChange={(e) => setMinimumOrderAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maximumDiscountAmount}
                    onChange={(e) => setMaximumDiscountAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Valid From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded-md border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-gray-800">Coupon is Active</span>
                  </label>
                </div>
              </div>

              {/* Live Savings Sandbox Preview */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Discount Calculation Preview (on ₹{sampleCart} Cart)
                </span>
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span>Customer Pays: ₹{sampleCart - calculatedDiscount}</span>
                  <span className="text-emerald-700">You Save: ₹{calculatedDiscount}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
