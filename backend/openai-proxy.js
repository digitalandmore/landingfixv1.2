const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const nodemailer = require('nodemailer');
const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer-extra');
const { Readability } = require('@mozilla/readability');
const jsdom = require('jsdom');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const tools = require('./tools.js');

// Import the new scoring module
const {
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
} = require('./score.js');

// Import the new prompting system
const { generateAdvancedPrompt, generateSpecificActions } = require('./prompt.js');

// Import categories from external file
const { focusCategories, getExpectedElementsForFocus, getFocusDebugInfo } = require('./categories.js');

app.use(cors({ 
  origin: ['https://landingfixv1-2.onrender.com', 'http://localhost:5500'],
  credentials: true 
}));
app.use(express.json());

app.get('/tools.json', (req, res) => {
  const allTools = [
    ...tools.abTesting,
    ...tools.copywriting,
    ...tools.testimonials,
    ...tools.feedback
  ];
  res.json(allTools);
});

// Add tools endpoint
app.get('/api/tools', (req, res) => {
  try {
    const tools = require('./tools');
    res.json(tools);
    console.log('Tools data served to frontend');
  } catch (error) {
    console.error('Error loading tools:', error);
    res.status(500).json({ error: 'Failed to load tools data' });
  }
});

// --- Puppeteer stealth initialization ---
puppeteer.use(StealthPlugin());

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LandingFix AI Server running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// --- BENCHMARK CHECKLIST BY INDUSTRY ---
// Maps each industry to a list of objective checklist items and their detection logic.
// Used for quick, non-AI scoring and to inform best practice fallback logic.
const industryBenchmarks = {
  saas: [
    { label: "Demo/Trial present", test: html => /demo|trial/i.test(html) },
    { label: "Visible pricing", test: html => /pricing|price/i.test(html) },
    { label: "Testimonials/reviews", test: html => /testimonials|reviews/i.test(html) },
    { label: "Clear CTA", test: html => /sign\s?up|try|buy|start/i.test(html) },
    { label: "Security/trust badges", test: html => /guarantee|secure|trust|reliable/i.test(html) }
  ],
  ecommerce: [
    { label: "Product images", test: html => /<img[^>]+product|product/i.test(html) },
    { label: "Reviews", test: html => /reviews|stars|rating/i.test(html) },
    { label: "Clear shipping info", test: html => /shipping|delivery/i.test(html) },
    { label: "Visible price", test: html => /price|€|\$/i.test(html) },
    { label: "Purchase CTA", test: html => /buy|add to cart|purchase/i.test(html) }
  ],
  services: [
    { label: "Service description", test: html => /services|what we do|offer/i.test(html) },
    { label: "Contact form", test: html => /form|contact|request/i.test(html) },
    { label: "Testimonials", test: html => /testimonials|reviews/i.test(html) },
    { label: "Clear CTA", test: html => /book|request|contact/i.test(html) },
    { label: "Visible hours/contact", test: html => /hours|phone|email/i.test(html) }
  ],
  coaching: [
    { label: "Coach photo", test: html => /coach|trainer|about/i.test(html) },
    { label: "Testimonials", test: html => /testimonials|reviews/i.test(html) },
    { label: "Method description", test: html => /method|how it works|approach/i.test(html) },
    { label: "Booking CTA", test: html => /book|discover|contact/i.test(html) },
    { label: "Discovery call", test: html => /call|session|meeting/i.test(html) }
  ],
  local: [
    { label: "Address/map", test: html => /address|map|where/i.test(html) },
    { label: "Opening hours", test: html => /hours|open|close/i.test(html) },
    { label: "Reviews", test: html => /reviews|testimonials/i.test(html) },
    { label: "Visible phone", test: html => /tel:|phone|call/i.test(html) },
    { label: "Contact form", test: html => /form|contact|request/i.test(html) }
  ],
  health: [
    { label: "Staff presentation", test: html => /staff|team|doctor|physician/i.test(html) },
    { label: "Services/therapies", test: html => /services|therapies|treatments/i.test(html) },
    { label: "Reviews", test: html => /reviews|testimonials/i.test(html) },
    { label: "Booking/contact", test: html => /book|contact|request/i.test(html) },
    { label: "Hours/address", test: html => /hours|address|where/i.test(html) }
  ],
  other: [
    { label: "Clear headline", test: html => /<h1|headline|title/i.test(html) },
    { label: "Visible CTA", test: html => /cta|sign\s?up|buy|try|contact/i.test(html) },
    { label: "Testimonials", test: html => /testimonials|reviews/i.test(html) },
    { label: "Offer description", test: html => /offer|services|what/i.test(html) },
    { label: "Contacts", test: html => /contact|phone|email/i.test(html) }
  ]
};

// --- FOCUS KEY NORMALIZATION ---
// Canonical structure for each focus area. Each category contains a list of elements to be analyzed.
// This structure is used to force the AI output and for normalization/fallback logic.
const focusKeyMap = {
  'copywriting': 'copywriting',
  'copy writing': 'copywriting',
  'uxui': 'uxui',
  'ux/ui': 'uxui',
  'ux-ui': 'uxui',
  'ux ui': 'uxui',
  'ux': 'uxui',
  'ui': 'uxui',
  'mobile': 'mobile',
  'cta': 'cta',
  'seo': 'seo'
};
function normalizeFocusKey(focus) {
  if (!focus) return 'copywriting';
  const key = focus.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Try direct match
  if (focusCategories[key]) return key;
  // Try mapped match
  for (const [variant, canonical] of Object.entries(focusKeyMap)) {
    if (key === variant.replace(/[^a-z0-9]/g, '')) return canonical;
  }
  // Fallback
  return 'copywriting';
}

