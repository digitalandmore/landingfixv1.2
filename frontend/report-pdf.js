// Email Report System for LandingFix AI - Production Version

// PRODUCTION: Main handler for email report generation
window.showPdfPopup = function() {
  try {
    // Check if dependencies are loaded
    if (typeof window.getReportData !== 'function') {
      console.error('❌ report-utils.js not loaded');
      showErrorMessage('System error: Dependencies not loaded. Please refresh the page.');
      return;
    }

    // Real-time unlock check
    const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    const unlockTimestamp = localStorage.getItem('landingfix_unlock_timestamp');
    
    console.log('📧 Email report popup called - UNLOCK CHECK:', {
      isUnlocked: isUnlocked,
      unlockTimestamp: unlockTimestamp,
      timeSinceUnlock: unlockTimestamp ? Date.now() - parseInt(unlockTimestamp) : null,
      timestamp: new Date().toISOString()
    });
    
    // Check if unlock is recent (within 24 hours)
    const isRecentUnlock = unlockTimestamp && (Date.now() - parseInt(unlockTimestamp)) < 24 * 60 * 60 * 1000;
    
    if (!isUnlocked || !isRecentUnlock) {
      console.log('🔒 Email report blocked - report not unlocked or unlock expired');
      showCheckoutForPdf();
      return;
    }
    
    console.log('✅ Report access verified - proceeding with email popup');
    showEmailPopup();
    
  } catch (error) {
    console.error('❌ Error in showPdfPopup:', error);
    showErrorMessage('An error occurred while opening the email system. Please try again.');
  }
};

// ENHANCED: Better error message display
function showErrorMessage(message) {
  if (typeof alert === 'function') {
    alert(message);
  } else {
    console.error('Error message:', message);
  }
}

// ENHANCED: Show checkout with better error handling
function showCheckoutForPdf() {
  try {
    if (typeof window.loadCheckoutPopup === 'function') {
      window.loadCheckoutPopup(() => {
        console.log('Checkout loaded from PDF popup block, opening...');
        if (typeof window.openCheckout === 'function') {
          window.openCheckout();
        } else {
          console.error('❌ openCheckout function not available from PDF block');
          showErrorMessage('Please unlock the report first to download PDF.');
        }
      });
    } else {
      console.error('❌ loadCheckoutPopup function not available from PDF block');
      showErrorMessage('Please unlock the report first to download PDF.');
    }
  } catch (error) {
    console.error('❌ Error showing checkout:', error);
    showErrorMessage('Please unlock the report first to download PDF.');
  }
}

// UPDATED: Show email popup instead of PDF popup
function showEmailPopup() {
  try {
    const existingPopup = document.getElementById('pdf-popup');
    if (existingPopup) {
      existingPopup.style.display = 'flex';
      populateEmailPreview();
      return;
    }

    showLoadingIndicator('Loading email system...');

    fetch('report-pdf.html')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.text();
      })
      .then(html => {
        hideLoadingIndicator();
        
        // Replace PDF references with Email references
        html = html.replace(/PDF/g, 'Email Report');
        html = html.replace(/pdf/g, 'email');
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        populateEmailPreview();
        setupEmailEventHandlers();
        
        const popup = document.getElementById('pdf-popup');
        if (popup) {
          popup.style.display = 'flex';
        }
      })
      .catch(err => {
        hideLoadingIndicator();
        console.error('Failed to load email popup:', err);
        showErrorMessage('Failed to load email system: ' + err.message);
      });
      
  } catch (error) {
    hideLoadingIndicator();
    console.error('❌ Error in showEmailPopup:', error);
    showErrorMessage('Failed to initialize email system. Please refresh the page.');
  }
}

// ENHANCED: Loading indicator functions
function showLoadingIndicator(message = 'Loading...') {
  let loader = document.getElementById('pdf-loading');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'pdf-loading';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: Arial, sans-serif;
    `;
    loader.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p style="margin: 0; color: #333; font-size: 16px;">${message}</p>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </div>
    `;
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

function hideLoadingIndicator() {
  const loader = document.getElementById('pdf-loading');
  if (loader) {
    loader.style.display = 'none';
  }
}

// FIXED: Get report data safely - removed infinite recursion
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

// FIXED: Get current scores safely - removed potential recursion
function getCurrentScores() {
  // Use global function if available, otherwise fallback to direct DOM access
  if (typeof window.getCurrentScores === 'function' && window.getCurrentScores !== getCurrentScores) {
    return window.getCurrentScores();
  }
  
  try {
    // FIXED: More comprehensive score extraction from multiple possible locations
    let optimization = '–';
    let impact = '–';
    let timing = '–';
    
    // Try main score elements first
    const mainScoreEl = document.getElementById('main-score-number');
    const mainImpactEl = document.getElementById('main-impact-number');
    const mainTimingEl = document.getElementById('main-timing');
    
    if (mainScoreEl) {
      optimization = mainScoreEl.textContent?.replace('%', '').trim() || '–';
    }
    
    if (mainImpactEl) {
      impact = mainImpactEl.textContent?.replace('%', '').replace('+', '').trim() || '–';
    }
    
    if (mainTimingEl) {
      timing = mainTimingEl.textContent?.trim() || '–';
    }
    
    // FIXED: Fallback to final summary scores if main scores not found
    if (optimization === '–') {
      const finalScoreEl = document.getElementById('final-score');
      if (finalScoreEl) {
        optimization = finalScoreEl.textContent?.replace('%', '').trim() || '–';
      }
    }
    
    if (impact === '–') {
      const finalImpactEl = document.getElementById('final-impact');
      if (finalImpactEl) {
        impact = finalImpactEl.textContent?.replace('%', '').replace('+', '').trim() || '–';
      }
    }
    
    if (timing === '–') {
      const finalTimingEl = document.getElementById('final-timing');
      if (finalTimingEl) {
        timing = finalTimingEl.textContent?.trim() || '–';
      }
    }
    
    // FIXED: Additional fallback - try to extract from any score display
    if (optimization === '–' || impact === '–' || timing === '–') {
      const allScoreElements = document.querySelectorAll('.score-number, .metric');
      allScoreElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.includes('%')) {
          if (optimization === '–' && !text.includes('+')) {
            optimization = text.replace('%', '').trim();
          } else if (impact === '–' && text.includes('+')) {
            impact = text.replace('%', '').replace('+', '').trim();
          }
        }
      });
    }
    
    const result = { optimization, impact, timing };
    console.log('📄 getCurrentScores extracted:', result);
    return result;
    
  } catch (error) {
    console.error('Error getting current scores:', error);
    return { optimization: '–', impact: '–', timing: '–' };
  }
}

