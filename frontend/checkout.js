function setupCheckout() {
  // --- CONFIG ---
  const EUR_PRICE = 20.00;
  const USD_PRICE = 22.68;
  const COUPONS = {
    'SCONTO100ADMIN': { discount: 1.0, msg: 'Coupon applied: 100% off!' },
    'TRY5':  { discount: 0.75, msg: 'Try LandingFix AI: only €5 (~$5.50)!' },
    'TRY10': { discount: 0.5, msg: 'Special offer: only €10 (~$11.34)!' },
    'TESTGWSTRIPE':  { discount: 0.95, msg: 'Amazing deal: only €1 (~$1.13)!' }
  };

  let currentEur = EUR_PRICE;
  let currentUsd = USD_PRICE;
  let stripe = null;
  let cardElement = null;

  // --- URL dinamico dal report ---
  const url = localStorage.getItem('landingfix_report_data')
    ? JSON.parse(localStorage.getItem('landingfix_report_data')).url
    : '';
  if (document.getElementById('checkout-url')) {
    document.getElementById('checkout-url').textContent = url;
  }


  function showError(message) {
    // Remove any existing error
    const existingError = document.querySelector('.billing-error');
    if (existingError) existingError.remove();

    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'billing-error';
    errorDiv.style.cssText = `
      background: #fed7d7;
      color: #c53030;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 0.9em;
      border-left: 4px solid #e53e3e;
    `;
    errorDiv.innerHTML = `<i class="fa fa-exclamation-triangle" style="margin-right: 8px;"></i>${message}`;

    // Insert before payment section
    const paymentSection = document.getElementById('payment-section');
    paymentSection.parentNode.insertBefore(errorDiv, paymentSection);

    // Remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) errorDiv.remove();
    }, 5000);
  }

      function getBillingData() {
    return {
      firstName: document.getElementById('billing-first-name')?.value?.trim() || '',
      lastName: document.getElementById('billing-last-name')?.value?.trim() || '',
      email: document.getElementById('billing-email')?.value?.trim() || '',
      company: document.getElementById('billing-company')?.value?.trim() || '',
      address: document.getElementById('billing-address')?.value?.trim() || '',
      city: document.getElementById('billing-city')?.value?.trim() || '',
      postal: document.getElementById('billing-postal')?.value?.trim() || '',
      country: document.getElementById('billing-country')?.value?.trim() || '',
      state: document.getElementById('billing-state')?.value?.trim() || '',
      phone: document.getElementById('billing-phone')?.value?.trim() || ''
    };
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- Update Prices with Payment Method Visibility ---
  function updatePrices() {
    document.getElementById('checkout-eur').textContent = `€${currentEur.toFixed(2)}`;
    document.getElementById('checkout-usd').textContent = `(~$${currentUsd.toFixed(2)})`;
    
    const paymentSection = document.getElementById('payment-section');
    const unlockFreeBtn = document.getElementById('unlock-free-btn');
    
    if (currentEur === 0) {
      if (paymentSection) paymentSection.style.display = 'none';
      if (unlockFreeBtn) unlockFreeBtn.style.display = 'block';
      console.log('✅ Price is €0 - showing free unlock button');
    } else {
      if (paymentSection) paymentSection.style.display = 'block';
      if (unlockFreeBtn) unlockFreeBtn.style.display = 'none';
      updateStripeSubmitButton();
      console.log('✅ Price is €' + currentEur + ' - showing payment options');
    }
  }

// --- Load Stripe with Elements and Card Detection ---
async function loadStripe() {
  if (stripe && cardElement) return stripe;
  
  try {
    const response = await fetch('https://landingfixv1-2.onrender.com/api/stripe-public-key');
    const data = await response.json();
    
    if (!data.publicKey) {
      console.error('Stripe public key not found');
      return null;
    }
    
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      document.head.appendChild(script);
      
      await new Promise(resolve => {
        script.onload = resolve;
      });
    }
    
    stripe = Stripe(data.publicKey);
    
    const elements = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#667eea',
          colorBackground: '#ffffff',
          colorText: '#1a202c',
          colorDanger: '#e53e3e',
          fontFamily: 'Inter, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px'
        }
      }
    });
    
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#1a202c',
          '::placeholder': {
            color: '#6c757d',
          },
        },
      },
    });
    
    cardElement.mount('#stripe-card-element');
    
    // ✅ AGGIUNGI QUI LA LOGICA PER MOSTRARE I CAMPI DI FATTURAZIONE
    cardElement.on('change', ({error, complete, elementType}) => {
      const cardErrors = document.getElementById('card-errors');
      if (error) {
        if (cardErrors) cardErrors.textContent = error.message;
      } else {
        if (cardErrors) cardErrors.textContent = '';
      }
      
      // 🎯 MOSTRA I CAMPI DI FATTURAZIONE QUANDO L'UTENTE INIZIA A DIGITARE
      showBillingFieldsOnCardInput();
    });
    
    // Anche quando l'elemento ottiene il focus
    cardElement.on('focus', () => {
      showBillingFieldsOnCardInput();
    });
    
    console.log('Stripe Elements loaded successfully');
    return stripe;
    
  } catch (error) {
    console.error('Failed to load Stripe:', error);
    return null;
  }
}

