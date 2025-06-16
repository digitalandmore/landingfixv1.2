// --- SCORING ALGORITHM REDESIGNED ---
// Sistema a voti fissi e proporzionali per garantire totali ≤ 100%
// Range per elemento: OS=1-6, IS=1-4 (max 10 per elemento)
// Con 16 elementi totali: max teorico = 160, scalato a 100

// --- DYNAMIC BENCHMARK CALCULATION ---
// Calculates the ideal benchmark score based on user's context
function calculateDynamicBenchmark(focus, industry, goals) {
  const baseBenchmarks = {
    copywriting: {
      saas: { base: 65, factors: { leadGeneration: +5, brandAwareness: -3, sales: +8 } },
      ecommerce: { base: 60, factors: { leadGeneration: -2, brandAwareness: +3, sales: +10 } },
      services: { base: 62, factors: { leadGeneration: +8, brandAwareness: +2, sales: +5 } },
      coaching: { base: 63, factors: { leadGeneration: +6, brandAwareness: +4, sales: +3 } },
      local: { base: 58, factors: { leadGeneration: +4, brandAwareness: +6, sales: +7 } },
      health: { base: 61, factors: { leadGeneration: +5, brandAwareness: +3, sales: +6 } },
      other: { base: 60, factors: { leadGeneration: +3, brandAwareness: +3, sales: +3 } }
    },
    uxui: {
      saas: { base: 68, factors: { leadGeneration: +3, brandAwareness: +5, sales: +2 } },
      ecommerce: { base: 72, factors: { leadGeneration: -1, brandAwareness: +7, sales: +4 } },
      services: { base: 65, factors: { leadGeneration: +4, brandAwareness: +3, sales: +3 } },
      coaching: { base: 64, factors: { leadGeneration: +3, brandAwareness: +5, sales: +2 } },
      local: { base: 63, factors: { leadGeneration: +2, brandAwareness: +4, sales: +3 } },
      health: { base: 66, factors: { leadGeneration: +3, brandAwareness: +2, sales: +4 } },
      other: { base: 65, factors: { leadGeneration: +2, brandAwareness: +2, sales: +2 } }
    },
    mobile: {
      saas: { base: 62, factors: { leadGeneration: +4, brandAwareness: +2, sales: +6 } },
      ecommerce: { base: 58, factors: { leadGeneration: +2, brandAwareness: +4, sales: +8 } },
      services: { base: 60, factors: { leadGeneration: +5, brandAwareness: +3, sales: +4 } },
      coaching: { base: 61, factors: { leadGeneration: +4, brandAwareness: +4, sales: +3 } },
      local: { base: 59, factors: { leadGeneration: +3, brandAwareness: +5, sales: +5 } },
      health: { base: 60, factors: { leadGeneration: +4, brandAwareness: +3, sales: +4 } },
      other: { base: 60, factors: { leadGeneration: +3, brandAwareness: +3, sales: +3 } }
    },
    cta: {
      saas: { base: 55, factors: { leadGeneration: +8, brandAwareness: +2, sales: +10 } },
      ecommerce: { base: 52, factors: { leadGeneration: +5, brandAwareness: +3, sales: +12 } },
      services: { base: 57, factors: { leadGeneration: +7, brandAwareness: +4, sales: +8 } },
      coaching: { base: 54, factors: { leadGeneration: +6, brandAwareness: +5, sales: +7 } },
      local: { base: 56, factors: { leadGeneration: +5, brandAwareness: +6, sales: +6 } },
      health: { base: 55, factors: { leadGeneration: +6, brandAwareness: +4, sales: +7 } },
      other: { base: 55, factors: { leadGeneration: +5, brandAwareness: +4, sales: +6 } }
    },
    seo: {
      saas: { base: 63, factors: { leadGeneration: +4, brandAwareness: +6, sales: +3 } },
      ecommerce: { base: 61, factors: { leadGeneration: +3, brandAwareness: +5, sales: +5 } },
      services: { base: 59, factors: { leadGeneration: +6, brandAwareness: +4, sales: +4 } },
      coaching: { base: 60, factors: { leadGeneration: +5, brandAwareness: +5, sales: +3 } },
      local: { base: 57, factors: { leadGeneration: +7, brandAwareness: +3, sales: +6 } },
      health: { base: 62, factors: { leadGeneration: +4, brandAwareness: +4, sales: +4 } },
      other: { base: 60, factors: { leadGeneration: +4, brandAwareness: +4, sales: +4 } }
    }
  };

  function normalizeGoal(goal) {
    const goalMap = {
      'Lead Generation': 'leadGeneration',
      'Brand Awareness': 'brandAwareness', 
      'Sales': 'sales',
      'User Engagement': 'userEngagement',
      'My landing page is not converting': 'sales'
    };
    return goalMap[goal] || 'leadGeneration';
  }

  const benchmarkData = baseBenchmarks[focus]?.[industry] || { base: 60, factors: {} };
  let score = benchmarkData.base;
  
  if (Array.isArray(goals)) {
    goals.forEach(goal => {
      const goalKey = normalizeGoal(goal);
      score += benchmarkData.factors[goalKey] || 0;
    });
  }
  
  return Math.min(85, Math.max(50, score));
}

