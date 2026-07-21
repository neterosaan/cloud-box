import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

describe('integration test harness', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('can write to and read from the real test database', async () => {
    const user = await testPrisma.user.create({
      data: { supabaseId: 'test-supabase-id-1', email: 'harness@test.com' },
    });

    const found = await testPrisma.user.findUnique({ where: { id: user.id } });

    expect(found).not.toBeNull();
    expect(found.email).toBe('harness@test.com');
  });

  it('resetDb actually wipes data between tests (proves the previous test\'s user is gone)', async () => {
    const count = await testPrisma.user.count();
    expect(count).toBe(0);
  });
});