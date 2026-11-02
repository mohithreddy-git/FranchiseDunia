/**
 * Key field definitions for Franchise, Event, and BusinessForSale models.
 * Used for automatic re-approval logic:
 * When an approved listing is edited:
 * - If ANY key field is modified, status resets to 'pending'.
 * - If only non-key fields (typos in description, tags, etc.) are modified, status remains 'approved'.
 */

const KEY_FIELDS = {
  franchise: [
    'investmentMin',
    'investmentMax',
    'franchiseFee',
    'royaltyPercent',
    'industry',
    'spaceMinSqFt',
    'unitEconomics',
  ],
  event: [
    'startDate',
    'endDate',
    'venue',
    'city',
    'capacity',
    'ticketPrice',
    'type',
  ],
  business: [
    'listingType',
    'industry',
    'revenueBand',
    'profitBand',
    'askingPriceBand',
    'region',
    'protectedFinancials',
  ],
};

/**
 * Checks if a payload modifies any key field for the given listing type
 * @param {('franchise'|'event'|'business')} type
 * @param {Object} payload - Update payload
 * @param {Object} existingDoc - Existing document
 * @returns {boolean} true if at least one key field is changed
 */
function hasKeyFieldChanged(type, payload, existingDoc) {
  const fields = KEY_FIELDS[type] || [];
  for (const field of fields) {
    if (payload[field] !== undefined) {
      const newVal = JSON.stringify(payload[field]);
      const oldVal = JSON.stringify(existingDoc[field]);
      if (newVal !== oldVal) {
        return true;
      }
    }
  }
  return false;
}

module.exports = {
  KEY_FIELDS,
  hasKeyFieldChanged,
};
