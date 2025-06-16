// PDF Report System for LandingFix AI - Enhanced Version

// ENHANCED: Main PDF handler with better unlock checking and error handling
window.showPdfPopup = function() {
  try {
    // Check if dependencies are loaded
    if (typeof window.getReportData !== 'function') {
      console.error('❌ report-utils.js not loaded');
      showErrorMessage('System error: Dependencies not loaded. Please refresh the page.');
      return;
    }

    // ENHANCED: Real-time unlock check with validation
    const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    const unlockTimestamp = localStorage.getItem('landingfix_unlock_timestamp');
    
    console.log('📄 showPdfPopup called - ENHANCED UNLOCK CHECK:', {
      isUnlocked: isUnlocked,
      unlockTimestamp: unlockTimestamp,
      timeSinceUnlock: unlockTimestamp ? Date.now() - parseInt(unlockTimestamp) : null,
      timestamp: new Date().toISOString()
    });
    
    // ENHANCED: Check if unlock is recent (within 24 hours)
    const isRecentUnlock = unlockTimestamp && (Date.now() - parseInt(unlockTimestamp)) < 24 * 60 * 60 * 1000;
    
    if (!isUnlocked || !isRecentUnlock) {
      console.log('🔒 PDF access blocked - report not unlocked or unlock expired');
      showCheckoutForPdf();
      return;
    }
    
    console.log('✅ Report access verified - proceeding with PDF popup');
    showActualPdfPopup();
    
  } catch (error) {
    console.error('❌ Error in showPdfPopup:', error);
    showErrorMessage('An error occurred while opening the PDF system. Please try again.');
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

// ENHANCED: Show PDF popup with better loading and error handling
function showActualPdfPopup() {
  try {
    const existingPopup = document.getElementById('pdf-popup');
    if (existingPopup) {
      existingPopup.style.display = 'flex';
      populatePdfPreview();
      return;
    }

    // Show loading indicator
    showLoadingIndicator('Loading PDF system...');

    // Load the PDF popup HTML with timeout
    const fetchPromise = fetch('report-pdf.html');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout loading PDF system')), 10000)
    );

    Promise.race([fetchPromise, timeoutPromise])
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.text();
      })
      .then(html => {
        hideLoadingIndicator();
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Populate and setup the popup
        populatePdfPreview();
        setupPdfEventHandlers();
        
        // Show the popup with animation
        const popup = document.getElementById('pdf-popup');
        if (popup) {
          popup.style.display = 'flex';
          popup.style.opacity = '0';
          setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transition = 'opacity 0.3s ease';
          }, 10);
        }
      })
      .catch(err => {
        hideLoadingIndicator();
        console.error('Failed to load PDF popup:', err);
        showErrorMessage('Failed to load PDF system: ' + err.message);
      });
      
  } catch (error) {
    hideLoadingIndicator();
    console.error('❌ Error in showActualPdfPopup:', error);
    showErrorMessage('Failed to initialize PDF system. Please refresh the page.');
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

// Populate PDF preview
function populatePdfPreview() {
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
  
  // Show form (PDF system is always unlocked if we reach here)
  const formDiv = document.getElementById('pdf-form');
  const lockedDiv = document.getElementById('pdf-locked-state');
  
  if (formDiv) formDiv.style.display = 'flex';
  if (lockedDiv) lockedDiv.style.display = 'none';
}

// Setup PDF event handlers
function setupPdfEventHandlers() {
  // Close button
  const closeBtn = document.getElementById('close-pdf-popup');
  if (closeBtn) {
    closeBtn.onclick = closePdfPopup;
  }
  
  // PDF form
  const pdfForm = document.getElementById('pdf-form');
  if (pdfForm) {
    pdfForm.addEventListener('submit', handlePdfGeneration);
  }
  
  // Click outside to close
  const popup = document.getElementById('pdf-popup');
  if (popup) {
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        closePdfPopup();
      }
    });
  }
}