// --- OPTIMIZATION SCORE CALCULATION ---
// Range fisso: 1-6 punti per elemento (current state vs benchmark)
function calculateElementOptimization(element, industry, category, focusKey, hasContent = false, benchmark = 65) {
  // Matrice base: voti da 1 a 6 per ogni elemento
  const optimizationScores = {
    copywriting: {
      "General clarity & tone": hasContent ? 4 : 2,
      "Value proposition clarity": hasContent ? 3 : 2,
      "Consistency with audience": hasContent ? 5 : 3,
      "Main headline": hasContent ? 5 : 2,
      "Subheadline": hasContent ? 4 : 2,
      "Section titles": hasContent ? 4 : 3,
      "Hero image": hasContent ? 3 : 1,
      "Intro video": hasContent ? 2 : 1,
      "Paragraphs & explanations": hasContent ? 4 : 2,
      "Microcopy (forms/buttons)": hasContent ? 3 : 1,
      "CTA text": hasContent ? 2 : 1,
      "Lead capture form": hasContent ? 3 : 1,
      "Social proof & testimonials": hasContent ? 4 : 1,
      "Trust signals": hasContent ? 4 : 2,
      "Objection handling": hasContent ? 3 : 1,
      "Trust badges": hasContent ? 5 : 4
    },
    uxui: {
      "First impression": hasContent ? 3 : 2,
      "Visual hierarchy": hasContent ? 4 : 3,
      "Consistency": hasContent ? 5 : 4,
      "Section organization": hasContent ? 4 : 3,
      "Whitespace usage": hasContent ? 5 : 4,
      "Content grouping": hasContent ? 4 : 3,
      "Images & icons": hasContent ? 4 : 3,
      "Video elements": hasContent ? 3 : 2,
      "Trust badges": hasContent ? 5 : 4,
      "Imagery/icons": hasContent ? 4 : 3,
      "Color contrast": hasContent ? 4 : 3,
      "Security badges": hasContent ? 5 : 4,
      "Menu clarity": hasContent ? 4 : 3,
      "Link visibility": hasContent ? 4 : 3,
      "Keyboard navigation": hasContent ? 3 : 2,
      "Contact form": hasContent ? 3 : 2
    },
    mobile: {
      "Mobile-first impression": hasContent ? 3 : 2,
      "Responsiveness": hasContent ? 2 : 1,
      "Touch usability": hasContent ? 3 : 2,
      "Font size": hasContent ? 4 : 3,
      "Spacing": hasContent ? 5 : 4,
      "Content stacking": hasContent ? 4 : 3,
      "Mobile images": hasContent ? 4 : 3,
      "Mobile video": hasContent ? 3 : 2,
      "Button size": hasContent ? 4 : 3,
      "Touch targets": hasContent ? 4 : 3,
      "Mobile load speed": hasContent ? 2 : 1,
      "Mobile forms": hasContent ? 3 : 2,
      "Menu usability": hasContent ? 4 : 3,
      "Sticky elements": hasContent ? 5 : 4,
      "Tap feedback": hasContent ? 4 : 3,
      "Mobile badges": hasContent ? 6 : 5
    },
    cta: {
      "CTA visibility": hasContent ? 2 : 1,
      "CTA relevance": hasContent ? 3 : 2,
      "CTA frequency": hasContent ? 4 : 3,
      "Button style": hasContent ? 4 : 3,
      "Color contrast": hasContent ? 4 : 3,
      "Size & shape": hasContent ? 4 : 3,
      "CTA icons": hasContent ? 5 : 4,
      "CTA video": hasContent ? 4 : 3,
      "Clarity of text": hasContent ? 2 : 1,
      "Action verbs": hasContent ? 3 : 2,
      "Urgency or scarcity": hasContent ? 4 : 3,
      "CTA form": hasContent ? 3 : 2,
      "Above the fold": hasContent ? 2 : 1,
      "End-of-section CTAs": hasContent ? 4 : 3,
      "Logical flow": hasContent ? 3 : 2,
      "CTA badges": hasContent ? 5 : 4
    },
    seo: {
      "SEO basics": hasContent ? 2 : 4,
      "Indexability": hasContent ? 3 : 4,
      "Meta tags presence": hasContent ? 2 : 3,
      "H1/H2 structure": hasContent ? 2 : 4,
      "Alt text for images": hasContent ? 2 : 3,
      "Internal links": hasContent ? 2 : 3,
      "Video SEO": hasContent ? 2 : 3,
      "Page speed": hasContent ? 4 : 4,
      "Mobile-friendliness": hasContent ? 3 : 4,
      "Schema markup": hasContent ? 2 : 3,
      "Image optimization": hasContent ? 2 : 3,
      "Keyword usage": hasContent ? 2 : 4,
      "Content depth": hasContent ? 2 : 3,
      "Duplicate content": hasContent ? 1 : 2,
      "SEO forms": hasContent ? 2 : 3
    }
  };

  // Aggiustamenti per industry (-1, 0, +1)
  const industryAdjustments = {
    saas: { copywriting: 0, uxui: +1, mobile: 0, cta: -1, seo: 0 },
    ecommerce: { copywriting: 0, uxui: 0, mobile: -1, cta: -1, seo: 0 },
    services: { copywriting: -1, uxui: +1, mobile: 0, cta: 0, seo: 0 },
    coaching: { copywriting: -1, uxui: 0, mobile: 0, cta: -1, seo: 0 },
    local: { copywriting: 0, uxui: 0, mobile: 0, cta: 0, seo: -1 },
    health: { copywriting: 0, uxui: 0, mobile: 0, cta: 0, seo: 0 },
    other: { copywriting: 0, uxui: 0, mobile: 0, cta: 0, seo: 0 }
  };

  const baseScore = optimizationScores[focusKey]?.[element] || 3;
  const adjustment = industryAdjustments[industry]?.[focusKey] || 0;
  const finalScore = Math.max(1, Math.min(6, baseScore + adjustment));

  return finalScore;
}

