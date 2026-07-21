import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';



vi.mock('../../src/features/uploads/pipeline/runUploadPipeline.js', () => ({
  runUploadPipeline: vi.fn().mockResolvedValue({
    actualSize: 2048,
    actualMimeType: 'image/png',
  }),
}));

import { handleUploadStream } from '../../src/features/uploads/uploadsService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({
    data: { supabaseId, email: `${supabaseId}@test.com` },
  });

const createSession = (userId, overrides = {}) =>
  testPrisma.uploadSession.create({
    data: {
      fileName: 'race-test.png',
      s3Key: `users/${userId}/race-test.png`,
      userId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      ...overrides,
    },
  });

describe('handleUploadStream — race-safe session claiming', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('allows exactly one of two concurrent requests to claim the same PENDING session', async () => {
    const user = await createUser('race-user-1');

    const session = await createSession(user.id);

    const results = await Promise.allSettled([
      handleUploadStream(user.id, session.id, {}),
      handleUploadStream(user.id, session.id, {}),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.status).toBe(409);
    expect(rejected[0].reason.message).toBe('Upload session is no longer available.');

    const files = await testPrisma.file.findMany({ where: { uploadSessionId: session.id } });
    expect(files).toHaveLength(1);

    const finalSession = await testPrisma.uploadSession.findUnique({ where: { id: session.id } });
    expect(finalSession.status).toBe('COMPLETED');
  });

  it('rejects with 410 when the session has already expired', async () => {
    const user = await createUser('race-user-2');
    const session = await createSession(user.id, {
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    await expect(handleUploadStream(user.id, session.id, {})).rejects.toMatchObject({
      status: 410,
    });
  });

  it("rejects with 404 when a different user tries to claim someone else's session", async () => {
    const owner = await createUser('race-user-3-owner');
    const attacker = await createUser('race-user-3-attacker');
    const session = await createSession(owner.id);

    await expect(handleUploadStream(attacker.id, session.id, {})).rejects.toMatchObject({
      status: 404,
    });

    const untouched = await testPrisma.uploadSession.findUnique({ where: { id: session.id } });
    expect(untouched.status).toBe('PENDING');
  });
});