// FIXED: Enhanced PDF generation with better error handling and debugging
async function handlePdfGeneration(e) {
  e.preventDefault();
  
  console.log('📄 Enhanced PDF generation started');
  
  try {
    // ENHANCED: Comprehensive unlock validation
    const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    const unlockTimestamp = localStorage.getItem('landingfix_unlock_timestamp');
    const isRecentUnlock = unlockTimestamp && (Date.now() - parseInt(unlockTimestamp)) < 24 * 60 * 60 * 1000;
    
    console.log('📄 PDF generation - ENHANCED UNLOCK CHECK:', {
      isUnlocked,
      unlockTimestamp,
      isRecentUnlock,
      timeSinceUnlock: unlockTimestamp ? Date.now() - parseInt(unlockTimestamp) : null
    });
    
    if (!isUnlocked || !isRecentUnlock) {
      console.log('📄 PDF generation blocked - invalid unlock status');
      showErrorMessage('Please unlock the report first to download PDF.');
      closePdfPopup();
      showCheckoutForPdf();
      return;
    }
    
    // ENHANCED: Form validation with better UX
    const formData = extractFormData();
    const validation = validateFormData(formData);
    
    if (!validation.isValid) {
      showFormErrors(validation.errors);
      return;
    }
    
    // ENHANCED: Show loading state with progress
    setLoadingState(true, 'Preparing your PDF report...');
    
    console.log('📄 Form validation passed, generating PDF content...');
    
    // ENHANCED: Get report data with error handling
    const reportData = getReportData();
    const scores = getCurrentScores();
    
    if (!reportData || !reportData.url) {
      throw new Error('No valid report data found. Please refresh the page and try again.');
    }
    
    console.log('📄 Report data retrieved:', { 
      url: reportData.url, 
      hasData: !!reportData,
      scores: scores,
      dataSize: JSON.stringify(reportData).length
    });
    
    // ENHANCED: Generate optimized content for backend
    updateLoadingMessage('Generating PDF content...');
    const pdfContent = generateOptimizedPdfHTML(reportData, scores, formData);
    const emailTemplate = generateOptimizedEmailTemplate(reportData, scores, formData);
    
    console.log('📄 Content generated:', {
      pdfContentLength: pdfContent.length,
      emailTemplateLength: emailTemplate.length
    });
    
    // ENHANCED: Prepare request with validation
    const requestData = {
      url: reportData.url,
      name: formData.name || null,
      company: formData.company || null,
      email: formData.email,
      isPdfEmail: true,
      pdfContent: pdfContent,
      htmlTemplate: emailTemplate,
      timestamp: new Date().toISOString(),
      reportMetadata: {
        focus: reportData.focus || 'general',
        industry: reportData.industry || 'other',
        scores: scores
      }
    };
    
    console.log('📄 Sending enhanced request to backend:', {
      url: requestData.url,
      email: requestData.email,
      requestSize: JSON.stringify(requestData).length,
      hasPdfContent: !!requestData.pdfContent,
      hasEmailTemplate: !!requestData.htmlTemplate
    });
    
    // ENHANCED: Send request with retry logic
    updateLoadingMessage('Sending to email service...');
    const response = await sendPdfRequest(requestData);
    
    console.log('📄 Backend response received:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Server error (${response.status}): ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📄 PDF email sent successfully');
      showPdfSuccess(formData.email, result);
      
      // ENHANCED: Track success
      trackPdfGeneration(formData.email, reportData.url);
    } else {
      throw new Error('PDF email sending failed: ' + (result.error || 'Unknown error'));
    }
    
  } catch (error) {
    console.error('📄 Enhanced PDF generation failed:', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name
    });
    
    showPdfError(error);
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

// ENHANCED: Loading state management
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
      submitText.textContent = 'Send PDF Report via Email';
    }
  }
}

