// Advanced AI Prompting System for LandingFix AI
// Dynamic analysis with AI-driven problem identification and solution generation

// Import categories from external file
const { focusCategories, getExpectedElementsForFocus } = require('./categories.js');

// Main prompt generator - CORE AI ANALYSIS SYSTEM  
function generateAdvancedPrompt(url, focus, industry, goals, visibleText, mainContent) {
  // Get the EXACT structure for the current focus
  const expectedStructure = getExpectedElementsForFocus(focus);
  
  if (!expectedStructure || expectedStructure.length === 0) {
    console.error(`No structure found for focus: ${focus}, falling back to copywriting`);
    return generateAdvancedPrompt(url, 'copywriting', industry, goals, visibleText, mainContent);
  }

  // Generate focus-specific JSON structure with EXACT category and element names
  const focusSpecificStructure = expectedStructure.map(cat => {
    const elementsExample = cat.elements.map(element => ({
      element: element, // EXACT element name required
      siteText: "ACTUAL text from page or 'Not found'",
      problem: `SPECIFIC ${focus} problem with ${element}`,
      solution: `DETAILED ${focus} solution for ${element}`,
      actions: [`${focus}-specific action 1 for ${element}`, `${focus}-specific action 2 for ${element}`, `${focus}-specific action 3 for ${element}`]
    }));
    
    return {
      category: cat.category, // EXACT category name required
      elements: elementsExample
    };
  });

  // Create category list for strict validation
  const categoryValidation = expectedStructure.map((cat, index) => 
    `${index + 1}. EXACTLY "${cat.category}" with elements: ${cat.elements.join(', ')}`
  ).join('\n');

  return `You are an expert ${focus.toUpperCase()} conversion specialist analyzing a ${industry} landing page.

**CRITICAL INSTRUCTIONS - READ CAREFULLY:**
1. You MUST analyze the page for ${focus.toUpperCase()} optimization, NOT copywriting
2. You MUST use the EXACT category and element names specified below
3. NEVER change category names or element names
4. Focus your analysis on ${focus} best practices and optimization
5. Extract real text from the page content provided
6. Provide ${focus}-specific problems, solutions, and actions

**MANDATORY CATEGORIES AND ELEMENTS FOR ${focus.toUpperCase()} FOCUS:**
YOU MUST USE EXACTLY THESE NAMES - NO VARIATIONS ALLOWED:

${categoryValidation}

**${focus.toUpperCase()} ANALYSIS REQUIREMENTS:**
- Focus on ${focus} optimization techniques and best practices
- Identify ${focus}-specific problems in the current implementation
- Provide ${focus}-focused solutions, not copywriting advice
- Include ${focus} tools and methodologies in your actions
- Address ${industry} industry needs for ${goals?.join(' and ')} goals

**EXACT JSON STRUCTURE YOU MUST RETURN:**
${JSON.stringify(focusSpecificStructure, null, 2)}

**CONTENT TO ANALYZE:**
${visibleText.slice(0, 3000)}

**MAIN CONTENT:**
${mainContent.slice(0, 1500)}

**${focus.toUpperCase()} SOLUTION REQUIREMENTS:**

For each element, provide:

**PROBLEM**: Identify the specific ${focus} issue with this element
- Focus on ${focus} problems, not general copywriting issues
- Explain how this affects ${focus} performance
- Reference the actual content you found on the page

**SOLUTION**: Provide a detailed ${focus}-focused fix
- Explain HOW to solve the ${focus} problem
- Include ${focus} best practices and principles
- Make it specific to ${industry} and ${goals?.join('/')} goals
- Provide concrete ${focus} improvements

**ACTIONS**: 3 specific ${focus}-focused steps with tools
- Action 1: ${focus}-specific tool recommendation with exact usage
- Action 2: ${focus} improvement with implementation steps  
- Action 3: ${focus} testing/measurement strategy with specific metrics

**VALIDATION RULES:**
- Category names MUST match exactly: ${expectedStructure.map(c => `"${c.category}"`).join(', ')}
- Element names MUST match exactly within each category
- Focus on ${focus} optimization throughout your analysis
- NO copywriting advice unless focus is copywriting
- Provide ${industry}-specific ${focus} recommendations
- Include ${focus} tools and methodologies

Return ONLY the JSON array with the exact structure shown above - no explanatory text.`;
}

// Simplified fallback generator - used only when AI fails
function generateSpecificActions(element, industry, siteText, tools) {
  // Minimal fallback - the AI should handle everything
  return [
    `Analyze ${element} for ${industry} best practices and optimization opportunities`,
    `Test different approaches for ${element} using A/B testing platforms`,
    `Measure performance improvements and iterate based on data`
  ];
}

module.exports = {
  generateAdvancedPrompt,
  generateSpecificActions
};
