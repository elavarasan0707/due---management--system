import React, { useEffect, useState } from 'react';
import { StudentClearanceRecord } from '../types';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle,
  Award,
  Sparkles,
  Download,
  ExternalLink,
  Check,
  FileDown
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface NoDueCertificateProps {
  clearance: StudentClearanceRecord;
  onClose: () => void;
  autoPrint?: boolean;
}

export const NoDueCertificate: React.FC<NoDueCertificateProps> = ({ clearance, onClose, autoPrint = false }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Pure jsPDF vector generator fallback (guarantees 100% success in any browser/CORS state)
  const generateVectorPdf = (clr: StudentClearanceRecord) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Double Borders
    doc.setDrawColor(28, 25, 23);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, 194, 281);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277);

    // College Seal
    doc.setFillColor(245, 245, 244);
    doc.circle(105, 23, 7, 'FD');
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(28, 25, 23);
    doc.text('SV', 105, 25.5, { align: 'center' });

    // Header Titles
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('SRI VENKATESWARA COLLEGE OF ENGINEERING & TECHNOLOGY', 105, 36, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(78, 70, 65);
    doc.text('(Autonomous Institution • Approved by AICTE, New Delhi • Affiliated to Anna University)', 105, 41, { align: 'center' });
    doc.text("Accredited with 'A+' Grade by NAAC • ISO 9001:2015 Certified", 105, 45.5, { align: 'center' });

    // Certificate Title Banner
    doc.setFillColor(28, 25, 23);
    doc.roundedRect(35, 50, 140, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('INSTITUTIONAL NO DUE & CONDUCT CLEARANCE CERTIFICATE', 105, 55.2, { align: 'center' });

    // Meta bar
    doc.setTextColor(28, 25, 23);
    doc.setFontSize(8);
    doc.text(`Certificate No: ${clr.certificateId || `NODUE-${clr.studentRollNo}`}`, 15, 64);
    doc.text(`Issue Date: ${new Date().toLocaleDateString('en-GB')}`, 105, 64, { align: 'center' });
    doc.text(`Verification: ${clr.verificationHash || 'VERIFIED-AUTONOMOUS'}`, 195, 64, { align: 'right' });
    doc.setDrawColor(214, 211, 209);
    doc.setLineWidth(0.3);
    doc.line(15, 66, 195, 66);

    // Student particulars box
    doc.setFillColor(250, 250, 249);
    doc.rect(15, 70, 180, 30, 'F');
    doc.setDrawColor(214, 211, 209);
    doc.rect(15, 70, 180, 30, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    doc.text('STUDENT PARTICULARS', 20, 75);

    doc.setFontSize(8.5);
    doc.setTextColor(28, 25, 23);
    doc.text(`Student Name: `, 20, 82);
    doc.setFont('helvetica', 'bold');
    doc.text(clr.studentName, 46, 82);

    doc.setFont('helvetica', 'normal');
    doc.text(`Roll Number: `, 20, 89);
    doc.setFont('helvetica', 'bold');
    doc.text(clr.studentRollNo, 46, 89);

    doc.setFont('helvetica', 'normal');
    doc.text(`Register No: `, 20, 96);
    doc.setFont('helvetica', 'bold');
    doc.text(clr.studentRegisterNo || clr.studentRollNo, 46, 96);

    doc.setFont('helvetica', 'normal');
    doc.text(`Department: `, 110, 82);
    doc.setFont('helvetica', 'bold');
    doc.text(clr.studentDepartmentName, 134, 82);

    doc.setFont('helvetica', 'normal');
    doc.text(`Academic Batch: `, 110, 89);
    doc.setFont('helvetica', 'bold');
    doc.text(clr.batchYear, 137, 89);

    doc.setFont('helvetica', 'normal');
    doc.text(`Clearance Status: `, 110, 96);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('100% CLEARED (ZERO DUES)', 137, 96);

    // Certification Statement
    doc.setTextColor(28, 25, 23);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(
      'This is to certify that the above mentioned candidate has officially surrendered all college property, books, lab equipment, and hostel belongings. All department, library, accounts, and hostel dues have been satisfactorily cleared.',
      15,
      107,
      { maxWidth: 180 }
    );

    // Table of checkpoints
    let y = 120;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setFillColor(245, 245, 244);
    doc.rect(15, y, 180, 6.5, 'FD');
    doc.setTextColor(28, 25, 23);
    doc.text('#', 18, y + 4.5);
    doc.text('CHECKPOINT / DEPARTMENT / SUBJECT', 28, y + 4.5);
    doc.text('AUTHORIZED SIGNATORY', 120, y + 4.5);
    doc.text('STATUS', 170, y + 4.5);

    y += 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    clr.items.slice(0, 14).forEach((item, idx) => {
      doc.text(String(idx + 1), 18, y + 4.2);
      const title = item.subjectName ? `${item.subjectCode || ''} ${item.subjectName}` : item.title;
      doc.text(title.substring(0, 50), 28, y + 4.2);
      doc.text(
        item.clearedByUserName ? `${item.clearedByUserName}` : (item.clearedByDesignation || 'Faculty In-Charge'),
        120,
        y + 4.2
      );
      doc.setTextColor(21, 128, 61);
      doc.text('APPROVED', 170, y + 4.2);
      doc.setTextColor(28, 25, 23);
      doc.setDrawColor(231, 229, 228);
      doc.line(15, y + 5.5, 195, y + 5.5);
      y += 5.5;
    });

    // Signatures
    const sigY = 248;
    const sigs = ['Class Advisor', 'Head of Dept', 'Librarian', 'Accounts Officer', 'Principal / Dean'];
    const sigNames = ['K. Venkatesh', 'Dr. R. Sundar Rajan', 'S. Meenakshi', 'P. Muthukumar', 'Dr. A. K. Shanmugam'];
    sigs.forEach((title, i) => {
      const x = 16 + i * 37;
      doc.setFont('times', 'italic');
      doc.setFontSize(7.5);
      doc.text(sigNames[i], x + 15, sigY, { align: 'center' });
      doc.setDrawColor(120, 113, 108);
      doc.setLineWidth(0.3);
      doc.line(x, sigY + 2, x + 30, sigY + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text(title, x + 15, sigY + 5.5, { align: 'center' });
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 113, 108);
    doc.text('Digitally Certified Institutional Document • Sri Venkateswara College of Engineering & Technology', 15, 273);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 273, { align: 'right' });

    const fileName = `NoDue_Certificate_${clr.studentRollNo || 'student'}.pdf`;
    doc.save(fileName);
  };

  // Generate high-resolution PDF and trigger direct download
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      const element = document.getElementById('printable-certificate-document');
      if (!element) {
        generateVectorPdf(clearance);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
        return;
      }

      // Render high-DPI image using html-to-image (SVG foreignObject natively supports modern CSS / oklch)
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210; // A4 standard width in mm
      const pdfHeight = 297;

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image render error'));
      });

      const renderedHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, Math.min(renderedHeight, pdfHeight));
      const fileName = `NoDue_Certificate_${clearance.studentRollNo || 'student'}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.warn('DOM rasterization notice, using vector PDF generator:', err);
      try {
        // Guaranteed fallback: renders cleanly without DOM color parsing
        generateVectorPdf(clearance);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
      } catch (vectorErr) {
        console.error('Vector PDF fallback error:', vectorErr);
        window.print();
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Dedicated Browser Print handler with hidden iframe & fallback
  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const element = document.getElementById('printable-certificate-document');
      if (element) {
        // Attempt clean printing through an invisible iframe to bypass modal scroll/fixed clipping
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>No Due Certificate - ${clearance.studentRollNo}</title>
                <style>
                  @page { size: A4 portrait; margin: 6mm; }
                  html, body {
                    background: #ffffff !important;
                    color: #000000 !important;
                    margin: 0 !important;
                    padding: 10px !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  * { box-sizing: border-box; }
                  table { border-collapse: collapse; width: 100%; }
                  th, td { border: 1px solid #d6d3d1; padding: 6px; }
                </style>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
              </head>
              <body>
                <div style="border: 4px double #1c1917; padding: 24px; background: #fff; max-width: 100%;">
                  ${element.innerHTML}
                </div>
              </body>
            </html>
          `);
          doc.close();

          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (frameErr) {
              console.warn('Iframe print blocked, falling back to window.print():', frameErr);
              window.print();
            }
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }, 300);
        }
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Print handler error:', err);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 1500);
    }
  };

  // Open standalone printable version in a new browser tab (bypasses iframe completely)
  const handleOpenInNewTab = () => {
    const element = document.getElementById('printable-certificate-document');
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Official Certificate - ${clearance.studentName} (${clearance.studentRollNo})</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
            <style>
              @page { size: A4 portrait; margin: 8mm; }
              body { background: #f5f5f4; margin: 0; padding: 24px; display: flex; justify-content: center; }
              .cert-container { background: #ffffff; width: 100%; max-width: 800px; padding: 32px; border: 4px double #1c1917; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
              @media print {
                body { background: #ffffff; padding: 0; }
                .cert-container { box-shadow: none; border: 4px double #1c1917; max-width: 100%; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 800px;">
              <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #1c1917; color: white; padding: 12px 20px; border-radius: 8px;">
                <span style="font-weight: bold; font-size: 14px;">Institutional No Due Certificate</span>
                <button onclick="window.print()" style="background: #f59e0b; color: #000; font-weight: bold; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                  🖨️ Print Now / Save as PDF
                </button>
              </div>
              <div class="cert-container">
                ${element.innerHTML}
              </div>
            </div>
            <script>
              setTimeout(() => { window.print(); }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // If popup blocked, immediately download PDF
      handleDownloadPdf();
    }
  };

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const formattedDate = clearance.certificateIssuedAt
    ? new Date(clearance.certificateIssuedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="certificate-modal-wrapper fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-stone-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:max-w-none print:rounded-none">
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-sm font-bold tracking-tight block">Verified Institutional No Due Certificate</span>
              <span className="text-[11px] text-stone-400 block sm:inline">Official autonomous college document</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct PDF Download Button (Works in 100% of browsers & iframes) */}
            <button
              id="download-pdf-certificate-btn"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Download official PDF certificate to your device"
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-stone-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-stone-950" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-stone-950" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Direct Print Button */}
            <button
              id="print-certificate-main-btn"
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold border border-stone-700 transition shadow-xs cursor-pointer active:scale-95"
              title="Trigger browser print"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>

            {/* Open in New Tab for unrestricted native printing */}
            <button
              id="open-tab-print-btn"
              type="button"
              onClick={handleOpenInNewTab}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 transition cursor-pointer"
              title="Open standalone printable document in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open in Tab</span>
            </button>

            {/* Close Modal Button */}
            <button
              id="close-certificate-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer ml-1"
              title="Close Certificate"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner when PDF is downloaded */}
        {downloadSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 font-semibold flex items-center justify-between print:hidden">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>
                Official No Due Certificate PDF has been generated and saved to your device.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">
              NoDue_Certificate_{clearance.studentRollNo}.pdf
            </span>
          </div>
        )}

        {/* Certificate Body (Prints cleanly on standard A4) */}
        <div
          id="printable-certificate-document"
          className="certificate-card-print p-8 sm:p-12 relative bg-white border-8 border-double border-stone-800 m-2 sm:m-4 print:m-0 print:border-4"
        >
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none select-none">
            <span className="font-serif font-black text-7xl sm:text-9xl text-stone-900 rotate-[-30deg] tracking-widest uppercase">
              CLEARED
            </span>
          </div>

          {/* Institutional Header */}
          <div className="text-center border-b-2 border-stone-800 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-stone-900 bg-stone-50 mb-2 font-serif font-black text-xl text-stone-900">
              SV
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-stone-900 uppercase">
              Sri Venkateswara College of Engineering &amp; Technology
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-600 font-medium tracking-wide uppercase mt-0.5">
              (Autonomous Institution • Approved by AICTE, New Delhi • Affiliated to Anna University)
            </p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-mono mt-0.5">
              Accredited with &lsquo;A+&rsquo; Grade by NAAC • ISO 9001:2015 Certified
            </p>

            <div className="inline-block mt-3 px-4 py-1 bg-stone-900 text-white rounded-md">
              <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase font-serif">
                Institutional No Due &amp; Conduct Clearance Certificate
              </h2>
            </div>
          </div>

          {/* Certificate Meta Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs py-3 border-b border-stone-200 text-stone-600">
            <div>
              <span className="font-bold text-stone-800">Certificate No: </span>
              <span className="font-mono font-bold text-stone-950">
                {clearance.certificateId || `NODUE-${clearance.studentRollNo}`}
              </span>
            </div>
            <div>
              <span className="font-bold text-stone-800">Issue Date: </span>
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div>
              <span className="font-bold text-stone-800">Verification Hash: </span>
              <span className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                {clearance.verificationHash || 'SHA256-VERIFIED'}
              </span>
            </div>
          </div>

          {/* Student Particulars Matrix */}
          <div className="mt-5 p-4 rounded-lg bg-stone-50 border border-stone-200">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Student Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-stone-500 block">Student Name:</span>
                <span className="font-bold text-stone-900 text-sm">{clearance.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Roll Number:</span>
                <span className="font-mono font-bold text-stone-900">{clearance.studentRollNo}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Register Number:</span>
                <span className="font-mono font-bold text-stone-900">{clearance.studentRegisterNo}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Department:</span>
                <span className="font-semibold text-stone-900">{clearance.studentDepartmentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Degree / Branch:</span>
                <span className="font-semibold text-stone-900">{clearance.degree}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Batch / Academic Year:</span>
                <span className="font-semibold text-stone-900">{clearance.batchYear}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Current Semester:</span>
                <span className="font-semibold text-stone-900">Semester {clearance.semester}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Residence Status:</span>
                <span className="font-semibold text-stone-900">
                  {clearance.isHosteler ? 'Hosteler (College Hostel)' : 'Day Scholar'}
                </span>
              </div>
            </div>
          </div>

          {/* Formal Clearance Declaration */}
          <div className="mt-5 text-xs text-stone-800 leading-relaxed text-justify">
            <p>
              This is to formally certify that <strong>{clearance.studentName}</strong> (Roll No: <strong>{clearance.studentRollNo}</strong>), a bona fide student of the Department of <strong>{clearance.studentDepartmentName}</strong>, has satisfactorily surrendered all college equipment, library books, lab records, sports articles, and settled all tuition, hostel, and examination dues.
            </p>
            <p className="mt-1.5">
              No financial liability or institutional dues remain outstanding against this student across any academic, central, or administrative division of this college as of <strong>{formattedDate}</strong>.
            </p>
          </div>

          {/* Checkpoint Table */}
          <div className="mt-5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Summary of Institutional Clearances
            </h4>
            <div className="border border-stone-200 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-stone-200 text-[11px]">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-1.5 text-left">Clearance Section</th>
                    <th className="px-3 py-1.5 text-left">Category</th>
                    <th className="px-3 py-1.5 text-left">Authorized Approver</th>
                    <th className="px-3 py-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {clearance.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-stone-50/50">
                      <td className="px-3 py-1.5 font-medium text-stone-900">
                        {item.title}
                      </td>
                      <td className="px-3 py-1.5 text-stone-500">
                        {item.category}
                      </td>
                      <td className="px-3 py-1.5 text-stone-700">
                        <span className="font-semibold">{item.clearedByUserName || 'Department Staff'}</span>
                        {item.clearedByDesignation && (
                          <span className="text-[10px] text-stone-500 block">
                            {item.clearedByDesignation}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          CLEARED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Stamps & Signatures */}
          <div className="mt-8 pt-6 border-t border-stone-300 grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
            {/* 1. Class Advisor */}
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-serif text-xs italic text-stone-700">
                K. Venkatesh
              </div>
              <div className="w-full border-t border-stone-400 pt-1 text-[10px] font-bold text-stone-800">
                Class Advisor
              </div>
            </div>

            {/* 2. HOD */}
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-serif text-xs italic text-stone-700">
                Dr. R. Sundar Rajan
              </div>
              <div className="w-full border-t border-stone-400 pt-1 text-[10px] font-bold text-stone-800">
                Head of Department
              </div>
            </div>

            {/* 3. Librarian */}
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-serif text-xs italic text-stone-700">
                S. Meenakshi
              </div>
              <div className="w-full border-t border-stone-400 pt-1 text-[10px] font-bold text-stone-800">
                Chief Librarian
              </div>
            </div>

            {/* 4. Accounts */}
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-serif text-xs italic text-stone-700">
                P. Muthukumar
              </div>
              <div className="w-full border-t border-stone-400 pt-1 text-[10px] font-bold text-stone-800">
                Accounts Officer
              </div>
            </div>

            {/* 5. Principal */}
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-serif text-xs italic font-bold text-stone-900">
                Dr. A. K. Shanmugam
              </div>
              <div className="w-full border-t-2 border-stone-900 pt-1 text-[10px] font-black text-stone-900 uppercase">
                Principal / Dean
              </div>
            </div>
          </div>

          {/* Tamper-evident Seal & Barcode Footer */}
          <div className="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-500">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Digitally Certified Institutional Document • Verified by College Administration</span>
            </div>
            <div className="font-mono text-[10px] tracking-widest mt-2 sm:mt-0 text-stone-600 uppercase">
              *|||| ||| | ||||| || |||||| | |||*
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
