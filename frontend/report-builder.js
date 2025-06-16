// Report Builder - Functions for building and displaying the report

class ReportBuilder {
  constructor() {
    this.staticReportHtml = null;
  }

  // Format tool names as styled buttons
  formatToolButtons(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Avoid processing already formatted text
    if (text.includes('tool-button')) return text;
    
    // Debug: Check if tools data is available
    console.log('🔍 Tools data available:', window.toolsData ? 'Yes' : 'No');
    
    // Get tools data from tools.js if available
    const toolsData = window.toolsData || {};
    
    // Create a comprehensive map of tool names to their data
    const toolMap = new Map();
    const availableToolNames = [];
    
    // Process all categories from tools.js
    Object.values(toolsData).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(tool => {
          if (tool.name && tool.url) {
            // Add exact name match
            toolMap.set(tool.name.toLowerCase(), tool);
            availableToolNames.push(tool.name);
            
            // Add variations for common cases
            if (tool.name.includes(' ')) {
              // Remove spaces for compound names
              toolMap.set(tool.name.replace(/\s+/g, '').toLowerCase(), tool);
            }
            
            // Add specific tool variations and common mentions
            const name = tool.name.toLowerCase();
            
            // Enhanced mapping for common AI suggestions
            if (name.includes('hemingway')) {
              toolMap.set('hemingway app', tool);
              toolMap.set('hemingway editor', tool);
              toolMap.set('hemingway', tool);
            }
            if (name.includes('coschedule')) {
              toolMap.set('coschedule headline analyzer', tool);
              toolMap.set('coschedule', tool);
            }
            if (name.includes('typeform')) {
              toolMap.set('typeform', tool);
            }
            if (name.includes('trustpilot')) {
              toolMap.set('trustpilot', tool);
            }
            if (name.includes('animoto')) {
              toolMap.set('animoto', tool);
            }
            if (name.includes('canva')) {
              toolMap.set('canva', tool);
            }
            if (name.includes('grammarly')) {
              toolMap.set('grammarly', tool);
            }
            if (name.includes('optimizely')) {
              toolMap.set('optimizely', tool);
            }
            if (name.includes('hotjar')) {
              toolMap.set('hotjar', tool);
            }
            if (name.includes('google analytics')) {
              toolMap.set('google analytics', tool);
              toolMap.set('ga', tool);
            }
            if (name.includes('vwo')) {
              toolMap.set('vwo', tool);
            }
            // Add more specific variations
            if (name.includes('visual website optimizer')) toolMap.set('vwo', tool);
            if (name.includes('google tag manager')) toolMap.set('gtm', tool);
          }
        });
      }
    });
    
    console.log('🔍 Available tools:', availableToolNames.length, availableToolNames);
    console.log('🔍 Tool map keys:', Array.from(toolMap.keys()));
    
    // If no tools available in tools.js, return original text
    if (availableToolNames.length === 0) {
      console.warn('⚠️ No tools found in tools.js');
      return text;
    }
    
    let formattedText = text;
    
    // Enhanced tool detection patterns including common variations
    const commonToolMentions = [
      // Direct tool names from our database
      ...availableToolNames,
      // Common variations and mentions that AI uses
      'Hemingway App', 'CoSchedule Headline Analyzer', 'Typeform', 'Trustpilot', 
      'Animoto', 'Canva', 'Grammarly', 'Optimizely', 'Hotjar'
    ];
    
    // Create dynamic regex patterns
    const escapedToolNames = commonToolMentions.map(name => 
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    
    // Split into smaller chunks to avoid regex issues
    const chunkSize = 8;
    const toolChunks = [];
    for (let i = 0; i < escapedToolNames.length; i += chunkSize) {
      toolChunks.push(escapedToolNames.slice(i, i + chunkSize));
    }
    
    // Track processed tools and their positions
    const processedTools = new Set();
    const toolPositions = new Map();
    
    // Find all tool mentions using chunked patterns
    toolChunks.forEach(chunk => {
      const toolPattern = new RegExp(`\\b(${chunk.join('|')})\\b`, 'gi');
      let match;
      toolPattern.lastIndex = 0;
      
      while ((match = toolPattern.exec(formattedText)) !== null) {
        const toolName = match[0];
        const toolKey = toolName.toLowerCase();
        const position = match.index;
        
        // Check if followed by URL in parentheses or possessives
        const afterMatch = formattedText.substring(position + toolName.length);
        const hasUrlInParentheses = /^\s*\([^)]*\.com[^)]*\)/i.test(afterMatch);
        const hasPossessive = /^'s\b/i.test(afterMatch);
        
        // Only process each tool once per position context
        const positionKey = `${toolKey}-${Math.floor(position / 100)}`;
        if (!processedTools.has(positionKey)) {
          toolPositions.set(positionKey, {
            name: toolName,
            position: position,
            hasUrl: hasUrlInParentheses,
            hasPossessive: hasPossessive,
            key: toolKey
          });
          processedTools.add(positionKey);
        }
      }
    });
    
    console.log('🔍 Found tool mentions:', toolPositions.size, Array.from(toolPositions.keys()));
    
    // Replace with buttons, from end to start
    const sortedTools = Array.from(toolPositions.values()).sort((a, b) => b.position - a.position);
    
    sortedTools.forEach((toolInfo) => {
      const toolName = toolInfo.name;
      const toolKey = toolInfo.key;
      
      // Find tool data with multiple fallback strategies
      let toolData = toolMap.get(toolKey);
      if (!toolData) {
        // Try without spaces
        toolData = toolMap.get(toolKey.replace(/\s+/g, ''));
      }
      if (!toolData) {
        // Try first word only for compound names
        const firstWord = toolKey.split(' ')[0];
        toolData = toolMap.get(firstWord);
      }
      if (!toolData) {
        // Try specific variations
        if (toolKey.includes('hemingway')) toolData = toolMap.get('hemingway editor') || toolMap.get('hemingway app');
        if (toolKey.includes('coschedule')) toolData = toolMap.get('coschedule headline analyzer') || toolMap.get('coschedule');
        if (toolKey.includes('animoto')) toolData = toolMap.get('animoto');
        if (toolKey.includes('trustpilot')) toolData = toolMap.get('trustpilot');
      }
      
      // Only process if we have valid tool data from tools.js
      if (toolData && toolData.url) {
        console.log('🔧 Converting to button:', toolName, '→', toolData.url);
        
        // Create replacement pattern
        let searchPattern;
        if (toolInfo.hasUrl) {
          // Match tool + URL in parentheses
          searchPattern = new RegExp(`\\b${toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\([^)]*\\)`, 'i');
        } else if (toolInfo.hasPossessive) {
          // Match tool with possessive
          searchPattern = new RegExp(`\\b${toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'s\\b`, 'i');
        } else {
          // Match just the tool name
          searchPattern = new RegExp(`\\b${toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        }
        
        const toolButton = `<a href="${toolData.url}" target="_blank" class="tool-button" onclick="event.stopPropagation()">${toolName}<i class="fa fa-external-link"></i></a>`;
        formattedText = formattedText.replace(searchPattern, toolButton);
      } else {
        console.warn('⚠️ Tool data not found for:', toolName, 'Key:', toolKey, 'Available keys:', Array.from(toolMap.keys()).slice(0, 10));
      }
    });
    
    return formattedText;
  }

  // Build report categories
  buildReportCategories(categories, data) {
    // Initialize tool button styles
    this.initializeToolButtonStyles();
    
    // Load tools data if not already available - make it synchronous
    this.loadToolsData();
    
    // Wait a moment for tools to load before building
    setTimeout(() => {
      this.processCategoriesWithTools(categories, data);
    }, 500);
  }

  // Process categories after tools are loaded
  processCategoriesWithTools(categories, data) {
    // FIXED: Add comprehensive safety checks
    if (!Array.isArray(categories)) {
      console.error('Categories is not an array:', categories);
      return;
    }

    if (categories.length === 0) {
      console.warn('No categories to build');
      return;
    }

    console.log('🏗️ Building categories:', categories.length);

    // FIXED: Check if we're still in the static HTML state
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
      console.error('Report content not found');
      return;
    }

    // Check if we still have the loader instead of category divs
    const hasLoader = reportContent.querySelector('.report-loader');
    if (hasLoader) {
      console.error('❌ Categories called while loader is still active, skipping...');
      return;
    }

    // FIXED: Verify all required category divs exist
    const expectedCategoryIds = Array.from({length: categories.length}, (_, i) => `category-${i}`);
    const missingDivs = expectedCategoryIds.filter(id => !document.getElementById(id));
    
    if (missingDivs.length > 0) {
      console.error('❌ Missing category divs:', missingDivs);
      console.log('Available divs:', Array.from(document.querySelectorAll('[id^="category-"]')).map(el => el.id));
      return;
    }

    console.log('✅ All category divs verified, proceeding with build...');

    categories.forEach((cat, i) => {
      try {
        const catDiv = document.getElementById(`category-${i}`);
        if (!catDiv) {
          console.warn(`Category div not found: category-${i}`);
          return;
        }

        // Update category name safely
        const catNameSpan = catDiv.querySelector('.category-name');
        if (catNameSpan && cat.category) {
          catNameSpan.textContent = cat.category;
        }

        // Update category metrics safely
        const catOpt = Math.round(cat.optimizationScore || 0);
        const catImpact = Math.round(cat.impactScore || 0);
        const catTiming = cat.timing || '–';

        const scoreEl = catDiv.querySelector('.cat-score');
        const impactEl = catDiv.querySelector('.cat-impact');
        const timingEl = catDiv.querySelector('.cat-timing');

        if (scoreEl) scoreEl.textContent = catOpt;
        if (impactEl) impactEl.textContent = catImpact;
        if (timingEl) timingEl.textContent = catTiming;

        // Handle locked categories with overlays
        if (catDiv.classList.contains('locked')) {
          this.setupLockedCategory(catDiv, cat, data);
        }

        // Build elements safely
        this.buildCategoryElements(catDiv, cat, i);

        console.log(`✅ Category ${i} (${cat.category}) built successfully`);

      } catch (categoryError) {
        console.error(`❌ Error processing category ${i}:`, categoryError);
        // Continue with other categories instead of failing completely
      }
    });

    console.log('🎯 All categories processing completed');
  }

  // Setup locked category overlay
  setupLockedCategory(catDiv, cat, data) {
    const existingOverlay = catDiv.querySelector('.locked-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const elementsCount = cat.elements ? cat.elements.length : 0;
    const focusKeyForOverlay = (data.focus || 'copywriting').toLowerCase();
    
    const overlayHTML = this.generateUnlockOverlay(focusKeyForOverlay, cat.category, elementsCount);
    
    const categoryHeader = catDiv.querySelector('.category-header');
    if (categoryHeader) {
      categoryHeader.insertAdjacentHTML('afterend', overlayHTML);
      
      // Force overlay visibility
      setTimeout(() => {
        const newOverlay = catDiv.querySelector('.locked-overlay');
        if (newOverlay) {
          this.forceOverlayVisibility(newOverlay);
        }
      }, 100);
    }
  }

  // Force overlay visibility
  forceOverlayVisibility(overlay) {
    overlay.style.zIndex = '999';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
    overlay.style.transform = 'translateZ(0)';
    
    const overlayContent = overlay.querySelector('.locked-overlay-content');
    if (overlayContent) {
      overlayContent.style.zIndex = '1000';
      overlayContent.style.opacity = '1';
      overlayContent.style.background = 'white';
      overlayContent.style.visibility = 'visible';
      overlayContent.style.pointerEvents = 'auto';
      overlayContent.style.transform = 'translateZ(0)';
      
      // Force all child elements to be visible
      const allChildren = overlayContent.querySelectorAll('*');
      allChildren.forEach(child => {
        child.style.opacity = '1';
        child.style.visibility = 'visible';
        child.style.pointerEvents = 'auto';
      });
    }
  }

  // Generate unlock overlay content
  generateUnlockOverlay(focusKey, categoryName, elementsCount) {
    const content = this.getUnlockContent()[focusKey] || this.getUnlockContent().copywriting;
    const focusDisplay = focusKey.charAt(0).toUpperCase() + focusKey.slice(1);
    
    return `
      <div class="locked-overlay">
        <div class="locked-overlay-content">
          <div class="locked-overlay-icon">
            <i class="fa fa-lock"></i>
          </div>
          <h3 class="locked-overlay-title">${content.title}</h3>
          <p class="locked-overlay-text">
            Unlock detailed analysis for <strong>${categoryName}</strong> and ${elementsCount} optimization elements.
          </p>
          <div class="locked-overlay-benefits">
            <h4>What you'll get:</h4>
            <ul>
              ${content.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          <p class="locked-overlay-text" style="font-size: 0.9rem; margin-bottom: 20px;">
            Get actionable insights to improve your ${focusDisplay.toLowerCase()} performance and boost conversions.
          </p>
          <button class="unlock-btn" onclick="window.loadCheckoutPopup(() => window.openCheckout())">
            <i class="fa fa-unlock" style="margin-right: 8px;"></i>
            Unlock Full Analysis
          </button>
        </div>
      </div>
    `;
  }

  // Get unlock content by focus
  getUnlockContent() {
    return {
      copywriting: {
        title: "Unlock Advanced Copywriting Analysis",
        benefits: [
          "Detailed headline optimization strategies",
          "CTA text improvement recommendations", 
          "Value proposition enhancement tips",
          "Trust signal optimization guidance"
        ]
      },
      uxui: {
        title: "Unlock Complete UX/UI Analysis",
        benefits: [
          "Visual hierarchy optimization techniques",
          "User experience flow improvements",
          "Design consistency recommendations",
          "Accessibility enhancement strategies"
        ]
      },
      mobile: {
        title: "Unlock Full Mobile Optimization Report",
        benefits: [
          "Responsive design optimization tips",
          "Touch interface improvements",
          "Mobile performance enhancements",
          "Device-specific recommendations"
        ]
      },
      cta: {
        title: "Unlock Complete CTA Optimization Analysis",
        benefits: [
          "Button design and placement strategies",
          "CTA copy optimization techniques", 
          "Conversion flow improvements",
          "A/B testing recommendations"
        ]
      },
      seo: {
        title: "Unlock Advanced SEO Analysis",
        benefits: [
          "Technical SEO optimization strategies",
          "Content structure improvements",
          "Meta tags and schema markup tips",
          "Search ranking enhancement tactics"
        ]
      }
    };
  }

  // Build category elements with comprehensive safety checks
  buildCategoryElements(catDiv, cat, categoryIndex) {
    try {
      const elementsContainer = catDiv.querySelector('.category-elements');
      if (!elementsContainer) {
        console.warn(`Elements container not found for category ${categoryIndex}`);
        return;
      }

      // Clear existing content safely
      elementsContainer.innerHTML = '';
      
      if (!cat.elements || !Array.isArray(cat.elements)) {
        console.warn(`No valid elements for category ${categoryIndex}`);
        elementsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No elements available</div>';
        return;
      }

      if (cat.elements.length === 0) {
        console.warn(`Empty elements array for category ${categoryIndex}`);
        elementsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No elements to display</div>';
        return;
      }

      // Build each element safely
      cat.elements.forEach((data, j) => {
        try {
          const elDiv = document.createElement('div');
          elDiv.className = 'report-element';
          elDiv.id = `category-${categoryIndex}-el-${j}`;
          
          const elementHTML = this.buildElementHTML(data);
          elDiv.innerHTML = elementHTML;
          elementsContainer.appendChild(elDiv);
          
        } catch (elementError) {
          console.error(`❌ Error building element ${j} in category ${categoryIndex}:`, elementError);
          // Add error placeholder instead of failing
          const errorDiv = document.createElement('div');
          errorDiv.className = 'report-element error';
          errorDiv.innerHTML = `
            <div style="padding: 16px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;">
              <strong>Error loading element ${j + 1}</strong>
              <br><small>${elementError.message}</small>
            </div>
          `;
          elementsContainer.appendChild(errorDiv);
        }
      });

      console.log(`✅ Built ${cat.elements.length} elements for category ${categoryIndex}`);

    } catch (containerError) {
      console.error(`❌ Error in buildCategoryElements for category ${categoryIndex}:`, containerError);
    }
  }

  // Build individual element HTML with safety
  buildElementHTML(data) {
    try {
      if (!data) {
        return '<div style="padding: 16px; color: #666;">No data available</div>';
      }

      // Safely get element title
      const elementTitle = data.title || data.element || data.name || data.label || 'Untitled Element';

      // Determine site text label
      let siteTextLabel = '';
      if (data.siteTextType) {
        siteTextLabel = data.siteTextType;
      } else if (data.siteText) {
        const txt = data.siteText.toLowerCase();
        if (/cta|button|acquista|compra|scopri|inizia|prova|iscriviti|registrati/.test(txt)) siteTextLabel = 'Button';
        else if (/^h1|headline|titolo|main/i.test(txt)) siteTextLabel = 'Headline';
        else if (/descrizione|description|paragrafo|paragraph/.test(txt)) siteTextLabel = 'Description';
        else if (/title|titolo/.test(txt)) siteTextLabel = 'Title';
        else siteTextLabel = 'Text';
      }

      let showSiteText = data.siteText && data.siteText !== "N/A" && data.siteText !== "Not found";
      
      let elementHTML = `<div class="element-title">${elementTitle}</div>`;
      elementHTML += '<div class="element-content">';
      
      // Add site text block if available
      if (showSiteText) {
        elementHTML += `
          <div class="element-block site-text-block" style="background:#f3f7ff;border-left:4px solid #3b82f6;">
            <div class="block-label" style="color:#2563eb;">${siteTextLabel || 'Text'}</div>
            <div class="block-content">
              <div class="site-text-value">${data.siteText}</div>
            </div>
          </div>`;
      }
      
      // Add problem block
      elementHTML += `
        <div class="element-block problem">
          <div class="block-label">Problem</div>
          <div class="block-content">
            <div class="problem-text">${this.formatToolButtons(data.problem || (data.problemText || '<span style="color:#aaa;">No data</span>'))}</div>
          </div>
        </div>`;
      
      // Add solution block
      elementHTML += `
        <div class="element-block solution">
          <div class="block-label">Solution</div>
          <div class="block-content">
            <div class="solution-text">${this.formatToolButtons(data.solution || (data.solutionText || '<span style="color:#aaa;">No data</span>'))}</div>
          </div>
        </div>`;
      
      // Add actions block
      let actionsHTML = '';
      if (Array.isArray(data.actions) && data.actions.length > 0) {
        actionsHTML = data.actions.map(a => `<li style="margin-bottom:8px;">${this.formatToolButtons(window.formatActions ? window.formatActions([a]) : a)}</li>`).join('');
      } else if (Array.isArray(data.actionsList) && data.actionsList.length > 0) {
        actionsHTML = data.actionsList.map(a => `<li style="margin-bottom:8px;">${this.formatToolButtons(window.formatActions ? window.formatActions([a]) : a)}</li>`).join('');
      } else {
        actionsHTML = '<li style="color:#aaa;">No data</li>';
      }
      
      elementHTML += `
        <div class="element-block actions">
          <div class="block-label">Actions</div>
          <div class="block-content">
            <ul class="actions-list" style="padding-left:18px;margin:0;">
              ${actionsHTML}
            </ul>
          </div>
        </div>`;
      
      // Add metrics block
      const impactValue = data.metrics?.impact ?? (data.impact ?? '–');
      const timingValue = window.formatTiming ? window.formatTiming(data.metrics?.timing || data.timing) : (data.metrics?.timing || data.timing || '–');
      
      elementHTML += `
        <div class="element-metrics">
          <span class="metric" style="color:#27ae60;"><i class="fa fa-arrow-up-right-dots"></i> +${impactValue}%</span>
          <span class="metric"><i class="fa fa-clock"></i> ${timingValue}</span>
        </div>`;
      
      elementHTML += '</div>';
      
      return elementHTML;

    } catch (error) {
      console.error('Error building element HTML:', error);
      return `
        <div style="padding: 16px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;">
          <strong>Error building element</strong>
          <br><small>${error.message}</small>
        </div>
      `;
    }
  }

  // Initialize tool button styles
  initializeToolButtonStyles() {
    // Check if styles already exist
    if (document.getElementById('tool-button-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'tool-button-styles';
    style.textContent = `
      .tool-button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        background-color: #0070ba !important;
        color: white !important;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: 500;
        text-decoration: none !important;
        margin: 0 3px 2px 0;
        white-space: nowrap;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        position: relative;
        vertical-align: middle;
      }
      
      .tool-button:hover {
        background-color: #005a94 !important;
        color: white !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 112, 186, 0.3);
        text-decoration: none !important;
      }
      
      .tool-button .fa-external-link {
        font-size: 0.7em;
        opacity: 0.8;
        margin-left: 2px;
      }
      
      .tool-button:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(0, 112, 186, 0.2);
      }
      
      .tool-button:visited {
        color: white !important;
        background-color: #0070ba !important;
      }
      
      /* Ensure proper spacing in text contexts */
      .problem-text .tool-button,
      .solution-text .tool-button,
      .actions-list .tool-button {
        margin: 0 3px 2px 0;
        vertical-align: baseline;
      }
      
      /* Fix for list items */
      .actions-list li {
        line-height: 1.6;
      }
      
      /* Global dynamic score colors */
      .score-metric-header .current-score-value,
      .score-metric-card .score-value.optimization {
        color: var(--optimization-color, #0070ba) !important;
      }
      
      .score-metric-header .impact-score-value,
      .score-metric-card .score-value.impact {
        color: #22c55e !important;
      }
      
      /* Global dynamic score colors for header metrics */
      .score-metric-header .metric-value,
      .dynamic-report-details .metric-value,
      .report-metrics .optimization-score,
      .report-metrics .current-score {
        color: var(--optimization-color, #0070ba) !important;
      }
      
      .score-metric-header .impact-value,
      .dynamic-report-details .impact-value,
      .report-metrics .impact-score {
        color: #22c55e !important;
      }
      
      /* Specific selectors for header score elements */
      .score-metric-header .score-value:first-child,
      .dynamic-report-details .score-value:first-child,
      #optimization-score,
      .optimization-score-value {
        color: var(--optimization-color, #0070ba) !important;
      }
      
      .score-metric-header .score-value:nth-child(2),
      .dynamic-report-details .score-value:nth-child(2),
      #impact-score,
      .impact-score-value {
        color: #22c55e !important;
      }
      
      /* Helper classes for dynamic coloring */
      .score-low { color: #ef4444 !important; }
      .score-medium { color: #f59e0b !important; }
      .score-high { color: #0070ba !important; }
      .score-impact { color: #22c55e !important; }
    `;
    
    document.head.appendChild(style);
    
    // Enhanced function to dynamically update score colors everywhere
    window.updateScoreColors = (optimizationScore, impactScore) => {
      const getOptimizationColor = (score) => {
        if (score >= 80) return '#0070ba';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
      };
      
      const optColor = getOptimizationColor(optimizationScore);
      
      // Update CSS custom property
      document.documentElement.style.setProperty('--optimization-color', optColor);
      
      // Update all optimization score elements
      const optimizationSelectors = [
        '.current-score-value',
        '.optimization-score',
        '.optimization-score-value',
        '#optimization-score',
        '.metric-value.optimization',
        '.score-value.optimization',
        '.dynamic-report-details .score-value:first-child',
        '.score-metric-header .score-value:first-child'
      ];
      
      optimizationSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.color = optColor + ' !important';
        });
      });
      
      // Update all impact score elements
      const impactSelectors = [
        '.impact-score-value',
        '.impact-score',
        '#impact-score',
        '.metric-value.impact',
        '.score-value.impact',
        '.dynamic-report-details .score-value:nth-child(2)',
        '.score-metric-header .score-value:nth-child(2)'
      ];
      
      impactSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.color = '#22c55e !important';
        });
      });
      
      console.log('🎨 Score colors updated:', {
        optimization: optColor,
        impact: '#22c55e',
        score: optimizationScore
      });
    };
    
    // Auto-update colors when DOM changes
    const observer = new MutationObserver(() => {
      const optElement = document.querySelector('#optimization-score, .optimization-score-value');
      const impElement = document.querySelector('#impact-score, .impact-score-value');
      
      if (optElement && impElement) {
        const optValue = parseInt(optElement.textContent) || 0;
        const impValue = parseInt(impElement.textContent) || 0;
        window.updateScoreColors(optValue, impValue);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Update final summary
  updateFinalSummary(data) {
    const reportData = window.getReportData ? window.getReportData() : JSON.parse(localStorage.getItem('landingfix_report_data') || '{}');
    const focusDisplayName = reportData.focus || '-';
    
    // Helper function to get color based on optimization score
    const getOptimizationColor = (score) => {
      if (score >= 80) return '#0070ba'; // Blue for high scores
      if (score >= 60) return '#f59e0b'; // Orange for medium scores
      return '#ef4444'; // Red for low scores
    };
    
    // FIXED: Enhanced check for locked overlays with periodic monitoring
    const checkAndUpdateUnlockButton = () => {
      const hasLockedOverlays = document.querySelectorAll('.locked-overlay').length > 0;
      const unlockButton = document.querySelector('.final-summary-actions .action-btn.primary');
      
      console.log('🔍 Checking unlock button status:', {
        hasOverlays: hasLockedOverlays,
        hasButton: !!unlockButton,
        overlayCount: document.querySelectorAll('.locked-overlay').length
      });
      
      if (hasLockedOverlays && !unlockButton) {
        // Add unlock button if missing and report is locked
        const actionsContainer = document.querySelector('.final-summary-actions');
        if (actionsContainer) {
          const unlockBtn = document.createElement('button');
          unlockBtn.className = 'action-btn primary';
          unlockBtn.onclick = () => document.getElementById('unlock-full-report')?.click();
          unlockBtn.innerHTML = '<i class="fa fa-unlock"></i><span>Unlock Full Report</span>';
          actionsContainer.insertBefore(unlockBtn, actionsContainer.firstChild);
          console.log('✅ Added unlock button - report is locked');
        }
      } else if (!hasLockedOverlays && unlockButton) {
        // Remove unlock button if exists and report is unlocked
        unlockButton.remove();
        console.log('✅ Removed unlock button - report is unlocked');
      }
    };
    
    // Initial check with delay
    setTimeout(checkAndUpdateUnlockButton, 800);
    
    // FIXED: Add periodic monitoring to detect when overlays are removed
    const monitorInterval = setInterval(() => {
      checkAndUpdateUnlockButton();
      
      // Stop monitoring if final summary is removed or after 5 minutes
      if (!document.querySelector('.report-summary-final')) {
        clearInterval(monitorInterval);
        console.log('🔄 Stopped monitoring - final summary removed');
      }
    }, 2000); // Check every 2 seconds
    
    // Stop monitoring after 5 minutes to prevent memory leaks
    setTimeout(() => {
      clearInterval(monitorInterval);
      console.log('🔄 Stopped monitoring - timeout reached');
    }, 300000); // 5 minutes
    
    // Find or create final summary section
    let finalSummary = document.querySelector('.report-summary-final');
    if (!finalSummary) {
      finalSummary = document.createElement('div');
      finalSummary.className = 'report-summary-final';
      document.getElementById('report-content').appendChild(finalSummary);
    }
    
    finalSummary.innerHTML = `
      <h3>Optimization Analysis Summary</h3>
      
      <!-- Simplified Final Summary Layout -->
      <div class="final-summary-header">
        <div class="final-summary-info">
          <div class="final-summary-title">
            <h4>Complete Analysis Results</h4>
            <p>Professional landing page optimization recommendations</p>
          </div>
          
          <div class="final-summary-scores">
            <!-- Score Cards using score-metric-header style -->
            <div class="score-metric-card" id="final-current-score-card">
              <div class="score-value" id="final-optimization-score" style="color: ${getOptimizationColor(data.optimization)} !important;">${data.optimization}%</div>
              <div class="score-label">Current Score</div>
              <div class="score-description">Your current optimization level</div>
            </div>
            
            <div class="score-metric-card" id="final-impact-score-card">
              <div class="score-value" id="final-impact-score" style="color: #22c55e !important;">+${data.impact}%</div>
              <div class="score-label">Impact Potential</div>
              <div class="score-description">Estimated improvement percentage</div>
            </div>
            
            <div class="score-metric-card" id="final-timing-score-card">
              <div class="score-value" id="final-timing-score">${data.timing}</div>
              <div class="score-label">Implementation</div>
              <div class="score-description">Time required for changes</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons - initially without unlock button, will be added dynamically -->
      <div class="final-summary-actions">
        <button class="action-btn secondary" onclick="document.getElementById('send-via-email')?.click()">
          <i class="fa fa-paper-plane"></i>
          <span>Send via Email</span>
        </button>
        <button class="action-btn outline" onclick="document.getElementById('save-as-pdf')?.click()">
          <i class="fa fa-file-pdf"></i>
          <span>Save as PDF</span>
        </button>
      </div>
      
      <div class="final-summary-footer">
        <p>Complete analysis with actionable recommendations for your ${focusDisplayName.toLowerCase()} optimization strategy</p>
      </div>
      
      <style>
        .final-summary-header {
          background: white;
          color: #374151;
          padding: 35px 40px;
          border-radius: 12px;
          margin-bottom: 25px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .final-summary-info {
          text-align: left;
        }
        
        .final-summary-title h4 {
          margin: 0 0 12px 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: #0070ba;
          text-align: left;
          line-height: 1.2;
        }
        
        .final-summary-title p {
          margin: 0 0 30px 0;
          font-size: 1.1rem;
          color: #374151;
          text-align: left;
          line-height: 1.4;
        }
        
        .final-summary-scores {
          display: flex;
          gap: 25px;
          justify-content: flex-start;
          flex-wrap: wrap;
        }
        
        /* Score Cards using score-metric-header style */
        .final-summary-scores .score-metric-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px 20px;
          text-align: center;
          min-width: 150px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          flex: 1;
        }
        
        .final-summary-scores .score-metric-card:hover {
          transform: translateY(-3px);
          border-color: #0070ba;
          box-shadow: 0 8px 25px rgba(0, 112, 186, 0.15);
        }
        
        .final-summary-scores .score-metric-card .score-value {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 10px;
          line-height: 1;
          color: #0070ba;
        }
        
        .final-summary-scores .score-metric-card .score-label {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }
        
        .final-summary-scores .score-metric-card .score-description {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.3;
        }
        
        .final-summary-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }
        
        /* Action buttons style */
        .final-summary-actions .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          font-size: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .final-summary-actions .action-btn.primary {
          background: linear-gradient(135deg, #0070ba 0%, #005a94 100%);
          color: white;
          border: 2px solid transparent;
        }
        
        .final-summary-actions .action-btn.secondary {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #0070ba;
          border: 2px solid #0070ba;
        }
        
        .final-summary-actions .action-btn.outline {
          background: transparent;
          color: #0070ba;
          border: 2px solid #0070ba;
        }
        
        .final-summary-actions .action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 112, 186, 0.3);
        }
        
        .final-summary-actions .action-btn.primary:hover {
          background: linear-gradient(135deg, #005a94 0%, #004578 100%);
          box-shadow: 0 8px 25px rgba(0, 112, 186, 0.4);
        }
        
        .final-summary-actions .action-btn.secondary:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          color: #005a94;
        }
        
        .final-summary-actions .action-btn.outline:hover {
          background: linear-gradient(135deg, #0070ba 0%, #005a94 100%);
          color: white;
        }
        
        /* Global styles for report-action-buttons to match final-summary-actions */
        .report-action-buttons .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          font-size: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .report-action-buttons .action-btn.primary {
          background: linear-gradient(135deg, #0070ba 0%, #005a94 100%);
          color: white;
          border: 2px solid transparent;
        }
        
        .report-action-buttons .action-btn.secondary {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #0070ba;
          border: 2px solid #0070ba;
        }
        
        .report-action-buttons .action-btn.outline {
          background: transparent;
          color: #0070ba;
          border: 2px solid #0070ba;
        }
        
        .report-action-buttons .action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 112, 186, 0.3);
        }
        
        .report-action-buttons .action-btn.primary:hover {
          background: linear-gradient(135deg, #005a94 0%, #004578 100%);
          box-shadow: 0 8px 25px rgba(0, 112, 186, 0.4);
        }
        
        .report-action-buttons .action-btn.secondary:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          color: #005a94;
        }
        
        .report-action-buttons .action-btn.outline:hover {
          background: linear-gradient(135deg, #0070ba 0%, #005a94 100%);
          color: white;
        }
        
        /* FIXED: Icon background colors */
        .locked-overlay-icon {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        .unlock-overlay-icon {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* FIXED: Header icons with more specific selectors */
        .user-info .fa,
        .report-metadata .fa,
        .landing-page-info .fa,
        .email-info .fa,
        .website-info .fa,
        .icon,
        [class*="icon-"]:not(.locked-overlay-icon):not(.unlock-overlay-icon) {
          background-color: #0070ba !important;
          color: white !important;
          border-radius: 50% !important;
          padding: 8px !important;
          width: 32px !important;
          height: 32px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      
        
        /* Ensure overlay icons have no background */
        .locked-overlay .fa,
        .unlock-overlay .fa {
          background-color: transparent !important;
          color: inherit !important;
          border-radius: 0 !important;
          padding: 0 !important;
          width: auto !important;
          height: auto !important;
        }

      </style>
    `;
  }

  // Process the raw report data with enhanced safety
  processReportData(result) {
    console.log('Processing report data:', result);

    let categories = [];
    
    try {
      if (Array.isArray(result)) {
        categories = result;
      } else if (Array.isArray(result.categories)) {
        categories = result.categories;
      } else if (Array.isArray(result.report)) {
        categories = result.report;
      }

      const finalImpact = result.impactScoreTotale || 0;
      const finalOpt = result.optimizationScoreTotale || 0;
      const finalTiming = result.totalTiming || '–';

      // Validation
      const validatedOpt = isNaN(finalOpt) ? 0 : Math.max(0, Math.min(100, finalOpt));
      const validatedImpact = isNaN(finalImpact) ? 0 : Math.max(0, Math.min(100, finalImpact));

      console.log('✅ Report data processed successfully:', {
        categories: categories.length,
        optimization: validatedOpt,
        impact: validatedImpact,
        timing: finalTiming
      });

      // Update score colors after processing data
      setTimeout(() => {
        if (window.updateScoreColors) {
          window.updateScoreColors(validatedOpt, validatedImpact);
        }
      }, 1000);

      return {
        categories,
        optimization: validatedOpt,
        impact: validatedImpact,
        timing: finalTiming,
        rawResult: result
      };

    } catch (error) {
      console.error('Error processing report data:', error);
      return {
        categories: [],
        optimization: 0,
        impact: 0,
        timing: '–',
        rawResult: result
      };
    }
  }

  // Load tools data from backend
  loadToolsData() {
    if (window.toolsData) {
      console.log('✅ Tools data already loaded');
      return Promise.resolve();
    }
    
    console.log('🔄 Loading tools data from backend...');
    
    // Try to fetch tools from backend
    return fetch('/api/tools')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        window.toolsData = data;
        console.log('✅ Tools data loaded from backend:', Object.keys(data).length, 'categories');
        console.log('🔍 Sample tools:', Object.keys(data).slice(0, 3).map(cat => `${cat}: ${data[cat].length} tools`));
        
        // Debug: show all available tools
        const allToolNames = [];
        Object.values(data).forEach(category => {
          if (Array.isArray(category)) {
            category.forEach(tool => {
              if (tool.name) allToolNames.push(tool.name);
            });
          }
        });
        console.log('🔍 All available tool names:', allToolNames);
        
        return data;
      })
      .catch(error => {
        console.warn('⚠️ Could not load tools from backend:', error.message);
        console.log('🔄 Using fallback tools data...');
        
        // Enhanced fallback with more tools that AI commonly suggests
        window.toolsData = {
          design: [
            { name: "Canva", url: "https://canva.com/" },
            { name: "Figma", url: "https://figma.com/" }
          ],
          copywriting: [
            { name: "Hemingway Editor", url: "https://hemingwayapp.com/" },
            { name: "Hemingway App", url: "https://hemingwayapp.com/" },
            { name: "Grammarly", url: "https://grammarly.com/" },
            { name: "CoSchedule", url: "https://coschedule.com/headline-analyzer" },
            { name: "CoSchedule Headline Analyzer", url: "https://coschedule.com/headline-analyzer" }
          ],
          forms: [
            { name: "Typeform", url: "https://typeform.com/" },
            { name: "Google Forms", url: "https://forms.google.com/" }
          ],
          analytics: [
            { name: "Hotjar", url: "https://hotjar.com/" },
            { name: "Google Analytics", url: "https://analytics.google.com/" }
          ],
          testimonials: [
            { name: "Trustpilot", url: "https://trustpilot.com/" }
          ],
          abTesting: [
            { name: "VWO", url: "https://vwo.com/" },
            { name: "Optimizely", url: "https://www.optimizely.com/" }
          ],
          video: [
            { name: "Animoto", url: "https://animoto.com/" }
          ]
        };
        console.log('✅ Fallback tools data set');
        return window.toolsData;
      });
  }
}

// Make ReportBuilder globally available
window.ReportBuilder = ReportBuilder;

console.log('✅ Report builder loaded');