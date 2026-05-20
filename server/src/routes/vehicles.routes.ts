import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/vehicles.service.js';
import { listVehiclesQuery, plateParam } from '../schemas/vehicles.schema.js';
import { ok, paginated } from '../utils/http.js';
import { param } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listVehiclesQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { rows, meta } = await svc.listVehicles(req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/:plateNumber',
  validate(plateParam, 'params'),
  asyncHandler(async (req, res) => {
    const v = await svc.getVehicleByPlate(param(req, 'plateNumber'));
    return ok(res, v);
  }),
);

export default router;
