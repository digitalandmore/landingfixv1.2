// Domain Validation and Blocking Detection System for LandingFix AI
// Realistic validation based on actual technical limitations

/**
 * Validates URL format and basic accessibility
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result
 */
function validateUrl(url) {
  console.log('🔍 Validating URL format and accessibility:', url);
  
  // Basic format validation
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      valid: false,
      error: 'URL_REQUIRED',
      message: 'URL is required',
      userMessage: 'Please enter a valid URL',
      shouldBlock: true
    };
  }
  
  const trimmedUrl = url.trim();
  
  // Check if URL has protocol
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return {
      valid: false,
      error: 'MISSING_PROTOCOL',
      message: 'URL must include protocol (http:// or https://)',
      userMessage: 'Please include http:// or https:// in your URL',
      shouldBlock: true,
      suggestion: `https://${trimmedUrl}`
    };
  }
  
  // Try to parse URL
  try {
    const urlObj = new URL(trimmedUrl);
    
    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return {
        valid: false,
        error: 'INVALID_HOSTNAME',
        message: 'Invalid hostname',
        userMessage: 'Please enter a valid website URL with a proper domain',
        shouldBlock: true
      };
    }
    
    // Check for localhost/private IPs (these can't be accessed by our server)
    if (urlObj.hostname === 'localhost' || 
        urlObj.hostname.startsWith('127.') || 
        urlObj.hostname.startsWith('192.168.') ||
        urlObj.hostname.startsWith('10.') ||
        urlObj.hostname.includes('.local') ||
        urlObj.hostname === '0.0.0.0') {
      return {
        valid: false,
        error: 'LOCAL_URL',
        message: 'Local URLs cannot be accessed by our analysis system',
        userMessage: 'Local URLs are not supported. Please enter a publicly accessible website URL',
        shouldBlock: true
      };
    }
    
    // Check for common invalid patterns
    const invalidPatterns = [
      /^https?:\/\/\/?$/,           // Just protocol
      /^https?:\/\/\/$/,            // Protocol with empty path
      /example\.com/i,              // Standard example domains
      /example\.org/i,
      /example\.net/i,
      /test\.com/i,                 // Test domains
      /\.test$/i,
      /\.localhost$/i,
      /\.local$/i,
      /^https?:\/\/www\.$/i,        // Incomplete www
      /^https?:\/\/http/i,          // Double protocol
      /\s/,                         // Contains spaces
      /[<>]/                        // Contains HTML characters
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(trimmedUrl)) {
        return {
          valid: false,
          error: 'INVALID_PATTERN',
          message: 'Invalid or example URL pattern detected',
          userMessage: 'Please enter a real website URL, not an example or test URL',
          shouldBlock: true
        };
      }
    }
    
    // Check for file extensions that won't work
    const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg|jpg|jpeg|png|gif|svg|mp4|mp3|avi)$/i;
    if (fileExtensions.test(urlObj.pathname)) {
      return {
        valid: false,
        error: 'FILE_URL',
        message: 'URL points to a file, not a webpage',
        userMessage: 'Please enter a website URL, not a direct link to a file',
        shouldBlock: true
      };
    }
    
    // Check for domains that actually block automated access (real ones)
    const realBlockingDomains = getRealBlockingDomains();
    const domain = urlObj.hostname.replace('www.', '').toLowerCase();
    
    for (const blockingDomain of realBlockingDomains) {
      if (domain === blockingDomain || domain.endsWith('.' + blockingDomain)) {
        return {
          valid: true,
          warning: true,
          error: 'KNOWN_BLOCKING_DOMAIN',
          message: `${domain} uses anti-bot protection that may prevent analysis`,
          userMessage: `Warning: ${domain} typically blocks automated analysis. The report may not work properly.`,
          shouldBlock: false,
          domain: domain
        };
      }
    }
    
    console.log('✅ URL validation passed:', {
      url: trimmedUrl,
      domain: domain,
      protocol: urlObj.protocol
    });
    
    return {
      valid: true,
      url: trimmedUrl,
      domain: domain,
      protocol: urlObj.protocol,
      shouldBlock: false
    };
    
  } catch (err) {
    console.error('❌ URL parsing failed:', err.message);
    return {
      valid: false,
      error: 'PARSE_ERROR',
      message: 'URL parsing failed',
      userMessage: 'Please enter a valid website URL (e.g., https://example.com)',
      shouldBlock: true,
      details: err.message
    };
  }
}

/**
 * Returns list of domains that actually implement anti-bot measures
 * Based on real-world testing and known Cloudflare/bot protection implementations
 */
