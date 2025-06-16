// PDF Report System for LandingFix AI

// NEW: Main PDF handler with unlock checking
window.showPdfPopup = function() {
  // Check if dependencies are loaded
  if (typeof window.getReportData !== 'function') {
    console.error('❌ report-utils.js not loaded');
    alert('System error: Dependencies not loaded. Please refresh the page.');
    return;
  }

  // 🚨 CRITICAL: Real-time unlock check
  const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
  
  console.log('📄 showPdfPopup called - REAL-TIME UNLOCK CHECK:', {
    isUnlocked: isUnlocked,
    localStorage_value: localStorage.getItem('landingfix_unlocked'),
    timestamp: new Date().toISOString()
  });
  
  // FIXED: Immediate check without additional validation
  if (!isUnlocked) {
    console.log('🔒 PDF popup blocked - report not unlocked, redirecting to checkout');
    showCheckoutForPdf();
    return; // Stop execution here
  }
  
  // Continue with PDF popup only if unlocked
  console.log('✅ Report is unlocked - proceeding with PDF popup');
  showActualPdfPopup();
};

// NEW: Show checkout when PDF is clicked but report is locked
function showCheckoutForPdf() {
  if (typeof window.loadCheckoutPopup === 'function') {
    window.loadCheckoutPopup(() => {
      console.log('Checkout loaded from PDF popup block, opening...');
      if (typeof window.openCheckout === 'function') {
        window.openCheckout();
      } else {
        console.error('❌ openCheckout function not available from PDF block');
        alert('Please unlock the report first to download PDF.');
      }
    });
  } else {
    console.error('❌ loadCheckoutPopup function not available from PDF block');
    alert('Please unlock the report first to download PDF.');
  }
}

// NEW: Actually show the PDF popup
function showActualPdfPopup() {
  const existingPopup = document.getElementById('pdf-popup');
  if (existingPopup) {
    existingPopup.style.display = 'flex';
    return;
  }

  // Load the PDF popup HTML
  fetch('report-pdf.html')
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      
      // Populate the popup with current data
      populatePdfPreview();
      
      // Setup event handlers
      setupPdfEventHandlers();
      
      // Show the popup
      const popup = document.getElementById('pdf-popup');
      if (popup) {
        popup.style.display = 'flex';
      }
    })
    .catch(err => {
      console.error('Failed to load PDF popup:', err);
      alert('Failed to load PDF system. Please refresh the page.');
    });
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
  
  console.log('📄 PDF generation started');
  
  // Check unlock status
  const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
  
  if (!isUnlocked) {
    console.log('📄 PDF generation blocked - report not unlocked');
    alert('Please unlock the report first to download PDF.');
    closePdfPopup();
    showCheckoutForPdf();
    return;
  }
  
  // Get form data
  const emailInput = document.getElementById('pdf-email');
  const nameInput = document.getElementById('pdf-name');
  const companyInput = document.getElementById('pdf-company');
  
  const email = emailInput?.value?.trim();
  const name = nameInput?.value?.trim();
  const company = companyInput?.value?.trim();
  
  // Validate email
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    emailInput?.focus();
    return;
  }
  
  const submitBtn = document.getElementById('generate-pdf-btn');
  const submitText = document.getElementById('pdf-submit-text');
  const originalText = submitText?.textContent || 'Send PDF Report via Email';
  
  try {
    // Show loading state
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating and sending...';
    
    // Get report data
    const reportData = getReportData();
    const scores = getCurrentScores();
    
    if (!reportData || !reportData.url) {
      throw new Error('No valid report data found. Please refresh the page and try again.');
    }
    
    // FIXED: Generate optimized content with size limits
    console.log('📄 Generating optimized PDF content...');
    
    // Generate lightweight content instead of full HTML
    const lightweightContent = generateLightweightReportContent(reportData, scores);
    const emailTemplate = generateOptimizedEmailTemplate(reportData, scores, email, name, company);
    
    // FIXED: Simplified request payload with size limits
    const requestData = {
      url: reportData.url,
      name: name || null,
      company: company || null,
      email: email,
      isPdfEmail: true,
      pdfContent: lightweightContent, // Much smaller content
      htmlTemplate: emailTemplate.substring(0, 50000) // Limit to 50KB
    };
    
    console.log('📄 Sending optimized request to backend:', {
      url: requestData.url,
      email: requestData.email,
      contentSize: requestData.pdfContent?.length || 0,
      templateSize: requestData.htmlTemplate?.length || 0
    });
    
    const response = await fetch('https://landingfixv1-2.onrender.com/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('📄 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('📄 Server error:', errorText);
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📄 PDF sent successfully');
      showPdfSuccess(email);
      
      // Track success
      if (typeof gtag === 'function') {
        gtag('event', 'pdf_download', { email: email });
      }
    } else {
      throw new Error(result.error || 'Unknown error occurred');
    }
    
  } catch (error) {
    console.error('📄 PDF generation failed:', error);
    
    let errorMessage = 'Failed to generate and send PDF report. ';
    
    if (error.message.includes('fetch')) {
      errorMessage += 'Please check your internet connection and try again.';
    } else if (error.message.includes('Server error (500)')) {
      errorMessage += 'The server is experiencing issues. Please try again in a few moments.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Request timed out. Please try again.';
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
  } finally {
    // Reset button
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = originalText;
  }
}

