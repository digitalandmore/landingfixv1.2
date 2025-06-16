// Report Utilities - Helper functions for report generation

// Get report data from localStorage
function getReportData() {
  return JSON.parse(localStorage.getItem('landingfix_report_data') || '{}');
}

// Get current scores from DOM
function getCurrentScores() {
  return {
    optimization: document.getElementById('main-score-number')?.textContent?.replace('%', '') || '–',
    impact: document.getElementById('main-impact-number')?.textContent?.replace('%', '') || '–',
    timing: document.getElementById('main-timing')?.textContent || '–'
  };
}

// Get score color based on value
function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#6b7280';
}

// Format timing
function formatTiming(timing) {
  if (!timing) return '–';
  if (typeof timing === 'string') return timing;
  if (typeof timing === 'number') {
    if (timing < 60) return `${timing}min`;
    const hours = Math.floor(timing / 60);
    const mins = timing % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return timing.toString();
}

// Format actions
function formatActions(actions) {
  if (!Array.isArray(actions)) return actions || '';
  return actions.join(', ');
}

// Utility delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Animate counter with smooth transition
function animateCounter(element, start, end, suffix = '') {
  const duration = 500;
  const startTime = Date.now();
  
  const updateCounter = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = Math.round(start + (end - start) * progress);
    element.textContent = current + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  };
  
  requestAnimationFrame(updateCounter);
}

// Validate report data structure
function isValidReportData(data) {
  const requiredFields = ['url', 'focus', 'industry', 'goals', 'name', 'email'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      console.log(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  // Validate URL format
  try {
    new URL(data.url);
  } catch (e) {
    console.log('❌ Invalid URL format:', data.url);
    return false;
  }
  
  // Validate goals array
  if (!Array.isArray(data.goals) || data.goals.length === 0) {
    console.log('❌ Invalid goals data');
    return false;
  }
  
  return true;
}

// Show error message
function showErrorMessage(reportContent, error) {
  if (reportContent) {
    reportContent.innerHTML = `
      <div class="report-error" style="text-align: center; padding: 48px 24px; color: #dc2626;">
        <i class="fa fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.7;"></i>
        <h3 style="margin-bottom: 16px;">Report Generation Failed</h3>
        <p style="margin-bottom: 24px;">${error}</p>
        <button onclick="window.location.reload()" class="action-btn primary" style="min-width: auto;">
          <i class="fa fa-refresh"></i>
          <span>Try Again</span>
        </button>
      </div>
    `;
  }
}

// Make functions globally available
window.getReportData = getReportData;
window.getCurrentScores = getCurrentScores;
window.getScoreColor = getScoreColor;
window.formatTiming = formatTiming;
window.formatActions = formatActions;
window.delay = delay;
window.animateCounter = animateCounter;
window.isValidReportData = isValidReportData;
window.showErrorMessage = showErrorMessage;

console.log('✅ Report utilities loaded');
