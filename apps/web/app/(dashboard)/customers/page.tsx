'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  Filter,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Customer Directory
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Manage client organizations, billing profiles, and lifecycle history.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="odoo-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
              <input
                type="text"
                placeholder="Search by customer name, email, company, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67] dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#714B67] text-white hover:bg-[#55364E]"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={15} className="text-[#737373]" />
            <span className="text-xs font-medium text-[#737373]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67] dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
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
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading customer records...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      <Users size={32} className="mx-auto text-[#737373] mb-2 opacity-50" />
                      No customer records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleViewCustomer(c.id)}
                      className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#714B67] dark:text-purple-300">
                        {c.customerNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#252525] dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#737373] dark:text-[#A1A1AA]">
                        {c.company || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[#737373] dark:text-[#A1A1AA]">
                        <div>{c.email}</div>
                        {c.phone && <div className="text-[11px] text-[#A1A1AA]">{c.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-[#737373] dark:text-[#A1A1AA]">
                        {c.city ? `${c.city}, ${c.state || ''}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#252525] dark:text-white">
                        {c._count?.subscriptions || 0} active
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCustomer(c.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#F7F7F8] dark:bg-[#27272A] hover:bg-[#714B67] hover:text-white transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between text-xs text-[#737373]">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-[#E5E7EB] dark:border-[#3F3F46] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-[#E5E7EB] dark:border-[#3F3F46] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Detail Drawer / Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#252525] dark:text-white">
                    {customerDetails?.customer?.name || 'Customer Details'}
                  </h3>
                  <span className="text-xs font-mono text-[#714B67] dark:text-purple-300">
                    {customerDetails?.customer?.customerNumber}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-[#737373] hover:text-[#252525] dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-12 text-center text-xs text-[#737373]">
                  <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                  Loading details...
                </div>
              ) : customerDetails ? (
                <div className="py-4 space-y-6">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[#737373] block">Company</span>
                      <strong className="text-[#252525] dark:text-white">{customerDetails.customer.company || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373] block">Email</span>
                      <strong className="text-[#252525] dark:text-white">{customerDetails.customer.email}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373] block">Phone</span>
                      <strong className="text-[#252525] dark:text-white">{customerDetails.customer.phone || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373] block">GSTIN / Tax ID</span>
                      <strong className="text-[#252525] dark:text-white">{customerDetails.customer.taxId || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373] block">City & State</span>
                      <strong className="text-[#252525] dark:text-white">
                        {customerDetails.customer.city || 'N/A'}, {customerDetails.customer.state || ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737373] block">Status</span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {customerDetails.customer.status}
                      </span>
                    </div>
                  </div>

                  {/* Subscriptions */}
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#252525] dark:text-white mb-2 flex items-center gap-2">
                      <Repeat size={16} className="text-[#714B67]" />
                      Subscriptions ({customerDetails.customer.subscriptions?.length || 0})
                    </h4>
                    <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A] border border-[#E5E7EB] dark:border-[#27272A] rounded-md text-xs">
                      {customerDetails.customer.subscriptions?.map((sub: any) => (
                        <div key={sub.id} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[#714B67] dark:text-purple-300">{sub.subscriptionNumber}</span>
                            <span className="ml-2 font-medium text-[#252525] dark:text-white">{sub.plan.name}</span>
                            <span className="ml-2 text-[11px] text-[#737373]">({sub.billingInterval})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{formatCurrency(sub.totalAmount)}</span>
                            <span className="ml-3 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invoices */}
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#252525] dark:text-white mb-2 flex items-center gap-2">
                      <Receipt size={16} className="text-[#714B67]" />
                      Invoices & Billing History ({customerDetails.customer.invoices?.length || 0})
                    </h4>
                    <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A] border border-[#E5E7EB] dark:border-[#27272A] rounded-md text-xs">
                      {customerDetails.customer.invoices?.map((inv: any) => (
                        <div key={inv.id} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[#714B67] dark:text-purple-300">{inv.invoiceNumber}</span>
                            <span className="ml-2 text-[#737373]">{formatDate(inv.invoiceDate)}</span>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className="font-bold">{formatCurrency(inv.totalAmount)}</span>
                              {Number(inv.outstandingAmount) > 0 && (
                                <span className="ml-1 text-rose-600 font-medium">
                                  (Due: {formatCurrency(inv.outstandingAmount)})
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  {customerDetails.timeline?.length > 0 && (
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#252525] dark:text-white mb-2">
                        Activity Timeline
                      </h4>
                      <div className="space-y-2 text-xs border-l-2 border-[#714B67] pl-3 ml-1">
                        {customerDetails.timeline.slice(0, 5).map((act: any, i: number) => (
                          <div key={i} className="relative">
                            <span className="font-semibold text-[#252525] dark:text-white">{act.title}</span>
                            <p className="text-[#737373]">{act.description}</p>
                            <span className="text-[10px] text-[#A1A1AA]">{formatDate(act.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-lg w-full border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Add New Customer
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-[#737373] hover:text-[#252525] dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#252525] dark:text-white mb-1">Customer / Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    placeholder="e.g. Acme Tech Solutions"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="billing@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Company / Entity</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="Acme Pvt Ltd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#252525] dark:text-white mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    placeholder="Floor 4, Cyber City"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="Bengaluru"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="Karnataka"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="560100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E7EB] dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-md border border-[#E5E7EB] dark:border-[#3F3F46] text-[#737373]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center gap-1.5"
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