// UPDATED: Populate email preview
function populateEmailPreview() {
  const reportData = getReportData();
  const scores = getCurrentScores();
  
  // Update URL
  const urlElement = document.getElementById('pdf-report-url');
  if (urlElement && reportData.url) {
    urlElement.textContent = reportData.url;
  }
  
  // Update scores
  const optElement = document.getElementById('pdf-opt-score');
  const impactElement = document.getElementById('pdf-impact-score');
  const timingElement = document.getElementById('pdf-timing');
  
  if (optElement) optElement.textContent = scores.optimization;
  if (impactElement) impactElement.textContent = scores.impact;
  if (timingElement) timingElement.textContent = scores.timing;
  
  // Pre-fill form with user data
  const nameInput = document.getElementById('pdf-name');
  const emailInput = document.getElementById('pdf-email');
  const companyInput = document.getElementById('pdf-company');
  
  if (nameInput && reportData.name) nameInput.value = reportData.name;
  if (emailInput && reportData.email) emailInput.value = reportData.email;
  if (companyInput && reportData.company) companyInput.value = reportData.company;
  
  // Update UI text for email instead of PDF
  const titleElements = document.querySelectorAll('.pdf-title, .popup-title');
  titleElements.forEach(el => {
    if (el.textContent.includes('PDF')) {
      el.textContent = el.textContent.replace('PDF', 'Email Report');
    }
  });
  
  // Show form
  const formDiv = document.getElementById('pdf-form');
  const lockedDiv = document.getElementById('pdf-locked-state');
  
  if (formDiv) formDiv.style.display = 'flex';
  if (lockedDiv) lockedDiv.style.display = 'none';
}

// UPDATED: Setup email event handlers
function setupEmailEventHandlers() {
  // Close button
  const closeBtn = document.getElementById('close-pdf-popup');
  if (closeBtn) {
    closeBtn.onclick = closeEmailPopup;
  }
  
  // Email form
  const emailForm = document.getElementById('pdf-form');
  if (emailForm) {
    emailForm.addEventListener('submit', handleEmailGeneration);
  }
  
  // Click outside to close
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        closeEmailPopup();
      }
    });
  }
}

// UPDATED: Handle email generation instead of PDF
async function handleEmailGeneration(e) {
  e.preventDefault();
  
  console.log('📧 Email report generation started');
  
  try {
    // Unlock validation
    const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    const unlockTimestamp = localStorage.getItem('landingfix_unlock_timestamp');
    const isRecentUnlock = unlockTimestamp && (Date.now() - parseInt(unlockTimestamp)) < 24 * 60 * 60 * 1000;
    
    if (!isUnlocked || !isRecentUnlock) {
      console.log('📧 Email generation blocked - invalid unlock status');
      showErrorMessage('Please unlock the report first to receive email report.');
      closeEmailPopup();
      showCheckoutForPdf();
      return;
    }
    
    // Form validation
    const formData = extractFormData();
    const validation = validateFormData(formData);
    
    if (!validation.isValid) {
      showFormErrors(validation.errors);
      return;
    }
    
    setLoadingState(true, 'Preparing your email report...');
    
    // Get report data
    const reportData = getReportData();
    const scores = getCurrentScores();
    
    if (!reportData || !reportData.url) {
      throw new Error('No valid report data found. Please refresh the page and try again.');
    }
    
    // Generate content for backend
    const emailContent = generateOptimizedEmailHTML(reportData, scores, formData);
    const emailTemplate = generateOptimizedEmailTemplate(reportData, scores, formData);
    
    // Prepare request
    const requestData = {
      url: reportData.url,
      name: formData.name || null,
      company: formData.company || null,
      email: formData.email,
      isPdfEmail: true,
      pdfContent: emailContent,
      htmlTemplate: emailTemplate,
      timestamp: new Date().toISOString()
    };
    
    // Send request
    const response = await sendEmailRequest(requestData);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Server error (${response.status}): ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📧 Email sent successfully');
      showEmailSuccess(formData.email, result);
      trackEmailGeneration(formData.email, reportData.url);
    } else {
      throw new Error('Email sending failed: ' + (result.error || 'Unknown error'));
    }
    
  } catch (error) {
    console.error('📧 Email generation failed:', error);
    showEmailError(error);
  } finally {
    setLoadingState(false);
  }
}

