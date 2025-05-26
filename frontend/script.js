function setScore(level) {
  const meter = document.getElementById('scoreMeter');
  const tab = document.getElementById('scoreDetails');
  if (!meter || !tab) return;

  meter.dataset.score = level;
  meter.textContent = '0';

  let value = 0;
  let max = 0;
  let details = '';

  switch (level) {
    case 'low':
      max = 3;
      details = `
        <h4>🚨 Poor Optimization</h4>
        <p>Your page has several issues affecting usability and conversions. CTAs may be unclear, the structure confusing, or load speed too slow.</p>
        <p><strong>Suggestion:</strong> Start optimizing now for better performance and user experience.</p>
        <a href="#urlInput" class="cta-link">🔧 Analyze your landing page now →</a>
      `;
      break;
    case 'medium':
      max = 6;
      details = `
        <h4>⚠️ Average Optimization</h4>
        <p>Your page performs decently, but there’s clear room for improvement in layout, copy clarity, or conversion structure.</p>
        <p><strong>Suggestion:</strong> Focus on making your message stronger and streamlining the user journey.</p>
        <a href="#urlInput" class="cta-link">📈 Optimize your site →</a>
      `;
      break;
    case 'high':
      max = 10;
      details = `
        <h4>✅ Excellent Optimization</h4>
        <p>Great job! Your landing page is well-structured, loads fast, and communicates value effectively.</p>
        <p><strong>Suggestion:</strong> Keep tracking performance and A/B test improvements for even better results.</p>
        <a href="#urlInput" class="cta-link">🧪 Test another URL →</a>
      `;
      break;
  }

  // Animate score
  let count = setInterval(() => {
    if (value >= max) {
      clearInterval(count);
    } else {
      value++;
      meter.textContent = value;
    }
  }, 100);

  // Display result
  tab.innerHTML = `<div class="score-tab highlighted-tab">${details}</div>`;
  tab.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const extraFields = document.getElementById('extraFields');

  function showLoaderAndFields() {
    if (!extraFields || extraFields.innerHTML.trim() !== "") return; // Evita duplicati

    // Prendi l'URL e salvalo in localStorage temporaneo
    if (urlInput) {
      const url = urlInput.value.trim();
      if (!url) {
        alert('Please enter a valid URL.');
        return;
      }
      localStorage.setItem('landingfix_temp_url', url);
    }

    // Loader con barra e messaggi step
    extraFields.innerHTML = `
      <div id="analyzing-loader" style="margin:32px auto 0;text-align:center;">
        <span id="analyze-msg" style="display:inline-block;padding:14px 28px;border-radius:24px;background:#e6f4ef;color:#0077cc;font-weight:600;font-size:17px;box-shadow:0 2px 8px rgba(0,119,204,0.06);margin-bottom:18px;">
          <i class="fas fa-spinner fa-spin" style="margin-right:10px;"></i>Analyzing your landing page...
        </span>
        <div style="width:220px;height:8px;background:#e0e7ef;border-radius:6px;margin:18px auto 0;overflow:hidden;">
          <div id="analyze-bar" style="width:0%;height:100%;background:#0077cc;transition:width 0.5s;"></div>
        </div>
      </div>
    `;

    // Step messages
    const steps = [
      "Analyzing your landing page...",
      "Checking page speed and structure...",
      "Evaluating copy and CTAs...",
      "Reviewing mobile experience...",
      "Finalizing your personalized questions..."
    ];
    let step = 0;
    const msg = document.getElementById('analyze-msg');
    const bar = document.getElementById('analyze-bar');
    const interval = setInterval(() => {
      step++;
      if (msg && steps[step]) msg.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right:10px;"></i>${steps[step]}`;
      if (bar) bar.style.width = `${(step/steps.length)*100}%`;
      if (step >= steps.length - 1) clearInterval(interval);
    }, 400);

    setTimeout(() => {
      // Sostituisci loader con i campi extra
      extraFields.innerHTML = `
        <form id="extraForm" class="extra-form">
          <div class="extra-inputs">
            <input type="text" id="userName" name="name" placeholder="Your Name" required>
            <input type="email" id="userEmail" name="email" placeholder="Your Email" required>
            <input type="text" id="userCompany" name="company" placeholder="Company (optional)">
          </div>
          <div class="goals-group">
            <label style="font-size:1.25em;font-weight:700;letter-spacing:0.5px;">Goals</label>
            <div class="goals-subtitle" style="font-size:14px; color:#555; margin-bottom:8px;">
              Select one or more objectives for your landing page analysis.
            </div>
            <div class="goals-btns">
              <button type="button" class="goal-btn">My landing page is not converting</button>
              <button type="button" class="goal-btn">Increase conversion rate</button>
              <button type="button" class="goal-btn">Get more qualified leads</button>
              <button type="button" class="goal-btn">Test new messaging</button>
              <button type="button" class="goal-btn">Optimize mobile experience</button>
            </div>
          </div>
          <div class="privacy-group" style="margin:22px 0 0 0;">
            <label style="font-size:14px; color:#444; display:flex; align-items:flex-start; gap:8px;">
              <input type="checkbox" id="privacyAccept" required style="margin-top:3px;">
              <span>
                I have read and accept the 
                <a href="privacy.html" target="_blank" style="color:#0077cc;text-decoration:underline;">Privacy Policy</a> 
                and 
                <a href="terms.html" target="_blank" style="color:#0077cc;text-decoration:underline;">Terms & Conditions</a>.
              </span>
            </label>
          </div>
          <button type="submit" class="create-report-btn" style="
            margin-top:28px;
            padding:18px 40px;
            font-size:18px;
            background:var(--brand-main);
            color:#fff;
            border:none;
            border-radius:30px;
            font-weight:700;
            cursor:pointer;
            box-shadow:0 4px 16px rgba(0,119,204,0.08);
            transition:background 0.2s;
            width:100%;
            max-width:340px;
            display:block;
          ">Run Report</button>
        </form>
      `;

      // Gestione selezione goals (toggle)
      document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          btn.classList.toggle('selected');
        });
      });
    }, 4000); // Loader visibile per 4 secondi
  }

  if (urlForm) {
    urlForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showLoaderAndFields();
    });
  }
});

