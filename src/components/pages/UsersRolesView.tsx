import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Copy,
  Sparkles,
  Shield,
  Eye,
  Sliders,
  RotateCcw,
  Save
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { dbService } from '../../services/dbService';

interface UsersRolesViewProps {
  users: User[];
  roles: UserRole[];
  onRefresh: () => void;
}

const MODULES = [
  { id: 'dashboard', label: 'Executive Dashboard' },
  { id: 'orders', label: 'Orders & Dispatch Management' },
  { id: 'delivery_boys', label: 'Delivery Couriers & Fleet' },
  { id: 'customers', label: 'Customer Accounts & Addresses' },
  { id: 'products', label: 'Products & Inventory Catalog' },
  { id: 'categories', label: 'Categories' },
  { id: 'zones', label: 'Municipal Delivery Zones' },
  { id: 'vehicles', label: 'Fleet Vehicles' },
  { id: 'payments', label: 'Payment Ledger & COD Settlements' },
  { id: 'returns_cancellations', label: 'Returns & Cancellations' },
  { id: 'coupons', label: 'Promo Coupons & Offers' },
  { id: 'reports', label: 'Business Intelligence & Reports' },
  { id: 'notifications', label: 'Notification Broadcast Center' },
  { id: 'users_roles', label: 'Users & RBAC Administration' },
  { id: 'settings', label: 'Database & System Settings' },
];

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  users,
  roles,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles_matrix'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // User Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [generatedTempPass, setGeneratedTempPass] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  // User Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('dispatcher');
  const [userStatus, setUserStatus] = useState<'pending' | 'active' | 'inactive' | 'suspended'>('active');
  const [tempPassword, setTempPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Role for Permission Matrix Editing
  const [matrixRole, setMatrixRole] = useState<string>(roles[0]?.id || 'operations_manager');
  const [localPermissions, setLocalPermissions] = useState<Record<string, any>>({});
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  const [matrixSaveSuccess, setMatrixSaveSuccess] = useState(false);

  // Sync selected role permissions when matrixRole changes
  React.useEffect(() => {
    const r = roles.find((role) => role.id === matrixRole);
    if (r && r.permissions) {
      setLocalPermissions(JSON.parse(JSON.stringify(r.permissions)));
    }
  }, [matrixRole, roles]);

  // -------------------------------------------------------------
  // USER FILTERING
  // -------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone || '').includes(searchQuery);

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSelectedRole('dispatcher');
    setUserStatus('active');
    const randomPass = generateStrongPassword();
    setTempPassword(randomPass);
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setFirstName(u.first_name);
    setLastName(u.last_name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setSelectedRole(u.role);
    setUserStatus(u.status);
    setTempPassword('');
    setIsAddUserModalOpen(true);
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'Hari#';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Please fill in required name and email fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await dbService.updateUser(editingUser.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          role: selectedRole,
          status: userStatus
        });
      } else {
        await dbService.addUser({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          role: selectedRole,
          status: userStatus,
          password: tempPassword
        });
      }

      setIsAddUserModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      alert(err.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await dbService.updateUser(user.id, { status: nextStatus });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this administrator / staff user account?')) return;
    try {
      await dbService.deleteUser(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleOpenResetPassword = (user: User) => {
    setResettingUser(user);
    const newPass = generateStrongPassword();
    setGeneratedTempPass(newPass);
    setCopiedPass(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!resettingUser) return;
    try {
      await dbService.resetUserPassword(resettingUser.id, generatedTempPass, 'manual');
      alert(`Password successfully reset for ${resettingUser.email}!`);
      setResettingUser(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const handlePermissionToggle = (moduleKey: string, permKey: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage') => {
    setLocalPermissions((prev) => {
      const currentModule = prev[moduleKey] || { view: false, create: false, edit: false, delete: false, export: false, manage: false };
      const updated = {
        ...prev,
        [moduleKey]: {
          ...currentModule,
          [permKey]: !currentModule[permKey]
        }
      };
      return updated;
    });
  };

  const handleSaveRolePermissions = async () => {
    setIsSavingMatrix(true);
    try {
      await dbService.updateRole(matrixRole, { permissions: localPermissions });
      setMatrixSaveSuccess(true);
      setTimeout(() => setMatrixSaveSuccess(false), 2500);
      onRefresh();
    } catch (err) {
      console.error('Failed to save role permissions:', err);
      alert('Failed to update role permissions.');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users & RBAC Access Control</h1>
            <p className="text-xs text-gray-500">Manage administrator roles, fine-grained permission matrices, and dispatch staff</p>
          </div>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={handleOpenAddUser}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Staff User</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xs text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Staff ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles_matrix')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'roles_matrix' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Role Permissions Matrix</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="All">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const roleObj = roles.find((r) => r.id === u.role);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{u.full_name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{u.phone || 'No phone'}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'operations_manager' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'dispatcher' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {roleObj ? roleObj.name : u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            u.status === 'suspended' ? 'bg-rose-100 text-rose-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenResetPassword(u)}
                              className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles_matrix' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">Fine-Grained Role Permissions Matrix</h3>
                <p className="text-xs text-gray-500">Configure access rights per system role across all application modules</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-700">Role:</span>
                  <select
                    value={matrixRole}
                    onChange={(e) => setMatrixRole(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveRolePermissions}
                  disabled={isSavingMatrix}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMatrix ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>

            {matrixSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-bold animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Role permissions successfully updated and synchronized to Supabase!</span>
              </div>
            )}

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-y border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">System Module</th>
                    <th className="py-3 px-4 text-center">View</th>
                    <th className="py-3 px-4 text-center">Create</th>
                    <th className="py-3 px-4 text-center">Edit</th>
                    <th className="py-3 px-4 text-center">Delete</th>
                    <th className="py-3 px-4 text-center">Export</th>
                    <th className="py-3 px-4 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MODULES.map((mod) => {
                    const perms = localPermissions[mod.id] || {
                      view: false,
                      create: false,
                      edit: false,
                      delete: false,
                      export: false,
                      manage: false
                    };

                    return (
                      <tr key={mod.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{mod.label}</td>
                        {(['view', 'create', 'edit', 'delete', 'export', 'manage'] as const).map((pKey) => (
                          <td key={pKey} className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={!!perms[pKey]}
                              onChange={() => handlePermissionToggle(mod.id, pKey)}
                              className="w-4 h-4 text-emerald-700 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">
                  {editingUser ? 'Edit User Account' : 'Provision Staff User'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">System Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Account Status</label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="active">Active (Full access permitted)</option>
                  <option value="inactive">Inactive (Temporarily disabled)</option>
                  <option value="suspended">Suspended (Access blocked)</option>
                </select>
              </div>

              {!editingUser && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                    <span>Generated Temporary Password</span>
                    <button
                      type="button"
                      onClick={() => setTempPassword(generateStrongPassword())}
                      className="text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-generate</span>
                    </button>
                  </div>
                  <div className="font-mono text-sm font-bold text-purple-800 bg-white p-2 rounded-lg border border-purple-100">
                    {tempPassword}
                  </div>
                  <p className="text-[10px] text-purple-700">
                    Staff member will be prompted to replace this temporary password upon first authentication.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Reset Credentials</h3>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600">
                Resetting password for <strong>{resettingUser.full_name}</strong> ({resettingUser.email}).
              </p>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                  <span>New Temporary Password:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTempPass);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="text-amber-800 hover:text-amber-950 font-bold flex items-center space-x-1"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-base font-bold text-amber-900 bg-white p-2.5 rounded-lg border border-amber-200 text-center tracking-wider">
                  {generatedTempPass}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setResettingUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
              >
                Apply New Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