// ✅ NUOVA FUNZIONE PER MOSTRARE I CAMPI DI FATTURAZIONE
function showBillingFieldsOnCardInput() {
  const billingSection = document.getElementById('billing-section');
  if (!billingSection) return;
  
  // Se già visibili, non fare nulla
  if (billingSection.style.display === 'block') return;
  
  console.log('🎯 Card input detected - showing billing fields');
  
  // Mostra la sezione con animazione smooth
  billingSection.style.display = 'block';
  
  // Forza reflow per garantire che la transizione funzioni
  billingSection.offsetHeight;
  
  // Applica l'animazione di fade-in
  billingSection.style.opacity = '1';
  billingSection.style.transform = 'translateY(0)';
  
  // Scroll smooth verso i campi di fatturazione
  setTimeout(() => {
    billingSection.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, 100);
  
  // Aggiungi una notifica gentile
  showBillingNotification();
}

// ✅ NOTIFICA GENTILE PER GUIDARE L'UTENTE
function showBillingNotification() {
  // Evita di mostrare più volte
  if (document.querySelector('.billing-notification')) return;
  
  const notification = document.createElement('div');
  notification.className = 'billing-notification';
  notification.style.cssText = `
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 0.9em;
    animation: slideInFromTop 0.5s ease-out;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(102,126,234,0.3);
  `;
  
  notification.innerHTML = `
    <i class="fa fa-info-circle" style="font-size: 1.1em;"></i>
    <span>Please fill in your billing information below to complete the purchase.</span>
  `;
  
  // Inserisci prima del primo campo
  const billingSection = document.getElementById('billing-section');
  const firstField = billingSection.querySelector('div');
  billingSection.insertBefore(notification, firstField);
  
  // Rimuovi dopo 8 secondi
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutToTop 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 8000);
}

