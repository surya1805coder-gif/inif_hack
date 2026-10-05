let currentTeam = null;
    let currentDomain = null;
    let currentToken = '';

    function escapeHTML(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    const secLogin = document.getElementById('sec-login');
    const secDash = document.getElementById('sec-dashboard');
    const formLogin = document.getElementById('form-leader-login');
    const loginErr = document.getElementById('login-err');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    function getSavedToken() {
      try {
        // Purge legacy storage to ensure no plaintext passwords linger in localStorage
        localStorage.removeItem('infinity_leader_auth');
        const raw = sessionStorage.getItem('infinity_leader_auth');
        if (!raw) return '';
        const parsed = JSON.parse(raw);
        return parsed.token || (typeof parsed === 'string' ? parsed : '');
      } catch (e) {
        return '';
      }
    }

    async function restoreLeaderSession() {
      const token = getSavedToken();
      if (!token) {
        secLogin.style.display = 'block';
        return;
      }

      try {
        const res = await fetch('/api/teams/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          sessionStorage.removeItem('infinity_leader_auth');
          secLogin.style.display = 'block';
          return;
        }

        currentToken = token;
        currentTeam = data.team;
        currentDomain = data.domainInfo;
        renderDashboard();
      } catch (err) {
        console.error('Session restore failed:', err);
        secLogin.style.display = 'block';
      }
    }

    async function doLeaderLogin(email, password, isSilent = false) {
      if (!isSilent) loginErr.style.display = 'none';

      try {
        const res = await fetch('/api/teams/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Authentication failed.');
        }

        currentToken = data.token;
        currentTeam = data.team;
        currentDomain = data.domainInfo;

        try {
          // Never persist plaintext password in storage; store only cryptographically signed session token
          sessionStorage.setItem('infinity_leader_auth', JSON.stringify({ token: data.token }));
          localStorage.removeItem('infinity_leader_auth');
        } catch (e) { }

        renderDashboard();
        return true;
      } catch (err) {
        if (!isSilent) {
          loginErr.textContent = err.message;
          loginErr.style.display = 'block';
        } else {
          try {
            sessionStorage.removeItem('infinity_leader_auth');
            localStorage.removeItem('infinity_leader_auth');
          } catch (e) { }
        }
        return false;
      }
    }

    btnRefresh.addEventListener('click', async () => {
      btnRefresh.classList.add('spinning');
      try {
        const token = currentToken || getSavedToken();
        if (token) {
          const res = await fetch('/api/teams/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            currentToken = token;
            currentTeam = data.team;
            currentDomain = data.domainInfo;
            renderDashboard();
          } else {
            sessionStorage.removeItem('infinity_leader_auth');
            window.location.reload();
          }
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Leader portal refresh failed:', err);
      } finally {
        setTimeout(() => {
          btnRefresh.classList.remove('spinning');
        }, 500);
      }
    });

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('txt-email').value.trim();
      const password = document.getElementById('txt-password').value;
      await doLeaderLogin(email, password, false);
    });

    btnLogout.addEventListener('click', () => {
      try {
        sessionStorage.removeItem('infinity_leader_auth');
        localStorage.removeItem('infinity_leader_auth');
      } catch (e) { }
      currentTeam = null;
      currentDomain = null;
      currentToken = '';
      secDash.style.display = 'none';
      secLogin.style.display = 'block';
      btnLogout.style.display = 'none';
    });

    // Auto-restore leader session if browser is refreshed (F5 / reload)
    restoreLeaderSession();

    function renderDashboard() {
      secLogin.style.display = 'none';
      secDash.style.display = 'block';
      btnLogout.style.display = 'inline-block';

      // Meta Header
      document.getElementById('dash-team-id').textContent = currentTeam.id;
      document.getElementById('dash-team-name').textContent = currentTeam.teamName;
      document.getElementById('dash-college').textContent = currentTeam.college;
      document.getElementById('dash-team-size').textContent = `${currentTeam.teamSize} Members`;
      document.getElementById('dash-room').textContent = currentTeam.roomAllocated || 'Lab Block 3';

      const domainName = (currentTeam.preferredDomain || 'mind').toUpperCase();
      document.getElementById('dash-domain-tag').textContent = `${domainName} STONE // ${currentDomain?.domainName || ''}`;

      // Payment Status
      const payBadge = document.getElementById('dash-payment-badge');
      if (currentTeam.payment?.status === 'verified') {
        payBadge.innerHTML = `<div class="status-badge status-verified">✓ PAYMENT VERIFIED (UTR: ${escapeHTML(currentTeam.payment.utr || 'N/A')})</div>`;
      } else {
        payBadge.innerHTML = `<div class="status-badge status-pending">⏳ PAYMENT UNDER VERIFICATION (UTR: ${escapeHTML(currentTeam.payment?.utr || 'N/A')})</div>`;
      }

      // Review Statuses
      updateStatusBadge('status-r1', currentTeam.reviews?.r1?.attended);
      updateStatusBadge('status-r2', currentTeam.reviews?.r2?.attended);
      updateStatusBadge('status-r3', currentTeam.reviews?.r3?.attended);
      updateStatusBadge('status-r4', currentTeam.reviews?.r4?.attended || currentTeam.isTop6);

      // Food Statuses
      updateStatusBadge('food-dinner', currentTeam.food?.dinner?.collected);
      updateStatusBadge('food-breakfast', currentTeam.food?.breakfast?.collected);
      updateStatusBadge('food-lunch', currentTeam.food?.lunch?.collected);

      // Members Roster
      const rosterList = document.getElementById('roster-list');
      rosterList.innerHTML = `
        <div class="member-row">
          <div>
            <strong>${escapeHTML(currentTeam.leader?.name || 'Leader')}</strong>
            <div style="font-size:0.7rem; color:#999;">${escapeHTML(currentTeam.leader?.email || '')} • ${escapeHTML(currentTeam.leader?.phone || '')}</div>
          </div>
          <span class="m-role">TEAM LEADER</span>
        </div>
      `;
      (currentTeam.members || []).forEach((m, idx) => {
        rosterList.innerHTML += `
          <div class="member-row">
            <div>
              <strong>${escapeHTML(m.name || 'Member ' + (idx + 2))}</strong>
              <div style="font-size:0.7rem; color:#999;">${escapeHTML(m.email || '')} • ${escapeHTML(m.phone || '')}</div>
            </div>
            <span class="m-role">MEMBER 0${idx + 2}</span>
          </div>
        `;
      });

      // Problem Statements
      renderProblemStatements();
    }

    function updateStatusBadge(elemId, isDone) {
      const el = document.getElementById(elemId);
      if (!el) return;
      if (isDone) {
        el.className = 'badge-check badge-done';
        el.textContent = 'RECEIVED / ATTENDED';
      } else {
        el.className = 'badge-check badge-wait';
        el.textContent = 'PENDING';
      }
    }

    function renderProblemStatements() {
      const psContainer = document.getElementById('ps-container');
      const psStatusPill = document.getElementById('ps-status-pill');

      // Check if problem statements are unlocked by organizers
      const isReleased = currentDomain?.isPsReleased;

      if (!isReleased) {
        psStatusPill.textContent = 'RELEASE STATUS: LOCKED';
        psStatusPill.style.color = '#ffd000';
        psContainer.innerHTML = `
          <div class="ps-locked-box">
            <div class="lock-icon">🔒</div>
            <h4 class="lock-title">PROBLEM STATEMENTS LOCKED</h4>
            <p class="lock-sub">
              Classified problem statements for the <strong>${escapeHTML(currentDomain?.domainName || '')}</strong> domain will be unlocked by the organizer command post 1 to 2 days prior to hackathon kickoff.
            </p>
          </div>
        `;
        return;
      }

      psStatusPill.textContent = 'RELEASE STATUS: UNLOCKED';
      psStatusPill.style.color = '#00ff88';

      const statements = currentDomain.problemStatements || [];
      if (statements.length === 0) {
        psContainer.innerHTML = `<p style="color:#aaa; font-size:0.85rem;">No problem statements uploaded yet for this domain.</p>`;
        return;
      }

      let html = '';
      statements.forEach(ps => {
        const isSelected = currentTeam.selectedProblemStatement?.id === ps.id;
        html += `
          <div class="ps-card ${isSelected ? 'selected' : ''}">
            <div class="ps-meta-row">
              <span class="ps-code">${escapeHTML(ps.code)}</span>
              <span class="ps-diff">${escapeHTML(ps.difficulty)}</span>
            </div>
            <h4 class="ps-title">${escapeHTML(ps.title)}</h4>
            <p class="ps-desc">${escapeHTML(ps.description)}</p>
            <button class="btn-select-ps ${isSelected ? 'active' : ''}" data-ps-id="${escapeHTML(ps.id)}">
              ${isSelected ? '✓ CHOSEN PROBLEM STATEMENT' : 'SELECT THIS STATEMENT'}
            </button>
          </div>
        `;
      });
      psContainer.innerHTML = html;

      // Bind selection buttons
      psContainer.querySelectorAll('.btn-select-ps').forEach(btn => {
        btn.addEventListener('click', async () => {
          const psId = btn.getAttribute('data-ps-id');
          btn.textContent = 'Locking selection...';

          try {
            const token = currentToken || getSavedToken();
            const res = await fetch('/api/teams/update-selection', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                problemStatementId: psId,
              }),
            });
            const data = await res.json();
            if (data.success) {
              currentTeam = data.team;
              renderProblemStatements();
            } else {
              alert('Selection update failed: ' + (data.error || 'Unknown error'));
              renderProblemStatements();
            }
          } catch (e) {
            alert('Error selecting problem statement: ' + e.message);
            renderProblemStatements();
          }
        });
      });
    }