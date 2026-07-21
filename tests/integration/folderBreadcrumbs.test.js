import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createFolder, getFolderBreadcrumbs } from '../../src/features/folders/foldersService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({
    data: { supabaseId, email: `${supabaseId}@test.com` },
  });

describe('getFolderBreadcrumbs — recursive CTE', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('returns a single-item trail for a root-level folder', async () => {
    const user = await createUser('breadcrumb-user-1');
    const root = await createFolder(user.id, 'Root');

    const trail = await getFolderBreadcrumbs(user.id, root.id);

    expect(trail).toHaveLength(1);
    expect(trail[0]).toMatchObject({ id: root.id, name: 'Root', parentId: null });
  });

  it('returns ancestors in root-to-leaf order for a nested folder', async () => {
    const user = await createUser('breadcrumb-user-2');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);
    const grandchild = await createFolder(user.id, 'Grandchild', child.id);

    const trail = await getFolderBreadcrumbs(user.id, grandchild.id);

    // Order matters here -- this is the whole point of the test. Root first,
    // the folder itself last, exactly the order you'd render a breadcrumb bar in.
    expect(trail.map((f) => f.name)).toEqual(['Root', 'Child', 'Grandchild']);
    expect(trail.map((f) => f.id)).toEqual([root.id, child.id, grandchild.id]);
  });

  it('throws 404 when the folder does not exist', async () => {
    const user = await createUser('breadcrumb-user-3');

    await expect(
      getFolderBreadcrumbs(user.id, '00000000-0000-0000-0000-000000000000')
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 404 when the folder belongs to a different user (CTE's userId filter must hold across every level, not just the top)", async () => {
    const owner = await createUser('breadcrumb-user-4-owner');
    const attacker = await createUser('breadcrumb-user-4-attacker');
    const root = await createFolder(owner.id, 'Root');
    const child = await createFolder(owner.id, 'Child', root.id);

    await expect(getFolderBreadcrumbs(attacker.id, child.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});