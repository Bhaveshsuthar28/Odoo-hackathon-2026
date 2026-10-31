'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
              Intelligence Feature 4
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading mt-1">
            CSV Customer & Migration Wizard
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Migrate legacy customer portfolios with automated schema mapping, syntax validation, and duplicate detection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Input Panel */}
          <div className="odoo-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-[#252525] dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-[#714B67]" />
                CSV Dataset
              </span>
              <button
                type="button"
                onClick={() => setCsvContent(SAMPLE_CSV)}
                className="text-xs text-[#714B67] dark:text-purple-300 hover:underline font-semibold"
              >
                Reset to Sample
              </button>
            </div>

            <textarea
              rows={10}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
            />

            <button
              onClick={handleValidate}
              disabled={validating || !csvContent.trim()}
              className="w-full py-2.5 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {validating ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              <span>Validate & Preview CSV</span>
            </button>
          </div>

          {/* Validation & Preview Panel */}
          <div className="odoo-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#252525] dark:text-white mb-3">
                Validation & Duplicate Inspection
              </h3>

              {preview ? (
                <div className="space-y-4 text-xs">
                  {/* Summary pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold">Valid Rows</span>
                      <p className="text-xl font-bold font-heading text-emerald-600">{preview.validCount}</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-amber-700 uppercase font-bold">Duplicates</span>
                      <p className="text-xl font-bold font-heading text-amber-600">{preview.duplicateCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-800">
                      <span className="text-[10px] text-rose-700 uppercase font-bold">Errors</span>
                      <p className="text-xl font-bold font-heading text-rose-600">{preview.errorCount}</p>
                    </div>
                  </div>

                  {/* Duplicate warnings */}
                  {preview.duplicates?.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md">
                      <span className="font-semibold text-amber-800 block mb-1">Duplicate Rows Skipped:</span>
                      <div className="space-y-1">
                        {preview.duplicates.map((d: any, i: number) => (
                          <div key={i} className="text-[11px] text-amber-700">
                            Row {d.row}: {d.email} ({d.reason})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ready to import table */}
                  {preview.previewRows?.length > 0 && (
                    <div>
                      <span className="font-semibold text-[#252525] dark:text-white block mb-1">
                        Parsed Records Ready for Import:
                      </span>
                      <div className="divide-y border rounded-md max-h-40 overflow-y-auto">
                        {preview.previewRows.map((r: any, i: number) => (
                          <div key={i} className="p-2 flex justify-between">
                            <div>
                              <strong className="text-[#252525] dark:text-white">{r.name}</strong>
                              <span className="text-[#737373] ml-2">({r.email})</span>
                            </div>
                            <span className="text-[#737373]">{r.company || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : result ? (
                <div className="py-8 text-center text-xs space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm text-[#252525] dark:text-white">
                    {result.message || 'Import Complete!'}
                  </p>
                  <p className="text-[#737373]">
                    {result.importedCount} new customer accounts created in database.
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-[#737373]">
                  Click "Validate & Preview CSV" to analyze dataset for duplicates and format errors.
                </div>
              )}
            </div>

            {preview && preview.validCount > 0 && (
              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#27272A] mt-4">
                <button
                  onClick={handleExecuteImport}
                  disabled={importing}
                  className="w-full py-2.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Execute Database Import ({preview.validCount} Records)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
