const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const Lead = require('../src/models/Lead');
const Franchise = require('../src/models/Franchise');
const BusinessForSale = require('../src/models/BusinessForSale');
const { calculateLeadScore } = require('../src/utils/leadScoring');

/**
 * Idempotent migration script for leads:
 * Backfills:
 * - targetType = 'franchise' (if not set or legacy brandId present)
 * - targetId = brandId
 * - targetModel = 'Franchise'
 * - listingOwner = brandOwner
 * - statusHistory = initial array if missing or empty
 * - leadScore & scoreBreakdown
 * 
 * Returns { migratedCount, skippedCount }
 */
async function migrateLeads() {
  console.log('🔄 Running idempotent lead migration...');
  const leads = await Lead.find({});
  let migratedCount = 0;
  let skippedCount = 0;

  for (const lead of leads) {
    let modified = false;

    // 1. Backfill targetType, targetId, targetModel
    if (!lead.targetType || !lead.targetId) {
      if (lead.brandId) {
        lead.targetType = 'franchise';
        lead.targetId = lead.brandId;
        lead.targetModel = 'Franchise';
        modified = true;
      }
    }

    // 2. Backfill listingOwner from brandOwner
    if (!lead.listingOwner && lead.brandOwner) {
      lead.listingOwner = lead.brandOwner;
      modified = true;
    }

    // 3. Backfill statusHistory if empty
    if (!lead.statusHistory || lead.statusHistory.length === 0) {
      lead.statusHistory = [
        {
          from: 'none',
          to: lead.status || 'new',
          by: lead.investor,
          at: lead.createdAt || new Date(),
          reason: 'Migrated from legacy lead structure',
        },
      ];
      modified = true;
    }

    // 4. Backfill scoreBreakdown if missing
    if (!lead.scoreBreakdown || !lead.scoreBreakdown.budgetFit) {
      const scoring = calculateLeadScore({
        investmentBudget: lead.investmentBudget,
        timeline: lead.timeline,
        hasCommercialSpace: lead.hasCommercialSpace,
        spaceAvailableSqFt: lead.spaceAvailableSqFt,
        phone: lead.phone,
        city: lead.targetCity,
        message: lead.message,
      });

      lead.scoreBreakdown = scoring.breakdown;
      if (!lead.leadScore) lead.leadScore = scoring.score;
      modified = true;
    }

    if (modified) {
      await lead.save();
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`✅ Migration complete: ${migratedCount} leads updated, ${skippedCount} untouched.`);
  return { migratedCount, skippedCount };
}

// Standalone execution wrapper
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      const res = await migrateLeads();
      console.log('Result:', res);
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = migrateLeads;