// Utility function: fetches rendered HTML and CSS using Puppeteer Stealth
async function fetchRenderedHtmlAndCss(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setJavaScriptEnabled(true);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);

    const html = await page.content();

    // Get all loaded CSS (inline and linked)
    const cssHandles = await page.$$eval('link[rel="stylesheet"]', links =>
      links.map(link => link.href)
    );
    let cssContent = '';
    for (const href of cssHandles) {
      try {
        const response = await page.goto(href, { timeout: 7000 });
        if (response && response.ok()) {
          const css = await response.text();
          cssContent += `/* ${href} */\n${css}\n\n`;
        }
      } catch (e) {}
    }
    const inlineCss = await page.$$eval('style', styles =>
      styles.map(style => style.innerHTML).join('\n')
    );
    cssContent += inlineCss;

    await browser.close();

    if (!/<body[^>]*>[\s\S]{100,}<\/body>/i.test(html)) {
      throw new Error('Body too short or empty');
    }

    return { html, css: cssContent };
  } catch (err) {
    if (browser) await browser.close();
    try {
      const res = await fetch(url, { timeout: 15000 });
      if (!res.ok) throw new Error('Fetch failed');
      let html = await res.text();
      if (html.length > 10000) html = html.slice(0, 10000);
      let cssContent = '';
      try {
        const dom = new JSDOM(html, { url });
        const document = dom.window.document;
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        for (const link of links) {
          let href = link.href;
          if (!href.startsWith('http')) {
            try {
              const urlObj = new URL(href, url);
              href = urlObj.href;
            } catch (e) { continue; }
          }
          try {
            const cssRes = await fetch(href, { timeout: 7000 });
            if (cssRes.ok) {
              const css = await cssRes.text();
              cssContent += `/* ${href} */\n${css}\n\n`;
            }
          } catch (e) { }
        }
        cssContent += Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
      } catch (e) { }
      return { html, css: cssContent };
    } catch (e2) {
      return { html: '[ERROR: Unable to fetch landing page HTML]', css: '' };
    }
  }
}

async function extractVisibleContent(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

  // Simulate user interaction: scroll, click, wait for JS
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
  // Try to click common expanders (optional, non-blocking)
  await page.evaluate(() => {
    const selectors = ['button', '[role=button]', '.expand', '.show-more', '.read-more'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (btn && btn.offsetParent !== null) btn.click();
      });
    });
  });
  // Replace page.waitForTimeout(1000) with a portable delay
  await new Promise(r => setTimeout(r, 1000));

  // Extract visible text only
  const visibleText = await page.evaluate(() => {
    function getVisibleText(node) {
      if (!node) return '';
      if (node.nodeType === Node.TEXT_NODE && node.parentElement && window.getComputedStyle(node.parentElement).display !== 'none' && node.textContent.trim()) {
        return node.textContent.trim();
      }
      if (node.nodeType === Node.ELEMENT_NODE && window.getComputedStyle(node).display !== 'none' && window.getComputedStyle(node).visibility !== 'hidden') {
        let text = '';
        for (const child of node.childNodes) {
          text += getVisibleText(child) + ' ';
        }
        return text.trim();
      }
      return '';
    }
    return getVisibleText(document.body);
  });

  // Extract meta tags and structured data
  const meta = await page.evaluate(() => {
    const metas = Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.getAttribute('name') || m.getAttribute('property'),
      content: m.getAttribute('content')
    })).filter(m => m.name && m.content);
    const ldJson = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.innerText);
    return { metas, ldJson };
  });

  // Use Mozilla Readability for main content extraction
  const html = await page.content();
  const dom = new jsdom.JSDOM(html, { url });
  let mainContent = '';
  try {
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.textContent) mainContent = article.textContent;
  } catch (e) { mainContent = ''; }

  await browser.close();
  return {
    visibleText,
    meta,
    mainContent
  };
}

