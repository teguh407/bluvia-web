/* ========================================
   BLUVIA Admin — API Integration
   ======================================== */

const API_BASE = '';  // Same origin — nginx proxies /api/ to backend

// ── Helpers ──

/** Generic GET helper */
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

/** POST/PUT/DELETE helper with JSON body */
async function apiRequest(endpoint, method = 'POST', body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API error: ${method} ${endpoint}`, err);
    return null;
  }
}

/** Relative time string (e.g. "3h ago") */
function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr + 'Z');
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Format date only (e.g. "28 Jun 2026") */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format date + time (e.g. "28 Jun, 04:16") */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' +
         d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/** Deterministic color from a name string */
function userColor(name) {
  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#10b981','#06b6d4',
                  '#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f472b6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/** Convert slug to readable title, trimming leading dashes */
function cleanTitle(slug) {
  if (!slug) return '';
  return slug.replace(/^-+/, '')             // trim leading dashes
             .replace(/-/g, ' ')             // hyphens → spaces
             .replace(/\b\w/g, c => c.toUpperCase()) // title case
             .replace(/\s*\(\d{4}\)$/, '')   // drop trailing year
             .trim();
}

// ══════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════

// ── Load Dashboard Stats ──
async function loadStats() {
  const data = await api('/api/admin/stats');
  if (!data) return;

  const cards = document.querySelectorAll('.stat-card-info');
  if (cards.length >= 4) {
    cards[0].querySelector('.stat-value').textContent = data.total_users.toLocaleString();
    cards[0].querySelector('.stat-change').innerHTML =
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> +${data.users_7d} this week`;

    cards[1].querySelector('.stat-value').textContent = data.total_catalog.toLocaleString();

    cards[2].querySelector('.stat-value').textContent = data.total_watches.toLocaleString();
    const avgDay = Math.round(data.watches_7d / 7);
    cards[2].querySelector('.stat-change').innerHTML =
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> ~${avgDay}/day avg`;

    cards[3].querySelector('.stat-value').textContent = data.total_bookmarks.toLocaleString();
  }

  // Update requests badge
  const reqBadge = document.querySelector('.admin-nav a[data-page="requests"] .nav-badge');
  if (reqBadge) reqBadge.textContent = data.pending_requests;
}

// ── Load Watch Chart (with dynamic date labels) ──
async function loadWatchChart() {
  const data = await api('/api/admin/watch-chart?days=8');
  if (!data || !data.chart) return;

  const chart = document.getElementById('watch-chart');
  const analyticsChart = document.getElementById('analytics-chart');
  const max = Math.max(...data.chart.map(d => d.watches), 1);

  // Render bar elements
  function renderBars(container) {
    if (!container) return;
    container.innerHTML = '';
    data.chart.forEach((d, i) => {
      const bar = document.createElement('div');
      bar.className = 'mini-bar';
      bar.style.height = (d.watches / max * 100) + '%';
      bar.title = `${d.date}: ${d.watches} watches, ${d.unique_users} users`;
      if (i === data.chart.length - 1) bar.style.opacity = '1';
      container.appendChild(bar);
    });
  }

  renderBars(chart);
  renderBars(analyticsChart);

  // ── FIX #8: Update chart labels with actual dates from API ──
  const dashboardLabels = document.getElementById('watch-chart-labels');
  if (dashboardLabels) {
    dashboardLabels.innerHTML = '';
    data.chart.slice(-7).forEach(d => {
      const span = document.createElement('span');
      span.textContent = d.date.slice(5);  // e.g. "07-03"
      dashboardLabels.appendChild(span);
    });
  }

  const analyticsLabels = document.getElementById('analytics-chart-labels');
  if (analyticsLabels) {
    analyticsLabels.innerHTML = '';
    data.chart.slice(-7).forEach(d => {
      const span = document.createElement('span');
      span.textContent = d.date.slice(5);
      analyticsLabels.appendChild(span);
    });
  }
}

// ── Load Top Dramas ──
async function loadTopDramas() {
  const data = await api('/api/admin/top-dramas?days=7&limit=5');
  if (!data || !data.dramas) return;

  const tbody = document.querySelector('#page-dashboard .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.dramas.forEach((d, i) => {
    const rank = i + 1;
    const rankColors = ['color:#f59e0b', 'color:#94a3b8', 'color:#d97706'];
    const rankStyle = rank <= 3 ? rankColors[rank - 1] : 'color:var(--text-muted)';
    const trend = d.watches > 10 ? '🔥 Hot' : d.watches > 5 ? '📈 Rising' : '→ Stable';
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:700;${rankStyle};">${rank}</td>
        <td>${cleanTitle(d.title)}</td>
        <td><strong>${d.watches}</strong></td>
        <td><span style="font-size:var(--fs-xs);">${trend}</span></td>
      </tr>`;
  });
}

