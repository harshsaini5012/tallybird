import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  ArrowLeft, 
  Printer, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Mail,
  Phone,
  MapPin,
  Building,
  Download,
  TrendingUp
} from 'lucide-react';

interface InvoiceViewProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onChangeStatus: (id: string, status: InvoiceStatus) => void;
}

export default function InvoiceView({ 
  invoice, 
  onBack, 
  onEdit, 
  onChangeStatus 
}: InvoiceViewProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  // Format currency
  const formatCur = (val: number) => {
    const cur = invoice.currency || '$';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur === '$' ? 'USD' : cur === '₹' ? 'INR' : cur === '€' ? 'EUR' : 'USD',
      maximumFractionDigits: 2
    }).format(val).replace('USD', '$').replace('INR', '₹').replace('EUR', '€');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-invoice-canvas');
    if (!element) return;
    
    setIsDownloadingPdf(true);
    
    // Find the scrollable container and cache its scroll position
    const scrollContainer = document.querySelector('main');
    const scrollTopBefore = scrollContainer ? scrollContainer.scrollTop : 0;
    
    try {
      // Temporarily scroll to top to prevent cropped/blank spots in html2canvas render
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
      
      // Wait a micro-tick for layout settling
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Retain sharp vectors/text on higher PPI displays
        useCORS: true,
        allowTaint: false, // Must be false when useCORS is true to avoid security/contamination errors on toDataURL
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.clientWidth || 850,
        windowHeight: element.clientHeight || 1200
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please use the "Print / PDF" button to print/save.');
    } finally {
      // Restore the user's scroll position
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollTopBefore;
      }
      setIsDownloadingPdf(false);
    }
  };

  const daysLeft = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = (daysLeft < 0 || invoice.status === 'overdue') && invoice.status !== 'paid';

  return (
    <div className="space-y-6 pb-12" id="invoice-view-panel">
      {/* Control Actions Header (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
        <button
          id="btn-view-back"
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl shadow-sm hover:bg-slate-50 font-medium transition flex items-center gap-2 text-xs cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ledger
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick status transitions */}
          {invoice.status !== 'paid' && (
            <button
              id="btn-view-mark-paid"
              onClick={() => onChangeStatus(invoice.id, 'paid')}
              className="px-3.5 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-xs hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Paid
            </button>
          )}

          {invoice.status === 'draft' && (
            <button
              id="btn-view-mark-sent"
              onClick={() => onChangeStatus(invoice.id, 'sent')}
              className="px-3.5 py-2 bg-amber-50 text-amber-700 font-semibold rounded-xl text-xs hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              Mark Sent
            </button>
          )}

          <button
            id="btn-view-edit"
            onClick={() => onEdit(invoice)}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl shadow-sm hover:bg-slate-50 font-medium transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            Edit
          </button>

          <button
            id="btn-view-print"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save
          </button>

          <button
            id="btn-view-download-pdf"
            disabled={isDownloadingPdf}
            onClick={handleDownloadPDF}
            className={`px-3.5 py-2 ${
              isDownloadingPdf ? 'bg-slate-600 cursor-not-allowed opacity-75' : 'bg-slate-900 hover:bg-slate-800'
            } text-white rounded-xl shadow-md transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer`}
          >
            <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? 'animate-spin' : ''}`} />
            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Document Layout (optimized for print) */}
      <div 
        className="bg-white p-8 md:p-12 rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto space-y-10 relative print:border-0 print:shadow-none print:p-0"
        id="printable-invoice-canvas"
      >
        {/* Overdue Banner Warning (hidden on print) */}
        {isOverdue && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-center gap-3 print:hidden">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" style={{ animationDuration: '3s' }} />
            <div>
              <span className="font-bold text-sm block">Account Overdue</span>
              <span className="text-xs text-rose-600 block mt-0.5">
                This invoice has exceeded its credit terms. Expected date: {invoice.dueDate} ({Math.abs(daysLeft)} days late).
              </span>
            </div>
          </div>
        )}

        {/* Header Block: Logo/Company and Invoice ID */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-emerald-600" />
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {invoice.senderDetails.name || 'Tallybird Issuer'}
              </span>
            </div>
            
            <div className="space-y-1 text-xs text-slate-500 font-medium">
              {invoice.senderDetails.address && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.senderDetails.address}
                </p>
              )}
              {invoice.senderDetails.email && (
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.senderDetails.email}
                </p>
              )}
              {invoice.senderDetails.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.senderDetails.phone}
                </p>
              )}
            </div>
          </div>

          <div className="text-left md:text-right space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 block">
              {invoice.enableIndianGST ? 'TAX INVOICE' : 'INVOICE'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              #{invoice.invoiceNumber}
            </h2>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize mt-1 ${
              invoice.status === 'paid' 
                ? 'bg-emerald-50 text-emerald-700' 
                : invoice.status === 'sent' 
                  ? 'bg-amber-50 text-amber-700' 
                  : invoice.status === 'overdue' 
                    ? 'bg-rose-50 text-rose-700' 
                    : 'bg-slate-50 text-slate-600'
            }`}>
              {invoice.status === 'sent' ? 'Pending' : invoice.status}
            </span>
          </div>
        </div>

        {/* Indian GST Specific Clearance Specifications */}
        {invoice.enableIndianGST && (invoice.irnNo || invoice.ackNo || invoice.vehicleNo || invoice.challanNo || invoice.ewayBillNo) && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-medium text-slate-600">
            {invoice.irnNo && (
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">IRN (Invoice Reference Number)</span>
                <span className="font-mono text-slate-900 break-all select-all">{invoice.irnNo}</span>
              </div>
            )}
            {invoice.ackNo && (
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Ack Details</span>
                <span className="text-slate-900 font-mono">{invoice.ackNo}</span>
              </div>
            )}
            {invoice.vehicleNo && (
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Vehicle Number</span>
                <span className="text-slate-900 font-semibold">{invoice.vehicleNo}</span>
              </div>
            )}
            {invoice.challanNo && (
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Challan No / Delivery Note</span>
                <span className="text-slate-900 font-semibold">{invoice.challanNo}</span>
              </div>
            )}
            {invoice.ewayBillNo && (
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">E-Way Bill Number</span>
                <span className="text-slate-900 font-mono">{invoice.ewayBillNo}</span>
              </div>
            )}
            {invoice.reverseCharge && (
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Reverse Charge Applicable</span>
                <span className="text-slate-900 font-semibold">{invoice.reverseCharge}</span>
              </div>
            )}
          </div>
        )}

        {/* Dates Block and Billing Parties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Billing From */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Billed From (Issuer)
            </span>
            <div className="space-y-1">
              <span className="font-extrabold text-slate-800 block text-base">
                {invoice.senderDetails.name}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                {invoice.senderDetails.address || 'No physical address specified.'}
              </p>
              {invoice.senderDetails.branchAddress && (
                <p className="text-xs text-slate-400 italic">
                  Branch: {invoice.senderDetails.branchAddress}
                </p>
              )}
              {invoice.enableIndianGST && (
                <div className="pt-2 text-xs font-semibold text-slate-700 space-y-0.5">
                  {invoice.senderDetails.gstin && (
                    <p><span className="text-slate-400 font-normal">GSTIN:</span> <span className="font-mono">{invoice.senderDetails.gstin}</span></p>
                  )}
                  {invoice.senderDetails.panNo && (
                    <p><span className="text-slate-400 font-normal">PAN No:</span> <span className="font-mono">{invoice.senderDetails.panNo}</span></p>
                  )}
                  {invoice.senderDetails.stateCode && (
                    <p><span className="text-slate-400 font-normal">State Code:</span> {invoice.senderDetails.stateCode}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Billing To */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Billed To (Recipient)
            </span>
            <div className="space-y-1">
              <span className="font-extrabold text-slate-800 block text-base">
                {invoice.clientDetails.name}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                {invoice.clientDetails.address || 'No physical address specified.'}
              </p>
              {invoice.clientDetails.email && <p className="text-xs text-slate-500">Email: {invoice.clientDetails.email}</p>}
              {invoice.clientDetails.phone && <p className="text-xs text-slate-500">Phone: {invoice.clientDetails.phone}</p>}
              {invoice.enableIndianGST && (
                <div className="pt-2 text-xs font-semibold text-slate-700 space-y-0.5">
                  {invoice.clientDetails.gstin && (
                    <p><span className="text-slate-400 font-normal">GSTIN:</span> <span className="font-mono">{invoice.clientDetails.gstin}</span></p>
                  )}
                  {invoice.clientDetails.panNo && (
                    <p><span className="text-slate-400 font-normal">PAN No:</span> <span className="font-mono">{invoice.clientDetails.panNo}</span></p>
                  )}
                  {invoice.clientDetails.stateCode && (
                    <p><span className="text-slate-400 font-normal">State Code:</span> {invoice.clientDetails.stateCode}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Consignee or Core Metadata */}
          {invoice.enableIndianGST && invoice.consigneeDetails ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Shipped To (Consignee)
              </span>
              <div className="space-y-1">
                <span className="font-extrabold text-slate-800 block text-base">
                  {invoice.consigneeDetails.name}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                  {invoice.consigneeDetails.address || 'No physical address specified.'}
                </p>
                {invoice.consigneeDetails.phone && <p className="text-xs text-slate-500">Phone: {invoice.consigneeDetails.phone}</p>}
                <div className="pt-1 text-xs font-semibold text-slate-700 space-y-0.5">
                  {invoice.consigneeDetails.gstin && (
                    <p><span className="text-slate-400 font-normal">GSTIN:</span> <span className="font-mono">{invoice.consigneeDetails.gstin}</span></p>
                  )}
                  {invoice.consigneeDetails.stateCode && (
                    <p><span className="text-slate-400 font-normal">State Code:</span> {invoice.consigneeDetails.stateCode}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-left md:text-right md:justify-self-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Ledger Specifications
              </span>
              <div className="text-xs text-slate-600 space-y-2 font-semibold">
                <p className="flex md:justify-end gap-3">
                  <span className="text-slate-400 font-medium">Date Issued:</span>
                  <span className="text-slate-800">{invoice.date}</span>
                </p>
                <p className="flex md:justify-end gap-3">
                  <span className="text-slate-400 font-medium">Due Date:</span>
                  <span className="text-slate-800">{invoice.dueDate}</span>
                </p>
                <p className="flex md:justify-end gap-3">
                  <span className="text-slate-400 font-medium">Terms:</span>
                  <span className="text-indigo-600">{invoice.paymentTerms}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mini Ledger Specs row if Consignee occupies the third column */}
        {invoice.enableIndianGST && invoice.consigneeDetails && (
          <div className="border-t border-b border-slate-100 py-3 grid grid-cols-3 gap-6 text-xs text-slate-600 font-semibold">
            <p className="flex gap-2">
              <span className="text-slate-400 font-medium">Date Issued:</span>
              <span className="text-slate-800">{invoice.date}</span>
            </p>
            <p className="flex gap-2">
              <span className="text-slate-400 font-medium">Due Date:</span>
              <span className="text-slate-800">{invoice.dueDate}</span>
            </p>
            <p className="flex gap-2">
              <span className="text-slate-400 font-medium">Payment Terms:</span>
              <span className="text-indigo-600">{invoice.paymentTerms}</span>
            </p>
          </div>
        )}

        {/* Invoice items line table */}
        <div className="border-t border-b border-slate-100 py-6">
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-slate-900 text-xs md:text-sm">
              <thead>
                <tr className="text-left font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
                  <th className="py-2.5 px-3">Billing Item</th>
                  {invoice.enableIndianGST && (
                    <th className="py-2.5 px-3">HSN/SAC</th>
                  )}
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  {invoice.items.some(it => it.discount > 0) && (
                    <th className="py-2.5 px-3 text-center">Disc %</th>
                  )}
                  {invoice.items.some(it => it.tax > 0) && (
                    <th className="py-2.5 px-3 text-center">{invoice.enableIndianGST ? 'GST %' : 'Tax %'}</th>
                  )}
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100/50">
                    <td className="py-4 px-3 font-bold text-slate-800">
                      {item.name}
                    </td>
                    {invoice.enableIndianGST && (
                      <td className="py-4 px-3 font-mono text-slate-600">
                        {item.hsnSac || '-'}
                      </td>
                    )}
                    <td className="py-4 px-3 text-slate-500 font-medium">{item.description || '-'}</td>
                    <td className="py-4 px-3 text-center">{item.quantity}</td>
                    <td className="py-4 px-3 text-right">{formatCur(item.price)}</td>
                    {invoice.items.some(it => it.discount > 0) && (
                      <td className="py-4 px-3 text-center text-emerald-600 font-bold">
                        {item.discount > 0 ? `${item.discount}%` : '-'}
                      </td>
                    )}
                    {invoice.items.some(it => it.tax > 0) && (
                      <td className="py-4 px-3 text-center text-indigo-500 font-bold">
                        {item.tax > 0 ? `${item.tax}%` : '-'}
                        {invoice.enableIndianGST && item.tax > 0 && (
                          <div className="text-[9px] text-slate-400 block font-normal font-mono">
                            {item.cgstAmount ? 'CGST/SGST' : 'IGST'}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="py-4 px-3 text-right font-extrabold text-slate-800">{formatCur(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Block: Notes & Terms on left, subtotal/tax on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Left Column: Bank info, Terms & Conditions */}
          <div className="space-y-6">
            {/* Bank details card */}
            {(invoice.senderDetails.bankName || invoice.senderDetails.accountNumber || invoice.senderDetails.ifscCode) && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Bank Settlement Coordinates</span>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-slate-700">
                  {invoice.senderDetails.bankName && (
                    <div>
                      <span className="text-[9px] block text-slate-400 font-normal uppercase">Bank Name</span>
                      {invoice.senderDetails.bankName}
                    </div>
                  )}
                  {invoice.senderDetails.accountNumber && (
                    <div>
                      <span className="text-[9px] block text-slate-400 font-normal uppercase">Account Number</span>
                      <span className="font-mono">{invoice.senderDetails.accountNumber}</span>
                    </div>
                  )}
                  {invoice.senderDetails.ifscCode && (
                    <div>
                      <span className="text-[9px] block text-slate-400 font-normal uppercase">IFSC Code</span>
                      <span className="font-mono">{invoice.senderDetails.ifscCode}</span>
                    </div>
                  )}
                  {invoice.senderDetails.bankBranch && (
                    <div>
                      <span className="text-[9px] block text-slate-400 font-normal uppercase">Branch City</span>
                      {invoice.senderDetails.bankBranch}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms and Conditions (Numbered lines from real Hira Refrigeration invoice) */}
            {invoice.terms && invoice.terms.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Terms and Conditions
                </span>
                <ul className="text-[11px] text-slate-500 leading-relaxed font-semibold space-y-1">
                  {invoice.terms.map((term, index) => (
                    <li key={index} className="flex gap-1 items-start">
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Remarks / Notes
                </span>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line font-medium bg-indigo-50/10 p-3.5 rounded-xl border border-indigo-50/30">
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Calculations */}
          <div className="space-y-4 text-sm font-semibold sm:justify-self-end w-full max-w-sm">
            <div className="flex justify-between text-slate-500">
              <span className="font-medium">Total Taxable Value</span>
              <span>{formatCur(invoice.subtotal)}</span>
            </div>

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="font-medium">Discount Total</span>
                <span>-{formatCur(invoice.discountTotal)}</span>
              </div>
            )}

            {invoice.enableIndianGST ? (
              <>
                {invoice.cgstTotal !== undefined && invoice.cgstTotal > 0 && (
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Central Tax (CGST)</span>
                    <span>+{formatCur(invoice.cgstTotal)}</span>
                  </div>
                )}
                {invoice.sgstTotal !== undefined && invoice.sgstTotal > 0 && (
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>State Tax (SGST)</span>
                    <span>+{formatCur(invoice.sgstTotal)}</span>
                  </div>
                )}
                {invoice.igstTotal !== undefined && invoice.igstTotal > 0 && (
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Integrated Tax (IGST)</span>
                    <span>+{formatCur(invoice.igstTotal)}</span>
                  </div>
                )}
              </>
            ) : (
              invoice.taxTotal > 0 && (
                <div className="flex justify-between text-indigo-500">
                  <span className="font-medium">Taxes Total</span>
                  <span>+{formatCur(invoice.taxTotal)}</span>
                </div>
              )
            )}

            {invoice.enableIndianGST && invoice.roundOff !== undefined && invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-400 text-xs font-medium">
                <span>Round Off</span>
                <span>{invoice.roundOff > 0 ? '+' : ''}{formatCur(invoice.roundOff)}</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3.5 flex justify-between items-end">
              <span className="text-base font-bold text-slate-800">
                {invoice.enableIndianGST ? 'Net Payable Amount' : 'Grand Total Due'}
              </span>
              <span className="text-2xl font-extrabold text-indigo-600">
                {formatCur(invoice.enableIndianGST && invoice.netAmount !== undefined ? invoice.netAmount : invoice.grandTotal)}
              </span>
            </div>

            {/* Rupees/Amount in words print panel */}
            {invoice.amountInWords && (
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[10px] text-slate-500 italic font-mono leading-relaxed mt-4">
                <span className="block font-bold text-slate-400 not-italic uppercase tracking-wide text-[8px] mb-0.5">Amount in Words:</span>
                {invoice.amountInWords}
              </div>
            )}
          </div>
        </div>

        {/* Visual Footer (Shown on Print) */}
        <div className="hidden print:block border-t border-slate-100 pt-8 space-y-4">
          <div className="grid grid-cols-2 text-xs font-bold text-slate-700 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Receiver's Seal & Signature</p>
              <div className="h-16 w-48 border-b border-slate-200 mt-2"></div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">for {invoice.senderDetails.name || 'Tallybird'}</p>
              <div className="h-16 w-48 border-b border-slate-200 mt-2 ml-auto"></div>
              <p className="text-[10px] text-slate-400 mt-2">Authorized Signatory</p>
            </div>
          </div>
          <div className="text-center text-[9px] text-slate-400 font-medium pt-4">
            Statement issued via Tallybird. Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}
