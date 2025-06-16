// Email Report System for LandingFix AI - Complete email management

// NEW: Main email handler with unlock checking and checkout fallback
window.showEmailPopup = function() {
  // Check if dependencies are loaded
  if (typeof window.getReportData !== 'function') {
    console.error('❌ report-utils.js not loaded');
    alert('System error: Dependencies not loaded. Please refresh the page.');
    return;
  }

  // FIXED: Real-time unlock check - always get fresh value from localStorage
  const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
  
  console.log('📧 showEmailPopup called - REAL-TIME UNLOCK CHECK:', {
    isUnlocked: isUnlocked,
    localStorage_value: localStorage.getItem('landingfix_unlocked'),
    timestamp: new Date().toISOString()
  });
  
  // FIXED: Immediate check without additional validation
  if (!isUnlocked) {
    console.log('🔒 Email popup blocked - report not unlocked, redirecting to checkout');
    showCheckoutForEmail();
    return; // Stop execution here
  }
  
  // Continue with email popup only if unlocked
  console.log('✅ Report is unlocked - proceeding with email popup');
  showActualEmailPopup();
};

// NEW: Show checkout when email is clicked but report is locked
function showCheckoutForEmail() {
  if (typeof window.loadCheckoutPopup === 'function') {
    window.loadCheckoutPopup(() => {
      console.log('Checkout loaded from email popup block, opening...');
      if (typeof window.openCheckout === 'function') {
        window.openCheckout();
      } else {
        console.error('❌ openCheckout function not available from email block');
        alert('Please unlock the report first to send via email.');
      }
    });
  } else {
    console.error('❌ loadCheckoutPopup function not available from email block');
    alert('Please unlock the report first to send via email.');
  }
}

// NEW: Actually show the email popup (moved from main function)
function showActualEmailPopup() {
  const existingPopup = document.getElementById('email-popup');
  if (existingPopup) {
    existingPopup.style.display = 'flex';
    return;
  }

  // Load the email popup HTML
  fetch('report-mail.html')
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      
      // Populate the popup with current data
      populateEmailPreview();
      
      // Setup event handlers
      setupEmailEventHandlers();
      
      // Show the popup
      const popup = document.getElementById('email-popup');
      if (popup) {
        popup.style.display = 'flex';
      }
    })
    .catch(err => {
      console.error('Failed to load email popup:', err);
      alert('Failed to load email system. Please refresh the page.');
    });
}

// FIXED: Get report data from localStorage - removed infinite recursion
function getReportData() {
  // Use global function if available, otherwise fallback to direct localStorage access
  if (typeof window.getReportData === 'function' && window.getReportData !== getReportData) {
    return window.getReportData();
  }
  
  // FIXED: Direct fallback without recursion
  try {
    const data = localStorage.getItem('landingfix_report_data');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error parsing report data from localStorage:', error);
    return {};
  }
}

// FIXED: Extract current scores from DOM - removed potential recursion
function getCurrentScores() {
  // Use global function if available, otherwise fallback to direct DOM access
  if (typeof window.getCurrentScores === 'function' && window.getCurrentScores !== getCurrentScores) {
    return window.getCurrentScores();
  }
  
  // FIXED: Direct fallback without recursion
  try {
    return {
      optimization: document.getElementById('main-score-number')?.textContent?.replace('%', '') || '–',
      impact: document.getElementById('main-impact-number')?.textContent?.replace('%', '') || '–',
      timing: document.getElementById('main-timing')?.textContent || '–'
    };
  } catch (error) {
    console.error('Error getting current scores:', error);
    return { optimization: '–', impact: '–', timing: '–' };
  }
}