function getRealBlockingDomains() {
  return [
    // Major e-commerce with heavy bot protection
    'amazon.com',
    'amazon.co.uk', 
    'amazon.de',
    'amazon.fr',
    'amazon.it',
    'amazon.es',
    'ebay.com',
    'etsy.com',
    'shopify.com',
    'myshopify.com',
    
    // Social media (all block scraping)
    'facebook.com',
    'instagram.com', 
    'twitter.com',
    'x.com',
    'linkedin.com',
    'youtube.com',
    'tiktok.com',
    'snapchat.com',
    'pinterest.com',
    
    // Streaming services
    'netflix.com',
    'hulu.com',
    'disney.com',
    'disneyplus.com',
    'spotify.com',
    
    // Financial services (heavy security)
    'paypal.com',
    'stripe.com',
    'square.com',
    'coinbase.com',
    'binance.com',
    
    // Major SaaS platforms with protection
    'salesforce.com',
    'hubspot.com',
    'zendesk.com',
    'intercom.com',
    
    // Google services (selective blocking)
    'accounts.google.com',
    'admin.google.com',
    'console.google.com',
    
    // Microsoft services
    'login.microsoftonline.com',
    'office.com',
    'outlook.com',
    
    // CDN and hosting that implement protection
    'cloudflare.com',
    'amazonaws.com',
    'herokuapp.com',
    'vercel.app',
    'netlify.app',
    
    // News sites with paywalls/protection
    'nytimes.com',
    'wsj.com',
    'ft.com',
    'bloomberg.com',
    
    // Government and sensitive sites
    'irs.gov',
    'uscis.gov',
    'gov.uk'
  ];
}

/**
 * Frontend-compatible URL validation with user-friendly messages
 * @param {string} url - The URL to validate
 * @param {HTMLElement} container - Container to show messages
 * @returns {Object} Validation result
 */
function validateUrlForFrontend(url, container) {
  console.log('🔍 Frontend URL validation:', url);
  
  // Clear previous messages
  if (container) {
    const existingMsg = container.querySelector('.url-validation-message');
    if (existingMsg) {
      existingMsg.remove();
    }
  }
  
  const validation = validateUrl(url);
  
  if (!validation.valid) {
    showUrlValidationMessage(validation, container);
    return { valid: false, shouldBlock: true };
  }
  
  // Show warning for problematic domains
  if (validation.warning) {
    showUrlValidationMessage(validation, container);
    return { valid: true, shouldBlock: false, url: validation.url, warning: true };
  }
  
  return { valid: true, shouldBlock: false, url: validation.url };
}

/**
 * Shows user-friendly URL validation messages
 * @param {Object} validation - Validation result
 * @param {HTMLElement} container - Container to show message in
 */
function showUrlValidationMessage(validation, container) {
  if (!container) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'url-validation-message';
  
  if (validation.warning) {
    messageDiv.innerHTML = `
      <div class="url-warning">
        <div class="warning-header">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Warning</strong>
        </div>
        <p>${validation.userMessage}</p>
        <div class="warning-actions">
          <button type="button" class="btn-continue" onclick="this.closest('.url-validation-message').remove()">
            Continue Anyway
          </button>
          <button type="button" class="btn-change" onclick="document.getElementById('urlInput').focus(); this.closest('.url-validation-message').remove()">
            Use Different URL
          </button>
        </div>
      </div>
    `;
  } else if (validation.suggestion) {
    messageDiv.innerHTML = `
      <div class="url-suggestion">
        <div class="suggestion-header">
          <i class="fas fa-lightbulb"></i>
          <strong>Did you mean?</strong>
        </div>
        <p>${validation.userMessage}</p>
        <div class="suggestion-actions">
          <button type="button" class="btn-use-suggestion" onclick="
            document.getElementById('urlInput').value = '${validation.suggestion}';
            this.closest('.url-validation-message').remove();
          ">
            Use ${validation.suggestion}
          </button>
          <button type="button" class="btn-keep-original" onclick="this.closest('.url-validation-message').remove()">
            Keep Original
          </button>
        </div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="url-error">
        <div class="error-header">
          <i class="fas fa-times-circle"></i>
          <strong>Invalid URL</strong>
        </div>
        <p>${validation.userMessage}</p>
      </div>
    `;
  }
  
  container.appendChild(messageDiv);
  addUrlValidationStyles();
  
  // Focus URL input for errors
  if (!validation.warning && !validation.suggestion) {
    setTimeout(() => {
      const urlInput = document.getElementById('urlInput');
      if (urlInput) urlInput.focus();
    }, 100);
  }
}

/**
 * Adds CSS styles for URL validation messages
 */
function addUrlValidationStyles() {
  if (document.getElementById('url-validation-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'url-validation-styles';
  styles.textContent = `
    .url-validation-message {
      margin: 1rem 0;
      animation: slideIn 0.3s ease-out;
    }
    
    .url-error, .url-warning, .url-suggestion {
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid;
    }
    
    .url-error {
      background: #fff5f5;
      border-color: #e53e3e;
      color: #742a2a;
    }
    
    .url-warning {
      background: #fffaf0;
      border-color: #dd6b20;
      color: #744210;
    }
    
    .url-suggestion {
      background: #f0f9ff;
      border-color: #3182ce;
      color: #1a365d;
    }
    
    .error-header, .warning-header, .suggestion-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    
    .error-header i { color: #e53e3e; }
    .warning-header i { color: #dd6b20; }
    .suggestion-header i { color: #3182ce; }
    
    .btn-continue, .btn-change, .btn-use-suggestion, .btn-keep-original {
      background: #4299e1;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-right: 0.5rem;
      transition: background 0.2s;
    }
    
    .btn-continue:hover, .btn-use-suggestion:hover {
      background: #3182ce;
    }
    
    .btn-change, .btn-keep-original {
      background: #718096;
    }
    
    .btn-change:hover, .btn-keep-original:hover {
      background: #4a5568;
    }
    
    .warning-actions, .suggestion-actions {
      margin-top: 0.75rem;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  
  document.head.appendChild(styles);
}