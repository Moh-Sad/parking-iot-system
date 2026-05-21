import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/assignments.service.js';
import {
  createAssignmentBody,
  listAssignmentsQuery,
  patchAssignmentBody,
  closeAssignmentBody,
} from '../schemas/assignments.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { ok, created, paginated } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listAssignmentsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows, meta } = await svc.listAssignments(req.user, req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.post(
  '/',
  validate(createAssignmentBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await svc.createAssignment(req.user, req.body as never);
    return created(res, result);
  }),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    const a = await svc.getAssignment(paramId(req));
    return ok(res, a);
  }),
);

router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(patchAssignmentBody),
  asyncHandler(async (req, res) => {
    const a = await svc.patchAssignment(paramId(req), req.body as never);
    return ok(res, a);
  }),
);

router.post(
  '/:id/close',
  validate(idParam, 'params'),
  validate(closeAssignmentBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { departureTime } = req.body as { departureTime?: Date };
    const a = await svc.closeAssignment(req.user, paramId(req), departureTime);
    return ok(res, a);
  }),
);

export default router;
