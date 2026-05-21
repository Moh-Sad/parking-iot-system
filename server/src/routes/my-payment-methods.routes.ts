import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validated } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created, noContent } from '../utils/http.js';
import { idParam } from '../schemas/common.schema.js';
import { paramId } from '../utils/reqParse.js';
import {
  createPaymentMethodBody,
  updatePaymentMethodBody,
  type CreatePaymentMethodBody,
  type UpdatePaymentMethodBody,
} from '../schemas/payment-methods.schema.js';
import * as walletSvc from '../services/wallet.service.js';

const router = Router();
router.use(authenticate, requireRole('USER', 'ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const methods = await walletSvc.listPaymentMethods(req.user.id);
    return ok(res, methods);
  }),
);

router.post(
  '/',
  validate(createPaymentMethodBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<CreatePaymentMethodBody>(req, 'body');
    const result = await walletSvc.createPaymentMethod(req.user.id, body);
    return created(res, result);
  }),
);

router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(updatePaymentMethodBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<UpdatePaymentMethodBody>(req, 'body');
    const result = await walletSvc.updatePaymentMethod(req.user.id, paramId(req), body);
    return ok(res, result);
  }),
);

router.delete(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await walletSvc.deletePaymentMethod(req.user.id, paramId(req));
    return noContent(res);
  }),
);

export default router;
