import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createFolder } from '../../src/features/folders/foldersService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({ data: { supabaseId, email: `${supabaseId}@test.com` } });

describe('createFolder — refuses to nest under a trashed parent', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('rejects creating a folder under a parent that is currently in the trash', async () => {
    const user = await createUser('trash-guard-user-1');
    const parent = await createFolder(user.id, 'Parent');

    await testPrisma.folder.update({
      where: { id: parent.id },
      data: { deletedAt: new Date(), trashedIndependently: true },
    });

    await expect(createFolder(user.id, 'Child', parent.id)).rejects.toMatchObject({
      status: 404,
    });

    const children = await testPrisma.folder.findMany({ where: { parentId: parent.id } });
    expect(children).toHaveLength(0);
  });

  it('still allows creating a folder under a normal, non-trashed parent', async () => {
    const user = await createUser('trash-guard-user-2');
    const parent = await createFolder(user.id, 'Parent');

    const child = await createFolder(user.id, 'Child', parent.id);

    expect(child.parentId).toBe(parent.id);
  });
});