// ENHANCED: Populate email preview with current data
function populateEmailPreview() {
  const reportData = getReportData();
  const scores = getCurrentScores();
  
  // Update URL
  const urlElement = document.getElementById('email-report-url');
  if (urlElement && reportData.url) {
    urlElement.textContent = reportData.url;
  }
  
  // Update scores
  const optElement = document.getElementById('email-opt-score');
  const impactElement = document.getElementById('email-impact-score');
  const timingElement = document.getElementById('email-timing');
  
  if (optElement) optElement.textContent = scores.optimization;
  if (impactElement) impactElement.textContent = scores.impact;
  if (timingElement) timingElement.textContent = scores.timing;
  
  // Pre-fill form with user data
  const nameInput = document.getElementById('sender-name');
  const emailInput = document.getElementById('email-address');
  const companyInput = document.getElementById('sender-company');
  
  if (nameInput && reportData.name) nameInput.value = reportData.name;
  if (emailInput && reportData.email) emailInput.value = reportData.email;
  if (companyInput && reportData.company) companyInput.value = reportData.company;
}

// Setup email event handlers
function setupEmailEventHandlers() {
  // Close button
  const closeBtn = document.getElementById('close-email-popup');
  if (closeBtn) {
    closeBtn.onclick = closeEmailPopup;
  }
  
  // Email form
  const emailForm = document.getElementById('email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', handleEmailSending);
  }
  
  // Click outside to close
  const popup = document.getElementById('email-popup');
  if (popup) {
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        closeEmailPopup();
      }
    });
  }
  
  // ESC to close
  const escHandler = function(e) {
    if (e.key === 'Escape') {
      closeEmailPopup();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// NEW: Generate optimized email template on frontend
function generateEmailTemplate(reportData, scores, reportHtml, email, name, company) {
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // NEW: Extract and process report content for email structure
  const processedReportContent = extractReportContentForEmail(reportHtml);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your LandingFix AI Report</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a202c;">
  
  <!-- Main Container -->
  <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);">
    
    <!-- Header Section -->
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 24px;text-align:center;color:white;">
      <img src="https://landingfixai.com/images/logo-header.png" alt="LandingFix AI" style="max-width:200px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto;" />
      <h1 style="margin:0;font-size:32px;font-weight:700;line-height:1.2;margin-bottom:12px;">Your AI Report is Ready! 🚀</h1>
      <p style="margin:0;font-size:18px;opacity:0.9;font-weight:400;">Complete landing page analysis with actionable insights</p>
    </div>

    <!-- User Info Section -->
    <div style="padding:24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#2d3748;">Report Details</h2>
      <div style="display:block;margin-bottom:12px;">
        <span style="display:inline-block;width:90px;font-weight:600;color:#4a5568;">Name:</span>
        <span style="color:#2d3748;">${name || 'Not provided'}</span>
      </div>
      ${company ? `
      <div style="display:block;margin-bottom:12px;">
        <span style="display:inline-block;width:90px;font-weight:600;color:#4a5568;">Company:</span>
        <span style="color:#2d3748;">${company}</span>
      </div>
      ` : ''}
      <div style="display:block;margin-bottom:12px;">
        <span style="display:inline-block;width:90px;font-weight:600;color:#4a5568;">Website:</span>
        <a href="${reportData.url}" style="color:#667eea;text-decoration:none;word-break:break-all;">${reportData.url}</a>
      </div>
      <div style="display:block;margin-bottom:12px;">
        <span style="display:inline-block;width:90px;font-weight:600;color:#4a5568;">Date:</span>
        <span style="color:#2d3748;">${now}</span>
      </div>
    </div>

    <!-- Enhanced Scores Section -->
    <div style="padding:32px 24px;background:white;">
      <h2 style="margin:0 0 24px 0;font-size:22px;font-weight:600;color:#2d3748;text-align:center;">Performance Overview</h2>
      
      <!-- Enhanced Score Cards -->
      <div style="margin-bottom:20px;">
        <!-- Current Optimization -->
        <div style="background:linear-gradient(135deg,#3182ce,#2c5282);color:white;padding:24px;border-radius:12px;text-align:center;margin-bottom:16px;box-shadow:0 4px 12px rgba(49,130,206,0.3);">
          <div style="font-size:14px;font-weight:600;opacity:0.9;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Current Optimization</div>
          <div style="font-size:48px;font-weight:700;margin-bottom:8px;">${scores.optimization}${scores.optimization !== '-' ? '%' : ''}</div>
          <div style="font-size:16px;opacity:0.9;line-height:1.4;">Current state of your landing page optimization</div>
        </div>
        
        <!-- Impact Potential -->
        <div style="background:linear-gradient(135deg,#38a169,#2f855a);color:white;padding:24px;border-radius:12px;text-align:center;margin-bottom:16px;box-shadow:0 4px 12px rgba(56,161,105,0.3);">
          <div style="font-size:14px;font-weight:600;opacity:0.9;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Impact Potential</div>
          <div style="font-size:48px;font-weight:700;margin-bottom:8px;">+${scores.impact}${scores.impact !== '-' ? '%' : ''}</div>
          <div style="font-size:16px;opacity:0.9;line-height:1.4;">Potential improvement from recommended changes</div>
        </div>
        
        <!-- Implementation Time -->
        <div style="background:linear-gradient(135deg,#805ad5,#6b46c1);color:white;padding:24px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(128,90,213,0.3);">
          <div style="font-size:14px;font-weight:600;opacity:0.9;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Implementation Time</div>
          <div style="font-size:40px;font-weight:700;margin-bottom:8px;">${scores.timing}</div>
          <div style="font-size:16px;opacity:0.9;line-height:1.4;">Estimated time to complete all improvements</div>
        </div>
      </div>
    </div>

    <!-- Enhanced Report Content Section -->
    <div style="padding:0;background:white;">
      <div style="padding:32px 24px 24px 24px;">
        <h2 style="margin:0 0 24px 0;font-size:22px;font-weight:600;color:#2d3748;text-align:center;">Detailed Analysis Report</h2>
      </div>
      
      <!-- Processed Report Content with Enhanced Structure -->
      <div style="padding:0 24px 32px 24px;">
        ${processedReportContent}
      </div>
    </div>

    <!-- Call to Action Section -->
    <div style="padding:40px 24px;background:#f7fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <h3 style="margin:0 0 16px 0;font-size:24px;font-weight:600;color:#2d3748;">Love LandingFix AI?</h3>
      <p style="margin:0 0 24px 0;color:#4a5568;font-size:16px;">Help us grow by leaving a review on Product Hunt!</p>
      <a href="https://www.producthunt.com/products/landingfix-ai-1-0/reviews/new" 
         style="display:inline-block;background:linear-gradient(135deg,#ff6154,#ff4757);color:white;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:600;font-size:18px;box-shadow:0 6px 16px rgba(255,97,84,0.3);transition:all 0.3s ease;">
        ⭐ Leave a Review
      </a>
    </div>

    <!-- Footer Section -->
    <div style="padding:32px 24px;background:#f8fafc;color:#4a5568;text-align:center;font-size:14px;">
      <div style="margin-bottom:20px;">
        <img src="https://landingfixai.com/images/logo-header.png" alt="LandingFix AI" style="max-width:160px;height:auto;margin-bottom:16px;" />
        <p style="margin:0 0 16px 0;font-size:16px;">Need help implementing these recommendations?</p>
        <a href="mailto:support@landingfixai.com" style="color:#667eea;text-decoration:none;font-weight:500;">Contact our support team →</a>
        
        <!-- FIXED: Corretto menu con struttura table per email HTML -->
        <div style="margin:24px 0;padding:16px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
          <table style="width:100%;margin:0;padding:0;border-collapse:collapse;">
            <tr>
              <td style="text-align:center;padding:0;">
                <table style="margin:0 auto;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 20px;text-align:center;">
                      <a href="https://landingfixai.com" 
                         style="color:#667eea;text-decoration:underline;font-weight:600;font-size:16px;display:inline-block;">
                        Website
                      </a>
                    </td>
                    <td style="padding:8px 20px;text-align:center;">
                      <a href="mailto:support@landingfixai.com" 
                         style="color:#667eea;text-decoration:underline;font-weight:600;font-size:16px;display:inline-block;">
                        Support
                      </a>
                    </td>
                    <td style="padding:8px 20px;text-align:center;">
                      <a href="https://www.producthunt.com/products/landingfix-ai-1-0" 
                         style="color:#667eea;text-decoration:underline;font-weight:600;font-size:16px;display:inline-block;">
                        Product Hunt
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </div>
      
      <div style="color:#6b7280;font-size:13px;line-height:1.5;">
        <p style="margin:0 0 8px 0;">This report was generated by LandingFix AI based on your landing page analysis.</p>
        <p style="margin:0;">&copy; 2025 LandingFix AI. All rights reserved.</p>
      </div>
    </div>
    
  </div>

  <!-- Enhanced Mobile-Specific Styles -->
  <style>
    @media only screen and (max-width: 700px) {
      .container { width: 100% !important; margin: 0 !important; }
      .header { padding: 32px 16px !important; }
      .content { padding: 20px 16px !important; }
      .score-card { margin-bottom: 12px !important; padding: 20px !important; }
      .score-number { font-size: 40px !important; }
      .cta-button { padding: 14px 28px !important; font-size: 16px !important; }
      
      /* Enhanced report content mobile optimization */
      .email-category { margin-bottom: 20px !important; }
      .email-category-header { padding: 16px !important; }
      .email-element { padding: 16px !important; margin-bottom: 16px !important; }
      .email-element-block { padding: 12px !important; margin-bottom: 12px !important; }
      .email-element-title { font-size: 18px !important; }
      .email-block-label { font-size: 12px !important; }
      .email-actions-list { padding-left: 16px !important; }
      .email-actions-list li { font-size: 14px !important; margin-bottom: 8px !important; }
      
      /* Force responsive tables */
      table { width: 100% !important; }
      td { display: block !important; width: 100% !important; padding: 6px 0 !important; }
      
      /* FIXED: Menu mobile responsive */
      .menu-table { width: 100% !important; }
      .menu-table td { 
        display: block !important; 
        width: 100% !important; 
        padding: 8px 0 !important; 
        text-align: center !important; 
      }
      .menu-table a { 
        display: block !important; 
        padding: 12px 0 !important; 
        font-size: 16px !important; 
      }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-container { background: #1a202c !important; }
      .content-section { background: #2d3748 !important; color: #e2e8f0 !important; }
    }
  </style>

</body>
</html>
`;
}

// NEW: Extract and process report content for email with enhanced structure
function extractReportContentForEmail(reportHtml) {
  if (!reportHtml) return '<p style="color:#6c757d;text-align:center;padding:20px;">No report content available.</p>';
  
  try {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = reportHtml;
    
    // Find all report categories
    const categories = tempDiv.querySelectorAll('.report-category');
    let emailContent = '';
    
    categories.forEach((category, index) => {
      const categoryName = category.querySelector('.category-name')?.textContent || `Category ${index + 1}`;
      const categoryScore = category.querySelector('.cat-score')?.textContent || '–';
      const categoryImpact = category.querySelector('.cat-impact')?.textContent || '–';
      const categoryTiming = category.querySelector('.cat-timing')?.textContent || '–';
      
      // Category Header with enhanced styling
      emailContent += `
        <div class="email-category" style="margin-bottom:32px;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);border:1px solid #e2e8f0;">
          <div class="email-category-header" style="background:linear-gradient(135deg,#f8fafc,#e2e8f0);padding:20px;border-bottom:1px solid #e2e8f0;">
            <h3 style="margin:0 0 12px 0;font-size:20px;font-weight:600;color:#2d3748;">${categoryName}</h3>
            <div style="display:flex;gap:20px;flex-wrap:wrap;">
              <span style="font-size:14px;color:#4a5568;"><strong>Score:</strong> ${categoryScore}%</span>
              <span style="font-size:14px;color:#4a5568;"><strong>Impact:</strong> +${categoryImpact}%</span>
              <span style="font-size:14px;color:#4a5568;"><strong>Time:</strong> ${categoryTiming}</span>
            </div>
          </div>
      `;
      
      // Find elements within this category
      const elements = category.querySelectorAll('.report-element');
      
      elements.forEach((element, elementIndex) => {
        const elementTitle = element.querySelector('.element-title')?.textContent || `Element ${elementIndex + 1}`;
        
        // Extract site text if available
        const siteTextBlock = element.querySelector('.site-text-block');
        let siteTextContent = '';
        if (siteTextBlock) {
          const siteTextLabel = siteTextBlock.querySelector('.block-label')?.textContent || 'Text';
          const siteTextValue = siteTextBlock.querySelector('.site-text-value')?.textContent || '';
          if (siteTextValue) {
            siteTextContent = `
              <div class="email-element-block" style="background:#f3f7ff;border-left:4px solid #3b82f6;padding:16px;margin-bottom:16px;border-radius:8px;">
                <div class="email-block-label" style="font-size:12px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${siteTextLabel}</div>
                <div style="color:#1e40af;font-weight:500;font-size:15px;line-height:1.4;">${siteTextValue}</div>
              </div>
            `;
          }
        }
        
        // Extract problem
        const problemText = element.querySelector('.problem-text')?.textContent || 'No problem identified';
        const problemContent = `
          <div class="email-element-block" style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin-bottom:16px;border-radius:8px;">
            <div class="email-block-label" style="font-size:12px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Problem</div>
            <div style="color:#991b1b;font-size:15px;line-height:1.5;">${problemText}</div>
          </div>
        `;
        
        // Extract solution
        const solutionText = element.querySelector('.solution-text')?.textContent || 'No solution provided';
        const solutionContent = `
          <div class="email-element-block" style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin-bottom:16px;border-radius:8px;">
            <div class="email-block-label" style="font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Solution</div>
            <div style="color:#15803d;font-size:15px;line-height:1.5;">${solutionText}</div>
          </div>
        `;
        
        // Extract actions
        const actionsList = element.querySelectorAll('.actions-list li');
        let actionsContent = '';
        if (actionsList.length > 0) {
          let actionsHtml = '';
          actionsList.forEach(action => {
            const actionText = action.textContent || action.innerHTML || '';
            if (actionText.trim()) {
              actionsHtml += `<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:1.5;">${actionText}</li>`;
            }
          });
          
          if (actionsHtml) {
            actionsContent = `
              <div class="email-element-block" style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;margin-bottom:16px;border-radius:8px;">
                <div class="email-block-label" style="font-size:12px;font-weight:600;color:#d97706;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Actions</div>
                <ul class="email-actions-list" style="margin:0;padding-left:20px;color:#92400e;">
                  ${actionsHtml}
                </ul>
              </div>
            `;
          }
        }
        
        // Extract metrics
        const impactMetric = element.querySelector('.element-metrics .metric')?.textContent || '';
        let metricsContent = '';
        if (impactMetric) {
          metricsContent = `
            <div style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;text-align:center;">
              <span style="font-size:14px;font-weight:600;color:#4a5568;">${impactMetric}</span>
            </div>
          `;
        }
        
        // Combine element content
        emailContent += `
          <div class="email-element" style="padding:24px;border-bottom:1px solid #f1f5f9;">
            <h4 class="email-element-title" style="margin:0 0 20px 0;font-size:18px;font-weight:600;color:#1a202c;">${elementTitle}</h4>
            ${siteTextContent}
            ${problemContent}
            ${solutionContent}
            ${actionsContent}
            ${metricsContent}
          </div>
        `;
      });
      
      emailContent += '</div>'; // Close category div
    });
    
    return emailContent || '<p style="color:#6c757d;text-align:center;padding:20px;">Report content could not be processed.</p>';
    
  } catch (error) {
    console.error('Error processing report content for email:', error);
    return '<p style="color:#dc3545;text-align:center;padding:20px;">Error processing report content.</p>';
  }
}

