import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/search.service.js';
import { searchQuery } from '../schemas/search.schema.js';
import { ok } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validate(searchQuery, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const q = req.query as unknown as { q: string; types?: string[]; limit?: number };
    const result = await svc.search(req.user, q.q, (q.types ?? []) as svc.SearchType[], q.limit ?? 5);
    return ok(res, result);
  }),
);

export default router;
