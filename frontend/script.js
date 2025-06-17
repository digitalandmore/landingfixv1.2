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
        <p>Your page performs decently, but there's clear room for improvement in layout, copy clarity, or conversion structure.</p>
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

    // ✅ VALIDAZIONE URL REALE CON check-domain.js
    if (urlInput) {
      let url = urlInput.value.trim();
      
      // Auto-add protocol if missing
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        urlInput.value = url;
      }
      
      // ✅ USA LA FUNZIONE REALE DA check-domain.js
      if (typeof validateUrlForFrontend === 'function') {
        const urlValidation = validateUrlForFrontend(url, extraFields);
        if (urlValidation.shouldBlock) {
          return; // Stop if validation fails
        }
        
        // Use the validated/normalized URL
        if (urlValidation.url) {
          urlInput.value = urlValidation.url;
          url = urlValidation.url;
        }
      } else {
        // Fallback validation if check-domain.js not loaded
        if (!url || url === 'https://') {
          alert('Please enter a valid URL.');
          return;
        }
      }
      
      localStorage.setItem('landingfix_temp_url', url);
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
          <div class="focus-group" style="margin-top:22px;">
            <label style="font-size:1.15em;font-weight:700;letter-spacing:0.5px;">Focus</label>
            <div class="focus-subtitle" style="font-size:14px; color:#555; margin-bottom:8px;">
              Select the main area you want to focus your analysis on (only one).
            </div>
            <div class="focus-btn-row">
              <button type="button" class="focus-btn" data-focus="Copywriting"><i class="fa fa-pen-nib"></i> Copywriting</button>
              <button type="button" class="focus-btn" data-focus="UX/UI"><i class="fa fa-object-group"></i> UX/UI</button>
              <button type="button" class="focus-btn" data-focus="Mobile"><i class="fa fa-mobile-alt"></i> Mobile</button>
              <button type="button" class="focus-btn" data-focus="CTA"><i class="fa fa-bullseye"></i> CTA</button>
              <button type="button" class="focus-btn" data-focus="SEO"><i class="fa fa-magnifying-glass"></i> SEO</button>
            </div>
          </div>
          <div class="industry-group" style="margin-top:22px;">
            <label style="font-size:1.15em;font-weight:700;letter-spacing:0.5px;">Industry</label>
            <div class="industry-subtitle" style="font-size:14px; color:#555; margin-bottom:8px;">
              Select the industry of your landing page.
            </div>
            <select id="userIndustry" name="industry" required style="padding:10px 14px;font-size:1.08em;border-radius:8px;border:1.5px solid #0077cc;width:100%;max-width:320px;">
              <option value="">Select industry...</option>
              <option value="saas">SaaS / Software</option>
              <option value="ecommerce">E-commerce</option>
              <option value="services">Professional Services</option>
              <option value="coaching">Coaching / Training</option>
              <option value="local">Local Business</option>
              <option value="health">Health / Wellness</option>
              <option value="other">Other</option>
            </select>
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

      // Focus toggle (solo uno selezionabile)
      document.querySelectorAll('.focus-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('selected'));
          this.classList.add('selected');
        });
      });

      // EXTRA: Submit handler per extraForm
      const extraForm = document.getElementById('extraForm');
      if (extraForm) {
        extraForm.addEventListener('submit', function(e) {
          e.preventDefault();

          const name = document.getElementById('userName').value.trim();
          const email = document.getElementById('userEmail').value.trim();
          const company = document.getElementById('userCompany').value.trim();
          const goals = Array.from(document.querySelectorAll('.goal-btn.selected')).map(btn => btn.textContent.trim());
          const focusBtn = document.querySelector('.focus-btn.selected');
          const focus = focusBtn ? focusBtn.dataset.focus : '';
          const industry = document.getElementById('userIndustry').value;
          const privacy = document.getElementById('privacyAccept').checked;
          const url = localStorage.getItem('landingfix_temp_url') || '';

          // ✅ VALIDAZIONI COMPLETE CON check-email.js REALE
          
          // Validate name
          if (!name || name.length < 2) {
            alert('Please enter your full name.');
            document.getElementById('userName').focus();
            return;
          }

          // ✅ USA LA FUNZIONE REALE DA check-email.js
          let normalizedEmail = email;
          if (typeof validateEmailForFrontend === 'function') {
            const emailValidation = validateEmailForFrontend(email, extraFields);
            if (emailValidation.shouldBlock) {
              return; // Stop if email validation fails
            }
            normalizedEmail = emailValidation.email || email.toLowerCase();
          } else {
            // Fallback validation if check-email.js not loaded
            if (!email || !email.includes('@')) {
              alert('Please enter a valid email address.');
              document.getElementById('userEmail').focus();
              return;
            }
            normalizedEmail = email.toLowerCase();
          }

          // Validate focus
          if (!focus) {
            alert('Please select a focus area for your analysis.');
            return;
          }

          // Validate industry
          if (!industry) {
            alert('Please select an industry from the dropdown.');
            document.getElementById('userIndustry').focus();
            return;
          }

          // Validate privacy
          if (!privacy) {
            alert('Please accept the Privacy Policy and Terms & Conditions.');
            document.getElementById('privacyAccept').focus();
            return;
          }

          console.log('✅ All frontend validations passed:', {
            name: name,
            email: normalizedEmail,
            emailValid: true,
            industry: industry,
            focus: focus,
            privacy: privacy,
            hasGoals: goals.length > 0
          });

         // Send to Brevo
          const subscribeData = {
            name: name,          
            email: normalizedEmail, // Use normalized email
            company: company,
            url: url,
            goals: goals,
            focus: focus,
            industry: industry
          };

          async function sendToBrevo() {
            try {
              console.log('📧 Sending to Brevo:', subscribeData);
              
              const res = await fetch('https://landingfixv1-2.onrender.com/api/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscribeData)
              });
              
              console.log('📧 Brevo response status:', res.status);
              
              if (!res.ok) {
                const errorData = await res.json();
                console.error('📧 Brevo API error:', errorData);
                
                // Show specific error messages
                if (errorData.error === 'Invalid email format') {
                  alert('Please check your email address format.');
                  document.getElementById('userEmail').focus();
                  return false;
                } else if (errorData.error === 'Industry is required') {
                  alert('Please select an industry from the dropdown.');
                  document.getElementById('userIndustry').focus();
                  return false;
                } else if (errorData.error === 'Name is required') {
                  alert('Please enter your full name.');
                  document.getElementById('userName').focus();
                  return false;
                } else {
                  console.error('📧 Subscription failed, but continuing with report generation:', errorData);
                }
              } else {
                const result = await res.json();
                console.log('✅ Subscribe API result:', result);
              }

              // ✅ TRACKING EVENTS CORRETTI
              console.log('🎯 Firing conversion tracking events...');
              
              // Meta Pixel Lead event - CORRETTO
              if (typeof fbq !== 'undefined' && fbq) {
                fbq('track', 'Lead', {
                  content_name: 'Landing Page Report',
                  content_category: 'Analysis',
                  value: 0.00,
                  currency: 'USD'
                });
                console.log('✅ Meta Pixel Lead event fired');
              } else {
                console.warn('⚠️ Meta Pixel (fbq) not available');
              }
              
              // Google Analytics conversion
              if (typeof gtag !== 'undefined' && gtag) {
                gtag('event', 'generate_lead', {
                  event_category: 'conversion',
                  event_label: 'landing_page_report',
                  value: 1
                });
                console.log('✅ Google Analytics Lead event fired');
              } else {
                console.warn('⚠️ Google Analytics (gtag) not available');
              }
              
              return true;
              
            } catch (err) {
              console.error('❌ Network error during Brevo subscription:', err);
              
              // ✅ FIRE TRACKING EVENTS ANCHE IN CASO DI ERRORE
              console.log('🎯 Firing conversion tracking events (fallback)...');
              
              if (typeof fbq !== 'undefined' && fbq) {
                fbq('track', 'Lead', {
                  content_name: 'Landing Page Report',
                  content_category: 'Analysis',
                  value: 0.00,
                  currency: 'USD'
                });
                console.log('✅ Meta Pixel Lead event fired (fallback)');
              }
              
              if (typeof gtag !== 'undefined' && gtag) {
                gtag('event', 'generate_lead', {
                  event_category: 'conversion',
                  event_label: 'landing_page_report',
                  value: 1
                });
                console.log('✅ Google Analytics Lead event fired (fallback)');
              }
              
              return true; // Don't block for network errors
            }
          }

          // Execute Brevo subscription and proceed only if successful
          sendToBrevo().then(success => {
            if (success !== false) {
              // Add focus icons mapping
              const focusIcons = {
                'Copywriting': 'fa-pen-nib',
                'UX/UI': 'fa-object-group', 
                'Mobile': 'fa-mobile-alt',
                'CTA': 'fa-bullseye',
                'SEO': 'fa-magnifying-glass'
              };

              // Industry full names mapping
              const industryNames = {
                'saas': 'SaaS / Software',
                'ecommerce': 'E-commerce',
                'services': 'Professional Services',
                'coaching': 'Coaching / Training',
                'local': 'Local Business',
                'health': 'Health / Wellness',
                'other': 'Other'
              };

              localStorage.setItem('landingfix_report_data', JSON.stringify({
                url: url,
                name,
                email: normalizedEmail, // Use normalized email
                company,
                goals,
                focus,
                focusIcon: focusIcons[focus] || 'fa-chart-line',
                industry,
                industryName: industryNames[industry] || industry,
                reportType: 'detailed'
              }));

              window.location.href = 'report.html';
            }
          });
        });
      }

    }, 1800);
  }

  // Mostra i campi extra quando serve
  if (urlForm) {
    urlForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // ✅ TRACKING EVENTS MIGLIORATI
      console.log('🎯 Firing URL submission tracking events...');
      
      // Google Analytics
      if (typeof gtag !== 'undefined' && gtag) {
        gtag('event', 'contact', {
          event_category: 'engagement',
          event_label: 'url_submission'
        });
        console.log('✅ Google Analytics Contact event fired');
      } else {
        console.warn('⚠️ Google Analytics (gtag) not available');
      }

      // Meta Pixel
      if (typeof fbq !== 'undefined' && fbq) {
        fbq('track', 'Contact', {
          content_name: 'URL Analysis Start',
          content_category: 'Engagement'
        });
        console.log('✅ Meta Pixel Contact event fired');
      } else {
        console.warn('⚠️ Meta Pixel (fbq) not available');
      }

      showLoaderAndFields();
    });
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