// Loader overlay per submit finale
function showFinalLoader() {
  let loader = document.getElementById('report-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'report-loader';
    loader.style = 'display:flex;align-items:center;justify-content:center;position:fixed;z-index:9999;top:0;left:0;width:100vw;height:100vh;background:rgba(255,255,255,0.85);text-align:center;';
    loader.innerHTML = `
      <div style="position:relative;">
        <div class="loader" style="margin-bottom:16px;">
          <i class="fas fa-spinner fa-spin" style="font-size:2.5rem;color:#0070ba;"></i>
        </div>
        <div style="font-size:1.2rem;color:#222;">Generating your report, please wait…</div>
      </div>
    `;
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

document.addEventListener('submit', async function(e) {
  if (e.target && e.target.id === 'extraForm') {
    e.preventDefault();

    // Mostra loader overlay subito
    showFinalLoader();

    // Raccogli dati
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const company = document.getElementById('userCompany').value;
    const goals = Array.from(document.querySelectorAll('.goal-btn.selected')).map(btn => btn.textContent);
    const url = localStorage.getItem('landingfix_temp_url') || '';

    // Salva dati per il report
    localStorage.setItem('landingfix_report_data', JSON.stringify({ name, email, company, url, goals }));

    // INVIO A BREVO
    const listId = 38; // <-- Sostituisci con l'ID della tua lista Brevo
    const data = {
      email: email,
      attributes: {
        FIRSTNAME: name,
        COMPANY: company,
        LANDING_URL: url,
        GOALS: goals.join(', ')
      },
      listIds: [listId],
      updateEnabled: true
    };

    try {
  const res = await fetch('https://landingfix-com.onrender.com/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  console.log('Subscribe API result:', result);

  // --- TRACKING EVENTI LEAD ---
  if (typeof fbq === 'function') {
    fbq('track', 'Lead');
  }
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead');
  }
  // --- FINE TRACKING ---

} catch (err) {
  console.error('Network error:', err);
}

// Vai alla pagina report SOLO dopo la risposta
window.location.href = 'report.html';
  }
});