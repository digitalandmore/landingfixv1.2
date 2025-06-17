// Progressive Report Loading System
// Shows user info immediately, then updates scores and content as data arrives

class ReportLoader {
  constructor() {
    this.data = null;
    this.toolsList = [];
    this.isLoading = false;
    this.reportBuilder = new ReportBuilder();
  }

  // Initialize the progressive loading system
  async init() {
    // Check if dependencies are loaded
    if (typeof window.getReportData !== 'function' || typeof window.ReportBuilder !== 'function') {
      console.error('❌ Dependencies not loaded. Required: report-utils.js, report-builder.js');
      this.showErrorMessage('System dependencies not loaded. Please refresh the page.');
      return;
    }

    // Load tools data
    try {
      const toolsResponse = await fetch('https://landingfixv1-2.onrender.com/tools.json');
      this.toolsList = await toolsResponse.json();
    } catch (error) {
      console.warn('Failed to load tools:', error);
      this.toolsList = [];
    }

    // Get report data from localStorage
    this.data = JSON.parse(localStorage.getItem('landingfix_report_data') || '{}');
    
    if (!this.data || !this.data.url || !window.isValidReportData(this.data)) {
      console.log('🔄 Invalid or missing report data - redirecting to home');
      this.showInvalidDataMessage();
      this.redirectToHome();
      return;
    }

    // Check if this is a page refresh vs new report
    const currentUrl = window.location.href;
    const lastPageLoad = sessionStorage.getItem('landingfix_last_page_load');
    const isPageRefresh = lastPageLoad === currentUrl;
    
    if (isPageRefresh) {
      console.log('🔄 Page refresh detected - validating report data freshness');
      const reportTimestamp = this.data.timestamp || 0;
      const currentTime = Date.now();
      const timeDiff = currentTime - reportTimestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      if (timeDiff > maxAge) {
        console.log('🔄 Report data too old - redirecting to home');
        this.showExpiredDataMessage();
        this.redirectToHome();
        return;
      }
    }
    
    // Store current page load for refresh detection
    sessionStorage.setItem('landingfix_last_page_load', currentUrl);
    
    // Add timestamp to report data if missing
    if (!this.data.timestamp) {
      this.data.timestamp = Date.now();
      localStorage.setItem('landingfix_report_data', JSON.stringify(this.data));
    }

    // Start the progressive loading
    await this.startProgressiveLoad();
  }

