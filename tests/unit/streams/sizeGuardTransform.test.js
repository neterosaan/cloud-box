import { describe, it, expect } from 'vitest';
import { SizeGuardTransform } from '../../../src/features/uploads/streams/sizeGuardTransform.js';

// Pipes a list of Buffer chunks through the transform and resolves with
// either the reassembled output or the error the stream emitted -- whichever
// happens first. We test the stream through its actual event-based interface
// (write/end/data/error) rather than calling internal methods directly,
// since that's the real contract consumers of this stream rely on.
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
