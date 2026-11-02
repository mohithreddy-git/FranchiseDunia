/**
 * Deterministic Server-Side Lead Scoring Function
 * Evaluates inquiries on a 0-100 scale using five objective heuristic dimensions:
 * 1. Budget Fit vs Target Investment (0-40 pts)
 * 2. Timeline Urgency (0-20 pts)
 * 3. Profile Completeness (0-15 pts)
 * 4. Account Trust & Age (0-10 pts)
 * 5. Message Depth & Quality (0-15 pts)
 * 
 * Note: Lead scores serve as a preliminary triage heuristic.
 */

function calculateLeadScore({
  investmentBudget,
  targetListing = null,
  timeline,
  hasCommercialSpace = false,
  spaceAvailableSqFt = 0,
  phone = '',
  city = '',
  company = '',
  user = null,
  message = '',
}) {
  let budgetFit = 0;
  let timelineUrgency = 0;
  let profileCompleteness = 0;
  let accountTrust = 0;
  let messageQuality = 0;

  // 1. Budget Fit (0-40 pts)
  const budget = Number(investmentBudget) || 0;
  if (targetListing) {
    const minTarget = targetListing.investmentMin || 0;
    const maxTarget = targetListing.investmentMax || (minTarget * 1.5);

    if (minTarget > 0) {
      if (budget >= maxTarget) {
        budgetFit = 40; // Exceeds upper requirement
      } else if (budget >= minTarget) {
        budgetFit = 35; // Comfortably matches minimum requirement
      } else if (budget >= minTarget * 0.8) {
        budgetFit = 20; // Within 80% of minimum requirement
      } else if (budget >= minTarget * 0.5) {
        budgetFit = 10; // Partial budget match
      } else {
        budgetFit = 5;  // Under-budget
      }
    } else {
      budgetFit = budget >= 1000000 ? 35 : 25;
    }
  } else {
    budgetFit = budget >= 1000000 ? 35 : 25;
  }

  // 2. Timeline Urgency (0-20 pts)
  if (timeline === 'Immediately (Within 30 days)') {
    timelineUrgency = 20;
  } else if (timeline === '1 - 3 Months') {
    timelineUrgency = 15;
  } else if (timeline === '3 - 6 Months') {
    timelineUrgency = 10;
  } else {
    timelineUrgency = 5; // 'Exploring Options'
  }

  // 3. Profile Completeness (0-15 pts)
  if (hasCommercialSpace && spaceAvailableSqFt > 0) profileCompleteness += 7;
  else if (hasCommercialSpace) profileCompleteness += 4;
  if (company && company.trim().length > 1) profileCompleteness += 4;
  if (city && city.trim().length > 1) profileCompleteness += 4;
  profileCompleteness = Math.min(15, profileCompleteness);

  // 4. Account Trust (0-10 pts)
  // account age (0-5 pts) + profile completeness of phone/city (0-5 pts)
  if (user && user.createdAt) {
    const daysOld = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld >= 30) accountTrust += 5;
    else if (daysOld >= 7) accountTrust += 3;
    else accountTrust += 1;
  } else {
    accountTrust += 2;
  }

  const phoneValid = phone && phone.replace(/\D/g, '').length >= 10;
  const cityValid = city && city.trim().length >= 2;
  if (phoneValid && cityValid) accountTrust += 5;
  else if (phoneValid || cityValid) accountTrust += 3;
  accountTrust = Math.min(10, accountTrust);

  // 5. Message Depth & Quality (0-15 pts)
  const trimmedMsg = (message || '').trim();
  const len = trimmedMsg.length;
  if (len >= 200) {
    messageQuality = 15;
  } else if (len >= 100) {
    messageQuality = 12;
  } else if (len >= 50) {
    messageQuality = 8;
  } else if (len >= 15) {
    messageQuality = 5;
  } else {
    messageQuality = 2;
  }

  const totalScore = Math.min(100, Math.max(0, budgetFit + timelineUrgency + profileCompleteness + accountTrust + messageQuality));

  return {
    score: totalScore,
    breakdown: {
      budgetFit,
      timelineUrgency,
      profileCompleteness,
      accountTrust,
      messageQuality,
    },
  };
}

module.exports = {
  calculateLeadScore,
};