// ── FIX #1: Activity Feed — derive from watch-history endpoint ──
// (The old /api/admin/activity endpoint returns 404, so we transform
//  watch-history data into activity feed items instead.)
async function loadActivity() {
  const data = await api('/api/admin/watch-history?limit=8');
  if (!data || !data.history) return;

  const feed = document.querySelector('#page-dashboard .activity-feed');
  if (!feed) return;
  feed.innerHTML = '';

  const dotColors = ['blue', 'green', 'purple', 'orange'];
  data.history.forEach((item, i) => {
    const color = dotColors[i % dotColors.length];
    feed.innerHTML += `
      <div class="activity-item">
        <div class="activity-dot ${color}"></div>
        <div>
          <div class="activity-text"><strong>${item.user_name}</strong> watched ${cleanTitle(item.drama_title)} ${item.episode}</div>
          <div class="activity-time">${timeAgo(item.watched_at)}</div>
        </div>
      </div>`;
  });
}

// ══════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════

// ── FIX #5: Users table — derive status from last_active ──
async function loadUsers() {
  const data = await api('/api/admin/users?limit=50');
  if (!data || !data.users) return;

  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.users.forEach(u => {
    const initial = (u.display_name || 'U').charAt(0).toUpperCase();
    const color = userColor(u.display_name || u.email);
    // API does not return a status field — derive it from last_active
    const isActive = u.last_active != null;
    const statusClass = isActive ? 'active' : 'inactive';

    tbody.innerHTML += `
      <tr>
        <td><div class="table-user">
          <div class="avatar" style="width:32px;height:32px;background:linear-gradient(135deg,${color},${color}dd);font-size:0.7rem;">${initial}</div>
          <div class="table-user-info"><div class="name">${u.display_name}</div><div class="email">${u.email}</div></div>
        </div></td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${formatDate(u.created_at)}</td>
        <td><strong>${u.total_watches}</strong></td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${timeAgo(u.last_active)}</td>
        <td><span class="status-badge ${statusClass}">${isActive ? 'Active' : 'Inactive'}</span></td>
        <td><button class="action-btn" title="View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
      </tr>`;
  });

  // Update users count in nav
  const usersBadge = document.querySelector('.admin-nav a[data-page="users"] .nav-badge');
  if (usersBadge) usersBadge.textContent = data.users.length;
}

// ══════════════════════════════════════════
//  CATALOG
// ══════════════════════════════════════════

// ── FIX #6: Catalog — trim leading dashes, show 'No episodes' when 0 ──
async function loadCatalog() {
  const data = await api('/api/admin/catalog?limit=20');
  if (!data || !data.dramas) return;

  const tbody = document.querySelector('#page-catalog .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.dramas.forEach(d => {
    // Trim leading dashes from title
    const title = d.title ? d.title.replace(/^-+/, '') : (d.title || '-');
    // Show 'No episodes' when total_episodes is 0
    const episodes = (d.total_episodes === 0 || !d.total_episodes) ? '<span style="color:var(--text-muted);">No episodes</span>' : d.total_episodes;

    tbody.innerHTML += `
      <tr>
        <td><strong>${title}</strong></td>
        <td>${d.year || '-'}</td>
        <td>${d.category || 'Drakor'}</td>
        <td>${episodes}</td>
        <td><span class="status-badge active">Active</span></td>
        <td><button class="action-btn" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
      </tr>`;
  });
}

