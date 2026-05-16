import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/notifications.service.js';
import { createNotificationBody } from '../schemas/notifications.schema.js';
import { created } from '../utils/http.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.post(
  '/',
  validate(createNotificationBody),
  asyncHandler(async (req, res) => {
    const n = await svc.create(req.body as never);
    return created(res, n);
  }),
);

export default router;
