import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  ArrowRight,
  FileCode,
  Image as ImageIcon,
  File as FileIcon
} from 'lucide-react';
import { Invoice } from '../types';

interface AIScannerProps {
  onImport: (scannedData: Partial<Invoice>) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const isAcceptedFile = (f: File) =>
  ACCEPTED_TYPES.includes(f.type) || f.name.toLowerCase().endsWith('.pdf');

export default function AIScanner({ onImport }: AIScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [textContext, setTextContext] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Invoice> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const convertFileToBase64 = (selectedFile: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Code = result.split(',')[1] || '';
      setFileBase64(base64Code);
    };
    reader.onerror = (error) => {
      console.error('File conversion error:', error);
      setScanError('Failed to read the selected file. Please try again.');
    };
  };

  const acceptFile = (selectedFile: File) => {
    if (isAcceptedFile(selectedFile)) {
      if (selectedFile.size > 15 * 1024 * 1024) {
        setScanError('File is too large. Please upload a file under 15MB.');
        return;
      }
      setFile(selectedFile);
      convertFileToBase64(selectedFile);
      setScanError(null);
    } else {
      setScanError('Unsupported file type. Please upload a PNG, JPEG, WebP image, or a PDF document.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      acceptFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      acceptFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileBase64('');
    setExtractedData(null);
    setScanError(null);
    setTextContext('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPdf = file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');

  const handleScan = async () => {
    if (!fileBase64 && !textContext.trim()) {
      setScanError('Please upload a file or paste invoice text context first.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setExtractedData(null);

    const authId = localStorage.getItem('tallybird_userId') || localStorage.getItem('finvoice_userId') || 'default_user';

    try {
      const response = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authId}`
        },
        body: JSON.stringify({
          base64: fileBase64 || undefined,
          mimeType: file ? (file.type || 'application/pdf') : undefined,
          text: textContext.trim() || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gemini scanning server error.');
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (err: any) {
      console.error('OCR Scanning failure:', err);
      setScanError(err.message || 'Server extraction error. Please check your API configuration.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 pb-12" id="ocr-scanner-tab">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          AI Invoice Scanner <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
        </h1>
        <p className="text-slate-500 mt-1">
          Import and digitize invoice sheets instantly using multimodal Google Gemini OCR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900">Upload Invoice Statement</h2>

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,.pdf"
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3 animate-bounce" style={{ animationDuration: '3s' }} />
                <span className="font-bold text-slate-700 text-sm">Drag and drop invoice file here</span>
                <span className="text-xs text-slate-400 mt-1.5 block">Supports PNG, JPEG, WebP, and PDF (up to 15MB)</span>
                <button
                  type="button"
                  className="mt-4 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="border border-slate-150 rounded-xl overflow-hidden p-3 bg-slate-50 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    {isPdf ? <FileIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 text-sm block truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB {isPdf ? '· PDF Document' : '· Image'}
                    </span>
                  </div>
                  <button
                    onClick={handleClear}
                    className="px-2 py-1 text-[10px] border border-slate-200 text-slate-500 hover:bg-white rounded-lg font-semibold transition"
                  >
                    Clear File
                  </button>
                </div>

                {fileBase64 && !isPdf && (
                  <div className="mt-3.5 border border-slate-200/50 rounded-lg overflow-hidden h-36 bg-white flex items-center justify-center">
                    <img
                      src={`data:${file.type};base64,${fileBase64}`}
                      alt="Invoice source"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {fileBase64 && isPdf && (
                  <div className="mt-3.5 border border-slate-200/50 rounded-lg overflow-hidden h-36 bg-white flex flex-col items-center justify-center gap-2 text-slate-400">
                    <FileIcon className="w-10 h-10 text-rose-400" />
                    <span className="text-[11px] font-semibold text-slate-500">PDF ready to scan</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  OR: Paste Invoice Text / Email Content
                </label>
                {textContext && (
                  <button
                    onClick={() => setTextContext('')}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={textContext}
                onChange={(e) => setTextContext(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-xs bg-slate-50/20 text-slate-900 placeholder:text-slate-400 font-mono"
                placeholder="Paste unformatted billing rows, tables, or email ledger text block here..."
              />
            </div>

            {scanError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{scanError}</span>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={isScanning || (!fileBase64 && !textContext.trim())}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                isScanning
                  ? 'bg-indigo-500/20 text-indigo-400 cursor-not-allowed'
                  : (!fileBase64 && !textContext.trim())
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-100'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  Extracting Ledger data...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze and Extract Invoice
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCode className="w-5 h-5 text-indigo-500" />
                  Extracted Invoice Ledger
                </h2>
                {extractedData && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Parsed
                  </span>
                )}
              </div>

              {isScanning ? (
                <div className="flex flex-col items-center justify-center text-center py-16 h-full flex-1">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Processing with Google Gemini AI</span>
                  <span className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                    Reading statement layouts, isolating billing parties, auditing itemized rows, and translating currencies...
                  </span>
                </div>
              ) : extractedData ? (
                <div className="space-y-5 flex-1 min-h-0 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Invoice Number</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                        {extractedData.invoiceNumber || 'Not identified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Billing Date</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                        {extractedData.date || 'Not identified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Client (Recipient)</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                        {extractedData.clientDetails?.name || 'Not identified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Currency</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                        {extractedData.currency || 'USD ($)'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Extracted Line Items ({extractedData.items?.length || 0})</span>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto border border-slate-50 rounded-xl p-2 bg-slate-50/30">
                      {extractedData.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-white border border-slate-100 rounded-lg">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                              {item.description || 'No description extracted'}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-slate-800 block">
                              {extractedData.currency || '$'}{item.price}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 h-full flex-1">
                  <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm">Ready for Analysis</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                    Provide an invoice image, PDF statement, or textual email context and trigger the scanner to view structured details here.
                  </p>
                </div>
              )}

              {extractedData && (
                <div className="pt-6 border-t border-slate-100 mt-5">
                  <button
                    onClick={() => onImport(extractedData)}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    Import details into billing form
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