// FIXED: Generate lightweight report content
function generateLightweightReportContent(reportData, scores) {
  try {
    const reportContainer = document.getElementById('report-content');
    if (!reportContainer) {
      return '<p>No report content available.</p>';
    }

    // Extract only essential information
    const categories = reportContainer.querySelectorAll('.report-category');
    let content = '';
    
    categories.forEach((category, index) => {
      if (category.classList.contains('locked')) return;
      
      const categoryName = category.querySelector('.category-name')?.textContent?.trim() || `Category ${index + 1}`;
      const elements = category.querySelectorAll('.report-element');
      
      content += `<h3>${categoryName}</h3>`;
      
      elements.forEach((element, elementIndex) => {
        const elementTitle = element.querySelector('.element-title')?.textContent?.trim() || `Element ${elementIndex + 1}`;
        const problemContent = element.querySelector('.problem .block-content')?.textContent?.trim() || '';
        const solutionContent = element.querySelector('.solution .block-content')?.textContent?.trim() || '';
        
        if (problemContent || solutionContent) {
          content += `<h4>${elementTitle}</h4>`;
          if (problemContent) content += `<p><strong>Issue:</strong> ${problemContent.substring(0, 200)}...</p>`;
          if (solutionContent) content += `<p><strong>Solution:</strong> ${solutionContent.substring(0, 200)}...</p>`;
        }
      });
    });
    
    return content.substring(0, 10000); // Limit to 10KB
    
  } catch (error) {
    console.error('Error generating lightweight content:', error);
    return '<p>Error processing report content.</p>';
  }
}