function validateBillingInfo() {
  const billingSection = document.getElementById('billing-section');
  
  // Se i campi non sono ancora visibili, non validare
  if (!billingSection || billingSection.style.display === 'none') {
    showError('Please enter your card information first.');
    return false;
  }
  
  const fields = [
    { id: 'billing-first-name', label: 'First Name' },
    { id: 'billing-last-name', label: 'Last Name' },
    { id: 'billing-email', label: 'Email Address' },
    { id: 'billing-address', label: 'Address' },
    { id: 'billing-city', label: 'City' },
    { id: 'billing-postal', label: 'ZIP/Postal Code' },
    { id: 'billing-country', label: 'Country' }
  ];

  let isValid = true;
  const missingFields = [];

  // Reset all field styles
  fields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      element.style.borderColor = '#e2e8f0';
      element.style.boxShadow = 'none';
    }
  });

  // Check each required field
  fields.forEach(field => {
    const element = document.getElementById(field.id);
    const value = element?.value?.trim() || '';
    
    if (!value) {
      isValid = false;
      missingFields.push(field.label);
      
      // Highlight missing field
      if (element) {
        element.style.borderColor = '#e53e3e';
        element.style.boxShadow = '0 0 0 3px rgba(229,62,62,0.1)';
        
        // Add shake animation
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          if (element) element.style.animation = '';
        }, 500);
      }
    }
  });

  // Check email format
  const emailField = document.getElementById('billing-email');
  const email = emailField?.value?.trim() || '';
  if (email && !isValidEmail(email)) {
    isValid = false;
    emailField.style.borderColor = '#e53e3e';
    emailField.style.boxShadow = '0 0 0 3px rgba(229,62,62,0.1)';
    showError('Please enter a valid email address.');
    return false;
  }

  // Check postal code format (basic validation)
  const postalField = document.getElementById('billing-postal');
  const postal = postalField?.value?.trim() || '';
  if (postal && postal.length < 3) {
    isValid = false;
    postalField.style.borderColor = '#e53e3e';
    postalField.style.boxShadow = '0 0 0 3px rgba(229,62,62,0.1)';
    showError('Please enter a valid postal code.');
    return false;
  }

  if (!isValid) {
    showError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
    
    // Scroll to billing section
    const billingSection = document.getElementById('billing-section');
    if (billingSection) {
      billingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return false;
  }

  return true;
}


  // --- Payment Method Switcher ---
  function setupPaymentSwitcher() {
    const stripeTab = document.getElementById('stripe-tab');
    const paypalTab = document.getElementById('paypal-tab');
    const stripePayment = document.getElementById('stripe-payment');
    const paypalPayment = document.getElementById('paypal-payment');

    stripeTab.addEventListener('click', () => {
      stripeTab.classList.add('active');
      paypalTab.classList.remove('active');
      stripePayment.classList.add('active');
      paypalPayment.classList.remove('active');
      stripePayment.style.display = 'block';
      paypalPayment.style.display = 'none';
    });

    paypalTab.addEventListener('click', () => {
      paypalTab.classList.add('active');
      stripeTab.classList.remove('active');
      paypalPayment.classList.add('active');
      stripePayment.classList.remove('active');
      paypalPayment.style.display = 'block';
      stripePayment.style.display = 'none';
      
      loadPaypalSdkAndRender();
    });
  }

  // --- Update Stripe Submit Button ---
  function updateStripeSubmitButton() {
    const submitText = document.getElementById('stripe-submit-text');
    if (submitText) {
      submitText.textContent = `Pay €${currentEur.toFixed(2)}`;
    }
  }

  // --- Stripe Payment Handler with Customer Creation ---
  async function handleStripePayment() {
    if (!stripe || !cardElement) {
      console.error('Stripe not properly initialized');
      return;
    }

    // Validate billing info first
    if (!validateBillingInfo()) {
      return;
    }

    const submitButton = document.getElementById('stripe-submit');
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

    try {
      const billingData = getBillingData();
      
      console.log('🔄 Creating payment intent with customer for:', billingData.email, 'Amount:', currentEur);
      
      // Create payment intent with customer
      const response = await fetch('https://landingfixv1-2.onrender.com/api/create-payment-intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
                body: JSON.stringify({
          amount: Math.round(currentEur * 100),
          currency: 'eur',
          customerData: {
            email: billingData.email,
            name: `${billingData.firstName} ${billingData.lastName}`,
            company: billingData.company,
            phone: billingData.phone,
            address: {
              line1: billingData.address,
              city: billingData.city,
              postal_code: billingData.postal,
              country: billingData.country,
              state: billingData.state
            }
          },
          metadata: {
            product: 'LandingFix AI Report',
            website: url || 'Unknown',
            customer_first_name: billingData.firstName,
            customer_last_name: billingData.lastName,
            customer_company: billingData.company,
            customer_country: billingData.country,
            customer_city: billingData.city,
            customer_postal: billingData.postal
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const { clientSecret, customerId } = await response.json();

      // Confirm payment with billing details
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
          card: cardElement,
          billing_details: {
            name: `${billingData.firstName} ${billingData.lastName}`,
            email: billingData.email,
            phone: billingData.phone || undefined,
            address: {
              line1: billingData.address,
              city: billingData.city,
              postal_code: billingData.postal,
              country: billingData.country,
              state: billingData.state || undefined
            }
          }
        }
      });

      if (error) {
        console.error('Stripe payment failed:', error);
        showError('Payment failed: ' + error.message);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('✅ Stripe payment succeeded');
        
        // Show success modal with payment details
        showPaymentSuccess({
          method: 'Stripe',
          amount: currentEur,
          currency: 'EUR',
          email: billingData.email,
          name: `${billingData.firstName} ${billingData.lastName}`,
          transactionId: paymentIntent.id,
          customerId: customerId
        });

        // Track purchase
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', { 
            value: currentEur, 
            currency: 'EUR',
            content_name: 'LandingFix AI Report'
          });
        }
        if (typeof gtag === 'function') {
          gtag('event', 'purchase', { 
            value: currentEur, 
            currency: 'EUR', 
            transaction_id: paymentIntent.id,
            items: [{
              item_id: 'landingfix-ai-report',
              item_name: 'LandingFix AI Report',
              category: 'Digital Product',
              quantity: 1,
              price: currentEur
            }]
          });
        }
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      showError('Payment failed. Please try again or contact support.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }

  // --- Show Payment Success Modal ---
  function showPaymentSuccess(paymentData) {
    closeCheckoutPopup();
    
    const modal = document.getElementById('payment-success-modal');
    const paymentInfo = document.getElementById('payment-info');
    
    // Update payment details
    paymentInfo.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>Amount:</strong> €${paymentData.amount.toFixed(2)} ${paymentData.currency}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Payment Method:</strong> ${paymentData.method}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Email:</strong> ${paymentData.email}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Customer:</strong> ${paymentData.name}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Transaction ID:</strong> ${paymentData.transactionId}
      </div>
      <div style="font-size: 0.85em; color: #666; margin-top: 12px;">
        <i class="fa fa-info-circle" style="margin-right: 4px;"></i>
        A receipt has been sent to your email address.
      </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    
        // Setup buttons
    document.getElementById('view-report-btn').onclick = function() {
      modal.style.display = 'none';
      unlockFullReport();
    };
    
    // Auto-unlock after 3 seconds if no action
    setTimeout(() => {
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        unlockFullReport();
      }
    }, 10000);
  }

  // --- Coupon Handler ---
  function handleCouponApply() {
    const code = couponInput.value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');
    
    if (code === 'TRY5' && window.otoExpired) {
      msg.textContent = "The TRY5 offer has expired!";
      msg.style.color = "#e53e3e";
      msg.style.display = "block";
      return;
    }
    
    if (COUPONS[code]) {
      currentEur = EUR_PRICE * (1 - COUPONS[code].discount);
      currentUsd = USD_PRICE * (1 - COUPONS[code].discount);
      msg.textContent = COUPONS[code].msg;
      msg.style.color = "#48bb78";
      msg.style.display = "block";
      
      console.log(`✅ Coupon applied: ${code}, new price: €${currentEur}`);
      
      updatePrices();
      
      if (currentEur > 0) {
        renderPaypalButton();
      }
      
    } else if (code) {
      currentEur = EUR_PRICE;
      currentUsd = USD_PRICE;
      msg.textContent = "Invalid coupon code.";
      msg.style.color = "#e53e3e";
      msg.style.display = "block";
      updatePrices();
      renderPaypalButton();
    } else {
      currentEur = EUR_PRICE;
      currentUsd = USD_PRICE;
      msg.style.display = "none";
      updatePrices();
      renderPaypalButton();
    }
  }

  // Setup coupon input
  const applyCouponBtn = document.getElementById('apply-coupon');
  const couponInput = document.getElementById('coupon-input');
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.onclick = handleCouponApply;
    couponInput.addEventListener('keydown', function(e) {
      if (e.key === "Enter") {
        handleCouponApply();
      }
    });
  }

  // --- Setup Event Listeners ---
  const stripeSubmitBtn = document.getElementById('stripe-submit');
  if (stripeSubmitBtn) {
    stripeSubmitBtn.addEventListener('click', handleStripePayment);
  }

  const unlockFreeBtn = document.getElementById('unlock-free-btn');
  if (unlockFreeBtn) {
    unlockFreeBtn.onclick = function() {
      closeCheckoutPopup();
      unlockFullReport();
    };
  }

  // --- PayPal with Enhanced Success Handling ---
  function renderPaypalButton() {
    const paypalContainer = document.getElementById('paypal-button-container');
    if (!paypalContainer) {
      console.error('PayPal container not found');
      return;
    }
    
    paypalContainer.innerHTML = '';
    
    if (currentEur === 0) {
      console.log('Price is 0, hiding PayPal buttons');
      return;
    }

    if (!window.paypal) {
      console.log('PayPal SDK not loaded yet');
      return;
    }

    console.log('Rendering PayPal buttons for amount:', currentEur);

    try {
      if (!document.body.contains(paypalContainer)) {
        console.log('PayPal container no longer in DOM, skipping render');
        return;
      }

      paypal.Buttons({
        style: { 
          layout: 'vertical', 
          color: 'blue', 
          shape: 'pill', 
          label: 'pay', 
          height: 40 
        },
        createOrder: function(data, actions) {
          console.log('Creating PayPal order for:', currentEur, 'EUR');
          return actions.order.create({
            purchase_units: [{
              amount: { 
                value: currentEur.toFixed(2), 
                currency_code: 'EUR' 
              },
              description: 'LandingFix AI Report',
              shipping_preference: 'NO_SHIPPING'
            }]
          });
        },
        onApprove: function(data, actions) {
          console.log('PayPal payment approved:', data);
          return actions.order.capture().then(function(details) {
            console.log('✅ PayPal payment captured:', details);
            
            // Get billing data for PayPal (optional since PayPal handles this)
            const billingData = getBillingData();
            
            // Show success modal
            showPaymentSuccess({
              method: 'PayPal',
              amount: currentEur,
              currency: 'EUR',
              email: details.payer.email_address || billingData.email || 'PayPal User',
              name: details.payer.name ? 
                    `${details.payer.name.given_name} ${details.payer.name.surname}` : 
                    `${billingData.firstName} ${billingData.lastName}` || 'PayPal Customer',
              transactionId: details.id,
              paypalDetails: details
            });

            // Track purchase
            if (typeof fbq === 'function') {
              fbq('track', 'Purchase', { 
                value: currentEur, 
                currency: 'EUR',
                content_name: 'LandingFix AI Report'
              });
            }
            if (typeof gtag === 'function') {
              gtag('event', 'purchase', { 
                value: currentEur, 
                currency: 'EUR', 
                transaction_id: details.id,
                items: [{
                  item_id: 'landingfix-ai-report',
                  item_name: 'LandingFix AI Report',
                  category: 'Digital Product',
                  quantity: 1,
                  price: currentEur
                }]
              });
            }
          });
        },
        onError: function(err) {
          console.error('PayPal error:', err);
          showError('PayPal payment failed. Please try again or use a different payment method.');
        },
        onCancel: function(data) {
          console.log('PayPal payment cancelled:', data);
        }
      }).render('#paypal-button-container').catch(function(err) {
        console.error('PayPal render error:', err);
      });
      
      console.log('PayPal buttons rendered successfully');
      
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
    }
  }

  // --- Carica PayPal SDK ---
  function loadPaypalSdkAndRender() {
    if (currentEur === 0) {
      console.log('Price is 0, not loading PayPal SDK');
      return;
    }
    
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      console.log('PayPal SDK already loaded');
      if (window.paypal) {
        renderPaypalButton();
      } else {
        setTimeout(() => {
          if (window.paypal) {
            renderPaypalButton();
          }
        }, 500);
      }
      return;
    }
    
    console.log('Loading PayPal SDK...');
    
    fetch('https://landingfixv1-2.onrender.com/api/paypal-client-id')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        console.log('PayPal client ID received:', data.clientId ? 'Yes' : 'No');
        
        if (!data.clientId) {
          console.error('PayPal clientId missing!');
          return;
        }
        
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=EUR`;
        script.onload = () => {
          console.log('✅ PayPal SDK loaded successfully');
          setTimeout(() => {
            renderPaypalButton();
          }, 200);
        };
        script.onerror = (err) => {
          console.error('❌ Failed to load PayPal SDK:', err);
        };
        document.head.appendChild(script);
      })
      .catch(err => {
        console.error('❌ Error fetching PayPal client ID:', err);
      });
  }

  // Call initialization functions
  updatePrices();
  setupPaymentSwitcher();
  loadStripe();
  loadPaypalSdkAndRender();
}

// Resto delle funzioni invariato...
function closeCheckoutPopup() {
  console.log('closeCheckoutPopup called');
  const popup = document.getElementById('checkout-popup');
  if (popup) {
    popup.style.display = 'none';
    console.log('Popup hidden');
  }
  if (window.otoTimerInterval) {
    clearInterval(window.otoTimerInterval);
    console.log('Timer cleared');
  }
}

function unlockFullReport() {
  console.log('🔓 Unlocking full report...');
  
  localStorage.setItem('landingfix_unlocked', 'true');
  
  const lockedCategories = document.querySelectorAll('.report-category.locked');
  lockedCategories.forEach(category => {
    category.classList.remove('locked');
    
    const overlay = category.querySelector('.locked-overlay');
    if (overlay) overlay.remove();
    
    const elements = category.querySelector('.category-elements');
    if (elements) {
      elements.style.filter = 'none';
      elements.style.pointerEvents = 'auto';
      elements.style.userSelect = 'auto';
      elements.style.opacity = '1';
    }
  });
  
  const mainUnlockBtn = document.getElementById('unlock-full-report');
  if (mainUnlockBtn) {
    mainUnlockBtn.style.display = 'none';
    console.log('✅ Main unlock button hidden');
  }
  
  const successMessage = document.createElement('div');
  successMessage.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 10000; 
                background: linear-gradient(135deg, #48bb78, #38a169); 
                color: white; padding: 16px 24px; border-radius: 12px; 
                box-shadow: 0 8px 32px rgba(72,187,120,0.3);
                font-family: Inter, sans-serif; font-weight: 600;">
      <i class="fa fa-check-circle" style="margin-right: 8px;"></i>
      Report unlocked successfully! 🎉
    </div>
  `;
  document.body.appendChild(successMessage);
  
  setTimeout(() => {
    successMessage.remove();
  }, 4000);
  
  console.log('✅ Report unlocked successfully');
}

