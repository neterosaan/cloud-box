import { describe, it, expect } from 'vitest';
import { generateS3Key } from '../../src/features/uploads/s3/s3KeyGenerator.js';

describe('generateS3Key', () => {
  it('builds the key using userId/uploadSessionId/sanitizedFileName', () => {
    const key = generateS3Key('user-123', 'session-456', 'MyFile.txt');
    expect(key).toBe('users/user-123/session-456/myfile.txt');
  });

  it('lowercases the file name', () => {
    const key = generateS3Key('u1', 's1', 'Report.PDF');
    expect(key).toBe('users/u1/s1/report.pdf');
  });

  it('replaces spaces with underscores', () => {
    const key = generateS3Key('u1', 's1', 'final report.pdf');
    expect(key).toBe('users/u1/s1/final_report.pdf');
  });

  it('collapses runs of special characters into a single underscore', () => {

    const key = generateS3Key('u1', 's1', 'final   report!!!.pdf');
    expect(key).toBe('users/u1/s1/final_report_.pdf');
  });

  it('preserves dots and dashes since they are allowed characters', () => {
    const key = generateS3Key('u1', 's1', 'my-archive.tar.gz');
    expect(key).toBe('users/u1/s1/my-archive.tar.gz');
  });

  it('keeps userId and uploadSessionId untouched (only the file name is sanitized)', () => {

    const key = generateS3Key('USER-Abc', 'SESSION-Xyz', 'file.txt');
    expect(key).toBe('users/USER-Abc/SESSION-Xyz/file.txt');
  });
});