// FIXED: Generate optimized email template
function generateOptimizedEmailTemplate(reportData, scores, email, name, company) {
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
  <title>Your LandingFix AI Report</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333;">📄 Your LandingFix AI Report</h1>
    <p style="color: #666;">Professional Landing Page Analysis</p>
  </div>

  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Report Details</h2>
    <p><strong>Website:</strong> ${reportData.url || 'Unknown'}</p>
    <p><strong>Generated for:</strong> ${name || 'LandingFix AI User'}</p>
    ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
    <p><strong>Date:</strong> ${now}</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="text-align: center; color: #333;">Performance Summary</h3>
    <div style="display: flex; justify-content: space-around; text-align: center;">
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; flex: 1; margin: 0 5px;">
        <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${scores.optimization || '–'}%</div>
        <div style="font-size: 12px; color: #666;">Current Score</div>
      </div>
      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; flex: 1; margin: 0 5px;">
        <div style="font-size: 24px; font-weight: bold; color: #388e3c;">+${scores.impact || '–'}%</div>
        <div style="font-size: 12px; color: #666;">Impact Potential</div>
      </div>
      <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; flex: 1; margin: 0 5px;">
        <div style="font-size: 20px; font-weight: bold; color: #7b1fa2;">${scores.timing || '–'}</div>
        <div style="font-size: 12px; color: #666;">Implementation</div>
      </div>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; background: #e8f4fd; border-radius: 8px;">
    <p><strong>Your complete report with detailed recommendations has been processed!</strong></p>
    <p>Visit <a href="https://landingfixai.com" style="color: #007bff; text-decoration: none;">LandingFix AI</a> for more analysis tools.</p>
  </div>

  <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
    <p>Thank you for using LandingFix AI!</p>
    <p>© 2025 LandingFix AI. All rights reserved.</p>
  </div>

</body>
</html>
  `;
}

// FIXED: Generate PDF-optimized HTML with proper report structure extraction
function generatePdfHTML(reportData, scores, email, name, company) {
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Get actual report content from DOM
  const reportContent = extractActualReportContent();
  
  // FIXED: Ensure scores are properly formatted
  const displayScores = {
    optimization: scores.optimization && scores.optimization !== '–' ? scores.optimization : '0',
    impact: scores.impact && scores.impact !== '–' ? scores.impact : '0',
    timing: scores.timing && scores.timing !== '–' ? scores.timing : 'Not calculated'
  };
  
  const getOptimizationColor = (score) => {
    const numScore = parseInt(score) || 0;
    if (numScore >= 70) return '#28a745';
    if (numScore >= 40) return '#ffc107';
    return '#dc3545';
  };
  
  const optimizationColor = getOptimizationColor(displayScores.optimization);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LandingFix AI Report - ${reportData.url}</title>
  <style>
    /* PDF styles optimized for actual report structure */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #2d3748;
      background: white;
      padding: 20px;
    }
    
    .pdf-container { 
      max-width: 800px; 
      margin: 0 auto;
      background: white;
    }
    
    .pdf-header { 
      text-align: center; 
      margin-bottom: 40px; 
      padding: 30px;
      border-bottom: 3px solid #667eea;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-radius: 12px 12px 0 0;
    }
    
    .pdf-logo {
      width: 200px;
      height: auto;
      margin-bottom: 20px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .pdf-title { 
      font-size: 28px; 
      font-weight: 700; 
      color: #2d3748; 
      margin-bottom: 8px;
    }
    
    .pdf-subtitle { 
      font-size: 16px; 
      color: #718096;
      font-weight: 500;
    }
    
    .pdf-info { 
      background: #f7fafc; 
      padding: 24px; 
      margin-bottom: 30px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    
    .pdf-info h3 {
      font-size: 18px;
      margin-bottom: 16px;
      color: #2d3748;
      font-weight: 600;
    }
    
    .pdf-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .pdf-info-row { 
      margin-bottom: 8px; 
      font-size: 14px;
      line-height: 1.4;
    }
    
    .pdf-info strong { 
      color: #4a5568; 
      font-weight: 600;
    }
    
    .pdf-scores-section {
      margin-bottom: 40px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .pdf-scores-title {
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 24px;
      color: #2d3748;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 0;
    }
    
    .pdf-scores-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0;
    }
    
    .pdf-score-card {
      padding: 30px 20px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
      background: #f7fafc;
    }
    
    .pdf-score-card:last-child {
      border-right: none;
    }
    
    .pdf-score-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      line-height: 1;
    }
    
    .pdf-score-label {
      font-size: 14px;
      color: #718096;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .pdf-score-description {
      font-size: 12px;
      color: #a0aec0;
      line-height: 1.3;
    }
    
    .optimization-score .pdf-score-value { color: ${optimizationColor}; }
    .impact-score .pdf-score-value { color: #48bb78; }
    .timing-score .pdf-score-value { color: #805ad5; }
    
    .pdf-content {
      margin-top: 40px;
    }
    
    .pdf-section-title {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .pdf-category {
      margin-bottom: 40px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    
    .pdf-category-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
    }
    
    .pdf-category-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .pdf-category-metrics {
      font-size: 14px;
      opacity: 0.9;
      display: flex;
      gap: 20px;
    }
    
    .pdf-element {
      padding: 24px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .pdf-element:last-child {
      border-bottom: none;
    }
    
    .pdf-element-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .pdf-element-content {
      display: grid;
      gap: 16px;
    }
    
    .pdf-content-block {
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #cbd5e0;
    }
    
    .pdf-current-text {
      background: #ebf8ff;
      border-left-color: #3182ce;
    }
    
    .pdf-problem {
      background: #fed7d7;
      border-left-color: #e53e3e;
    }
    
    .pdf-solution {
      background: #c6f6d5;
      border-left-color: #38a169;
    }
    
    .pdf-actions {
      background: #feebc8;
      border-left-color: #dd6b20;
    }
    
    .pdf-block-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      opacity: 0.8;
    }
    
    .pdf-block-content {
      font-size: 14px;
      line-height: 1.6;
      color: #4a5568;
    }
    
    .pdf-actions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .pdf-actions-list li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .pdf-actions-list li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #dd6b20;
      font-weight: bold;
    }
    
    .pdf-element-metrics {
      margin-top: 20px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .pdf-metric-item {
      text-align: center;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    
    .pdf-metric-value {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .pdf-metric-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .pdf-footer {
      margin-top: 60px;
      text-align: center;
      padding: 30px 20px;
      border-top: 2px solid #e2e8f0;
      background: #f7fafc;
      border-radius: 12px;
    }
    
    .footer-logo {
      width: 120px;
      height: auto;
      margin-bottom: 16px;
    }
    
    .pdf-footer-text {
      font-size: 14px;
      color: #718096;
      line-height: 1.5;
    }
    
    /* Print optimizations */
    @media print {
      body { margin: 0; padding: 10px; }
      .pdf-container { max-width: none; }
      .pdf-category { page-break-inside: avoid; }
      .pdf-element { page-break-inside: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    
    <div class="pdf-header">
      <img src="https://landingfixai.com/images/logo-header.png" 
           alt="LandingFix AI" 
           class="pdf-logo" />
      <div class="pdf-title">LandingFix AI Analysis Report</div>
      <div class="pdf-subtitle">Professional Landing Page Optimization Analysis</div>
    </div>
    
    <div class="pdf-info">
      <h3>Report Details</h3>
      <div class="pdf-info-grid">
        <div class="pdf-info-row"><strong>Website:</strong> ${reportData.url}</div>
        <div class="pdf-info-row"><strong>Generated for:</strong> ${name || 'LandingFix AI User'}</div>
        <div class="pdf-info-row"><strong>Email:</strong> ${email}</div>
        ${company ? `<div class="pdf-info-row"><strong>Company:</strong> ${company}</div>` : ''}
        <div class="pdf-info-row"><strong>Focus:</strong> ${reportData.focus || 'General'}</div>
        <div class="pdf-info-row"><strong>Industry:</strong> ${reportData.industryName || reportData.industry || 'Not specified'}</div>
        <div class="pdf-info-row" style="grid-column: 1 / 3;"><strong>Generated:</strong> ${now}</div>
      </div>
    </div>
    
    <div class="pdf-scores-section">
      <div class="pdf-scores-title">Performance Overview</div>
      <div class="pdf-scores-grid">
        <div class="pdf-score-card optimization-score">
          <div class="pdf-score-label">Current Score</div>
          <div class="pdf-score-value">${displayScores.optimization}%</div>
          <div class="pdf-score-description">Current optimization level</div>
        </div>
        <div class="pdf-score-card impact-score">
          <div class="pdf-score-label">Impact Potential</div>
          <div class="pdf-score-value">+${displayScores.impact}%</div>
          <div class="pdf-score-description">Improvement opportunity</div>
        </div>
        <div class="pdf-score-card timing-score">
          <div class="pdf-score-label">Implementation</div>
          <div class="pdf-score-value">${displayScores.timing}</div>
          <div class="pdf-score-description">Estimated time needed</div>
        </div>
      </div>
    </div>
    
    <div class="pdf-content">
      <div class="pdf-section-title">Detailed Analysis & Recommendations</div>
      ${reportContent}
    </div>
    
    <div class="pdf-footer">
      <img src="https://landingfixai.com/images/logo-header.png" 
           alt="LandingFix AI" 
           class="footer-logo" />
      <div class="pdf-footer-text">
        <p><strong>Report generated by LandingFix AI</strong></p>
        <p>Professional Landing Page Optimization Analysis</p>
        <p>© 2025 LandingFix AI. All rights reserved.</p>
      </div>
    </div>
    
  </div>
</body>
</html>
  `;
}