window.openCheckout = function() {
  const popup = document.getElementById('checkout-popup');
  if (!popup) {
    console.error('Checkout popup not found');
    return;
  }
  
  console.log('Opening checkout popup');
  popup.style.display = 'flex';
  
  setupCheckout();
  
  setTimeout(() => {
    startOtoCountdown();
  }, 100);

  setTimeout(() => {
    const closeBtn = document.getElementById('close-popup');
    if (closeBtn) {
      console.log('Setting up close button');
      
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      newCloseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Close button clicked');
        closeCheckoutPopup();
      });
      
      newCloseBtn.onmousedown = function(e) {
        e.preventDefault();
        console.log('✅ Mouse down on close button');
        closeCheckoutPopup();
      };
      
    } else {
      console.error('❌ Close button not found in DOM');
    }
    
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        console.log('Clicked outside popup');
        closeCheckoutPopup();
      }
    });
    
  }, 300);

  const escHandler = function(e) {
    if (e.key === "Escape") {
      console.log('ESC key pressed');
      closeCheckoutPopup();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
};

function startOtoCountdown() {
  const timerElement = document.getElementById('oto-timer');
  if (!timerElement) {
    console.warn('Timer element not found');
    return;
  }

  console.log('✅ Starting OTO countdown timer');
  
  const duration = 5 * 60;
  let timeLeft = duration;

  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(window.otoTimerInterval);
      window.otoExpired = true;
      timerElement.textContent = "00:00";
      
      const offer = document.getElementById('oto-offer');
      if (offer) {
        offer.style.opacity = '0.6';
        offer.style.filter = 'grayscale(1)';
      }
      
      console.log('⏰ Timer expired - TRY5 offer disabled');
    } else {
      timeLeft--;
    }
  }

  window.otoExpired = false;
  
  if (window.otoTimerInterval) {
    clearInterval(window.otoTimerInterval);
  }
  
  updateTimer();
  window.otoTimerInterval = setInterval(updateTimer, 1000);
  
  console.log('✅ Timer started successfully');
}

if (window.history.state && window.history.state.checkoutPopup) {
  window.openCheckout();
}

window.addEventListener('popstate', function(event) {
  if (event.state && event.state.checkoutPopup) {
    window.openCheckout();
  }
});

window.history.replaceState({ checkoutPopup: true }, '');