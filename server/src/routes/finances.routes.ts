import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validated } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import * as svc from '../services/finances.service.js';
import {
  kpisQuery,
  timeseriesQuery,
  dailyVolumeQuery,
  type TimeseriesQuery,
  type DailyVolumeQuery,
} from '../schemas/finances.schema.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get(
  '/kpis',
  validate(kpisQuery, 'query'),
  asyncHandler(async (_req, res) => {
    const kpis = await svc.getKpis();
    return ok(res, kpis);
  }),
);

router.get(
  '/revenue-timeseries',
  validate(timeseriesQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<TimeseriesQuery>(req, 'query');
    const points = await svc.revenueTimeseries(q);
    return ok(res, points);
  }),
);

router.get(
  '/daily-volume',
  validate(dailyVolumeQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<DailyVolumeQuery>(req, 'query');
    const points = await svc.dailyVolume(q);
    return ok(res, points);
  }),
);

export default router;
