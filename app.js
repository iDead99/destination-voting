/* ═══════════════════════════════════════════════════
   AOB NSS PERSONNEL — TOURISM VOTE 2026
   app.js
═══════════════════════════════════════════════════

   STORAGE KEYS:
   aob_votes       → { [id]: number }   — vote tallies
   aob_has_voted   → "1"               — whether this device voted
   aob_deadline    → ISO string        — fixed 1-week deadline (set on first load)
   aob_voted_for   → id               — which destination was chosen

═══════════════════════════════════════════════════ */

'use strict';

/* ─── Destinations ──────────────────────────────── */
const DESTINATIONS = [
  {
    id: 'cape-canopy',
    name: 'Cape Coast Castle & Canopy Walk',
    region: 'Central Region',
    badge: 'Heritage & Nature',
    badgeClass: 'paired',
    desc: 'Two of Ghana\'s most iconic landmarks combined — the haunting "Door of No Return" at Cape Coast Castle, a UNESCO World Heritage site, paired with the thrilling treetop walkway suspended 30m above Kakum\'s rainforest canopy.',
    tags: ['History', 'UNESCO', 'Adventure', 'Nature'],
    images: [
      {
        src: '../images/cape-coast-castle.jpg',
        alt: 'Cape Coast Castle — white-walled fortress on the Atlantic coast of Ghana'
      },
      {
        src: '../images/kakum.jpg',
        alt: 'Kakum National Park canopy walkway suspended above the rainforest'
      }
    ]
  },
  {
    id: 'wli-falls',
    name: 'Wli Waterfalls',
    region: 'Volta Region',
    badge: 'Scenic',
    badgeClass: '',
    desc: 'Ghana\'s tallest and most spectacular waterfall plunges dramatically into a cool, emerald pool deep in the Agumatsa Wildlife Sanctuary. The trek through dense tropical forest makes the reward all the more breathtaking.',
    tags: ['Waterfall', 'Hiking', 'Nature', 'Wildlife'],
    images: [
      {
        src: '../images/wli-waterfalls.jpg',
        alt: 'Wli Waterfalls cascading into a pool surrounded by lush green forest'
      }
    ]
  },
  {
    id: 'nzulezu',
    name: 'Nzulezu Stilt Village',
    region: 'Western Region',
    badge: 'Cultural Wonder',
    badgeClass: '',
    desc: 'A UNESCO-listed village built entirely on stilts above Lake Tadane — one of West Africa\'s most extraordinary communities. Reached only by dugout canoe, Nzulezu is a living testament to ancient Ghanaian tradition and ingenuity.',
    tags: ['UNESCO', 'Culture', 'Unique', 'Heritage'],
    images: [
      {
        src: '../images/nzulezu.jpg',
        alt: 'Nzulezu stilt village on Lake Tadane — traditional wooden homes above still water'
      }
    ]
  },
  {
    id: 'nkrumah-labadi',
    name: 'Nkrumah Memorial Park & Labadi Beach',
    region: 'Greater Accra Region',
    badge: 'Culture & Coast',
    badgeClass: 'paired',
    desc: 'From reflection to celebration — the solemn Kwame Nkrumah Memorial Park honours Ghana\'s founding father and the soul of Pan-Africanism, while the vibrant Labadi Beach pulses with live music, golden sands, and the unmistakable energy of Accra.',
    tags: ['History', 'Beach', 'Accra', 'Culture'],
    images: [
      {
        src: '../images/Kwame-Nkrumah-Mausoleum.jpg',
        alt: 'Kwame Nkrumah Memorial Park and mausoleum in Accra — national monument'
      },
      {
        src: '../images/labadi-beach.jpg',
        alt: 'Labadi Beach in Accra — golden sands and vibrant coastal atmosphere'
      }
    ]
  },
  {
    id: 'mole',
    name: 'Mole National Park',
    region: 'Savannah Region',
    badge: 'Wildlife',
    badgeClass: '',
    desc: 'Ghana\'s largest wildlife sanctuary stretches across vast savannah plains, offering unguided walking safaris alongside free-roaming elephants, buffalo, antelopes and over 300 bird species — an experience unlike anywhere else in West Africa.',
    tags: ['Safari', 'Elephants', 'Wildlife', 'Nature'],
    images: [
      {
        src: '../images/mole.jpg',
        alt: 'Mole National Park — elephant grazing on Ghana\'s vast savannah landscape'
      }
    ]
  },
  {
    id: 'akosombo-airport',
    name: 'Akosombo Dam & Accra Airport',
    region: 'Eastern & Greater Accra',
    badge: 'Engineering Icons',
    badgeClass: 'paired',
    desc: 'Two landmarks of Ghanaian ambition — the Akosombo Dam, which created one of the world\'s largest man-made lakes (Lake Volta) and powers the nation, alongside Accra International Airport, West Africa\'s premier aviation hub and the gateway to Ghana.',
    tags: ['Engineering', 'History', 'Infrastructure', 'Aviation'],
    images: [
      {
        src: '../images/dam.jpg',
        alt: 'Akosombo Dam on the Volta River — one of the world\'s largest man-made lakes'
      },
      {
        src: '../images/accra-airport.jpg',
        alt: 'Accra International Airport in Accra — gateway to Ghana'
      }
    ]
  }
];

