let allTeams = [];
    let activeFilter = 'all';
    let activeMealFilter = 'all';
    let searchQuery = '';

    const MEALS = [
      { key: 'dinner', name: 'Dinner' },
      { key: 'breakfast', name: 'Breakfast' },
      { key: 'lunch', name: 'Lunch' },
    ];

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

    function getShortMemberName(fullName, fallback) {
      if (!fullName || typeof fullName !== 'string') return fallback;
      const clean = fullName.trim();
      if (!clean) return fallback;
      const first = clean.split(' ')[0];
      return first.length > 8 ? first.slice(0, 7) + '…' : first;
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
        const teamSize = t.teamSize || (t.members ? t.members.length + 1 : 4);
        MEALS.forEach(m => {
          const f = food[m.key];
          if (f?.count !== undefined) {
            totalMeals += f.count;
          } else if (f?.collected) {
            totalMeals += teamSize;
          }
        });
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
        const teamSize = t.teamSize || (t.members ? t.members.length + 1 : 4);

        // Build member list: Leader (M1) + Squad Members (M2, M3, M4)
        const squadMembers = [
          {
            role: 'L',
            fullName: t.leader?.name || 'Leader',
            shortName: getShortMemberName(t.leader?.name, 'Leader')
          }
        ];
        const rawMembers = Array.isArray(t.members) ? t.members : [];
        for (let i = 1; i < teamSize; i++) {
          const m = rawMembers[i - 1] || {};
          const fallbackRole = `M${i + 1}`;
          squadMembers.push({
            role: fallbackRole,
            fullName: m.name || fallbackRole,
            shortName: getShortMemberName(m.name, fallbackRole)
          });
        }

        // Render Food Meals List
        let mealsHtml = '<div class="food-meals-list">';
        const visibleMeals = activeMealFilter === 'all'
          ? MEALS
          : MEALS.filter(m => m.key === activeMealFilter);

        visibleMeals.forEach(mObj => {
          const fEntry = food[mObj.key] || {};
          let memberStates = [];
          if (Array.isArray(fEntry.members)) {
            memberStates = fEntry.members;
          } else if (fEntry.collected) {
            memberStates = Array(teamSize).fill(true);
          } else {
            memberStates = Array(teamSize).fill(false);
          }

          while (memberStates.length < teamSize) memberStates.push(false);

          const checkedCount = memberStates.slice(0, teamSize).filter(Boolean).length;
          const isAll = checkedCount === teamSize;
          const hasSome = checkedCount > 0 && !isAll;
          const badgeClass = isAll ? 'all-done' : (hasSome ? 'has-some' : '');

          let chipsHtml = '';
          squadMembers.forEach((mem, mIdx) => {
            const isChecked = Boolean(memberStates[mIdx]);
            chipsHtml += `
              <button type="button" class="member-food-chip ${isChecked ? 'checked' : ''}"
                data-team="${escapeHTML(t.id)}"
                data-meal="${mObj.key}"
                data-member="${mIdx}"
                title="${escapeHTML(mem.role)}: ${escapeHTML(mem.fullName)} (Click to toggle)">
                ${isChecked ? '✓ ' : ''}${escapeHTML(mem.role)}
              </button>
            `;
          });

          mealsHtml += `
            <div class="meal-check-group ${isAll ? 'all-served' : ''}">
              <div class="meal-header">
                <span class="meal-name">${escapeHTML(mObj.name)}</span>
                <button type="button" class="btn-meal-all"
                  data-team="${escapeHTML(t.id)}"
                  data-meal="${mObj.key}"
                  data-action="${isAll ? 'unmark-all' : 'mark-all'}"
                  title="Click to ${isAll ? 'unmark' : 'mark'} all ${teamSize} members">
                  <span class="meal-count-badge ${badgeClass}">${checkedCount}/${teamSize}</span>
                </button>
              </div>
              <div class="meal-members-chips">
                ${chipsHtml}
              </div>
            </div>
          `;
        });
        mealsHtml += '</div>';

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
              ${mealsHtml}
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

      // 1. Bind Individual Member Food Chips
      tbody.querySelectorAll('.member-food-chip').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const teamId = btn.getAttribute('data-team');
          const mealKey = btn.getAttribute('data-meal');
          const memberIdx = parseInt(btn.getAttribute('data-member'), 10);
          const isCurrentlyChecked = btn.classList.contains('checked');
          const newValue = !isCurrentlyChecked;

          btn.disabled = true;
          try {
            const res = await fetch('/api/coordinator/mark', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({
                teamId,
                type: 'food',
                key: mealKey,
                memberIndex: memberIdx,
                value: newValue,
              }),
            });

            if (res.status === 401) {
              alert('Coordinator session expired. Please log in again.');
              window.location.reload();
              return;
            }

            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to update member food status.');
            }

            const target = allTeams.find(t => t.id === teamId);
            if (target && data.team) {
              Object.assign(target, data.team);
            }
            renderTable();
            updateKPIs();
          } catch (err) {
            console.error('Error saving member food checkmark:', err);
            alert(err.message || 'Error updating status');
            btn.disabled = false;
          }
        });
      });

      // 2. Bind Meal Mark All / Unmark All Badges
      tbody.querySelectorAll('.btn-meal-all').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const teamId = btn.getAttribute('data-team');
          const mealKey = btn.getAttribute('data-meal');
          const action = btn.getAttribute('data-action');
          const newValue = action === 'mark-all';

          btn.disabled = true;
          try {
            const res = await fetch('/api/coordinator/mark', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({
                teamId,
                type: 'food',
                key: mealKey,
                value: newValue,
              }),
            });

            if (res.status === 401) {
              alert('Coordinator session expired. Please log in again.');
              window.location.reload();
              return;
            }

            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to update squad food status.');
            }

            const target = allTeams.find(t => t.id === teamId);
            if (target && data.team) {
              Object.assign(target, data.team);
            }
            renderTable();
            updateKPIs();
          } catch (err) {
            console.error('Error updating all food checkmarks:', err);
            alert(err.message || 'Error updating status');
            btn.disabled = false;
          }
        });
      });

      // 3. Bind Review Checkboxes
      tbody.querySelectorAll('input[data-type="review"]').forEach(input => {
        input.addEventListener('change', async () => {
          const teamId = input.getAttribute('data-team');
          const key = input.getAttribute('data-key');
          const value = input.checked;

          const label = input.closest('.check-chip');
          label.classList.toggle('checked', value);

          try {
            const res = await fetch('/api/coordinator/mark', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ teamId, type: 'review', key, value }),
            });
            if (res.status === 401) {
              alert('Coordinator session expired. Please log in again.');
              window.location.reload();
              return;
            }
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to update review status.');
            }
            const target = allTeams.find(t => t.id === teamId);
            if (target) {
              if (!target.reviews) target.reviews = {};
              target.reviews[key] = { attended: value };
            }
            updateKPIs();
          } catch (err) {
            console.error('Error saving review checkmark:', err);
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

    document.querySelectorAll('#meal-filters .f-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#meal-filters .f-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeMealFilter = btn.getAttribute('data-meal');
        renderTable();
      });
    });