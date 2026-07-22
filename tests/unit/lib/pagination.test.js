import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginationMeta } from '../../../src/lib/pagination.js';

describe('parsePagination', () => {
  it('defaults to page 1, limit 20 when no query params are given', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('computes skip correctly for a later page', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps limit to the maximum of 100, even if a larger value is requested', () => {
    expect(parsePagination({ limit: '500' })).toMatchObject({ limit: 100 });
  });

  it('clamps page to a minimum of 1, rejecting 0 or negative values', () => {
    expect(parsePagination({ page: '0' })).toMatchObject({ page: 1 });
    expect(parsePagination({ page: '-5' })).toMatchObject({ page: 1 });
  });

  it('clamps limit to a minimum of 1, rejecting 0 or negative values', () => {
    expect(parsePagination({ limit: '0' })).toMatchObject({ limit: 1 });
    expect(parsePagination({ limit: '-10' })).toMatchObject({ limit: 1 });
  });

  it('falls back to defaults for non-numeric input rather than producing NaN', () => {

    expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 20, skip: 0 });
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages, hasNextPage, and hasPrevPage for a middle page', () => {
    const meta = buildPaginationMeta(95, 3, 20); 

    expect(meta).toEqual({
      total: 95,
      page: 3,
      limit: 20,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('has no next page on the last page', () => {
    const meta = buildPaginationMeta(95, 5, 20);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('has no prev page on the first page', () => {
    const meta = buildPaginationMeta(95, 1, 20);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(false);
  });

  it('handles zero results without producing hasNextPage/hasPrevPage = true by accident', () => {

    const meta = buildPaginationMeta(0, 1, 20);

    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});