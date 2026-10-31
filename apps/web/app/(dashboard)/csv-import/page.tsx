'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { apiRequest } from '@/lib/api';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Loader2, ArrowRight } from 'lucide-react';

const SAMPLE_CSV = `name,email,company,phone,city,state,taxId
Horizon Logistics,accounts@horizonlogistics.in,Horizon Logistics Ltd,+91 98111 22334,Chennai,Tamil Nadu,33AABCH1234K1Z2
Quantum AI Labs,billing@quantumlabs.ai,Quantum AI Labs Inc,+91 98111 55667,Gurugram,Haryana,06AABCQ9988P1Z5
Starlight Media,finance@starlightmedia.co,Starlight Media Group,+91 98111 88990,Bengaluru,Karnataka,29AABCS4433D1Z9`;

export default function CsvImportPage() {
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [validating, setValidating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    setValidating(true);
    setResult(null);
    try {
      const res = await apiRequest('/api/csv-import/preview', {
        method: 'POST',
        body: JSON.stringify({ csvContent }),
      });
      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        alert(res.message || 'Validation failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!preview?.previewRows || preview.validCount === 0) return;

    setImporting(true);
    try {
      const res = await apiRequest('/api/csv-import/execute', {
        method: 'POST',
        body: JSON.stringify({ rows: preview.previewRows }),
      });
      if (res.success && res.data) {
        setResult(res.data);
        setPreview(null);
      } else {
        alert(res.message || 'Import failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="CSV Customer Migration Wizard"
          subtitle="Migrate legacy customer portfolios with automated schema mapping, syntax validation, and duplicate detection."
          badge="DATA IMPORTER"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Input Panel */}
          <div className="odoo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-heading font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText size={16} className="text-[#714B67]" />
                CSV Dataset
              </span>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-xs text-[#714B67] dark:text-purple-300 hover:underline font-semibold flex items-center gap-1">
                  <UploadCloud size={13} />
                  <span>Upload .csv file</span>
                  <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => setCsvContent(SAMPLE_CSV)}
                  className="text-xs text-zinc-500 hover:underline font-semibold"
                >
                  Reset Demo
                </button>
              </div>
            </div>

            <textarea
              rows={11}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full font-mono text-xs p-3.5 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] text-zinc-900 dark:text-zinc-100 shadow-inner"
            />

            <button
              onClick={handleValidate}
              disabled={validating || !csvContent.trim()}
              className="btn-odoo-primary w-full py-2.5 text-xs font-bold justify-center disabled:opacity-50"
            >
              {validating ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              <span>Validate & Preview CSV Payload</span>
            </button>
          </div>

          {/* Validation & Preview Panel */}
          <div className="odoo-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                Validation & Duplicate Inspection
              </h3>

              {preview ? (
                <div className="space-y-4 text-xs">
                  {/* Summary pills */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold tracking-wider">Valid Rows</span>
                      <p className="text-2xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400 tabular-nums">{preview.validCount}</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-bold tracking-wider">Duplicates</span>
                      <p className="text-2xl font-extrabold font-heading text-amber-600 dark:text-amber-400 tabular-nums">{preview.duplicateCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
                      <span className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold tracking-wider">Errors</span>
                      <p className="text-2xl font-extrabold font-heading text-rose-600 dark:text-rose-400 tabular-nums">{preview.errorCount}</p>
                    </div>
                  </div>

                  {/* Duplicate warnings */}
                  {preview.duplicates?.length > 0 && (
                    <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">Duplicate Rows Skipped:</span>
                      <div className="space-y-1">
                        {preview.duplicates.map((d: any, i: number) => (
                          <div key={i} className="text-[11px] text-amber-700 dark:text-amber-400">
                            Row {d.row}: {d.email} ({d.reason})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ready to import table */}
                  {preview.previewRows?.length > 0 && (
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1.5">
                        Parsed Records Ready for Ingestion:
                      </span>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-48 overflow-y-auto">
                        {preview.previewRows.map((r: any, i: number) => (
                          <div key={i} className="p-2.5 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            <div>
                              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{r.name}</strong>
                              <span className="text-zinc-400 ml-2 font-mono">({r.email})</span>
                            </div>
                            <span className="text-zinc-500 font-medium">{r.company || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : result ? (
                <div className="py-12 text-center text-xs space-y-2">
                  <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
                  <p className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    {result.message || 'Import Execution Succeeded!'}
                  </p>
                  <p className="text-zinc-500">
                    <strong className="text-emerald-600 font-bold">{result.importedCount}</strong> new customer organizations persisted into PostgreSQL.
                  </p>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-zinc-400">
                  <UploadCloud size={40} className="mx-auto mb-2 opacity-40 text-[#714B67]" />
                  <p className="font-semibold text-zinc-600 dark:text-zinc-400">Awaiting CSV Payload</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Click "Validate & Preview" to analyze headers, check emails, and filter duplicates.</p>
                </div>
              )}
            </div>

            {preview && preview.validCount > 0 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                <button
                  onClick={handleExecuteImport}
                  disabled={importing}
                  className="btn-odoo-primary bg-emerald-600 hover:bg-emerald-700 w-full py-2.5 text-xs font-bold justify-center shadow-md"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Execute Database Ingestion ({preview.validCount} Accounts)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
