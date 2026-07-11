
export const normalizeError = (err) => {  if (err.status) return err;

  if (err.code === 'P2002') {
    const normalized = new Error(
      'A file with this name already exists in this folder.'
    );
    normalized.status = 409;
    return normalized;
  }

  if (err.code?.startsWith('P')) {
    const normalized = new Error('A database error occurred. Please try again.');
    normalized.status = 500;
    return normalized;
  }

  if (err.__type || err.$metadata) {
    const normalized = new Error('A storage error occurred. Please try again.');
    normalized.status = 500;
    return normalized;
  }

  err.status = 500;
  return err;
};