import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (token, getKey, options, callback) => {
      callback(null, { sub: 'route-smoke-supabase-id', email: 'route-smoke@test.com' });
    },
  },
}));

const app = (await import('../../src/app.js')).default;
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

describe('route wiring smoke test', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('rejects a request with no Authorization header (proves requireAuth is actually attached)', async () => {
    const res = await request(app).post('/api/folders').send({ name: 'Test' });

    expect(res.status).toBe(401);
  });

  it('creates a folder end-to-end with a valid (mocked) token, including just-in-time user creation', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', 'Bearer fake-token')
      .send({ name: 'Test Folder' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Folder');

    const user = await testPrisma.user.findUnique({ where: { supabaseId: 'route-smoke-supabase-id' } });
    expect(user).not.toBeNull();
  });

  it('maps a Zod validation failure to a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', 'Bearer fake-token')
      .send({ name: '' }); 

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('the trash routes are reachable (fails today -- app.js never mounts trashRoutes)', async () => {
    const res = await request(app)
      .get('/api/trash')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).not.toBe(404);
  });
});