// FIXED: Simplified email sending validation
async function handleEmailSending(e) {
  e.preventDefault();
  
  // FIXED: Simple unlock check
  const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
  
  console.log('📧 Email sending - UNLOCK CHECK:', {
    isUnlocked: isUnlocked
  });
  
  if (!isUnlocked) {
    console.log('📧 Email sending blocked - report not unlocked');
    alert('Please unlock the report first to send via email.');
    closeEmailPopup();
    showCheckoutForEmail();
    return;
  }
  
  // Get form data with explicit field extraction
  const emailInput = document.getElementById('email-address');
  const nameInput = document.getElementById('sender-name');
  const companyInput = document.getElementById('sender-company');
  
  const email = emailInput?.value?.trim();
  const name = nameInput?.value?.trim();
  const company = companyInput?.value?.trim();
  
  // Validate email
  if (!email) {
    alert('Please enter your email address.');
    emailInput?.focus();
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    alert('Please enter a valid email address.');
    emailInput?.focus();
    return;
  }
  
  console.log('📧 Form data extracted:', { email, name, company });
  
  // Get report data and scores using helper functions
  const reportData = getReportData();
  const scores = getCurrentScores();
  
  // Get report HTML content
  const reportHtml = document.getElementById('report-content')?.innerHTML || '';
  
  // Generate email template on frontend
  const emailTemplate = generateEmailTemplate(reportData, scores, reportHtml, email, name, company);
  
  const submitBtn = document.getElementById('send-email-btn');
  const submitText = document.getElementById('send-btn-text');
  const originalText = submitText?.textContent || 'Send Report to Email';
  
  try {
    // Show loading state
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Sending...';
    
    const requestData = {
      url: reportData.url,
      name: name || null,
      company: company || null,
      email: email,
      htmlTemplate: emailTemplate
    };
    
    console.log('📧 Sending email request with generated template');
    
    // Send email
    const response = await fetch('http://localhost:3002/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('📧 Email send error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Show success message
      showEmailSuccess(email);
      
      // Track email send
      if (typeof gtag === 'function') {
        gtag('event', 'email_send', {
          email: email
        });
      }
    } else {
      throw new Error('Email sending failed');
    }
    
  } catch (error) {
    console.error('Email sending failed:', error);
    alert('Failed to send email. Please try again.');
  } finally {
    // Reset button state
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = originalText;
  }
}

