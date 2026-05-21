import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/settings.service.js';
import { patchSettingsBody, getSettingsQuery } from '../schemas/settings.schema.js';
import { ok } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(getSettingsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const reveal = Boolean((req.query as { reveal?: boolean }).reveal) && req.user.role === 'ADMIN';
    const settings = await svc.getSettings(reveal);
    return ok(res, settings);
  }),
);

router.patch(
  '/',
  requireRole('ADMIN'),
  validate(patchSettingsBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const settings = await svc.patchSettings(req.user.id, req.body as never);
    return ok(res, settings);
  }),
);

router.post(
  '/network-secret/rotate',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await svc.rotateNetworkSecret(req.user.id);
    return ok(res, result);
  }),
);

export default router;
