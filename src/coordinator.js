let allTeams = [];
    let activeFilter = 'all';
    let searchQuery = '';

    const secLogin = document.getElementById('sec-login');
    const secDash = document.getElementById('sec-dashboard');
    const formLogin = document.getElementById('form-coord-login');
    const loginErr = document.getElementById('login-err');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    function escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function getAuthToken() {
      try {
        const raw = sessionStorage.getItem('infinity_coord_auth');
        if (!raw) return '';
        const parsed = JSON.parse(raw);
        return parsed.token || (typeof parsed === 'string' ? parsed : '');
      } catch (e) {
        return '';
      }
    }

    function authHeaders(extra = {}) {
      const token = getAuthToken();
      return {
        ...extra,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
    }

    btnRefresh.addEventListener('click', async () => {
      btnRefresh.classList.add('spinning');
      try {
        if (secDash.style.display !== 'none') {
          await loadTeams();
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Coordinator refresh failed:', err);
      } finally {
        setTimeout(() => {
          btnRefresh.classList.remove('spinning');
        }, 500);
      }
    });

    const tbody = document.getElementById('teams-tbody');
    const searchInput = document.getElementById('search-teams');

    async function doCoordLogin(password, isSilent = false) {
      if (!isSilent) loginErr.style.display = 'none';

      try {
        const res = await fetch('/api/coordinator/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid coordinator passphrase.');
        }

        // Store ONLY the signed bearer token, never the plaintext password
        sessionStorage.setItem('infinity_coord_auth', JSON.stringify({ token: data.token }));
        secLogin.style.display = 'none';
        secDash.style.display = 'block';
        btnLogout.style.display = 'inline-block';

        await loadTeams();
        return true;
      } catch (err) {
        if (!isSilent) {
          loginErr.textContent = err.message;
          loginErr.style.display = 'block';
        } else {
          sessionStorage.removeItem('infinity_coord_auth');
        }
        return false;
      }
    }

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('txt-passcode').value;
      await doCoordLogin(password, false);
    });

    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('infinity_coord_auth');
      secDash.style.display = 'none';
      secLogin.style.display = 'block';
      btnLogout.style.display = 'none';
    });

    // Auto-restore coordinator session if browser is refreshed (F5 / reload)
    const savedCoord = sessionStorage.getItem('infinity_coord_auth');
    if (savedCoord) {
      try {
        const creds = JSON.parse(savedCoord);
        if (creds.token) {
          secLogin.style.display = 'none';
          secDash.style.display = 'block';
          btnLogout.style.display = 'inline-block';
          loadTeams();
        } else if (creds.password) {
          doCoordLogin(creds.password, true);
        }
      } catch (e) { }
    }

    async function loadTeams() {
      try {
        const res = await fetch('/api/coordinator/teams', {
          headers: authHeaders()
        });
        if (res.status === 401) {
          sessionStorage.removeItem('infinity_coord_auth');
          secDash.style.display = 'none';
          secLogin.style.display = 'block';
          btnLogout.style.display = 'none';
          loginErr.textContent = 'Coordinator session expired. Please enter passphrase.';
          loginErr.style.display = 'block';
          return;
        }
        const data = await res.json();
        allTeams = data.teams || [];
        renderTable();
        updateKPIs();
      } catch (e) {
        console.error('Error fetching coordinator teams:', e);
      }
    }

    function updateKPIs() {
      document.getElementById('kpi-total-teams').textContent = allTeams.length;

      let r1Count = 0;
      let r2Count = 0;
      let totalMeals = 0;

      allTeams.forEach(t => {
        if (t.reviews?.r1?.attended) r1Count++;
        if (t.reviews?.r2?.attended) r2Count++;
        const food = t.food || {};
        if (food.highTea?.collected) totalMeals++;
        if (food.dinner?.collected) totalMeals++;
        if (food.midnightFuel?.collected) totalMeals++;
        if (food.breakfast?.collected) totalMeals++;
        if (food.lunch?.collected) totalMeals++;
      });

      document.getElementById('kpi-r1-attended').textContent = r1Count;
      document.getElementById('kpi-r2-attended').textContent = r2Count;
      document.getElementById('kpi-meals-served').textContent = totalMeals;
    }

    function renderTable() {
      const q = searchQuery.toLowerCase();
      const filtered = allTeams.filter(t => {
        const matchDomain = activeFilter === 'all' || (t.preferredDomain && t.preferredDomain.toLowerCase() === activeFilter);
        const matchSearch = !q ||
          (t.teamName && t.teamName.toLowerCase().includes(q)) ||
          (t.id && t.id.toLowerCase().includes(q)) ||
          (t.college && t.college.toLowerCase().includes(q)) ||
          (t.leader?.email && t.leader.email.toLowerCase().includes(q));
        return matchDomain && matchSearch;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">No teams found matching filter criteria.</td></tr>`;
        return;
      }

      let html = '';
      filtered.forEach(t => {
        const food = t.food || {};
        const rev = t.reviews || {};

        html += `
          <tr data-team-id="${escapeHTML(t.id)}">
            <td>
              <div class="team-cell-title">${escapeHTML(t.teamName)} <span class="font-mono" style="color:var(--cyan); font-size:0.7rem;">(${escapeHTML(t.id)})</span></div>
              <div class="team-cell-sub">${escapeHTML(t.college)} • Leader: ${escapeHTML(t.leader?.name || 'N/A')} (${escapeHTML(t.leader?.phone || '')})</div>
            </td>
            <td>
              <span class="portal-badge">${escapeHTML((t.preferredDomain || 'MIND').toUpperCase())}</span>
              <div class="team-cell-sub">${escapeHTML(t.roomAllocated || 'Lab Block 3')}</div>
            </td>
            <td>
              <div class="chip-group">
                <label class="check-chip ${food.highTea?.collected ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="food" data-key="highTea" ${food.highTea?.collected ? 'checked' : ''}>
                  High Tea
                </label>
                <label class="check-chip ${food.dinner?.collected ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="food" data-key="dinner" ${food.dinner?.collected ? 'checked' : ''}>
                  Dinner
                </label>
                <label class="check-chip ${food.midnightFuel?.collected ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="food" data-key="midnightFuel" ${food.midnightFuel?.collected ? 'checked' : ''}>
                  Midnight
                </label>
                <label class="check-chip ${food.breakfast?.collected ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="food" data-key="breakfast" ${food.breakfast?.collected ? 'checked' : ''}>
                  Breakfast
                </label>
                <label class="check-chip ${food.lunch?.collected ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="food" data-key="lunch" ${food.lunch?.collected ? 'checked' : ''}>
                  Lunch
                </label>
              </div>
            </td>
            <td>
              <div class="chip-group">
                <label class="check-chip ${rev.r1?.attended ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="review" data-key="r1" ${rev.r1?.attended ? 'checked' : ''}>
                  R1: Idea
                </label>
                <label class="check-chip ${rev.r2?.attended ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="review" data-key="r2" ${rev.r2?.attended ? 'checked' : ''}>
                  R2: Logic
                </label>
                <label class="check-chip ${rev.r3?.attended ? 'checked' : ''}">
                  <input type="checkbox" data-team="${escapeHTML(t.id)}" data-type="review" data-key="r3" ${rev.r3?.attended ? 'checked' : ''}>
                  R3: Pitch
                </label>
              </div>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;

      // Bind dynamic chip clicks
      tbody.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', async (e) => {
          const teamId = input.getAttribute('data-team');
          const type = input.getAttribute('data-type');
          const key = input.getAttribute('data-key');
          const value = input.checked;

          const label = input.closest('.check-chip');
          label.classList.toggle('checked', value);

          try {
            const res = await fetch('/api/coordinator/mark', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ teamId, type, key, value }),
            });
            if (res.status === 401) {
              alert('Coordinator session expired. Please log in again.');
              window.location.reload();
              return;
            }
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to update status.');
            }
            // Update local state
            const target = allTeams.find(t => t.id === teamId);
            if (target) {
              if (type === 'food') {
                if (!target.food) target.food = {};
                target.food[key] = { collected: value };
              } else if (type === 'review') {
                if (!target.reviews) target.reviews = {};
                target.reviews[key] = { attended: value };
              }
            }
            updateKPIs();
          } catch (err) {
            console.error('Error saving checkmark:', err);
            input.checked = !value;
            label.classList.toggle('checked', !value);
            alert(err.message || 'Error updating status');
          }
        });
      });
    }

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTable();
    });

    document.querySelectorAll('#domain-filters .f-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#domain-filters .f-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-domain');
        renderTable();
      });
    });