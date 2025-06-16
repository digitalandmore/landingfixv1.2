// Domain Blocking Detection System for LandingFix AI
// Detects when websites block our analysis and provides structured responses

/**
 * Checks if a site is blocked based on error messages and URL patterns
 * @param {string} errorMessage - The error message from fetch attempt
 * @param {string} url - The URL being analyzed
 * @returns {Object} Blocking detection result
 */
function checkIfSiteBlocked(errorMessage, url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Known blocking patterns in error messages
    const blockingIndicators = [
      'cloudflare',
      'access denied',
      'forbidden',
      'blocked',
      'robot',
      'captcha',
      'security check',
      'just a moment',
      'checking your browser',
      'unauthorized',
      'bot protection',
      'anti-bot',
      'timeout',
      'connection refused',
      'too many requests',
      'rate limit',
      'ddos protection',
      'challenge',
      'verification'
    ];
    
    const errorLower = errorMessage.toLowerCase();
    const hasBlockingIndicator = blockingIndicators.some(indicator => 
      errorLower.includes(indicator)
    );
    
    // Known problematic domains that typically block bots
    const problematicDomains = [
      'zara.com',
      'amazon.com',
      'nike.com',
      'adidas.com',
      'apple.com',
      'netflix.com',
      'spotify.com',
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'linkedin.com',
      'youtube.com',
      'shopify.com',
      'squarespace.com',
      'wix.com',
      'wordpress.com',
      'cloudflare.com',
      'shopify.dev',
      'myshopify.com'
    ];
    
    const isProblematicDomain = problematicDomains.some(pd => domain.includes(pd));
    
    if (hasBlockingIndicator || isProblematicDomain) {
      return {
        blocked: true,
        domain: domain,
        reason: hasBlockingIndicator ? 'anti_bot_protection' : 'problematic_domain',
        details: {
          errorMessage: errorMessage,
          foundIndicators: blockingIndicators.filter(indicator => errorLower.includes(indicator)),
          isKnownProblematic: isProblematicDomain,
          suggestedAction: isProblematicDomain ? 'try_different_site' : 'check_site_settings',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    return { blocked: false };
    
  } catch (err) {
    console.error('Error in checkIfSiteBlocked:', err);
    return { blocked: false };
  }
}

/**
 * Checks HTML content for blocking indicators
 * @param {string} html - The HTML content to analyze
 * @param {string} url - The original URL
 * @returns {Object} HTML blocking detection result
 */
function checkHtmlForBlocking(html, url) {
  try {
    if (!html || html.length < 100) {
      return { blocked: false };
    }
    
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    const htmlLower = html.toLowerCase();
    
    // Blocking indicators in HTML content
    const contentBlockingIndicators = [
      'cloudflare',
      'just a moment',
      'checking your browser',
      'please enable javascript',
      'access denied',
      'this website is using a security service',
      'ddos protection',
      'bot protection',
      'captcha',
      'ray id:',
      'performance & security by cloudflare',
      'attention required',
      'please complete the security check',
      'browser integrity check',
      'security challenge',
      'verify you are human',
      'anti-robot verification'
    ];
    
    const foundIndicators = contentBlockingIndicators.filter(indicator => 
      htmlLower.includes(indicator)
    );
    
    if (foundIndicators.length > 0) {
      return {
        blocked: true,
        domain: domain,
        reason: 'blocking_page_detected',
        details: {
          foundIndicators: foundIndicators,
          contentLength: html.length,
          suggestedAction: 'site_has_protection',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Check if HTML is suspiciously short for a real page
    if (html.length < 500 && !html.includes('<title>') && !html.includes('<h1')) {
      return {
        blocked: true,
        domain: domain,
        reason: 'insufficient_content',
        details: {
          contentLength: html.length,
          suggestedAction: 'check_url_accessibility',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Check for redirect loops or error pages
    const errorPageIndicators = [
      '404',
      'page not found',
      'not found',
      'error 404',
      'error 403',
      'forbidden',
      'server error',
      'internal server error',
      '500 error'
    ];
    
    const hasErrorIndicator = errorPageIndicators.some(indicator => 
      htmlLower.includes(indicator)
    );
    
    if (hasErrorIndicator) {
      return {
        blocked: true,
        domain: domain,
        reason: 'error_page_detected',
        details: {
          foundErrors: errorPageIndicators.filter(indicator => htmlLower.includes(indicator)),
          contentLength: html.length,
          suggestedAction: 'check_url_validity',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    return { blocked: false };
    
  } catch (err) {
    console.error('Error in checkHtmlForBlocking:', err);
    return { blocked: false };
  }
}

/**
 * Generates user-friendly message data for blocked sites
 * @param {Object} blockData - The blocking detection data
 * @returns {Object} Structured message data for frontend
 */
function generateBlockedSiteResponse(blockData) {
  const { domain, reason, details } = blockData;
  
  const messageTemplates = {
    anti_bot_protection: {
      title: "Site Protected by Anti-Bot Systems",
      message: `The website ${domain} uses advanced protection systems that prevent automatic analysis.`,
      explanation: "Many large company websites use services like Cloudflare to protect their servers from automated traffic. This is common for large e-commerce sites and major brands.",
      solutions: [
        "Try analyzing a different landing page without anti-bot protection",
        "If you own this site, consider temporarily disabling protection for analysis",
        "Use a test or staging version of your landing page without protections",
        "Try a less protected page from your site (e.g., blog or informational pages)"
      ],
      actionText: "Analyze Another Landing Page",
      actionUrl: "https://landingfixai.com/#analyze-section"
    },
    
    problematic_domain: {
      title: "Domain with Access Restrictions",
      message: `${domain} is configured to block automatic analysis tools.`,
      explanation: "Some domains implement very restrictive security policies that prevent any automated access, even for analysis purposes.",
      solutions: [
        "Try another landing page from your digital ecosystem",
        "If you have other domains or subdomains, use those for analysis",
        "Contact your hosting provider about anti-bot policies",
        "Consider creating a test version of your landing page"
      ],
      actionText: "Try Different Landing Page",
      actionUrl: "https://landingfixai.com/#analyze-section"
    },
    
    blocking_page_detected: {
      title: "Security Verification Page Detected",
      message: `${domain} is showing a security check page instead of normal content.`,
      explanation: "The site has redirected our request to a security verification page instead of showing the normal landing page content.",
      solutions: [
        "Try again in a few minutes - this might be a temporary check",
        "Verify that the URL is correct and points exactly to your landing page",
        "If you own the site, check your security settings",
        "Try accessing the page in a normal browser to verify it works"
      ],
      actionText: "Analyze Different Page",
      actionUrl: "https://landingfixai.com/#analyze-section"
    },
    
    insufficient_content: {
      title: "Insufficient Content for Analysis",
      message: `The provided URL doesn't return adequate content for complete analysis.`,
      explanation: "The page appears to be empty, not fully loaded, or might be an error page.",
      solutions: [
        "Verify that the URL is correct and complete (including https://)",
        "Check that the page loads normally in your browser",
        "Try a different URL from the same landing page",
        "Make sure the page doesn't require login or authentication"
      ],
      actionText: "Try Different URL",
      actionUrl: "https://landingfixai.com/#analyze-section"
    },
    
    error_page_detected: {
      title: "Error Page Detected",
      message: `The URL appears to be returning an error page (404, 403, 500, etc.).`,
      explanation: "The website is returning an error page instead of the expected landing page content.",
      solutions: [
        "Double-check that the URL is correct and complete",
        "Verify the page exists and is publicly accessible",
        "Try the homepage or a different page from the same site",
        "Contact the site owner if you believe this is an error"
      ],
      actionText: "Try Different Page",
      actionUrl: "https://landingfixai.com/#analyze-section"
    }
  };
  
  const messageData = messageTemplates[reason] || messageTemplates.anti_bot_protection;
  
  return {
    error: 'SITE_BLOCKED',
    blockedSite: true,
    domain: domain,
    reason: reason,
    ...messageData,
    technicalDetails: details || {},
    timestamp: new Date().toISOString(),
    supportEmail: 'support@landingfixai.com'
  };
}

/**
 * Gets a human-readable description of the block type
 * @param {string} reason - The blocking reason
 * @returns {string} Human-readable description
 */
function getBlockTypeDescription(reason) {
  const descriptions = {
    anti_bot_protection: "Anti-Bot Protection (Cloudflare, etc.)",
    problematic_domain: "Domain with Restrictions",
    blocking_page_detected: "Security Verification Page",
    insufficient_content: "Insufficient Content",
    error_page_detected: "Error Page (404, 403, 500)"
  };
  return descriptions[reason] || "Unknown Block Type";
}

/**
 * Checks if a domain is known to be problematic
 * @param {string} url - The URL to check
 * @returns {boolean} True if domain is known to be problematic
 */
function isKnownProblematicDomain(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    const problematicDomains = [
      'zara.com', 'amazon.com', 'nike.com', 'adidas.com', 'apple.com',
      'netflix.com', 'spotify.com', 'facebook.com', 'instagram.com',
      'twitter.com', 'linkedin.com', 'youtube.com', 'shopify.com',
      'squarespace.com', 'wix.com', 'wordpress.com'
    ];
    
    return problematicDomains.some(pd => domain.includes(pd));
  } catch (err) {
    return false;
  }
}

/**
 * Main function to check if a site is blocked and generate appropriate response
 * @param {string} errorMessage - Error from fetch attempt
 * @param {string} html - HTML content (if any)
 * @param {string} url - Original URL
 * @returns {Object|null} Blocking response or null if not blocked
 */
function checkSiteBlocking(errorMessage, html, url) {
  // First check error message
  const errorCheck = checkIfSiteBlocked(errorMessage, url);
  if (errorCheck.blocked) {
    return generateBlockedSiteResponse(errorCheck);
  }
  
  // Then check HTML content if available
  if (html) {
    const htmlCheck = checkHtmlForBlocking(html, url);
    if (htmlCheck.blocked) {
      return generateBlockedSiteResponse(htmlCheck);
    }
  }
  
  return null; // Not blocked
}

module.exports = {
  checkIfSiteBlocked,
  checkHtmlForBlocking,
  generateBlockedSiteResponse,
  getBlockTypeDescription,
  isKnownProblematicDomain,
  checkSiteBlocking
};