/**
 * Fetches paginated results from a MongoDB collection.
 *
 * @param {Collection} collection - MongoDB collection instance.
 * @param {Object} query - MongoDB query object to filter documents.
 * @param {number} page - Current page number (0-based index).
 * @param {number} pageSize - Number of items per page.
 * @returns {Promise<Array>} Paginated results.
 */
export default async function paginateCollection(
  collection, query, page, pageSize,
) {
  const skip = page * pageSize;

  return collection.aggregate([
    { $match: query },
    { $skip: skip },
    { $limit: pageSize },
  ]).toArray();
}