/* ─── Storage helpers ───────────────────────────── */
const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); } catch { /* storage full / denied */ }
  },
  getJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  setJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* */ }
  }
};

/* ─── App state ─────────────────────────────────── */
let votes    = {};   // { id: count }
let selected = null; // currently selected destination id
let hasVoted = false;
let deadline = null; // Date object
let votingClosed = false;

/* ─── Deadline (fixed, 1 week from first visit) ─── */
function initDeadline() {
  const saved = store.get('aob_deadline');
  if (saved) {
    deadline = new Date(saved);
  } else {
    deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // exactly 7 days
    store.set('aob_deadline', deadline.toISOString());
  }
}

/* ─── Vote data ─────────────────────────────────── */
function initVotes() {
  const saved = store.getJSON('aob_votes');
  if (saved && typeof saved === 'object') {
    votes = saved;
  } else {
    // Start every destination at 0 — NO pre-loaded numbers
    votes = {};
    DESTINATIONS.forEach(d => { votes[d.id] = 0; });
    store.setJSON('aob_votes', votes);
  }

  // Ensure all destinations exist in votes object
  let updated = false;
  DESTINATIONS.forEach(d => {
    if (typeof votes[d.id] !== 'number') {
      votes[d.id] = 0;
      updated = true;
    }
  });
  if (updated) store.setJSON('aob_votes', votes);

  hasVoted = store.get('aob_has_voted') === '1';
}

/* ═══════════════════════════════════════════════════
   RENDER CARDS
═══════════════════════════════════════════════════ */
function renderCards() {
  const grid = document.getElementById('destGrid');
  grid.innerHTML = '';

  DESTINATIONS.forEach((d, i) => {
    const card = document.createElement('div');
    card.className = 'dest-card reveal' + (hasVoted ? ' voted-locked' : '');
    card.id = 'card-' + d.id;
    card.style.transitionDelay = (i * 0.07) + 's';

    const isDual = d.images.length === 2;

    let imgHTML;
    if (isDual) {
      // Crossfade carousel — both images stacked, first active
      imgHTML = `
        <div class="card-img-area dual" data-card-id="${d.id}">
          <img src="${d.images[0].src}" alt="${d.images[0].alt}" class="card-img ci-active" loading="lazy">
          <img src="${d.images[1].src}" alt="${d.images[1].alt}" class="card-img" loading="lazy">
          <div class="card-img-dots">
            <div class="ci-dot active"></div>
            <div class="ci-dot"></div>
          </div>
          <div class="card-photo-count">📷 2 photos</div>
        </div>`;
    } else {
      imgHTML = `
        <div class="card-img-area">
          <img src="${d.images[0].src}" alt="${d.images[0].alt}" class="card-img" loading="lazy">
        </div>`;
    }

    card.innerHTML = `
      ${imgHTML}
      <span class="card-badge ${d.badgeClass}">${d.badge}</span>
      <div class="card-check">✓</div>
      <div class="card-body">
        <div class="card-region">${d.region}</div>
        <div class="card-name">${d.name}</div>
        <div class="card-desc">${d.desc}</div>
        <div class="card-tags">${d.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    `;

    if (!hasVoted && !votingClosed) {
      card.addEventListener('click', () => selectCard(d.id));
    }

    grid.appendChild(card);
  });

  // Restore selection visuals
  if (selected) {
    document.getElementById('card-' + selected)?.classList.add('selected');
  }
  if (hasVoted) {
    const votedFor = store.get('aob_voted_for');
    if (votedFor) {
      document.getElementById('card-' + votedFor)?.classList.add('selected');
    }
    document.getElementById('alreadyVotedBanner').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('submitHint').style.display = 'none';
  }
  if (votingClosed) {
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('submitHint').textContent = '⏱ Selection has closed. Check the results to see where the team is going!';
  }

  // Start image carousels for dual cards
  startCardCarousels();
}

