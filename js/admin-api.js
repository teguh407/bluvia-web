/* ========================================
   BLUVIA Admin — API Integration
   ======================================== */

const API_BASE = 'http://43.153.207.36:8002';

// ── Helpers ──
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

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr + 'Z');
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' +
         d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function userColor(name) {
  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f472b6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function cleanTitle(slug) {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s*\(\d{4}\)$/, '').trim();
}

// ── Load Dashboard Stats ──
async function loadStats() {
  const data = await api('/api/admin/stats');
  if (!data) return;

  const cards = document.querySelectorAll('.stat-card-info');
  if (cards.length >= 4) {
    cards[0].querySelector('.stat-value').textContent = data.total_users.toLocaleString();
    cards[0].querySelector('.stat-change').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> +${data.users_7d} this week`;

    cards[1].querySelector('.stat-value').textContent = data.total_catalog.toLocaleString();

    cards[2].querySelector('.stat-value').textContent = data.total_watches.toLocaleString();
    const avgDay = Math.round(data.watches_7d / 7);
    cards[2].querySelector('.stat-change').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> ~${avgDay}/day avg`;

    cards[3].querySelector('.stat-value').textContent = data.total_bookmarks.toLocaleString();
  }

  // Update requests badge
  const reqBadge = document.querySelector('.admin-nav a[data-page="requests"] .nav-badge');
  if (reqBadge) reqBadge.textContent = data.pending_requests;
}

// ── Load Watch Chart ──
async function loadWatchChart() {
  const data = await api('/api/admin/watch-chart?days=8');
  if (!data || !data.chart) return;

  const chart = document.getElementById('watch-chart');
  const analyticsChart = document.getElementById('analytics-chart');
  const max = Math.max(...data.chart.map(d => d.watches), 1);

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

  // Update labels
  const labels = chart?.parentElement?.querySelectorAll('span');
  if (labels && labels.length >= 7) {
    data.chart.slice(-7).forEach((d, i) => {
      if (labels[i]) labels[i].textContent = d.date.slice(5);
    });
  }
}

// ── Load Users Table ──
async function loadUsers() {
  const data = await api('/api/admin/users?limit=50');
  if (!data || !data.users) return;

  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.users.forEach(u => {
    const initial = (u.display_name || 'U').charAt(0).toUpperCase();
    const color = userColor(u.display_name || u.email);
    const statusClass = u.status === 'active' ? 'active' : 'inactive';
    tbody.innerHTML += `
      <tr>
        <td><div class="table-user">
          <div class="avatar" style="width:32px;height:32px;background:linear-gradient(135deg,${color},${color}dd);font-size:0.7rem;">${initial}</div>
          <div class="table-user-info"><div class="name">${u.display_name}</div><div class="email">${u.email}</div></div>
        </div></td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${formatDate(u.created_at)}</td>
        <td><strong>${u.total_watches}</strong></td>
        <td style="color:var(--text-muted);font-size:var(--fs-xs);">${timeAgo(u.last_active)}</td>
        <td><span class="status-badge ${statusClass}">${u.status === 'active' ? 'Active' : 'Inactive'}</span></td>
        <td><button class="action-btn" title="View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
      </tr>`;
  });

  // Update users count in nav
  const usersBadge = document.querySelector('.admin-nav a[data-page="users"] .nav-badge');
  if (usersBadge) usersBadge.textContent = data.users.length;
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
    const rankStyle = rank <= 3 ? rankColors[rank-1] : 'color:var(--text-muted)';
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

// ── Load Activity Feed ──
async function loadActivity() {
  const data = await api('/api/admin/activity?limit=8');
  if (!data || !data.activity) return;

  const feed = document.querySelector('#page-dashboard .activity-feed');
  if (!feed) return;
  feed.innerHTML = '';

  const dotColors = ['blue', 'green', 'purple', 'orange'];
  data.activity.forEach((a, i) => {
    const color = dotColors[i % dotColors.length];
    feed.innerHTML += `
      <div class="activity-item">
        <div class="activity-dot ${color}"></div>
        <div>
          <div class="activity-text"><strong>${a.user_name}</strong> watched ${cleanTitle(a.drama_title)} ${a.episode}</div>
          <div class="activity-time">${timeAgo(a.watched_at)}</div>
        </div>
      </div>`;
  });
}

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

// ── Load Requests ──
async function loadRequests() {
  const data = await api('/api/admin/requests');
  if (!data || !data.requests) return;

  const tbody = document.querySelector('#page-requests .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Show pending first, then others
  const pending = data.requests.filter(r => r.status === 'pending');
  const others = data.requests.filter(r => r.status !== 'pending').slice(0, 5);
  const all = [...pending, ...others];

  all.forEach(r => {
    const color = userColor(r.user_name);
    const initial = r.user_name.charAt(0).toUpperCase();
    const statusClass = r.status === 'pending' ? 'pending' : r.status === 'added' ? 'added' : 'rejected';
    const actions = r.status === 'pending'
      ? `<div style="display:flex;gap:4px;"><button class="action-btn" title="Approve" style="color:#22c55e;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button><button class="action-btn danger" title="Reject"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`
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

  // Update badge
  const reqBadge = document.querySelector('.admin-nav a[data-page="requests"] .nav-badge');
  if (reqBadge) reqBadge.textContent = pending.length;
}

// ── Load Top Viewers (Analytics) ──
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

// ── Load Catalog ──
async function loadCatalog() {
  const data = await api('/api/admin/catalog?limit=20');
  if (!data || !data.dramas) return;

  const tbody = document.querySelector('#page-catalog .admin-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.dramas.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${d.title}</strong></td>
        <td>${d.year || '-'}</td>
        <td>${d.category || 'Drakor'}</td>
        <td>${d.total_episodes || '-'}</td>
        <td><span class="status-badge active">Active</span></td>
        <td><button class="action-btn" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
      </tr>`;
  });
}

// ── Load Analytics Stats ──
async function loadAnalyticsStats() {
  const data = await api('/api/admin/stats');
  if (!data) return;

  const statCards = document.querySelectorAll('#page-analytics .stat-card-info');
  if (statCards.length >= 3) {
    // watches today
    const todayData = await api('/api/admin/watch-chart?days=1');
    statCards[0].querySelector('.stat-value').textContent = todayData?.chart?.[0]?.watches || 0;

    statCards[1].querySelector('.stat-value').textContent = data.watches_7d.toLocaleString();
    statCards[2].querySelector('.stat-value').textContent = data.unique_viewers_7d;
  }
}

// ── Init All ──
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
  const origSwitch = window.switchPage;

  // Override switchPage to load data on first visit
  window.switchPage = function(page) {
    if (origSwitch) origSwitch(page);
    if (visited.has(page)) return;
    visited.add(page);

    switch(page) {
      case 'users': loadUsers(); break;
      case 'catalog': loadCatalog(); break;
      case 'requests': loadRequests(); break;
      case 'watch-history': loadWatchHistory(); break;
      case 'analytics': Promise.all([loadAnalyticsStats(), loadTopViewers(), loadWatchChart()]); break;
    }
  };
});