// Show email success message
function showEmailSuccess(email) {
  const successDiv = document.getElementById('email-success');
  const formDiv = document.getElementById('email-form');
  const sentEmailSpan = document.getElementById('sent-email');
  
  if (successDiv && formDiv && sentEmailSpan) {
    formDiv.style.display = 'none';
    successDiv.style.display = 'block';
    sentEmailSpan.textContent = email;
    
    // FIXED: Add "Send Another Email" button after success
    const existingButton = successDiv.querySelector('.send-another-btn');
    if (!existingButton) {
      const sendAnotherBtn = document.createElement('button');
      sendAnotherBtn.className = 'send-another-btn';
      sendAnotherBtn.style.cssText = `
        margin-top: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        margin-right: 12px;
      `;
      sendAnotherBtn.innerHTML = '<i class="fa fa-envelope" style="margin-right: 8px;"></i>Send to Another Email';
      
      sendAnotherBtn.onclick = () => {
        // Reset form and show it again
        formDiv.style.display = 'flex';
        successDiv.style.display = 'none';
        
        // Clear the email field but keep name and company
        const emailInput = document.getElementById('email-address');
        if (emailInput) {
          emailInput.value = '';
          emailInput.focus();
        }
      };
      
      // Insert before the close button
      const closeButton = successDiv.querySelector('button');
      if (closeButton) {
        successDiv.insertBefore(sendAnotherBtn, closeButton);
      } else {
        successDiv.appendChild(sendAnotherBtn);
      }
    }
  }
}

// Close email popup
function closeEmailPopup() {
  const popup = document.getElementById('email-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

// Make closeEmailPopup globally accessible
window.closeEmailPopup = closeEmailPopup;

console.log('✅ Email report system loaded successfully with enhanced functionality');
