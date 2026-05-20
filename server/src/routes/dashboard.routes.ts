import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/dashboard.service.js';
import { ok } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(authenticate);

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await svc.stats(req.user);
    return ok(res, result);
  }),
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 10));
    const rows = await svc.recentTransactions(req.user, limit);
    return ok(res, rows);
  }),
);

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const h = await svc.health();
    return ok(res, h);
  }),
);

router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 5));
    const a = await svc.alerts(req.user, limit);
    return ok(res, a);
  }),
);

export default router;
