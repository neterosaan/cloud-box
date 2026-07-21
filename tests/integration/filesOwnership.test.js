import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';


vi.mock('../../src/features/uploads/s3/s3UploadService.js', () => ({
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://fake-s3-url.test/signed'),
  deleteS3Object: vi.fn().mockResolvedValue(undefined),
}));

import { downloadFile, deleteFile, attachTag } from '../../src/features/files/filesService.js';
import { testPrisma, resetDb, disconnectTestDb } from '../setup/testDb.js';

const createUser = (supabaseId) =>
  testPrisma.user.create({ data: { supabaseId, email: `${supabaseId}@test.com` } });

const createFile = (userId, overrides = {}) =>
  testPrisma.file.create({
    data: {
      name: 'secret.pdf',
      key: `users/${userId}/secret.pdf`,
      size: 1024,
      mimeType: 'application/pdf',
      userId,
      ...overrides,
    },
  });

describe('files — ownership boundary', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('allows the owner to download their own file', async () => {
    const owner = await createUser('file-user-1-owner');
    const file = await createFile(owner.id);

    const result = await downloadFile(owner.id, file.id);

    expect(result.url).toBe('https://fake-s3-url.test/signed');
    expect(result.expiresIn).toBe(3600);
  });

  it("rejects downloading another user's file", async () => {
    const owner = await createUser('file-user-2-owner');
    const attacker = await createUser('file-user-2-attacker');
    const file = await createFile(owner.id);

    await expect(downloadFile(attacker.id, file.id)).rejects.toMatchObject({ status: 404 });
  });

  it('soft-deletes the file (moves to trash) rather than removing the row', async () => {
    const owner = await createUser('file-user-3-owner');
    const file = await createFile(owner.id);

    const result = await deleteFile(owner.id, file.id);

    expect(result.message).toBe('File moved to trash.');

    const found = await testPrisma.file.findUnique({ where: { id: file.id } });
    expect(found).not.toBeNull(); // still exists, just trashed
    expect(found.deletedAt).not.toBeNull();
    expect(found.trashedIndependently).toBe(true);
  });

  it('prevents deleting a file that is already in the trash', async () => {
    const owner = await createUser('file-user-3b-owner');
    const file = await createFile(owner.id);
    await deleteFile(owner.id, file.id);

    await expect(deleteFile(owner.id, file.id)).rejects.toMatchObject({ status: 404 });
  });

  it("rejects deleting another user's file, and leaves it untouched", async () => {
    const owner = await createUser('file-user-4-owner');
    const attacker = await createUser('file-user-4-attacker');
    const file = await createFile(owner.id);

    await expect(deleteFile(attacker.id, file.id)).rejects.toMatchObject({ status: 404 });

    const stillThere = await testPrisma.file.findUnique({ where: { id: file.id } });
    expect(stillThere).not.toBeNull();
  });

  it("rejects attaching another user's tag to your own file", async () => {
    const user = await createUser('file-user-5');
    const otherUser = await createUser('file-user-5-other');
    const file = await createFile(user.id);
    const othersTag = await testPrisma.tag.create({
      data: { name: 'private-tag', userId: otherUser.id },
    });

    await expect(attachTag(user.id, file.id, othersTag.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects attaching a tag to another user's file", async () => {
    const owner = await createUser('file-user-6-owner');
    const attacker = await createUser('file-user-6-attacker');
    const file = await createFile(owner.id);
    const attackersTag = await testPrisma.tag.create({
      data: { name: 'my-tag', userId: attacker.id },
    });

    await expect(attachTag(attacker.id, file.id, attackersTag.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});