import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/stations.service.js';
import { idParam } from '../schemas/common.schema.js';
import { listStationsQuery, createStationBody, updateStationBody } from '../schemas/stations.schema.js';
import { ok, created, noContent, paginated } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listStationsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows, meta } = await svc.listStations(req.user, req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const station = await svc.getStation(req.user, paramId(req));
    return ok(res, station);
  }),
);

router.post(
  '/',
  requireRole('ADMIN'),
  validate(createStationBody),
  asyncHandler(async (req, res) => {
    const station = await svc.createStation(req.body as never);
    return created(res, station);
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate(idParam, 'params'),
  validate(updateStationBody),
  asyncHandler(async (req, res) => {
    const station = await svc.updateStation(paramId(req), req.body as never);
    return ok(res, station);
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    await svc.deleteStation(paramId(req));
    return noContent(res);
  }),
);

export default router;
