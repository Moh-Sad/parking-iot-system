import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validated } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, paginated } from '../utils/http.js';
import * as svc from '../services/my-finances.service.js';
import { idParam } from '../schemas/common.schema.js';
import { myInvoicesQuery, type MyInvoicesQuery } from '../schemas/finances.schema.js';
import { payInvoiceBody, type PayInvoiceBody } from '../schemas/wallet.schema.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate, requireRole('USER', 'ADMIN'));

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const summary = await svc.getSummary(req.user.id);
    return ok(res, summary);
  }),
);

router.get(
  '/invoices',
  validate(myInvoicesQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const q = validated<MyInvoicesQuery>(req, 'query');
    const { rows, meta } = await svc.listMyInvoices(req.user.id, q);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/invoices/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const invoice = await svc.getMyInvoice(req.user.id, paramId(req));
    return ok(res, invoice);
  }),
);

router.post(
  '/invoices/:id/pay',
  validate(idParam, 'params'),
  validate(payInvoiceBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<PayInvoiceBody>(req, 'body');
    const result = await svc.payInvoice(req.user.id, paramId(req), body);
    return ok(res, result);
  }),
);

// /payment-methods (and CRUD) is mounted at /me/finances/payment-methods
// via my-payment-methods.routes.ts

export default router;