// ENHANCED: Extract and validate form data
function extractFormData() {
  return {
    email: document.getElementById('pdf-email')?.value?.trim() || '',
    name: document.getElementById('pdf-name')?.value?.trim() || '',
    company: document.getElementById('pdf-company')?.value?.trim() || ''
  };
}

function validateFormData(formData) {
  const errors = [];
  
  if (!formData.email) {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function showFormErrors(errors) {
  errors.forEach(error => {
    const field = document.getElementById(`pdf-${error.field}`);
    if (field) {
      field.style.borderColor = '#dc3545';
      field.focus();
      
      // Show error message
      let errorDiv = field.parentNode.querySelector('.error-message');
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 4px;';
        field.parentNode.appendChild(errorDiv);
      }
      errorDiv.textContent = error.message;
      
      // Clear error on input
      field.addEventListener('input', () => {
        field.style.borderColor = '';
        if (errorDiv) errorDiv.remove();
      }, { once: true });
    }
  });
}

// UPDATED: Loading state for email
function setLoadingState(isLoading, message = 'Processing...') {
  const submitBtn = document.getElementById('generate-pdf-btn');
  const submitText = document.getElementById('pdf-submit-text');
  
  if (submitBtn) {
    submitBtn.disabled = isLoading;
  }
  
  if (submitText) {
    if (isLoading) {
      submitText.innerHTML = `<i class="fa fa-spinner fa-spin"></i> ${message}`;
    } else {
      submitText.textContent = 'Send Email Report';
    }
  }
}

function updateLoadingMessage(message) {
  const submitText = document.getElementById('pdf-submit-text');
  if (submitText) {
    submitText.innerHTML = `<i class="fa fa-spinner fa-spin"></i> ${message}`;
  }
}

// UPDATED: Send email request
async function sendEmailRequest(requestData, maxRetries = 3) {
  const backendUrl = 'https://landingfixv1-2.onrender.com/api/send-report';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email request attempt ${attempt}/${maxRetries}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response;
      
    } catch (error) {
      console.error(`📧 Request attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// UPDATED: Error handling for email
function showEmailError(error) {
  let userMessage = 'Failed to generate and send email report. ';
  
  if (error.message.includes('timeout') || error.name === 'AbortError') {
    userMessage += 'The request timed out. Please check your internet connection and try again.';
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    userMessage += 'Network error. Please check your internet connection.';
  } else if (error.message.includes('500')) {
    userMessage += 'Server error. Please try again in a few moments.';
  } else if (error.message.includes('400')) {
    userMessage += 'Invalid request data. Please refresh the page and try again.';
  } else {
    userMessage += 'Please try again. Error: ' + error.message;
  }
  
  showErrorMessage(userMessage);
}

// UPDATED: Success handling for email
function showEmailSuccess(email, result) {
  const successDiv = document.getElementById('pdf-success');
  const formDiv = document.getElementById('pdf-form');
  const sentEmailSpan = document.getElementById('pdf-sent-email');
  
  if (successDiv && formDiv && sentEmailSpan) {
    formDiv.style.display = 'none';
    successDiv.style.display = 'block';
    sentEmailSpan.textContent = email;
    
    // Update success message for email
    const successMessage = successDiv.querySelector('p');
    if (successMessage) {
      successMessage.innerHTML = '✅ Your comprehensive analysis report has been sent to your email!<br><small>Check your inbox (and spam folder) for the detailed report.</small>';
    }
    
    // Add regeneration button
    addRegenerationButton(successDiv);
  }
}

function addRegenerationButton(successDiv) {
  const existingButton = successDiv.querySelector('.generate-another-btn');
  if (existingButton) return;
  
  const generateAnotherBtn = document.createElement('button');
  generateAnotherBtn.className = 'generate-another-btn';
  generateAnotherBtn.style.cssText = `
    margin-top: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    margin-right: 12px;
  `;
  generateAnotherBtn.innerHTML = '<i class="fa fa-envelope" style="margin-right: 8px;"></i>Send to Another Email';
  
  generateAnotherBtn.onclick = () => {
    const formDiv = document.getElementById('pdf-form');
    if (formDiv) {
      formDiv.style.display = 'flex';
      successDiv.style.display = 'none';
      
      // Clear the email field but keep name and company
      const emailInput = document.getElementById('pdf-email');
      if (emailInput) {
        emailInput.value = '';
        emailInput.focus();
      }
    }
  };
  
  // Insert before the close button
  const closeButton = successDiv.querySelector('button');
  if (closeButton) {
    successDiv.insertBefore(generateAnotherBtn, closeButton);
  } else {
    successDiv.appendChild(generateAnotherBtn);
  }
}

// UPDATED: Analytics tracking for email
function trackEmailGeneration(email, url) {
  try {
    if (typeof gtag === 'function') {
      gtag('event', 'email_report_download', {
        email: email,
        url: url,
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        content_name: 'Email Report Download',
        content_category: 'Landing Page Analysis'
      });
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

// UPDATED: Generate optimized email HTML content
function generateOptimizedEmailHTML(reportData, scores, formData) {
  const reportContent = extractAndProcessReportContent();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border-radius: 12px;">
        <h1 style="margin: 0; font-size: 28px;">🚀 Your LandingFix AI Analysis</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Complete optimization insights for ${reportData.url}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="text-align: center; margin-bottom: 20px;">Performance Overview</h3>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <div style="background: #3182ce; color: white; padding: 20px; border-radius: 10px; text-align: center; min-width: 150px;">
            <div style="font-size: 28px; font-weight: bold;">${scores.optimization || '–'}%</div>
            <div style="font-size: 12px;">Current Score</div>
          </div>
          <div style="background: #38a169; color: white; padding: 20px; border-radius: 10px; text-align: center; min-width: 150px;">
            <div style="font-size: 28px; font-weight: bold;">+${scores.impact || '–'}%</div>
            <div style="font-size: 12px;">Impact Potential</div>
          </div>
          <div style="background: #805ad5; color: white; padding: 20px; border-radius: 10px; text-align: center; min-width: 150px;">
            <div style="font-size: 24px; font-weight: bold;">${scores.timing || '–'}</div>
            <div style="font-size: 12px;">Implementation</div>
          </div>
        </div>
      </div>
      
      <div style="margin: 30px 0;">
        <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Detailed Analysis</h3>
        ${reportContent}
      </div>
    </div>
  `;
}

// UPDATED: Generate optimized email template
function generateOptimizedEmailTemplate(reportData, scores, formData) {
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your LandingFix AI Report</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#007bff,#0056b3);padding:40px 24px;text-align:center;color:white;">
          <h1 style="margin:0;font-size:28px;font-weight:700;">📊 Your Landing Page Analysis is Ready!</h1>
          <p style="margin:12px 0 0 0;font-size:16px;opacity:0.9;">Complete optimization insights for ${new URL(reportData.url).hostname}</p>
        </div>

        <!-- Content -->
        <div style="padding:32px 24px;">
          <h2 style="margin:0 0 20px 0;font-size:20px;color:#2d3748;">Report Summary</h2>
          
          <div style="background:#f8fafc;padding:20px;border-radius:8px;margin-bottom:24px;">
            <p style="margin:0 0 8px 0;"><strong>Website:</strong> ${reportData.url}</p>
            <p style="margin:0 0 8px 0;"><strong>Generated for:</strong> ${formData.name || 'LandingFix AI User'}</p>
            ${formData.company ? `<p style="margin:0 0 8px 0;"><strong>Company:</strong> ${formData.company}</p>` : ''}
            <p style="margin:0;"><strong>Date:</strong> ${now}</p>
          </div>

          <!-- Performance Overview -->
          <div style="margin-bottom:24px;">
            <h3 style="margin:0 0 20px 0;color:#2d3748;text-align:center;">Performance Overview</h3>
            
            <table style="width:100%;border-collapse:collapse;margin:0 auto;">
              <tr>
                <td style="text-align:center;padding:0 8px;">
                  <div style="background:#3182ce;color:white;padding:20px 16px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(49,130,206,0.3);">
                    <div style="font-size:32px;font-weight:bold;margin-bottom:8px;">${scores.optimization || '–'}%</div>
                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">Current Score</div>
                  </div>
                </td>
                <td style="text-align:center;padding:0 8px;">
                  <div style="background:#38a169;color:white;padding:20px 16px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(56,161,105,0.3);">
                    <div style="font-size:32px;font-weight:bold;margin-bottom:8px;">+${scores.impact || '–'}%</div>
                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">Impact Potential</div>
                  </div>
                </td>
                <td style="text-align:center;padding:0 8px;">
                  <div style="background:#805ad5;color:white;padding:20px 16px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(128,90,213,0.3);">
                    <div style="font-size:28px;font-weight:bold;margin-bottom:8px;">${scores.timing || '–'}</div>
                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">Implementation</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA Section -->
          <div style="background:#f0f8ff;padding:20px;border-radius:8px;border:2px solid #007bff;text-align:center;margin:24px 0;">
            <h3 style="margin:0 0 16px 0;color:#007bff;">🚀 Ready to Optimize Your Landing Page?</h3>
            <p style="margin:0 0 20px 0;color:#333;">Use this analysis to improve your conversion rates and grow your business.</p>
            <a href="https://landingfixai.com" style="display:inline-block;background:#007bff;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:600;">Get Another Analysis</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:24px;background:#2d3748;color:#a0aec0;text-align:center;">
          <p style="margin:0 0 16px 0;">Thank you for using LandingFix AI!</p>
          <a href="https://landingfixai.com" style="color:#667eea;text-decoration:none;">Visit our website</a>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

// NEW: Extract and process report content with enhanced metrics visualization
function extractAndProcessReportContent() {
  try {
    const reportContainer = document.getElementById('report-content');
    if (!reportContainer) {
      return '<p style="text-align: center; color: #6c757d; padding: 20px;">No report content available.</p>';
    }

    // Find all report categories
    const categories = reportContainer.querySelectorAll('.report-category');
    let emailContent = '';
    
    categories.forEach((category, index) => {
      if (category.classList.contains('locked')) return;
      
      const categoryName = category.querySelector('.category-name')?.textContent?.trim() || `Category ${index + 1}`;
      const categoryScore = category.querySelector('.cat-score')?.textContent?.trim() || '–';
      const categoryImpact = category.querySelector('.cat-impact')?.textContent?.trim() || '–';
      const categoryTiming = category.querySelector('.cat-timing')?.textContent?.trim() || '–';
      
      emailContent += `
        <div style="margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #f5f5f5; padding: 15px; border-bottom: 1px solid #ddd;">
            <h4 style="margin: 0; color: #333; font-size: 16px;">${categoryName}</h4>
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              Score: ${categoryScore}% | Impact: +${categoryImpact}% | Time: ${categoryTiming}
            </div>
          </div>
      `;
      
      const elements = category.querySelectorAll('.report-element');
      elements.forEach((element, elementIndex) => {
        const elementTitle = element.querySelector('.element-title')?.textContent?.trim() || `Element ${elementIndex + 1}`;
        emailContent += `
          <div style="padding: 15px; border-bottom: 1px solid #eee;">
            <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">${elementTitle}</h5>
        `;
        
        // Problem
        const problemBlock = element.querySelector('.problem');
        if (problemBlock) {
          const problemContent = problemBlock.querySelector('.block-content')?.textContent?.trim() || '';
          if (problemContent) {
            emailContent += `
              <div style="margin: 8px 0; padding: 10px; background: #ffebee; border-left: 4px solid #f44336; font-size: 13px;">
                <strong style="color: #d32f2f;">Problem:</strong> ${problemContent}
              </div>
            `;
          }
        }
        
        // Solution
        const solutionBlock = element.querySelector('.solution');
        if (solutionBlock) {
          const solutionContent = solutionBlock.querySelector('.block-content')?.textContent?.trim() || '';
          if (solutionContent) {
            emailContent += `
              <div style="margin: 8px 0; padding: 10px; background: #e8f5e8; border-left: 4px solid #4caf50; font-size: 13px;">
                <strong style="color: #388e3c;">Solution:</strong> ${solutionContent}
              </div>
            `;
          }
        }
        
        // Actions
        const actionsBlock = element.querySelector('.actions');
        if (actionsBlock) {
          const actionsList = actionsBlock.querySelectorAll('.actions-list li');
          if (actionsList.length > 0) {
            emailContent += `
              <div style="margin: 8px 0; padding: 10px; background: #fff3e0; border-left: 4px solid #ff9800; font-size: 13px;">
                <strong style="color: #f57c00;">Actions:</strong>
                <ul style="margin: 5px 0 0 20px; padding: 0;">
            `;
            actionsList.forEach(action => {
              const actionText = action.textContent?.trim() || '';
              if (actionText) {
                emailContent += `<li style="margin-bottom: 5px;">${actionText}</li>`;
              }
            });
            emailContent += `
                </ul>
              </div>
            `;
          }
        }
        emailContent += '</div>';
      });
      
      emailContent += '</div>';
    });
    
    return emailContent || '<p style="text-align: center; color: #6c757d; padding: 20px;">No unlocked content available.</p>';
    
  } catch (error) {
    console.error('Error extracting report content for email:', error);
    return '<p style="text-align: center; color: #dc3545; padding: 20px;">Error processing report content.</p>';
  }
}

// UPDATED: Close email popup
function closeEmailPopup() {
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

// Make globally accessible
window.closePdfPopup = closeEmailPopup;

console.log('✅ Email report system loaded successfully (Production Version)');
// UPDATED: Close email popup
function closeEmailPopup() {
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

// Make globally accessible
window.closePdfPopup = closeEmailPopup;

// HELPER: Improved error message display function
function showErrorMessage(message) {
  if (typeof alert === 'function') {
    alert(message);
  } else {
    console.error('Error message:', message);
  }
}

console.log('✅ Email report system loaded successfully (Production Version)');
            pdfContent += `
              <div class="pdf-element-metrics">
                <div class="pdf-element-metric pdf-metric-impact">
                  <div class="pdf-metric-label">Impact</div>
                  <div class="pdf-metric-value">+${impactScore}%</div>
                  <div class="pdf-metric-description">Improvement potential</div>
                </div>
                <div class="pdf-element-metric pdf-metric-timing">
                  <div class="pdf-metric-label">Implementation</div>
                  <div class="pdf-metric-value">${timingValue}</div>
                  <div class="pdf-metric-description">Estimated time</div>
                </div>
              </div>
            `;
          }
        }
        
        pdfContent += '</div>'; // Close element
      });
      
      pdfContent += '</div>'; // Close category
    });
    
    return pdfContent || '<p style="text-align: center; color: #6c757d; padding: 20px;">No unlocked content available for PDF generation.</p>';
    
  } catch (error) {
    console.error('Error extracting report content for PDF:', error);
    return '<p style="text-align: center; color: #dc3545; padding: 20px;">Error processing report content for PDF generation.</p>';
  }
}