function updateLoadingMessage(message) {
  const submitText = document.getElementById('pdf-submit-text');
  if (submitText) {
    submitText.innerHTML = `<i class="fa fa-spinner fa-spin"></i> ${message}`;
  }
}

// ENHANCED: Send PDF request with retry logic
async function sendPdfRequest(requestData, maxRetries = 3) {
  const backendUrl = 'https://landingfixv1-2.onrender.com/api/send-report';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 PDF request attempt ${attempt}/${maxRetries}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
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
      console.error(`📄 Request attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// ENHANCED: Error handling with user-friendly messages
function showPdfError(error) {
  let userMessage = 'Failed to generate and send PDF report. ';
  
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

// ENHANCED: Success handling with better UX
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

// ENHANCED: Generate email template for PDF notification with better error handling
function generatePdfEmailTemplate(reportData, scores, email, name, company) {
  try {
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
  <title>Your LandingFix AI PDF Report</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc3545,#c82333);padding:40px 24px;text-align:center;color:white;">
      <h1 style="margin:0;font-size:28px;font-weight:700;">📄 Your PDF Report is Ready!</h1>
      <p style="margin:12px 0 0 0;font-size:16px;opacity:0.9;">Your complete LandingFix AI analysis as a professional PDF</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 24px;">
      <h2 style="margin:0 0 20px 0;font-size:20px;color:#2d3748;">Report Details</h2>
      
      <div style="background:#f8fafc;padding:20px;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 8px 0;"><strong>Website:</strong> ${reportData.url || 'Unknown'}</p>
        <p style="margin:0 0 8px 0;"><strong>Generated for:</strong> ${name || 'LandingFix AI User'}</p>
        ${company ? `<p style="margin:0 0 8px 0;"><strong>Company:</strong> ${company}</p>` : ''}
        <p style="margin:0;"><strong>Date:</strong> ${now}</p>
      </div>

      <!-- FIXED: Performance Overview con allineamento al centro e migliore spaziatura -->
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 20px 0;color:#2d3748;text-align:center;">Performance Overview</h3>
        
        <!-- FIXED: Tre card allineate al centro con spaziatura migliore -->
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

      <div style="background:#d4edda;padding:16px;border-radius:8px;border:1px solid #c3e6cb;text-align:center;">
        <p style="margin:0;color:#155724;">
          <strong>📎 PDF Report Attached</strong><br>
          Your complete analysis has been attached to this email as a PDF file.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px;background:#2d3748;color:#a0aec0;text-align:center;">
      <p style="margin:0 0 16px 0;">Thank you for using LandingFix AI!</p>
      <a href="https://landingfixai.com" style="color:#667eea;text-decoration:none;">Visit our website</a>
    </div>
    
  </div>
  
  <!-- Enhanced Mobile-Specific Styles -->
  <style>
    @media only screen and (max-width: 600px) {
      .performance-table { width: 100% !important; }
      .performance-table td { 
        display: block !important; 
        width: 100% !important; 
        padding: 8px 0 !important; 
        text-align: center !important; 
      }
      .performance-card { 
        margin-bottom: 12px !important; 
        padding: 16px !important; 
      }
    }
  </style>
</body>
</html>
    `;
  } catch (error) {
    console.error('Error generating PDF email template:', error);
    return `
      <html><body>
        <h1>LandingFix AI PDF Report</h1>
        <p>Your PDF report is attached to this email.</p>
        <p>Report for: ${reportData?.url || 'Unknown website'}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </body></html>
    `;
  }
}

