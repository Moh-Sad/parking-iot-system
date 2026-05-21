import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/transactions.service.js';
import { listTransactionsQuery } from '../schemas/transactions.schema.js';
import { idParam } from '../schemas/common.schema.js';
import { ok, paginated } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(listTransactionsQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rows, meta } = await svc.listTransactions(req.user, req.query as never);
    return paginated(res, rows, meta);
  }),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const t = await svc.getTransaction(req.user, paramId(req));
    return ok(res, t);
  }),
);

export default router;