// UPDATED: Close email popup
function closeEmailPopup() {
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

window.closePdfPopup = closeEmailPopup;

console.log('✅ Email report system loaded successfully (Production Version)');
          const actionsList = actionsBlock.querySelectorAll('.actions-list li');
          if (actionsList.length > 0) {
            let actionsHtml = '';
            actionsList.forEach(action => {
              const actionText = action.textContent?.trim() || '';
              if (actionText) {
                actionsHtml += `<li>${actionText}</li>`;
              }
            });
            
            if (actionsHtml) {
              pdfContent += `
                <div class="pdf-element-block pdf-actions-block">
                  <div class="pdf-block-label">Actions</div>
                  <div class="pdf-block-content">
                    <ul class="pdf-actions-list">
                      ${actionsHtml}
                    </ul>
                  </div>
                </div>
              `;
            }
          }
        }
        
        // ENHANCED: Extract and format metrics with professional design
        const metricsContainer = element.querySelector('.element-metrics');
        if (metricsContainer) {
          const metrics = metricsContainer.querySelectorAll('.metric');
          if (metrics.length > 0) {
            // Extract individual metric values from the text
            let impactScore = '–';
            let timingValue = '–';
            
            metrics.forEach(metric => {
              const metricText = metric.textContent?.trim() || '';
              // REMOVED: Optimization score extraction since it's not real data
              if (metricText.includes('Impact') || metricText.includes('+')) {
                const impactMatch = metricText.match(/\+(\d+)%/);
                if (impactMatch) impactScore = impactMatch[1];
              } else if (metricText.includes('min') || metricText.includes('hour') || metricText.includes('day')) {
                timingValue = metricText.replace(/.*:\s*/, '').trim();
              }
            });
            
            // FIXED: Generate enhanced metrics cards without optimization score
            pdfContent += `
              <div class="pdf-element-metrics">
                <div class="pdf-element-metric pdf-metric-impact">
                  <div class="pdf-metric-label">Impact</div>
                  <div class="pdf-metric-value">+${impactScore}%</div>
                  <div class="pdf-metric-description">Improvement potential</div>
                </div>
                <div class="pdf-element-metric pdf-metric-timing">
                  <div class="pdf-metric-label">Implementation</div>
                  <div class="pdf-metric-value">${timingValue}</div>
                  <div class="pdf-metric-description">Estimated time</div>
                </div>
              </div>
            `;
          }
        }
        
        pdfContent += '</div>'; // Close element
      });
      
      pdfContent += '</div>'; // Close category
    });
    
    return pdfContent || '<p style="text-align: center; color: #6c757d; padding: 20px;">No unlocked content available for PDF generation.</p>';
    
  } catch (error) {
    console.error('Error extracting report content for PDF:', error);
    return '<p style="text-align: center; color: #dc3545; padding: 20px;">Error processing report content for PDF generation.</p>';
  }
}