// --- GENERATE REPORT ---
// Main API endpoint: generates a detailed landing page report using OpenAI and normalization/fallback logic.
// - Fetches HTML/CSS
// - Calls OpenAI with a canonical prompt and structure
// - Normalizes and patches AI output for frontend compatibility
// - Returns a robust, actionable report with scores and fallback best practices
app.post('/api/generate-report', async (req, res) => {
  try {
    const { url, focus, industry, goals } = req.body;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Fetch landing page HTML and CSS with Puppeteer
    let landingHtml = '';
    let cssContent = '';
    try {
      const rendered = await fetchRenderedHtmlAndCss(url);
      landingHtml = rendered.html;
      cssContent = rendered.css;
    } catch (err) {
      landingHtml = '[ERROR: Unable to fetch landing page HTML]';
      cssContent = '';
    }

    // 2. Limit HTML and CSS length to avoid token overflow
    const MAX_HTML_LENGTH = 10000;
    const MAX_CSS_LENGTH = 4000;
    if (landingHtml.length > MAX_HTML_LENGTH) {
      landingHtml = landingHtml.slice(0, MAX_HTML_LENGTH);
    }
    if (cssContent.length > MAX_CSS_LENGTH) {
      cssContent = cssContent.slice(0, MAX_CSS_LENGTH);
    }

    // 3. Prevent AI call if HTML fetch failed
    if (!landingHtml || landingHtml.startsWith('[ERROR')) {
      return res.status(400).json({ error: 'Unable to fetch landing page HTML. Please check the URL.' });
    }

    // 4. Calculate benchmark checklist (objective score)
    let checklist = industryBenchmarks[industry] || industryBenchmarks['other'];
    let passed = 0;
    if (landingHtml && checklist) {
      passed = checklist.filter(c => c.test(landingHtml)).length;
    }
    const benchmarkScore = Math.round((passed / checklist.length) * 100);

    // 5. Get categories and elements for the selected focus
    const focusKey = normalizeFocusKey(focus);
    const focusCats = focusCategories[focusKey] || focusCategories['copywriting'];
    const focusStructure = focusCats.map(cat => ({
      category: cat.category,
      elements: cat.elements
    }));

    // 6. Extract content data that was missing
    let contentData = { visibleText: '', mainContent: '' };
    try {
      contentData = await extractVisibleContent(url);
      console.log('Content extraction successful:', {
        visibleTextLength: contentData.visibleText?.length || 0,
        mainContentLength: contentData.mainContent?.length || 0
      });
    } catch (contentError) {
      console.warn('Content extraction failed, using HTML fallback:', contentError.message);
      // Fallback to HTML text extraction
      const dom = new jsdom.JSDOM(landingHtml, { url });
      contentData.visibleText = dom.window.document.body?.textContent?.slice(0, 4000) || '';
      contentData.mainContent = landingHtml.slice(0, 2000);
    }

    // 7. Calculate dynamic benchmark using score.js module ONLY
    const benchmark = calculateDynamicBenchmark(focus, industry, goals);
    console.log(`Dynamic benchmark for ${focus}/${industry}/${goals?.join(',')}:`, benchmark);

    // 8. Build the AI prompt using the new advanced system with focus validation
    const focusDebugInfo = getFocusDebugInfo(focusKey);
    console.log('Focus validation:', focusDebugInfo);
    
    const aiPrompt = generateAdvancedPrompt(url, focusKey, industry, goals, contentData.visibleText, contentData.mainContent);

    console.log('Generated advanced prompt (first 500 chars):', aiPrompt.slice(0, 500));

    // 9. Call OpenAI API with validation and retry logic
    let attemptCount = 0;
    const maxAttempts = 2;
    let reportJson = null;
    
    while (attemptCount < maxAttempts && !reportJson) {
      attemptCount++;
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-4o",
            max_tokens: 3000,
            temperature: attemptCount > 1 ? 0.1 : 0.3,
            messages: [{ role: "user", content: aiPrompt }]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API Error:', response.status, errorText);
          if (attemptCount >= maxAttempts) {
            return res.status(500).json({ error: 'OpenAI API error: ' + response.status });
          }
          continue;
        }
        
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error('Invalid OpenAI response:', JSON.stringify(data, null, 2));
          if (attemptCount >= maxAttempts) {
            return res.status(500).json({ error: 'Invalid AI response structure' });
          }
          continue;
        }
        
        let aiOutput = data.choices[0].message.content.trim();
        console.log('Raw AI Output (first 500 chars):', aiOutput.slice(0, 500));
        
        // Clean up the output
        if (aiOutput.startsWith('```')) {
          aiOutput = aiOutput.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
        }
        
        let jsonMatch = aiOutput.match(/(\[[\s\S]*\])/);
        if (!jsonMatch) {
          jsonMatch = aiOutput.match(/(\{[\s\S]*\})/);
        }
        
        if (jsonMatch) {
          aiOutput = jsonMatch[1];
        }
        
        console.log('Cleaned AI Output (first 300 chars):', aiOutput.slice(0, 300));

        // Parse AI output
        try {
          const parsedOutput = JSON.parse(aiOutput);
          
          // Validate AI output structure
          const validation = validateAIOutputStrict(parsedOutput, focusKey);
          
          if (validation.needsRegeneration && attemptCount < maxAttempts) {
            console.error(`AI structure validation failed (attempt ${attemptCount}):`, validation.errors);
            console.log('Regenerating with stricter prompt...');
            continue;
          }
          
          if (!validation.isValid) {
            console.warn('AI validation warnings:', validation.warnings);
          }
          
          reportJson = parsedOutput;
          break;
          
        } catch (parseError) {
          console.error(`JSON parsing failed (attempt ${attemptCount}):`, parseError);
          if (attemptCount >= maxAttempts) {
            const fs = require('fs');
            fs.writeFileSync('ai-output-error-' + Date.now() + '.txt', aiOutput, 'utf8');
            return res.status(500).json({ error: 'AI did not return valid JSON after multiple attempts.' });
          }
          continue;
        }
        
      } catch (err) {
        console.error(`API ERROR (attempt ${attemptCount}):`, err);
        if (attemptCount >= maxAttempts) {
          return res.status(500).json({ error: 'AI service error after multiple attempts' });
        }
        continue;
      }
    }
    
    if (!reportJson) {
      return res.status(500).json({ error: 'Failed to generate valid AI response after multiple attempts' });
    }

    // Fix elements array structure if needed
    function fixElementsArray(report) {
      if (Array.isArray(report)) {
        report.forEach(cat => {
          if (cat.elements && !Array.isArray(cat.elements) && typeof cat.elements === 'object') {
            cat.elements = Object.entries(cat.elements).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return { element: key, ...value };
              } else {
                return { element: key, siteText: value };
              }
            });
          }
        });
      }
    }

    fixElementsArray(reportJson);
    
    if (!Array.isArray(reportJson) && typeof reportJson === 'object') {
      reportJson = [reportJson];
      fixElementsArray(reportJson);
    }
    
    // Normalize: rename "name" to "element" if needed
    if (Array.isArray(reportJson)) {
      reportJson.forEach(cat => {
        if (Array.isArray(cat.elements)) {
          cat.elements.forEach(el => {
            if (el.name && !el.element) {
              el.element = el.name;
              delete el.name;
            }
          });
        }
      });
    }

    // Get canonical structure for the focus
    const canonCats = focusCategories[focusKey] || focusCategories['copywriting'];
    
    // Reconstruct report forcing canonical names and structure
    let aiCats = Array.isArray(reportJson) ? reportJson : [];
    
    reportJson = canonCats.map((cat, i) => {
      const aiCat = aiCats[i] || {};
      let aiElements = Array.isArray(aiCat.elements) ? aiCat.elements : [];
      
      // Create better mapping between AI output and canonical elements
      const aiElementMap = {};
      aiElements.forEach(el => {
        let name = el.element || el.name || (typeof el === 'object' && Object.keys(el)[0]);
        if (name) {
          const normalizedName = name.toLowerCase().trim();
          aiElementMap[normalizedName] = el;
          
          cat.elements.forEach(canonicalElement => {
            const canonicalLower = canonicalElement.toLowerCase();
            if (normalizedName === canonicalLower) {
              aiElementMap[canonicalElement.toLowerCase()] = el;
            }
          });
        }
      });
      
      console.log(`Enhanced AI Element mapping for category ${i} (${cat.category}):`, {
        aiElementsFound: aiElements.length,
        canonicalElementsExpected: cat.elements.length,
        aiElements: aiElements.map(el => el.element || el.name),
        canonicalElements: cat.elements,
        successfulMappings: Object.keys(aiElementMap).length,
        mappedKeys: Object.keys(aiElementMap)
      });
      
      const fullElements = cat.elements.map((elName, j) => {
        // Try to find AI element for this canonical element
        let aiEl = aiElementMap[elName.toLowerCase()];
        
        if (!aiEl) {
          const elKey = Object.keys(aiElementMap).find(key => 
            key.includes(elName.toLowerCase().split(' ')[0]) || 
            elName.toLowerCase().includes(key.split(' ')[0])
          );
          if (elKey) {
            aiEl = aiElementMap[elKey];
            delete aiElementMap[elKey];
          }
        } else {
          delete aiElementMap[elName.toLowerCase()];
        }
        
        if (!aiEl) {
          aiEl = { element: elName, siteText: 'Not found' };
          console.log(`No AI data found for element: ${elName} in category ${cat.category}`);
        }
        
        // Force correct element name
        aiEl.element = elName;
        aiEl.title = elName;
        
        // Calculate scores using score.js module
        const hasContent = aiEl.siteText && aiEl.siteText !== 'Not found' && aiEl.siteText.trim() !== '';
        const calculatedOptimization = calculateElementOptimization(elName, industry, cat.category, focusKey, hasContent, benchmark);
        const calculatedImpact = calculateElementImpact(elName, industry, cat.category, focusKey, hasContent, calculatedOptimization);
        
        let optimization = calculatedOptimization;
        let impact = calculatedImpact;
        
        const constraintResult = enforceConstraint(optimization, impact);
        optimization = constraintResult.optimization;
        impact = constraintResult.impact;
        
        if (!validateConstraint(optimization, impact)) {
          console.error(`Constraint violated for ${elName}: ${optimization}% + ${impact}% = ${optimization + impact}%`);
        }
        
        const calculatedTiming = calculateElementTiming(elName, industry, cat.category, focusKey, impact);
        
        aiEl.metrics = {
          impact: impact,
          optimization: optimization,
          timing: calculatedTiming
        };
        
        // Handle missing data with fallbacks
        function isNoData(val) {
          return (
            val === undefined || val === null ||
            (typeof val === 'string' && val.trim().toLowerCase() === 'no data') ||
            (typeof val === 'string' && val.trim() === '') ||
            (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string' && val[0].trim().toLowerCase() === 'no data')
          );
        }
        
        if (isNoData(aiEl.problem)) {
          aiEl.problem = `Analysis needed for ${aiEl.element} in ${cat.category}. This element requires optimization for ${industry} businesses focusing on ${goals?.join(' and ')} goals.`;
        }
        
        if (isNoData(aiEl.solution)) {
          aiEl.solution = `Strategic improvement needed for ${aiEl.element}. Implement ${industry}-specific best practices to enhance ${goals?.join(' and ')} performance.`;
        }
        
        if (isNoData(aiEl.actions) || !Array.isArray(aiEl.actions) || aiEl.actions.length === 0) {
          console.log(`Using enhanced fallback for ${elName} - AI should have provided this data`);
          aiEl.actions = generateEnhancedActions(aiEl.element, industry, aiEl.siteText, cat.category, focusKey, goals);
        } else {
          console.log(`Using AI-generated actions for ${elName}:`, aiEl.actions);
          aiEl.actions = enhanceActionsWithTools(aiEl.actions, aiEl.element, industry);
        }
        
        return aiEl;
      });
      
      // Calculate category scores using score.js module
      const categoryScores = calculateCategoryScores(fullElements);
      
      return {
        category: cat.category,
        elements: fullElements,
        optimizationScore: categoryScores.optimizationScore,
        impactScore: categoryScores.impactScore,
        timingMinutes: categoryScores.timingMinutes,
        timing: formatTiming(categoryScores.timingMinutes)
      };
    });
    
    // Calculate final totals using score.js module
    const finalTotals = calculateFinalTotals(reportJson);
    
    console.log('Final totals - RAW VALUES (no artificial scaling):', {
      categoryBreakdown: reportJson.map(cat => ({
        category: cat.category,
        optimization: cat.optimizationScore,
        impact: cat.impactScore,
        total: cat.optimizationScore + cat.impactScore
      })),
      rawOptimizationSum: finalTotals.optimizationScoreTotale,
      rawImpactSum: finalTotals.impactScoreTotale,
      rawTotal: finalTotals.optimizationScoreTotale + finalTotals.impactScoreTotale,
      finalOptimization: finalTotals.optimizationScoreTotale,
      finalImpact: finalTotals.impactScoreTotale,
      finalTotal: finalTotals.optimizationScoreTotale + finalTotals.impactScoreTotale,
      isRealistic: true,
      note: 'Showing real calculated values without artificial scaling'
    });
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      report: reportJson,
      impactScoreTotale: finalTotals.impactScoreTotale,
      optimizationScoreTotale: finalTotals.optimizationScoreTotale,
      totalTiming: formatTiming(finalTotals.totalTimingMinutes)
    });

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: 'AI service error' });
  }
});

