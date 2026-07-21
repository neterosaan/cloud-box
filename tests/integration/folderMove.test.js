import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createFolder, updateFolder } from '../../src/features/folders/foldersService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({
    data: { supabaseId, email: `${supabaseId}@test.com` },
  });

describe('updateFolder — move validation and cycle detection', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('allows moving a folder under a different, unrelated folder', async () => {
    const user = await createUser('move-user-1');
    const folderA = await createFolder(user.id, 'A');
    const folderB = await createFolder(user.id, 'B');

    const moved = await updateFolder(user.id, folderB.id, { parentId: folderA.id });

    expect(moved.parentId).toBe(folderA.id);
  });

  it('rejects a folder becoming its own direct parent', async () => {
    const user = await createUser('move-user-2');
    const folder = await createFolder(user.id, 'Solo');

    await expect(
      updateFolder(user.id, folder.id, { parentId: folder.id })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects moving a folder into its own descendant (would create a cycle)', async () => {
    const user = await createUser('move-user-3');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);
    const grandchild = await createFolder(user.id, 'Grandchild', child.id);

    // Trying to move "Root" to live under its own grandchild -- if this
    // succeeded, Root -> Child -> Grandchild -> Root would be a closed loop,
    // and every future breadcrumb/listing query on this branch would recurse forever.
    await expect(
      updateFolder(user.id, root.id, { parentId: grandchild.id })
    ).rejects.toMatchObject({ status: 400 });

    // And the attempted move must not have partially applied.
    const untouched = await testPrisma.folder.findUnique({ where: { id: root.id } });
    expect(untouched.parentId).toBeNull();
  });

  it('rejects moving a folder into a folder owned by a different user', async () => {
    const owner = await createUser('move-user-4-owner');
    const attacker = await createUser('move-user-4-attacker');
    const targetFolder = await createFolder(owner.id, 'Private');
    const attackerFolder = await createFolder(attacker.id, 'Mine');

    await expect(
      updateFolder(attacker.id, attackerFolder.id, { parentId: targetFolder.id })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects updating a folder that belongs to a different user", async () => {
    const owner = await createUser('move-user-5-owner');
    const attacker = await createUser('move-user-5-attacker');
    const folder = await createFolder(owner.id, 'Private');

    await expect(
      updateFolder(attacker.id, folder.id, { name: 'Renamed' })
    ).rejects.toMatchObject({ status: 404 });
  });
});