// UPDATED: Close email popup
function closeEmailPopup() {
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

// Make globally accessible
window.closePdfPopup = closeEmailPopup;

console.log('✅ Email report system loaded successfully (Production Version)');
      font-size: 12px;
      color: #666;
    }
    
    /* ELEMENTS - Clear content blocks */
    .pdf-element {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .pdf-element:last-child {
      border-bottom: none;
    }
    
    .pdf-element-title {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    
    /* ELEMENT BLOCKS - Distinct and readable */
    .pdf-element-block {
      margin-bottom: 12px;
      padding: 12px;
      border-left: 4px solid #ccc;
      background: #f9f9f9;
    }
    
    .pdf-site-text-block {
      border-left-color: #2196f3;
      background: #e3f2fd;
    }
    
    .pdf-problem-block {
      border-left-color: #f44336;
      background: #ffebee;
    }
    
    .pdf-solution-block {
      border-left-color: #4caf50;
      background: #e8f5e8;
    }
    
    .pdf-actions-block {
      border-left-color: #ff9800;
      background: #fff3e0;
    }
    
    .pdf-block-label {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .pdf-site-text-block .pdf-block-label { color: #1976d2; }
    .pdf-problem-block .pdf-block-label { color: #d32f2f; }
    .pdf-solution-block .pdf-block-label { color: #388e3c; }
    .pdf-actions-block .pdf-block-label { color: #f57c00; }
    
    .pdf-block-content {
      font-size: 13px;
      line-height: 1.4;
      color: #333;
    }
    
    .pdf-actions-list {
      margin: 0;
      padding-left: 18px;
    }
    
    .pdf-actions-list li {
      margin-bottom: 5px;
      font-size: 13px;
    }
    
    /* ENHANCED: Element metrics styling with better separation and design */
    .pdf-element-metrics {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .pdf-element-metric {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-width: 120px;
      flex: 1;
    }
    
    .pdf-metric-optimization {
      border-left: 4px solid #3182ce;
    }
    
    .pdf-metric-impact {
      border-left: 4px solid #38a169;
    }
    
    .pdf-metric-timing {
      border-left: 4px solid #805ad5;
    }
    
    .pdf-metric-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .pdf-metric-value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 2px;
    }
    
    .pdf-metric-optimization .pdf-metric-value { color: #3182ce; }
    .pdf-metric-impact .pdf-metric-value { color: #38a169; }
    .pdf-metric-timing .pdf-metric-value { color: #805ad5; }
    
    .pdf-metric-description {
      font-size: 9px;
      color: #666;
      line-height: 1.2;
    }
    
    /* PRINT OPTIMIZATIONS */
    @media print {
      body { margin: 0; padding: 10px; }
      .pdf-container { max-width: none; }
      .pdf-scores-table { page-break-inside: avoid; }
      .pdf-category { page-break-inside: avoid; }
      .pdf-element { page-break-inside: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      
      /* Logo print optimization */
      .pdf-logo { 
        width: 180px !important; 
        box-shadow: none !important; 
        border: 1px solid #ddd !important;
      }
      .footer-logo { 
        width: 120px !important; 
        box-shadow: none !important; 
        border: 1px solid #ddd !important;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    
    <!-- ENHANCED HEADER with logo -->
    <div class="pdf-header">
      <img src="https://landingfixai.com/images/logo-header.png" 
           alt="LandingFix AI" 
           class="pdf-logo"
           style="width: 200px; height: auto; margin-bottom: 20px; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block; margin-left: auto; margin-right: auto;" />
      <div class="pdf-title">LandingFix AI Analysis Report</div>
      <div class="pdf-subtitle">Professional Landing Page Optimization Analysis</div>
    </div>
    
    <!-- USER INFO -->
    <div class="pdf-info">
      <h3>Report Information</h3>
      <div class="pdf-info-row"><strong>Website:</strong> ${reportData.url}</div>
      <div class="pdf-info-row"><strong>Generated for:</strong> ${name || 'LandingFix AI User'}</div>
      <div class="pdf-info-row"><strong>Email:</strong> ${email}</div>
      ${company ? `<div class="pdf-info-row"><strong>Company:</strong> ${company}</div>` : ''}
      <div class="pdf-info-row"><strong>Analysis Focus:</strong> ${reportData.focus || 'General'}</div>
      <div class="pdf-info-row"><strong>Industry:</strong> ${reportData.industryName || reportData.industry || 'Not specified'}</div>
      <div class="pdf-info-row"><strong>Generated:</strong> ${now}</div>
    </div>
    
    <!-- FIXED: Enhanced scores section with colors and descriptions -->
    <div class="pdf-scores-section">
      <div class="pdf-scores-title">Performance Overview</div>
      <table class="pdf-scores-table">
        <thead>
          <tr>
            <th>Current Optimization</th>
            <th>Impact Potential</th>
            <th>Implementation Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="optimization-score">
              ${displayScores.optimization}%
              <div class="score-description">
                Current state of your<br>
                landing page optimization
              </div>
            </td>
            <td class="impact-score">
              +${displayScores.impact}%
              <div class="score-description">
                Potential improvement from<br>
                recommended changes
              </div>
            </td>
            <td class="timing-score">
              ${displayScores.timing}
              <div class="score-description">
                Estimated time to complete<br>
                all improvements
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- REPORT CONTENT -->
    <div class="pdf-content">
      <h2>Detailed Analysis</h2>
      ${reportContent}
    </div>
    
    <!-- ENHANCED FOOTER with logo -->
    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
      <img src="https://landingfixai.com/images/logo-header.png" 
           alt="LandingFix AI" 
           class="footer-logo"
           style="width: 140px; height: auto; margin-bottom: 16px; padding: 8px; background: white; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); display: block; margin-left: auto; margin-right: auto;" />
      <p style="margin-bottom: 8px;">Report generated by LandingFix AI - Professional Landing Page Analysis</p>
      <p>© 2025 LandingFix AI. All rights reserved.</p>
    </div>
    
  </div>
</body>
</html>
  `;
}

// NEW: Extract and process report content with enhanced metrics visualization
function extractAndProcessReportContent() {
  try {
    const reportContainer = document.getElementById('report-content');
    if (!reportContainer) {
      return '<p style="text-align: center; color: #6c757d; padding: 20px;">No report content available.</p>';
    }

    // Find all report categories
    const categories = reportContainer.querySelectorAll('.report-category');
    let pdfContent = '';
    
    categories.forEach((category, index) => {
      // Skip if this is a locked category
      if (category.classList.contains('locked')) {
        return;
      }
      
      // Extract category information
      const categoryName = category.querySelector('.category-name')?.textContent?.trim() || `Category ${index + 1}`;
      const categoryScore = category.querySelector('.cat-score')?.textContent?.trim() || '–';
      const categoryImpact = category.querySelector('.cat-impact')?.textContent?.trim() || '–';
      const categoryTiming = category.querySelector('.cat-timing')?.textContent?.trim() || '–';
      
      // Start category section
      pdfContent += `
        <div class="pdf-category">
          <div class="pdf-category-header">
            <div class="pdf-category-title">${categoryName}</div>
            <div class="pdf-category-metrics">
              <span class="pdf-metric">Score: ${categoryScore}%</span>
              <span class="pdf-metric">Impact: +${categoryImpact}%</span>
              <span class="pdf-metric">Time: ${categoryTiming}</span>
            </div>
          </div>
      `;
      
      // Extract elements within this category
      const elements = category.querySelectorAll('.report-element');
      
      elements.forEach((element, elementIndex) => {
        const elementTitle = element.querySelector('.element-title')?.textContent?.trim() || `Element ${elementIndex + 1}`;
        
        // Start element section
        pdfContent += `
          <div class="pdf-element">
            <div class="pdf-element-title">${elementTitle}</div>
        `;
        
        // Extract site text block
        const siteTextBlock = element.querySelector('.site-text-block');
        if (siteTextBlock) {
          const siteTextContent = siteTextBlock.querySelector('.block-content')?.textContent?.trim() || '';
          if (siteTextContent && siteTextContent !== 'Not found') {
            pdfContent += `
              <div class="pdf-element-block pdf-site-text-block">
                <div class="pdf-block-label">Current Text</div>
                <div class="pdf-block-content">${siteTextContent}</div>
              </div>
            `;
          }
        }
        
        // Extract problem block
        const problemBlock = element.querySelector('.problem');
        if (problemBlock) {
          const problemContent = problemBlock.querySelector('.block-content')?.textContent?.trim() || '';
          if (problemContent) {
            pdfContent += `
              <div class="pdf-element-block pdf-problem-block">
                <div class="pdf-block-label">Problem</div>
                <div class="pdf-block-content">${problemContent}</div>
              </div>
            `;
          }
        }
        
        // Extract solution block
        const solutionBlock = element.querySelector('.solution');
        if (solutionBlock) {
          const solutionContent = solutionBlock.querySelector('.block-content')?.textContent?.trim() || '';
          if (solutionContent) {
            pdfContent += `
              <div class="pdf-element-block pdf-solution-block">
                <div class="pdf-block-label">Solution</div>
                <div class="pdf-block-content">${solutionContent}</div>
              </div>
            `;
          }
        }
        
        // Extract actions block
        const actionsBlock = element.querySelector('.actions');
        if (actionsBlock) {
          const actionsList = actionsBlock.querySelectorAll('.actions-list li');
          if (actionsList.length > 0) {
            let actionsHtml = '';
            actionsList.forEach(action => {
              const actionText = action.textContent?.trim() || '';
              if (actionText) {
                actionsHtml += `<li>${actionText}</li>`;
              }
            });
            
            if (actionsHtml) {
              pdfContent += `
                <div class="pdf-element-block pdf-actions-block">
                  <div class="pdf-block-label">Actions</div>
                  <div class="pdf-block-content">
                    <ul class="pdf-actions-list">
                      ${actionsHtml}
                    </ul>
                  </div>
                </div>
              `;
            }
          }
        }
        
        // ENHANCED: Extract and format metrics with professional design
        const metricsContainer = element.querySelector('.element-metrics');
        if (metricsContainer) {
          const metrics = metricsContainer.querySelectorAll('.metric');
          if (metrics.length > 0) {
            // Extract individual metric values from the text
            let impactScore = '–';
            let timingValue = '–';
            
            metrics.forEach(metric => {
              const metricText = metric.textContent?.trim() || '';
              // REMOVED: Optimization score extraction since it's not real data
              if (metricText.includes('Impact') || metricText.includes('+')) {
                const impactMatch = metricText.match(/\+(\d+)%/);
                if (impactMatch) impactScore = impactMatch[1];
              } else if (metricText.includes('min') || metricText.includes('hour') || metricText.includes('day')) {
                timingValue = metricText.replace(/.*:\s*/, '').trim();
              }
            });
            
            // FIXED: Generate enhanced metrics cards without optimization score
            pdfContent += `
              <div class="pdf-element-metrics">
                <div class="pdf-element-metric pdf-metric-impact">
                  <div class="pdf-metric-label">Impact</div>
                  <div class="pdf-metric-value">+${impactScore}%</div>
                  <div class="pdf-metric-description">Improvement potential</div>
                </div>
                <div class="pdf-element-metric pdf-metric-timing">
                  <div class="pdf-metric-label">Implementation</div>
                  <div class="pdf-metric-value">${timingValue}</div>
                  <div class="pdf-metric-description">Estimated time</div>
                </div>
              </div>
            `;
          }
        }
        
        pdfContent += '</div>'; // Close element
      });
      
      pdfContent += '</div>'; // Close category
    });
    
    return pdfContent || '<p style="text-align: center; color: #6c757d; padding: 20px;">No unlocked content available for PDF generation.</p>';
    
  } catch (error) {
    console.error('Error extracting report content for PDF:', error);
    return '<p style="text-align: center; color: #dc3545; padding: 20px;">Error processing report content for PDF generation.</p>';
  }
}

// Close PDF popup
function closePdfPopup() {
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

// Make closePdfPopup globally accessible
window.closePdfPopup = closePdfPopup;

// FIXED: Show PDF success message with email-like interface
function showPdfSuccess(email, result) {
  const successDiv = document.getElementById('pdf-success');
  const formDiv = document.getElementById('pdf-form');
  const sentEmailSpan = document.getElementById('pdf-sent-email');
  
  if (successDiv && formDiv && sentEmailSpan) {
    formDiv.style.display = 'none';
    successDiv.style.display = 'block';
    sentEmailSpan.textContent = email;
    
    // ENHANCED: Show additional success info
    if (result.attachmentIncluded) {
      const attachmentInfo = successDiv.querySelector('.attachment-info');
      if (attachmentInfo) {
        attachmentInfo.style.display = 'block';
      }
    }
    
    // ENHANCED: Add regeneration button
    addRegenerationButton(successDiv);
  }
}

function addRegenerationButton(successDiv) {
  const existingButton = successDiv.querySelector('.generate-another-btn');
  if (existingButton) return;
  
  const generateAnotherBtn = document.createElement('button');
  generateAnotherBtn.className = 'generate-another-btn';
  generateAnotherBtn.style.cssText = `
    margin-top: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    margin-right: 12px;
  `;
  generateAnotherBtn.innerHTML = '<i class="fa fa-envelope" style="margin-right: 8px;"></i>Send to Another Email';
  
  generateAnotherBtn.onclick = () => {
    const formDiv = document.getElementById('pdf-form');
    if (formDiv) {
      formDiv.style.display = 'flex';
      successDiv.style.display = 'none';
      
      // Clear the email field but keep name and company
      const emailInput = document.getElementById('pdf-email');
      if (emailInput) {
        emailInput.value = '';
        emailInput.focus();
      }
    }
  };
  
  // Insert before the close button
  const closeButton = successDiv.querySelector('button');
  if (closeButton) {
    successDiv.insertBefore(generateAnotherBtn, closeButton);
  } else {
    successDiv.appendChild(generateAnotherBtn);
  }
}

// ENHANCED: Analytics tracking
function trackPdfGeneration(email, url) {
  try {
    if (typeof gtag === 'function') {
      gtag('event', 'pdf_download', {
        email: email,
        url: url,
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        content_name: 'PDF Report Download',
        content_category: 'Landing Page Analysis'
      });
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

console.log('✅ Enhanced PDF report system loaded successfully');
