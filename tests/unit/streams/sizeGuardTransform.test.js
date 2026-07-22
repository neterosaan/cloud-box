import { describe, it, expect } from 'vitest';
import { SizeGuardTransform } from '../../../src/features/uploads/streams/sizeGuardTransform.js';

const runThroughTransform = (transform, chunks) => {
  return new Promise((resolve) => {
    const received = [];

    transform.on('data', (chunk) => received.push(chunk));
    transform.on('error', (err) => resolve({ error: err, output: null }));
    transform.on('end', () => resolve({ error: null, output: Buffer.concat(received) }));

    for (const chunk of chunks) {
      transform.write(chunk);
    }
    transform.end();
  });
};

describe('SizeGuardTransform', () => {
  it('passes data through unchanged when total size is under the limit', async () => {
    const transform = new SizeGuardTransform({ maxBytes: 100 });
    const { error, output } = await runThroughTransform(transform, [
      Buffer.from('hello '),
      Buffer.from('world'),
    ]);

    expect(error).toBeNull();
    expect(output.toString()).toBe('hello world');
  });

  it('allows a stream whose total size is exactly equal to maxBytes', async () => {
    const exactlyTenBytes = Buffer.from('0123456789'); 
    const transform = new SizeGuardTransform({ maxBytes: 10 });

    const { error, output } = await runThroughTransform(transform, [exactlyTenBytes]);

    expect(error).toBeNull();
    expect(output.length).toBe(10);
  });

  it('emits a 413 error once the accumulated size exceeds maxBytes', async () => {
    const transform = new SizeGuardTransform({ maxBytes: 10 });

    const { error } = await runThroughTransform(transform, [
      Buffer.from('01234567'), 
      Buffer.from('89AB'),     
    ]);

    expect(error).not.toBeNull();
    expect(error.status).toBe(413);
    expect(error.message).toMatch(/exceeds the maximum allowed size/);
  });

  it('accumulates size correctly across many small chunks (not just per-chunk)', async () => {

    const transform = new SizeGuardTransform({ maxBytes: 25 });
    const chunks = Array.from({ length: 10 }, () => Buffer.from('abc'));

    const { error } = await runThroughTransform(transform, chunks);

    expect(error).not.toBeNull();
    expect(error.status).toBe(413);
  });
});



describe('SizeGuardTransform — storage quota', () => {
  it('allows the upload when the account has plenty of quota left', async () => {
    const transform = new SizeGuardTransform({
      maxBytes: 1000,
      currentUsage: 0,
      storageQuota: 10_000,
    });

    const { error } = await runThroughTransform(transform, [Buffer.from('a'.repeat(500))]);

    expect(error).toBeNull();
  });

  it('rejects with 507 when currentUsage + incoming bytes would exceed the quota, even though the file itself is under maxBytes', async () => {

    const transform = new SizeGuardTransform({
      maxBytes: 1000,
      currentUsage: 9800, 
      storageQuota: 10_000,
    });

    const { error } = await runThroughTransform(transform, [Buffer.from('a'.repeat(500))]);

    expect(error).not.toBeNull();
    expect(error.status).toBe(507);
    expect(error.message).toMatch(/Storage quota exceeded/);
  });

  it('allows a stream whose final usage is exactly equal to the quota', async () => {
    const transform = new SizeGuardTransform({
      maxBytes: 1000,
      currentUsage: 9500,
      storageQuota: 10_000, 
    });

    const { error } = await runThroughTransform(transform, [Buffer.from('a'.repeat(500))]);

    expect(error).toBeNull();
  });

  it('reports usage in the error message converted to GB, not raw bytes', async () => {
    const oneGB = 1024 ** 3;
    const transform = new SizeGuardTransform({
      maxBytes: oneGB,
      currentUsage: 2 * oneGB,
      storageQuota: 2 * oneGB, 
    });

    const { error } = await runThroughTransform(transform, [Buffer.from('a')]); 

    expect(error.status).toBe(507);
    expect(error.message).toContain('2.00GB');
  });
});