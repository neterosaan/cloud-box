import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createFolder, deleteFolder } from '../../src/features/folders/foldersService.js';
import { restoreFolder } from '../../src/features/trash/trashService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({ data: { supabaseId, email: `${supabaseId}@test.com` } });

const createFile = (userId, folderId, name = 'file.txt') =>
  testPrisma.file.create({
    data: { name, key: `users/${userId}/${name}`, size: 10, mimeType: 'text/plain', userId, folderId },
  });

const getFolder = (id) => testPrisma.folder.findUnique({ where: { id } });
const getFile = (id) => testPrisma.file.findUnique({ where: { id } });

describe('folder trash cascade — deleteFolder + restoreFolder', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('cascade-trashes a folder, its descendants, and their files, marking only the root as trashedIndependently', async () => {
    const user = await createUser('cascade-user-1');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);
    const file = await createFile(user.id, child.id);

    await deleteFolder(user.id, root.id);

    const [rootAfter, childAfter, fileAfter] = await Promise.all([
      getFolder(root.id),
      getFolder(child.id),
      getFile(file.id),
    ]);

    expect(rootAfter.deletedAt).not.toBeNull();
    expect(rootAfter.trashedIndependently).toBe(true);

    // Descendants are trashed too, but NOT marked "independent" -- that
    // distinction is what lets restoring the root bring them back automatically.
    expect(childAfter.deletedAt).not.toBeNull();
    expect(childAfter.trashedIndependently).toBe(false);

    expect(fileAfter.deletedAt).not.toBeNull();
  });

  it('restoring the root brings back the whole cascade-trashed subtree', async () => {
    const user = await createUser('cascade-user-2');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);
    const grandchild = await createFolder(user.id, 'Grandchild', child.id);
    const file = await createFile(user.id, grandchild.id);

    await deleteFolder(user.id, root.id);
    await restoreFolder(user.id, root.id);

    const [rootAfter, childAfter, grandchildAfter, fileAfter] = await Promise.all([
      getFolder(root.id),
      getFolder(child.id),
      getFolder(grandchild.id),
      getFile(file.id),
    ]);

    expect(rootAfter.deletedAt).toBeNull();
    expect(childAfter.deletedAt).toBeNull();
    expect(grandchildAfter.deletedAt).toBeNull();
    expect(fileAfter.deletedAt).toBeNull();
  });

  it('restoring the root does NOT resurrect a subtree that was trashed independently beforehand', async () => {
    const user = await createUser('cascade-user-3');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);
    const grandchild = await createFolder(user.id, 'Grandchild', child.id);

    // Trash "child" on its own, BEFORE root ever gets trashed.
    await deleteFolder(user.id, child.id);
    // Now trash "root" (child is already trashed, so root's cascade skips it).
    await deleteFolder(user.id, root.id);

    // Restore only the root.
    await restoreFolder(user.id, root.id);

    const [rootAfter, childAfter, grandchildAfter] = await Promise.all([
      getFolder(root.id),
      getFolder(child.id),
      getFolder(grandchild.id),
    ]);

    expect(rootAfter.deletedAt).toBeNull();
    // child and grandchild were independently trashed -- restoring root
    // must leave them exactly as they were, still in the trash.
    expect(childAfter.deletedAt).not.toBeNull();
    expect(childAfter.trashedIndependently).toBe(true);
    expect(grandchildAfter.deletedAt).not.toBeNull();
  })
});