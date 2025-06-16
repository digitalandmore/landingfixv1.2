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

  // --- Update Prices with Payment Method Visibility ---
  function updatePrices() {
    document.getElementById('checkout-eur').textContent = `€${currentEur.toFixed(2)}`;
    document.getElementById('checkout-usd').textContent = `(~$${currentUsd.toFixed(2)})`;
    
    const paymentSection = document.getElementById('payment-section');
    const unlockFreeBtn = document.getElementById('unlock-free-btn');
    
    if (currentEur === 0) {
      // Hide all payment methods, show free unlock
      if (paymentSection) paymentSection.style.display = 'none';
      if (unlockFreeBtn) unlockFreeBtn.style.display = 'block';
      console.log('✅ Price is €0 - showing free unlock button');
    } else {
      // Show payment methods, hide free unlock
      if (paymentSection) paymentSection.style.display = 'block';
      if (unlockFreeBtn) unlockFreeBtn.style.display = 'none';
      updateStripeSubmitButton();
      console.log('✅ Price is €' + currentEur + ' - showing payment options');
    }
  }

  // --- Load Stripe with Elements ---
  async function loadStripe() {
    if (stripe && cardElement) return stripe;
    
    try {
      const response = await fetch('http://localhost:3002/api/stripe-public-key');
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
      
      // Create card element
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
      
      // Handle real-time validation errors from the card Element
      cardElement.on('change', ({error}) => {
        const cardErrors = document.getElementById('card-errors');
        if (error) {
          if (cardErrors) cardErrors.textContent = error.message;
        } else {
          if (cardErrors) cardErrors.textContent = '';
        }
      });
      
      console.log('Stripe Elements loaded successfully');
      return stripe;
      
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      return null;
    }
  }

  // --- Payment Method Switcher ---
  function setupPaymentSwitcher() {
    const stripeTab = document.getElementById('stripe-tab');
    const paypalTab = document.getElementById('paypal-tab');
    const stripePayment = document.getElementById('stripe-payment');
    const paypalPayment = document.getElementById('paypal-payment');

    stripeTab.addEventListener('click', () => {
      // Switch to Stripe
      stripeTab.classList.add('active');
      paypalTab.classList.remove('active');
      stripePayment.classList.add('active');
      paypalPayment.classList.remove('active');
      stripePayment.style.display = 'block';
      paypalPayment.style.display = 'none';
    });

    paypalTab.addEventListener('click', () => {
      // Switch to PayPal
      paypalTab.classList.add('active');
      stripeTab.classList.remove('active');
      paypalPayment.classList.add('active');
      stripePayment.classList.remove('active');
      paypalPayment.style.display = 'block';
      stripePayment.style.display = 'none';
      
      // Load PayPal if not already loaded
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

  // --- Stripe Payment Handler ---
  async function handleStripePayment() {
    if (!stripe || !cardElement) {
      console.error('Stripe not properly initialized');
      return;
    }

    const submitButton = document.getElementById('stripe-submit');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

    try {
      // Create payment intent
      const response = await fetch('http://localhost:3002/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(currentEur * 100),
          currency: 'eur'
        })
      });

      const { clientSecret } = await response.json();

      // Confirm payment with card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Stripe payment failed:', error);
        alert('Payment failed: ' + error.message);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Stripe payment succeeded');
        closeCheckoutPopup();
        unlockFullReport();

        // Track purchase
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', { value: currentEur, currency: 'EUR' });
        }
        if (typeof gtag === 'function') {
          gtag('event', 'purchase', { value: currentEur, currency: 'EUR' });
        }
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      // Reset button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
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
      
      // Force update prices immediately
      updatePrices();
      
      // Re-render PayPal for new amount (will hide if €0)
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

  // --- PayPal ---
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

    // Se PayPal SDK non è ancora caricato, non fare nulla
    if (!window.paypal) {
      console.log('PayPal SDK not loaded yet');
      return;
    }

    console.log('Rendering PayPal buttons for amount:', currentEur);

    try {
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
              shipping_preference: 'NO_SHIPPING'
            }]
          });
        },
        onApprove: function(data, actions) {
          console.log('PayPal payment approved:', data);
          return actions.order.capture().then(function(details) {
            console.log('PayPal payment captured:', details);
            closeCheckoutPopup();
            unlockFullReport();

            // Track purchase
            if (typeof fbq === 'function') {
              fbq('track', 'Purchase', { value: currentEur, currency: 'EUR' });
            }
            if (typeof gtag === 'function') {
              gtag('event', 'purchase', { value: currentEur, currency: 'EUR', transaction_id: details.id });
            }
          });
        },
        onError: function(err) {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
        }
      }).render('#paypal-button-container');
      
      console.log('PayPal buttons rendered successfully');
      
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
    }
  }

  // --- Render Payment Buttons ---
  function renderPaymentButtons() {
    const paymentContainer = document.getElementById('payment-buttons-container');
    if (!paymentContainer) return;

    paymentContainer.innerHTML = '';
    
    if (currentEur === 0) return;

    // Create payment options
    paymentContainer.innerHTML = `
      <div class="payment-options">
        <div class="payment-option">
          <h4 style="margin-bottom: 10px; color: #2c3e50;">Pay with PayPal</h4>
          <div id="paypal-button-container" style="min-height: 50px;"></div>
        </div>
        
        <div class="payment-divider" style="text-align: center; margin: 20px 0; color: #6c757d;">
          <span style="background: white; padding: 0 15px;">OR</span>
          <hr style="margin-top: -12px; border-color: #dee2e6;">
        </div>
        
        <div class="payment-option">
          <h4 style="margin-bottom: 10px; color: #2c3e50;">Pay with Card</h4>
          <div id="stripe-payment" style="display: block;">
            <div id="stripe-card-element" style="
              padding: 12px;
              border: 1px solid #ced4da;
              border-radius: 8px;
              margin-bottom: 10px;
              background: #f8f9fa;
              transition: border-color 0.3s ease;
            "></div>
            <div id="card-errors" style="color: #e53e3e; margin-bottom: 10px;"></div>
            <button id="stripe-submit" class="stripe-button" style="
              width: 100%;
              background: linear-gradient(135deg, #6772e5, #5469d4);
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              <i class="fa fa-credit-card" style="margin-right: 8px;"></i>
              <span id="stripe-submit-text">Pay €${currentEur.toFixed(2)} with Card</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Setup Stripe button
    const stripeButton = document.getElementById('stripe-submit');
    if (stripeButton) {
      stripeButton.addEventListener('click', handleStripePayment);
      stripeButton.addEventListener('mouseenter', function() {
        this.style.background = 'linear-gradient(135deg, #5469d4, #4f63d2)';
        this.style.transform = 'translateY(-1px)';
      });
      stripeButton.addEventListener('mouseleave', function() {
        this.style.background = 'linear-gradient(135deg, #6772e5, #5469d4)';
        this.style.transform = 'translateY(0)';
      });
    }

    // Render PayPal buttons
    renderPaypalButton();
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
        console.log('PayPal SDK script found but window.paypal not ready, waiting...');
        setTimeout(() => {
          if (window.paypal) {
            renderPaypalButton();
          } else {
            console.log('PayPal still not ready after 500ms, trying again...');
            setTimeout(() => {
              if (window.paypal) {
                renderPaypalButton();
              }
            }, 1000);
          }
        }, 500);
      }
      return;
    }
    
    console.log('Loading PayPal SDK...');
    
    fetch('http://localhost:3002/api/paypal-client-id')
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
          // Wait a bit for PayPal to fully initialize
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

// Funzione per chiudere il popup
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

// Funzione per sbloccare il report completo
function unlockFullReport() {
  console.log('🔓 Unlocking full report...');
  
  localStorage.setItem('landingfix_unlocked', 'true');
  
  // Remove locked state from categories
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
  
  // Hide the main unlock button in header
  const mainUnlockBtn = document.getElementById('unlock-full-report');
  if (mainUnlockBtn) {
    mainUnlockBtn.style.display = 'none';
    console.log('✅ Main unlock button hidden');
  }
  
  // Show success message
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

// Funzione globale per aprire il popup da report.html
window.openCheckout = function() {
  const popup = document.getElementById('checkout-popup');
  if (!popup) {
    console.error('Checkout popup not found');
    return;
  }
  
  console.log('Opening checkout popup');
  popup.style.display = 'flex';
  
  // Setup checkout first
  setupCheckout();
  
  // Start timer after a small delay to ensure DOM is ready
  setTimeout(() => {
    startOtoCountdown();
  }, 100);

  // FIXED: Proper close button setup
  setTimeout(() => {
    const closeBtn = document.getElementById('close-popup');
    if (closeBtn) {
      console.log('Setting up close button - NEW METHOD');
      
      // Clear any existing handlers
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      // Add click handler with immediate effect
      newCloseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Close button clicked - calling closeCheckoutPopup');
        closeCheckoutPopup();
      }, { once: false }); // Allow multiple clicks
      
      // Add additional safety handler
      newCloseBtn.onmousedown = function(e) {
        e.preventDefault();
        console.log('✅ Mouse down on close button');
        closeCheckoutPopup();
      };
      
    } else {
      console.error('❌ Close button not found in DOM');
    }
    
    // Click outside to close
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        console.log('Clicked outside popup');
        closeCheckoutPopup();
      }
    });
    
  }, 300); // Increased timeout

  // ESC to close
  const escHandler = function(e) {
    if (e.key === "Escape") {
      console.log('ESC key pressed');
      closeCheckoutPopup();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
};

// --- OTO TIMER ---
function startOtoCountdown() {
  // Find the timer element
  const timerElement = document.getElementById('oto-timer');
  if (!timerElement) {
    console.warn('Timer element not found');
    return;
  }

  console.log('✅ Starting OTO countdown timer');
  
  // 5 minuti = 300 secondi
  const duration = 5 * 60;
  let timeLeft = duration;

  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Update timer display
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(window.otoTimerInterval);
      window.otoExpired = true;
      timerElement.textContent = "00:00";
      
      // Disable TRY5 coupon and gray out offer
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

  // Reset expired state
  window.otoExpired = false;
  
  // Clear any existing timer
  if (window.otoTimerInterval) {
    clearInterval(window.otoTimerInterval);
  }
  
  // Start timer immediately and then every second
  updateTimer();
  window.otoTimerInterval = setInterval(updateTimer, 1000);
  
  console.log('✅ Timer started successfully');
}

// Mostra il popup se l'utente torna indietro
if (window.history.state && window.history.state.checkoutPopup) {
  window.openCheckout();
}

// Aggiungi un listener per la navigazione indietro
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.checkoutPopup) {
    window.openCheckout();
  }
});

// Invia un evento di stato alla storia per la navigazione indietro
window.history.replaceState({ checkoutPopup: true }, '');