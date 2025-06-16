// Focus Categories and Elements Structure
// Canonical structure for each focus area

const focusCategories = {
  copywriting: [
    {
      category: "Copywriting Overview",
      elements: ["General clarity & tone", "Value proposition clarity", "Consistency with audience"],
      focusHint: "copywriting analysis of tone, value props, and audience"
    },
    {
      category: "Headlines, Subheadlines & Visuals", 
      elements: ["Main headline", "Subheadline", "Section titles", "Hero image", "Intro video"],
      focusHint: "copywriting analysis of headlines, subheads, and visual content"
    },
    {
      category: "Body, CTA Copy & Forms",
      elements: ["Paragraphs & explanations", "Microcopy (forms/buttons)", "CTA text", "Lead capture form"],
      focusHint: "copywriting analysis of body text, CTAs, and form copy"
    },
    {
      category: "Persuasion, Trust & Badges",
      elements: ["Social proof & testimonials", "Trust signals", "Objection handling", "Trust badges"],
      focusHint: "copywriting analysis of persuasion elements and trust building"
    }
  ],
  uxui: [
    {
      category: "UX/UI Overview",
      elements: ["First impression", "Visual hierarchy", "Consistency"],
      focusHint: "UX/UI analysis of overall user experience and visual design"
    },
    {
      category: "Layout, Structure & Media",
      elements: ["Section organization", "Whitespace usage", "Content grouping", "Images & icons", "Video elements"],
      focusHint: "UX/UI analysis of layout, structure, and media elements"
    },
    {
      category: "Trust, Visual Elements & Badges",
      elements: ["Trust badges", "Imagery/icons", "Color contrast", "Security badges"],
      focusHint: "UX/UI analysis of trust indicators and visual elements"
    },
    {
      category: "Navigation, Accessibility & Forms",
      elements: ["Menu clarity", "Link visibility", "Keyboard navigation", "Contact form"],
      focusHint: "UX/UI analysis of navigation, accessibility, and form design"
    }
  ],
  mobile: [
    {
      category: "Mobile Overview",
      elements: ["Mobile-first impression", "Responsiveness", "Touch usability"],
      focusHint: "mobile optimization analysis of overall mobile experience"
    },
    {
      category: "Layout, Readability & Media",
      elements: ["Font size", "Spacing", "Content stacking", "Mobile images", "Mobile video"],
      focusHint: "mobile optimization analysis of layout, readability, and media"
    },
    {
      category: "Buttons, Forms & Performance",
      elements: ["Button size", "Touch targets", "Mobile load speed", "Mobile forms"],
      focusHint: "mobile optimization analysis of interactive elements and performance"
    },
    {
      category: "Mobile Navigation & Sticky Elements",
      elements: ["Menu usability", "Sticky elements", "Tap feedback", "Mobile badges"],
      focusHint: "mobile optimization analysis of navigation and sticky elements"
    }
  ],
  cta: [
    {
      category: "CTA Overview",
      elements: ["CTA visibility", "CTA relevance", "CTA frequency"],
      focusHint: "CTA optimization analysis of visibility, relevance, and frequency"
    },
    {
      category: "CTA Design & Media",
      elements: ["Button style", "Color contrast", "Size & shape", "CTA icons", "CTA video"],
      focusHint: "CTA optimization analysis of design and visual elements"
    },
    {
      category: "CTA Messaging & Forms",
      elements: ["Clarity of text", "Action verbs", "Urgency or scarcity", "CTA form"],
      focusHint: "CTA optimization analysis of messaging and form integration"
    },
    {
      category: "CTA Placement, Flow & Badges",
      elements: ["Above the fold", "End-of-section CTAs", "Logical flow", "CTA badges"],
      focusHint: "CTA optimization analysis of placement, flow, and trust elements"
    }
  ],
  seo: [
    {
      category: "SEO Overview",
      elements: ["SEO basics", "Indexability", "Meta tags presence"],
      focusHint: "SEO analysis of basic optimization, indexing, and meta elements"
    },
    {
      category: "On-page Elements & Media",
      elements: ["H1/H2 structure", "Alt text for images", "Internal links", "Video SEO"],
      focusHint: "SEO analysis of on-page elements, media optimization, and linking"
    },
    {
      category: "Technical SEO & Performance",
      elements: ["Page speed", "Mobile-friendliness", "Schema markup", "Image optimization"],
      focusHint: "SEO analysis of technical performance, mobile optimization, and structured data"
    },
    {
      category: "Content Optimization & Forms",
      elements: ["Keyword usage", "Content depth", "Duplicate content", "SEO forms"],
      focusHint: "SEO analysis of content optimization, keyword strategy, and form optimization"
    }
  ]
};

// Helper function to get expected elements for validation
const getExpectedElementsForFocus = (focus) => {
  if (!focusCategories[focus]) return [];
  
  return focusCategories[focus].map(category => ({
    category: category.category,
    elements: category.elements,
    focusHint: category.focusHint
  }));
};

// Helper to check if focus categories are correctly defined
const isFocusValid = (focus) => {
  return focusCategories.hasOwnProperty(focus) && Array.isArray(focusCategories[focus]);
};

// Helper to get focus-specific debugging info
const getFocusDebugInfo = (focus) => {
  if (!isFocusValid(focus)) {
    return { error: `Invalid focus: ${focus}` };
  }
  
  return {
    focus: focus,
    totalCategories: focusCategories[focus].length,
    totalElements: focusCategories[focus].reduce((sum, cat) => sum + cat.elements.length, 0),
    categories: focusCategories[focus].map(cat => ({
      name: cat.category,
      elementCount: cat.elements.length,
      elements: cat.elements
    }))
  };
};

module.exports = {
  focusCategories,
  getExpectedElementsForFocus,
  isFocusValid,
  getFocusDebugInfo
};
