const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePagination = (query)=>{
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
    const skip = (page-1) * limit;

    return {page , limit , skip};
}


export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: Math.ceil(total / limit)>0 && page > 1,
});