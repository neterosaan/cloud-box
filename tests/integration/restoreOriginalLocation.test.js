import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createFolder, deleteFolder } from '../../src/features/folders/foldersService.js';
import { deleteFile } from '../../src/features/files/filesService.js';
import { restoreFile, restoreFolder } from '../../src/features/trash/trashService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({ data: { supabaseId, email: `${supabaseId}@test.com` } });

const createFile = (userId, folderId, name = 'file.txt') =>
  testPrisma.file.create({
    data: { name, key: `users/${userId}/${name}`, size: 10, mimeType: 'text/plain', userId, folderId },
  });

describe('restore — returns items to their original location', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('restores an independently trashed file back into the folder it came from', async () => {
    const user = await createUser('restore-loc-user-1');
    const folder = await createFolder(user.id, 'Documents');
    const file = await createFile(user.id, folder.id);

    await deleteFile(user.id, file.id);
    const restored = await restoreFile(user.id, file.id);

    expect(restored.folderId).toBe(folder.id);
    expect(restored.originalFolderId).toBeNull();
  });

  it('falls back to root when the original folder no longer exists (was permanently deleted)', async () => {
    const user = await createUser('restore-loc-user-2');
    const folder = await createFolder(user.id, 'Temp');
    const file = await createFile(user.id, folder.id);

    await deleteFile(user.id, file.id);
    await testPrisma.folder.delete({ where: { id: folder.id } }); 

    const restored = await restoreFile(user.id, file.id);

    expect(restored.folderId).toBeNull();
  });

  it('restores an independently trashed subfolder back under its original (still-active) parent', async () => {
    const user = await createUser('restore-loc-user-3');
    const parent = await createFolder(user.id, 'Parent');
    const child = await createFolder(user.id, 'Child', parent.id);

    await deleteFolder(user.id, child.id);
    await restoreFolder(user.id, child.id);

    const restoredChild = await testPrisma.folder.findUnique({ where: { id: child.id } });

    expect(restoredChild.parentId).toBe(parent.id);
    expect(restoredChild.originalParentId).toBeNull();
  });

  it("falls back to root when the folder's original parent is still in the trash", async () => {
    const user = await createUser('restore-loc-user-4');
    const parent = await createFolder(user.id, 'Parent');
    const child = await createFolder(user.id, 'Child', parent.id);

    await deleteFolder(user.id, child.id); 
    await deleteFolder(user.id, parent.id); 

    await restoreFolder(user.id, child.id); 

    const restoredChild = await testPrisma.folder.findUnique({ where: { id: child.id } });

    expect(restoredChild.parentId).toBeNull();
  });
});