// ══════════════════════════════════════════
//  REQUESTS
// ══════════════════════════════════════════

// ── FIX #2: Approve / Reject request handlers ──
async function updateRequest(id, status) {
  const result = await apiRequest(`/api/admin/requests/${id}`, 'PUT', { status });
  if (result) {
    // Refresh the table after successful update
    loadRequests();
  }
}
window.approveRequest = (id) => updateRequest(id, 'approved');
window.rejectRequest  = (id) => updateRequest(id, 'rejected');

// ── Load Requests ──
async function loadRequests() {
  const data = await api('/api/admin/requests');
  if (!data || !data.requests) return;

  const tbody = document.querySelector('#page-requests .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Show pending first, then others
  const pending = data.requests.filter(r => r.status === 'pending');
  const others  = data.requests.filter(r => r.status !== 'pending').slice(0, 5);
  const all     = [...pending, ...others];

  all.forEach(r => {
    const color = userColor(r.user_name);
    const initial = r.user_name.charAt(0).toUpperCase();
    const statusClass = r.status === 'pending' ? 'pending'
                      : r.status === 'added'    ? 'added'
                      : 'rejected';

    // FIX #2: Add onclick handlers with request ID
    const actions = r.status === 'pending'
      ? `<div style="display:flex;gap:4px;">
           <button class="action-btn" title="Approve" style="color:#22c55e;" onclick="approveRequest(${r.id})">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
           </button>
           <button class="action-btn danger" title="Reject" onclick="rejectRequest(${r.id})">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
           </button>
         </div>`
      : `<span style="font-size:var(--fs-xs);color:var(--text-muted);">Done</span>`;

    tbody.innerHTML += `
      <tr>
        <td><div class="table-user"><div class="avatar" style="width:28px;height:28px;background:linear-gradient(135deg,${color},${color}dd);font-size:0.6rem;">${initial}</div><span style="font-size:var(--fs-sm);">${r.user_name}</span></div></td>
        <td><strong>${r.drama_title}</strong></td>
        <td style="color:var(--text-secondary);font-size:var(--fs-xs);">${r.notes || '-'}</td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${formatDate(r.created_at)}</td>
        <td><span class="status-badge ${statusClass}">${r.status}</span></td>
        <td>${actions}</td>
      </tr>`;
  });

  // Update pending count badge
  const reqBadge = document.querySelector('.admin-nav a[data-page="requests"] .nav-badge');
  if (reqBadge) reqBadge.textContent = pending.length;
}

// ══════════════════════════════════════════
//  FEATURED
// ══════════════════════════════════════════

// ── FIX #3: Featured page with move up/down/remove handlers ──
// Featured order is persisted in localStorage.

const DEFAULT_FEATURED = [
  { id: 1, title: 'My Royal Nemesis (2026)', category: 'Drama Korea', total_episodes: 14 },
  { id: 2, title: 'Doctor on the Edge (2026)', category: 'Drama Korea', total_episodes: 6 },
];

/** Get featured items (from localStorage, falling back to defaults) */
function getFeatured() {
  try {
    const stored = localStorage.getItem('bluvia_featured_order');
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore corrupt data */ }
  return [...DEFAULT_FEATURED];
}

/** Persist featured order to localStorage */
function saveFeatured(items) {
  localStorage.setItem('bluvia_featured_order', JSON.stringify(items));
}

/** Move item up (swap with previous) */
function moveFeaturedUp(id) {
  const items = getFeatured();
  const idx = items.findIndex(item => item.id === id);
  if (idx <= 0) return;
  [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
  saveFeatured(items);
  renderFeatured();
}

/** Move item down (swap with next) */
function moveFeaturedDown(id) {
  const items = getFeatured();
  const idx = items.findIndex(item => item.id === id);
  if (idx < 0 || idx >= items.length - 1) return;
  [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
  saveFeatured(items);
  renderFeatured();
}

/** Remove featured item (DELETE API + localStorage) */
async function removeFeatured(id) {
  await apiRequest(`/api/admin/featured/${id}`, 'DELETE');
  const items = getFeatured().filter(item => item.id !== id);
  saveFeatured(items);
  renderFeatured();
}

/** Render the featured table body */
function renderFeatured() {
  const tbody = document.getElementById('featured-table-body');
  if (!tbody) return;

  const items = getFeatured();
  tbody.innerHTML = '';
  const rankColors = ['#f59e0b', '#94a3b8', '#d97706'];

  items.forEach((item, i) => {
    const rankStyle = i < 3 ? `color:${rankColors[i]}` : 'color:var(--text-muted)';
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:700;${rankStyle};">${i + 1}</td>
        <td><strong>${cleanTitle(item.title)}</strong></td>
        <td>${item.category || 'Drama Korea'}</td>
        <td>${item.total_episodes || '-'}</td>
        <td><div style="display:flex;gap:4px;">
          <button class="action-btn" title="Move Up" onclick="moveFeaturedUp(${item.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="action-btn" title="Move Down" onclick="moveFeaturedDown(${item.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="action-btn danger" title="Remove" onclick="removeFeatured(${item.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div></td>
      </tr>`;
  });
}

/** Load featured from API, merge with localStorage order, then render */
async function loadFeatured() {
  const data = await api('/api/admin/featured');
  if (data && data.featured) {
    const existing = getFeatured();
    const existingIds = new Set(existing.map(item => item.id));
    const merged = [...existing];
    data.featured.forEach(item => {
      if (!existingIds.has(item.id)) merged.push(item);
    });
    saveFeatured(merged);
  }
  renderFeatured();
}

// ══════════════════════════════════════════
//  BOOKMARKS
// ══════════════════════════════════════════

// ── FIX #7: Bookmarks page — fetch data or show placeholder ──
async function loadBookmarks() {
  const data = await api('/api/admin/bookmarks');
  const container = document.querySelector('#page-bookmarks .admin-card-body');
  if (!container) return;

  // If API returns 404 or no data, show placeholder
  if (!data || !data.bookmarks) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <h4>Bookmarks data unavailable</h4>
        <p>The bookmarks API endpoint is not available yet. Please check back later.</p>
      </div>`;
    return;
  }

  // Build table with bookmark data
  container.innerHTML = `
    <table class="admin-table" id="bookmarks-table">
      <thead><tr><th>User</th><th>Drama</th><th>Added</th></tr></thead>
      <tbody></tbody>
    </table>`;

  const tbody = container.querySelector('tbody');
  data.bookmarks.forEach(b => {
    const color = userColor(b.user_name || 'U');
    const initial = (b.user_name || 'U').charAt(0).toUpperCase();
    tbody.innerHTML += `
      <tr>
        <td><div class="table-user">
          <div class="avatar" style="width:28px;height:28px;background:linear-gradient(135deg,${color},${color}dd);font-size:0.6rem;">${initial}</div>
          <span style="font-size:var(--fs-sm);">${b.user_name || 'Unknown'}</span>
        </div></td>
        <td><strong>${cleanTitle(b.drama_title)}</strong></td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${formatDate(b.created_at)}</td>
      </tr>`;
  });

  // Update count in header
  const header = document.querySelector('#page-bookmarks .admin-card-header h3');
  if (header) header.textContent = `Bookmarks (${data.bookmarks.length} total)`;
}

// ══════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════

async function loadTopViewers() {
  const data = await api('/api/admin/top-viewers?days=7&limit=5');
  if (!data || !data.viewers) return;

  const tbody = document.querySelector('#page-analytics .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.viewers.forEach(v => {
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">${v.name}</td>
        <td><strong>${v.watches}</strong></td>
      </tr>`;
  });
}

async function loadAnalyticsStats() {
  const data = await api('/api/admin/stats');
  if (!data) return;

  const statCards = document.querySelectorAll('#page-analytics .stat-card-info');
  if (statCards.length >= 3) {
    const todayData = await api('/api/admin/watch-chart?days=1');
    statCards[0].querySelector('.stat-value').textContent = todayData?.chart?.[0]?.watches || 0;
    statCards[1].querySelector('.stat-value').textContent = data.watches_7d.toLocaleString();
    statCards[2].querySelector('.stat-value').textContent = data.unique_viewers_7d;
  }
}

// ══════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════

// ── FIX #4: Settings save handler ──
async function saveSettings() {
  const container = document.querySelector('#page-settings .admin-card-body');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  const labels = container.querySelectorAll('.input-label');
  const settings = {};

  labels.forEach(label => {
    const input = label.nextElementSibling;
    if (input && input.tagName === 'INPUT') {
      // Convert label text to snake_case key
      const key = label.textContent.trim().toLowerCase().replace(/\s+/g, '_');
      settings[key] = input.type === 'number' ? Number(input.value) : input.value;
    }
  });

  const result = await apiRequest('/api/admin/settings', 'POST', settings);
  if (result) {
    alert('Settings saved successfully!');
  } else {
    alert('Failed to save settings. Please try again.');
  }
}
window.saveSettings = saveSettings;

// ══════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════

async function initDashboard() {
  await Promise.all([
    loadStats(),
    loadWatchChart(),
    loadTopDramas(),
    loadActivity(),
  ]);
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();

  // Lazy-load other pages on first visit
  const visited = new Set(['dashboard']);

  // Override switchPage to load data on first visit
  const origSwitch = window.switchPage;
  window.switchPage = function (page) {
    if (origSwitch) origSwitch(page);
    if (visited.has(page)) return;
    visited.add(page);

    switch (page) {
      case 'users':         loadUsers(); break;
      case 'catalog':       loadCatalog(); break;
      case 'requests':      loadRequests(); break;
      case 'watch-history': loadWatchHistory(); break;
      case 'featured':      loadFeatured(); break;
      case 'bookmarks':     loadBookmarks(); break;
      case 'analytics':
        Promise.all([loadAnalyticsStats(), loadTopViewers(), loadWatchChart()]);
        break;
    }
  };
});

// ── Load Watch History ──
async function loadWatchHistory() {
  const data = await api('/api/admin/watch-history?limit=20&days=7');
  if (!data || !data.history) return;

  const tbody = document.querySelector('#page-watch-history .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.history.forEach(h => {
    const color = userColor(h.user_name);
    const initial = h.user_name.charAt(0).toUpperCase();
    const progressColor = h.progress >= 80 ? '#22c55e' : 'var(--accent)';
    tbody.innerHTML += `
      <tr>
        <td><div class="table-user">
          <div class="avatar" style="width:28px;height:28px;background:linear-gradient(135deg,${color},${color}dd);font-size:0.6rem;">${initial}</div>
          <div class="table-user-info"><div class="name">${h.user_name}</div><div class="email">${h.user_email}</div></div>
        </div></td>
        <td>${cleanTitle(h.drama_title)}</td>
        <td>${h.episode}</td>
        <td><div style="display:flex;align-items:center;gap:6px;"><div style="width:60px;height:4px;background:var(--border-light);border-radius:2px;overflow:hidden;"><div style="width:${h.progress}%;height:100%;background:${progressColor};border-radius:2px;"></div></div><span style="font-size:var(--fs-xs);color:var(--text-muted);">${h.progress}%</span></div></td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${formatDateTime(h.watched_at)}</td>
      </tr>`;
  });
}
