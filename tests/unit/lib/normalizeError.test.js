import { describe, it, expect } from 'vitest';
import { normalizeError } from '../../../src/lib/normalizeError.js';

describe('normalizeError', () => {
  it('returns the error unchanged if it already has a status (e.g. set deliberately in a controller)', () => {
    const err = new Error('Not found');
    err.status = 404;

    const result = normalizeError(err);

    expect(result).toBe(err);
    expect(result.status).toBe(404);
    expect(result.message).toBe('Not found');
  });

  it('maps a Prisma unique-constraint violation (P2002) to a 409 with a user-friendly message', () => {
    const err = new Error('Unique constraint failed on the fields: (`name`,`folderId`,`userId`)');
    err.code = 'P2002';

    const result = normalizeError(err);

    expect(result.status).toBe(409);
    expect(result.message).toBe('A file with this name already exists in this folder.');
  });

  it('maps other Prisma error codes to a generic 500 without leaking internal details', () => {
    const err = new Error('Foreign key constraint failed');
    err.code = 'P2003';

    const result = normalizeError(err);

    expect(result.status).toBe(500);
    expect(result.message).toBe('A database error occurred. Please try again.');
  });

  it('maps AWS SDK errors (identified by __type or $metadata) to a generic 500 storage error', () => {
    const err = new Error('NoSuchKey');
    err.$metadata = { httpStatusCode: 404 };

    const result = normalizeError(err);

    expect(result.status).toBe(500);
    expect(result.message).toBe('A storage error occurred. Please try again.');
  });

  it('falls back to a 500 for any unrecognized error, preserving the original message', () => {
    const err = new Error('Something totally unexpected');

    const result = normalizeError(err);

    expect(result).toBe(err);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Something totally unexpected');
  });
});
