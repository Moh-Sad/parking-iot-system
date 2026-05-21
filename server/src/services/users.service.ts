import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import type { ListUsersQuery } from '../schemas/users.schema.js';
import { Prisma, type Role, type UserStatus } from '@prisma/client';
import { parsePage, buildMeta, type PageMeta } from '../lib/pagination.js';
import { supervisorUid, adminUid, initialsOf } from '../lib/uid.js';
import { sha256, randomOpaque } from '../lib/jwt.js';
import { sendMail, supervisorInviteEmail } from '../lib/mailer.js';
import { env } from '../config/env.js';
import { writeAudit } from './audit.service.js';
import { AUDIT_COMPONENTS, PASSWORD_RESET_TTL_MS } from '../config/constants.js';

export interface UserListRow {
  id: string;
  name: string;
  uid: string;
  role: Role;
  status: UserStatus;
  region: string | null;
  lastLogin: Date | null;
  initials: string;
  email: string;
}

function lastActivityDate(window: '24h' | '7d' | '30d' | undefined): Date | undefined {
  if (!window) return undefined;
  const ms = window === '24h' ? 86_400_000 : window === '7d' ? 604_800_000 : 2_592_000_000;
  return new Date(Date.now() - ms);
}

export async function listUsers(query: ListUsersQuery): Promise<{ rows: UserListRow[]; meta: PageMeta }> {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.region ? { region: query.region } : {}),
    ...(query.lastActivity ? { lastLoginAt: { gte: lastActivityDate(query.lastActivity) } } : {}),
    ...(query.q
      ? {
          OR: [
            { email: { contains: query.q, mode: 'insensitive' } },
            { firstName: { contains: query.q, mode: 'insensitive' } },
            { lastName: { contains: query.q, mode: 'insensitive' } },
            { uid: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rowsRaw] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        region: true,
        uid: true,
        lastLoginAt: true,
      },
    }),
  ]);

  const rows = rowsRaw.map<UserListRow>((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
    uid: u.uid,
    role: u.role,
    status: u.status,
    region: u.region,
    lastLogin: u.lastLoginAt,
    initials: initialsOf(u.firstName, u.lastName, u.email),
    email: u.email,
  }));

  return { rows, meta: buildMeta(page, limit, total) };
}

export async function getUser(id: string): Promise<UserListRow & { firstName: string | null; lastName: string | null; avatarUrl: string | null; createdAt: Date }> {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw ApiError.notFound('User not found');
  return {
    id: u.id,
    email: u.email,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
    uid: u.uid,
    role: u.role,
    status: u.status,
    region: u.region,
    lastLogin: u.lastLoginAt,
    initials: initialsOf(u.firstName, u.lastName, u.email),
    firstName: u.firstName,
    lastName: u.lastName,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  };
}

export async function createUser(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  region?: string;
}): Promise<{ user: { id: string; email: string; uid: string; role: Role; mustCompleteProfile: boolean } }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already in use');

  const role: Role = input.role ?? 'SUPERVISOR';
  const user = await prisma.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role,
      region: input.region,
      uid: role === 'ADMIN' ? adminUid() : supervisorUid(),
      status: 'INVITED',
      mustCompleteProfile: true,
      roleLevel: 4,
    },
  });

  const tokenPlain = randomOpaque(32);
  const tokenHash = sha256(tokenPlain);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  // Invite email points to /auth/reset for initial password. Once they log in,
  // the DashboardGuard routes them to /auth/access to complete firstName/lastName.
  const setupUrl = `${env.CORS_ORIGIN}/auth/reset?token=${tokenPlain}`;
  const tpl = supervisorInviteEmail(setupUrl);
  await sendMail({ to: user.email, ...tpl });

  await writeAudit({
    component: AUDIT_COMPONENTS.USERS,
    action: 'user.invited',
    userId: user.id,
    details: { role, region: input.region },
  });

  return {
    user: { id: user.id, email: user.email, uid: user.uid, role: user.role, mustCompleteProfile: true },
  };
}

export async function updateUser(id: string, input: { firstName?: string; lastName?: string; role?: Role; region?: string; status?: UserStatus }): Promise<void> {
  await prisma.user.update({ where: { id }, data: input });
  await writeAudit({
    component: AUDIT_COMPONENTS.USERS,
    action: 'user.updated',
    userId: id,
    details: input as Record<string, unknown>,
  });
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
  await writeAudit({
    component: AUDIT_COMPONENTS.USERS,
    action: 'user.deleted',
    details: { id },
  });
}

export async function resetUserPassword(id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');
  const tokenPlain = randomOpaque(32);
  const tokenHash = sha256(tokenPlain);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await prisma.passwordResetToken.create({ data: { userId: id, tokenHash, expiresAt } });
  const resetUrl = `${env.CORS_ORIGIN}/auth/reset?token=${tokenPlain}`;
  await sendMail({
    to: user.email,
    subject: 'Password reset link',
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    text: `Reset your password: ${resetUrl}`,
  });
}

interface UpdateMeInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string | null;
  preferences?: Record<string, unknown>;
}

export async function updateMe(id: string, input: UpdateMeInput): Promise<void> {
  // Merge preferences with existing if provided (so partial updates work)
  let preferencesData: Prisma.InputJsonValue | undefined;
  if (input.preferences) {
    const current = await prisma.user.findUnique({ where: { id }, select: { preferences: true } });
    const existing = (current?.preferences as Record<string, unknown> | null) ?? {};
    preferencesData = { ...existing, ...input.preferences } as Prisma.InputJsonValue;
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(preferencesData !== undefined ? { preferences: preferencesData } : {}),
    },
  });
}