// --- IMPACT SCORE CALCULATION ---
// Range fisso: 1-4 punti per elemento (improvement potential)
function calculateElementImpact(element, industry, category, focusKey, hasContent = false, optimizationScore = 3) {
  // Matrice base: voti da 1 a 4 per ogni elemento
  const impactScores = {
    copywriting: {
      "General clarity & tone": hasContent ? 2 : 4,
      "Value proposition clarity": hasContent ? 3 : 4,
      "Consistency with audience": hasContent ? 2 : 3,
      "Main headline": hasContent ? 3 : 4,
      "Subheadline": hasContent ? 2 : 3,
      "Section titles": hasContent ? 2 : 3,
      "Hero image": hasContent ? 2 : 3,
      "Intro video": hasContent ? 2 : 3,
      "Paragraphs & explanations": hasContent ? 2 : 3,
      "Microcopy (forms/buttons)": hasContent ? 3 : 3,
      "CTA text": hasContent ? 4 : 4,
      "Lead capture form": hasContent ? 3 : 3,
      "Social proof & testimonials": hasContent ? 3 : 4,
      "Trust signals": hasContent ? 2 : 3,
      "Objection handling": hasContent ? 2 : 3,
      "Trust badges": hasContent ? 1 : 2
    },
    uxui: {
      "First impression": hasContent ? 4 : 4,
      "Visual hierarchy": hasContent ? 3 : 3,
      "Consistency": hasContent ? 2 : 3,
      "Section organization": hasContent ? 3 : 3,
      "Whitespace usage": hasContent ? 2 : 2,
      "Content grouping": hasContent ? 2 : 3,
      "Images & icons": hasContent ? 2 : 3,
      "Video elements": hasContent ? 3 : 4,
      "Trust badges": hasContent ? 1 : 2,
      "Imagery/icons": hasContent ? 2 : 3,
      "Color contrast": hasContent ? 2 : 3,
      "Security badges": hasContent ? 1 : 2,
      "Menu clarity": hasContent ? 3 : 3,
      "Link visibility": hasContent ? 2 : 3,
      "Keyboard navigation": hasContent ? 2 : 3,
      "Contact form": hasContent ? 3 : 4
    },
    mobile: {
      "Mobile-first impression": hasContent ? 4 : 4,
      "Responsiveness": hasContent ? 4 : 4,
      "Touch usability": hasContent ? 3 : 4,
      "Font size": hasContent ? 2 : 3,
      "Spacing": hasContent ? 1 : 2,
      "Content stacking": hasContent ? 2 : 4,
      "Mobile images": hasContent ? 2 : 3,
      "Mobile video": hasContent ? 2 : 3,
      "Button size": hasContent ? 2 : 3,
      "Touch targets": hasContent ? 2 : 3,
      "Mobile load speed": hasContent ? 4 : 4,
      "Mobile forms": hasContent ? 3 : 4,
      "Menu usability": hasContent ? 3 : 3,
      "Sticky elements": hasContent ? 1 : 2,
      "Tap feedback": hasContent ? 2 : 3,
      "Mobile badges": hasContent ? 1 : 1
    },
    cta: {
      "CTA visibility": hasContent ? 4 : 4,
      "CTA relevance": hasContent ? 3 : 4,
      "CTA frequency": hasContent ? 2 : 3,
      "Button style": hasContent ? 2 : 3,
      "Color contrast": hasContent ? 2 : 3,
      "Size & shape": hasContent ? 2 : 3,
      "CTA icons": hasContent ? 1 : 2,
      "CTA video": hasContent ? 2 : 3,
      "Clarity of text": hasContent ? 4 : 4,
      "Action verbs": hasContent ? 3 : 4,
      "Urgency or scarcity": hasContent ? 2 : 3,
      "CTA form": hasContent ? 3 : 4,
      "Above the fold": hasContent ? 4 : 4,
      "End-of-section CTAs": hasContent ? 2 : 3,
      "Logical flow": hasContent ? 3 : 4,
      "CTA badges": hasContent ? 1 : 2
    },
    seo: {
      "SEO basics": hasContent ? 2 : 4,
      "Indexability": hasContent ? 3 : 4,
      "Meta tags presence": hasContent ? 2 : 3,
      "H1/H2 structure": hasContent ? 2 : 4,
      "Alt text for images": hasContent ? 2 : 3,
      "Internal links": hasContent ? 2 : 3,
      "Video SEO": hasContent ? 2 : 3,
      "Page speed": hasContent ? 4 : 4,
      "Mobile-friendliness": hasContent ? 3 : 4,
      "Schema markup": hasContent ? 2 : 3,
      "Image optimization": hasContent ? 2 : 3,
      "Keyword usage": hasContent ? 2 : 4,
      "Content depth": hasContent ? 2 : 3,
      "Duplicate content": hasContent ? 1 : 2,
      "SEO forms": hasContent ? 2 : 3
    }
  };

  // Aggiustamenti per industry (-1, 0, +1)
  const industryAdjustments = {
    saas: { copywriting: +1, uxui: 0, mobile: 0, cta: +1, seo: 0 },
    ecommerce: { copywriting: 0, uxui: +1, mobile: +1, cta: +1, seo: 0 },
    services: { copywriting: +1, uxui: 0, mobile: 0, cta: +1, seo: +1 },
    coaching: { copywriting: +1, uxui: 0, mobile: 0, cta: +1, seo: 0 },
    local: { copywriting: 0, uxui: 0, mobile: +1, cta: 0, seo: +1 },
    health: { copywriting: +1, uxui: 0, mobile: 0, cta: +1, seo: +1 },
    other: { copywriting: 0, uxui: 0, mobile: 0, cta: 0, seo: 0 }
  };

  const baseScore = impactScores[focusKey]?.[element] || 3;
  const adjustment = industryAdjustments[industry]?.[focusKey] || 0;
  const finalScore = Math.max(1, Math.min(4, baseScore + adjustment));

  return finalScore;
}

