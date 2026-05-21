import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { Prisma, type InvoiceStatus } from '@prisma/client';
import type { Actor } from '../types/domain.js';
import { parsePage, buildMeta } from '../lib/pagination.js';
import { invoiceCode } from '../lib/uid.js';
import { writeAudit } from './audit.service.js';
import { AUDIT_COMPONENTS } from '../config/constants.js';

interface CreateInvoiceInput {
  clientName: string;
  stationId: string;
  issueDate: Date;
  dueDate: Date;
  status?: InvoiceStatus;
  billTo: { name: string; address: string[] };
  lineItems: { label: string; description: string; totalCents: number }[];
  taxCents?: number;
  currency?: string;
  notes?: string;
}

function scope(actor: Actor): Prisma.InvoiceWhereInput {
  if (actor.role === 'SUPERVISOR' && actor.region) return { station: { region: actor.region } };
  return {};
}

export async function listInvoices(actor: Actor, query: {
  status?: InvoiceStatus;
  q?: string;
  stationId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.InvoiceWhereInput = {
    ...scope(actor),
    ...(query.status ? { status: query.status } : {}),
    ...(query.stationId ? { stationId: query.stationId } : {}),
    ...(query.q
      ? {
          OR: [
            { code: { contains: query.q, mode: 'insensitive' } },
            { clientName: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(query.from || query.to
      ? { issueDate: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      skip,
      take: limit,
      include: { station: true },
    }),
  ]);
  return {
    rows: rows.map((i) => ({
      id: i.id,
      code: i.code,
      client: i.clientName,
      node: i.station.name,
      date: i.issueDate,
      amount: i.grandTotalCents,
      currency: i.currency,
      status: i.status,
    })),
    meta: buildMeta(page, limit, total),
  };
}

export async function getInvoice(actor: Actor, id: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { sortOrder: 'asc' } }, station: true },
  });
  if (!inv) throw ApiError.notFound('Invoice not found');
  if (actor.role === 'SUPERVISOR' && actor.region && inv.station.region !== actor.region) {
    throw ApiError.forbidden();
  }
  return inv;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const subtotal = input.lineItems.reduce((acc, li) => acc + li.totalCents, 0);
  const tax = input.taxCents ?? 0;
  const grand = subtotal + tax;
  const inv = await prisma.invoice.create({
    data: {
      code: invoiceCode(input.issueDate.getFullYear()),
      clientName: input.clientName,
      stationId: input.stationId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      status: input.status ?? 'PROCESSING',
      billTo: input.billTo as unknown as object,
      subtotalCents: subtotal,
      taxCents: tax,
      grandTotalCents: grand,
      currency: input.currency ?? 'ETB',
      notes: input.notes,
      lineItems: {
        create: input.lineItems.map((li, idx) => ({ ...li, sortOrder: idx })),
      },
    },
    include: { lineItems: true, station: true },
  });
  await writeAudit({
    component: AUDIT_COMPONENTS.INVOICES,
    action: 'invoice.created',
    details: { invoiceId: inv.id, code: inv.code },
  });
  return inv;
}

export async function updateInvoice(id: string, input: Partial<CreateInvoiceInput>) {
  const data: Prisma.InvoiceUpdateInput = {};
  if (input.clientName !== undefined) data.clientName = input.clientName;
  if (input.stationId !== undefined) data.station = { connect: { id: input.stationId } };
  if (input.issueDate !== undefined) data.issueDate = input.issueDate;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.status !== undefined) data.status = input.status;
  if (input.billTo !== undefined) data.billTo = input.billTo as unknown as object;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.notes !== undefined) data.notes = input.notes;

  if (input.lineItems) {
    const subtotal = input.lineItems.reduce((acc, li) => acc + li.totalCents, 0);
    const tax = input.taxCents ?? 0;
    data.subtotalCents = subtotal;
    data.taxCents = tax;
    data.grandTotalCents = subtotal + tax;
    data.lineItems = {
      deleteMany: {},
      create: input.lineItems.map((li, idx) => ({ ...li, sortOrder: idx })),
    };
  } else if (input.taxCents !== undefined) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (existing) {
      data.taxCents = input.taxCents;
      data.grandTotalCents = existing.subtotalCents + input.taxCents;
    }
  }

  return prisma.invoice.update({
    where: { id },
    data,
    include: { lineItems: true, station: true },
  });
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({ where: { id } });
}