/* ═══════════════════════════════════════════════════
   CARD IMAGE CAROUSELS (dual cards only)
   Each dual card auto-crossfades between its 2
   images every 3.5 s with a 1 s fade transition.
═══════════════════════════════════════════════════ */
function startCardCarousels() {
  document.querySelectorAll('.card-img-area.dual').forEach(area => {
    const imgs = area.querySelectorAll('.card-img');
    const dots = area.querySelectorAll('.ci-dot');
    if (imgs.length < 2) return;

    let current = 0;

    setInterval(() => {
      // Fade out current
      imgs[current].classList.remove('ci-active');
      dots[current].classList.remove('active');

      // Advance
      current = (current + 1) % imgs.length;

      // Fade in next
      imgs[current].classList.add('ci-active');
      dots[current].classList.add('active');
    }, 3500);
  });
}

/* ─── Card selection ────────────────────────────── */
function selectCard(id) {
  if (hasVoted || votingClosed) return;

  selected = (selected === id) ? null : id; // toggle off if clicking same

  document.querySelectorAll('.dest-card').forEach(c => c.classList.remove('selected'));
  if (selected) {
    document.getElementById('card-' + selected)?.classList.add('selected');
  }

  const btn  = document.getElementById('submitBtn');
  const hint = document.getElementById('submitHint');

  if (selected) {
    btn.disabled = false;
    const name = DESTINATIONS.find(d => d.id === selected)?.name || '';
    hint.textContent = `"${name}" selected — click the button below to confirm your vote!`;
  } else {
    btn.disabled = true;
    hint.textContent = 'Tap a destination above — which one would you love to visit?';
  }
}

/* ═══════════════════════════════════════════════════
   SUBMIT VOTE
═══════════════════════════════════════════════════ */
function submitVote() {
  if (!selected || hasVoted || votingClosed) return;

  // Record vote
  votes[selected] = (votes[selected] || 0) + 1;
  hasVoted = true;

  store.setJSON('aob_votes', votes);
  store.set('aob_has_voted', '1');
  store.set('aob_voted_for', selected);

  // Lock UI
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('submitBtn').style.display = 'none';
  document.getElementById('submitHint').style.display = 'none';
  document.getElementById('alreadyVotedBanner').style.display = 'block';

  document.querySelectorAll('.dest-card').forEach(c => {
    c.classList.add('voted-locked');
    c.style.cursor = 'default';
  });

  showToast('🎉 Your vote is in! Scroll down to see where the team wants to go.');
  renderResults();

  setTimeout(() => {
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
  }, 900);
}

/* ═══════════════════════════════════════════════════
   RENDER RESULTS
═══════════════════════════════════════════════════ */
function renderResults() {
  const sorted = [...DESTINATIONS]
    .map(d => ({ ...d, voteCount: votes[d.id] || 0 }))
    .sort((a, b) => b.voteCount - a.voteCount);

  const total = sorted.reduce((s, d) => s + d.voteCount, 0);

  // Winner block
  const leader = sorted[0];
  const winnerCard = document.getElementById('winnerCard');

  if (total === 0) {
    winnerCard.style.display = 'none';
    document.getElementById('barChart').innerHTML = `
      <p class="results-empty">No votes yet — be the first to choose your destination! 📍 🗳️</p>
    `;
    document.getElementById('totalNote').textContent = '';
    document.getElementById('winnerCard').style.display = 'none';
    return;
  }

  winnerCard.style.display = 'flex';
  document.getElementById('winnerName').textContent = leader.name;
  const pct = total > 0 ? Math.round((leader.voteCount / total) * 100) : 0;
  document.getElementById('winnerMeta').textContent =
    `${leader.voteCount.toLocaleString()} vote${leader.voteCount !== 1 ? 's' : ''} (${pct}% of the team)`;

  // Bars
  const chart = document.getElementById('barChart');
  chart.innerHTML = '';

  sorted.forEach((d, i) => {
    const pct = total > 0 ? Math.round((d.voteCount / total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'bar-row reveal';
    row.style.transitionDelay = (i * 0.06) + 's';
    row.innerHTML = `
      <div class="bar-labels">
        <span class="bar-lname">${i === 0 ? '🥇 ' : ''}${d.name}</span>
        <span class="bar-lpct">${pct}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" data-pct="${pct}" style="width:0%"></div>
      </div>
    `;
    chart.appendChild(row);
  });

  // Animate bars (small delay for transition to kick in)
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
    // trigger reveal on new rows
    document.querySelectorAll('.bar-row.reveal').forEach(el => revealObserver.observe(el));
  }, 120);

  document.getElementById('totalNote').textContent =
    `${total.toLocaleString()} person${total !== 1 ? 's' : ''} have made their vote`;
}

