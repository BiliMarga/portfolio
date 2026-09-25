/* ==========================================================================
   BILISUMA JABESA MERGA - MAIN APPLICATION LOGIC
   UI Interactions, Modals, Terminal CLI, Lightboxes, Tabs
   ========================================================================== */

(function () {
  'use strict';

  // --- 1. Sticky Navigation & Scrollspy ---
  const siteNav = document.getElementById('site-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileToggle = document.getElementById('btn-mobile-toggle');
  const navMenu = document.getElementById('nav-links-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteNav.classList.add('scrolled');
    } else {
      siteNav.classList.remove('scrolled');
    }

    // Scrollspy
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navMenu.style.display === 'flex';
      navMenu.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '74px';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.background = '#090e1b';
        navMenu.style.padding = '1.5rem';
        navMenu.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      }
    });

    // Close on click link
    navLinks.forEach(l => {
      l.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navMenu.style.display = 'none';
        }
      });
    });
  }

  // --- 2. Technical Tabs (Drone Specs) ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // --- 3. Lightbox Modal System ---
  const modalOverlay = document.getElementById('lightbox-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalImg = document.getElementById('modal-image');
  const modalDesc = document.getElementById('modal-desc');
  const modalDocLink = document.getElementById('modal-doc-link');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openLightbox(title, imgSrc, description, docLink = null) {
    if (!modalOverlay) return;
    if (modalTitle) modalTitle.textContent = title;
    if (modalImg) {
      modalImg.src = imgSrc;
      modalImg.alt = title;
    }
    if (modalDesc) modalDesc.innerHTML = description;
    if (modalDocLink) {
      if (docLink) {
        modalDocLink.href = docLink;
        modalDocLink.style.display = 'inline-flex';
      } else {
        modalDocLink.style.display = 'none';
      }
    }
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeLightbox);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeLightbox();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Attach Lightbox Triggers for Credentials & Gallery Cards
  const certData = {
    esslce: {
      title: 'Ethiopian Secondary School Leaving Certificate Examination (ESSLCE)',
      img: 'assets/images/cert_esslce_national.jpg',
      doc: 'https://verify.eaes.et/AH56612372024KU',
      desc: `
        <div style="line-height:1.6; font-size:0.95rem;">
          <p><strong>Official National Examination Result (Ministry of Education & EAES)</strong></p>
          <ul style="margin: 0.8rem 0 0.8rem 1.2rem; color: #94a3b8;">
            <li><strong style="color:#f8fafc;">Mathematics: 100 / 100</strong> (Perfect Score)</li>
            <li><strong style="color:#f8fafc;">Chemistry: 97 / 100</strong></li>
            <li><strong style="color:#f8fafc;">Biology: 97 / 100</strong></li>
            <li><strong style="color:#f8fafc;">Physics: 96 / 100</strong></li>
            <li><strong style="color:#f8fafc;">Total Score: 559 / 600 (93.16% Average)</strong></li>
          </ul>
          <p><strong>National Ranking:</strong> Ranked <strong>#1</strong> in ODA Boarding School, <strong>#4</strong> in Oromia Region, and <strong>#14 nationwide</strong> across the entire Federal Democratic Republic of Ethiopia.</p>
          <p style="margin-top:0.5rem; font-size:0.85rem; color:#38bdf8;">Digital QR Verification ID: AH56612372024KU • Certificate No. 1204112</p>
        </div>`
    },
    sat: {
      title: 'College Board Official SAT Score Report',
      img: 'assets/images/cert_sat_score.png',
      doc: 'assets/docs/Official_SAT_Score_Report.pdf',
      desc: `
        <div style="line-height:1.6; font-size:0.95rem;">
          <p><strong>Total Score: 1580 / 1600</strong> (&gt;99th Percentile Nationally & Globally)</p>
          <ul style="margin: 0.8rem 0 0.8rem 1.2rem; color: #94a3b8;">
            <li><strong>Math Section: 790 / 800</strong> (99th Percentile)</li>
            <li><strong>Reading & Writing Section: 790 / 800</strong> (&gt;99th Percentile)</li>
            <li><strong>All 8 Content Domains:</strong> Highest Score Band (680–800) across Algebra, Advanced Math, Problem-Solving, Geometry/Trigonometry, Information & Ideas, Craft & Structure, Expression of Ideas, and Standard English Conventions.</li>
          </ul>
          <p style="font-size:0.85rem; color:#94a3b8;">Test Date: December 6, 2025 • Record Locator: 4104967662</p>
        </div>`
    },
    china_scholarship: {
      title: 'China-Ethiopia Friendship Scholarship Award',
      img: 'assets/images/cert_china_scholarship.jpg',
      doc: null,
      desc: `
        <div style="line-height:1.6; font-size:0.95rem;">
          <p>Awarded jointly by <strong>Addis Ababa University</strong> and the <strong>Embassy of the People's Republic of China in Ethiopia</strong> for outstanding academic distinction in the academic year 2024/25.</p>
          <p style="margin-top:0.5rem; color:#94a3b8;">Conferred with official diplomatic seals from the Chinese Embassy and Addis Ababa University Academic Directorate.</p>
        </div>`
    },
    oromia_award: {
      title: 'Oromia Regional Government Academic Excellence Award',
      img: 'assets/images/cert_oromia_award.jpg',
      doc: null,
      desc: `
        <div style="line-height:1.6; font-size:0.95rem;">
          <p>Conferred by <strong>Dr. Tolaa Bariisoo Gadaa</strong>, Head of Oromia Education Bureau, in recognition of scoring <strong>559 / 600</strong> on the 12th Grade National Examination and ranking in the top tier of the region.</p>
        </div>`
    },
    stem_foka: {
      title: 'STEMpower Ethiopia & Foka STEM Center Distinction',
      img: 'assets/images/cert_stem_foka.png',
      doc: null,
      desc: `
        <div style="line-height:1.6; font-size:0.95rem;">
          <p>12-week intensive STEM fellowship in Computer Programming & Basic Electronics. Recommended for higher academic studies in Computer Science and Computer Engineering by Coordinator Eyob Aychew.</p>
        </div>`
    },
    library_club: {
      title: 'ODA Special Boarding School Leadership & Service',
      img: 'assets/images/cert_library_club.jpg',
      doc: null,
      desc: `
        <div style="line-height:1.6; font-size:0.95rem;">
          <p>Certificate of Appreciation for voluntary service, student mentorship, and library resource management at ODA Special Boarding School (Adama, Oromia).</p>
        </div>`
    }
  };

  document.querySelectorAll('[data-cert-id]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const id = el.getAttribute('data-cert-id');
      const item = certData[id];
      if (item) {
        openLightbox(item.title, item.img, item.desc, item.doc);
      }
    });
  });

  // Photo Gallery Lightbox Triggers
  document.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const caption = card.querySelector('.gallery-caption');
      if (img) {
        openLightbox(
          caption ? caption.textContent : 'Hardware Prototype Gallery',
          img.src,
          `<p style="color:#94a3b8; font-size:0.95rem;">${caption ? caption.textContent : ''}</p>`
        );
      }
    });
  });

  // --- 4. Admissions Officer Executive Deck Modal ---
  const btnOpenDeck = document.querySelectorAll('.trigger-admissions-deck');
  const deckModal = document.getElementById('admissions-deck-modal');
  const deckCloseBtn = document.getElementById('deck-close-btn');

  function openDeckModal() {
    if (!deckModal) return;
    deckModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeDeckModal() {
    if (!deckModal) return;
    deckModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  btnOpenDeck.forEach(b => b.addEventListener('click', openDeckModal));
  if (deckCloseBtn) deckCloseBtn.addEventListener('click', closeDeckModal);
  if (deckModal) {
    deckModal.addEventListener('click', e => {
      if (e.target === deckModal) closeDeckModal();
    });
  }

  // --- 5. Interactive Terminal ("Bilisuma CLI") ---
  const termInput = document.getElementById('term-input');
  const termBody = document.getElementById('term-body');
  const quickBtns = document.querySelectorAll('.quick-cmd-btn');

  const COMMANDS = {
    help: `
Available commands:
  • <span style="color:#38bdf8;">bio</span>        : Candidate background and mission statement
  • <span style="color:#38bdf8;">sat</span>        : Official 1580 SAT breakdown
  • <span style="color:#38bdf8;">esslce</span>     : National Exam scores (100 in Math, Rank #14 Ethiopia)
  • <span style="color:#38bdf8;">research</span>   : SSRN Quantum Cryptanalysis publication details
  • <span style="color:#38bdf8;">drone</span>      : Autonomous quadcopter hardware and firmware specs
  • <span style="color:#38bdf8;">certs</span>      : List of verified honors and scholarships
  • <span style="color:#38bdf8;">shor [N]</span>   : Run quantum order-finding on composite number N (e.g. 'shor 15')
  • <span style="color:#38bdf8;">contact</span>    : Direct email, telephone, and location
  • <span style="color:#38bdf8;">clear</span>      : Clear terminal screen
    `,
    bio: `
Candidate: Bilisuma Jabesa Merga
Location: Sheger City / Adama, Oromia, Ethiopia
School: ODA Special Boarding School (Class of 2024)
Focus: Electrical Engineering, Computer Science, Quantum Computing, Applied Physics
Aspirations: Building resilient autonomous robotics and scalable quantum computing algorithms.
    `,
    sat: `
OFFICIAL COLLEGE BOARD SAT REPORT (Dec 06, 2025):
  • Total Score: 1580 / 1600 (>99th percentile)
  • Mathematics: 790 / 800 (99th percentile)
  • Reading & Writing: 790 / 800 (>99th percentile)
  • All 8 Domain Performance Bands: 680-800
    `,
    esslce: `
ETHIOPIAN SECONDARY SCHOOL LEAVING CERTIFICATE (ESSLCE):
  • Mathematics: 100 / 100 (Perfect Score)
  • Chemistry: 97 / 100
  • Biology: 97 / 100
  • Physics: 96 / 100
  • Total: 559 / 600 (Average: 93.16%)
  • National Rank: #1 in School, #4 in Oromia, #14 in Ethiopia
  • Verification: https://verify.eaes.et/AH56612372024KU
    `,
    research: `
RESEARCH PUBLICATION (SSRN - Elsevier):
  • Title: "The Cruciality of Shor's Algorithm in Breaking RSA Encryption"
  • SSRN ID: 4992090 (Nov 2024)
  • Metric: Ranked Top 10 in Theoretical CS Downloads in launch month.
  • Reach: 1,350+ scholar views, 150+ full-text downloads.
  • Focus: Superposition, Modular Exponentiation, QFT, Post-Quantum Cryptography.
    `,
    drone: `
AUTONOMOUS GPS QUADCOPTER FLIGHT SYSTEM:
  • Processor: Microchip ATmega328P (16MHz, 2KB SRAM)
  • Optimization: 682 bytes RAM usage (33.3% footprint), 0 heap fragmentation
  • Trajectory: OSMNx GIS graph shortest path -> C++ PROGMEM headers
  • Firmware: Deterministic 8-State non-blocking FSM (700ms control cadence)
  • Hardware: NEO-6M GPS, MPU-6050 6-Axis IMU, Active IR Collision Sensor, Ball Tilt Failsafe
  • Accuracy: 100% waypoint capture across 25 mission legs
    `,
    certs: `
VERIFIED CREDENTIALS & AWARDS:
  [1] ESSLCE National Exam #14 in Ethiopia (559/600, 100 in Math)
  [2] College Board SAT 1580 / 1600 (>99th percentile)
  [3] China-Ethiopia Friendship Scholarship (Addis Ababa Univ & Chinese Embassy)
  [4] Oromia Regional Government Academic Excellence Award
  [5] Ethiopian Math Olympiad Finalist 2024
  [6] STEMpower Ethiopia Foka STEM Distinction
  [7] ODA Boarding School Library Club Recognition
    `,
    contact: `
CONTACT DETAILS:
  • Email: jabesabilisuma@gmail.com
  • Phone: +251 913 182 820
  • Location: Sheger City / Adama, Ethiopia
  • GitHub: https://github.com/jabesa-bilisuma
    `
  };

  function executeCommand(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts[1];

    const inputLine = document.createElement('div');
    inputLine.innerHTML = `<span style="color:#10b981;">bilisuma@merga-box:~$</span> ${trimmed}`;
    termBody.appendChild(inputLine);

    if (cmd === 'clear') {
      termBody.innerHTML = '';
      return;
    }

    if (cmd === 'shor') {
      const N = parseInt(arg, 10) || 15;
      const response = document.createElement('div');
      response.style.color = '#c084fc';
      response.innerHTML = `Running quantum order-finding on N = ${N} ...<br>Evaluating modular exponentiation period across quantum register...<br>Please view the interactive visual graph above in Section 03 for complete harmonic breakdown.`;
      termBody.appendChild(response);
    } else if (COMMANDS[cmd]) {
      const output = document.createElement('div');
      output.style.margin = '0.35rem 0 0.75rem 0';
      output.innerHTML = COMMANDS[cmd].trim().replace(/\n/g, '<br>');
      termBody.appendChild(output);
    } else {
      const err = document.createElement('div');
      err.style.color = '#f43f5e';
      err.textContent = `Command not recognized: '${cmd}'. Type 'help' to see valid commands.`;
      termBody.appendChild(err);
    }

    termBody.scrollTop = termBody.scrollHeight;
  }

  if (termInput) {
    termInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = termInput.value;
        termInput.value = '';
        executeCommand(val);
      }
    });
  }

  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (termInput) termInput.value = '';
      executeCommand(cmd);
    });
  });

  // --- 6. Contact Form Pre-filler ---
  const contactForm = document.getElementById('admissions-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value;
      const institution = document.getElementById('contact-institution').value;
      const email = document.getElementById('contact-email').value;
      const message = document.getElementById('contact-message').value;

      const subject = encodeURIComponent(`Admissions Inquiry / Collaboration from ${name} (${institution})`);
      const body = encodeURIComponent(
        `Dear Bilisuma,\n\n${message}\n\nFrom:\n${name}\n${institution}\nEmail: ${email}`
      );

      window.location.href = `mailto:jabesabilisuma@gmail.com?subject=${subject}&body=${body}`;
    });
  }

})();
