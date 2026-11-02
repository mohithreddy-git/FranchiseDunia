const SavedListing = require('../models/SavedListing');

/**
 * Attaches isSaved: boolean to a list of listing documents for the authenticated user
 * Executes ONE single $in query across the entire page array, preventing N+1 queries.
 * 
 * @param {Array<Object>} items - Array of documents (must have _id or id)
 * @param {('franchise'|'event'|'business')} targetType
 * @param {Object|null} user - The authenticated user (or null/undefined)
 * @returns {Promise<Array<Object>>} Items with isSaved attached
 */
async function attachSavedFlags(items, targetType, user) {
  if (!items || !items.length || !user || !user._id) {
    return items.map((item) => {
      const obj = item.toObject ? item.toObject() : { ...item };
      obj.isSaved = false;
      return obj;
    });
  }

  const ids = items.map((item) => item._id || item.id);

  // EXACTLY ONE SINGLE DB QUERY
  const savedRecords = await SavedListing.find({
    user: user._id,
    targetType,
    targetId: { $in: ids },
  }).select('targetId');

  const savedSet = new Set(savedRecords.map((r) => r.targetId.toString()));

  return items.map((item) => {
    const obj = item.toObject ? item.toObject() : { ...item };
    const itemId = (obj._id || obj.id).toString();
    obj.isSaved = savedSet.has(itemId);
    return obj;
  });
}

module.exports = {
  attachSavedFlags,
};
