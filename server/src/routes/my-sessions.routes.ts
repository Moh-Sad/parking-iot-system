import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validated } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, paginated } from '../utils/http.js';
import * as svc from '../services/my-sessions.service.js';
import { chargingHistoryQuery, type ChargingHistoryQuery } from '../schemas/finances.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate, requireRole('USER', 'ADMIN'));

router.get(
  '/active',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const session = await svc.getActiveSession(req.user.id);
    return ok(res, session);
  }),
);

router.post(
  '/active/stop',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await svc.stopActiveSession(req.user.id);
    return ok(res, result);
  }),
);

router.get(
  '/history',
  validate(chargingHistoryQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const q = validated<ChargingHistoryQuery>(req, 'query');
    const { rows, meta } = await svc.chargingHistory(req.user.id, q);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/:id/receipt',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const receipt = await svc.getReceipt(req.user.id, paramId(req));
    return ok(res, receipt);
  }),
);

export default router;
