/* ========================================
   BLUVIA Site — API Integration
   ======================================== */

const API_BASE = '';  // Same origin — nginx proxies /api/ to backend

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
  // drama.poster is relative like /api/image/... or /api/poster/...
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
  element.addEventListener('click', (e) => {
    e.preventDefault();
    if (drama && drama.id) {
      window.location.href = `drama.html?id=${encodeURIComponent(drama.id)}`;
    }
  });
}

// ── Navigation Setup ──
function initNavigation() {
  // Navbar / sidebar nav links on ALL pages
  document.querySelectorAll('a').forEach(a => {
    const text = a.textContent.trim().toLowerCase();

    if (text === 'home') {
      a.href = 'index.html';
    } else if (text === 'ongoing') {
      a.href = 'index.html?filter=ongoing';
    } else if (text === 'terbaru') {
      a.href = 'index.html?filter=recent';
    } else if (text === 'kategori') {
      a.href = 'index.html?filter=genre';
    } else if (text === 'daftar suka') {
      a.href = 'home.html';
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

  // Genre cards → index.html?genre={genre_name}
  document.querySelectorAll('.genre-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const nameEl = card.querySelector('.genre-name');
      if (nameEl) {
        window.location.href = `index.html?genre=${encodeURIComponent(nameEl.textContent.trim())}`;
      }
    });
  });

  // Search bar — Enter key or form submit
  document.querySelectorAll('.search-bar input[type="text"]').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  });

  // Make all existing poster cards clickable via data attributes (will be set dynamically too)
  // Static poster cards in HTML — make them go to drama.html using title as a rough ID
  document.querySelectorAll('.poster-card').forEach(card => {
    const titleEl = card.querySelector('.poster-title');
    if (titleEl && !card.dataset.dramaId) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const title = titleEl.textContent.trim();
        if (title) {
          window.location.href = `drama.html?id=${encodeURIComponent(title)}`;
        }
      });
    }
  });

  // Ranking items — make clickable
  document.querySelectorAll('.ranking-item').forEach(item => {
    const titleEl = item.querySelector('.ranking-title');
    if (titleEl && !item.dataset.dramaId) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        const title = titleEl.textContent.trim();
        if (title) {
          window.location.href = `drama.html?id=${encodeURIComponent(title)}`;
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
        window.location.href = `player.html?drama=${encodeURIComponent(title)}&ep=${ep}`;
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
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      localStorage.setItem('bluvia_logged_in', 'true');
      localStorage.setItem('bluvia_user', 'Teguh');
      window.location.href = 'home.html';
    });

    // Also make Google button store login
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        localStorage.setItem('bluvia_logged_in', 'true');
        localStorage.setItem('bluvia_user', 'Teguh');
        window.location.href = 'home.html';
      });
    }
  }
}

// ── Home Page Login Check ──
function initHomeAuth() {
  const greetingEl = document.querySelector('.profile-greeting');
  if (greetingEl) {
    const logged = localStorage.getItem('bluvia_logged_in');
    const user = localStorage.getItem('bluvia_user') || 'Teguh';
    if (logged === 'true') {
      greetingEl.textContent = `Halo, ${user} 👋`;
    }
  }
}