// --- SEND REPORT VIA EMAIL ---
app.post('/api/send-report', async (req, res) => {
  console.log('📧 /api/send-report endpoint hit');
  console.log('📧 Request headers:', req.headers);
  console.log('📧 Request body keys:', Object.keys(req.body || {}));
  
  const { url, htmlTemplate, email, name, company, isPdfEmail, pdfContent } = req.body;

  try {
    console.log('📧 Email request received:', { 
      url, 
      email, 
      name, 
      company, 
      hasTemplate: !!htmlTemplate, 
      isPdfEmail: !!isPdfEmail,
      hasPdfContent: !!pdfContent,
      bodySize: JSON.stringify(req.body).length
    });

    // Validate required fields
    if (!email || !url) {
      console.error('📧 Missing required fields:', { email: !!email, url: !!url });
      return res.status(400).json({ error: 'Missing required fields: email and url' });
    }

    // FIXED: Correct method name - createTransport not createTransporter
    console.log('📧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('📧 Transporter created successfully');

    // Generate subject based on email type
    const subject = isPdfEmail ? 
      "📄 Your LandingFix AI PDF Report is Ready!" : 
      "🚀 Your LandingFix AI Report is Ready!";

    // Prepare email options
    const emailOptions = {
      from: `"LandingFix AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlTemplate || '<p>Your LandingFix AI report is ready!</p>'
    };

    // ENHANCED: Add PDF attachment if this is a PDF email
    if (isPdfEmail && pdfContent) {
      console.log('📎 Adding PDF attachment...');
      console.log('📎 PDF content length:', pdfContent.length);
      
      // Use puppeteer to convert HTML to PDF
      let browser;
      
      try {
        console.log('📎 Launching puppeteer browser...');
        browser = await puppeteer.launch({ 
          headless: true, 
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        });
        
        console.log('📎 Creating new page...');
        const page = await browser.newPage();
        
        console.log('📎 Setting page content...');
        // Set content and generate PDF with enhanced styling
        await page.setContent(pdfContent, { waitUntil: 'networkidle0', timeout: 30000 });
        
        console.log('📎 Adding PDF styling...');
        // Add CSS for better PDF formatting
        await page.addStyleTag({
          content: `
            @media print {
              body { font-family: Arial, sans-serif; margin: 0; color: #000; }
              .pdf-page-break { page-break-before: always; }
              .pdf-no-break { page-break-inside: avoid; }
              h1, h2, h3 { page-break-after: avoid; color: #1a202c; }
              .pdf-score-card { margin-bottom: 20px; page-break-inside: avoid; }
              .report-category { page-break-inside: avoid; margin-bottom: 30px; }
              .report-element { page-break-inside: avoid; margin-bottom: 25px; }
              .element-block { page-break-inside: avoid; }
              /* Remove background colors for better PDF printing */
              * { 
                background: white !important; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .pdf-score-card { 
                border: 2px solid #333 !important; 
                background: #f5f5f5 !important;
              }
            }
          `
        });
        
        console.log('📎 Generating PDF...');
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          },
          displayHeaderFooter: true,
          headerTemplate: '<div style="font-size:10px;width:100%;text-align:center;color:#666;">LandingFix AI - Professional Landing Page Analysis</div>',
          footerTemplate: '<div style="font-size:10px;width:100%;text-align:center;color:#666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated by LandingFix AI</div>',
          timeout: 30000
        });
        
        await browser.close();
        console.log('📎 PDF generated successfully, size:', pdfBuffer.length);
        
        // Add PDF as attachment
        const timestamp = new Date().toISOString().split('T')[0];
        const urlDomain = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
        const filename = `LandingFix-AI-Report-${urlDomain}-${timestamp}.pdf`;
        
        emailOptions.attachments = [{
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }];
        
        console.log(`📎 PDF attachment created: ${filename} (${Math.round(pdfBuffer.length / 1024)}KB)`);
        
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', {
          error: pdfError.message,
          stack: pdfError.stack,
          name: pdfError.name
        });
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error('Error closing browser:', closeError);
          }
        }
        // Return error instead of continuing without attachment
        return res.status(500).json({ 
          success: false,
          error: 'PDF generation failed: ' + pdfError.message 
        });
      }
    }

    console.log('📧 Sending email...');
    console.log('📧 Email options:', {
      from: emailOptions.from,
      to: emailOptions.to,
      subject: emailOptions.subject,
      hasHtml: !!emailOptions.html,
      hasAttachments: !!emailOptions.attachments,
      attachmentCount: emailOptions.attachments?.length || 0
    });

    await transporter.sendMail(emailOptions);

    console.log('✅ Email sent successfully to:', email);
    res.json({ success: true });
    
  } catch (err) {
    console.error("❌ Email error:", {
      error: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false,
      error: 'Email send failed: ' + err.message 
    });
  }
});

// --- TEST ROUTE ---
// Simple health check endpoint for API status.
app.get('/api/test', (req, res) => {
  res.json({ status: "ok" });
});

// --- ROUTE FOR BREVO ---
// Subscribes a user to the Brevo (Sendinblue) mailing list with custom attributes.
app.post('/api/subscribe', async (req, res) => {
  const { name, email, company, url, goals } = req.body;
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'BREVO_API_KEY missing' });
  }

  const data = {
    email,
    attributes: {
      FIRSTNAME: name,
      COMPANY: company,
      LANDING_URL: url,
      GOALS: Array.isArray(goals) ? goals.join(', ') : (goals || '')
    },
    listIds: [38],
    updateEnabled: true
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    res.status(response.status).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ROUTE FOR PAYPAL CLIENT ID ---
// Returns PayPal client ID for frontend PayPal integration
app.get('/api/paypal-client-id', (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    console.error('PAYPAL_CLIENT_ID not found in environment variables');
    return res.status(500).json({ error: 'PayPal client ID not configured' });
  }
  
  console.log('PayPal client ID requested - returning configured value');
  res.json({ clientId: clientId });
});

// --- ROUTE FOR STRIPE PUBLIC KEY ---
app.get('/api/stripe-public-key', (req, res) => {
  const publicKey = process.env.STRIPE_PUBLISHABLE_KEY;
  
  if (!publicKey) {
    console.error('STRIPE_PUBLISHABLE_KEY not found in environment variables');
    return res.status(500).json({ error: 'Stripe public key not configured' });
  }
  
  console.log('Stripe public key requested - returning configured value');
  res.json({ publicKey: publicKey });
});

// --- ROUTE FOR STRIPE PAYMENT INTENT ---
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency || 'eur',
      metadata: {
        service: 'LandingFix AI Report',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// Generate Enhanced PDF format (HTML-like structure)
// Removed - now handled on frontend
function generateEnhancedPdf({ url, name, company, email, html, scores, reportData, timestamp }) {
  // Extract more detailed content from HTML
  const reportContent = extractReportContent(html);
  
  // Focus and industry information
  const focusInfo = reportData?.focus || 'General';
  const industryInfo = reportData?.industryName || reportData?.industry || 'Not specified';
  const goalsInfo = reportData?.goals ? reportData.goals.join(', ') : 'Not specified';

  // Calculate content for multiple pages
  const contentPages = generateMultiPageContent(reportContent, scores, {
    url, name, company, email, focusInfo, industryInfo, goalsInfo, timestamp
  });

  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R 4 0 R 5 0 R]
/Count 3
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 6 0 R
/Resources <<
  /Font <<
    /F1 7 0 R
    /F2 8 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 9 0 R
/Resources <<
  /Font <<
    /F1 7 0 R
    /F2 8 0 R
  >>
>>
>>
endobj

5 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 10 0 R
/Resources <<
  /Font <<
    /F1 7 0 R
    /F2 8 0 R
  >>
>>
>>
endobj

6 0 obj
<<
/Length 3000
>>
stream
BT
% Page 1 - Header and Overview
/F2 24 Tf
50 750 Td
(LandingFix AI Analysis Report) Tj

% Header Box
0.9 0.9 0.9 rg
50 700 512 80 re f
0 0 0 rg
52 740 Td
/F1 16 Tf
(Report Generated: ${timestamp}) Tj
0 -20 Td
(Analysis Focus: ${focusInfo} | Industry: ${industryInfo}) Tj

% User Information Section
0 -60 Td
/F2 18 Tf
(Website Analysis Overview) Tj
0 -30 Td
/F1 12 Tf
(Website: ${url}) Tj
0 -18 Td
(Analyzed by: ${name || 'LandingFix AI User'}) Tj
0 -18 Td
(Company: ${company || 'Not specified'}) Tj
0 -18 Td
(Email: ${email || 'Not specified'}) Tj

% Performance Metrics Box
0.95 0.97 1.0 rg
50 520 512 120 re f
0 0 0 rg
0 -40 Td
/F2 16 Tf
(Performance Metrics) Tj

% Score boxes with colors
0.2 0.6 1.0 rg
60 480 140 30 re f
1 1 1 rg
62 487 Td
/F2 14 Tf
(Current: ${scores?.optimization || '–'}%) Tj

0.2 0.8 0.4 rg
220 480 140 30 re f
1 1 1 rg
222 487 Td
/F2 14 Tf
(Impact: +${scores?.impact || '–'}%) Tj

0.6 0.4 0.8 rg
380 480 140 30 re f
1 1 1 rg
382 487 Td
/F2 14 Tf
(Time: ${scores?.timing || '–'}) Tj

% Analysis Summary
0 -60 Td
/F2 16 Tf
(Analysis Summary) Tj
0 -25 Td
/F1 11 Tf
(This comprehensive ${focusInfo.toLowerCase()} analysis was generated using) Tj
0 -15 Td
(LandingFix AI's advanced algorithms specifically calibrated for) Tj
0 -15 Td
(${industryInfo.toLowerCase()} businesses. The report evaluates your landing) Tj
0 -15 Td
(page across multiple optimization categories and provides) Tj
0 -15 Td
(actionable insights to improve conversion rates.) Tj

% Goals Section
0 -30 Td
/F2 14 Tf
(Optimization Goals) Tj
0 -20 Td
/F1 11 Tf
(Target Goals: ${goalsInfo}) Tj
0 -15 Td
(Focus Area: ${focusInfo} optimization and best practices) Tj

% Key Insights Box
0.98 0.98 0.9 rg
50 220 512 100 re f
0 0 0 rg
0 -40 Td
/F2 14 Tf
(Key Insights from Analysis) Tj
0 -25 Td
/F1 10 Tf
(• Your landing page shows ${scores?.optimization || 'measurable'} current optimization level) Tj
0 -15 Td
(• Identified +${scores?.impact || 'significant'} improvement potential through targeted changes) Tj
0 -15 Td
(• Estimated ${scores?.timing || 'reasonable'} implementation time for all recommendations) Tj
0 -15 Td
(• ${focusInfo} focus ensures specialized optimization strategies) Tj
0 -15 Td
(• Industry-specific recommendations tailored for ${industryInfo} sector) Tj

% Footer
0 -50 Td
/F1 9 Tf
0.5 0.5 0.5 rg
(Page 1 of 3 - Detailed analysis continues on next pages) Tj
0 0 0 rg
ET
endstream
endobj

9 0 obj
<<
/Length 2800
>>
stream
BT
% Page 2 - Detailed Analysis
/F2 20 Tf
50 750 Td
(Detailed ${focusInfo} Analysis) Tj

% Category Analysis
0 -40 Td
/F2 16 Tf
(Analysis Categories) Tj

${contentPages.page2Content}

% Recommendations Summary
0 -60 Td
/F2 14 Tf
(Implementation Priority Matrix) Tj
0 -25 Td
/F1 11 Tf
(High Impact + Quick Implementation:) Tj
0 -18 Td
(Focus on elements that provide immediate improvements with) Tj
0 -15 Td
(minimal time investment. These are your quick wins.) Tj

0 -20 Td
(High Impact + Strategic Implementation:) Tj
0 -18 Td
(Larger improvements that require planning but deliver) Tj
0 -15 Td
(significant long-term conversion benefits.) Tj

0 -20 Td
(Optimization Refinements:) Tj
0 -18 Td
(Fine-tuning elements for marginal gains once major) Tj
0 -15 Td
(improvements are completed.) Tj

% Tools and Resources
0 -40 Td
/F2 14 Tf
(Recommended Tools & Resources) Tj
0 -25 Td
/F1 10 Tf
(• A/B Testing: Optimizely, Google Optimize) Tj
0 -15 Td
(• Analytics: Google Analytics, Hotjar heatmaps) Tj
0 -15 Td
(• ${focusInfo} Tools: Industry-specific optimization platforms) Tj
0 -15 Td
(• Performance Monitoring: PageSpeed Insights, GTmetrix) Tj

% Footer
0 -100 Td
/F1 9 Tf
0.5 0.5 0.5 rg
(Page 2 of 3 - Implementation guide on next page) Tj
0 0 0 rg
ET
endstream
endobj

10 0 obj
<<
/Length 2400
>>
stream
BT
% Page 3 - Implementation Guide
/F2 20 Tf
50 750 Td
(Implementation Guide) Tj

% Step-by-step implementation
0 -40 Td
/F2 16 Tf
(Step-by-Step Implementation) Tj

0 -30 Td
/F2 12 Tf
(Phase 1: Quick Wins (Week 1-2)) Tj
0 -20 Td
/F1 10 Tf
(1. Implement high-impact, low-effort ${focusInfo} improvements) Tj
0 -15 Td
(2. Test and measure baseline performance metrics) Tj
0 -15 Td
(3. Set up tracking and analytics for ongoing monitoring) Tj

0 -25 Td
/F2 12 Tf
(Phase 2: Strategic Improvements (Week 3-6)) Tj
0 -20 Td
/F1 10 Tf
(1. Plan and execute major ${focusInfo} optimizations) Tj
0 -15 Td
(2. A/B test significant changes before full implementation) Tj
0 -15 Td
(3. Monitor conversion rate improvements and user feedback) Tj

0 -25 Td
/F2 12 Tf
(Phase 3: Optimization & Refinement (Ongoing)) Tj
0 -20 Td
/F1 10 Tf
(1. Continuous testing and iteration of implemented changes) Tj
0 -15 Td
(2. Regular performance reviews and metric analysis) Tj
0 -15 Td
(3. Seasonal adjustments and ongoing ${focusInfo} optimization) Tj

% Expected Results
0 -40 Td
/F2 14 Tf
(Expected Results) Tj
0 -25 Td
/F1 11 Tf
(Based on similar ${industryInfo} landing pages implementing these) Tj
0 -15 Td
(${focusInfo} optimizations, you can expect:) Tj
0 -20 Td
(• ${scores?.impact || '15-40'}% improvement in conversion rates) Tj
0 -15 Td
(• Better user engagement and reduced bounce rates) Tj
0 -15 Td
(• Enhanced brand trust and credibility) Tj
0 -15 Td
(• Improved mobile experience and accessibility) Tj

% Next Steps
0 -40 Td
/F2 14 Tf
(Next Steps) Tj
0 -25 Td
/F1 10 Tf
(1. Prioritize recommendations based on your business goals) Tj
0 -15 Td
(2. Set up proper tracking before making changes) Tj
0 -15 Td
(3. Implement changes incrementally and test results) Tj
0 -15 Td
(4. Return to LandingFix AI for follow-up analysis) Tj

% Contact Information
0 -40 Td
/F2 12 Tf
(Need Help? Contact LandingFix AI Support) Tj
0 -20 Td
/F1 10 Tf
(Email: support@landingfixai.com) Tj
0 -15 Td
(Website: https://landingfixai.com) Tj

% Footer with Report ID
0 -60 Td
/F1 8 Tf
0.5 0.5 0.5 rg
(Report ID: ${timestamp}-${email?.split('@')[0] || 'GUEST'}) Tj
0 -15 Td
(Generated by LandingFix AI - Professional Landing Page Analysis) Tj
0 -10 Td
(Page 3 of 3 - End of Report) Tj
0 0 0 rg
ET
endstream
endobj

7 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

8 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

xref
0 11
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000130 00000 n 
0000000281 00000 n 
0000000432 00000 n 
0000000583 00000 n 
0000009000 00000 n 
0000009080 00000 n 
0000003633 00000 n 
0000006483 00000 n 
trailer
<<
/Size 11
/Root 1 0 R
>>
startxref
9165
%%EOF`;
}

// Extract content from HTML report for PDF
function extractReportContent(html) {
  if (!html) return { categories: [], summary: '' };
  
  try {
    // Extract category information
    const categoryMatches = html.match(/<div class="category-header">[\s\S]*?<\/div>/g) || [];
    const categories = categoryMatches.map(match => {
      const titleMatch = match.match(/<span class="category-name">(.*?)<\/span>/);
      const scoreMatch = match.match(/<span class="cat-score">(.*?)<\/span>/);
      const impactMatch = match.match(/<span class="cat-impact">(.*?)<\/span>/);
      const timingMatch = match.match(/<span class="cat-timing">(.*?)<\/span>/);
      
      return {
        name: titleMatch ? titleMatch[1] : 'Unknown Category',
        score: scoreMatch ? scoreMatch[1] : '–',
        impact: impactMatch ? impactMatch[1] : '–',
        timing: timingMatch ? timingMatch[1] : '–'
      };
    });
    
    return { categories, summary: '' };
  } catch (error) {
    console.error('Error extracting report content:', error);
    return { categories: [], summary: '' };
  }
}

// Generate multi-page content
function generateMultiPageContent(reportContent, scores, metadata) {
  const categories = reportContent.categories || [];
  
  let page2Content = '';
  
  // Generate category summary for page 2
  categories.forEach((cat, index) => {
    page2Content += `
0 -30 Td
/F2 12 Tf
(${cat.name}) Tj
0 -18 Td
/F1 10 Tf
(Current Score: ${cat.score}% | Impact Potential: +${cat.impact}% | Time: ${cat.timing}) Tj
0 -15 Td
(This category focuses on ${cat.name.toLowerCase()} optimization) Tj
0 -12 Td
(strategies specific to ${metadata.industryInfo} businesses.) Tj`;
  });
  
  return {
    page2Content: page2Content
  };
}

// Add validation function for AI output - moved to end of file to avoid conflicts
function validateAIOutputStrict(aiOutput, focus) {
  const expected = getExpectedElementsForFocus(focus);
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    needsRegeneration: false
  };
  
  if (!Array.isArray(aiOutput)) {
    validation.errors.push('AI output is not an array');
    validation.isValid = false;
    validation.needsRegeneration = true;
    return validation;
  }
  
  if (aiOutput.length !== expected.length) {
    validation.errors.push(`Expected ${expected.length} categories for ${focus}, got ${aiOutput.length}`);
    validation.isValid = false;
    validation.needsRegeneration = true;
  }
  
  expected.forEach((expectedCat, index) => {
    const aiCategory = aiOutput[index];
    
    if (!aiCategory) {
      validation.errors.push(`Missing category at index ${index}: "${expectedCat.category}"`);
      validation.isValid = false;
      validation.needsRegeneration = true;
      return;
    }
    
    if (aiCategory.category !== expectedCat.category) {
      validation.errors.push(`Category ${index}: expected "${expectedCat.category}", got "${aiCategory.category}"`);
      validation.isValid = false;
      validation.needsRegeneration = true;
    }
    
    if (!Array.isArray(aiCategory.elements)) {
      validation.errors.push(`Category "${expectedCat.category}" elements is not an array`);
      validation.isValid = false;
      validation.needsRegeneration = true;
      return;
    }
    
    const aiElements = aiCategory.elements.map(el => el.element || el);
    const missingElements = expectedCat.elements.filter(el => !aiElements.includes(el));
    
    if (missingElements.length > 0) {
      validation.errors.push(`Category "${expectedCat.category}" missing required elements: ${missingElements.join(', ')}`);
      validation.isValid = false;
      validation.needsRegeneration = true;
    }
  });
  
  return validation;
}

// Enhanced action generation - moved to end to avoid conflicts
function generateEnhancedActions(element, industry, siteText, category, focusKey, goals) {
  const hasContent = siteText && siteText !== 'Not found' && siteText.trim() !== '';
  
  // Focus-specific recommendations
  const focusSpecificActions = {
    seo: {
      "SEO basics": [
        "Audit current SEO using SEMrush Site Audit tool - focus on technical and content issues",
        "Optimize title tag and meta description using Yoast SEO plugin guidelines", 
        "Submit sitemap to Google Search Console and monitor indexing status"
      ],
      "H1/H2 structure": [
        "Research services best practices for H1/H2 structure using industry reports and competitor analysis",
        "Implement improvements to H1/H2 structure based on conversion rate optimization principles",
        "Measure performance using analytics tools and iterate based on data"
      ],
      "Alt text for images": [
        "Research services best practices for Alt text for images using industry reports and competitor analysis",
        "Implement improvements to Alt text for images based on conversion rate optimization principles", 
        "Measure performance using analytics tools and iterate based on data"
      ]
    },
    uxui: {
      "Visual hierarchy": [
        "Create wireframes using Figma to plan information architecture and visual flow",
        "Use the squint test - blur your page and see what stands out first, adjust accordingly",
        "Test user attention flow using Hotjar heatmaps and optimize high-attention areas"
      ]
    }
  };

  // Get focus-specific actions if available
  const focusActions = focusSpecificActions[focusKey];
  if (focusActions && focusActions[element]) {
    return focusActions[element];
  }

  // Generic fallback actions based on goals
  const goalActions = {
    'My landing page is not converting': [
      `Use UserTesting.com to get feedback on your ${element} from real ${industry} prospects`,
      `Implement changes to ${element} focusing on conversion optimization best practices`,
      `Track improvements using Google Analytics goals and A/B testing`
    ]
  };
  
  const primaryGoal = goals?.[0] || 'My landing page is not converting';
  return goalActions[primaryGoal] || [
    `Research ${industry} best practices for ${element} using industry reports and competitor analysis`,
    `Implement improvements to ${element} based on conversion rate optimization principles`,
    `Measure performance using analytics tools and iterate based on data`
  ];
}

// Enhance actions with tool links
function enhanceActionsWithTools(actions, element, industry) {
  return actions.map(action => {
    let enhanced = action;
    
    const toolEnhancements = {
      'hemingway': 'Use Hemingway Editor (hemingwayapp.com)',
      'grammarly': 'Use Grammarly (grammarly.com)',
      'canva': 'Use Canva Pro (canva.com/pro)',
      'hotjar': 'Use Hotjar (hotjar.com)',
      'optimizely': 'Use Optimizely (optimizely.com)',
      'typeform': 'Use Typeform (typeform.com)'
    };
    
    Object.keys(toolEnhancements).forEach(tool => {
      if (enhanced.toLowerCase().includes(tool)) {
        enhanced = enhanced.replace(new RegExp(tool, 'gi'), toolEnhancements[tool]);
      }
    });
    
    if (!enhanced.includes('measure') && !enhanced.includes('track')) {
      enhanced += ' - Track results using analytics and adjust based on performance data';
    }
    
    return enhanced;
  });
}