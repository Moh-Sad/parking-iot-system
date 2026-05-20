import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validated } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/http.js';
import * as svc from '../services/wallet.service.js';
import { topUpBody, updateWalletBody, type TopUpBody, type UpdateWalletBody } from '../schemas/wallet.schema.js';

const router = Router();
router.use(authenticate, requireRole('USER', 'ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const wallet = await svc.getWallet(req.user.id);
    return ok(res, wallet);
  }),
);

router.patch(
  '/',
  validate(updateWalletBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<UpdateWalletBody>(req, 'body');
    const wallet = await svc.updateWallet(req.user.id, body);
    return ok(res, wallet);
  }),
);

router.post(
  '/top-up',
  validate(topUpBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<TopUpBody>(req, 'body');
    const wallet = await svc.topUp(req.user.id, body.amountCents, body.paymentMethodId);
    return ok(res, wallet);
  }),
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const limitRaw = (req.query as { limit?: string }).limit;
    const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));
    const transactions = await svc.listWalletTransactions(req.user.id, limit);
    return ok(res, transactions);
  }),
);

export default router;
