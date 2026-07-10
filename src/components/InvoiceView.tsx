import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  ArrowLeft,
  Printer,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
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

  const formatNum = (val: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  const curSymbol =
    invoice.enableIndianGST || invoice.currency === 'INR' || invoice.currency === '₹'
      ? '₹'
      : invoice.currency === '$' || invoice.currency === 'USD'
      ? '$'
      : invoice.currency === '€' || invoice.currency === 'EUR'
      ? '€'
      : invoice.currency || '';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-invoice-canvas');
    if (!element) return;

    setIsDownloadingPdf(true);

    try {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
      clone.querySelectorAll('.hidden.print\\:block').forEach(el => {
        (el as HTMLElement).style.display = 'block';
      });
      clone.style.position = 'fixed';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.width = '850px';
      clone.style.background = '#ffffff';
      clone.style.padding = '40px';
      clone.style.zIndex = '-1';
      document.body.appendChild(clone);

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 850,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please use Print / Save instead.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const daysLeft = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = (daysLeft < 0 || invoice.status === 'overdue') && invoice.status !== 'paid';

  const hasCGST = invoice.items.some((it: any) => it.cgstAmount || it.sgstAmount);
  const hasIGST = invoice.items.some((it: any) => it.igstAmount);

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

      {/* Overdue Banner Warning (hidden on print) */}
      {isOverdue && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-center gap-3 print:hidden max-w-4xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" style={{ animationDuration: '3s' }} />
          <div>
            <span className="font-bold text-sm block">Account Overdue</span>
            <span className="text-xs text-rose-600 block mt-0.5">
              This invoice has exceeded its credit terms. Expected date: {invoice.dueDate} ({Math.abs(daysLeft)} days late).
            </span>
          </div>
        </div>
      )}

      {/* CLASSIC TAX INVOICE DOCUMENT */}
      <div
        id="printable-invoice-canvas"
        className="bg-white border-2 border-slate-900 max-w-4xl mx-auto text-slate-900 font-sans print:border-slate-900"
        style={{ fontSize: '11px' }}
      >
        {/* Top strip */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 px-3 py-1.5">
          <span className="font-bold text-[10px]">Original for Recipient</span>
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {invoice.enableIndianGST ? 'Tax Invoice' : 'Invoice'}
          </span>
        </div>

        {/* Company Name */}
        <div className="text-center py-3 border-b-2 border-slate-900">
          <h1 className="text-lg font-extrabold flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            {invoice.senderDetails.name || 'Tallybird Issuer'}
          </h1>
          {invoice.senderDetails.address && (
            <p className="text-[10px] text-slate-600 mt-1 px-4">{invoice.senderDetails.address}</p>
          )}
        </div>

        {/* PAN / GSTIN / IRN block */}
        <div className="grid grid-cols-2 border-b-2 border-slate-900 text-[10px]">
          <div className="p-2 border-r border-slate-900 space-y-0.5">
            {invoice.senderDetails.panNo && (
              <p><span className="font-bold">PAN No.</span> {invoice.senderDetails.panNo}</p>
            )}
            {invoice.senderDetails.phone && (
              <p><span className="font-bold">Phone:</span> {invoice.senderDetails.phone}</p>
            )}
          </div>
          <div className="p-2 space-y-0.5">
            {invoice.senderDetails.gstin && (
              <p><span className="font-bold">GSTIN No.</span> {invoice.senderDetails.gstin}</p>
            )}
            {invoice.senderDetails.email && (
              <p><span className="font-bold">Email:</span> {invoice.senderDetails.email}</p>
            )}
            {invoice.irnNo && (
              <p className="break-all"><span className="font-bold">IRN NO.:</span> {invoice.irnNo}</p>
            )}
            {invoice.ackNo && (
              <p><span className="font-bold">ACK. NO.:</span> {invoice.ackNo}</p>
            )}
          </div>
        </div>

        {/* Invoice No / State Code / Date */}
        <div className="grid grid-cols-3 border-b-2 border-slate-900 text-[10px] p-2">
          <p><span className="font-bold">Invoice No.:</span> {invoice.invoiceNumber}</p>
          <p className="text-center">
            <span className="font-bold">State Code:</span> {invoice.senderDetails.stateCode || '-'}
          </p>
          <p className="text-right"><span className="font-bold">Dated</span> {invoice.date}</p>
        </div>

        {/* Consignee / Recipient */}
        <div className={`grid ${invoice.consigneeDetails ? 'grid-cols-2' : 'grid-cols-1'} border-b-2 border-slate-900 text-[10px]`}>
          {invoice.consigneeDetails && (
            <div className="p-2 border-r border-slate-900">
              <p className="font-bold underline mb-1">Details of Consignee (Delivery at)</p>
              <p className="font-bold">{invoice.consigneeDetails.name}</p>
              <p className="text-slate-600">{invoice.consigneeDetails.address}</p>
              <div className="flex justify-between mt-1">
                <span>GSTIN {invoice.consigneeDetails.gstin || '-'}</span>
                <span>State Code: {invoice.consigneeDetails.stateCode || '-'}</span>
              </div>
              {invoice.consigneeDetails.phone && <p>Phone {invoice.consigneeDetails.phone}</p>}
            </div>
          )}
          <div className="p-2">
            <p className="font-bold underline mb-1">Details of Recipient (Billed To)</p>
            <p className="font-bold">{invoice.clientDetails.name}</p>
            <p className="text-slate-600">{invoice.clientDetails.address}</p>
            <div className="flex justify-between mt-1">
              <span>GSTIN {invoice.clientDetails.gstin || '-'}</span>
              <span>State Code: {invoice.clientDetails.stateCode || '-'}</span>
            </div>
            {invoice.clientDetails.phone && <p>Phone {invoice.clientDetails.phone}</p>}
          </div>
        </div>

        {/* Challan / Vehicle / Eway */}
        {(invoice.challanNo || invoice.vehicleNo || invoice.ewayBillNo) && (
          <div className="grid grid-cols-3 border-b-2 border-slate-900 text-[10px] p-2">
            <p><span className="font-bold">Challan No.</span> {invoice.challanNo || '-'}</p>
            <p className="text-center"><span className="font-bold">Vehicle</span> {invoice.vehicleNo || '-'}</p>
            <p className="text-right"><span className="font-bold">EWAY BILL No.</span> {invoice.ewayBillNo || '-'}</p>
          </div>
        )}

        {/* Items Table */}
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="border-r border-slate-900 p-1">Sr.</th>
              {invoice.enableIndianGST && <th className="border-r border-slate-900 p-1">HSN/SAC</th>}
              <th className="border-r border-slate-900 p-1 text-left">Description</th>
              <th className="border-r border-slate-900 p-1">Qty</th>
              <th className="border-r border-slate-900 p-1">Rate</th>
              <th className="border-r border-slate-900 p-1">Taxable Value</th>
              {hasCGST && <th className="border-r border-slate-900 p-1">CGST %</th>}
              {hasCGST && <th className="border-r border-slate-900 p-1">CGST Amt</th>}
              {hasCGST && <th className="border-r border-slate-900 p-1">SGST %</th>}
              {hasCGST && <th className="border-r border-slate-900 p-1">SGST Amt</th>}
              {hasIGST && <th className="border-r border-slate-900 p-1">IGST %</th>}
              {hasIGST && <th className="border-r border-slate-900 p-1">IGST Amt</th>}
              <th className="p-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-300">
                <td className="border-r border-slate-900 p-1 text-center">{idx + 1}</td>
                {invoice.enableIndianGST && (
                  <td className="border-r border-slate-900 p-1 text-center">{item.hsnSac || '-'}</td>
                )}
                <td className="border-r border-slate-900 p-1">
                  {item.name}
                  {item.description ? <span className="text-slate-500"> ({item.description})</span> : null}
                </td>
                <td className="border-r border-slate-900 p-1 text-center">{item.quantity}</td>
                <td className="border-r border-slate-900 p-1 text-right">{formatNum(item.price)}</td>
                <td className="border-r border-slate-900 p-1 text-right">
                  {formatNum(item.taxableValue ?? item.price * item.quantity * (1 - (item.discount || 0) / 100))}
                </td>
                {hasCGST && (
                  <td className="border-r border-slate-900 p-1 text-center">{item.cgstRate ? `${item.cgstRate}%` : '-'}</td>
                )}
                {hasCGST && (
                  <td className="border-r border-slate-900 p-1 text-right">{item.cgstAmount ? formatNum(item.cgstAmount) : '-'}</td>
                )}
                {hasCGST && (
                  <td className="border-r border-slate-900 p-1 text-center">{item.sgstRate ? `${item.sgstRate}%` : '-'}</td>
                )}
                {hasCGST && (
                  <td className="border-r border-slate-900 p-1 text-right">{item.sgstAmount ? formatNum(item.sgstAmount) : '-'}</td>
                )}
                {hasIGST && (
                  <td className="border-r border-slate-900 p-1 text-center">{item.igstRate ? `${item.igstRate}%` : '-'}</td>
                )}
                {hasIGST && (
                  <td className="border-r border-slate-900 p-1 text-right">{item.igstAmount ? formatNum(item.igstAmount) : '-'}</td>
                )}
                <td className="p-1 text-right font-bold">{formatNum(item.total)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-900 font-bold">
              <td
                className="border-r border-slate-900 p-1"
                colSpan={invoice.enableIndianGST ? 4 : 3}
              >
                Totals :
              </td>
              <td className="border-r border-slate-900 p-1 text-right">{formatNum(invoice.subtotal)}</td>
              {hasCGST && <td className="border-r border-slate-900 p-1"></td>}
              {hasCGST && <td className="border-r border-slate-900 p-1 text-right">{formatNum(invoice.cgstTotal || 0)}</td>}
              {hasCGST && <td className="border-r border-slate-900 p-1"></td>}
              {hasCGST && <td className="border-r border-slate-900 p-1 text-right">{formatNum(invoice.sgstTotal || 0)}</td>}
              {hasIGST && <td className="border-r border-slate-900 p-1"></td>}
              {hasIGST && <td className="border-r border-slate-900 p-1 text-right">{formatNum(invoice.igstTotal || 0)}</td>}
              <td className="p-1 text-right">{formatNum(invoice.grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals summary */}
        <div className="border-t-2 border-slate-900 p-2 flex flex-col items-end space-y-0.5 text-[11px]">
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between w-64">
              <span>Discount Total</span>
              <span>-{formatNum(invoice.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between w-64">
            <span>Total Value:</span>
            <span>{formatNum(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between w-64 font-bold">
            <span>Grand Total</span>
            <span>{formatNum(invoice.grandTotal)}</span>
          </div>
          {invoice.roundOff !== undefined && invoice.roundOff !== 0 && (
            <div className="flex justify-between w-64">
              <span>R/O +/-</span>
              <span>{invoice.roundOff > 0 ? '+' : ''}{formatNum(invoice.roundOff)}</span>
            </div>
          )}
          <div className="flex justify-between w-64 font-bold border-t border-slate-900 pt-1">
            <span>Net Amount</span>
            <span>
              {curSymbol}
              {formatNum(
                invoice.enableIndianGST && invoice.netAmount !== undefined ? invoice.netAmount : invoice.grandTotal
              )}
            </span>
          </div>
        </div>

        {/* Amount in words */}
        {invoice.amountInWords && (
          <div className="border-t-2 border-slate-900 p-2 text-[11px] font-semibold">
            {invoice.enableIndianGST ? 'Rupees:' : 'Amount:'} {invoice.amountInWords}
          </div>
        )}

        {/* Bank details */}
        {(invoice.senderDetails.bankName || invoice.senderDetails.accountNumber) && (
          <div className="border-t-2 border-slate-900 p-2 text-[10px]">
            <span className="font-bold">Bank Details:</span> {invoice.senderDetails.bankName}
            {invoice.senderDetails.bankBranch ? `, Branch ${invoice.senderDetails.bankBranch}` : ''}
            {invoice.senderDetails.accountNumber ? `, Account No. ${invoice.senderDetails.accountNumber}` : ''}
            {invoice.senderDetails.ifscCode ? `, IFSC Code: ${invoice.senderDetails.ifscCode}` : ''}
          </div>
        )}

        {/* Terms and Signatory */}
        <div className="border-t-2 border-slate-900 grid grid-cols-2 text-[10px]">
          <div className="p-2 space-y-1">
            {invoice.terms && invoice.terms.length > 0 ? (
              invoice.terms.map((term: string, i: number) => <p key={i}>{i + 1}. {term}</p>)
            ) : (
              <>
                <p>1. Goods once sold will not be taken back.</p>
                <p>2. Interest @ 24% p.a. on payments not received within 30 days.</p>
              </>
            )}
            {invoice.reverseCharge && (
              <p className="pt-1"><span className="font-bold">GST Payable on Reverse Charge:</span> {invoice.reverseCharge}</p>
            )}
            {invoice.notes && (
              <p className="pt-1 text-slate-600 italic">{invoice.notes}</p>
            )}
          </div>
          <div className="p-2 text-right flex flex-col justify-end border-l border-slate-900">
            <p className="font-bold">For {invoice.senderDetails.name || 'Tallybird'}</p>
            <div className="h-12"></div>
            <p className="font-bold">Authorised Signatory</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-900 p-2 text-center text-[9px] text-slate-500">
          Statement issued via Tallybird. E. &amp; O. E. Thank you for your business!
        </div>
      </div>
    </div>
  );
}