// --- TIMING CALCULATION ---
// Calculates realistic implementation time based on element complexity and impact
function calculateElementTiming(element, industry, category, focusKey, impact) {
  const timingMatrix = {
    copywriting: {
      "General clarity & tone": 45,
      "Value proposition clarity": 60,
      "Consistency with audience": 30,
      "Main headline": 30,
      "Subheadline": 20,
      "Section titles": 25,
      "Hero image": 40,
      "Intro video": 120,
      "Paragraphs & explanations": 50,
      "Microcopy (forms/buttons)": 20,
      "CTA text": 25,
      "Lead capture form": 35,
      "Social proof & testimonials": 60,
      "Trust signals": 30,
      "Objection handling": 45,
      "Trust badges": 15
    },
    uxui: {
      "First impression": 90,
      "Visual hierarchy": 60,
      "Consistency": 45,
      "Section organization": 75,
      "Whitespace usage": 30,
      "Content grouping": 45,
      "Images & icons": 40,
      "Video elements": 60,
      "Trust badges": 20,
      "Imagery/icons": 35,
      "Color contrast": 25,
      "Security badges": 15,
      "Menu clarity": 45,
      "Link visibility": 30,
      "Keyboard navigation": 60,
      "Contact form": 50
    },
    mobile: {
      "Mobile-first impression": 120,
      "Responsiveness": 180,
      "Touch usability": 90,
      "Font size": 30,
      "Spacing": 45,
      "Content stacking": 60,
      "Mobile images": 40,
      "Mobile video": 75,
      "Button size": 25,
      "Touch targets": 35,
      "Mobile load speed": 120,
      "Mobile forms": 60,
      "Menu usability": 45,
      "Sticky elements": 30,
      "Tap feedback": 40,
      "Mobile badges": 20
    },
    cta: {
      "CTA visibility": 30,
      "CTA relevance": 45,
      "CTA frequency": 60,
      "Button style": 25,
      "Color contrast": 20,
      "Size & shape": 25,
      "CTA icons": 30,
      "CTA video": 90,
      "Clarity of text": 25,
      "Action verbs": 20,
      "Urgency or scarcity": 35,
      "CTA form": 45,
      "Above the fold": 30,
      "End-of-section CTAs": 40,
      "Logical flow": 75,
      "CTA badges": 20
    },
    seo: {
      "SEO basics": 60,
      "Indexability": 45,
      "Meta tags presence": 30,
      "H1/H2 structure": 40,
      "Alt text for images": 50,
      "Internal links": 60,
      "Video SEO": 75,
      "Page speed": 120,
      "Mobile-friendliness": 90,
      "Schema markup": 75,
      "Image optimization": 60,
      "Keyword usage": 45,
      "Content depth": 180,
      "Duplicate content": 30,
      "SEO forms": 35
    }
  };

  const industryTimeMultipliers = {
    saas: 1.2,
    ecommerce: 1.1,
    services: 1.0,
    coaching: 0.9,
    local: 0.8,
    health: 1.3,
    other: 1.0
  };

  const baseTime = timingMatrix[focusKey]?.[element] || 45;
  const industryMultiplier = industryTimeMultipliers[industry] || 1.0;
  
  // High impact items need more time for proper implementation
  const impactMultiplier = impact >= 25 ? 1.2 : impact >= 15 ? 1.0 : 0.9;
  
  const totalMinutes = Math.round(baseTime * industryMultiplier * impactMultiplier);
  
  // Convert to standard timing categories
  if (totalMinutes <= 30) return '15-30 min';
  if (totalMinutes <= 60) return '30-60 min';
  if (totalMinutes <= 120) return '1-2 hours';
  return '3-6 hours';
}

