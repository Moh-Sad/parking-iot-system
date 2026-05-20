import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signAccess, signRefresh, sha256, ttlToMs, randomOpaque } from '../lib/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { writeAudit } from './audit.service.js';
import { sendMail, passwordRecoveryEmail } from '../lib/mailer.js';
import { AUDIT_COMPONENTS, PASSWORD_RESET_TTL_MS } from '../config/constants.js';

interface LoginResult {
  token: string;
  refreshToken: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'USER';
  mustCompleteProfile: boolean;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: 'ADMIN' | 'SUPERVISOR' | 'USER';
    roleLevel: number;
    region: string | null;
    uid: string;
    avatarUrl: string | null;
  };
}

export async function login(email: string, password: string, meta?: { ip?: string; userAgent?: string }): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    await writeAudit({
      component: AUDIT_COMPONENTS.AUTH,
      action: 'login.failed',
      details: { email, reason: 'unknown_user_or_no_password' },
      status: 'FLAGGED',
    });
    throw ApiError.unauthorized('Invalid credentials');
  }
  if (user.status === 'SUSPENDED') {
    throw ApiError.forbidden('Account suspended');
  }
  const okPass = await comparePassword(password, user.passwordHash);
  if (!okPass) {
    await writeAudit({
      component: AUDIT_COMPONENTS.AUTH,
      action: 'login.failed',
      userId: user.id,
      details: { email, reason: 'bad_password' },
      status: 'FLAGGED',
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = signAccess({ sub: user.id, role: user.role, roleLevel: user.roleLevel });

  const refreshPlain = randomOpaque(32);
  const refreshHash = sha256(refreshPlain);
  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await writeAudit({
    component: AUDIT_COMPONENTS.AUTH,
    action: 'login.success',
    userId: user.id,
    details: { ip: meta?.ip, userAgent: meta?.userAgent },
  });

  return {
    token,
    refreshToken: refreshPlain,
    role: user.role,
    mustCompleteProfile: user.mustCompleteProfile,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roleLevel: user.roleLevel,
      region: user.region,
      uid: user.uid,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function refresh(refreshToken: string, meta?: { ip?: string; userAgent?: string }): Promise<{ token: string; refreshToken: string }> {
  const hash = sha256(refreshToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  if (existing.user.status === 'SUSPENDED') throw ApiError.forbidden('Account suspended');

  const newPlain = randomOpaque(32);
  const newHash = sha256(newPlain);
  const newExpiry = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));

  const newToken = await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: newHash,
        expiresAt: newExpiry,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
      },
    });
    await tx.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: created.id },
    });
    return created;
  });

  const access = signAccess({
    sub: existing.user.id,
    role: existing.user.role,
    roleLevel: existing.user.roleLevel,
  });
  return { token: access, refreshToken: newPlain };
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;
  const hash = sha256(refreshToken);
  await prisma.refreshToken
    .update({ where: { tokenHash: hash }, data: { revokedAt: new Date() } })
    .catch(() => undefined);
}

export async function completeAccess(
  userId: string,
  firstName: string,
  lastName: string,
  password?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  if (!user.mustCompleteProfile) throw ApiError.badRequest('Profile already completed');
  if (!user.passwordHash && !password) {
    throw ApiError.badRequest('Password required when no password is set');
  }

  const data: { firstName: string; lastName: string; mustCompleteProfile: false; passwordHash?: string } = {
    firstName,
    lastName,
    mustCompleteProfile: false,
  };
  if (password) data.passwordHash = await hashPassword(password);

  await prisma.user.update({ where: { id: user.id }, data });
  await writeAudit({
    component: AUDIT_COMPONENTS.AUTH,
    action: 'profile.completed',
    userId: user.id,
  });
}

export async function startRecovery(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // do not leak
  const tokenPlain = randomOpaque(32);
  const tokenHash = sha256(tokenPlain);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const resetUrl = `${env.CORS_ORIGIN}/auth/reset?token=${tokenPlain}`;
  const tpl = passwordRecoveryEmail(resetUrl);
  await sendMail({ to: user.email, ...tpl });

  await writeAudit({
    component: AUDIT_COMPONENTS.AUTH,
    action: 'recovery.requested',
    userId: user.id,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = sha256(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired token');
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await writeAudit({
    component: AUDIT_COMPONENTS.AUTH,
    action: 'password.reset',
    userId: record.userId,
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) throw ApiError.unauthorized();
  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await writeAudit({
    component: AUDIT_COMPONENTS.AUTH,
    action: 'password.changed',
    userId,
  });
}
