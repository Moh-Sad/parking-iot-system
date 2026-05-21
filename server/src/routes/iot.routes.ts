import { Router, json, type Request } from 'express';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import {
  entryTapBody,
  entryConfirmBody,
  chargingUnpluggedBody,
  exitTapBody,
} from '../schemas/iot.schema.js';
import * as iot from '../services/iot.service.js';
import { verifyChapaSignature } from '../lib/chapa.js';
import { addSseClient } from '../lib/sse.js';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { paramId } from '../utils/reqParse.js';

const router = Router();

router.post(
  '/entry/tap',
  validate(entryTapBody),
  asyncHandler(async (req, res) => {
    return ok(res, await iot.entryTap(req.body.cardNumber));
  }),
);

router.post(
  '/entry/confirm',
  validate(entryConfirmBody),
  asyncHandler(async (req, res) => {
    return ok(res, await iot.entryConfirm(req.body));
  }),
);

router.post(
  '/charging/unplugged',
  validate(chargingUnpluggedBody),
  asyncHandler(async (req, res) => {
    return ok(res, await iot.chargingUnplugged(req.body.cardNumber));
  }),
);

router.post(
  '/exit/tap',
  validate(exitTapBody),
  asyncHandler(async (req, res) => {
    return ok(res, await iot.exitTap(req.body.cardNumber));
  }),
);

// Chapa webhook — capture raw body for HMAC verification.
router.post(
  '/payments/chapa/webhook',
  json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: string }).rawBody = buf.toString('utf8');
    },
  }),
  asyncHandler(async (req, res) => {
    const rawBody = (req as Request & { rawBody?: string }).rawBody ?? '';
    const sig = (req.header('chapa-signature') ?? req.header('x-chapa-signature')) as string | undefined;
    if (!verifyChapaSignature(rawBody, sig)) throw ApiError.unauthorized('Bad signature');
    const body = req.body as { status?: string; tx_ref?: string };
    if (body.status === 'success' && body.tx_ref) await iot.handleChapaSuccess(body.tx_ref);
    return ok(res, { received: true });
  }),
);

router.get(
  '/sessions/:id/stream',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const userId = req.user.id;
    const assignment = await prisma.slotAssignment.findUnique({
      where: { id: paramId(req) },
      include: { vehicle: true },
    });
    if (!assignment || assignment.vehicle.ownerId !== userId) {
      throw ApiError.notFound('Session not found');
    }
    addSseClient(assignment.id, res);
  }),
);

export default router;
