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
  createMyVehicleBody,
  updateMyVehicleBody,
  type CreateMyVehicleBody,
  type UpdateMyVehicleBody,
} from '../schemas/my-vehicles.schema.js';
import * as svc from '../services/my-vehicles.service.js';

const router = Router();
router.use(authenticate, requireRole('USER', 'ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const vehicles = await svc.listMyVehicles(req.user.id);
    return ok(res, vehicles);
  }),
);

router.post(
  '/',
  validate(createMyVehicleBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<CreateMyVehicleBody>(req, 'body');
    const v = await svc.createMyVehicle(req.user.id, body);
    return created(res, v);
  }),
);

router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(updateMyVehicleBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = validated<UpdateMyVehicleBody>(req, 'body');
    const v = await svc.updateMyVehicle(req.user.id, paramId(req), body);
    return ok(res, v);
  }),
);

router.delete(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await svc.deleteMyVehicle(req.user.id, paramId(req));
    return noContent(res);
  }),
);

export default router;
