import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/features/uploads/s3/s3UploadService.js', () => ({
  deleteS3Object: vi.fn().mockResolvedValue(undefined),
}));

import { createFolder, deleteFolder } from '../../src/features/folders/foldersService.js';
import { deleteFile } from '../../src/features/files/filesService.js';
import { permanentDeleteFile, permanentDeleteFolder } from '../../src/features/trash/trashService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({ data: { supabaseId, email: `${supabaseId}@test.com` } });

const createFile = (userId, folderId, name = 'file.txt') =>
  testPrisma.file.create({
    data: { name, key: `users/${userId}/${name}`, size: 10, mimeType: 'text/plain', userId, folderId },
  });

describe('permanentDeleteFile', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('refuses to permanently delete a file that is not already in the trash', async () => {
    const user = await createUser('perm-user-1');
    const file = await createFile(user.id, null);

    await expect(permanentDeleteFile(user.id, file.id)).rejects.toMatchObject({ status: 409 });

    const stillThere = await testPrisma.file.findUnique({ where: { id: file.id } });
    expect(stillThere).not.toBeNull();
  });

  it('permanently removes the DB row once the file is in the trash', async () => {
    const user = await createUser('perm-user-2');
    const file = await createFile(user.id, null);
    await deleteFile(user.id, file.id); // move to trash first

    await permanentDeleteFile(user.id, file.id);

    const found = await testPrisma.file.findUnique({ where: { id: file.id } });
    expect(found).toBeNull();
  });

  it("rejects permanently deleting another user's trashed file", async () => {
    const owner = await createUser('perm-user-3-owner');
    const attacker = await createUser('perm-user-3-attacker');
    const file = await createFile(owner.id, null);
    await deleteFile(owner.id, file.id);

    await expect(permanentDeleteFile(attacker.id, file.id)).rejects.toMatchObject({ status: 404 });

    const stillThere = await testPrisma.file.findUnique({ where: { id: file.id } });
    expect(stillThere).not.toBeNull();
  });
});

describe('permanentDeleteFolder', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('refuses to permanently delete a folder that is not already in the trash', async () => {
    const user = await createUser('perm-user-4');
    const folder = await createFolder(user.id, 'Active');

    await expect(permanentDeleteFolder(user.id, folder.id)).rejects.toMatchObject({ status: 409 });
  });

  it('cascade-deletes a trashed folder and its cascade-trashed descendants', async () => {
    const user = await createUser('perm-user-5');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);
    const file = await createFile(user.id, child.id);

    await deleteFolder(user.id, root.id); // cascade-trash everything
    await permanentDeleteFolder(user.id, root.id);

    const [rootAfter, childAfter, fileAfter] = await Promise.all([
      testPrisma.folder.findUnique({ where: { id: root.id } }),
      testPrisma.folder.findUnique({ where: { id: child.id } }),
      testPrisma.file.findUnique({ where: { id: file.id } }),
    ]);

    expect(rootAfter).toBeNull();
    expect(childAfter).toBeNull();
    expect(fileAfter).toBeNull();
  });

  it('does NOT cascade-delete a subtree that was trashed independently before the parent', async () => {
    const user = await createUser('perm-user-6');
    const root = await createFolder(user.id, 'Root');
    const child = await createFolder(user.id, 'Child', root.id);

    await deleteFolder(user.id, child.id); // trash child on its own first
    await deleteFolder(user.id, root.id);  // then trash root (skips already-trashed child)

    await permanentDeleteFolder(user.id, root.id);

    const rootAfter = await testPrisma.folder.findUnique({ where: { id: root.id } });
    const childAfter = await testPrisma.folder.findUnique({ where: { id: child.id } });

    expect(rootAfter).toBeNull(); // root is gone
    expect(childAfter).not.toBeNull(); // child survives, still in trash on its own
    expect(childAfter.deletedAt).not.toBeNull();
  });
});