// --- CATEGORY SCORE CALCULATION ---
// Somma diretta degli elementi (no scaling qui)
function calculateCategoryScores(elements) {
  if (!elements || elements.length === 0) {
    return { optimizationScore: 0, impactScore: 0, timingMinutes: 0 };
  }

  const optimizationSum = elements.reduce((sum, el) => sum + (el.metrics?.optimization || 0), 0);
  const impactSum = elements.reduce((sum, el) => sum + (el.metrics?.impact || 0), 0);
  
  const timingMinutes = elements.reduce((sum, el) => {
    const timing = el.metrics?.timing || '45 min';
    return sum + timingToMinutes(timing);
  }, 0);

  console.log(`Category calculation:`, {
    elementCount: elements.length,
    individual_scores: elements.map(el => ({
      element: el.element,
      optimization: el.metrics?.optimization || 0,
      impact: el.metrics?.impact || 0,
      total: (el.metrics?.optimization || 0) + (el.metrics?.impact || 0)
    })),
    optimizationSum: optimizationSum,
    impactSum: impactSum,
    categoryTotal: optimizationSum + impactSum
  });

  return {
    optimizationScore: optimizationSum,
    impactScore: impactSum,
    timingMinutes: timingMinutes
  };
}

// --- FINAL TOTALS CALCULATION ---
// Calcola i totali finali SENZA scaling artificiale - mostra i valori reali
function calculateFinalTotals(categories) {
  if (!categories || categories.length === 0) {
    return { optimizationScoreTotale: 0, impactScoreTotale: 0, totalTimingMinutes: 0 };
  }

  const optimizationSum = categories.reduce((sum, cat) => sum + (cat.optimizationScore || 0), 0);
  const impactSum = categories.reduce((sum, cat) => sum + (cat.impactScore || 0), 0);
  const totalTimingMinutes = categories.reduce((sum, cat) => sum + (cat.timingMinutes || 0), 0);

  // NESSUNO SCALING ARTIFICIALE - mostra i valori reali
  const finalOptimization = optimizationSum;
  const finalImpact = impactSum;
  const finalTotal = finalOptimization + finalImpact;

  console.log('Final totals - RAW VALUES (no artificial scaling):', {
    categoryBreakdown: categories.map(cat => ({
      category: cat.category || 'Unknown',
      optimization: cat.optimizationScore || 0,
      impact: cat.impactScore || 0,
      total: (cat.optimizationScore || 0) + (cat.impactScore || 0)
    })),
    rawOptimizationSum: optimizationSum,
    rawImpactSum: impactSum,
    rawTotal: finalTotal,
    finalOptimization: finalOptimization,
    finalImpact: finalImpact,
    finalTotal: finalTotal,
    isRealistic: finalTotal <= 100,
    note: 'Showing real calculated values without artificial scaling'
  });

  return {
    optimizationScoreTotale: finalOptimization,
    impactScoreTotale: finalImpact,
    totalTimingMinutes: totalTimingMinutes
  };
}

