/**
 * Certificate PDF builder (v100.4.0)
 * Generates a printable A4-landscape PDF embedding the captured
 * certificate card image (which already includes the QR code), plus
 * text fallback: serial, course, student name and the verification
 * link — so the PDF stays useful even without the image.
 */
export interface CertificatePdfData {
  imageBase64?: string; // PNG data URL or plain base64
  studentName?: string;
  courseTitle?: string;
  serial: string;
  issuedDate?: string;
  verifyUrl: string;
}

export function buildCertificateHtml(data: CertificatePdfData): string {
  const img = data.imageBase64
    ? `<img src="data:image/png;base64,${data.imageBase64}" style="max-width: 92%; border-radius: 16px;" />`
    : '';
  const name = escapeHtml(data.studentName || '');
  const course = escapeHtml(data.courseTitle || '');
  const serial = escapeHtml(data.serial);
  const date = escapeHtml(data.issuedDate || '');
  const url = escapeHtml(data.verifyUrl);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    background: #ffffff;
    color: #0f172a;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px;
    text-align: center;
  }
  .org { font-size: 15px; font-weight: 700; color: #00288E; }
  h1 { font-size: 26px; color: #001A6B; margin: 10px 0 4px; }
  .sub { font-size: 13px; color: #475569; margin-bottom: 16px; }
  .card { margin: 6px 0 14px; }
  .meta {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 20px;
    font-size: 13px;
    color: #1e293b;
    line-height: 1.9;
    margin-bottom: 14px;
  }
  .meta b { color: #00288E; }
  .verify { font-size: 11px; color: #64748b; direction: ltr; }
  .footer {
    margin-top: 18px;
    font-size: 11px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="org">Resala Association — Training Centers | جمعية رسالة — مراكز التدريب</div>
  <h1>Certificate of Course Completion | شهادة إتمام دورة تدريبية</h1>
  <div class="sub">Certified by Masar RTC — مسار RTC</div>
  ${img ? `<div class="card">${img}</div>` : ''}
  <div class="meta">
    <div>Student / المتدرب: <b>${name || '—'}</b></div>
    <div>Course / الدورة: <b>${course || '—'}</b></div>
    <div>Serial / الرقم التسلسلي: <b>${serial}</b></div>
    ${date ? `<div>Issue date / تاريخ الإصدار: <b>${date}</b></div>` : ''}
  </div>
  <div class="verify">Verify authenticity at: ${url}</div>
  <div class="footer">Issued by Resala Training Centers (RTC) — free training for Egypt's youth</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

import { Platform } from 'react-native';
import * as Print from 'expo-print';

export async function printCertificateHtml(html: string): Promise<string | undefined> {
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    return undefined;
  } else {
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }
}
