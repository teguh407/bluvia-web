/* ========================================
   BLUVIA Site — API Integration
   ======================================== */

const API_BASE = '';  // Same origin — nginx proxies /api/ to backend

// ── Toast Notification ──
function showToast(message, duration = 2500) {
  let toast = document.getElementById('bluvia-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bluvia-toast';
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:0.75rem 1.5rem;border-radius:var(--radius-full);font-size:var(--fs-sm);font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;box-shadow:0 4px 20px rgba(59,130,246,0.4);';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

async function api(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API error: ${endpoint}`, err);
    return null;
  }
}

function posterUrl(drama) {
  // Prefer full URLs from DB (CDN)
  if (drama.poster_url && drama.poster_url.startsWith('http')) return drama.poster_url;
  if (drama.poster && drama.poster.startsWith('http')) return drama.poster;
  // Relative API paths
  if (drama.poster && drama.poster.startsWith('/')) return API_BASE + drama.poster;
  if (drama.poster_url && drama.poster_url.startsWith('/')) return API_BASE + drama.poster_url;
  // fallback: build from id/slug
  const id = drama.id || drama.slug || '';
  return `${API_BASE}/api/poster/${id}`;
}

function cleanTitle(s) {
  if (!s) return '';
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// ── Utility: URL parameter helpers ──
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ── Drama Card Click Handler ──
function makeDramaClickable(element, drama) {
  element.style.cursor = 'pointer';
  const dramaId = drama.id || (drama.category && drama.slug ? drama.category + '/' + drama.slug : drama.slug || '');
  element.dataset.dramaId = dramaId;
  // Wrap inner HTML with <a> tag for right-click "Open in new tab"
  const link = document.createElement('a');
  link.href = dramaId ? `/drama/${dramaId}` : '#';
  link.style.cssText = 'color:inherit;text-decoration:none;display:block;';
  // Move all children into the link
  while (element.firstChild) {
    link.appendChild(element.firstChild);
  }
  element.appendChild(link);
  // Click handler on the element itself
  element.addEventListener('click', (e) => {
    e.preventDefault();
    if (dramaId) {
      window.location.href = `/drama/${dramaId}`;
    }
  });
}

// ── Navigation Setup ──
function initNavigation() {
  // Navbar / sidebar nav links on ALL pages
  document.querySelectorAll('a').forEach(a => {
    const text = a.textContent.trim().toLowerCase();

    if (text === 'home') {
      a.href = 'home.html';
    } else if (text === 'ongoing') {
      a.href = 'home.html?view=ongoing';
    } else if (text === 'terbaru') {
      a.href = 'home.html?view=terbaru';
    } else if (text === 'kategori') {
      a.href = 'kategori.html';
    } else if (text === 'daftar suka') {
      a.href = 'mylist.html';
    } else if (text === 'riwayat tonton') {
      a.href = 'history.html';
    } else if (text === 'downloads') {
      a.href = 'downloads.html';
    } else if (text === 'daftar saya') {
      a.href = 'mylist.html';
    } else if (text === 'pengaturan') {
      a.href = 'settings.html';
    }
  });

  // Make existing "Mulai Menonton" and "Tonton Sekarang" buttons functional
  document.querySelectorAll('a').forEach(a => {
    const text = a.textContent.trim().toLowerCase();
    if (text === 'mulai menonton' && a.href.endsWith('home.html')) {
      a.href = 'home.html';
    }
    if (text === 'tonton sekarang') {
      a.href = 'home.html';
    }
  });

  // Ctrl+K search shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('.search-bar input');
      if (searchInput) searchInput.focus();
    }
  });

  // Genre cards → home.html?genre={genre_name}
  document.querySelectorAll('.kategori-card, .genre-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const nameEl = card.querySelector('.kategori-name, .genre-name');
      if (nameEl) {
        window.location.href = `kategori.html?cat=${nameEl.textContent.trim().toLowerCase().replace(/\s+/g, "-")}`;
      }
    });
  });

  // Search → home.html?search={query}
  document.querySelectorAll('.search-bar input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = `/?q=${encodeURIComponent(query)}`;
        }
      }
    });
  });

  // Make all existing poster cards clickable via data attributes (will be set dynamically too)
  // Static poster cards in HTML — make them go to drama.html using title as a rough ID
  document.querySelectorAll('.poster-card').forEach(card => {
    const titleEl = card.querySelector('.poster-title');
    if (titleEl) {
      card.style.cursor = 'pointer';
      // Add <a> wrapper for right-click "Open in new tab" if not already wrapped
      if (!card.querySelector('a')) {
        const title = titleEl.textContent.trim();
        const link = document.createElement('a');
        link.href = title ? `/drama/drama-korea/${encodeURIComponent(title)}` : '#';
        link.style.cssText = 'color:inherit;text-decoration:none;display:block;';
        while (card.firstChild) link.appendChild(card.firstChild);
        card.appendChild(link);
      }
      card.addEventListener('click', () => {
        if (card.dataset.dramaId) return;
        const title = titleEl.textContent.trim();
        if (title) {
          window.location.href = `/drama/drama-korea/${encodeURIComponent(title)}`;
        }
      });
    }
  });

  // Ranking items — make clickable
  document.querySelectorAll('.ranking-item').forEach(item => {
    const titleEl = item.querySelector('.ranking-title');
    if (titleEl) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        // Runtime check: if makeDramaClickable already took over, skip
        if (item.dataset.dramaId) return;
        const title = titleEl.textContent.trim();
        if (title) {
          window.location.href = `/drama/drama-korea/${encodeURIComponent(title)}`;
        }
      });
    }
  });

  // Continue watching cards → player.html
  document.querySelectorAll('.continue-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const titleEl = card.querySelector('.cc-title');
      const epEl = card.querySelector('.cc-episode');
      if (titleEl) {
        const title = titleEl.textContent.trim();
        let ep = 1;
        if (epEl) {
          const match = epEl.textContent.match(/(\d+)/);
          if (match) ep = parseInt(match[1]);
        }
        window.location.href = `/play/${title}?ep=${ep}`;
      }
    });
  });

  // Pagination dots — switch hero slides
  document.querySelectorAll('.dots').forEach(dotsContainer => {
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        dots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        // If there's a scrollable container nearby, scroll to approximate position
        const section = dotsContainer.closest('section') || dotsContainer.closest('.home-hero');
        if (section) {
          const scrollEl = section.querySelector('.h-scroll');
          if (scrollEl) {
            const cardWidth = 220; // approximate card width + gap
            scrollEl.scrollTo({ left: i * cardWidth * 3, behavior: 'smooth' });
          }
        }
      });
    });
  });

  // Hero nav buttons (home.html)
  const heroNavBtns = document.querySelectorAll('.hero-nav-btn');
  if (heroNavBtns.length === 2) {
    heroNavBtns[0].addEventListener('click', () => {
      // Previous — just a visual feedback
      const dots = document.querySelectorAll('.home-hero .dot, .home-hero .dots .dot');
      const activeIdx = [...dots].findIndex(d => d.classList.contains('active'));
      if (activeIdx > 0) {
        dots[activeIdx].classList.remove('active');
        dots[activeIdx - 1].classList.add('active');
      }
    });
    heroNavBtns[1].addEventListener('click', () => {
      const dots = document.querySelectorAll('.home-hero .dot, .home-hero .dots .dot');
      const activeIdx = [...dots].findIndex(d => d.classList.contains('active'));
      if (activeIdx < dots.length - 1) {
        dots[activeIdx].classList.remove('active');
        dots[activeIdx + 1].classList.add('active');
      }
    });
  }
}

// ── Login Setup ──
function initLogin() {
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    // Only attach if this is the login page (not register page)
    if (document.getElementById('register-form')) return;
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      if (errEl) errEl.style.display = 'none';
      
      const email = loginForm.querySelector('input[type="text"]')?.value || '';
      const pw = loginForm.querySelector('input[type="password"]')?.value || '';
      
      if (!email || !pw) return;
      
      const btn = loginForm.querySelector('.login-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Masuk...'; }
      
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pw })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.detail || 'Login gagal');
        
        localStorage.setItem('bluvia_logged_in', 'true');
        localStorage.setItem('bluvia_token', data.access_token);
        localStorage.setItem('bluvia_user', data.display_name || email.split('@')[0]);
        window.location.href = 'home.html';
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }
      }
    });

    // Also make Google button store login
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        localStorage.setItem('bluvia_logged_in', 'true');
        localStorage.setItem('bluvia_user', 'Pengguna Google');
        window.location.href = 'home.html';
      });
    }
  }
}

// ── Hero Carousel ──
// ── Dynamic Hero (from API) ──
let heroData = [];
let heroIdx = 0;
let heroTimer = null;

async function loadHeroData() {
  try {
    const [featRes, trendRes] = await Promise.all([
      api('/api/featured'),
      api('/api/trending')
    ]);
    const featured = (featRes?.dramas || featRes || []).slice(0, 3);
    const trending = (trendRes?.dramas || trendRes || []).slice(0, 5);

    // Merge: featured first, then trending (dedupe by id)
    const seen = new Set();
    const merged = [];
    [...featured, ...trending].forEach(d => {
      const id = d.id || d.slug || d.title;
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(d);
      }
    });

    heroData = merged.slice(0, 7).map((d, i) => {
      const badges = ['NEW EPISODE', 'TRENDING', 'ONGOING', 'NEW SERIES', 'FINALE'];
      const badgeClasses = ['badge-new', 'badge-new', 'badge-ongoing', 'badge-new', 'badge-ongoing'];
      return {
        badge: badges[i % badges.length],
        badgeClass: badgeClasses[i % badgeClasses.length],
        title: d.title || '',
        year: d.year || '',
        ep: d.total_episodes ? d.total_episodes + ' Episodes' : (d.episode_count ? d.episode_count + ' Episodes' : ''),
        desc: d.synopsis || '',
        bg: d.poster_url || '',
        dramaId: d.id || d.slug || '',
        slug: d.slug || '',
        category: d.category || 'drama-korea'
      };
    });
  } catch (e) {
    console.error('Hero load error:', e);
    // Fallback: empty hero
    heroData = [];
  }
}

function heroSlide(dir) {
  if (heroData.length === 0) return;
  heroIdx = (heroIdx + dir + heroData.length) % heroData.length;
  renderHero();
  resetHeroTimer();
}

function renderHero() {
  if (heroData.length === 0) return;
  const d = heroData[heroIdx];
  const bg = document.getElementById('hero-bg');
  const badge = document.getElementById('hero-badge');
  const title = document.getElementById('hero-title');
  const year = document.getElementById('hero-year');
  const ep = document.getElementById('hero-ep');
  const desc = document.getElementById('hero-desc');
  const watchBtn = document.getElementById('hero-watch-btn');
  if (!bg) return;
  bg.style.background = `linear-gradient(90deg, rgba(8,12,24,0.95) 0%, rgba(8,12,24,0.6) 60%, rgba(8,12,24,0.2) 100%), url('${d.bg}') center/cover`;
  badge.textContent = d.badge;
  badge.className = 'badge ' + d.badgeClass;
  title.textContent = d.title;
  year.textContent = d.year;
  ep.textContent = d.ep;
  desc.textContent = d.desc;
  // Set "Tonton Sekarang" button to correct drama
  if (watchBtn) {
    const dramaPath = d.dramaId || d.slug;
    watchBtn.href = dramaPath ? `/drama/${dramaPath}` : '#';
  }
}

function resetHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => heroSlide(1), 6000);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('hero-carousel')) {
    await loadHeroData();
    renderHero();
    resetHeroTimer();
  }
});

// ── Home Page Login Check ──
function initHomeAuth() {
  const greetingEl = document.querySelector('.profile-greeting');
  const navNameEl = document.querySelector('.user-menu span');
  if (greetingEl) {
    const logged = localStorage.getItem('bluvia_logged_in');
    let user = localStorage.getItem('bluvia_user') || 'Pengunjung';
    // Parse JSON if stored as object string
    let displayName = user;
    try {
      const parsed = JSON.parse(user);
      if (parsed && typeof parsed === 'object') {
        displayName = parsed.display_name || parsed.email || 'Pengunjung';
        localStorage.setItem('bluvia_user', displayName); // normalize to string
      }
    } catch(e) {}
    if (logged === 'true') {
      greetingEl.textContent = `Halo, ${displayName} 👋`;
      if (navNameEl) navNameEl.textContent = displayName;
    } else {
      greetingEl.innerHTML = `Halo, Pengunjung 👋<br><a href="login.html" style="font-size:var(--fs-xs);color:var(--accent);">Login untuk fitur lengkap</a>`;
      if (navNameEl) navNameEl.textContent = "Pengunjung";
    }
  }
}

// ── Search Results (Landing Page) ──
async function initSearchResults() {
const query = getUrlParam('q') || getUrlParam('search');
  if (!query) return false; // not a search page

  document.title = `Search: ${query} — BLUVIA`;

  // Search both GDrive + drakorid catalog in parallel
  const [gdriveRes, dkRes] = await Promise.all([
    api(`/api/search?q=${encodeURIComponent(query)}`),
    api(`/api/dramakorea/search?q=${encodeURIComponent(query)}`),
  ]);

  // Find the main content area on the landing page
  const mainContent = document.querySelector('.home-content') || document.querySelector('.main-content');
  if (!mainContent) return true;

  // Clear existing sections
  mainContent.innerHTML = '';

  // Build search results UI
  const section = document.createElement('section');
  section.className = 'section-search-results';

  const gdriveDramas = gdriveRes ? (Array.isArray(gdriveRes) ? gdriveRes : (gdriveRes.dramas || gdriveRes.results || [])) : [];
  const dkDramas = dkRes?.dramas || [];
  const allDramas = [...dkDramas, ...gdriveDramas];

  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Hasil Pencarian: "${query}" (${allDramas.length})</h2>
      <a href="home.html" class="section-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Kembali
      </a>
    </div>
    <div class="h-scroll" style="display:flex;flex-wrap:wrap;gap:var(--space-md);"></div>
  `;
  mainContent.appendChild(section);

  const grid = section.querySelector('.h-scroll');
  if (grid) {
    grid.style.flexWrap = 'wrap';

    if (allDramas.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem 0;">Tidak ada hasil ditemukan untuk "' + query + '"</p>';
      return true;
    }

    allDramas.forEach(d => {
      const title = d.title || cleanTitle(d.id || '');
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.style.minWidth = '180px';
      card.style.cursor = 'pointer';
      card.dataset.dramaId = d.id || '';
      card.innerHTML = `
        <img class="poster-img" src="${d.poster_url || posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''}${d.has_streaming ? ' · ▶' : ''}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        window.location.href = `/drama/${d.id || title}`;
      });
      grid.appendChild(card);
    });
  }

  return true;
}

// ── Index Page (Landing) ──
async function initLanding() {
  // First check if this is a search results page
  const isSearch = await initSearchResults();
  if (isSearch) return; // search results already rendered

  const [featuredRes, trendingRes, recentlyRes, dkRes, vsRes] = await Promise.all([
    api('/api/featured'),
    api('/api/trending'),
    api('/api/recently-added'),
    api('/api/dramakorea?limit=30&sort=newest'),
    api('/api/home/kategori/variety-show?limit=7'),
  ]);
  const featured = featuredRes?.dramas || featuredRes || [];
  const trending = trendingRes?.dramas || trendingRes || [];
  const recently = recentlyRes?.dramas || recentlyRes || [];
  const dkDramas = dkRes?.dramas || dkRes || [];
  const vsDramas = vsRes?.dramas || [];

  // ── Clear ALL static placeholder cards ──
  const epBaruScroll = document.getElementById('episode-baru-scroll');
  if (epBaruScroll) epBaruScroll.innerHTML = '';

  // ── Hero ──
  if (featured && featured.length > 0) {
    const f = featured[0];
    const heroCard = document.querySelector('.hero-new-ep-card');
    if (heroCard) {
      const badge = heroCard.querySelector('.badge');
      if (badge) badge.textContent = 'NEW EPISODE';
      const h3 = heroCard.querySelector('h3');
      if (h3) h3.textContent = f.title;
      const epLabel = heroCard.querySelector('.ep-label');
      if (epLabel) epLabel.textContent = `${f.episode_count} Episodes`;
      const desc = heroCard.querySelector('.ep-desc');
      if (desc) desc.textContent = f.synopsis || '';
      makeDramaClickable(heroCard, f);
      const watchBtn = heroCard.querySelector('a.btn');
      if (watchBtn) {
        watchBtn.href = `/drama/${f.id}`;
        watchBtn.addEventListener('click', (e) => e.stopPropagation());
      }
    }
  }

  // ── Landing page sections (index.html) ──
  const landingSections = [
    { id: 'landing-drama-korea', dramas: dkDramas.slice(0, 7) },
    { id: 'landing-film-korea', dramas: trending.filter(d => (d.category || '').includes('Film') || (d.id || '').includes('film-korea')).slice(0, 7) },
    { id: 'landing-drama-china', dramas: trending.filter(d => (d.category || '').includes('China') || (d.id || '').includes('drama-china')).slice(0, 7) },
    { id: 'landing-variety-show', dramas: vsDramas.slice(0, 7) },
  ];
  landingSections.forEach(({ id, dramas }) => {
    const grid = document.querySelector(`#${id} .popular-grid`);
    if (grid && dramas.length > 0) {
      grid.innerHTML = '';
      dramas.forEach((d, i) => {
        const title = d.title || cleanTitle(d.id || '');
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="poster-rank">${i + 1}</div>
          ${i === 0 ? '<span class="poster-badge badge badge-new">NEW</span>' : ''}
          <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.episode_count || d.year || ''}</div>
          </div>
        `;
        makeDramaClickable(card, d);
        grid.appendChild(card);
      });
    }
  });

  // ── Populer Minggu Ini (trending) ──
  if (trending && trending.length > 0) {
    const container = document.querySelector('#landing-populer .popular-grid') || document.querySelector('.popular-grid');
    if (container) {
      container.innerHTML = '';
      trending.slice(0, 7).forEach((d, i) => {
        const title = d.title || cleanTitle(d.id || '');
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="poster-rank">${i + 1}</div>
          ${i === 0 ? '<span class="poster-badge badge badge-new">NEW</span>' : ''}
          <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.episode_count || ''} episodes</div>
          </div>
        `;
        makeDramaClickable(card, d);
        container.appendChild(card);
      });
    }
  }

  // ── Episode Baru (recently added + streaming-enabled) ──
  if (epBaruScroll) {
    const streamable = dkDramas.filter(d => d.has_streaming).slice(0, 5);
    const merged = [...streamable, ...recently].slice(0, 7);
    merged.forEach(d => {
      const title = d.title || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.style.minWidth = '180px';
      card.innerHTML = `
        <span class="poster-badge badge">${d.episode_count || d.total_episodes || 'New'}</span>
        <img class="poster-img" src="${d.poster_url || posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''}</div>
        </div>
      `;
      makeDramaClickable(card, d);
      epBaruScroll.appendChild(card);
    });
  }

  // ── Ranking sections: Film Korea, Drama China ──
  const sections = [
    { id: 'ranking-film-korea', dramas: trending.filter(d => (d.category || '').includes('Film')).slice(0, 7) },
    { id: 'ranking-drama-china', dramas: trending.filter(d => (d.category || '').includes('China')).slice(0, 7) },
  ];
  sections.forEach(({ id, dramas }) => {
    const grid = document.querySelector(`#${id} .genre-grid, [data-section="${id}"] .genre-grid`);
    if (grid && dramas.length > 0) {
      grid.innerHTML = '';
      dramas.forEach((d, i) => {
        const title = d.title || cleanTitle(d.id || '');
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="poster-rank">${i + 1}</div>
          <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.year || ''} · ${d.episode_count || 'Film'}</div>
          </div>
        `;
        makeDramaClickable(card, d);
        grid.appendChild(card);
      });
    }
  });

  // ── Drama Korea scroll (logged-in section visible to all) ──
  const dkSection = document.getElementById('drama-korea-scroll');
  if (dkSection && dkDramas.length > 0) {
    dkSection.innerHTML = '';
    dkDramas.slice(0, 7).forEach(d => {
      const title = d.title || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <img class="poster-img" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''} · ${d.total_episodes || '?'} eps${d.has_streaming ? ' · ▶' : ''}</div>
        </div>
      `;
      card.style.cursor = 'pointer';
      makeDramaClickable(card, d);
      dkSection.appendChild(card);
    });
  }

  // ── Sidebar "Populer Minggu Ini" ranking items ──
  if (trending && trending.length > 0) {
    const rankingCard = document.querySelector('.ranking-card');
    if (rankingCard) {
      rankingCard.querySelectorAll('.ranking-item').forEach(el => el.remove());
      trending.slice(0, 5).forEach((d, i) => {
        const title = d.title || cleanTitle(d.id || '');
        const numClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : 'other';
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="ranking-num ${numClass}">${i + 1}</div>
          <img class="ranking-thumb" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="ranking-info">
            <div class="ranking-title">${title}</div>
            <div class="ranking-ep">${d.episode_count || ''} episodes</div>
          </div>
        `;
        makeDramaClickable(item, d);
        rankingCard.appendChild(item);
      });
    }
  }
}

// ── Home Page (After Login) ──
async function initHome() {
  // Single API call for all home data
  const home = await api('/api/home');
  if (!home) return;

  const dkDramas = home.korea_all || [];
  const recently = home.ongoing || [];
  const fcDramas = home.film_china || [];
  const djDramas = home.drama_jepang || [];
  const fjDramas = home.film_jepang || [];
  const vsDramas = home.variety_show || [];
  const fkDramas = home.film_korea || [];
  const dcDramas = home.drama_china || [];
  const trendingDramas = home.top_rated || home.trending || [];

  // ── Drama Korea section: all from drakorid catalog ──
  const dkSection = document.getElementById('drama-korea-scroll');
  if (dkSection && dkDramas.length > 0) {
    dkSection.innerHTML = '';
    dkDramas.slice(0, 7).forEach(d => {
      const title = d.title || '';
      const dramaId = d.id || (d.category && d.slug ? d.category + '/' + d.slug : d.slug || '');
      const epLabel = d.total_episodes || d.episode || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <img class="poster-img" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''}${epLabel ? ' · ' + epLabel + ' eps' : ''}</div>
        </div>
      `;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = `/drama/${dramaId}`;
      });
      dkSection.appendChild(card);
    });
  }

  // ── Episode Baru: ongoing dramas with episode numbers from drakorid.co ──
  const epBaru = document.getElementById('episode-baru-scroll');
  if (epBaru) {
    epBaru.innerHTML = '';
    // Use ongoing dramas (from drakorid.co/drama-ongoing/) — they have episode numbers
    const ongoing = Array.isArray(recently) ? recently : (recently?.dramas || recently?.items || []);
    ongoing.slice(0, 7).forEach(d => {
      const title = d.title || '';
      const dramaId = d.id || (d.category && d.slug ? d.category + '/' + d.slug : d.slug || '');
      const epNum = d.episode || d.total_episodes || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <span class="poster-badge badge">Ep. ${epNum || '?'}</span>
        <img class="poster-img" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">Episode ${epNum || '?'}</div>
        </div>
      `;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = `/drama/${dramaId}`;
      });
      epBaru.appendChild(card);
    });
  }

  // ── Helper: populate a category section ──
  function fillCategorySection(containerId, dramas) {
    const el = document.getElementById(containerId);
    if (!el || dramas.length === 0) return;
    el.innerHTML = '';
    dramas.slice(0, 7).forEach(d => {
      const title = d.title || '';
      const dramaId = d.id || (d.category && d.slug ? d.category + '/' + d.slug : d.slug || '');
      const epLabel = d.total_episodes || d.episode || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <img class="poster-img" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''}${epLabel ? ' · ' + epLabel + ' eps' : ''}</div>
        </div>
      `;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = `/drama/${dramaId}`;
      });
      el.appendChild(card);
    });
  }

  // ── Film Korea ranking section ──
  const fkScroll = document.querySelector('#ranking-film-korea .h-scroll');
  if (fkScroll && fkDramas.length > 0) {
    fkScroll.innerHTML = '';
    fkDramas.slice(0, 7).forEach((d, i) => {
      const title = d.title || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="poster-rank">${i + 1}</div>
        <img class="poster-img" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''} · Film</div>
        </div>
      `;
      makeDramaClickable(card, d);
      fkScroll.appendChild(card);
    });
  }

  // ── Trending (Populer Minggu Ini) section ──
  try {
    const trendingScroll = document.getElementById('populer-scroll');
    if (trendingScroll && trendingDramas.length > 0) {
      trendingScroll.innerHTML = '';
      trendingDramas.slice(0, 7).forEach((d, i) => {
        const title = d.title || '';
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="poster-rank">${i + 1}</div>
          <img class="poster-img" src="${d.poster_url || posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.year || ''} · ${d.episode || d.episodes || '?'} eps</div>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `/drama/${d.id || d.slug || ''}`;
        });
        trendingScroll.appendChild(card);
      });
    }
  } catch (e) { console.warn('Trending load failed:', e); }

  // ── Drama China ranking section ──
  const dcScroll = document.querySelector('#ranking-drama-china .h-scroll');
  if (dcScroll && dcDramas.length > 0) {
    dcScroll.innerHTML = '';
    dcDramas.slice(0, 7).forEach((d, i) => {
      const title = d.title || '';
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="poster-rank">${i + 1}</div>
        <img class="poster-img" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''} · ${d.total_episodes || '?'} eps</div>
        </div>
      `;
      makeDramaClickable(card, d);
      dcScroll.appendChild(card);
    });
  }

  // ── Sidebar "Populer Minggu Ini" ranking items ──
  const rankingCard = document.querySelector('.ranking-card');
  if (rankingCard && dkDramas.length > 0) {
    rankingCard.querySelectorAll('.ranking-item').forEach(el => el.remove());
    dkDramas.slice(0, 5).forEach((d, i) => {
      const title = d.title || '';
      const numClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : 'other';
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="ranking-num ${numClass}">${i + 1}</div>
        <img class="ranking-thumb" src="${d.poster_url || ''}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="ranking-info">
          <div class="ranking-title">${title}</div>
          <div class="ranking-ep">${d.total_episodes || '?'} episodes</div>
        </div>
      `;
      makeDramaClickable(item, d);
      rankingCard.appendChild(item);
    });
  }

  // ── Film China, Drama Japan, Film Japan sections ──
  fillCategorySection('film-china-scroll', fcDramas);
  fillCategorySection('drama-jepang-scroll', djDramas);
  fillCategorySection('film-jepang-scroll', fjDramas);
  fillCategorySection('variety-show-scroll', vsDramas);
}

// ── Init on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation and UI handlers on ALL pages
  initNavigation();
  initLogin();
  initHomeAuth();

  // Page-specific init (with error handling so static cards still work as fallback)
  const page = document.body.dataset.page;
  if (page === 'landing') {
    initLanding().catch(err => {
      console.error('initLanding failed:', err);
      // Static cards remain clickable via title fallback
    });
  } else if (page === 'home') {
    initHome().catch(err => {
      console.error('initHome failed:', err);
    });
  }
});

/* ══════════════════════════════════════════════════════════════
   DRAKORID.CO STYLE FEATURES
   ══════════════════════════════════════════════════════════════ */

// Episode Picker Modal
function openEpisodePicker(episodes, dramaId) {
  const modal = document.getElementById('episode-picker-modal');
  const grid = document.getElementById('episode-picker-grid');
  
  if (!modal || !grid) return;
  
  grid.innerHTML = '';
  episodes.forEach((ep, i) => {
    const btn = document.createElement('button');
    btn.className = 'episode-pick-item';
    btn.textContent = i + 1;
    btn.onclick = () => {
      window.location.href = `/play/${dramaId}?ep=${i + 1}`;
    };
    grid.appendChild(btn);
  });
  
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}
function closeEpisodePicker() {
  const modal = document.getElementById('episode-picker-modal');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Tab Switching
function initDramaTabs() {
  const tabs = document.querySelectorAll('.drama-tab');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.onclick = () => {
      const target = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
      });
      
      tab.classList.add('active');
      const content = document.getElementById(`tab-${target}`);
      if (content) {
        content.classList.add('active');
        content.style.display = 'block';
      }
    };
  });
}

// Favorite Toggle (persists to localStorage → mylist.html reads from 'bluvia_favorites')
let isFavorited = false;
function toggleFavorite() {
  const btn = document.getElementById('btn-favorite');
  if (!btn) return;

  // Get drama data from page
  const titleEl = document.getElementById('drama-title');
  const title = titleEl ? titleEl.textContent.replace(/\s*\(\d{4}\)\s*$/, '').trim() : '';
  const posterEl = document.querySelector('.drama-poster-wrap img');
  const poster = posterEl ? posterEl.src : '';
  const yearEl = document.querySelector('.drama-meta');
  const yearText = yearEl ? yearEl.textContent : '';
  const yearMatch = yearText.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : '';
  
  // Get drama ID from URL (clean URL or query param)
  const pathParts = window.location.pathname.split('/');
  let dramaId = '';
  if (pathParts.length >= 3 && pathParts[1] === 'drama') {
    dramaId = pathParts[pathParts.length - 1]; // slug
  }
  if (!dramaId) {
    const params = new URLSearchParams(window.location.search);
    dramaId = params.get('id') || '';
  }

  // Load current favorites
  let favorites = JSON.parse(localStorage.getItem('bluvia_favorites') || '[]');
  const existingIndex = favorites.findIndex(f => f.id === dramaId || f.title === title);

  if (existingIndex >= 0) {
    // Remove from favorites
    favorites.splice(existingIndex, 1);
    isFavorited = false;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Tandai Favorit
    `;
    btn.classList.remove('favorited');
  } else {
    // Add to favorites
    favorites.push({ id: dramaId, title, poster, year });
    isFavorited = true;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Favorit ✓
    `;
    btn.classList.add('favorited');
  }
  localStorage.setItem('bluvia_favorites', JSON.stringify(favorites));
}

// Initialize on drama page
document.addEventListener('DOMContentLoaded', () => {
  initDramaTabs();
  initShareButton();
  
  // Episode picker button
  const epPickerBtn = document.getElementById('btn-episode-picker');
  if (epPickerBtn) {
    epPickerBtn.onclick = () => {
      // Get episodes from page data
      const epGrid = document.getElementById('episode-grid');
      if (epGrid) {
        const epCards = epGrid.querySelectorAll('.ep-card');
        const episodes = Array.from(epCards).map((card, i) => ({
          num: i + 1,
          title: card.querySelector('.ep-name')?.textContent || `Episode ${i + 1}`
        }));
        
        // Get drama ID from URL (clean URL or query param)
        const params = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const dramaId = (pathParts.length >= 3 && pathParts[0] === 'drama')
          ? decodeURIComponent(pathParts.slice(1).join('/'))
          : params.get('id') || '';
        
        openEpisodePicker(episodes, dramaId);
      }
    };
  }
});

/* ══════════════════════════════════════════════════════════════
   VIEW FILTERING (drakorid.co style navigation)
   ══════════════════════════════════════════════════════════════ */

function getViewFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') || 'home';
}

function updateActiveNavLink(view) {
  // Update top nav
  document.querySelectorAll('.top-nav-links a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href') || '';
    if (view === 'home' && href === 'home.html') a.classList.add('active');
    else if (view === 'ongoing' && href.includes('view=ongoing')) a.classList.add('active');
    else if (view === 'terbaru' && href.includes('view=terbaru')) a.classList.add('active');
    else if (view === 'favorit' && href.includes('view=favorit')) a.classList.add('active');
    else if (view === 'kategori' && href.includes('kategori.html')) a.classList.add('active');
  });
  
  // Update sidebar nav
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href') || '';
    if (view === 'home' && href === 'home.html') a.classList.add('active');
    else if (view === 'ongoing' && href.includes('view=ongoing')) a.classList.add('active');
    else if (view === 'terbaru' && href.includes('view=terbaru')) a.classList.add('active');
    else if (view === 'favorit' && href.includes('view=favorit')) a.classList.add('active');
  });
}

function applyViewFilter(view) {
  const heroSection = document.querySelector('.home-hero');
  const lanjutkanSection = document.querySelector('.home-content section:first-of-type');
  const episodeBaruSection = document.querySelectorAll('.home-content section')[1];
  const dramaKoreaSection = document.querySelectorAll('.home-content section')[2];
  const filmKoreaSection = document.querySelectorAll('.home-content section')[3];
  const dramaChinaSection = document.querySelectorAll('.home-content section')[4];
  const kategoriSection = document.getElementById('kategori');
  
  // Hide all sections first
  const allSections = document.querySelectorAll('.home-content section');
  allSections.forEach(s => s.style.display = 'none');
  if (heroSection) heroSection.style.display = 'none';
  if (kategoriSection) kategoriSection.style.display = 'none';
  
  // Show sections based on view
  switch(view) {
    case 'home':
      // Show all sections
      allSections.forEach(s => s.style.display = '');
      if (heroSection) heroSection.style.display = '';
      if (kategoriSection) kategoriSection.style.display = '';
      document.title = 'Home — BLUVIA';
      break;
      
    case 'ongoing':
      // Show only ongoing dramas (Drama Korea section)
      if (dramaKoreaSection) dramaKoreaSection.style.display = '';
      document.title = 'Ongoing — BLUVIA';
      break;
      
    case 'terbaru':
      // Show only latest (Episode Baru section)
      if (episodeBaruSection) episodeBaruSection.style.display = '';
      document.title = 'Terbaru — BLUVIA';
      break;
      
    case 'favorit':
      // Show favorites prompt
      const favSection = document.createElement('section');
      favSection.innerHTML = `
        <div style="text-align:center;padding:var(--space-2xl);color:var(--text-secondary);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:var(--space-md);opacity:0.5;">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h3 style="margin-bottom:var(--space-sm);color:var(--text-primary);">Daftar Suka</h3>
          <p>Simpan drama favoritmu dan tonton kapan saja.</p>
          <a href="login.html" class="btn btn-primary" style="margin-top:var(--space-lg);display:inline-flex;align-items:center;gap:var(--space-sm);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Masuk untuk Menyimpan
          </a>
        </div>
      `;
      const homeContent = document.querySelector('.home-content') || document.querySelector('.main-content');
      homeContent.insertBefore(favSection, homeContent.firstChild);
      document.title = 'Daftar Suka — BLUVIA';
      break;
      
    case 'kategori':
      // Show only kategori section
      if (kategoriSection) kategoriSection.style.display = '';
      document.title = 'Kategori — BLUVIA';
      break;
  }
}

// Initialize view filtering on page load
document.addEventListener('DOMContentLoaded', () => {
  const view = getViewFromURL();
  updateActiveNavLink(view);
  applyViewFilter(view);
});


// ══════════════════════════════════════════════════════════════
// DRAMA DETAIL FEATURES
// ══════════════════════════════════════════════════════════════

// ── Star Rating ──
function initStarRating(dramaId) {
  const container = document.querySelector('.star-rating');
  if (!container) return;
  const stars = container.querySelectorAll('.star');
  const avgEl = document.querySelector('.star-rating-avg');
  const saved = parseInt(localStorage.getItem('bluvia_rating_' + dramaId)) || 0;
  
  function updateStars(rating) {
    stars.forEach((s, i) => {
      s.classList.toggle('active', i < rating);
    });
    if (avgEl) {
      const allRatings = JSON.parse(localStorage.getItem('bluvia_ratings') || '{}');
      allRatings[dramaId] = rating;
      const vals = Object.values(allRatings);
      const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '0.0';
      avgEl.innerHTML = '<strong>' + avg + '</strong> / 5';
    }
  }
  
  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      localStorage.setItem('bluvia_rating_' + dramaId, i + 1);
      updateStars(i + 1);
    });
    star.addEventListener('mouseenter', () => {
      stars.forEach((s, j) => s.classList.toggle('hovered', j <= i));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hovered'));
    });
  });
  
  updateStars(saved);
}

// ── Share Button ──
function initShareButton() {
  const btn = document.getElementById('btn-share');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link berhasil disalin!');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Link berhasil disalin!');
    });
  });
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:0.75rem 1.5rem;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;animation:fadeInUp 0.3s ease;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 2000);
  setTimeout(() => toast.remove(), 2500);
}

// ── Episode Sort ──
let episodeSortAsc = true;
function initEpisodeSort(dramaId) {
  const btn = document.getElementById('sort-episodes');
  if (!btn) return;
  const saved = localStorage.getItem('bluvia_ep_sort_' + dramaId);
  if (saved === 'desc') { episodeSortAsc = false; btn.innerHTML = '↓ Z-A'; }
  
  btn.addEventListener('click', () => {
    episodeSortAsc = !episodeSortAsc;
    localStorage.setItem('bluvia_ep_sort_' + dramaId, episodeSortAsc ? 'asc' : 'desc');
    btn.innerHTML = episodeSortAsc ? '↑ A-Z' : '↓ Z-A';
    // Re-render episode list
    if (typeof renderEpisodeList === 'function') renderEpisodeList();
  });
}

// ── Comments System ──
function initComments(dramaId) {
  const input = document.querySelector('.comment-input-wrap textarea');
  const submitBtn = document.querySelector('.comment-input-wrap .btn');
  const list = document.getElementById('comments-list');
  const countEl = document.getElementById('comment-count');
  if (!input || !list) return;
  
  function loadComments() {
    const comments = JSON.parse(localStorage.getItem('bluvia_comments_' + dramaId) || '[]');
    list.innerHTML = '';
    if (countEl) countEl.textContent = comments.length;
    
    if (comments.length === 0) {
      list.innerHTML = '<div class="comments-empty">Belum ada komentar. Jadikan yang pertama!</div>';
      return;
    }
    
    comments.sort((a, b) => b.time - a.time).forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.style.cssText = 'padding:var(--space-md);border-bottom:1px solid var(--border);';
      const time = new Date(c.time);
      const timeStr = time.toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) + ' ' + time.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
      div.innerHTML = '<div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-xs);">' +
        '<div style="width:28px;height:28px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;">' + c.user.charAt(0).toUpperCase() + '</div>' +
        '<strong style="font-size:var(--fs-sm);">' + c.user + '</strong>' +
        '<span style="font-size:var(--fs-xs);color:var(--text-muted);">' + timeStr + '</span></div>' +
        '<p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.6;margin-left:36px;">' + c.text + '</p>';
      list.appendChild(div);
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;
      const user = localStorage.getItem('bluvia_user') || 'Anonymous';
      const comments = JSON.parse(localStorage.getItem('bluvia_comments_' + dramaId) || '[]');
      comments.push({ user, text, time: Date.now() });
      localStorage.setItem('bluvia_comments_' + dramaId, JSON.stringify(comments));
      input.value = '';
      loadComments();
      showToast('Komentar dikirim!');
    });
  }
  
  loadComments();
}

// ── Notification Bell ──
function initNotificationBell() {
  const btn = document.querySelector('.notification-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    showToast('Tidak ada notifikasi baru');
  });
}

// ── SEO Meta Tags (dynamic) ──
function updateSEOMeta(title, description, image) {
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:image"]')?.setAttribute('content', image || '');
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

// ── Continue Watching Sync (localStorage) ──
function saveContinueWatching(dramaId, title, episode, poster) {
  const history = JSON.parse(localStorage.getItem('bluvia_watch_history') || '[]');
  const existing = history.findIndex(h => h.id === dramaId);
  const item = { id: dramaId, title, episode, poster, time: Date.now() };
  if (existing >= 0) {
    history[existing] = item;
  } else {
    history.unshift(item);
  }
  // Keep max 50 items
  if (history.length > 50) history.pop();
  localStorage.setItem('bluvia_watch_history', JSON.stringify(history));
}

