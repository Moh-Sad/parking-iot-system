import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authLoginLimiter, recoveryLimiter } from '../middleware/rateLimit.js';
import {
  loginBody,
  refreshBody,
  logoutBody,
  recoveryBody,
  resetBody,
  completeAccessBody,
} from '../schemas/auth.schema.js';
import * as auth from '../services/auth.service.js';
import { ok, noContent } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

router.post(
  '/login',
  authLoginLimiter,
  validate(loginBody),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await auth.login(email, password, {
      ip: req.ip,
      userAgent: req.header('user-agent') ?? undefined,
    });
    return ok(res, result);
  }),
);

router.post(
  '/refresh',
  validate(refreshBody),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await auth.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.header('user-agent') ?? undefined,
    });
    return ok(res, result);
  }),
);

router.post(
  '/logout',
  authenticate,
  validate(logoutBody),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    await auth.logout(refreshToken);
    return noContent(res);
  }),
);

router.post(
  '/recovery',
  recoveryLimiter,
  validate(recoveryBody),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    await auth.startRecovery(email);
    return ok(res, { ok: true });
  }),
);

router.post(
  '/reset',
  validate(resetBody),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };
    await auth.resetPassword(token, password);
    return ok(res, { ok: true });
  }),
);

router.post(
  '/access/complete',
  authenticate,
  validate(completeAccessBody),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { firstName, lastName, password } = req.body as {
      firstName: string;
      lastName: string;
      password?: string;
    };
    await auth.completeAccess(req.user.id, firstName, lastName, password);
    return ok(res, { ok: true });
  }),
);

export default router;