  // Show error message for missing dependencies
  showErrorMessage(message) {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
      reportContent.innerHTML = `
        <div class="report-error" style="text-align: center; padding: 48px 24px; color: #dc2626;">
          <i class="fa fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.7;"></i>
          <h3 style="margin-bottom: 16px;">System Error</h3>
          <p style="margin-bottom: 24px;">${message}</p>
          <button onclick="window.location.reload()" class="action-btn primary" style="min-width: auto;">
            <i class="fa fa-refresh"></i>
            <span>Refresh Page</span>
          </button>
        </div>
      `;
    }
  }

  // Show invalid data message
  showInvalidDataMessage() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
      reportContent.innerHTML = `
        <div class="report-error" style="text-align: center; padding: 48px 24px; color: #c0392b;">
          <i class="fa fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.7;"></i>
          <h3 style="margin-bottom: 16px;">Invalid Report Data</h3>
          <p style="margin-bottom: 24px;">No valid report data found. You'll be redirected to the home page to start a new analysis.</p>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 0.9em; color: #6c757d;">
              <i class="fa fa-info-circle" style="margin-right: 6px;"></i>
              This usually happens when accessing the report page directly or after clearing browser data.
            </p>
          </div>
          <div id="redirect-countdown" style="font-size: 0.9em; color: #6c757d; margin-bottom: 16px;">
            Redirecting in <span id="countdown">3</span> seconds...
          </div>
          <button onclick="window.location.href='/'" class="action-btn primary" style="min-width: auto;">
            <i class="fa fa-home"></i>
            <span>Go to Home Now</span>
          </button>
        </div>
      `;
    }
  }

  // Show expired data message
  showExpiredDataMessage() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
      reportContent.innerHTML = `
        <div class="report-error" style="text-align: center; padding: 48px 24px; color: #f39c12;">
          <i class="fa fa-clock" style="font-size: 48px; margin-bottom: 16px; opacity: 0.7;"></i>
          <h3 style="margin-bottom: 16px;">Report Session Expired</h3>
          <p style="margin-bottom: 24px;">This report session has expired. Please start a new analysis.</p>
          <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 0.9em; color: #856404;">
              <i class="fa fa-info-circle" style="margin-right: 6px;"></i>
              Report data expires after 30 minutes for security reasons.
            </p>
          </div>
          <div id="redirect-countdown" style="font-size: 0.9em; color: #6c757d; margin-bottom: 16px;">
            Redirecting in <span id="countdown">3</span> seconds...
          </div>
          <button onclick="window.location.href='/'" class="action-btn primary" style="min-width: auto;">
            <i class="fa fa-plus"></i>
            <span>Start New Analysis</span>
          </button>
        </div>
      `;
    }
  }

  // Redirect to home with countdown
  redirectToHome() {
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    
    const timer = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown;
      }
      
      if (countdown <= 0) {
        clearInterval(timer);
        // Clean up localStorage
        localStorage.removeItem('landingfix_report_data');
        localStorage.removeItem('landingfix_unlocked');
        localStorage.removeItem('landingfix_last_report_url');
        sessionStorage.clear();
        
        // Redirect to home
        window.location.href = '/';
      }
    }, 1000);
  }

  // Start the progressive loading process
  async startProgressiveLoad() {
    // Step 1: Show user info immediately
    this.showUserInfo();
    
    // Step 2: Show loading state for report content
    this.showLoadingState();
    
    // Step 3: Fetch and update report data progressively
    await this.fetchAndUpdateReport();
  }

  // Show user information immediately
  showUserInfo() {
    const detailsDiv = document.getElementById('dynamic-report-details');
    if (!detailsDiv) return;
    
    const focusIconClass = this.data.focusIcon || 'fa-chart-line';
    const focusDisplayName = this.data.focus || '-';
    const industryDisplayName = this.data.industryName || this.data.industry || '-';
    
    detailsDiv.innerHTML = `
      <div class="report-user-header user-header-flex">
        <div class="user-info-col">
          <div class="user-info-row">
            <div class="user-info-block">
              <div class="user-info-label">
                <span class="icon-bg"><i class="fa fa-link"></i></span>
                <span>Landing Page</span>
              </div>
              <a href="${this.data.url}" target="_blank" class="user-info-value">${this.data.url}</a>
              <div class="user-info-label">
                <span class="icon-bg"><i class="fa fa-envelope"></i></span>
                <span>Email</span>
              </div>
              <span class="user-info-value">${this.data.email || '-'}</span>
              ${this.data.company ? `
              <div class="user-info-label">
                <span class="icon-bg"><i class="fa fa-building"></i></span>
                <span>Company</span>
              </div>
              <span class="user-info-value">${this.data.company}</span>
              ` : ''}
              
              <div class="goals-row horizontal-layout">
                <div class="goals-label">
                  <span class="icon-bg"><i class="fa fa-bullseye"></i></span>
                  <span>Analysis Settings</span>
                </div>
                <div class="horizontal-items">
                  <div class="horizontal-item">
                    <div class="item-label">Goals</div>
                    <div class="item-values">
                      ${this.data.goals && this.data.goals.length ? this.data.goals.map(g => `<span class="goal-badge small">${g}</span>`).join('') : '<span class="no-data">-</span>'}
                    </div>
                  </div>
                  <div class="horizontal-item">
                    <div class="item-label">Focus</div>
                    <div class="item-values">
                      ${focusDisplayName ? `<span class="goal-badge small focus"><i class="fa ${focusIconClass}"></i> ${focusDisplayName}</span>` : '<span class="no-data">-</span>'}
                    </div>
                  </div>
                  <div class="horizontal-item">
                    <div class="item-label">Industry</div>
                    <div class="item-values">
                      ${industryDisplayName ? `<span class="goal-badge small industry">${industryDisplayName}</span>` : '<span class="no-data">-</span>'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="score-col">
          <div class="score-metrics-container">
            <div class="score-metric-item">
              <div class="score-metric-header">
                <div class="score-metric-label">
                  <i class="fa fa-gauge-high"></i>
                  <span>Optimization Score</span>
                </div>
                <div class="score-metric-value" id="main-score-display">
                  <span class="score-number" id="main-score-number">
                    <i class="fa fa-spinner fa-spin"></i>
                  </span>
                </div>
              </div>
              <div class="score-metric-description">
                Current state of your landing page optimization
              </div>
            </div>
            <div class="score-metric-item">
              <div class="score-metric-header">
                <div class="score-metric-label">
                  <i class="fa fa-arrow-up-right-dots"></i>
                  <span>Impact Score</span>
                </div>
                <div class="score-metric-value" id="main-impact-display">
                  <span class="score-number" id="main-impact-number">
                    <i class="fa fa-spinner fa-spin"></i>
                  </span>
                </div>
              </div>
              <div class="score-metric-description">
                Potential improvement from recommended changes
              </div>
            </div>
            <div class="score-metric-item">
              <div class="score-metric-header">
                <div class="score-metric-label">
                  <i class="fa fa-clock"></i>
                  <span>Implementation Time</span>
                </div>
                <div class="score-metric-value" id="main-timing-display">
                  <span class="score-number" id="main-timing">
                    <i class="fa fa-spinner fa-spin"></i>
                  </span>
                </div>
              </div>
              <div class="score-metric-description">
                Estimated time to complete all improvements
              </div>
            </div>
            <div class="report-action-buttons">
              <button class="action-btn primary" id="unlock-full-report" disabled style="opacity: 0.6;">
                <i class="fa fa-spinner fa-spin"></i>
                <span>Loading...</span>
              </button>
              <button class="action-btn secondary" id="send-via-email" disabled style="opacity: 0.6;">
                <i class="fa fa-paper-plane"></i>
                <span>Send via Email</span>
              </button>
              <button class="action-btn outline" id="save-as-pdf" disabled style="opacity: 0.6;">
                <i class="fa fa-file-pdf"></i>
                <span>Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        /* FIXED: Match action button styles with report-builder.js */
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
        
        /* Icon color fixes */
        .report-action-buttons .action-btn.secondary .fa-paper-plane {
          color: #0070ba !important;
        }
        
        .report-action-buttons .action-btn.outline .fa-file-pdf {
          color: #0070ba !important;
        }
      </style>
    `;

    console.log('✅ User info displayed immediately');
  }

  // Show initial loading state for report content
  showLoadingState() {
    const reportContent = document.getElementById('report-content');
    const staticReportHtml = reportContent.innerHTML;
    
    // Store static HTML for later use
    this.reportBuilder.staticReportHtml = staticReportHtml;
    
    reportContent.innerHTML = `
      <div class="report-loader enhanced-loader" id="progressive-loader">
        <div class="loader-header">
          <div class="loader-icon"  border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <i class="fa fa-robot" style="color: white; font-size: 24px;"></i>
          </div>
          <h2 class="loader-title">AI Analysis in Progress</h2>
          <p class="loader-subtitle">Our advanced AI is analyzing your landing page</p>
        </div>
        
        <div class="progress-container">
          <div class="progress-bar-background">
            <div class="progress-bar-fill" id="reportProgressBar"></div>
            <div class="progress-glow" id="progressGlow"></div>
          </div>
          <div class="progress-percentage" id="loaderPercent">0%</div>
        </div>
        
        <div class="analysis-steps" id="reportLoaderSteps">
          <div class="steps-grid" id="loaderStepGrid">
            <div class="step-item" id="step-1" data-step="1">
              <div class="step-icon">
                <i class="fa fa-globe" style="color: #FFFF;"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Fetching Content</div>
                <div class="step-description">Retrieving page data and structure</div>
              </div>
              <div class="step-status">
                <i class="fa fa-clock step-pending"></i>
                <i class="fa fa-spinner fa-spin step-loading" style="display:none;"></i>
                <i class="fa fa-check step-complete" style="display:none;"></i>
              </div>
            </div>
            
            <div class="step-item" id="step-2" data-step="2">
              <div class="step-icon">
                <i class="fa fa-brain" style="color: #FFFF;"></i>
              </div>
              <div class="step-content">
                <div class="step-title">AI Analysis</div>
                <div class="step-description">Processing content with advanced algorithms</div>
              </div>
              <div class="step-status">
                <i class="fa fa-clock step-pending"></i>
                <i class="fa fa-spinner fa-spin step-loading" style="display:none;"></i>
                <i class="fa fa-check step-complete" style="display:none;"></i>
              </div>
            </div>
            
            <div class="step-item" id="step-3" data-step="3">
              <div class="step-icon">
                <i class="fa fa-mobile-screen" style="color: #FFFF;"></i>
              </div>
              <div class="step-content">
                <div class="step-title">UX Evaluation</div>
                <div class="step-description">Analyzing user experience patterns</div>
              </div>
              <div class="step-status">
                <i class="fa fa-clock step-pending"></i>
                <i class="fa fa-spinner fa-spin step-loading" style="display:none;"></i>
                <i class="fa fa-check step-complete" style="display:none;"></i>
              </div>
            </div>
            
            <div class="step-item" id="step-4" data-step="4">
              <div class="step-icon">
                <i class="fa fa-calculator" style="color: #FFFF;"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Score Calculation</div>
                <div class="step-description">Computing optimization metrics</div>
              </div>
              <div class="step-status">
                <i class="fa fa-clock step-pending"></i>
                <i class="fa fa-spinner fa-spin step-loading" style="display:none;"></i>
                <i class="fa fa-check step-complete" style="display:none;"></i>
              </div>
            </div>
            
            <div class="step-item" id="step-5" data-step="5">
              <div class="step-icon">
                <i class="fa fa-lightbulb" style="color: #FFFF;"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Recommendations</div>
                <div class="step-description">Generating actionable insights</div>
              </div>
              <div class="step-status">
                <i class="fa fa-clock step-pending"></i>
                <i class="fa fa-spinner fa-spin step-loading" style="display:none;"></i>
                <i class="fa fa-check step-complete" style="display:none;"></i>
              </div>
            </div>
            
            <div class="step-item" id="step-6" data-step="6">
              <div class="step-icon">
                <i class="fa fa-check-circle" style="color: #FFFF;"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Report Generation</div>
                <div class="step-description">Finalizing comprehensive report</div>
              </div>
              <div class="step-status">
                <i class="fa fa-clock step-pending"></i>
                <i class="fa fa-spinner fa-spin step-loading" style="display:none;"></i>
                <i class="fa fa-check step-complete" style="display:none;"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div class="loader-message" id="reportLoaderMsg">
          <div class="message-content">
            <i class="fa fa-info-circle"></i>
            <span>Initializing AI analysis engine...</span>
          </div>
        </div>
      </div>
    `;

    console.log('✅ Enhanced loading state displayed');
  }

  // Enhanced progress update with smooth step transitions
  updateProgress(step, percentage, message) {
    const progressBar = document.getElementById('reportProgressBar');
    const progressGlow = document.getElementById('progressGlow');
    const percentageEl = document.getElementById('loaderPercent');
    const messageEl = document.getElementById('reportLoaderMsg');
    const currentStepEl = document.getElementById(`step-${step}`);
    
    // Update progress bar with smooth animation
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressBar.style.background = `linear-gradient(90deg, #28a745 0%, #20c997 ${percentage}%, #38a169 100%)`;
    }
    
    if (progressGlow) {
      progressGlow.style.left = `${Math.max(0, percentage - 10)}%`;
    }
    
    if (percentageEl) {
      // Animate percentage counter
      const currentPercent = parseInt(percentageEl.textContent) || 0;
      window.animateCounter(percentageEl, currentPercent, percentage, '%');
    }
    
    if (messageEl) {
      const messageContent = messageEl.querySelector('.message-content span');
      if (messageContent) {
        messageContent.textContent = message;
      }
    }
    
    // Update step status with professional animations
    if (currentStepEl) {
      this.updateStepStatus(step, 'loading');
      
      // Complete previous steps
      for (let i = 1; i < step; i++) {
        this.updateStepStatus(i, 'complete');
      }
      
      // FASTER current step completion - reduced from 800ms to 300ms
      setTimeout(() => {
        this.updateStepStatus(step, 'complete');
      }, 300);
    }
    
    console.log(`📊 Enhanced Progress: ${percentage}% - Step ${step}: ${message}`);
  }

  // Update step status with animations - FASTER ANIMATIONS
  updateStepStatus(stepNumber, status) {
    const stepEl = document.getElementById(`step-${stepNumber}`);
    if (!stepEl) return;
    
    const pendingIcon = stepEl.querySelector('.step-pending');
    const loadingIcon = stepEl.querySelector('.step-loading');
    const completeIcon = stepEl.querySelector('.step-complete');
    
    // Reset all icons
    [pendingIcon, loadingIcon, completeIcon].forEach(icon => {
      if (icon) icon.style.display = 'none';
    });
    
    // Set step state classes
    stepEl.classList.remove('step-pending', 'step-loading', 'step-complete');
    stepEl.classList.add(`step-${status}`);
    
    // Show appropriate icon
    switch (status) {
      case 'loading':
        if (loadingIcon) {
          loadingIcon.style.display = 'block';
          loadingIcon.style.color = '#007bff';
        }
        break;
      case 'complete':
        if (completeIcon) {
          completeIcon.style.display = 'block';
          completeIcon.style.color = '#28a745';
          
          // FASTER completion animation - reduced from 200ms to 100ms
          setTimeout(() => {
            completeIcon.style.transform = 'scale(1.2)';
            setTimeout(() => {
              completeIcon.style.transform = 'scale(1)';
            }, 100);
          }, 50);
        }
        break;
      default:
        if (pendingIcon) {
          pendingIcon.style.display = 'block';
        }
    }
  }

  // Enhanced fetch and update with progressive steps and continuous progress
  async fetchAndUpdateReport() {
    try {
      this.isLoading = true;
      
      // Step 1: Start fetching (20%)
      this.updateProgress(1, 20, 'Fetching page content and structure...');
      await window.delay(200);
      
      // Start continuous progress simulation during API call
      this.startContinuousProgress(20, 35);
      
      const response = await fetch("https://landingfixv1-2.onrender.com/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: this.data.url,
          focus: this.data.focus,
          industry: this.data.industry,
          goals: this.data.goals || []
        })
      });

      // Stop continuous progress and jump to next step
      this.stopContinuousProgress();
      
      // Step 2: AI Analysis (35%)
      this.updateProgress(2, 35, 'Processing content with AI algorithms...');
      await window.delay(300);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Step 3: UX Evaluation (50%)
      this.updateProgress(3, 50, 'Evaluating user experience patterns...');
      await window.delay(250);
      
      // Start continuous progress for JSON parsing
      this.startContinuousProgress(50, 70);
      
      const result = await response.json();
      
      // Stop continuous progress
      this.stopContinuousProgress();
      
      // Nella sezione di gestione errore API, sostituisci con:

if (result.error) {
  const reportContent = document.getElementById('report-content');
  if (reportContent) {
    reportContent.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 48px auto;
        padding: 32px 24px;
        background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        text-align: center;
        border: 1px solid #feb2b2;
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #e53e3e, #c53030);
          border-radius: 50%;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(229,62,62,0.3);
        ">
          <i class="fas fa-ban" style="color: white; font-size: 24px;"></i>
        </div>
        
        <h3 style="
          color: #742a2a;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        ">Website Analysis Blocked</h3>
        
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border-left: 4px solid #e53e3e;
          text-align: left;
        ">
          <h4 style="
            color: #742a2a;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <i class="fas fa-shield-alt" style="color: #e53e3e;"></i>
            Server Response: Data Validation Failed
          </h4>
          <p style="
            color: #742a2a;
            line-height: 1.6;
            margin-bottom: 16px;
            font-size: 14px;
            background: #fed7d7;
            padding: 12px;
            border-radius: 6px;
          ">
            <strong>Error:</strong> ${result.error}
          </p>
          
          <div style="
            background: #f7fafc;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          ">
            <h5 style="
              color: #2d3748;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 12px;
            ">This usually happens when:</h5>
            <ul style="
              color: #4a5568;
              font-size: 13px;
              line-height: 1.5;
              margin: 0;
              padding-left: 16px;
            ">
              <li><strong>Website blocks automated tools</strong> (Cloudflare, bot protection)</li>
              <li>Landing page URL is not publicly accessible</li>
              <li>Website requires authentication or special permissions</li>
              <li>URL format is invalid or contains restricted content</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 32px;">
          <a href="https://landingfixai.com/#analyze-section" style="
            display: inline-block;
            background: linear-gradient(90deg, #0070ba 60%, #00c6a7 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 16px rgba(0,112,186,0.3);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0px)'">
            <i class="fas fa-search" style="margin-right: 8px;"></i>
            Analyze Different Website
          </a>
        </div>
        
        <div style="
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #feb2b2;
        ">
          <p style="
            color: #a0aec0;
            font-size: 12px;
            margin: 0;
          ">
            Need help? Contact support with this error code: <span style="font-family: monospace; background: #edf2f7; padding: 2px 6px; border-radius: 4px;">API_VALIDATION_ERROR</span>
          </p>
        </div>
      </div>
    `;
  }
  return;
}

      // Step 4: Score Calculation (70%)
      this.updateProgress(4, 70, 'Computing optimization metrics...');
      await window.delay(200);
      
      const processedData = this.reportBuilder.processReportData(result);
      
      // Step 5: Recommendations (85%)
      this.updateProgress(5, 85, 'Generating actionable insights...');
      await window.delay(150);
      this.updateScores(processedData);
      
      // Step 6: Report Generation (100%)
      this.updateProgress(6, 100, 'Finalizing comprehensive report...');
      await window.delay(300);
      
      // Show final report
      this.showFinalReport(processedData);
      
    // Nella sezione catch generale, sostituisci il messaggio di errore con questo:

} catch (error) {
  console.error('Report generation error:', error);
  this.stopContinuousProgress();
  
  // ✅ MESSAGGIO ERRORE 400 MIGLIORATO
  const reportContent = document.getElementById('report-content');
  if (reportContent) {
    reportContent.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 48px auto;
        padding: 32px 24px;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        text-align: center;
        border: 1px solid #e2e8f0;
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          border-radius: 50%;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(255,107,107,0.3);
        ">
          <i class="fas fa-exclamation-triangle" style="color: white; font-size: 24px;"></i>
        </div>
        
        <h3 style="
          color: #1a202c;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        ">Analysis Could Not Be Completed</h3>
        
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border-left: 4px solid #ff6b6b;
          text-align: left;
        ">
          <h4 style="
            color: #2d3748;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <i class="fas fa-shield-alt" style="color: #ff6b6b;"></i>
            Most Likely Cause: Website Protection
          </h4>
          <p style="
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 16px;
            font-size: 14px;
          ">
            <strong>Your landing page URL appears to be blocking automated analysis.</strong><br>
            This commonly happens when websites use anti-bot protection, Cloudflare security, or restrict access to analysis tools.
          </p>
          
          <div style="
            background: #f7fafc;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          ">
            <h5 style="
              color: #2d3748;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 12px;
            ">Other possible causes:</h5>
            <ul style="
              color: #4a5568;
              font-size: 13px;
              line-height: 1.5;
              margin: 0;
              padding-left: 16px;
            ">
              <li>Website is temporarily offline or unreachable</li>
              <li>URL requires login or authentication</li>
              <li>Server maintenance or technical issues</li>
              <li>Network connectivity problems</li>
            </ul>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin: 24px 0;
        ">
          <h4 style="
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
          ">💡 Recommended Solution</h4>
          <p style="
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
          ">
            Try analyzing a different landing page URL, or contact your website administrator to temporarily disable bot protection for analysis purposes.
          </p>
        </div>
        
        <div style="margin-top: 32px;">
          <a href="https://landingfixai.com/#analyze-section" style="
            display: inline-block;
            background: linear-gradient(90deg, #0070ba 60%, #00c6a7 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 16px rgba(0,112,186,0.3);
            transition: all 0.3s ease;
            margin-right: 12px;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,112,186,0.4)'" 
             onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 4px 16px rgba(0,112,186,0.3)'">
            <i class="fas fa-search" style="margin-right: 8px;"></i>
            Try New Analysis
          </a>
          
          <button onclick="window.location.reload()" style="
            background: #718096;
            color: white;
            padding: 16px 24px;
            border: none;
            border-radius: 30px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease;
          " onmouseover="this.style.background='#4a5568'" 
             onmouseout="this.style.background='#718096'">
            <i class="fas fa-redo" style="margin-right: 8px;"></i>
            Retry
          </button>
        </div>
        
        <div style="
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        ">
          <p style="
            color: #718096;
            font-size: 12px;
            margin: 0;
          ">
            Error details: ${error.message}<br>
            <span style="font-family: monospace;">[Error Code: ${error.status || 'NETWORK_ERROR'}]</span>
          </p>
        </div>
      </div>
    `;
  }
}finally {
      this.isLoading = false;
    }
  }

  // Start continuous progress simulation
  startContinuousProgress(startPercent, endPercent) {
    this.progressInterval = setInterval(() => {
      const progressBar = document.getElementById('reportProgressBar');
      const percentageEl = document.getElementById('loaderPercent');
      
      if (progressBar && percentageEl) {
        const currentPercent = parseFloat(progressBar.style.width) || startPercent;
        const newPercent = Math.min(currentPercent + 0.5, endPercent - 1); // Increment by 0.5% every 200ms
        
        progressBar.style.width = `${newPercent}%`;
        percentageEl.textContent = `${Math.round(newPercent)}%`;
        
        // Stop if we reach the target
        if (newPercent >= endPercent - 1) {
          this.stopContinuousProgress();
        }
      }
    }, 200); // Update every 200ms
  }

  // Stop continuous progress simulation
  stopContinuousProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Update scores in the header immediately
  updateScores(data) {
    const mainScoreEl = document.getElementById('main-score-number');
    const mainImpactEl = document.getElementById('main-impact-number');
    const mainTimingEl = document.getElementById('main-timing');
    const mainScoreDisplay = document.getElementById('main-score-display');
    const mainImpactDisplay = document.getElementById('main-impact-display');
    const mainTimingDisplay = document.getElementById('main-timing-display');

    // Animate score updates
    if (mainScoreEl && mainScoreDisplay) {
      this.animateScore(mainScoreEl, data.optimization, '%');
      mainScoreDisplay.style.color = window.getScoreColor(data.optimization);
    }

    if (mainImpactEl && mainImpactDisplay) {
      this.animateScore(mainImpactEl, data.impact, '%');
      mainImpactDisplay.style.color = '#0070ba';
    }

    if (mainTimingEl && mainTimingDisplay) {
      mainTimingEl.textContent = data.timing;
      mainTimingDisplay.style.color = '#0070ba';
    }

    // Wait a bit to ensure DOM is fully ready
    setTimeout(() => {
      this.setupButtonsAfterScores();
    }, 500);
  }

  // Animate score counting up
  animateScore(element, targetValue, suffix = '') {
    const startValue = 0;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const updateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
      
      element.textContent = currentValue + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    };

    requestAnimationFrame(updateScore);
  }

  // Setup buttons after scores are displayed
  setupButtonsAfterScores() {
    // FIXED: Store current report URL for validation
    const reportData = this.data;
    if (reportData && reportData.url) {
      localStorage.setItem('landingfix_last_report_url', reportData.url);
      console.log('📍 Stored current report URL:', reportData.url);
    }

    const unlockBtn = document.getElementById('unlock-full-report');
    const emailBtn = document.getElementById('send-via-email');
    const pdfBtn = document.getElementById('save-as-pdf');

    // FIXED: Simplified unlock check - only check if unlocked for any URL
    const isAlreadyUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    
    console.log('🔍 SETUP BUTTONS AFTER SCORES:', {
      timestamp: new Date().toISOString(),
      localStorage_value: localStorage.getItem('landingfix_unlocked'),
      isAlreadyUnlocked: isAlreadyUnlocked,
      currentUrl: reportData.url,
      unlockBtn_exists: !!unlockBtn,
      emailBtn_exists: !!emailBtn,
      pdfBtn_exists: !!pdfBtn
    });

    // Setup unlock button - ALWAYS show if not unlocked
    if (unlockBtn) {
      if (isAlreadyUnlocked) {
        unlockBtn.style.display = 'none';
        console.log('✅ Report UNLOCKED - HIDING unlock button');
      } else {
        unlockBtn.style.display = 'flex';
        unlockBtn.disabled = false;
        unlockBtn.style.opacity = '1';
        unlockBtn.innerHTML = '<i class="fa fa-unlock"></i><span>Unlock Full Report</span>';
        
        unlockBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔓 Unlock button clicked - loading checkout');
          
          if (typeof window.loadCheckoutPopup === 'function') {
            window.loadCheckoutPopup(() => {
              console.log('Checkout popup loaded, opening...');
              if (typeof window.openCheckout === 'function') {
                window.openCheckout();
              } else {
                console.error('❌ openCheckout function not available after load');
                this.fallbackCheckoutLoad();
              }
            });
          } else {
            console.error('❌ loadCheckoutPopup function not available');
            this.fallbackCheckoutLoad();
          }
        };
        
        console.log('🔒 Report LOCKED - SHOWING unlock button');
      }
    } else {
      console.error('❌ Unlock button element not found in DOM');
    }

    // Setup email button - ALWAYS enabled, but check unlock inside
    if (emailBtn) {
      emailBtn.disabled = false;
      emailBtn.style.opacity = '1';
      emailBtn.style.display = 'flex';
      
      emailBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📧 EMAIL BUTTON CLICKED - checking unlock status');
        
        // FIXED: Check unlock status here, not in load time
        if (!isAlreadyUnlocked) {
          console.log('📧 Report not unlocked - showing checkout');
          this.showCheckoutForFeature('email');
          return;
        }
        
        console.log('📧 Report unlocked - loading email system');
        this.loadEmailSystem();
      };
      
      console.log('✅ Email button configured and enabled');
    } else {
      console.error('❌ Email button element not found in DOM');
    }

    // Setup PDF button - ALWAYS enabled, but check unlock inside
    if (pdfBtn) {
      pdfBtn.disabled = false;
      pdfBtn.style.opacity = '1';
      pdfBtn.style.display = 'flex';
      
      pdfBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📄 PDF BUTTON CLICKED - checking unlock status');
        
        // FIXED: Check unlock status here, not in load time
        if (!isAlreadyUnlocked) {
          console.log('📄 Report not unlocked - showing checkout');
          this.showCheckoutForFeature('pdf');
          return;
        }
        
        console.log('📄 Report unlocked - loading PDF system');
        this.loadPdfSystem();
      };
      
      console.log('✅ PDF button configured and enabled');
    } else {
      console.error('❌ PDF button element not found in DOM');
    }

    console.log('✅ All buttons configured successfully');
  }

  // Load email system dynamically
  loadEmailSystem() {
    const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    
    console.log('📧 loadEmailSystem called - checking unlock status:', {
      isUnlocked: isUnlocked,
      localStorage_value: localStorage.getItem('landingfix_unlocked')
    });
    
    if (!isUnlocked) {
      console.log('📧 Report not unlocked - redirecting to checkout from email system');
      this.showCheckoutForFeature('email');
      return;
    }
    
    console.log('✅ Report unlocked - loading email system');
    
    // FIXED: Force reload email system to ensure fresh state
    if (typeof window.showEmailPopup === 'function') {
      console.log('📧 Using existing showEmailPopup function');
      window.showEmailPopup();
    } else {
      console.log('📧 Loading email system dynamically...');
      
      // Remove existing script if present to force reload
      const existingScript = document.querySelector('script[src="report-mail.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.src = 'report-mail.js';
      script.onload = () => {
        setTimeout(() => {
          if (typeof window.showEmailPopup === 'function') {
            console.log('✅ Email system loaded, calling showEmailPopup');
            window.showEmailPopup();
          } else {
            console.error('❌ Email system failed to load');
            alert('Email system not available. Please refresh the page.');
          }
        }, 200);
      };
      script.onerror = () => {
        console.error('❌ Failed to load email script');
        alert('Failed to load email system. Please refresh the page.');
      };
      document.head.appendChild(script);
    }
  }

  // Load PDF system dynamically
  loadPdfSystem() {
    const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
    
    console.log('📄 loadPdfSystem called - checking unlock status:', {
      isUnlocked: isUnlocked,
      localStorage_value: localStorage.getItem('landingfix_unlocked')
    });
    
    if (!isUnlocked) {
      console.log('📄 Report not unlocked - redirecting to checkout from PDF system');
      this.showCheckoutForFeature('pdf');
      return;
    }
    
    console.log('✅ Report unlocked - loading PDF system');
    
    // FIXED: Force reload PDF system to ensure fresh state
    if (typeof window.showPdfPopup === 'function') {
      console.log('📄 Using existing showPdfPopup function');
      window.showPdfPopup();
    } else {
      console.log('📄 Loading PDF system dynamically...');
      
      // Remove existing script if present to force reload
      const existingScript = document.querySelector('script[src="report-pdf.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.src = 'report-pdf.js';
      script.onload = () => {
        setTimeout(() => {
          if (typeof window.showPdfPopup === 'function') {
            console.log('✅ PDF system loaded, calling showPdfPopup');
            window.showPdfPopup();
          } else {
            console.error('❌ PDF system failed to load');
            alert('PDF system not available. Please refresh the page.');
          }
        }, 200);
      };
      script.onerror = () => {
        console.error('❌ Failed to load PDF script');
        alert('Failed to load PDF system. Please refresh the page.');
      };
      document.head.appendChild(script);
    }
  }

  // Show checkout for specific feature
  showCheckoutForFeature(featureType) {
    const featureNames = {
      email: 'send via email',
      pdf: 'download as PDF'
    };
    
    const featureName = featureNames[featureType] || 'use this feature';
    
    console.log(`🔒 Showing checkout for ${featureType} feature`);
    
    if (typeof window.loadCheckoutPopup === 'function') {
      window.loadCheckoutPopup(() => {
        console.log(`Checkout loaded from ${featureType} feature block, opening...`);
        if (typeof window.openCheckout === 'function') {
          window.openCheckout();
        } else {
          console.error(`❌ openCheckout function not available from ${featureType} block`);
          alert(`Please unlock the report first to ${featureName}.`);
        }
      });
    } else {
      console.error(`❌ loadCheckoutPopup function not available from ${featureType} block`);
      alert(`Please unlock the report first to ${featureName}.`);
    }
  }

  // Show the final complete report
  showFinalReport(data) {
    try {
      console.log('🎯 Showing final report with data:', {
        categories: data.categories?.length || 0,
        optimization: data.optimization,
        impact: data.impact,
        timing: data.timing
      });

      const reportContent = document.getElementById('report-content');
      if (!reportContent) {
        console.error('Report content element not found');
        return;
      }

      // FIXED: Ensure static HTML exists before restoring
      if (!this.reportBuilder.staticReportHtml) {
        console.error('Static HTML not stored - cannot restore structure');
        reportContent.innerHTML = `
          <div style="text-align: center; padding: 48px 24px; color: #dc2626;">
            <h3>Error: Report structure not available</h3>
            <p>Please refresh the page to regenerate the report.</p>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        `;
        return;
      }

      // Restore static HTML
      console.log('📄 Restoring static HTML structure...');
      reportContent.innerHTML = this.reportBuilder.staticReportHtml;

      // FIXED: Use requestAnimationFrame to ensure DOM is completely ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            // Verify that category divs exist
            const categoryDivs = document.querySelectorAll('[id^="category-"]');
            console.log('🔍 Available category divs after restore:', categoryDivs.length, Array.from(categoryDivs).map(el => el.id));
            
            if (categoryDivs.length === 0) {
              console.error('❌ No category divs found after HTML restore');
              reportContent.innerHTML = `
                <div style="text-align: center; padding: 48px 24px; color: #dc2626;">
                  <h3>Error: Report structure missing</h3>
                  <p>Category containers not found in DOM.</p>
                  <button onclick="window.location.reload()" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Refresh Page
                  </button>
                </div>
              `;
              return;
            }

            // Verify each expected category div exists
            for (let i = 0; i < Math.min(data.categories?.length || 0, 4); i++) {
              const catDiv = document.getElementById(`category-${i}`);
              if (!catDiv) {
                console.error(`❌ Missing category div: category-${i}`);
                reportContent.innerHTML = `
                  <div style="text-align: center; padding: 48px 24px; color: #dc2626;">
                    <h3>Error: Missing category containers</h3>
                    <p>Category ${i} container not found in DOM.</p>
                    <button onclick="window.location.reload()" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
                      Refresh Page
                    </button>
                  </div>
                `;
                return;
              }
            }

            // Process categories and elements with error handling
            if (data.categories && Array.isArray(data.categories)) {
              console.log('🏗️ Building report categories with', data.categories.length, 'categories...');
              this.reportBuilder.buildReportCategories(data.categories, this.data);
            } else {
              console.warn('No valid categories data found');
            }
            
            // Update final summary
            console.log('📊 Updating final summary...');
            this.reportBuilder.updateFinalSummary({
              optimization: data.optimization,
              impact: data.impact,
              timing: data.timing
            });

            // Setup overlay behaviors
            this.setupOverlayBehaviors();

            console.log('✅ Final report displayed successfully');

          } catch (reportError) {
            console.error('Error in final report building:', reportError);
            reportContent.innerHTML = `
              <div style="text-align: center; padding: 48px 24px; color: #dc2626;">
                <h3>Error displaying report</h3>
                <p>${reportError.message}</p>
                <p><small>Stack: ${reportError.stack?.substring(0, 200)}...</small></p>
                <button onclick="window.location.reload()" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
                  Refresh Page
                </button>
              </div>
            `;
          }
        });
      });

    } catch (error) {
      console.error('Error showing final report:', error);
      const reportContent = document.getElementById('report-content');
      if (reportContent) {
        reportContent.innerHTML = `
          <div style="text-align: center; padding: 48px 24px; color: #dc2626;">
            <h3>Failed to display report</h3>
            <p>${error.message}</p>
            <p><small>Stack: ${error.stack?.substring(0, 200)}...</small></p>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        `;
      }
    }
  }

  // Fallback checkout loading
  fallbackCheckoutLoad() {
    console.log('🔄 Using fallback checkout load method');
    alert('Please refresh the page and try again, or contact support if the issue persists.');
  }

  // Setup overlay behaviors
  setupOverlayBehaviors() {
    // FIXED: Listen for unlock events to update UI dynamically
    const checkUnlockStatus = () => {
      const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
      
      // Hide unlock button in header
      const unlockBtn = document.getElementById('unlock-full-report');
      if (isUnlocked && unlockBtn) {
        unlockBtn.style.display = 'none';
        console.log('🔓 Report unlocked - hiding unlock button');
      }
      
      // FIXED: Hide unlock buttons in final summary section
      const summaryUnlockBtns = document.querySelectorAll('.summary-action-btn.primary');
      summaryUnlockBtns.forEach(btn => {
        if (isUnlocked && (btn.textContent.includes('Unlock') || btn.innerHTML.includes('unlock'))) {
          btn.style.display = 'none';
          console.log('🔓 Report unlocked - hiding summary unlock button');
        }
      });
      
      // FIXED: Update all unlock buttons in the report
      const allUnlockBtns = document.querySelectorAll('button[onclick*="openCheckout"], .unlock-btn');
      allUnlockBtns.forEach(btn => {
        if (isUnlocked) {
          btn.style.display = 'none';
          console.log('🔓 Report unlocked - hiding unlock button:', btn.id || btn.className);
        }
      });
    };
    
    // Check initially
    checkUnlockStatus();
    
    // FIXED: Listen for storage changes (when unlock happens in popup)
    window.addEventListener('storage', (e) => {
      if (e.key === 'landingfix_unlocked' && e.newValue === 'true') {
        console.log('🔓 Unlock detected via storage event');
        checkUnlockStatus();
        
        // FIXED: Re-setup buttons with new unlock status
        setTimeout(() => {
          this.setupButtonsAfterScores();
        }, 500);
      }
    });
    
    // FIXED: Also check periodically for unlock status changes
    const unlockCheckInterval = setInterval(() => {
      const wasUnlocked = this._lastUnlockStatus;
      const isUnlocked = localStorage.getItem('landingfix_unlocked') === 'true';
      
      if (wasUnlocked !== isUnlocked && isUnlocked) {
        console.log('🔓 Unlock detected via periodic check');
        checkUnlockStatus();
        
        // FIXED: Re-setup buttons with new unlock status
        setTimeout(() => {
          this.setupButtonsAfterScores();
        }, 500);
        
        clearInterval(unlockCheckInterval); // Stop checking once unlocked
      }
      
      this._lastUnlockStatus = isUnlocked;
    }, 1000);
    
    console.log('✅ Overlay behaviors set up with unlock monitoring');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const reportLoader = new ReportLoader();
  reportLoader.init();
});

// Make ReportLoader globally accessible for debugging
window.ReportLoader = ReportLoader;

console.log('✅ Progressive report loading system initialized');