/* ═══════════════════════════════════════════════════
   COUNTDOWN
═══════════════════════════════════════════════════ */
function startCountdown() {
  const cdD = document.getElementById('cdD');
  const cdH = document.getElementById('cdH');
  const cdM = document.getElementById('cdM');
  const cdS = document.getElementById('cdS');
  const bar = document.querySelector('.cd-units');

  function tick() {
    const diff = deadline - Date.now();

    if (diff <= 0) {
      clearInterval(timer);
      votingClosed = true;
      bar.innerHTML = '<div class="cd-expired">Selection has closed</div>';
      // Lock voting UI if somehow still open
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.display = 'none';
      }
      const hint = document.getElementById('submitHint');
      if (hint) hint.textContent = '⏱ Selection has closed. Check the results to see where the team is going!';
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    cdD.textContent = String(d).padStart(2, '0');
    cdH.textContent = String(h).padStart(2, '0');
    cdM.textContent = String(m).padStart(2, '0');
    cdS.textContent = String(s).padStart(2, '0');
  }

  tick();
  const timer = setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════
   HERO SLIDER
═══════════════════════════════════════════════════ */
let currentHeroSlide = 0;
const HERO_COUNT = 5;
let heroTimer;

function heroGoTo(n) {
  currentHeroSlide = ((n % HERO_COUNT) + HERO_COUNT) % HERO_COUNT;
  document.getElementById('heroSlider').style.transform =
    `translateX(-${currentHeroSlide * 100}%)`;
  document.querySelectorAll('.hero-slide').forEach((s, i) =>
    s.classList.toggle('active', i === currentHeroSlide)
  );
  document.querySelectorAll('.h-dot').forEach((dot, i) =>
    dot.classList.toggle('active', i === currentHeroSlide)
  );
}

function heroSlide(dir) {
  clearInterval(heroTimer);
  heroGoTo(currentHeroSlide + dir);
  heroStartAuto();
}

function heroStartAuto() {
  heroTimer = setInterval(() => heroGoTo(currentHeroSlide + 1), 5500);
}

function buildHeroDots() {
  const wrap = document.getElementById('heroDots');
  for (let i = 0; i < HERO_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'h-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => {
      clearInterval(heroTimer);
      heroGoTo(i);
      heroStartAuto();
    });
    wrap.appendChild(dot);
  }
}

/* ═══════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════ */
function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
  });

  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobileDrawer');
  const backdrop  = document.getElementById('drawerBackdrop');
  const closeBtn  = document.getElementById('drawerClose');

  function openDrawer()  { drawer.classList.add('open'); backdrop.classList.add('visible'); }
  function closeDrawer() { drawer.classList.remove('open'); backdrop.classList.remove('visible'); }

  hamburger.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Close drawer on any drawer link click
  drawer.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ═══════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

function observeReveal() {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// Watch for new .reveal elements added to DOM
const revealMutation = new MutationObserver(() => {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
});

/* ═══════════════════════════════════════════════════
   SHARE BUTTONS
═══════════════════════════════════════════════════ */
function initShare() {
  const url   = encodeURIComponent(window.location.href);
  const text  = encodeURIComponent('I just voted my top Ghana destination for our AOB NSS group trip! 🇬🇭 AOB NSS Personnel Tourism Vote 2026 — pick yours too!');

  document.getElementById('shareWhatsApp').href =
    `https://wa.me/?text=${text}%20${url}`;
  document.getElementById('shareTwitter').href =
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

function copyLink() {
  const link = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      document.getElementById('cpIcon').textContent = '✅';
      document.getElementById('cpTxt').textContent  = 'Copied!';
      setTimeout(() => {
        document.getElementById('cpIcon').textContent = '🔗';
        document.getElementById('cpTxt').textContent  = 'Copy Link';
      }, 2500);
    });
  } else {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = link;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Link copied!');
  }
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast' + (isError ? ' error' : '') + ' show';
  setTimeout(() => { t.className = 'toast' + (isError ? ' error' : ''); }, 3500);
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initDeadline();
  initVotes();

  // Check deadline immediately
  if (Date.now() >= deadline.getTime()) {
    votingClosed = true;
  }

  buildHeroDots();
  heroStartAuto();
  initNavbar();
  renderCards();
  renderResults();
  startCountdown();
  initShare();

  setTimeout(observeReveal, 80);

  revealMutation.observe(document.body, { childList: true, subtree: true });
});