import { PAGINATION } from '../config/constants.js';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePage(input: { page?: unknown; limit?: unknown }): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number(input.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(input.limit) || PAGINATION.DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
