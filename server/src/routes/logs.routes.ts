import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/logs.service.js';
import { listLogsQuery, logsMetricsQuery } from '../schemas/logs.schema.js';
import { ok, paginated } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { streamCsv } from '../lib/csv.js';
import { queryObj } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listLogsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows, meta } = await svc.listLogs(req.user, req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/metrics',
  validate(logsMetricsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const m = await svc.metrics(req.user, req.query as never);
    return ok(res, m);
  }),
);

router.get(
  '/export.csv',
  validate(listLogsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows } = await svc.listLogs(req.user, { ...queryObj(req), limit: 1000 });
    const flat = rows.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      component: r.component,
      user: r.user?.name ?? '',
      action: r.action,
      status: r.status,
      details: JSON.stringify(r.details ?? {}),
    }));
    streamCsv(res, 'logs.csv', (async function* () {
      for (const row of flat) yield row;
    })());
  }),
);

export default router;