// --- UTILITY FUNCTIONS ---
function timingToMinutes(timing) {
  if (!timing) return 45; // Default fallback
  const t = timing.toLowerCase();
  if (t.includes('15-30 min')) return 22;
  if (t.includes('30-60 min')) return 45;
  if (t.includes('1-2 hours') || t.includes('1-2 ore')) return 90;
  if (t.includes('3-6 hours') || t.includes('3-6 ore')) return 270;
  
  const numbers = t.match(/\d+/g);
  if (numbers) {
    if (t.includes('h') || t.includes('hours') || t.includes('ore')) {
      return parseInt(numbers[0]) * 60;
    }
    return parseInt(numbers[0]);
  }
  return 45;
}

function formatTiming(minutes) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 120) return `1-2 hours`;
  if (minutes < 240) return `2-4 hours`;
  if (minutes < 360) return `4-6 hours`;
  const hours = Math.floor(minutes / 60);
  return `${hours}+ hours`;
}

// --- VALIDATION FUNCTIONS ---
function validateConstraint(optimization, impact) {
  const total = optimization + impact;
  if (total > 100) {
    console.warn(`Constraint violation: ${optimization}% + ${impact}% = ${total}% > 100%`);
    return false;
  }
  return true;
}

function enforceConstraint(optimization, impact) {
  const total = optimization + impact;
  if (total <= 100) return { optimization, impact };
  
  const ratio = 100 / total;
  return {
    optimization: Math.round(optimization * ratio),
    impact: Math.round(impact * ratio)
  };
}

module.exports = {
  calculateDynamicBenchmark,
  calculateElementOptimization,
  calculateElementImpact,
  calculateElementTiming,
  calculateCategoryScores,
  calculateFinalTotals,
  timingToMinutes,
  formatTiming,
  validateConstraint,
  enforceConstraint
};