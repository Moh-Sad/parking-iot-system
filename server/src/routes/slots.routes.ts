import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/slots.service.js';
import { listSlotsQuery, patchSlotBody } from '../schemas/slots.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { ok } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listSlotsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await svc.listSlots(req.user, req.query as never);
    return res.status(200).json({ data: result.slots, stats: result.stats });
  }),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await svc.getSlot(req.user, paramId(req));
    return ok(res, result);
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate(idParam, 'params'),
  validate(patchSlotBody),
  asyncHandler(async (req, res) => {
    const slot = await svc.patchSlot(paramId(req), req.body as never);
    return ok(res, slot);
  }),
);

export default router;
