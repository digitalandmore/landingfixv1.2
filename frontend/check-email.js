// Email Validation System for LandingFix AI
// Realistic email validation to prevent invalid data from reaching Brevo

/**
 * Validates email format using comprehensive regex
 * @param {string} email - The email to validate
 * @returns {Object} Validation result
 */
function validateEmailFormat(email) {
  console.log('🔍 Validating email format:', email?.substring(0, 20) + '...');
  
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'EMAIL_REQUIRED',
      message: 'Email is required',
      userMessage: 'Please enter your email address',
      shouldBlock: true
    };
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return {
      valid: false,
      error: 'EMAIL_EMPTY',
      message: 'Email cannot be empty',
      userMessage: 'Please enter your email address',
      shouldBlock: true
    };
  }
  
  // Check for basic structure
  if (!trimmedEmail.includes('@')) {
    return {
      valid: false,
      error: 'MISSING_AT_SYMBOL',
      message: 'Email must contain @ symbol',
      userMessage: 'Please enter a valid email address with @ symbol',
      shouldBlock: true
    };
  }
  
  // Check for multiple @ symbols
  if ((trimmedEmail.match(/@/g) || []).length > 1) {
    return {
      valid: false,
      error: 'MULTIPLE_AT_SYMBOLS',
      message: 'Email contains multiple @ symbols',
      userMessage: 'Please enter a valid email address',
      shouldBlock: true
    };
  }
  
  // Comprehensive email regex (RFC 5322 compliant but practical)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'INVALID_FORMAT',
      message: 'Email format is invalid',
      userMessage: 'Please enter a valid email address (e.g., user@example.com)',
      shouldBlock: true
    };
  }
  
  return {
    valid: true,
    email: trimmedEmail,
    shouldBlock: false
  };
}

/**
 * Returns list of known temporary/disposable email providers
 * @returns {Array} List of disposable email domains
 */
function getDisposableEmailDomains() {
  return [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'maildrop.cc',
    'yopmail.com',
    'temp-mail.org',
    'throwaway.email'
  ];
}

/**
 * Returns list of common misspellings of popular email providers
 * @returns {Object} Map of misspellings to correct domains
 */
function getEmailTypoCorrections() {
  return {
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outlook.co': 'outlook.com'
  };
}

/**
 * Checks if email uses a disposable/temporary email service
 * @param {string} email - The email to check
 * @returns {Object} Check result
 */
function checkDisposableEmail(email) {
  try {
    const domain = email.split('@')[1].toLowerCase();
    const disposableDomains = getDisposableEmailDomains();
    
    const isDisposable = disposableDomains.includes(domain);
    
    if (isDisposable) {
      console.log('⚠️ Disposable email detected:', domain);
      return {
        isDisposable: true,
        domain: domain,
        warning: true,
        message: 'Disposable email detected',
        userMessage: `${domain} is a temporary email service. Please use a permanent email address for better service.`,
        shouldBlock: false
      };
    }
    
    return { isDisposable: false };
  } catch (err) {
    console.error('Error checking disposable email:', err);
    return { isDisposable: false };
  }
}

/**
 * Suggests corrections for common email typos
 * @param {string} email - The email to check
 * @returns {Object} Suggestion result
 */
function suggestEmailCorrection(email) {
  try {
    const [localPart, domain] = email.split('@');
    const typoCorrections = getEmailTypoCorrections();
    
    if (typoCorrections[domain.toLowerCase()]) {
      const suggestedDomain = typoCorrections[domain.toLowerCase()];
      const suggestedEmail = `${localPart}@${suggestedDomain}`;
      
      console.log('💡 Email typo correction suggested:', {
        original: email,
        suggested: suggestedEmail
      });
      
      return {
        hasSuggestion: true,
        originalEmail: email,
        suggestedEmail: suggestedEmail,
        message: `Did you mean ${suggestedEmail}?`,
        shouldBlock: false
      };
    }
    
    return { hasSuggestion: false };
  } catch (err) {
    console.error('Error checking email typos:', err);
    return { hasSuggestion: false };
  }
}

/**
 * Frontend-compatible email validation with user-friendly messages
 * @param {string} email - The email to validate
 * @param {HTMLElement} container - Container to show messages
 * @returns {Object} Validation result
 */
