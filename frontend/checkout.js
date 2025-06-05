function setupCheckout() {
  // --- CONFIG ---
  const EUR_PRICE = 20.00;
  const USD_PRICE = 22.68;
  const COUPONS = {
    'TESTPAGAMENTOADMIN': { discount: 1.0, msg: 'Coupon applied: 100% off!' },
    'TRY5':  { discount: 0.75, msg: 'Try LandingFix AI: only €5 (~$5.50)!' }
  };

  let currentEur = EUR_PRICE;
  let currentUsd = USD_PRICE;

  // --- URL dinamico dal report ---
  const url = localStorage.getItem('landingfix_report_data')
    ? JSON.parse(localStorage.getItem('landingfix_report_data')).url
    : '';
  if (document.getElementById('checkout-url')) {
    document.getElementById('checkout-url').textContent = url;
  }

  // --- Aggiorna prezzi ---
  function updatePrices() {
    document.getElementById('checkout-eur').textContent = `€${currentEur.toFixed(2)}`;
    document.getElementById('checkout-usd').textContent = `(~$${currentUsd.toFixed(2)})`;
    // Mostra/nasconde PayPal o Unlock Free
    if (currentEur === 0) {
      document.getElementById('paypal-button-container').style.display = 'none';
      document.getElementById('unlock-free-btn').style.display = 'inline-block';
    } else {
      document.getElementById('paypal-button-container').style.display = 'block';
      document.getElementById('unlock-free-btn').style.display = 'none';
    }
  }

  // --- Coupon ---
  const applyCouponBtn = document.getElementById('apply-coupon');
  const couponInput = document.getElementById('coupon-input');
  if (applyCouponBtn) {
    function handleCouponApply() {
      const code = couponInput.value.trim().toUpperCase();
      const msg = document.getElementById('coupon-msg');
      if (COUPONS[code]) {
        currentEur = EUR_PRICE * (1 - COUPONS[code].discount);
        currentUsd = USD_PRICE * (1 - COUPONS[code].discount);
        msg.textContent = COUPONS[code].msg;
        msg.style.color = "#27ae60";
        msg.style.display = "block";
      } else if (code) {
        currentEur = EUR_PRICE;
        currentUsd = USD_PRICE;
        msg.textContent = "Invalid coupon code.";
        msg.style.color = "#c0392b";
        msg.style.display = "block";
      } else {
        currentEur = EUR_PRICE;
        currentUsd = USD_PRICE;
        msg.style.display = "none";
      }
      updatePrices();
      renderPaypalButton();
    }

    applyCouponBtn.onclick = handleCouponApply;

    // Permetti invio con Enter
    if (couponInput) {
      couponInput.addEventListener('keydown', function(e) {
        if (e.key === "Enter") {
          handleCouponApply();
        }
      });
    }
  }

  // --- Unlock Free ---
  const unlockFreeBtn = document.getElementById('unlock-free-btn');
  if (unlockFreeBtn) {
    unlockFreeBtn.onclick = function() {
      document.getElementById('checkout-popup').style.display = 'none';
      if (window.unlockReport) window.unlockReport();
    };
  }

  // --- PayPal ---
  function renderPaypalButton() {
  const paypalContainer = document.getElementById('paypal-button-container');
  if (!paypalContainer) return;
  paypalContainer.innerHTML = '';
  if (currentEur === 0) return;

  // Se PayPal SDK non è ancora caricato, non fare nulla
  if (!window.paypal) return;

  paypal.Buttons({
  style: { layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay', height: 40 },
  createOrder: function(data, actions) {
    return actions.order.create({
      purchase_units: [{
        amount: { value: currentEur.toFixed(2), currency_code: 'EUR' },
        shipping_preference: 'NO_SHIPPING' // <-- aggiunto per sicurezza
      }]
    });
  },
  onApprove: function(data, actions) {
    return actions.order.capture().then(function(details) {
      document.getElementById('checkout-popup').style.display = 'none';
      if (window.unlockReport) window.unlockReport();

      // --- TRACKING EVENTO ACQUISTO ---
      if (typeof fbq === 'function') {
        fbq('track', 'Purchase', {
          value: currentEur,
          currency: 'EUR'
        });
      }
      if (typeof gtag === 'function') {
        gtag('event', 'purchase', {
          value: currentEur,
          currency: 'EUR',
          transaction_id: details.id || undefined
        });
      }
      // --- FINE TRACKING ---
    });
  }
}).render('#paypal-button-container');
}

  // --- Carica PayPal SDK solo se serve e solo una volta ---
  function loadPaypalSdkAndRender() {
  if (currentEur === 0) return;
  if (!document.querySelector('script[src*="paypal.com/sdk/js"]')) {
    fetch('https://landingfix-com.onrender.com/api/paypal-client-id')
      .then(res => res.json())
      .then(data => {
        if (!data.clientId) {
          console.error('PayPal clientId mancante!');
          return;
        }
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=EUR`;
        script.onload = renderPaypalButton;
        document.body.appendChild(script);
      })
      .catch(err => {
        console.error('Errore nel recupero del clientId PayPal:', err);
      });
  } else if (window.paypal) {
    renderPaypalButton();
  }
}

  updatePrices();
  loadPaypalSdkAndRender();
}

// Funzione globale per aprire il popup da report.html
window.openCheckout = function() {
  document.getElementById('checkout-popup').style.display = 'flex';
  setupCheckout();
  startOtoCountdown();

  // Gestione chiusura popup
  setTimeout(() => {
    const closeBtn = document.getElementById('close-popup');
    if (closeBtn) {
      closeBtn.onclick = function() {
        document.getElementById('checkout-popup').style.display = 'none';
        clearInterval(otoTimerInterval);
      };
    }
  }, 0);

  // ESC per chiudere
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === "Escape") {
      document.getElementById('checkout-popup').style.display = 'none';
      clearInterval(otoTimerInterval);
      document.removeEventListener('keydown', escHandler);
    }
  });
};

let otoTimerInterval;

function startOtoCountdown() {
  // 5 minuti da ora
  const duration = 5 * 60; // 5 minuti in secondi
  let timeLeft = duration;

  function updateTimer() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const timerSpan = document.getElementById('oto-timer');
    if (timerSpan) {
      timerSpan.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    if (timeLeft <= 0) {
      clearInterval(otoTimerInterval);
      window.otoExpired = true;
      const msg = document.getElementById('coupon-msg');
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#c0392b';
        msg.textContent = 'The TRY5 offer has expired!';
      }
    } else {
      timeLeft--;
    }
  }

  // Reset stato
  window.otoExpired = false;
  clearInterval(otoTimerInterval);
  updateTimer();
  otoTimerInterval = setInterval(updateTimer, 1000);
}