import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const startedAt = Date.now();

router.get('/', (_req, res) => {
  res.json({
    data: {
      status: 'ok',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      version: process.env.npm_package_version ?? '0.1.0',
    },
  });
});

router.get(
  '/db',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ok' } });
  }),
);

export default router;
