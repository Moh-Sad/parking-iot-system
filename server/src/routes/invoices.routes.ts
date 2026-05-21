import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/invoices.service.js';
import {
  listInvoicesQuery,
  createInvoiceBody,
  updateInvoiceBody,
  shareInvoiceBody,
} from '../schemas/invoices.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { ok, created, noContent, paginated } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { streamCsv } from '../lib/csv.js';
import { streamInvoicePdf } from '../lib/pdf.js';
import { sendMail } from '../lib/mailer.js';
import PDFDocument from 'pdfkit';
import { paramId, queryObj } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listInvoicesQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows, meta } = await svc.listInvoices(req.user, req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/export.csv',
  validate(listInvoicesQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows } = await svc.listInvoices(req.user, { ...queryObj(req), limit: 1000 });
    const flat = rows.map((r) => ({
      id: r.id,
      code: r.code,
      client: r.client,
      node: r.node,
      issueDate: r.date.toISOString(),
      amount: r.amount,
      currency: r.currency,
      status: r.status,
    }));
    streamCsv(res, 'invoices.csv', (async function* () {
      for (const row of flat) yield row;
    })());
  }),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const inv = await svc.getInvoice(req.user, paramId(req));
    return ok(res, inv);
  }),
);

router.get(
  '/:id/pdf',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const inv = await svc.getInvoice(req.user, paramId(req));
    streamInvoicePdf(res, {
      code: inv.code,
      clientName: inv.clientName,
      stationName: inv.station.name,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      status: inv.status,
      billTo: inv.billTo as unknown as { name: string; address: string[] },
      lineItems: inv.lineItems,
      subtotalCents: inv.subtotalCents,
      taxCents: inv.taxCents,
      grandTotalCents: inv.grandTotalCents,
      currency: inv.currency,
    });
  }),
);

router.post(
  '/:id/share',
  validate(idParam, 'params'),
  validate(shareInvoiceBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const inv = await svc.getInvoice(req.user, paramId(req));
    const { to, message } = req.body as { to: string[]; message?: string };

    const buffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(20).text(`INVOICE ${inv.code}`);
      doc.fontSize(10).text(`Client: ${inv.clientName}`);
      doc.text(`Total: ${inv.currency} ${(inv.grandTotalCents / 100).toFixed(2)}`);
      doc.end();
    });

    await sendMail({
      to,
      subject: `Invoice ${inv.code}`,
      html: `<p>${message ?? 'Please find your invoice attached.'}</p>`,
      attachments: [{ filename: `invoice-${inv.code}.pdf`, content: buffer, contentType: 'application/pdf' }],
    });
    return ok(res, { ok: true });
  }),
);

router.post(
  '/',
  requireRole('ADMIN'),
  validate(createInvoiceBody),
  asyncHandler(async (req, res) => {
    const inv = await svc.createInvoice(req.body as never);
    return created(res, inv);
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate(idParam, 'params'),
  validate(updateInvoiceBody),
  asyncHandler(async (req, res) => {
    const inv = await svc.updateInvoice(paramId(req), req.body as never);
    return ok(res, inv);
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    await svc.deleteInvoice(paramId(req));
    return noContent(res);
  }),
);

export default router;
