'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Plus,
  Eye,
  Mail,
  Building,
  Phone,
  X,
  CheckCircle2,
  Calendar,
  Receipt,
  Repeat,
  Loader2,
  MapPin,
  FileText,
  Clock,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'activity'>('overview');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    taxId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        status: statusFilter,
      });
      const res = await apiRequest(`/api/customers?${query.toString()}`);
      if (res.success && res.data) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  }

  async function handleViewCustomer(id: string) {
    setSelectedCustomer(id);
    setActiveTab('overview');
    setDetailLoading(true);
    try {
      const res = await apiRequest(`/api/customers/${id}`);
      if (res.success && res.data) {
        setCustomerDetails(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          addressLine1: '',
          city: '',
          state: '',
          postalCode: '',
          taxId: '',
        });
        fetchCustomers();
      } else {
        alert(res.message || 'Failed to create customer');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    } finally {
      setSubmitting(false);
    }
  }

  // Get initials for customer avatar
  const getInitials = (name: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel Header */}
        <ControlPanel
          title="Customer Directory"
          subtitle="Manage client organizations, billing profiles, and recurring subscription lifecycles."
          badge={pagination.total ? `${pagination.total} accounts` : undefined}
          primaryAction={{
            label: 'New Customer',
            icon: Plus,
            onClick: () => setShowAddModal(true),
          }}
          search={{
            value: search,
            onChange: setSearch,
            onSubmit: handleSearch,
            placeholder: 'Search by customer name, email, company, code...',
          }}
          filter={{
            label: 'Status',
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setPage(1);
            },
            options: [
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'ARCHIVED', label: 'Archived' },
            ],
          }}
        />

        {/* Customer Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Subscriptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading customer records...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <Users size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No customers found</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Try altering your search or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleViewCustomer(c.id)}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                        {c.customerNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</p>
                            {c.taxId && <span className="text-[10px] text-zinc-400 font-mono">GST: {c.taxId}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {c.company ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Building size={13} className="text-zinc-400" />
                            {c.company}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-zinc-400" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                            <Phone size={12} />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {c.city ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-zinc-400" />
                            {c.city}, {c.state || ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {c._count?.subscriptions || 0} active
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCustomer(c.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-[#714B67] hover:text-[#714B67] dark:hover:text-purple-300 transition-colors shadow-sm"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-[#F9FAFB]/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing page <strong className="text-zinc-900 dark:text-zinc-100">{pagination.page}</strong> of{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{pagination.totalPages}</strong> ({pagination.total} records)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 font-medium hover:bg-zinc-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 font-medium hover:bg-zinc-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Detail Drawer / Modal (Odoo Form View Style) */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                    {getInitials(customerDetails?.customer?.name || 'CU')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
                        {customerDetails?.customer?.name || 'Customer Profile'}
                      </h3>
                      {customerDetails?.customer?.status && (
                        <StatusBadge status={customerDetails.customer.status} />
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#714B67] dark:text-purple-300 mt-0.5">
                      Account ID: {customerDetails?.customer?.customerNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-16 text-center text-zinc-500">
                  <Loader2 size={28} className="animate-spin mx-auto text-[#714B67] mb-2" />
                  Loading account profile...
                </div>
              ) : customerDetails ? (
                <div className="py-4 space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold gap-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className={`pb-2.5 transition-colors border-b-2 -mb-px ${
                        activeTab === 'overview'
                          ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                          : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      Overview & Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('subscriptions')}
                      className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === 'subscriptions'
                          ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                          : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      <span>Subscriptions</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px]">
                        {customerDetails.customer.subscriptions?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('invoices')}
                      className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === 'invoices'
                          ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                          : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      <span>Invoices & Ledger</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px]">
                        {customerDetails.customer.invoices?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('activity')}
                      className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === 'activity'
                          ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                          : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      <span>Audit Activity</span>
                    </button>
                  </div>

                  {/* Tab 1: Overview */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                        <div>
                          <span className="text-zinc-400 block mb-0.5 font-medium">Company Name</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
                            {customerDetails.customer.company || '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5 font-medium">Email Address</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
                            {customerDetails.customer.email}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5 font-medium">Phone</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
                            {customerDetails.customer.phone || '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5 font-medium">GSTIN / Tax ID</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-mono">
                            {customerDetails.customer.taxId || '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5 font-medium">Address</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
                            {customerDetails.customer.addressLine1 || '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5 font-medium">City, State & Postal</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
                            {customerDetails.customer.city || '—'}, {customerDetails.customer.state || ''} {customerDetails.customer.postalCode || ''}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Subscriptions */}
                  {activeTab === 'subscriptions' && (
                    <div className="space-y-3">
                      {customerDetails.customer.subscriptions?.length > 0 ? (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                          {customerDetails.customer.subscriptions.map((sub: any) => (
                            <div key={sub.id} className="p-3.5 flex justify-between items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                              <div>
                                <span className="font-bold text-[#714B67] dark:text-purple-300 font-mono">
                                  {sub.subscriptionNumber}
                                </span>
                                <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                                  {sub.plan.name}
                                </span>
                                <span className="ml-2 text-zinc-400">({sub.billingInterval})</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                  {formatCurrency(sub.totalAmount)}
                                </span>
                                <StatusBadge status={sub.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No subscriptions recorded for this account.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Invoices */}
                  {activeTab === 'invoices' && (
                    <div className="space-y-3">
                      {customerDetails.customer.invoices?.length > 0 ? (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                          {customerDetails.customer.invoices.map((inv: any) => (
                            <div key={inv.id} className="p-3.5 flex justify-between items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                              <div>
                                <span className="font-bold text-[#714B67] dark:text-purple-300 font-mono">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="ml-3 text-zinc-400">{formatDate(inv.invoiceDate)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                    {formatCurrency(inv.totalAmount)}
                                  </span>
                                  {Number(inv.outstandingAmount) > 0 && (
                                    <span className="ml-2 text-rose-600 font-bold tabular-nums">
                                      (Due: {formatCurrency(inv.outstandingAmount)})
                                    </span>
                                  )}
                                </div>
                                <StatusBadge status={inv.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No invoices generated for this account yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Activity Log */}
                  {activeTab === 'activity' && (
                    <div className="space-y-3">
                      {customerDetails.timeline?.length > 0 ? (
                        <div className="space-y-3 pl-3 border-l-2 border-[#714B67]">
                          {customerDetails.timeline.map((act: any, i: number) => (
                            <div key={i} className="text-xs relative">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{act.title}</span>
                              <p className="text-zinc-500 mt-0.5">{act.description}</p>
                              <span className="text-[10px] text-zinc-400 font-mono">{formatDate(act.date)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No audit activity logged.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300">
                    <Users size={18} />
                  </div>
                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                    Add New Customer Organization
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Primary Contact / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 text-xs font-medium"
                    placeholder="e.g. Acme Tech Solutions"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Billing Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 text-xs font-medium"
                      placeholder="billing@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Company Legal Entity
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 text-xs font-medium"
                      placeholder="Acme Pvt Ltd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 text-xs font-medium"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 text-xs font-medium uppercase font-mono"
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 text-xs font-medium"
                    placeholder="Floor 4, Cyber City"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      placeholder="Bengaluru"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      placeholder="Karnataka"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono"
                      placeholder="560100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-odoo-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-odoo-primary text-xs"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    <span>Save Customer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
