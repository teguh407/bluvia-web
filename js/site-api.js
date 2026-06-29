/* ========================================
   BLUVIA Site — API Integration
   ======================================== */

const API_BASE = 'http://43.153.207.36:8002';

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

// ── Index Page (Landing) ──
async function initLanding() {
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
        card.innerHTML = `
          <div class="poster-rank">${i + 1}</div>
          ${i === 0 ? '<span class="poster-badge badge badge-new">NEW</span>' : ''}
          <img class="poster-img" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="poster-info">
            <div class="poster-title">${title}</div>
            <div class="poster-meta">${d.episode_count || ''} episodes</div>
          </div>
        `;
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
        item.innerHTML = `
          <div class="ranking-num ${rankClass}">${i + 1}</div>
          <img class="ranking-thumb" src="${posterUrl(d)}" alt="${title}" onerror="this.style.background='var(--bg-secondary)'">
          <div class="ranking-info">
            <div class="ranking-title">${title}</div>
            <div class="ranking-ep">${d.episode_count || ''} episodes</div>
          </div>
        `;
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
        lastScroll.appendChild(card);
      });
    }
  }
}

// ── Init on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'landing') initLanding();
  else if (page === 'home') initHome();
});
