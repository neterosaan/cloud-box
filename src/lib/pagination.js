const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePagination = (query) => {
  const parsedPage = parseInt(query.page);
  const parsedLimit = parseInt(query.limit);

  const rawPage = Number.isNaN(parsedPage) ? 1 : parsedPage;
  const rawLimit = Number.isNaN(parsedLimit) ? DEFAULT_LIMIT : parsedLimit;

  const page = Math.max(1, rawPage);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: Math.ceil(total / limit)>0 && page > 1,
});