let allTeams = [];
let allDomains = [];
let searchQuery = '';
let filterTeamSize = 'all'; // 'all', '3', '4'
let filterDate = 'all'; // 'all' or 'YYYY-MM-DD'
let filterPayment = 'all'; // 'all', 'verified', 'pending', 'rejected'
let editingTeam = null;
let uploadedReceiptData = null;

const STONE_DOMAIN_MAP = {
  mind: 'transportation',
  transportation: 'transportation',
  space: 'cybersecurity',
  cybersecurity: 'cybersecurity',
  reality: 'infrastructure',
  infrastructure: 'infrastructure',
  power: 'cleantech',
  cleantech: 'cleantech',
  time: 'education',
  education: 'education',
  soul: 'healthcare',
  healthcare: 'healthcare',
  // Backward compatibility
  intelligence: 'transportation',
  connectivity: 'cybersecurity',
  digital: 'infrastructure',
  automation: 'cleantech',
  analytics: 'education',
  impact: 'healthcare'
};

const CANONICAL_DOMAINS_MAP = {
  mind: { id: 'transportation', domainName: 'TRANSPORTATION & LOGISTICS', tagline: 'Mobility • Supply Chain • Routing' },
  space: { id: 'cybersecurity', domainName: 'CYBERSECURITY & DIGITAL TRUST', tagline: 'Cybersecurity • Privacy • Cryptography' },
  reality: { id: 'infrastructure', domainName: 'DIGITAL PUBLIC INFRASTRUCTURE', tagline: 'Digital Platforms • Services • E-Governance' },
  power: { id: 'cleantech', domainName: 'CLEAN & GREEN TECHNOLOGY', tagline: 'Environment • Waste • Sustainability' },
  time: { id: 'education', domainName: 'SMART EDUCATION', tagline: 'EdTech • Learning • Assessment' },
  soul: { id: 'healthcare', domainName: 'MEDTECH / BIOTECH / HEALTHCARE', tagline: 'Healthcare • Medical AI • Assistive Technology' },
  transportation: { id: 'transportation', domainName: 'TRANSPORTATION & LOGISTICS', tagline: 'Mobility • Supply Chain • Routing' },
  cybersecurity: { id: 'cybersecurity', domainName: 'CYBERSECURITY & DIGITAL TRUST', tagline: 'Cybersecurity • Privacy • Cryptography' },
  infrastructure: { id: 'infrastructure', domainName: 'DIGITAL PUBLIC INFRASTRUCTURE', tagline: 'Digital Platforms • Services • E-Governance' },
  cleantech: { id: 'cleantech', domainName: 'CLEAN & GREEN TECHNOLOGY', tagline: 'Environment • Waste • Sustainability' },
  education: { id: 'education', domainName: 'SMART EDUCATION', tagline: 'EdTech • Learning • Assessment' },
  healthcare: { id: 'healthcare', domainName: 'MEDTECH / BIOTECH / HEALTHCARE', tagline: 'Healthcare • Medical AI • Assistive Technology' },
  intelligence: { id: 'transportation', domainName: 'TRANSPORTATION & LOGISTICS', tagline: 'Mobility • Supply Chain • Routing' },
  connectivity: { id: 'cybersecurity', domainName: 'CYBERSECURITY & DIGITAL TRUST', tagline: 'Cybersecurity • Privacy • Cryptography' },
  digital: { id: 'infrastructure', domainName: 'DIGITAL PUBLIC INFRASTRUCTURE', tagline: 'Digital Platforms • Services • E-Governance' },
  automation: { id: 'cleantech', domainName: 'CLEAN & GREEN TECHNOLOGY', tagline: 'Environment • Waste • Sustainability' },
  analytics: { id: 'education', domainName: 'SMART EDUCATION', tagline: 'EdTech • Learning • Assessment' },
  impact: { id: 'healthcare', domainName: 'MEDTECH / BIOTECH / HEALTHCARE', tagline: 'Healthcare • Medical AI • Assistive Technology' }
};

function normalizeDomainId(val) {
  if (!val) return 'transportation';
  const clean = String(val).toLowerCase().replace(/ stone$/i, '').trim();
  return STONE_DOMAIN_MAP[clean] || clean;
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Strictly permit only valid http/https or relative uploads/receipts/assets paths
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed) || /^\/(?:uploads|receipts|assets|qrs)\/[a-zA-Z0-9_\-\.\/]+$/i.test(trimmed) || trimmed === '/placeholder-receipt.png') {
    return escapeHTML(trimmed);
  }
  return '';
}

function getAdminToken() {
  try {
    const saved = sessionStorage.getItem('infinity_admin_auth') || localStorage.getItem('infinity_admin_auth');
    if (!saved) return '';
    try {
      const parsed = JSON.parse(saved);
      return parsed.token || (typeof parsed === 'string' ? parsed : '');
    } catch (_) {
      return saved;
    }
  } catch (e) {
    return '';
  }
}

