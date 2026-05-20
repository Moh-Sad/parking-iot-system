import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface InvoicePdfInput {
  code: string;
  clientName: string;
  stationName: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  billTo: { name: string; address: string[] };
  lineItems: { label: string; description: string; totalCents: number }[];
  subtotalCents: number;
  taxCents: number;
  grandTotalCents: number;
  currency: string;
}

const fmt = (cents: number, currency: string): string =>
  `${currency} ${(cents / 100).toFixed(2)}`;

export function streamInvoicePdf(res: Response, inv: InvoicePdfInput): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${inv.code}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text('INVOICE', { align: 'right' });
  doc.fontSize(10).text(`# ${inv.code}`, { align: 'right' });
  doc.text(`Status: ${inv.status}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(12).text('Parking IoT', 50, 50);
  doc.fontSize(9).text('Smart EV Charging & Parking', 50, 68);

  doc.moveDown(2);
  doc.fontSize(11).text('Bill to:');
  doc.fontSize(10).text(inv.billTo.name);
  for (const line of inv.billTo.address) doc.text(line);

  doc.moveDown();
  doc.fontSize(10);
  doc.text(`Client: ${inv.clientName}`);
  doc.text(`Node: ${inv.stationName}`);
  doc.text(`Issued: ${inv.issueDate.toISOString().slice(0, 10)}`);
  doc.text(`Due: ${inv.dueDate.toISOString().slice(0, 10)}`);

  doc.moveDown();
  const tableTop = doc.y;
  doc.fontSize(10).text('Item', 50, tableTop);
  doc.text('Description', 200, tableTop);
  doc.text('Amount', 0, tableTop, { align: 'right' });
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

  let y = tableTop + 25;
  for (const li of inv.lineItems) {
    doc.text(li.label, 50, y, { width: 140 });
    doc.text(li.description, 200, y, { width: 250 });
    doc.text(fmt(li.totalCents, inv.currency), 0, y, { align: 'right' });
    y += 25;
  }

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).stroke();
  y += 15;
  doc.text(`Subtotal: ${fmt(inv.subtotalCents, inv.currency)}`, 0, y, { align: 'right' });
  y += 15;
  doc.text(`Tax: ${fmt(inv.taxCents, inv.currency)}`, 0, y, { align: 'right' });
  y += 15;
  doc.fontSize(12).text(`Total: ${fmt(inv.grandTotalCents, inv.currency)}`, 0, y, { align: 'right' });

  doc.end();
}