// FIXED: Extract actual report content with proper structure matching
function extractActualReportContent() {
  try {
    const reportContainer = document.getElementById('report-content');
    if (!reportContainer) {
      return '<div class="pdf-no-content">No report content available for PDF generation.</div>';
    }

    // Find all categories that are not locked
    const categories = reportContainer.querySelectorAll('.report-category:not(.locked)');
    let pdfContent = '';
    
    if (categories.length === 0) {
      return '<div class="pdf-no-content">No unlocked content available. Please unlock the report first.</div>';
    }
    
    categories.forEach((category, categoryIndex) => {
      // Extract category information
      const categoryNameEl = category.querySelector('.category-name, .category-title, h2, h3');
      const categoryName = categoryNameEl?.textContent?.trim() || `Analysis Category ${categoryIndex + 1}`;
      
      // Extract category metrics
      const scoreEl = category.querySelector('.cat-score, .category-score, .score');
      const impactEl = category.querySelector('.cat-impact, .category-impact, .impact');
      const timingEl = category.querySelector('.cat-timing, .category-timing, .timing');
      
      const categoryScore = scoreEl?.textContent?.replace('%', '').trim() || '–';
      const categoryImpact = impactEl?.textContent?.replace('%', '').replace('+', '').trim() || '–';
      const categoryTiming = timingEl?.textContent?.trim() || '–';
      
      // Start category section
      pdfContent += `
        <div class="pdf-category">
          <div class="pdf-category-header">
            <div class="pdf-category-title">${categoryName}</div>
            <div class="pdf-category-metrics">
              <span>Score: ${categoryScore}%</span>
              <span>Impact: +${categoryImpact}%</span>
              <span>Timing: ${categoryTiming}</span>
            </div>
          </div>
      `;
      
      // Find all elements within this category
      const elements = category.querySelectorAll('.report-element, .element, .analysis-element');
      
      if (elements.length === 0) {
        pdfContent += `
          <div class="pdf-element">
            <div class="pdf-element-title">Category Overview</div>
            <div class="pdf-element-content">
              <div class="pdf-content-block pdf-solution">
                <div class="pdf-block-label">Analysis</div>
                <div class="pdf-block-content">This category contains optimization recommendations for ${categoryName.toLowerCase()}. Implementation of these suggestions can improve your landing page performance.</div>
              </div>
            </div>
          </div>
        `;
      } else {
        elements.forEach((element, elementIndex) => {
          // Extract element title
          const elementTitleEl = element.querySelector('.element-title, .element-name, h4, h5');
          const elementTitle = elementTitleEl?.textContent?.trim() || `Element ${elementIndex + 1}`;
          
          pdfContent += `
            <div class="pdf-element">
              <div class="pdf-element-title">${elementTitle}</div>
              <div class="pdf-element-content">
          `;
          
          // Extract current text/site text
          const siteTextEl = element.querySelector('.site-text-block .block-content, .current-text, .site-text');
          if (siteTextEl) {
            const siteText = siteTextEl.textContent?.trim();
            if (siteText && siteText !== 'Not found' && siteText.length > 0) {
              pdfContent += `
                <div class="pdf-content-block pdf-current-text">
                  <div class="pdf-block-label">Current Content</div>
                  <div class="pdf-block-content">${siteText}</div>
                </div>
              `;
            }
          }
          
          // Extract problem
          const problemEl = element.querySelector('.problem .block-content, .issue, .problem-text');
          if (problemEl) {
            const problemText = problemEl.textContent?.trim();
            if (problemText && problemText.length > 0) {
              pdfContent += `
                <div class="pdf-content-block pdf-problem">
                  <div class="pdf-block-label">Issue Identified</div>
                  <div class="pdf-block-content">${problemText}</div>
                </div>
              `;
            }
          }
          
          // Extract solution
          const solutionEl = element.querySelector('.solution .block-content, .recommendation, .solution-text');
          if (solutionEl) {
            const solutionText = solutionEl.textContent?.trim();
            if (solutionText && solutionText.length > 0) {
              pdfContent += `
                <div class="pdf-content-block pdf-solution">
                  <div class="pdf-block-label">Recommended Solution</div>
                  <div class="pdf-block-content">${solutionText}</div>
                </div>
              `;
            }
          }
          
          // Extract actions
          const actionsContainer = element.querySelector('.actions, .action-list, .recommendations');
          if (actionsContainer) {
            const actionItems = actionsContainer.querySelectorAll('li, .action-item');
            if (actionItems.length > 0) {
              let actionsHtml = '';
              actionItems.forEach(action => {
                const actionText = action.textContent?.trim();
                if (actionText && actionText.length > 0) {
                  actionsHtml += `<li>${actionText}</li>`;
                }
              });
              
              if (actionsHtml) {
                pdfContent += `
                  <div class="pdf-content-block pdf-actions">
                    <div class="pdf-block-label">Action Steps</div>
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
          
          // Extract metrics if available
          const metricsContainer = element.querySelector('.element-metrics, .metrics');
          if (metricsContainer) {
            const impactMetric = metricsContainer.querySelector('[class*="impact"], .metric-impact');
            const timingMetric = metricsContainer.querySelector('[class*="timing"], .metric-timing');
            
            let impactValue = '–';
            let timingValue = '–';
            
            if (impactMetric) {
              const impactText = impactMetric.textContent?.trim();
              const impactMatch = impactText?.match(/\+?(\d+)%/);
              if (impactMatch) impactValue = `+${impactMatch[1]}%`;
            }
            
            if (timingMetric) {
              const timingText = timingMetric.textContent?.trim();
              if (timingText) {
                timingValue = timingText.replace(/.*:\s*/, '').trim();
              }
            }
            
            if (impactValue !== '–' || timingValue !== '–') {
              pdfContent += `
                <div class="pdf-element-metrics">
                  <div class="pdf-metric-item">
                    <div class="pdf-metric-value" style="color: #48bb78;">${impactValue}</div>
                    <div class="pdf-metric-label">Impact</div>
                  </div>
                  <div class="pdf-metric-item">
                    <div class="pdf-metric-value" style="color: #805ad5;">${timingValue}</div>
                    <div class="pdf-metric-label">Time</div>
                  </div>
                </div>
              `;
            }
          }
          
          pdfContent += `
              </div>
            </div>
          `;
        });
      }
      
      pdfContent += '</div>'; // Close category
    });
    
    return pdfContent || '<div class="pdf-no-content">Unable to extract report content.</div>';
    
  } catch (error) {
    console.error('Error extracting actual report content:', error);
    return '<div class="pdf-no-content">Error processing report content for PDF generation.</div>';
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
function showPdfSuccess(email) {
  const successDiv = document.getElementById('pdf-success');
  const formDiv = document.getElementById('pdf-form');
  const sentEmailSpan = document.getElementById('pdf-sent-email');
  
  if (successDiv && formDiv && sentEmailSpan) {
    formDiv.style.display = 'none';
    successDiv.style.display = 'block';
    sentEmailSpan.textContent = email;
    
    // FIXED: Add "Generate Another PDF" button after success
    const existingButton = successDiv.querySelector('.generate-another-btn');
    if (!existingButton) {
      const generateAnotherBtn = document.createElement('button');
      generateAnotherBtn.className = 'generate-another-btn';
      generateAnotherBtn.style.cssText = `
        margin-top: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        margin-right: 12px;
      `;
      generateAnotherBtn.innerHTML = '<i class="fa fa-file-pdf" style="margin-right: 8px;"></i>Send to Another Email';
      
      generateAnotherBtn.onclick = () => {
        // Reset form and show it again
        formDiv.style.display = 'flex';
        successDiv.style.display = 'none';
        
        // Clear the email field but keep name and company
        const emailInput = document.getElementById('pdf-email');
        if (emailInput) {
          emailInput.value = '';
          emailInput.focus();
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
  }
}
