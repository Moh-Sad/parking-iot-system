import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as users from '../services/users.service.js';
import {
  listUsersQuery,
  createUserBody,
  updateUserBody,
  type ListUsersQuery,
} from '../schemas/users.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { ok, created, noContent, paginated } from '../utils/http.js';
import { streamCsv } from '../lib/csv.js';
import { paramId, queryObj, bodyObj } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get(
  '/',
  validate(listUsersQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { rows, meta } = await users.listUsers(queryObj<ListUsersQuery>(req));
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/export.csv',
  validate(listUsersQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { rows } = await users.listUsers({ ...queryObj<ListUsersQuery>(req), limit: 1000 });
    const flat = rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      uid: r.uid,
      role: r.role,
      status: r.status,
      region: r.region ?? '',
      lastLogin: r.lastLogin?.toISOString() ?? '',
    }));
    streamCsv(res, 'users.csv', (async function* () {
      for (const row of flat) yield row;
    })());
  }),
);

router.post(
  '/',
  validate(createUserBody),
  asyncHandler(async (req, res) => {
    const result = await users.createUser(bodyObj(req));
    return created(res, result);
  }),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    const u = await users.getUser(paramId(req));
    return ok(res, u);
  }),
);

router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(updateUserBody),
  asyncHandler(async (req, res) => {
    await users.updateUser(paramId(req), bodyObj(req));
    return ok(res, { ok: true });
  }),
);

router.delete(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    await users.deleteUser(paramId(req));
    return noContent(res);
  }),
);

router.post(
  '/:id/reset-password',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    await users.resetUserPassword(paramId(req));
    return noContent(res);
  }),
);

export default router;