// ── Search Results (Landing Page) ──
async function initSearchResults() {
  const query = getUrlParam('search');
  if (!query) return false; // not a search page

  document.title = `Search: ${query} — BLUVIA`;

  const results = await api(`/api/search?q=${encodeURIComponent(query)}`);
  if (!results) return true;

  // Find the main content area on the landing page
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return true;

  // Clear existing sections
  mainContent.innerHTML = '';

  // Build search results UI
  const section = document.createElement('section');
  section.className = 'section-search-results';
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Hasil Pencarian: "${query}"</h2>
      <a href="index.html" class="section-link">
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

    const dramas = Array.isArray(results) ? results : (results.dramas || []);
    if (dramas.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem 0;">Tidak ada hasil ditemukan untuk "' + query + '"</p>';
      return true;
    }

    dramas.forEach(d => {
      const title = d.title || cleanTitle(d.id || '');
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.style.minWidth = '180px';
      card.style.cursor = 'pointer';
      card.dataset.dramaId = d.id || '';
      card.innerHTML = `
        <span class="poster-badge badge">${d.category || ''}</span>
        <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
        <div class="poster-info">
          <div class="poster-title">${title}</div>
          <div class="poster-meta">${d.year || ''}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        window.location.href = `drama.html?id=${encodeURIComponent(d.id || title)}`;
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

  const [featured, trending, recently] = await Promise.all([
    api('/api/featured'),
    api('/api/trending'),
    api('/api/recently-added'),
  ]);

  // Featured → Hero
  if (featured && featured.dramas && featured.dramas.length > 0) {
    const f = featured.dramas[0];
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
      // Make hero card clickable to drama
      makeDramaClickable(heroCard, f);
      // Also make "Tonton Sekarang" button link to drama
      const watchBtn = heroCard.querySelector('a.btn');
      if (watchBtn) {
        watchBtn.href = `drama.html?id=${encodeURIComponent(f.id)}`;
        watchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }
  }

  // Trending → Popular cards
  if (trending && trending.length > 0) {
    const container = document.querySelector('.popular-grid');
    if (container) {
      container.innerHTML = '';
      trending.slice(0, 5).forEach((d, i) => {
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

  // Recently Added → new episodes
  if (recently && recently.length > 0) {
    // Update new episodes section if it exists
    const newEpsSection = document.querySelector('.section-new-eps .h-scroll');
    if (newEpsSection) {
      newEpsSection.innerHTML = '';
      recently.slice(0, 6).forEach(d => {
        const title = d.title || '';
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.style.minWidth = '180px';
        card.innerHTML = `
          <span class="poster-badge badge">${d.episode_count || 'New'}</span>
          <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.year || ''}</div>
          </div>
        `;
        makeDramaClickable(card, d);
        newEpsSection.appendChild(card);
      });
    }
  }
}

// ── Home Page (After Login) ──
async function initHome() {
  const [featured, trending, recently] = await Promise.all([
    api('/api/featured'),
    api('/api/trending'),
    api('/api/recently-added'),
  ]);

  // Featured → Hero banner
  if (featured && featured.dramas && featured.dramas.length > 0) {
    const f = featured.dramas[0];
    const heroLeft = document.querySelector('.hero-slide-left');
    if (heroLeft) {
      const badge = heroLeft.querySelector('.badge');
      if (badge) badge.textContent = 'NEW EPISODE';
      const h2 = heroLeft.querySelector('h2');
      if (h2) h2.textContent = f.title;
      const epLabel = heroLeft.querySelector('.ep-label');
      if (epLabel) epLabel.textContent = `${f.episode_count} Episodes`;
      const desc = heroLeft.querySelector('.desc');
      if (desc) desc.textContent = f.synopsis || '';
      // Make "Tonton Sekarang" button link to drama
      const watchBtn = heroLeft.querySelector('a.btn-primary');
      if (watchBtn) {
        watchBtn.href = `drama.html?id=${encodeURIComponent(f.id)}`;
      }
    }
    // Update hero background
    const heroBg = document.querySelector('.hero-slide-bg');
    if (heroBg && f.backdrop_url) {
      heroBg.style.backgroundImage = `linear-gradient(135deg, rgba(8,12,24,0.9) 0%, rgba(8,12,24,0.4) 100%), url(${API_BASE}${f.backdrop_url})`;
    }
  }

  // Second featured → hero card
  if (featured && featured.dramas && featured.dramas.length > 1) {
    const f2 = featured.dramas[1];
    const heroCard = document.querySelector('.hero-card');
    if (heroCard) {
      const badge = heroCard.querySelector('.badge');
      if (badge) { badge.textContent = 'ONGOING'; badge.className = 'badge badge-ongoing'; }
      const h3 = heroCard.querySelector('h3');
      if (h3) h3.textContent = f2.title;
      const epLabel = heroCard.querySelector('.ep-label');
      if (epLabel) epLabel.textContent = `${f2.episode_count} Episodes`;
      const desc = heroCard.querySelector('.desc');
      if (desc) desc.textContent = f2.synopsis || '';
      // Make "Tonton Sekarang" button link to drama
      const watchBtn = heroCard.querySelector('a.btn-primary');
      if (watchBtn) {
        watchBtn.href = `drama.html?id=${encodeURIComponent(f2.id)}`;
      }
    }
  }

  // Trending → Ranking sidebar
  if (trending && trending.length > 0) {
    const rankingCard = document.querySelector('.ranking-card');
    if (rankingCard) {
      // Keep header, replace items
      const existingHeader = rankingCard.querySelector('.section-header');
      rankingCard.innerHTML = '';
      if (existingHeader) rankingCard.appendChild(existingHeader);

      trending.slice(0, 5).forEach((d, i) => {
        const title = d.title || cleanTitle(d.id || '');
        const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : 'other';
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="ranking-num ${rankClass}">${i + 1}</div>
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

  // Recently Added → Episode Baru
  if (recently && recently.length > 0) {
    const epBaru = document.querySelectorAll('.home-content .h-scroll');
    // Find the "Episode Baru" scroll container (last h-scroll)
    const lastScroll = epBaru[epBaru.length - 1];
    if (lastScroll) {
      lastScroll.innerHTML = '';
      recently.slice(0, 6).forEach(d => {
        const title = d.title || '';
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.style.minWidth = '180px';
        card.innerHTML = `
          <span class="poster-badge badge">${d.episode_count || 'New'}</span>
          <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.year || ''}</div>
          </div>
        `;
        makeDramaClickable(card, d);
        lastScroll.appendChild(card);
      });
    }
  }
}

// ── Init on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation and UI handlers on ALL pages
  initNavigation();
  initLogin();
  initHomeAuth();

  // Page-specific init
  const page = document.body.dataset.page;
  if (page === 'landing') initLanding();
  else if (page === 'home') initHome();
});