// FIXED: Generate PDF-optimized HTML with simplified layout focused on content visibility
function generatePdfHTML(reportData, scores, email, name, company) {
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Get report content from DOM and process it for PDF
  const reportContent = extractAndProcessReportContent();
  
  // FIXED: Ensure scores are properly formatted and visible with color logic
  const displayScores = {
    optimization: scores.optimization && scores.optimization !== '–' ? scores.optimization : '0',
    impact: scores.impact && scores.impact !== '–' ? scores.impact : '0',
    timing: scores.timing && scores.timing !== '–' ? scores.timing : 'Not calculated'
  };
  
  // FIXED: Color logic for optimization score based on value
  const getOptimizationColor = (score) => {
    const numScore = parseInt(score) || 0;
    if (numScore >= 70) return '#28a745'; // Green
    if (numScore >= 40) return '#ffc107'; // Orange
    return '#dc3545'; // Red
  };
  
  const optimizationColor = getOptimizationColor(displayScores.optimization);
  
  console.log('📄 PDF Generation - Display scores:', displayScores);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LandingFix AI Report - ${reportData.url}</title>
  <style>
    /* SIMPLIFIED PDF styles focused on visibility and content */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.4;
      color: #333;
      background: white;
      padding: 20px;
    }
    
    .pdf-container { 
      max-width: 750px; 
      margin: 0 auto;
      background: white;
    }
    
    /* ENHANCED HEADER with logo - Simple and clear */
    .pdf-header { 
      text-align: center; 
      margin-bottom: 30px; 
      padding: 20px;
      border-bottom: 2px solid #0066cc;
      background: #ffffff;
    }
    
    .pdf-logo {
      width: 200px;
      height: auto;
      margin-bottom: 20px;
      padding: 10px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .pdf-title { 
      font-size: 24px; 
      font-weight: bold; 
      color: #333; 
      margin-bottom: 8px;
    }
    
    .pdf-subtitle { 
      font-size: 16px; 
      color: #666;
    }
    
    /* INFO SECTION - Clear layout */
    .pdf-info { 
      background: #f5f5f5; 
      padding: 20px; 
      margin-bottom: 25px;
      border: 1px solid #ddd;
    }
    
    .pdf-info h3 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #333;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    
    .pdf-info-row { 
      margin-bottom: 8px; 
      font-size: 14px;
    }
    
    .pdf-info strong { 
      display: inline-block;
      width: 120px;
      color: #333; 
    }
    
    /* SCORES SECTION - Simplified table layout for guaranteed visibility */
    .pdf-scores-section {
      margin-bottom: 30px;
    }
    
    .pdf-scores-title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 20px;
      color: #333;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    
    .pdf-scores-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .pdf-scores-table th {
      background: #0066cc;
      color: white;
      padding: 15px 10px;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
    }
    
    .pdf-scores-table td {
      padding: 20px 10px;
      text-align: center;
      border: 1px solid #ddd;
      font-size: 24px;
      font-weight: bold;
      color: #333;
      vertical-align: top;
    }
    
    .optimization-score { 
      background: #fff !important; 
      color: ${optimizationColor} !important; 
      border-left: 5px solid ${optimizationColor} !important;
    }
    .impact-score { 
      background: #fff !important; 
      color: #28a745 !important; 
      border-left: 5px solid #28a745 !important;
    }
    .timing-score { 
      background: #fff !important; 
      color: #007bff !important; 
      border-left: 5px solid #007bff !important;
    }
    
    .score-description {
      font-size: 12px;
      font-weight: normal;
      margin-top: 8px;
      line-height: 1.3;
      opacity: 0.8;
    }
    
    /* CONTENT SECTIONS - Clear hierarchy */
    .pdf-content {
      margin-top: 30px;
    }
    
    .pdf-content h2 {
      font-size: 18px;
      margin: 25px 0 15px 0;
      color: #333;
      border-bottom: 1px solid #0066cc;
      padding-bottom: 5px;
    }
    
    /* CATEGORIES - Simple and readable */
    .pdf-category {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      background: white;
    }
    
    .pdf-category-header {
      background: #f5f5f5;
      padding: 15px;
      border-bottom: 1px solid #ddd;
    }
    
    .pdf-category-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }
    
    .pdf-category-metrics {
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
