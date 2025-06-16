// Import required modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const nodemailer = require('nodemailer');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const tools = require('./tools.js');

// Import scoring and prompt modules
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

const { generateAdvancedPrompt, generateSpecificActions } = require('./prompt.js');
const { focusCategories, getExpectedElementsForFocus, getFocusDebugInfo } = require('./categories.js');

// Initialize Express app
const app = express();

// SIMPLIFIED: No Puppeteer - using only fetch and JSDOM
console.log('🔄 Running in production mode without Puppeteer');
console.log('📄 Using enhanced fetch + JSDOM for content extraction');
console.log('📧 Email generation will use optimized HTML templates');

// ENHANCED: More comprehensive CORS configuration
const allowedOrigins = [
  'https://landingfixai.com',
  'https://www.landingfixai.com',
  'https://landingfixv1-2.onrender.com',
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// ENHANCED: Middleware with better payload limits and security
app.use(express.json({ 
  limit: '100mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ENHANCED: Security and logging middleware
app.use((req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Log requests with more detail
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  
  next();
});

// ENHANCED: Health monitoring endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    services: {
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      openai: !!process.env.OPENAI_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      paypal: !!process.env.PAYPAL_CLIENT_ID
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// ENHANCED: Advanced HTML fetching without Puppeteer
async function fetchHtmlContent(url) {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Enhanced fetch attempt ${attempt}/${maxRetries}: ${url}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          // ENHANCED: Comprehensive headers to simulate real browser
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      console.log(`✅ Successfully fetched ${html.length} characters from ${url}`);
      
      return { 
        html, 
        css: '', // No CSS extraction without Puppeteer
        error: null,
        method: 'enhanced_fetch',
        attempt,
        contentLength: html.length
      };
      
    } catch (error) {
      console.error(`❌ Fetch attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        return { 
          html: '', 
          css: '', 
          error: error.message,
          method: 'failed',
          attempt
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// ENHANCED: Comprehensive content extraction using JSDOM only
async function extractComprehensiveContent(url) {
  try {
    console.log(`🔍 Extracting comprehensive content from: ${url}`);
    
    const fetchResult = await fetchHtmlContent(url);
    
    if (!fetchResult.html) {
      throw new Error(`Failed to fetch content: ${fetchResult.error}`);
    }
    
    const dom = new JSDOM(fetchResult.html, { 
      url,
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    const document = dom.window.document;
    
    // ENHANCED: Remove unwanted elements
    const elementsToRemove = [
      'script', 'style', 'noscript', 'iframe', 'object', 'embed', 
      'svg', 'canvas', 'audio', 'video', 'link[rel="stylesheet"]'
    ];
    
    elementsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // ENHANCED: Extract structured content
    const title = document.title || '';
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    
    // Extract headings with hierarchy
    const headings = {
      h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent?.trim()).filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map(el => el.textContent?.trim()).filter(Boolean),
      h3: Array.from(document.querySelectorAll('h3')).map(el => el.textContent?.trim()).filter(Boolean)
    };
    
    // Get main content using Readability
    let mainContent = '';
    try {
      const reader = new Readability(document.cloneNode(true));
      const article = reader.parse();
      
      if (article) {
        mainContent = article.textContent || '';
      }
    } catch (readabilityError) {
      console.warn('Readability parsing failed:', readabilityError.message);
      mainContent = document.body?.textContent || '';
    }
    
    // Get visible text - FIXED: Remove jsdom reference
    const visibleText = document.body?.textContent || '';
    
    console.log('📊 Content extraction summary:', {
      title: title.length,
      metaDescription: metaDescription.length,
      headings: Object.values(headings).flat().length,
      mainContentWords: mainContent.split(/\s+/).length,
      method: fetchResult.method
    });
    
    return {
      title: title.slice(0, 200),
      metaDescription: metaDescription.slice(0, 300),
      headings,
      visibleText: visibleText.slice(0, 8000),
      mainContent: mainContent.slice(0, 4000),
      fetchMethod: fetchResult.method
    };
    
  } catch (error) {
    console.error('Error extracting comprehensive content:', error);
    
    return {
      title: '',
      metaDescription: '',
      headings: { h1: [], h2: [], h3: [] },
      visibleText: '',
      mainContent: '',
      fetchMethod: 'failed',
      error: error.message
    };
  }
}

// UPDATED: Use new fetchHtmlContent instead of fetchRenderedHtmlAndCss
async function fetchRenderedHtmlAndCss(url) {
  console.log('🔄 Using enhanced fetch method (no Puppeteer)');
  return await fetchHtmlContent(url);
}

// UPDATED: Use extractComprehensiveContent instead of extractVisibleContent
async function extractVisibleContent(url) {
  const comprehensiveData = await extractComprehensiveContent(url);
  
  return {
    title: comprehensiveData.title,
    metaDescription: comprehensiveData.metaDescription,
    h1Elements: comprehensiveData.headings.h1,
    h2Elements: comprehensiveData.headings.h2,
    visibleText: comprehensiveData.visibleText,
    mainContent: comprehensiveData.mainContent
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
      // FIXED: Use JSDOM correctly
      const dom = new JSDOM(landingHtml, { url });
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
  try {
    console.log('📧 Enhanced email generation request received');
    
    const { url, name, company, email, isPdfEmail, pdfContent, htmlTemplate } = req.body;
    
    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }
    
    if (!url || !/^https?:\/\/.+/.test(url)) {
      return res.status(400).json({
        success: false,
        error: 'Valid website URL is required'
      });
    }
    
    console.log('📧 Processing request:', { email, url, hasContent: !!pdfContent });
    
    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('📧 Missing email configuration');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured'
      });
    }
    
    // ENHANCED: Create transporter with correct method name
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verify transporter
    try {
      await transporter.verify();
      console.log('📧 Email service verified successfully');
    } catch (verifyError) {
      console.error('📧 Email verification failed:', verifyError.message);
      return res.status(500).json({
        success: false,
        error: 'Email service verification failed'
      });
    }
    
    // Generate email content
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const emailSubject = `🚀 Your LandingFix AI Report - ${new URL(url).hostname}`;
    
    // Create comprehensive HTML email
    const enhancedHtmlContent = generateComprehensiveEmailReport({
      url, name, company, email, timestamp, pdfContent, htmlTemplate
    });
    
    const mailOptions = {
      from: `"LandingFix AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      html: enhancedHtmlContent,
      headers: {
        'X-Mailer': 'LandingFix AI v1.2',
        'X-Priority': '1'
      }
    };
    
    // Send email with retry logic
    const maxRetries = 3;
    let emailSent = false;
    
    for (let attempt = 1; attempt <= maxRetries && !emailSent; attempt++) {
      try {
        console.log(`📧 Sending email attempt ${attempt}/${maxRetries}`);
        
        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log('📧 Email sent successfully to:', email);
        
      } catch (emailError) {
        console.error(`📧 Email attempt ${attempt} failed:`, emailError.message);
        
        if (attempt === maxRetries) {
          throw emailError;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return res.json({
      success: true,
      message: 'Report sent successfully via email (HTML format)',
      timestamp: timestamp,
      method: 'comprehensive_html_email'
    });
    
  } catch (error) {
    console.error('📧 Email sending error:', error.message);
    
    let errorMessage = 'Failed to send report email';
    
    if (error.message.includes('authentication')) {
      errorMessage = 'Email authentication error';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Email server connection error';
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// ENHANCED: Generate comprehensive email with embedded report
function generateComprehensiveEmailReport({ url, name, company, email, timestamp, pdfContent, htmlTemplate }) {
  try {
    const domain = new URL(url).hostname;
    
    // Use provided template or generate comprehensive one
    if (htmlTemplate && htmlTemplate.length > 1000) {
      return htmlTemplate;
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your LandingFix AI Analysis Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .content { padding: 30px; }
          .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .report-section { margin: 30px 0; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .cta-button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; }
          @media (max-width: 600px) { .container { margin: 0; } .content { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🚀 Your LandingFix AI Analysis Report</h1>
            <p>Complete optimization insights for ${domain}</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <!-- Report Info -->
            <div class="info-box">
              <h3>Report Details</h3>
              <p><strong>Website:</strong> ${url}</p>
              <p><strong>Generated for:</strong> ${name || 'LandingFix AI User'}</p>
              ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
              <p><strong>Date:</strong> ${timestamp}</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
            
            <!-- Key Benefits -->
            <div class="report-section">
              <h3>📊 What's Included in Your Analysis</h3>
              <ul style="padding-left: 20px; margin: 15px 0;">
                <li>Comprehensive landing page performance analysis</li>
                <li>Specific optimization recommendations by category</li>
                <li>Implementation timelines and priorities</li>
                <li>Industry-specific best practices</li>
                <li>Actionable steps to improve conversions</li>
                <li>Professional insights from AI-powered analysis</li>
              </ul>
            </div>
            
            ${pdfContent ? `
            <!-- Report Content -->
            <div class="report-section">
              <h3>📋 Your Complete Analysis</h3>
              <div style="border: 2px solid #007bff; border-radius: 8px; padding: 20px; background: #f8f9ff;">
                ${pdfContent}
              </div>
            </div>
            ` : ''}
            
            <!-- Implementation Guide -->
            <div class="report-section">
              <h3>🎯 Implementation Roadmap</h3>
              <div style="margin: 20px 0;">
                <div style="padding: 15px; background: #e8f5e8; border-radius: 6px; margin-bottom: 15px;">
                  <strong>Phase 1: Quick Wins (Week 1-2)</strong>
                  <p>Implement high-impact, low-effort improvements to see immediate results.</p>
                </div>
                <div style="padding: 15px; background: #fff3cd; border-radius: 6px; margin-bottom: 15px;">
                  <strong>Phase 2: Strategic Changes (Week 3-6)</strong>
                  <p>Execute major optimizations that require planning and testing.</p>
                </div>
                <div style="padding: 15px; background: #d4edda; border-radius: 6px;">
                  <strong>Phase 3: Continuous Optimization (Ongoing)</strong>
                  <p>Regular testing, monitoring, and refinement of all improvements.</p>
                </div>
              </div>
            </div>
            
            <!-- Next Steps -->
            <div class="report-section" style="background: #f0f8ff; border-color: #007bff;">
              <h3>🚀 Ready to Optimize Your Landing Page?</h3>
              <p>Use this analysis to improve your conversion rates and grow your business.</p>
              <a href="https://landingfixai.com" class="cta-button">Get Another Analysis</a>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>Thank you for using LandingFix AI!</p>
            <p style="margin-top: 10px;">
              <a href="https://landingfixai.com" style="color: #667eea;">Visit our website</a> | 
              <a href="mailto:support@landingfixai.com" style="color: #667eea;">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  } catch (error) {
    console.error('Error generating email template:', error);
    return `
      <html><body>
        <h1>LandingFix AI Report</h1>
        <p>Your analysis report is ready!</p>
        <p>Website: ${url}</p>
        <p>Generated on: ${timestamp}</p>
      </body></html>
    `;
  }
}

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

const port = process.env.PORT || 10000;

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LandingFix AI Server v1.2 running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Services status:`);
  console.log(`   - Content Fetching: ✅ Enhanced Fetch + JSDOM`);
  console.log(`   - Email Reports: ✅ HTML Email Templates`);
  console.log(`   - Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   - OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
}).on('error', (error) => {
  console.error('🚨 Server startup error:', error);
  process.exit(1);
});

// ENHANCED: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});