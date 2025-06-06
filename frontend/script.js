// Score animation: always show as percentage
function setScore(level) {
  const meter = document.getElementById('scoreMeter');
  const tab = document.getElementById('scoreDetails');
  if (!meter || !tab) return;

  meter.dataset.score = level;
  meter.textContent = '0%';

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
        <a href="/#analyze-section" class="cta-link">🔧 Analyze your landing page now →</a>
      `;
      break;
    case 'medium':
      max = 6;
      details = `
        <h4>⚠️ Average Optimization</h4>
        <p>Your page performs decently, but there’s clear room for improvement in layout, copy clarity, or conversion structure.</p>
        <p><strong>Suggestion:</strong> Focus on making your message stronger and streamlining the user journey.</p>
        <a href="/#analyze-section" class="cta-link">📈 Optimize your site →</a>
      `;
      break;
    case 'high':
      max = 10;
      details = `
        <h4>✅ Excellent Optimization</h4>
        <p>Great job! Your landing page is well-structured, loads fast, and communicates value effectively.</p>
        <p><strong>Suggestion:</strong> Keep tracking performance and A/B test improvements for even better results.</p>
        <a href="/#analyze-section" class="cta-link">🧪 Test another URL →</a>
      `;
      break;
  }

  // Animate score as percentage
  let count = setInterval(() => {
    if (value >= max) {
      clearInterval(count);
      meter.textContent = Math.round((max / 10) * 100) + '%';
    } else {
      value++;
      meter.textContent = Math.round((value / 10) * 100) + '%';
    }
  }, 100);

  // Display result
  tab.innerHTML = `<div class="score-tab highlighted-tab">${details}</div>`;
  tab.style.display = 'block';
}

// URL normalization and loader for extra fields
document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const extraFields = document.getElementById('extraFields');

  // Normalize URL on blur
  if (urlInput) {
    urlInput.addEventListener('blur', function() {
      let val = urlInput.value.trim();
      if (val && !/^https?:\/\//i.test(val)) {
        urlInput.value = 'https://' + val;
      }
    });
  }

  function showLoaderAndFields() {
    if (!extraFields || extraFields.innerHTML.trim() !== "") return;

    // Save URL in localStorage
    if (urlInput) {
      let url = urlInput.value.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        urlInput.value = url;
      }
      if (!urlInput.value.trim() || urlInput.value.trim() === 'https://') {
        alert('Please enter a valid URL.');
        return;
      }
      localStorage.setItem('landingfix_temp_url', urlInput.value.trim());
    }

    // Loader with steps
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
      // Show extra fields
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
                <a href="privacy-policy.html" target="_blank" style="color:#0077cc;text-decoration:underline;">Privacy Policy</a> 
                and 
                <a href="terms-conditions.html" target="_blank" style="color:#0077cc;text-decoration:underline;">Terms & Conditions</a>.
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

      // Goals toggle
      document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          btn.classList.toggle('selected');
        });
      });
    }, 4000);
  }

  if (urlForm) {
    urlForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showLoaderAndFields();
    });
  }
});

// Loader overlay for final submit
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

    // Show loader overlay
    showFinalLoader();

    // Collect data
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const company = document.getElementById('userCompany').value;
    const goals = Array.from(document.querySelectorAll('.goal-btn.selected')).map(btn => btn.textContent);
    const url = localStorage.getItem('landingfix_temp_url') || '';

    // Save data for report
    localStorage.setItem('landingfix_report_data', JSON.stringify({ name, email, company, url, goals }));

    // Send to Brevo
    const listId = 38; // <-- Replace with your Brevo list ID
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
      const res = await fetch('https://landingfixv1-1.onrender.com/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      console.log('Subscribe API result:', result);

      // Tracking events
      if (typeof fbq === 'function') {
        fbq('track', 'Lead');
      }
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead');
      }
    } catch (err) {
      console.error('Network error:', err);
    }

    // Redirect to report page
    window.location.href = 'report.html';
  }
});

// Accordion toggle functionality Report Example
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.accordion-element-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        this.setAttribute('aria-expanded', 'false');
        this.parentElement.querySelector('.accordion-element-content').style.display = 'none';
      } else {
        this.closest('.accordion-list').querySelectorAll('.accordion-element-toggle').forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          b.parentElement.querySelector('.accordion-element-content').style.display = 'none';
        });
        this.setAttribute('aria-expanded', 'true');
        this.parentElement.querySelector('.accordion-element-content').style.display = 'block';
      }
    });
  });
});

// Versioned tabs functionality
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.v1-tab');
  const panels = document.querySelectorAll('.v1-timeline-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => { p.style.display = 'none'; });
      this.classList.add('active');
      document.querySelector('.' + this.dataset.version + '-panel').style.display = 'block';
    });
  });
});


// Hamburger menu toggle and CTA visibility
function setupHamburgerMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const nav = document.getElementById('main-nav');
  const cta = document.querySelector('.header-cta-btn');

  function isMobile() {
    return window.innerWidth <= 800;
  }

  function closeMenu() {
    nav.classList.remove('open');
    if (cta && isMobile()) cta.style.display = 'none';
  }

  function openMenu() {
    nav.classList.add('open');
    if (cta && isMobile()) cta.style.display = 'block';
  }

  function updateCTAVisibility() {
    if (cta) {
      if (isMobile()) {
        cta.style.display = nav.classList.contains('open') ? 'block' : 'none';
      } else {
        cta.style.display = 'inline-block';
      }
    }
  }

  if (hamburger && nav) {
    hamburger.addEventListener('click', function() {
      if (nav.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
      updateCTAVisibility();
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if (isMobile()) {
          closeMenu();
          updateCTAVisibility();
        }
      });
    });

    window.addEventListener('resize', updateCTAVisibility);
    updateCTAVisibility();
  }
}
window.setupHamburgerMenu = setupHamburgerMenu;

// Hero video play button logic
document.addEventListener('DOMContentLoaded', function() {
  const playBtn = document.querySelector('.hero-play-btn');
  const video = document.getElementById('hero-video');
  if (playBtn && video) {
    playBtn.addEventListener('click', function() {
      playBtn.style.display = 'none';
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      }
      video.play();
    });
    video.addEventListener('pause', function() {
      playBtn.style.display = '';
    });
    video.addEventListener('play', function() {
      playBtn.style.display = 'none';
    });
    video.addEventListener('click', function() {
      if (!video.paused) {
        video.pause();
      }
    });
  }
});