import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import * as users from '../services/users.service.js';
import * as authService from '../services/auth.service.js';
import * as notifications from '../services/notifications.service.js';
import { updateMeBody, changePasswordBody } from '../schemas/users.schema.js';
import { listNotificationsQuery } from '../schemas/notifications.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { ok, noContent, paginated } from '../utils/http.js';
import { initialsOf } from '../lib/uid.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const u = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!u) throw ApiError.notFound();
    return ok(res, {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      roleLevel: u.roleLevel,
      region: u.region,
      uid: u.uid,
      avatarUrl: u.avatarUrl,
      phone: u.phone,
      preferences: u.preferences ?? null,
      initials: initialsOf(u.firstName, u.lastName, u.email),
      lastLoginAt: u.lastLoginAt,
    });
  }),
);

router.patch(
  '/',
  validate(updateMeBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const body = req.body as {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      phone?: string | null;
      preferences?: Record<string, unknown>;
    };
    await users.updateMe(req.user.id, body);
    return ok(res, { ok: true });
  }),
);

router.post(
  '/password',
  validate(changePasswordBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return noContent(res);
  }),
);

router.get(
  '/notifications',
  validate(listNotificationsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows, meta } = await notifications.listForUser(req.user, req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.post(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await notifications.markAllRead(req.user);
    return noContent(res);
  }),
);

router.post(
  '/notifications/:id/read',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await notifications.markRead(req.user, paramId(req));
    return noContent(res);
  }),
);

export default router;
