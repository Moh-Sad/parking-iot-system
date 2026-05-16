import type { Response } from 'express';
import { format } from 'fast-csv';

export function streamCsv<T extends Record<string, unknown>>(
  res: Response,
  filename: string,
  rows: Iterable<T> | AsyncIterable<T>,
  headers?: string[],
): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const csv = format({ headers: headers ?? true });
  csv.pipe(res);

  (async () => {
    try {
      for await (const row of rows as AsyncIterable<T>) {
        csv.write(row);
      }
      csv.end();
    } catch {
      csv.end();
    }
  })();
}