function showAdminToast(message, isError = false) {
  let toastContainer = document.getElementById('admin-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'admin-toast-container';
    toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:420px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${isError ? 'rgba(30, 5, 10, 0.95)' : 'rgba(10, 15, 25, 0.95)'};
    color: ${isError ? '#ff4d6d' : '#00e5ff'};
    border: 1px solid ${isError ? 'rgba(255, 77, 109, 0.4)' : 'rgba(0, 229, 255, 0.4)'};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${isError ? 'rgba(255, 77, 109, 0.2)' : 'rgba(0, 229, 255, 0.2)'};
    padding: 12px 18px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
    backdrop-filter: blur(12px);
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  const icon = document.createElement('span');
  icon.style.fontSize = '1.1rem';
  icon.textContent = isError ? '✕' : '✓';
  toast.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(10px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
window.showAdminToast = showAdminToast;

function authHeaders(extra = {}) {
  const token = getAdminToken();
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

    const secLogin = document.getElementById('sec-login');
    const secDash = document.getElementById('sec-dashboard');
    const formLogin = document.getElementById('form-admin-login');
    const loginErr = document.getElementById('login-err');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    btnRefresh.addEventListener('click', async () => {
      btnRefresh.classList.add('spinning');
      try {
        if (secDash.style.display !== 'none') {
          await loadData();
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Admin refresh failed:', err);
      } finally {
        setTimeout(() => {
          btnRefresh.classList.remove('spinning');
        }, 500);
      }
    });

    const tbody = document.getElementById('admin-tbody');
    const searchInput = document.getElementById('admin-search');

    // Filter Elements
    const btnFilterSizeAll = document.getElementById('btn-filter-size-all');
    const btnFilterSize3 = document.getElementById('btn-filter-size-3');
    const btnFilterSize4 = document.getElementById('btn-filter-size-4');
    const badgeCountAll = document.getElementById('badge-count-all');
    const badgeCount3 = document.getElementById('badge-count-3');
    const badgeCount4 = document.getElementById('badge-count-4');
    const filterDatePicker = document.getElementById('filter-date-picker');
    const dateMatchBadge = document.getElementById('date-match-badge');
    const btnClearDate = document.getElementById('btn-clear-date');
    const filterPaymentSelect = document.getElementById('filter-payment-status');
    const filterCountFeedback = document.getElementById('filter-count-feedback');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const kpiSubTeams = document.getElementById('kpi-sub-teams');

    const modalEdit = document.getElementById('modal-edit-team');
    const btnCloseEdit = document.getElementById('btn-close-edit');
    const formEdit = document.getElementById('form-edit-team');

    const modalPsMgr = document.getElementById('modal-ps-mgr');
    const btnOpenPsMgr = document.getElementById('btn-open-ps-mgr');
    const btnClosePsMgr = document.getElementById('btn-close-ps-mgr');
    const psMgrList = document.getElementById('ps-mgr-domains-list');

    const modalStoneAreas = document.getElementById('modal-stone-areas');
    const btnOpenStoneAreas = document.getElementById('btn-open-stone-areas');
    const btnCloseStoneAreas = document.getElementById('btn-close-stone-areas');
    const btnCancelStoneAreas = document.getElementById('btn-cancel-stone-areas');
    const btnSaveStoneAreas = document.getElementById('btn-save-stone-areas');
    const stoneAreasGrid = document.getElementById('stone-areas-grid');
    const stoneAreasStatus = document.getElementById('stone-areas-status');
    const chkSyncExistingTeams = document.getElementById('chk-sync-existing-teams');

    let registrationOpen = true;
    const btnToggleReg = document.getElementById('btn-toggle-reg');
    const regStatusIcon = document.getElementById('reg-status-icon');
    const regStatusText = document.getElementById('reg-status-text');

    async function doAdminLogin(password, isSilent = false) {
      if (!isSilent && loginErr) loginErr.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: (password || '').trim() }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid administrator passphrase.');
        }

        // Store ONLY the signed token, never the plaintext password
        sessionStorage.setItem('infinity_admin_auth', JSON.stringify({ token: data.token }));
        if (secLogin) secLogin.style.display = 'none';
        if (secDash) secDash.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'inline-block';

        await loadData();
        return true;
      } catch (err) {
        if (!isSilent && loginErr) {
          loginErr.textContent = err.message;
          loginErr.style.display = 'block';
        } else {
          sessionStorage.removeItem('infinity_admin_auth');
        }
        return false;
      }
    }

    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const password = document.getElementById('txt-passphrase')?.value || '';
        await doAdminLogin(password, false);
      });
    }

    const btnDoLogin = document.getElementById('btn-do-login');
    if (btnDoLogin) {
      btnDoLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        const password = document.getElementById('txt-passphrase')?.value || '';
        await doAdminLogin(password, false);
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('infinity_admin_auth');
        if (secDash) secDash.style.display = 'none';
        if (secLogin) secLogin.style.display = 'block';
        btnLogout.style.display = 'none';
      });
    }

    // Auto-restore admin session if browser is refreshed (F5 / reload)
    const savedAdmin = sessionStorage.getItem('infinity_admin_auth');
    if (savedAdmin) {
      try {
        const creds = JSON.parse(savedAdmin);
        if (creds.token) {
          if (secLogin) secLogin.style.display = 'none';
          if (secDash) secDash.style.display = 'block';
          if (btnLogout) btnLogout.style.display = 'inline-block';
          loadData();
        } else if (creds.password) {
          doAdminLogin(creds.password, true);
        }
      } catch (e) { }
    }

    async function loadData() {
      try {
        const [teamsRes, domainsRes] = await Promise.all([
          fetch('/api/admin/teams', { headers: authHeaders() }),
          fetch('/api/domains')
        ]);

        if (teamsRes.status === 401) {
          sessionStorage.removeItem('infinity_admin_auth');
          if (secDash) secDash.style.display = 'none';
          if (secLogin) secLogin.style.display = 'block';
          if (btnLogout) btnLogout.style.display = 'none';
          if (loginErr) {
            loginErr.textContent = 'Session expired or unauthorized. Please log in again.';
            loginErr.style.display = 'block';
          }
          return;
        }

        const teamsData = await teamsRes.json();
        const domainsData = await domainsRes.json();

        allTeams = teamsData.teams || [];
        allDomains = (domainsData.domains || []).map(dom => {
          const normKey = (dom.stoneId || '').toLowerCase() || (dom.stoneName ? dom.stoneName.toLowerCase().replace(/ stone/i, '').trim() : '') || dom.id;
          const canonical = CANONICAL_DOMAINS_MAP[normKey] || CANONICAL_DOMAINS_MAP[dom.id];
          if (canonical) {
            return {
              ...dom,
              id: canonical.id,
              domainName: canonical.domainName,
              tagline: canonical.tagline
            };
          }
          return dom;
        });

        if (teamsData.settings && typeof teamsData.settings.registrationOpen === 'boolean') {
          updateRegistrationUI(teamsData.settings.registrationOpen);
        } else if (domainsData && typeof domainsData.registrationOpen === 'boolean') {
          updateRegistrationUI(domainsData.registrationOpen);
        }

        const btnExcel = document.querySelector('.btn-excel');
        if (btnExcel && !btnExcel.dataset.bound) {
          btnExcel.dataset.bound = 'true';
          btnExcel.removeAttribute('href');
          btnExcel.style.cursor = 'pointer';
          btnExcel.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = getAdminToken();
            if (!token) {
              alert('Organizer clearance required.');
              return;
            }
            const originalText = btnExcel.textContent;
            try {
              btnExcel.style.opacity = '0.6';
              btnExcel.textContent = 'Preparing Workbook...';
              const res = await fetch('/api/admin/export-ticket', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              const data = await res.json();
              if (data.success && data.ticket) {
                // Single-use ticket expires in 60s and cannot be replayed from history
                window.location.href = `/api/admin/export?ticket=${encodeURIComponent(data.ticket)}`;
              } else {
                alert('Export failed: ' + (data.error || 'Could not generate export clearance ticket'));
              }
            } catch (err) {
              alert('Export error: ' + err.message);
            } finally {
              setTimeout(() => {
                btnExcel.style.opacity = '1';
                btnExcel.textContent = originalText;
              }, 1200);
            }
          });
        }

        renderTable();
        updateKPIs();
        updateDailyRegistrationsTelemetry();
      } catch (e) {
        console.error('Error loading admin data:', e);
      }
    }

    function updateKPIs() {
      document.getElementById('kpi-total-teams').textContent = allTeams.length;

      let totalFee = 0;
      let verifiedCount = 0;
      let totalHackers = 0;

      allTeams.forEach(t => {
        const size = t.teamSize || 4;
        totalHackers += size;
        const fee = t.payment?.amount || (size * 349);
        totalFee += fee;
        if (t.payment?.status === 'verified') verifiedCount++;
      });

      document.getElementById('kpi-total-fees').textContent = `₹${totalFee.toLocaleString('en-IN')}`;
      document.getElementById('kpi-verified-payments').textContent = verifiedCount;
      document.getElementById('kpi-total-hackers').textContent = totalHackers;
    }

    function getTeamDateKey(team) {
      if (!team || !team.createdAt) return 'Unknown Date';
      try {
        const d = new Date(team.createdAt);
        if (isNaN(d.getTime())) return 'Unknown Date';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      } catch (e) {
        return 'Unknown Date';
      }
    }

    function formatDateDisplay(dateKey) {
      if (!dateKey || dateKey === 'all') return 'All Dates';
      if (dateKey === 'Unknown Date') return 'Unknown Date';
      try {
        const parts = dateKey.split('-');
        if (parts.length !== 3) return dateKey;
        const [y, m, d] = parts.map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch (e) {
        return dateKey;
      }
    }

    function formatRegistrationTimestamp(isoString) {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        return '';
      }
    }

    function setTeamSizeFilter(size) {
      filterTeamSize = size || 'all';
      [btnFilterSizeAll, btnFilterSize3, btnFilterSize4].forEach(btn => {
        if (!btn) return;
        const btnSize = btn.getAttribute('data-size');
        btn.classList.toggle('active', btnSize === filterTeamSize);
      });
      renderTable();
    }

    function toggleTeamSizeFilter(size) {
      if (filterTeamSize === size && size !== 'all') {
        setTeamSizeFilter('all');
      } else {
        setTeamSizeFilter(size);
      }
    }

    function setDateFilter(dateVal) {
      filterDate = dateVal || 'all';
      if (filterDatePicker) {
        filterDatePicker.value = (filterDate !== 'all' && filterDate !== 'Unknown Date') ? filterDate : '';
      }
      if (filterDate !== 'all') {
        const count = allTeams.filter(t => getTeamDateKey(t) === filterDate).length;
        if (dateMatchBadge) {
          dateMatchBadge.textContent = `${count} squad${count === 1 ? '' : 's'}`;
          dateMatchBadge.style.display = 'inline-block';
        }
        if (btnClearDate) btnClearDate.style.display = 'inline-flex';
      } else {
        if (dateMatchBadge) dateMatchBadge.style.display = 'none';
        if (btnClearDate) btnClearDate.style.display = 'none';
      }
      renderTable();
    }

    function resetAllFilters() {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      setTeamSizeFilter('all');
      setDateFilter('all');
      filterPayment = 'all';
      if (filterPaymentSelect) filterPaymentSelect.value = 'all';
      renderTable();
    }
    window.__resetAdminFilters = resetAllFilters;

    // Bind Filter Controls
    if (btnFilterSizeAll) {
      btnFilterSizeAll.addEventListener('click', () => setTeamSizeFilter('all'));
    }
    if (btnFilterSize3) {
      btnFilterSize3.addEventListener('click', () => toggleTeamSizeFilter('3'));
    }
    if (btnFilterSize4) {
      btnFilterSize4.addEventListener('click', () => toggleTeamSizeFilter('4'));
    }
    if (filterDatePicker) {
      filterDatePicker.addEventListener('change', (e) => {
        const val = e.target.value;
        setDateFilter(val ? val : 'all');
      });
      filterDatePicker.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val) setDateFilter(val);
      });
    }
    if (btnClearDate) {
      btnClearDate.addEventListener('click', () => setDateFilter('all'));
    }
    if (filterPaymentSelect) {
      filterPaymentSelect.addEventListener('change', (e) => {
        filterPayment = e.target.value || 'all';
        renderTable();
      });
    }
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => resetAllFilters());
    }

    function updateDailyRegistrationsTelemetry() {
      updateFilterBadges();
    }

    function updateFilterBadges() {
      let count3 = 0;
      let count4 = 0;

      allTeams.forEach(t => {
        const size = t.teamSize || 4;
        if (size === 3) count3++;
        else if (size === 4) count4++;
      });

      // Update Size Badges
      if (badgeCountAll) badgeCountAll.textContent = allTeams.length;
      if (badgeCount3) badgeCount3.textContent = count3;
      if (badgeCount4) badgeCount4.textContent = count4;
      if (kpiSubTeams) kpiSubTeams.textContent = `3-Mem: ${count3} • 4-Mem: ${count4}`;

      if (filterDate !== 'all') {
        const count = allTeams.filter(t => getTeamDateKey(t) === filterDate).length;
        if (dateMatchBadge) {
          dateMatchBadge.textContent = `${count} squad${count === 1 ? '' : 's'}`;
          dateMatchBadge.style.display = 'inline-block';
        }
      } else {
        if (dateMatchBadge) dateMatchBadge.style.display = 'none';
      }
    }

    function renderTable() {
      const q = searchQuery.toLowerCase().trim();
      const filtered = allTeams.filter(t => {
        // 1. Search Query
        if (q) {
          const teamDate = getTeamDateKey(t).toLowerCase();
          const teamDateDisplay = formatDateDisplay(teamDate).toLowerCase();
          const regTimestamp = formatRegistrationTimestamp(t.createdAt).toLowerCase();

          const matchMembers = (t.members || []).some(m =>
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.phone && m.phone.toLowerCase().includes(q))
          );

          const matchSearch =
            (t.teamName && t.teamName.toLowerCase().includes(q)) ||
            (t.id && t.id.toLowerCase().includes(q)) ||
            (t.college && t.college.toLowerCase().includes(q)) ||
            (t.leader?.name && t.leader.name.toLowerCase().includes(q)) ||
            (t.leader?.email && t.leader.email.toLowerCase().includes(q)) ||
            (t.payment?.utr && t.payment.utr.toLowerCase().includes(q)) ||
            (t.payment?.phone && t.payment.phone.toLowerCase().includes(q)) ||
            matchMembers ||
            teamDate.includes(q) ||
            teamDateDisplay.includes(q) ||
            regTimestamp.includes(q);
          if (!matchSearch) return false;
        }

        // 2. Team Size Filter ("how many members in team 3 or 4")
        if (filterTeamSize !== 'all') {
          const size = String(t.teamSize || 4);
          if (size !== filterTeamSize) return false;
        }

        // 3. Search By Date Filter
        if (filterDate !== 'all') {
          const teamDate = getTeamDateKey(t);
          if (teamDate !== filterDate) return false;
        }

        // 4. Payment Status Filter
        if (filterPayment !== 'all') {
          const payStatus = t.payment?.status || 'pending';
          if (payStatus !== filterPayment) return false;
        }

        return true;
      });

      // Update Feedback Counter & Reset button visibility
      const isFiltered = (q !== '') || (filterTeamSize !== 'all') || (filterDate !== 'all') || (filterPayment !== 'all');
      if (filterCountFeedback) {
        if (isFiltered) {
          const dateNotice = filterDate !== 'all' ? ` • ${formatDateDisplay(filterDate)}` : '';
          const sizeNotice = filterTeamSize !== 'all' ? ` • ${filterTeamSize} Members` : '';
          filterCountFeedback.innerHTML = `Showing <strong>${filtered.length}</strong> of ${allTeams.length} squads <span style="color:var(--gold); font-size:0.68rem; font-weight:700;">(FILTERED${sizeNotice}${dateNotice})</span>`;
        } else {
          filterCountFeedback.innerHTML = `Showing <strong>${filtered.length}</strong> of ${allTeams.length} squads`;
        }
      }
      if (btnResetFilters) {
        btnResetFilters.style.display = isFiltered ? 'inline-flex' : 'none';
      }

      if (filtered.length === 0) {
        let emptyMsg = '';
        if (allTeams.length === 0) {
          emptyMsg = 'No squads registered yet. The system is clean and ready for live registrations.';
        } else {
          emptyMsg = `No squads match the selected filters. <button type="button" class="btn-clear-date" style="display:inline-flex; margin-left:8px; height:24px; padding:0 8px; font-size:0.68rem;" onclick="window.__resetAdminFilters()">Reset Filters</button>`;
        }
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:45px 20px; color:#888; font-family:'JetBrains Mono', monospace; font-size:0.8rem; letter-spacing:0.04em;">${emptyMsg}</td></tr>`;
        return;
      }

      let html = '';
      filtered.forEach(t => {
        const pay = t.payment || {};
        const food = t.food || {};
        const rev = t.reviews || {};
        const scores = t.scores || {};

        let foodCount = 0;
        ['dinner', 'breakfast', 'lunch'].forEach(k => {
          if (food[k]?.collected || (Array.isArray(food[k]?.members) && food[k].members.some(Boolean))) foodCount++;
        });

        let revCount = 0;
        ['r1', 'r2', 'r3'].forEach(k => {
          if (rev[k]?.attended) revCount++;
        });

        const payStatus = pay.status || 'pending';
        let statusBadge = `<span class="badge-status badge-pending">PENDING</span>`;
        if (payStatus === 'verified') statusBadge = `<span class="badge-status badge-verified">VERIFIED</span>`;
        if (payStatus === 'rejected') statusBadge = `<span class="badge-status badge-rejected">REJECTED</span>`;

        const size = t.teamSize || 4;
        const sizeClass = size === 3 ? 'size-3mem' : 'size-4mem';
        const regTime = formatRegistrationTimestamp(t.createdAt);

        html += `
          <tr>
            <td>
              <strong>${escapeHTML(t.teamName)}</strong>
              <div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--red); font-weight:600;">${escapeHTML(t.id)}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${escapeHTML(t.college || '')}</div>
              ${regTime ? `<div style="font-family:'JetBrains Mono'; font-size:0.67rem; color:#777; margin-top:3px;"><span style="color:#555;">Registered:</span> ${escapeHTML(regTime)}</div>` : ''}
            </td>
            <td>
              <span class="portal-badge font-mono">${escapeHTML((t.preferredDomain || 'MIND').toUpperCase())}</span>
              <div style="font-size:0.68rem; color:#888; font-family:'JetBrains Mono',monospace; margin-top:3px;">
                📍 ${escapeHTML(t.roomAllocated || 'Lab Block 3')}
              </div>
              <div style="margin-top:4px;">
                <span class="badge-size-pill ${sizeClass}">${size} MEMBERS</span>
              </div>
            </td>
            <td>
              ${statusBadge}
              <div style="font-size:0.7rem; color:#aaa; margin-top:2px;">₹${pay.amount || (size * 349)}</div>
            </td>
            <td>
              <div class="font-mono" style="font-size:0.72rem;">${escapeHTML(pay.utr || 'N/A')}</div>
              <div style="font-size:0.68rem; color:#888;">Phone: ${escapeHTML(pay.phone || t.leader?.phone || 'N/A')}</div>
              ${safeUrl(pay.screenshotUrl) ? `<a href="${safeUrl(pay.screenshotUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:0.68rem; color:var(--cyan);">View Receipt ↗</a>` : (pay.screenshotUrl ? `<span style="font-size:0.68rem; color:#888;">Receipt Attached</span>` : '')}
            </td>
            <td>
              <span class="font-mono" style="font-weight:700;">${foodCount} / 3</span>
            </td>
            <td>
              <span class="font-mono" style="font-weight:700;">${revCount} / 3</span>
            </td>
            <td>
              <span class="font-mono" style="font-weight:800; color:var(--green); font-size:0.95rem;">${scores.total || 0}</span>
            </td>
            <td>
              <div class="tbl-actions">
                <select class="sel-quick-status ${payStatus}" data-status-id="${escapeHTML(t.id)}" title="Select payment verification status">
                  <option value="verified" ${payStatus === 'verified' ? 'selected' : ''}>✓ VERIFIED</option>
                  <option value="pending" ${payStatus === 'pending' ? 'selected' : ''}>⏳ PENDING</option>
                  <option value="rejected" ${payStatus === 'rejected' ? 'selected' : ''}>✕ REJECTED</option>
                </select>
                <button class="btn-tbl-mail ${pay.mailSent ? 'is-sent' : ''}" data-mail-id="${escapeHTML(t.id)}" title="${pay.mailSent ? 'Confirmation email sent ' + (pay.mailSentAt ? new Date(pay.mailSentAt).toLocaleString() : '') + '. Click to re-send.' : (payStatus === 'verified' ? 'Send official payment verified email to leader and roster' : 'Send verification email (will mark payment verified)')}">
                  ${pay.mailSent ? '<span>✓</span><span>MAILED</span>' : '<span>✉</span><span>MAIL</span>'}
                </button>
                <button class="btn-tbl-edit" data-edit-id="${escapeHTML(t.id)}">EDIT</button>
                <button class="btn-tbl-del" data-del-id="${escapeHTML(t.id)}">DEL</button>
              </div>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;

      // Bind Quick Payment Status Dropdown Buttons
      tbody.querySelectorAll('.sel-quick-status').forEach(select => {
        select.addEventListener('change', async (e) => {
          const tId = select.getAttribute('data-status-id');
          const targetTeam = allTeams.find(t => t.id === tId);
          if (!targetTeam) return;

          const newStatus = e.target.value;
          select.disabled = true;

          try {
            const res = await fetch(`/api/admin/teams/${tId}`, {
              method: 'PUT',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({
                payment: {
                  ...targetTeam.payment,
                  status: newStatus
                }
              })
            });
            const data = await res.json();
            if (data.success) {
              const idx = allTeams.findIndex(t => t.id === tId);
              if (idx >= 0) allTeams[idx] = data.team;
              renderTable();
              updateKPIs();
              updateDailyRegistrationsTelemetry();
            } else {
              alert('Failed to update status: ' + (data.error || 'Unknown error'));
              renderTable();
            }
          } catch (err) {
            alert('Error updating payment status: ' + err.message);
            renderTable();
          }
        });
      });

      // Bind Quick Send Verification Mail Buttons
      tbody.querySelectorAll('.btn-tbl-mail').forEach(btn => {
        btn.addEventListener('click', async () => {
          const tId = btn.getAttribute('data-mail-id');
          const targetTeam = allTeams.find(t => t.id === tId);
          if (!targetTeam) return;

          const currentStatus = targetTeam.payment?.status || 'pending';
          const isAlreadyMailed = Boolean(targetTeam.payment?.mailSent);
          const recipient = targetTeam.leader?.email || 'N/A';

          let confirmMsg = `Send official payment verification email to squad "${targetTeam.teamName}" (${recipient})?`;
          if (currentStatus !== 'verified') {
            confirmMsg = `Squad "${targetTeam.teamName}" payment is currently "${currentStatus.toUpperCase()}".\n\nMark payment as VERIFIED and dispatch confirmation email to ${recipient}?`;
          } else if (isAlreadyMailed) {
            const sentTime = targetTeam.payment?.mailSentAt ? new Date(targetTeam.payment.mailSentAt).toLocaleString() : 'earlier';
            confirmMsg = `Confirmation email was already sent on ${sentTime}.\n\nRe-send verification email to ${recipient}?`;
          }

          if (!confirm(confirmMsg)) return;

          btn.disabled = true;
          const originalText = btn.textContent;
          btn.textContent = '⏳ SENDING...';

          try {
            const res = await fetch('/api/admin/send-verification-mail', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ teamId: tId })
            });
            const data = await res.json();
            if (data.success) {
              const idx = allTeams.findIndex(t => t.id === tId);
              if (idx >= 0 && data.team) {
                allTeams[idx] = data.team;
              } else if (idx >= 0) {
                allTeams[idx].payment = {
                  ...allTeams[idx].payment,
                  status: 'verified',
                  mailSent: true,
                  mailSentAt: data.mailSentAt || new Date().toISOString()
                };
              }
              renderTable();
              updateKPIs();

              if (data.simulated) {
                alert(`⚡ [SIMULATION MODE]\nPayment verification email logged for "${targetTeam.teamName}" (${recipient})!\n\nTo send live emails, configure RESEND_API_KEY in .env.local.`);
              } else {
                alert(`✅ Verification email sent successfully to ${recipient}!`);
              }
            } else {
              alert('Failed to send verification email: ' + (data.error || 'Unknown error'));
              btn.disabled = false;
              btn.textContent = originalText;
            }
          } catch (err) {
            alert('Network error sending verification email: ' + err.message);
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
      });

      // Bind Edit & Delete buttons
      tbody.querySelectorAll('.btn-tbl-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          openEditModal(btn.getAttribute('data-edit-id'));
        });
      });

      tbody.querySelectorAll('.btn-tbl-del').forEach(btn => {
        btn.addEventListener('click', async () => {
          const tId = btn.getAttribute('data-del-id');
          if (confirm(`Are you sure you want to completely delete team ${tId}?`)) {
            try {
              const res = await fetch(`/api/admin/teams/${tId}`, {
                method: 'DELETE',
                headers: authHeaders(),
              });
              const data = await res.json();
              if (data.success) {
                allTeams = allTeams.filter(t => t.id !== tId);
                renderTable();
                updateKPIs();
                updateDailyRegistrationsTelemetry();
              }
            } catch (err) {
              alert('Error deleting squad: ' + err.message);
            }
          }
        });
      });
    }

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTable();
    });

    // EDIT MODAL
    function openEditModal(teamId) {
      editingTeam = allTeams.find(t => t.id === teamId);
      if (!editingTeam) return;

      document.getElementById('edit-team-id').textContent = editingTeam.id;
      document.getElementById('edt-team-name').value = editingTeam.teamName || '';
      document.getElementById('edt-college').value = editingTeam.college || '';
      document.getElementById('edt-room').value = editingTeam.roomAllocated || '';
      const rawDomain = (editingTeam.preferredDomain || 'transportation').toLowerCase();
      const domainMap = {
        mind: 'transportation',
        space: 'cybersecurity',
        reality: 'infrastructure',
        power: 'cleantech',
        time: 'education',
        soul: 'healthcare',
        transportation: 'transportation',
        cybersecurity: 'cybersecurity',
        infrastructure: 'infrastructure',
        cleantech: 'cleantech',
        education: 'education',
        healthcare: 'healthcare',
        intelligence: 'transportation',
        connectivity: 'cybersecurity',
        digital: 'infrastructure',
        automation: 'cleantech',
        analytics: 'education',
        impact: 'healthcare'
      };
      document.getElementById('edt-domain').value = domainMap[rawDomain] || 'transportation';
      document.getElementById('edt-size').value = editingTeam.teamSize || 4;
      const pwdInput = document.getElementById('edt-password');
      if (pwdInput) {
        pwdInput.value = '';
        pwdInput.placeholder = editingTeam.hasPassword ? '•••••••• (Leave blank to keep current)' : 'Enter new password';
      }

      document.getElementById('edt-leader-name').value = editingTeam.leader?.name || '';
      document.getElementById('edt-leader-email').value = editingTeam.leader?.email || '';
      document.getElementById('edt-leader-phone').value = editingTeam.leader?.phone || '';

      const pay = editingTeam.payment || {};
      document.getElementById('edt-pay-status').value = pay.status || 'pending';
      document.getElementById('edt-pay-utr').value = pay.utr || '';
      document.getElementById('edt-pay-amount').value = pay.amount || (editingTeam.teamSize || 4) * 349;

      uploadedReceiptData = null;
      const edtPayScreenshot = document.getElementById('edt-pay-screenshot');
      const fileEdtReceipt = document.getElementById('file-edt-receipt');
      const lblFileEdtReceipt = document.getElementById('lbl-file-edt-receipt');
      const edtReceiptLinkWrap = document.getElementById('edt-receipt-link-wrap');

      if (edtPayScreenshot) {
        edtPayScreenshot.value = pay.screenshotUrl || '';
      }
      if (fileEdtReceipt) {
        fileEdtReceipt.value = '';
      }
      if (lblFileEdtReceipt) {
        lblFileEdtReceipt.textContent = 'Upload File';
      }
      if (edtReceiptLinkWrap) {
        if (pay.screenshotUrl && pay.screenshotUrl !== '/placeholder-receipt.png') {
          const validUrl = safeUrl(pay.screenshotUrl) || pay.screenshotUrl;
          edtReceiptLinkWrap.innerHTML = `
            <a href="${escapeHTML(validUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan); font-size:0.75rem; text-decoration:underline; font-family:'JetBrains Mono', monospace;">
              ↗ View Current Receipt
            </a>
          `;
        } else {
          edtReceiptLinkWrap.innerHTML = `<span style="color:var(--text-muted); font-size:0.72rem; font-family:'JetBrains Mono', monospace;">(No receipt attached)</span>`;
        }
      }

      const isMailed = Boolean(pay.mailSent);
      const mailStatusEl = document.getElementById('edt-mail-status');
      if (mailStatusEl) {
        if (isMailed) {
          mailStatusEl.textContent = `SENT (${pay.mailSentAt ? new Date(pay.mailSentAt).toLocaleString() : 'YES'})`;
          mailStatusEl.style.color = 'var(--green)';
        } else {
          mailStatusEl.textContent = 'NOT SENT';
          mailStatusEl.style.color = 'var(--gold)';
        }
      }

      const btnEdtSendMail = document.getElementById('btn-edt-send-mail');
      if (btnEdtSendMail) {
        btnEdtSendMail.onclick = async () => {
          if (!editingTeam) return;
          const recipient = editingTeam.leader?.email || 'N/A';
          if (!confirm(`Dispatch official payment verification email to squad "${editingTeam.teamName}" (${recipient})?`)) return;

          btnEdtSendMail.disabled = true;
          const originalText = btnEdtSendMail.textContent;
          btnEdtSendMail.textContent = '⏳ SENDING...';

          try {
            const res = await fetch('/api/admin/send-verification-mail', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ teamId: editingTeam.id })
            });
            const data = await res.json();
            if (data.success) {
              if (data.team) {
                editingTeam = data.team;
                const idx = allTeams.findIndex(t => t.id === editingTeam.id);
                if (idx >= 0) allTeams[idx] = data.team;
              }
              document.getElementById('edt-pay-status').value = 'verified';
              if (mailStatusEl) {
                mailStatusEl.textContent = `SENT (${new Date().toLocaleString()})`;
                mailStatusEl.style.color = 'var(--green)';
              }
              renderTable();
              updateKPIs();
              if (data.simulated) {
                alert(`⚡ [SIMULATION MODE]\nPayment verification email logged for "${editingTeam.teamName}" (${recipient})!\n\nTo send live emails, configure RESEND_API_KEY in .env.local.`);
              } else {
                alert(`✅ Verification email sent successfully to ${recipient}!`);
              }
            } else {
              alert('Failed to send verification email: ' + (data.error || 'Unknown error'));
            }
          } catch (err) {
            alert('Network error sending verification email: ' + err.message);
          } finally {
            btnEdtSendMail.disabled = false;
            btnEdtSendMail.textContent = originalText;
          }
        };
      }

      const food = editingTeam.food || {};
      const elDin = document.getElementById('edt-food-din');
      const elBf = document.getElementById('edt-food-bf');
      const elLn = document.getElementById('edt-food-ln');
      if (elDin) elDin.checked = Boolean(food.dinner?.collected);
      if (elBf) elBf.checked = Boolean(food.breakfast?.collected);
      if (elLn) elLn.checked = Boolean(food.lunch?.collected);

      const rev = editingTeam.reviews || {};
      document.getElementById('edt-rev-r1').checked = Boolean(rev.r1?.attended);
      document.getElementById('edt-rev-r2').checked = Boolean(rev.r2?.attended);
      document.getElementById('edt-rev-r3').checked = Boolean(rev.r3?.attended);

      const scores = editingTeam.scores || {};
      document.getElementById('edt-score-total').value = scores.total || 0;
      document.getElementById('edt-score-remarks').value = scores.remarks || '';

      renderEditMembers(editingTeam.members || [], editingTeam.teamSize || 4);

      modalEdit.classList.add('is-open');
    }

    btnCloseEdit.addEventListener('click', () => modalEdit.classList.remove('is-open'));

    // Receipt File & URL Handlers
    const fileEdtReceipt = document.getElementById('file-edt-receipt');
    const lblFileEdtReceipt = document.getElementById('lbl-file-edt-receipt');
    const edtPayScreenshot = document.getElementById('edt-pay-screenshot');
    const edtReceiptLinkWrap = document.getElementById('edt-receipt-link-wrap');

    if (fileEdtReceipt) {
      fileEdtReceipt.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (PNG, JPG, WebP).');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('Receipt image exceeds 5MB limit. Please upload a smaller compressed image.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          uploadedReceiptData = loadEvt.target.result;
          if (lblFileEdtReceipt) {
            lblFileEdtReceipt.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
          }
          if (edtPayScreenshot) {
            edtPayScreenshot.value = `[Uploaded File: ${file.name}]`;
          }
          if (edtReceiptLinkWrap) {
            edtReceiptLinkWrap.innerHTML = `
              <span style="color:var(--green); font-size:0.72rem; font-family:'JetBrains Mono', monospace;">
                ✓ Attached: ${escapeHTML(file.name)}
              </span>
            `;
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (edtPayScreenshot) {
      edtPayScreenshot.addEventListener('input', () => {
        const val = edtPayScreenshot.value.trim();
        if (val && !val.startsWith('[Uploaded File:')) {
          uploadedReceiptData = null;
          if (lblFileEdtReceipt) lblFileEdtReceipt.textContent = 'Upload File';
          if (edtReceiptLinkWrap) {
            edtReceiptLinkWrap.innerHTML = `
              <a href="${escapeHTML(val)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan); font-size:0.75rem; text-decoration:underline; font-family:'JetBrains Mono', monospace;">
                ↗ Test Link
              </a>
            `;
          }
        }
      });
    }

    function createMemberRowHtml(member = {}, memberIndex = 0) {
      const memberNum = String(memberIndex + 2).padStart(2, '0');
      return `
        <div class="member-edit-item" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="mono-label edt-member-label" style="font-size: 0.7rem; color: var(--gold); font-weight: 700;">MEMBER ${memberNum}</span>
            <button type="button" class="btn-del-member-edt" style="background: rgba(255, 23, 68, 0.1); border: 1px solid rgba(255, 23, 68, 0.25); color: #ff5252; padding: 3px 8px; border-radius: 4px; font-size: 0.68rem; cursor: pointer; font-family: 'JetBrains Mono', monospace;">✕ REMOVE</button>
          </div>
          <div class="edit-grid-3" style="margin-bottom: 0;">
            <div class="form-group">
              <label class="form-label">MEMBER NAME</label>
              <input type="text" class="form-input edt-member-name" value="${escapeHTML(member.name || '')}" placeholder="Full Name">
            </div>
            <div class="form-group">
              <label class="form-label">MEMBER EMAIL</label>
              <input type="email" class="form-input edt-member-email" value="${escapeHTML(member.email || '')}" placeholder="Email Address">
            </div>
            <div class="form-group">
              <label class="form-label">MEMBER PHONE</label>
              <input type="text" class="form-input edt-member-phone" value="${escapeHTML(member.phone || '')}" placeholder="Phone Number">
            </div>
          </div>
        </div>
      `;
    }

    function updateMemberLabels() {
      const container = document.getElementById('edt-members-container');
      if (!container) return;
      const items = container.querySelectorAll('.member-edit-item');
      items.forEach((item, idx) => {
        const lbl = item.querySelector('.edt-member-label');
        if (lbl) {
          lbl.textContent = `MEMBER ${String(idx + 2).padStart(2, '0')}`;
        }
      });
      const sizeInput = document.getElementById('edt-size');
      if (sizeInput) {
        sizeInput.value = items.length + 1;
      }
    }

    function attachMemberRemoveHandlers() {
      const container = document.getElementById('edt-members-container');
      if (!container) return;
      container.querySelectorAll('.btn-del-member-edt').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          const item = btn.closest('.member-edit-item');
          if (item) {
            item.remove();
            updateMemberLabels();
          }
        };
      });
    }

    function renderEditMembers(membersList, teamSize = 4) {
      const container = document.getElementById('edt-members-container');
      if (!container) return;
      container.innerHTML = '';

      const list = Array.isArray(membersList) ? [...membersList] : [];
      const targetCount = Math.max((parseInt(teamSize, 10) || 4) - 1, list.length, 2);

      for (let i = 0; i < targetCount; i++) {
        const m = list[i] || { name: '', email: '', phone: '' };
        container.insertAdjacentHTML('beforeend', createMemberRowHtml(m, i));
      }

      attachMemberRemoveHandlers();
    }

    const edtSizeInput = document.getElementById('edt-size');
    if (edtSizeInput) {
      edtSizeInput.addEventListener('change', () => {
        const targetSize = parseInt(edtSizeInput.value, 10);
        if (!targetSize || targetSize < 2) return;
        const targetMembers = targetSize - 1;
        const container = document.getElementById('edt-members-container');
        if (!container) return;
        let currentItems = container.querySelectorAll('.member-edit-item');
        while (currentItems.length < targetMembers) {
          container.insertAdjacentHTML('beforeend', createMemberRowHtml({}, currentItems.length));
          currentItems = container.querySelectorAll('.member-edit-item');
        }
        if (currentItems.length > targetMembers) {
          for (let i = currentItems.length - 1; i >= targetMembers; i--) {
            const row = currentItems[i];
            const name = row.querySelector('.edt-member-name')?.value?.trim();
            const email = row.querySelector('.edt-member-email')?.value?.trim();
            const phone = row.querySelector('.edt-member-phone')?.value?.trim();
            if (!name && !email && !phone) {
              row.remove();
            }
          }
        }
        attachMemberRemoveHandlers();
        updateMemberLabels();
      });
    }

    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!editingTeam) return;

      const memberRows = document.querySelectorAll('#edt-members-container .member-edit-item');
      const updatedMembers = [];
      memberRows.forEach(row => {
        const name = row.querySelector('.edt-member-name')?.value?.trim() || '';
        const email = row.querySelector('.edt-member-email')?.value?.trim() || '';
        const phone = row.querySelector('.edt-member-phone')?.value?.trim() || '';
        if (name || email || phone) {
          updatedMembers.push({ name, email, phone });
        }
      });

      let finalScreenshotUrl = editingTeam.payment?.screenshotUrl || '';
      if (uploadedReceiptData) {
        finalScreenshotUrl = uploadedReceiptData;
      } else if (edtPayScreenshot) {
        const txtVal = edtPayScreenshot.value.trim();
        if (txtVal && !txtVal.startsWith('[Uploaded File:')) {
          finalScreenshotUrl = txtVal;
        }
      }

      const updates = {
        teamName: document.getElementById('edt-team-name').value.trim(),
        college: document.getElementById('edt-college').value.trim(),
        roomAllocated: document.getElementById('edt-room').value.trim(),
        preferredDomain: document.getElementById('edt-domain').value,
        teamSize: parseInt(document.getElementById('edt-size').value, 10) || (updatedMembers.length + 1),
        leader: {
          name: document.getElementById('edt-leader-name').value.trim(),
          email: document.getElementById('edt-leader-email').value.trim(),
          phone: document.getElementById('edt-leader-phone').value.trim(),
        },
        members: updatedMembers,
        payment: {
          ...editingTeam.payment,
          status: document.getElementById('edt-pay-status').value,
          utr: document.getElementById('edt-pay-utr').value.trim(),
          amount: parseFloat(document.getElementById('edt-pay-amount').value) || 0,
          screenshotUrl: finalScreenshotUrl,
        },
        food: {
          dinner: { collected: Boolean(document.getElementById('edt-food-din')?.checked) },
          breakfast: { collected: Boolean(document.getElementById('edt-food-bf')?.checked) },
          lunch: { collected: Boolean(document.getElementById('edt-food-ln')?.checked) },
        },
        reviews: {
          r1: { attended: document.getElementById('edt-rev-r1').checked },
          r2: { attended: document.getElementById('edt-rev-r2').checked },
          r3: { attended: document.getElementById('edt-rev-r3').checked },
        },
        scores: {
          ...editingTeam.scores,
          total: parseFloat(document.getElementById('edt-score-total').value) || 0,
          remarks: document.getElementById('edt-score-remarks').value.trim(),
        }
      };

      const newPwd = document.getElementById('edt-password')?.value?.trim();
      if (newPwd) {
        updates.teamPassword = newPwd;
      }

      const btnSubmit = formEdit.querySelector('button[type="submit"]');
      const originalSubmitText = btnSubmit ? btnSubmit.textContent : 'COMMIT ALL SQUAD EDITS TO CLOUDFLARE R2';
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'COMMITTING CHANGES TO R2...';
      }

      try {
        const res = await fetch(`/api/admin/teams/${editingTeam.id}`, {
          method: 'PUT',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const idx = allTeams.findIndex(t => t.id === editingTeam.id);
          if (idx >= 0) allTeams[idx] = data.team;
          editingTeam = data.team;
          modalEdit.classList.remove('is-open');
          renderTable();
          updateKPIs();
          updateDailyRegistrationsTelemetry();
          showAdminToast(`✓ Squad "${data.team?.teamName || editingTeam.teamName}" updated successfully!`);
        } else {
          alert('Failed to update squad: ' + (data.error || 'Server error. Please verify admin credentials.'));
        }
      } catch (err) {
        alert('Error updating team: ' + err.message);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = originalSubmitText;
        }
      }
    });

    // BULK SEND CONFIRMATION PASSES TO ALL VERIFIED SQUADS
    const btnBatchMail = document.getElementById('btn-batch-mail');
    if (btnBatchMail) {
      btnBatchMail.addEventListener('click', async () => {
        const verifiedTeams = allTeams.filter(t => t.payment?.status === 'verified');
        const unmailedTeams = verifiedTeams.filter(t => !t.payment?.mailSent);

        if (verifiedTeams.length === 0) {
          alert('No verified squads found. Please verify squad payments before sending official confirmation passes.');
          return;
        }

        let force = false;
        let targetCount = unmailedTeams.length;

        const mailDetails = `The email includes:\n• Assigned Track Domain & Lab Room Allocation\n• Official Pass ID & Team Name\n• Mandatory Rules: Own Laptops & Chargers, Electric Spikes (Multi-Plug Boards), Zero Tolerance for Misbehavior, and Original College IDs.`;

        if (targetCount === 0) {
          if (confirm(`All ${verifiedTeams.length} verified squad(s) have already received confirmation passes.\n\nDo you want to FORCE re-send to ALL ${verifiedTeams.length} verified squads?\n\n${mailDetails}`)) {
            force = true;
            targetCount = verifiedTeams.length;
          } else {
            return;
          }
        } else {
          if (!confirm(`Dispatch Official Confirmation Passes to ${targetCount} verified squad(s) that haven't received their pass yet?\n\n(${verifiedTeams.length - unmailedTeams.length} already sent, ${targetCount} pending)\n\n${mailDetails}`)) {
            return;
          }
        }

        btnBatchMail.disabled = true;
        const originalContent = btnBatchMail.innerHTML;
        btnBatchMail.innerHTML = `<span>⏳</span><span>DISPATCHING PASSES (${targetCount})...</span>`;

        try {
          const res = await fetch('/api/admin/send-all-verification-mails', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ force })
          });
          const data = await res.json();
          if (data.success) {
            await loadData();
            if (data.simulated) {
              alert(`⚡ [SIMULATION MODE]\nProcessed ${data.sentCount} squad passes!\n\n(Configure RESEND_API_KEY in .env.local to send live emails via Resend).`);
            } else {
              alert(`✅ Official Confirmation Passes Dispatched!\n\n${data.sentCount} verified squads notified with their room allocation, event timings, and rules (${data.failCount || 0} failed).`);
            }
          } else {
            alert('Failed to send batch confirmation passes: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          alert('Error sending batch confirmation passes: ' + err.message);
        } finally {
          btnBatchMail.disabled = false;
          btnBatchMail.innerHTML = originalContent;
        }
      });
    }

    // PROBLEM STATEMENTS MANAGER
    btnOpenPsMgr.addEventListener('click', () => {
      renderPsManager();
      modalPsMgr.classList.add('is-open');
    });

    btnClosePsMgr.addEventListener('click', () => modalPsMgr.classList.remove('is-open'));

    function renderPsManager() {
      const prefixMap = {
        transportation: 'TRANS',
        cybersecurity: 'CYBER',
        infrastructure: 'INFRA',
        cleantech: 'CLEAN',
        education: 'EDU',
        healthcare: 'HEALTH',
        mind: 'TRANS',
        space: 'CYBER',
        reality: 'INFRA',
        power: 'CLEAN',
        time: 'EDU',
        soul: 'HEALTH',
        intelligence: 'TRANS',
        connectivity: 'CYBER',
        digital: 'INFRA',
        automation: 'CLEAN',
        analytics: 'EDU',
        impact: 'HEALTH'
      };

      let html = '';
      allDomains.forEach(dom => {
        const isReleased = Boolean(dom.isPsReleased);
        const psList = dom.problemStatements || [];
        const normKey = (dom.stoneId || '').toLowerCase() || (dom.stoneName ? dom.stoneName.toLowerCase().replace(/ stone/i, '').trim() : '') || dom.id;
        const canonical = CANONICAL_DOMAINS_MAP[normKey] || CANONICAL_DOMAINS_MAP[dom.id];
        const displayDomainName = canonical ? canonical.domainName : dom.domainName;
        const displayTagline = canonical ? canonical.tagline : (dom.tagline || '');
        const targetId = canonical ? canonical.id : dom.id;
        const pfx = prefixMap[targetId] || prefixMap[dom.id] || targetId.substring(0, 4).toUpperCase();
        const nextCode = `PS-${pfx}-${String(psList.length + 1).padStart(2, '0')}`;
        const accent = dom.accentHex || '#ffd000';

        html += `
          <div class="field-card" style="border-left: 4px solid ${accent}; margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:12px;">
              <div>
                <h4 style="font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:8px;">
                  <span>${escapeHTML(displayDomainName)}</span>
                  <span style="font-family:'JetBrains Mono'; font-size:0.75rem; color:${accent}; font-weight:700;">(${escapeHTML(dom.stoneName)})</span>
                </h4>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(displayTagline)}</div>
              </div>

              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <button class="btn-toggle-add-ps" data-domain-id="${escapeHTML(dom.id)}" style="padding:6px 12px; border-radius:6px; background:rgba(255,255,255,0.06); border:1px solid ${accent}50; color:${accent}; font-family:'JetBrains Mono',monospace; font-size:0.72rem; font-weight:700; cursor:pointer; transition:all 0.2s;">
                  + ADD STATEMENT
                </button>
                <label class="switch-wrap">
                  <input type="checkbox" class="toggle-release-ps" data-domain-id="${escapeHTML(dom.id)}" ${isReleased ? 'checked' : ''}>
                  <span style="font-family:'JetBrains Mono'; font-size:0.72rem; font-weight:700; color:${isReleased ? 'var(--green)' : 'var(--gold)'};">
                    ${isReleased ? 'RELEASED (LIVE)' : 'LOCKED (HIDDEN)'}
                  </span>
                </label>
              </div>
            </div>

            <!-- Allocated Lab / Area for this Stone -->
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin: 0 0 14px 0; padding:10px 14px; background:rgba(255,255,255,0.02); border:1px solid ${accent}35; border-radius:8px;">
              <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:240px;">
                <span style="font-family:'JetBrains Mono'; font-size:0.72rem; color:${accent}; font-weight:700; white-space:nowrap;">📍 ALLOCATED LAB / AREA:</span>
                <input type="text" id="edt-ps-area-${escapeHTML(dom.id)}" class="form-input font-mono" value="${escapeHTML(dom.roomAllocated || 'Lab Block 3')}" placeholder="e.g. Lab Block 3 (CS-301)" style="padding:6px 10px; font-size:0.75rem; flex:1;">
              </div>
              <button type="button" class="btn-update-stone-area-single" data-domain-id="${escapeHTML(dom.id)}" style="padding:6px 14px; border-radius:6px; background:${accent}; color:#000; font-family:'Syne',sans-serif; font-size:0.72rem; font-weight:800; border:none; cursor:pointer; box-shadow:0 0 10px ${accent}30;">
                UPDATE AREA
              </button>
            </div>

            <!-- Expandable Add Problem Statement Panel -->
            <div id="add-panel-${escapeHTML(dom.id)}" style="display:none; margin: 12px 0 16px 0; padding:16px; border-radius:10px; background:rgba(6,6,12,0.95); border:1px solid ${accent}60; box-shadow:0 8px 25px rgba(0,0,0,0.6);">
              <div style="font-family:'Syne',sans-serif; font-size:0.86rem; font-weight:700; color:${accent}; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span>✦</span> NEW PROBLEM STATEMENT // ${escapeHTML(dom.stoneName.toUpperCase())} (${escapeHTML(displayDomainName)})
              </div>

              <div class="edit-grid-3" style="margin-bottom:10px;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label">CHALLENGE CODE</label>
                  <input type="text" id="new-code-${escapeHTML(dom.id)}" class="form-input font-mono" value="${escapeHTML(nextCode)}" style="padding:8px 10px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">PROBLEM TITLE</label>
                  <input type="text" id="new-title-${escapeHTML(dom.id)}" class="form-input" placeholder="e.g. Distributed Telemetry Mesh Engine" style="padding:8px 10px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">DIFFICULTY</label>
                  <select id="new-diff-${escapeHTML(dom.id)}" class="form-input custom-select" style="padding:8px 10px; font-size:0.82rem;">
                    <option value="Advanced" selected>Advanced</option>
                    <option value="Hardcore">Hardcore</option>
                    <option value="Intermediate">Intermediate</option>
                  </select>
                </div>
              </div>

              <div class="edit-grid-2" style="margin-bottom:10px;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label">CATEGORY / TRACK</label>
                  <input type="text" id="new-cat-${escapeHTML(dom.id)}" class="form-input" value="${escapeHTML(displayDomainName)}" style="padding:8px 10px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">DELIVERABLES (COMMA-SEPARATED)</label>
                  <input type="text" id="new-deliv-${escapeHTML(dom.id)}" class="form-input" placeholder="Interactive UI visualizer, Core architecture daemon, Benchmark testbench" style="padding:8px 10px; font-size:0.82rem;">
                </div>
              </div>

              <div class="form-group" style="margin-bottom:12px;">
                <label class="form-label">PROBLEM STATEMENT DESCRIPTION</label>
                <textarea id="new-desc-${escapeHTML(dom.id)}" class="form-input" rows="3" placeholder="Provide background context, technical specifications, and key engineering expectations..." style="padding:8px 10px; font-size:0.82rem;"></textarea>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
                <button class="btn-cancel-add-ps" data-domain-id="${escapeHTML(dom.id)}" style="padding:7px 14px; border-radius:6px; background:transparent; border:1px solid var(--border-subtle); color:var(--text-muted); font-size:0.75rem; cursor:pointer;">
                  Cancel
                </button>
                <button class="btn-save-new-ps" data-domain-id="${escapeHTML(dom.id)}" style="padding:7px 18px; border-radius:6px; background:${accent}; color:#000; font-family:'Syne',sans-serif; font-size:0.8rem; font-weight:800; border:none; cursor:pointer; box-shadow:0 0 12px ${accent}40;">
                  SAVE STATEMENT TO ${escapeHTML(dom.stoneName.toUpperCase())}
                </button>
              </div>
            </div>

            <!-- Active Statements List -->
            <div style="margin-top:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:0.75rem; color:#bbb; text-transform:uppercase;">
                  Active Statements (${psList.length}):
                </strong>
              </div>

              ${psList.length === 0 ? `
                <div style="padding:14px; text-align:center; font-size:0.75rem; color:#777; background:rgba(255,255,255,0.01); border-radius:6px; border:1px dashed rgba(255,255,255,0.08);">
                  No problem statements for this stone yet. Click <strong>+ ADD STATEMENT</strong> above to create one.
                </div>
              ` : `
                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${psList.map((p, idx) => `
                    <div style="padding:10px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                      <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                          <span style="color:${accent}; font-family:'JetBrains Mono'; font-weight:700; font-size:0.75rem;">${escapeHTML(p.code)}:</span>
                          <strong style="font-size:0.82rem; color:#fff;">${escapeHTML(p.title)}</strong>
                          <span style="font-size:0.65rem; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.06); color:#aaa; font-family:'JetBrains Mono';">
                            ${escapeHTML(p.difficulty || 'Advanced')}
                          </span>
                        </div>
                        <div style="font-size:0.74rem; color:#888; line-height:1.4;">${escapeHTML(p.description)}</div>
                        ${(p.deliverables && p.deliverables.length > 0) ? `
                          <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
                            ${p.deliverables.map(d => `
                              <span style="font-size:0.65rem; padding:1px 6px; border-radius:3px; background:rgba(255,255,255,0.04); color:#aaa;">✦ ${escapeHTML(d)}</span>
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>

                      <button class="btn-del-ps" data-domain-id="${escapeHTML(dom.id)}" data-ps-id="${escapeHTML(p.id || p.code)}" title="Remove this problem statement" style="padding:4px 8px; border-radius:4px; background:rgba(255,42,75,0.1); border:1px solid var(--red); color:var(--red); font-size:0.68rem; cursor:pointer; white-space:nowrap;">
                        ✕ REMOVE
                      </button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        `;
      });
      psMgrList.innerHTML = html;

      // Bind Update Stone Area Single Buttons inside PS Manager
      psMgrList.querySelectorAll('.btn-update-stone-area-single').forEach(btn => {
        btn.addEventListener('click', async () => {
          const domId = btn.getAttribute('data-domain-id');
          const areaInput = document.getElementById(`edt-ps-area-${domId}`);
          const newArea = areaInput ? areaInput.value.trim() : '';
          const targetDomain = allDomains.find(d => d.id === domId);
          if (!targetDomain) return;

          btn.disabled = true;
          const oldText = btn.textContent;
          btn.textContent = 'SAVING...';

          try {
            const res = await fetch('/api/admin/domains', {
              method: 'PUT',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({
                ...targetDomain,
                roomAllocated: newArea,
                syncExistingTeams: true
              })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to update stone area.');
            }

            targetDomain.roomAllocated = newArea;
            allTeams.forEach(t => {
              if (normalizeDomainId(t.preferredDomain) === normalizeDomainId(domId)) {
                t.roomAllocated = newArea;
              }
            });
            renderTable();
            alert(`✓ Venue for ${targetDomain.stoneName} updated to "${newArea}" and synchronized across squads!`);
          } catch (err) {
            alert('Error updating venue: ' + err.message);
          } finally {
            btn.disabled = false;
            btn.textContent = oldText;
          }
        });
      });

      // Bind Toggle Add Panel Buttons
      psMgrList.querySelectorAll('.btn-toggle-add-ps').forEach(btn => {
        btn.addEventListener('click', () => {
          const domId = btn.getAttribute('data-domain-id');
          const panel = document.getElementById(`add-panel-${domId}`);
          if (panel) {
            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '+ ADD STATEMENT' : '✕ CLOSE FORM';
          }
        });
      });

      // Bind Cancel Add Panel Buttons
      psMgrList.querySelectorAll('.btn-cancel-add-ps').forEach(btn => {
        btn.addEventListener('click', () => {
          const domId = btn.getAttribute('data-domain-id');
          const panel = document.getElementById(`add-panel-${domId}`);
          const toggleBtn = psMgrList.querySelector(`.btn-toggle-add-ps[data-domain-id="${domId}"]`);
          if (panel) panel.style.display = 'none';
          if (toggleBtn) toggleBtn.textContent = '+ ADD STATEMENT';
        });
      });

      // Bind Save New Problem Statement Buttons
      psMgrList.querySelectorAll('.btn-save-new-ps').forEach(btn => {
        btn.addEventListener('click', async () => {
          const domId = btn.getAttribute('data-domain-id');
          const targetDomain = allDomains.find(d => d.id === domId);
          if (!targetDomain) return;

          const codeInput = document.getElementById(`new-code-${domId}`);
          const titleInput = document.getElementById(`new-title-${domId}`);
          const catInput = document.getElementById(`new-cat-${domId}`);
          const diffInput = document.getElementById(`new-diff-${domId}`);
          const descInput = document.getElementById(`new-desc-${domId}`);
          const delivInput = document.getElementById(`new-deliv-${domId}`);

          const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
          const title = titleInput ? titleInput.value.trim() : '';
          const description = descInput ? descInput.value.trim() : '';

          if (!code || !title || !description) {
            alert('Please provide at least the Problem Code, Title, and Description.');
            return;
          }

          const rawDeliv = delivInput ? delivInput.value.trim() : '';
          const deliverables = rawDeliv ? rawDeliv.split(',').map(s => s.trim()).filter(Boolean) : [
            'Architecture document and testbench report',
            'Interactive demonstration visualizer'
          ];

          const newPs = {
            id: code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            code: code,
            title: title,
            category: (catInput && catInput.value.trim()) || targetDomain.domainName,
            difficulty: (diffInput && diffInput.value) || 'Advanced',
            description: description,
            deliverables: deliverables
          };

          if (!targetDomain.problemStatements) {
            targetDomain.problemStatements = [];
          }

          targetDomain.problemStatements.push(newPs);

          btn.disabled = true;
          btn.textContent = 'SAVING TO R2...';

          try {
            const res = await fetch('/api/admin/domains', {
              method: 'PUT',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify(targetDomain)
            });
            const data = await res.json();
            if (data.success) {
              const idx = allDomains.findIndex(d => d.id === domId);
              if (idx >= 0) allDomains[idx] = data.domain;
              renderPsManager();
            } else {
              alert('Failed to save statement: ' + (data.error || 'Unknown error'));
              renderPsManager();
            }
          } catch (e) {
            alert('Error saving statement: ' + e.message);
            renderPsManager();
          }
        });
      });

      // Bind Delete Problem Statement Buttons
      psMgrList.querySelectorAll('.btn-del-ps').forEach(btn => {
        btn.addEventListener('click', async () => {
          const domId = btn.getAttribute('data-domain-id');
          const psId = btn.getAttribute('data-ps-id');
          const targetDomain = allDomains.find(d => d.id === domId);
          if (!targetDomain) return;

          const ps = (targetDomain.problemStatements || []).find(p => p.id === psId || p.code === psId);
          const psCode = ps ? ps.code : psId;

          if (confirm(`Are you sure you want to remove problem statement "${psCode}" from ${targetDomain.stoneName}?`)) {
            targetDomain.problemStatements = (targetDomain.problemStatements || []).filter(p => p.id !== psId && p.code !== psId);

            try {
              const res = await fetch('/api/admin/domains', {
                method: 'PUT',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(targetDomain)
              });
              const data = await res.json();
              if (data.success) {
                const idx = allDomains.findIndex(d => d.id === domId);
                if (idx >= 0) allDomains[idx] = data.domain;
                renderPsManager();
              }
            } catch (e) {
              alert('Error removing statement: ' + e.message);
            }
          }
        });
      });

      // Bind Release Toggle switches
      psMgrList.querySelectorAll('.toggle-release-ps').forEach(toggle => {
        toggle.addEventListener('change', async () => {
          const domId = toggle.getAttribute('data-domain-id');
          const isReleased = toggle.checked;

          const targetDomain = allDomains.find(d => d.id === domId);
          if (!targetDomain) return;

          targetDomain.isPsReleased = isReleased;

          try {
            await fetch('/api/admin/domains', {
              method: 'PUT',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify(targetDomain),
            });
            renderPsManager();
          } catch (e) {
            alert('Error updating domain status: ' + e.message);
          }
        });
      });
    }

    // =========================================================================
    // PAYMENT QR CODES MANAGER
    // =========================================================================
    const modalQrMgr = document.getElementById('modal-qr-mgr');
    const btnOpenQrMgr = document.getElementById('btn-open-qr-mgr');
    const btnCloseQrMgr = document.getElementById('btn-close-qr-mgr');
    const previewQr3 = document.getElementById('preview-qr-3');
    const previewQr4 = document.getElementById('preview-qr-4');
    const fileQr3 = document.getElementById('file-qr-3');
    const fileQr4 = document.getElementById('file-qr-4');
    const lblFileQr3 = document.getElementById('lbl-file-qr-3');
    const lblFileQr4 = document.getElementById('lbl-file-qr-4');
    const txtQr3 = document.getElementById('txt-qr-3');
    const txtQr4 = document.getElementById('txt-qr-4');
    const btnSaveQrs = document.getElementById('btn-save-qrs');
    const btnResetQrs = document.getElementById('btn-reset-qrs');
    const qrMgrStatus = document.getElementById('qr-mgr-status');
    const qrLastUpdated = document.getElementById('qr-last-updated');

    let adminPaymentQrs = {
      member3: '/3mem.png',
      member4: '/4mem.png'
    };
    let uploadedQr3Data = null;
    let uploadedQr4Data = null;

    async function loadAdminQrCodes() {
      if (qrMgrStatus) {
        qrMgrStatus.textContent = 'Fetching current payment QR codes...';
        qrMgrStatus.style.color = 'var(--text-muted)';
      }
      try {
        const res = await fetch('/api/admin/payment-qrs', {
          headers: authHeaders()
        });
        let data = null;
        if (res.ok) {
          try {
            data = await res.json();
          } catch (_) {}
        }
        if (!data || !data.success) {
          // Try public fallback
          try {
            const fallbackRes = await fetch('/api/payment-qrs');
            if (fallbackRes.ok) {
              data = await fallbackRes.json();
            }
          } catch (_) {}
        }
        if (!data || !data.paymentQrs) {
          data = {
            success: true,
            paymentQrs: {
              member3: '/3mem.png',
              member4: '/4mem.png'
            }
          };
        }
        if (data && data.paymentQrs) {
          adminPaymentQrs = data.paymentQrs;
          uploadedQr3Data = null;
          uploadedQr4Data = null;

          if (previewQr3) previewQr3.src = adminPaymentQrs.member3 || '/3mem.png';
          if (previewQr4) previewQr4.src = adminPaymentQrs.member4 || '/4mem.png';
          if (txtQr3) txtQr3.value = adminPaymentQrs.member3 || '';
          if (txtQr4) txtQr4.value = adminPaymentQrs.member4 || '';
          if (lblFileQr3) lblFileQr3.textContent = 'Upload 3-Member QR Image';
          if (lblFileQr4) lblFileQr4.textContent = 'Upload 4-Member QR Image';

          if (qrLastUpdated) {
            if (adminPaymentQrs.updatedAt) {
              const dateStr = new Date(adminPaymentQrs.updatedAt).toLocaleString();
              qrLastUpdated.textContent = `✦ ACTIVE CONFIGURATION // Last synchronized: ${dateStr}`;
            } else {
              qrLastUpdated.textContent = '✦ DEFAULT PRE-CONFIGURED PAYMENT QRS ACTIVE';
            }
          }
          if (qrMgrStatus) {
            qrMgrStatus.textContent = 'Payment QR codes loaded.';
            qrMgrStatus.style.color = 'var(--green)';
          }
        }
      } catch (err) {
        if (qrMgrStatus) {
          qrMgrStatus.textContent = 'Error loading QR codes: ' + err.message;
          qrMgrStatus.style.color = 'var(--red)';
        }
      }
    }

    if (btnOpenQrMgr && modalQrMgr) {
      btnOpenQrMgr.addEventListener('click', () => {
        modalQrMgr.classList.add('is-open');
        loadAdminQrCodes();
      });
    }

    if (btnCloseQrMgr && modalQrMgr) {
      btnCloseQrMgr.addEventListener('click', () => {
        modalQrMgr.classList.remove('is-open');
      });
    }

    window.addEventListener('click', (e) => {
      if (modalQrMgr && e.target === modalQrMgr) {
        modalQrMgr.classList.remove('is-open');
      }
    });

    if (fileQr3) {
      fileQr3.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (PNG, JPG, WebP, SVG).');
          return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          uploadedQr3Data = loadEvent.target.result;
          if (previewQr3) previewQr3.src = uploadedQr3Data;
          if (lblFileQr3) lblFileQr3.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
          if (txtQr3) txtQr3.value = `[Uploaded File: ${file.name}]`;
          if (qrMgrStatus) {
            qrMgrStatus.textContent = '3-member QR preview updated. Click "SAVE & DEPLOY" to commit.';
            qrMgrStatus.style.color = 'var(--gold)';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (fileQr4) {
      fileQr4.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (PNG, JPG, WebP, SVG).');
          return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          uploadedQr4Data = loadEvent.target.result;
          if (previewQr4) previewQr4.src = uploadedQr4Data;
          if (lblFileQr4) lblFileQr4.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
          if (txtQr4) txtQr4.value = `[Uploaded File: ${file.name}]`;
          if (qrMgrStatus) {
            qrMgrStatus.textContent = '4-member QR preview updated. Click "SAVE & DEPLOY" to commit.';
            qrMgrStatus.style.color = 'var(--cyan)';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (txtQr3) {
      txtQr3.addEventListener('input', () => {
        const val = txtQr3.value.trim();
        if (val && !val.startsWith('[Uploaded File:')) {
          uploadedQr3Data = null;
          if (previewQr3) previewQr3.src = val;
        }
      });
    }

    if (txtQr4) {
      txtQr4.addEventListener('input', () => {
        const val = txtQr4.value.trim();
        if (val && !val.startsWith('[Uploaded File:')) {
          uploadedQr4Data = null;
          if (previewQr4) previewQr4.src = val;
        }
      });
    }

    if (btnSaveQrs) {
      btnSaveQrs.addEventListener('click', async () => {
        btnSaveQrs.disabled = true;
        const originalText = btnSaveQrs.textContent;
        btnSaveQrs.textContent = 'COMMITTING TO R2...';
        if (qrMgrStatus) {
          qrMgrStatus.textContent = 'Uploading and committing new QR codes to Cloudflare R2...';
          qrMgrStatus.style.color = 'var(--cyan)';
        }

        const target3 = uploadedQr3Data || (txtQr3 && txtQr3.value.trim() && !txtQr3.value.startsWith('[Uploaded File:') ? txtQr3.value.trim() : null) || adminPaymentQrs.member3;
        const target4 = uploadedQr4Data || (txtQr4 && txtQr4.value.trim() && !txtQr4.value.startsWith('[Uploaded File:') ? txtQr4.value.trim() : null) || adminPaymentQrs.member4;

        try {
          const res = await fetch('/api/admin/payment-qrs', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              member3: target3,
              member4: target4
            })
          });
          const data = await res.json();
          if (data.success && data.paymentQrs) {
            adminPaymentQrs = data.paymentQrs;
            uploadedQr3Data = null;
            uploadedQr4Data = null;
            if (fileQr3) fileQr3.value = '';
            if (fileQr4) fileQr4.value = '';
            if (previewQr3) previewQr3.src = adminPaymentQrs.member3;
            if (previewQr4) previewQr4.src = adminPaymentQrs.member4;
            if (txtQr3) txtQr3.value = adminPaymentQrs.member3;
            if (txtQr4) txtQr4.value = adminPaymentQrs.member4;
            if (lblFileQr3) lblFileQr3.textContent = 'Upload 3-Member QR Image';
            if (lblFileQr4) lblFileQr4.textContent = 'Upload 4-Member QR Image';

            if (qrLastUpdated && adminPaymentQrs.updatedAt) {
              qrLastUpdated.textContent = `✦ ACTIVE CONFIGURATION // Last synchronized: ${new Date(adminPaymentQrs.updatedAt).toLocaleString()}`;
            }

            if (qrMgrStatus) {
              qrMgrStatus.textContent = '✓ Payment QR codes updated and deployed to Cloudflare R2 successfully!';
              qrMgrStatus.style.color = 'var(--green)';
            }
            showAdminToast('✓ Payment QR codes updated and deployed to Cloudflare R2!');
          } else {
            throw new Error(data.error || 'Failed to update payment QR codes.');
          }
        } catch (err) {
          if (qrMgrStatus) {
            qrMgrStatus.textContent = '✕ Error saving QRs: ' + err.message;
            qrMgrStatus.style.color = 'var(--red)';
          }
        } finally {
          btnSaveQrs.disabled = false;
          btnSaveQrs.textContent = originalText;
        }
      });
    }

    if (btnResetQrs) {
      btnResetQrs.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to restore both payment QR codes back to defaults (/3mem.png and /4mem.png)?')) {
          return;
        }

        btnResetQrs.disabled = true;
        if (qrMgrStatus) {
          qrMgrStatus.textContent = 'Resetting to default QR codes...';
          qrMgrStatus.style.color = 'var(--gold)';
        }

        try {
          const res = await fetch('/api/admin/payment-qrs/reset', {
            method: 'POST',
            headers: authHeaders()
          });
          const data = await res.json();
          if (data.success && data.paymentQrs) {
            adminPaymentQrs = data.paymentQrs;
            uploadedQr3Data = null;
            uploadedQr4Data = null;
            if (fileQr3) fileQr3.value = '';
            if (fileQr4) fileQr4.value = '';
            if (previewQr3) previewQr3.src = '/3mem.png';
            if (previewQr4) previewQr4.src = '/4mem.png';
            if (txtQr3) txtQr3.value = '/3mem.png';
            if (txtQr4) txtQr4.value = '/4mem.png';
            if (lblFileQr3) lblFileQr3.textContent = 'Upload 3-Member QR Image';
            if (lblFileQr4) lblFileQr4.textContent = 'Upload 4-Member QR Image';

            if (qrLastUpdated) {
              qrLastUpdated.textContent = '✦ DEFAULT PRE-CONFIGURED PAYMENT QRS ACTIVE';
            }

            if (qrMgrStatus) {
              qrMgrStatus.textContent = '✓ Restored default payment QR codes.';
              qrMgrStatus.style.color = 'var(--green)';
            }
            showAdminToast('✓ Payment QR codes restored to defaults.');
          }
        } catch (err) {
          if (qrMgrStatus) {
            qrMgrStatus.textContent = '✕ Reset failed: ' + err.message;
            qrMgrStatus.style.color = 'var(--red)';
          }
        } finally {
          btnResetQrs.disabled = false;
        }
      });
    }

    // =========================================================================
    // STONE AREAS & LAB ALLOCATION MANAGER
    // =========================================================================
    function renderStoneAreas() {
      if (!stoneAreasGrid) return;

      let html = '';
      allDomains.forEach(dom => {
        const accent = dom.accentHex || '#ffd000';
        const normId = normalizeDomainId(dom.id);
        const squadCount = allTeams.filter(t => normalizeDomainId(t.preferredDomain) === normId).length;
        const currentRoom = dom.roomAllocated || 'Lab Block 3 (CS-301)';

        html += `
          <div class="field-card" style="border-top: 3px solid ${accent}; margin: 0; background: rgba(255,255,255,0.02); padding: 16px; border-radius: 10px; border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; gap:8px;">
              <div>
                <div style="font-family:'Syne',sans-serif; font-weight:800; font-size:1.05rem; color:#fff; display:flex; align-items:center; gap:8px;">
                  <span>${escapeHTML(dom.stoneName.toUpperCase())}</span>
                  <span style="font-family:'JetBrains Mono'; font-size:0.7rem; color:${accent}; font-weight:700;">// ${escapeHTML(dom.domainName)}</span>
                </div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${escapeHTML(dom.tagline || '')}</div>
              </div>
              <span style="font-family:'JetBrains Mono'; font-size:0.68rem; font-weight:700; padding:3px 8px; border-radius:4px; background:${accent}18; color:${accent}; border:1px solid ${accent}40; white-space:nowrap;">
                ${squadCount} SQUADS
              </span>
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size:0.68rem; color:#aaa; margin-bottom:5px;">CAMPUS LAB / VENUE ALLOCATION</label>
              <input type="text" class="form-input txt-stone-area font-mono" data-domain-id="${escapeHTML(dom.id)}" value="${escapeHTML(currentRoom)}" placeholder="e.g. Lab Block 3 (CS-301)" style="padding:8px 10px; font-size:0.8rem; border-color:${accent}40;">
            </div>
          </div>
        `;
      });

      stoneAreasGrid.innerHTML = html;
      if (stoneAreasStatus) {
        stoneAreasStatus.textContent = `✦ Active configurations loaded for 6 Infinity Stones (${allTeams.length} total squads registered).`;
        stoneAreasStatus.style.color = 'var(--cyan)';
      }
    }

    if (btnOpenStoneAreas && modalStoneAreas) {
      btnOpenStoneAreas.addEventListener('click', () => {
        renderStoneAreas();
        modalStoneAreas.classList.add('is-open');
      });
    }

    if (btnCloseStoneAreas && modalStoneAreas) {
      btnCloseStoneAreas.addEventListener('click', () => {
        modalStoneAreas.classList.remove('is-open');
      });
    }

    if (btnCancelStoneAreas && modalStoneAreas) {
      btnCancelStoneAreas.addEventListener('click', () => {
        modalStoneAreas.classList.remove('is-open');
      });
    }

    window.addEventListener('click', (e) => {
      if (modalStoneAreas && e.target === modalStoneAreas) {
        modalStoneAreas.classList.remove('is-open');
      }
    });

    if (btnSaveStoneAreas && modalStoneAreas) {
      btnSaveStoneAreas.addEventListener('click', async () => {
        btnSaveStoneAreas.disabled = true;
        const oldText = btnSaveStoneAreas.textContent;
        btnSaveStoneAreas.textContent = 'PROPAGATING VENUES...';
        if (stoneAreasStatus) {
          stoneAreasStatus.textContent = 'Synchronizing stone venue allocations to Cloudflare R2 and squad databases...';
          stoneAreasStatus.style.color = 'var(--gold)';
        }

        const stoneAreas = {};
        modalStoneAreas.querySelectorAll('.txt-stone-area').forEach(input => {
          const domId = input.getAttribute('data-domain-id');
          stoneAreas[domId] = input.value.trim();
        });

        const syncTeams = chkSyncExistingTeams ? chkSyncExistingTeams.checked : true;

        try {
          const res = await fetch('/api/admin/stone-areas', {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ stoneAreas, syncExistingTeams: syncTeams })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to update stone areas.');
          }

          // Update in-memory allDomains
          if (Array.isArray(data.domains)) {
            allDomains = data.domains;
          } else {
            Object.entries(stoneAreas).forEach(([k, val]) => {
              const dom = allDomains.find(d => d.id === k);
              if (dom) dom.roomAllocated = val;
            });
          }

          // Update in-memory allTeams if synchronized
          if (syncTeams) {
            allTeams.forEach(t => {
              const normId = normalizeDomainId(t.preferredDomain);
              if (stoneAreas[normId]) {
                t.roomAllocated = stoneAreas[normId];
              }
            });
            renderTable();
          }

          if (stoneAreasStatus) {
            stoneAreasStatus.textContent = `✓ Successfully updated stone areas! Synchronized to ${data.updatedTeamsCount || 0} squads.`;
            stoneAreasStatus.style.color = 'var(--green)';
          }
        } catch (err) {
          if (stoneAreasStatus) {
            stoneAreasStatus.textContent = `✕ Error updating stone areas: ${err.message}`;
            stoneAreasStatus.style.color = 'var(--red)';
          }
          alert('Error updating stone areas: ' + err.message);
        } finally {
          btnSaveStoneAreas.disabled = false;
          btnSaveStoneAreas.textContent = oldText;
        }
      });
    }

    // ==========================================
    // REGISTRATION STATUS TOGGLE
    // ==========================================
    function updateRegistrationUI(isOpen) {
      registrationOpen = Boolean(isOpen);
      if (!btnToggleReg) return;
      if (registrationOpen) {
        btnToggleReg.classList.remove('closed');
        btnToggleReg.classList.add('open');
        if (regStatusIcon) regStatusIcon.textContent = '🟢';
        if (regStatusText) regStatusText.textContent = 'REGISTRATION: OPEN';
        btnToggleReg.title = 'Public registrations are currently OPEN. Click to CLOSE.';
      } else {
        btnToggleReg.classList.remove('open');
        btnToggleReg.classList.add('closed');
        if (regStatusIcon) regStatusIcon.textContent = '🔴';
        if (regStatusText) regStatusText.textContent = 'REGISTRATION: CLOSED';
        btnToggleReg.title = 'Public registrations are currently CLOSED. Click to OPEN.';
      }
    }

    if (btnToggleReg) {
      btnToggleReg.addEventListener('click', async () => {
        const targetState = !registrationOpen;
        const promptMsg = targetState
          ? 'Are you sure you want to OPEN public registrations?'
          : 'Are you sure you want to CLOSE public registrations? No new squads will be able to register.';
        if (!confirm(promptMsg)) return;

        try {
          btnToggleReg.style.opacity = '0.6';
          const res = await fetch('/api/admin/toggle-registration', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ registrationOpen: targetState })
          });
          const data = await res.json();
          btnToggleReg.style.opacity = '1';
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to update registration status.');
          }
          updateRegistrationUI(data.registrationOpen);
          showAdminToast(data.message || (data.registrationOpen ? 'Registrations are now OPEN.' : 'Registrations are now CLOSED.'));
        } catch (err) {
          btnToggleReg.style.opacity = '1';
          alert('Error: ' + err.message);
        }
      });
    }

    // ==========================================
    // DANGER ZONE: PURGE ALL SQUADS MODAL
    // ==========================================
    const modalPurge = document.getElementById('modal-purge');
    const btnOpenPurge = document.getElementById('btn-open-purge');
    const btnClosePurge = document.getElementById('btn-close-purge');
    const btnCancelPurge = document.getElementById('btn-cancel-purge');
    const txtPurgeConfirm = document.getElementById('txt-purge-confirm');
    const btnConfirmPurge = document.getElementById('btn-confirm-purge');
    const purgeStatus = document.getElementById('purge-status');

    if (btnOpenPurge && modalPurge) {
      btnOpenPurge.addEventListener('click', () => {
        if (txtPurgeConfirm) txtPurgeConfirm.value = '';
        if (btnConfirmPurge) {
          btnConfirmPurge.disabled = true;
          btnConfirmPurge.style.opacity = '0.5';
          btnConfirmPurge.style.cursor = 'not-allowed';
        }
        if (purgeStatus) purgeStatus.style.display = 'none';
        modalPurge.classList.add('is-open');
        setTimeout(() => {
          if (txtPurgeConfirm) txtPurgeConfirm.focus();
        }, 100);
      });

      const closePurgeModal = () => modalPurge.classList.remove('is-open');
      if (btnClosePurge) btnClosePurge.addEventListener('click', closePurgeModal);
      if (btnCancelPurge) btnCancelPurge.addEventListener('click', closePurgeModal);
      modalPurge.addEventListener('click', (e) => {
        if (e.target === modalPurge) closePurgeModal();
      });

      if (txtPurgeConfirm) {
        txtPurgeConfirm.addEventListener('input', () => {
          const isValid = txtPurgeConfirm.value.trim().toUpperCase() === 'ERASE';
          if (btnConfirmPurge) {
            btnConfirmPurge.disabled = !isValid;
            btnConfirmPurge.style.opacity = isValid ? '1' : '0.5';
            btnConfirmPurge.style.cursor = isValid ? 'pointer' : 'not-allowed';
          }
        });

        txtPurgeConfirm.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && btnConfirmPurge && !btnConfirmPurge.disabled) {
            e.preventDefault();
            btnConfirmPurge.click();
          }
        });
      }

      if (btnConfirmPurge) {
        btnConfirmPurge.addEventListener('click', async () => {
          if (!txtPurgeConfirm || txtPurgeConfirm.value.trim().toUpperCase() !== 'ERASE') return;
          btnConfirmPurge.disabled = true;
          btnConfirmPurge.textContent = 'ERASING ALL DATA...';
          if (purgeStatus) {
            purgeStatus.style.display = 'block';
            purgeStatus.style.color = 'var(--gold)';
            purgeStatus.textContent = 'Purging squad database on Cloudflare R2...';
          }

          try {
            const res = await fetch('/api/admin/purge-data', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ confirm: 'ERASE' })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to purge data.');
            }

            allTeams = [];
            renderTable();
            updateKPIs();
            closePurgeModal();
            alert(`✓ Purge complete! ${data.purgedCount} squad(s) have been permanently deleted from the database.`);
          } catch (err) {
            if (purgeStatus) {
              purgeStatus.style.display = 'block';
              purgeStatus.style.color = 'var(--red)';
              purgeStatus.textContent = `Error: ${err.message}`;
            }
            alert(`Error purging data: ${err.message}`);
          } finally {
            btnConfirmPurge.disabled = false;
            btnConfirmPurge.textContent = '🗑️ PERMANENTLY ERASE ALL DATA';
          }
        });
      }
    }