function validateEmailForFrontend(email, container) {
  console.log('🔍 Frontend email validation:', email?.substring(0, 20) + '...');
  
  // Clear previous messages
  if (container) {
    const existingMsg = container.querySelector('.email-validation-message');
    if (existingMsg) {
      existingMsg.remove();
    }
  }
  
  // Step 1: Basic format validation
  const formatValidation = validateEmailFormat(email);
  if (!formatValidation.valid) {
    showEmailValidationMessage(formatValidation, container);
    return { valid: false, shouldBlock: true };
  }
  
  const validatedEmail = formatValidation.email;
  
  // Step 2: Check for disposable email (warning only)
  const disposableCheck = checkDisposableEmail(validatedEmail);
  if (disposableCheck.isDisposable) {
    showEmailValidationMessage(disposableCheck, container);
    return { valid: true, email: validatedEmail.toLowerCase(), shouldBlock: false, warning: true };
  }
  
  // Step 3: Check for typos and suggest corrections
  const typoCheck = suggestEmailCorrection(validatedEmail);
  if (typoCheck.hasSuggestion) {
    showEmailValidationMessage(typoCheck, container);
    return { valid: true, email: validatedEmail.toLowerCase(), shouldBlock: false, suggestion: true };
  }
  
  return {
    valid: true,
    email: validatedEmail.toLowerCase(),
    shouldBlock: false
  };
}

/**
 * Shows user-friendly email validation messages
 * @param {Object} validation - Validation result
 * @param {HTMLElement} container - Container to show message in
 */
function showEmailValidationMessage(validation, container) {
  if (!container) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'email-validation-message';
  
  if (validation.hasSuggestion) {
    messageDiv.innerHTML = `
      <div class="email-suggestion">
        <div class="suggestion-header">
          <i class="fas fa-lightbulb"></i>
          <strong>Did you mean?</strong>
        </div>
        <p>${validation.message}</p>
        <div class="suggestion-actions">
          <button type="button" class="btn-use-suggestion" onclick="
            document.getElementById('userEmail').value = '${validation.suggestedEmail}';
            this.closest('.email-validation-message').remove();
          ">
            Use ${validation.suggestedEmail}
          </button>
          <button type="button" class="btn-keep-original" onclick="this.closest('.email-validation-message').remove()">
            Keep Original
          </button>
        </div>
      </div>
    `;
  } else if (validation.warning) {
    messageDiv.innerHTML = `
      <div class="email-warning">
        <div class="warning-header">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Warning</strong>
        </div>
        <p>${validation.userMessage}</p>
        <div class="warning-actions">
          <button type="button" class="btn-continue" onclick="this.closest('.email-validation-message').remove()">
            Continue Anyway
          </button>
          <button type="button" class="btn-change" onclick="document.getElementById('userEmail').focus(); this.closest('.email-validation-message').remove()">
            Use Different Email
          </button>
        </div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="email-error">
        <div class="error-header">
          <i class="fas fa-times-circle"></i>
          <strong>Invalid Email</strong>
        </div>
        <p>${validation.userMessage}</p>
      </div>
    `;
  }
  
  container.appendChild(messageDiv);
  addEmailValidationStyles();
  
  // Focus email input for errors
  if (!validation.warning && !validation.hasSuggestion) {
    setTimeout(() => {
      const emailInput = document.getElementById('userEmail');
      if (emailInput) emailInput.focus();
    }, 100);
  }
}

/**
 * Adds CSS styles for email validation messages
 */
function addEmailValidationStyles() {
  if (document.getElementById('email-validation-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'email-validation-styles';
  styles.textContent = `
    .email-validation-message {
      margin: 1rem 0;
      animation: slideIn 0.3s ease-out;
    }
    
    .email-error, .email-warning, .email-suggestion {
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid;
    }
    
    .email-error {
      background: #fff5f5;
      border-color: #e53e3e;
      color: #742a2a;
    }
    
    .email-warning {
      background: #fffaf0;
      border-color: #dd6b20;
      color: #744210;
    }
    
    .email-suggestion {
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
    
    .btn-use-suggestion, .btn-keep-original, .btn-continue, .btn-change {
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
    
    .btn-use-suggestion:hover, .btn-continue:hover {
      background: #3182ce;
    }
    
    .btn-keep-original, .btn-change {
      background: #718096;
    }
    
    .btn-keep-original:hover, .btn-change:hover {
      background: #4a5568;
    }
    
    .suggestion-actions, .warning-actions {
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