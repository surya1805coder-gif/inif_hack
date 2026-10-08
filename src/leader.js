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
        // 1. Check URL hash (e.g., #token=... or #autologin=1&token=...)
        let urlToken = '';
        if (window.location.hash) {
          const hashString = window.location.hash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hashString);
          urlToken = hashParams.get('token') || (hashString.startsWith('token=') ? hashString.split('=')[1] : '');
        }

        // 2. Check query parameters (e.g., ?token=...)
        if (!urlToken && window.location.search) {
          const queryParams = new URLSearchParams(window.location.search);
          urlToken = queryParams.get('token') || '';
        }

        // If token arrived via URL, store it and sanitize URL cleanly without reloading
        if (urlToken) {
          try {
            sessionStorage.setItem('infinity_leader_auth', JSON.stringify({ token: urlToken }));
            localStorage.setItem('infinity_leader_auth', JSON.stringify({ token: urlToken }));
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (_) {}
          return urlToken;
        }

        // 3. Check sessionStorage
        const rawSession = sessionStorage.getItem('infinity_leader_auth');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          const t = parsed.token || (typeof parsed === 'string' ? parsed : '');
          if (t) return t;
        }

        // 4. Check localStorage fallback (for cross-tab navigation from registration)
        const rawLocal = localStorage.getItem('infinity_leader_auth');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          const t = parsed.token || (typeof parsed === 'string' ? parsed : '');
          if (t) {
            sessionStorage.setItem('infinity_leader_auth', JSON.stringify({ token: t }));
            return t;
          }
        }

        return '';
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
          localStorage.removeItem('infinity_leader_auth');
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

    // Check URL parameters for direct verification pass link
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const teamParam = urlParams.get('team');
      const emailParam = urlParams.get('email');
      if (emailParam) {
        const txtEmail = document.getElementById('txt-email');
        if (txtEmail) txtEmail.value = emailParam;
      }
      if (teamParam) {
        const loginSub = document.querySelector('.login-sub');
        if (loginSub) {
          loginSub.innerHTML = `Official Pass Verification: <strong style="color:var(--gold); font-family:var(--font-mono);">${escapeHTML(teamParam)}</strong><br>Enter your squad password to verify credentials and access your pass.`;
        }
      }
    } catch (_) {}

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
              Classified problem statements for the <strong>${escapeHTML(currentDomain?.domainName || '')}</strong> domain will be unlocked by the organizer command post just an hour before the start of the event.
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

    // ==========================================
    // FORGOT PASSWORD MODAL CONTROLLER
    // ==========================================
    const modalForgot = document.getElementById('modal-forgot-pwd');
    const btnOpenForgot = document.getElementById('btn-open-forgot');
    const btnCloseForgot = document.getElementById('btn-close-forgot');

    const formForgotVerify = document.getElementById('form-forgot-verify');
    const formForgotReset = document.getElementById('form-forgot-reset');
    const viewForgotSuccess = document.getElementById('forgot-success-view');

    const fgtVerifyErr = document.getElementById('fgt-verify-err');
    const fgtResetErr = document.getElementById('fgt-reset-err');
    const txtVerifyBtn = document.getElementById('txt-verify-btn');
    const txtResetBtn = document.getElementById('txt-reset-btn');

    const btnToggleNewPwd = document.getElementById('btn-toggle-new-pwd');
    const fgtNewPwd = document.getElementById('fgt-new-pwd');
    const btnFgtFinish = document.getElementById('btn-fgt-finish');
    const fgtTeamNameDisplay = document.getElementById('fgt-team-name-display');

    let currentResetToken = '';
    let verifiedEmail = '';

    function resetForgotModal() {
      currentResetToken = '';
      verifiedEmail = '';
      if (formForgotVerify) {
        formForgotVerify.reset();
        formForgotVerify.style.display = 'block';
      }
      if (formForgotReset) {
        formForgotReset.reset();
        formForgotReset.style.display = 'none';
      }
      if (viewForgotSuccess) viewForgotSuccess.style.display = 'none';
      if (fgtVerifyErr) {
        fgtVerifyErr.textContent = '';
        fgtVerifyErr.style.display = 'none';
      }
      if (fgtResetErr) {
        fgtResetErr.textContent = '';
        fgtResetErr.style.display = 'none';
      }
      if (txtVerifyBtn) txtVerifyBtn.textContent = 'VERIFY IDENTITY & PROCEED →';
      if (txtResetBtn) txtResetBtn.textContent = 'LOCK IN NEW PASSWORD ✓';
    }

    function openForgotModal() {
      resetForgotModal();
      const loginEmail = document.getElementById('txt-email')?.value?.trim();
      const fgtEmailInput = document.getElementById('fgt-email');
      if (loginEmail && fgtEmailInput) {
        fgtEmailInput.value = loginEmail;
      }
      if (modalForgot) modalForgot.style.display = 'flex';
    }

    function closeForgotModal() {
      if (modalForgot) modalForgot.style.display = 'none';
      resetForgotModal();
    }

    if (btnOpenForgot) {
      btnOpenForgot.addEventListener('click', (e) => {
        e.preventDefault();
        openForgotModal();
      });
    }

    if (btnCloseForgot) {
      btnCloseForgot.addEventListener('click', closeForgotModal);
    }

    if (modalForgot) {
      modalForgot.addEventListener('click', (e) => {
        if (e.target === modalForgot) closeForgotModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalForgot && modalForgot.style.display === 'flex') {
        closeForgotModal();
      }
    });

    // Toggle password visibility
    if (btnToggleNewPwd && fgtNewPwd) {
      btnToggleNewPwd.addEventListener('click', () => {
        const isPwd = fgtNewPwd.type === 'password';
        fgtNewPwd.type = isPwd ? 'text' : 'password';
        btnToggleNewPwd.textContent = isPwd ? '🔒' : '👁';
      });
    }

    // Step 1: Submit Identity Verification
    if (formForgotVerify) {
      formForgotVerify.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (fgtVerifyErr) fgtVerifyErr.style.display = 'none';

        const email = document.getElementById('fgt-email')?.value?.trim();
        const phone = document.getElementById('fgt-phone')?.value?.trim();
        const utr = document.getElementById('fgt-utr')?.value?.trim();

        if (!email || (!phone && !utr)) {
          if (fgtVerifyErr) {
            fgtVerifyErr.textContent = 'Please enter your registered leader email and either your phone number or payment UTR / Team ID.';
            fgtVerifyErr.style.display = 'block';
          }
          return;
        }

        try {
          if (txtVerifyBtn) txtVerifyBtn.textContent = 'VERIFYING IDENTITY...';
          const btn = document.getElementById('btn-submit-verify');
          if (btn) btn.disabled = true;

          const res = await fetch('/api/teams/forgot-password/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone, utr })
          });
          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Verification failed. Please check your details.');
          }

          currentResetToken = data.resetToken;
          verifiedEmail = email;

          if (fgtTeamNameDisplay) {
            fgtTeamNameDisplay.textContent = data.teamName || 'Squad';
          }

          // Transition to Step 2
          formForgotVerify.style.display = 'none';
          if (formForgotReset) formForgotReset.style.display = 'block';
          const newPwdInput = document.getElementById('fgt-new-pwd');
          if (newPwdInput) newPwdInput.focus();
        } catch (err) {
          if (fgtVerifyErr) {
            fgtVerifyErr.textContent = err.message;
            fgtVerifyErr.style.display = 'block';
          }
        } finally {
          if (txtVerifyBtn) txtVerifyBtn.textContent = 'VERIFY IDENTITY & PROCEED →';
          const btn = document.getElementById('btn-submit-verify');
          if (btn) btn.disabled = false;
        }
      });
    }

    // Step 2: Submit New Password
    if (formForgotReset) {
      formForgotReset.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (fgtResetErr) fgtResetErr.style.display = 'none';

        const newPassword = document.getElementById('fgt-new-pwd')?.value || '';
        const confirmPassword = document.getElementById('fgt-confirm-pwd')?.value || '';

        if (!newPassword || newPassword.length < 6) {
          if (fgtResetErr) {
            fgtResetErr.textContent = 'New password must be at least 6 characters.';
            fgtResetErr.style.display = 'block';
          }
          return;
        }

        if (newPassword !== confirmPassword) {
          if (fgtResetErr) {
            fgtResetErr.textContent = 'Passwords do not match. Please re-enter.';
            fgtResetErr.style.display = 'block';
          }
          return;
        }

        try {
          if (txtResetBtn) txtResetBtn.textContent = 'UPDATING SINGULARITY CORE...';
          const btn = document.getElementById('btn-submit-reset');
          if (btn) btn.disabled = true;

          const res = await fetch('/api/teams/forgot-password/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resetToken: currentResetToken,
              newPassword
            })
          });
          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Password update failed.');
          }

          // Transition to Step 3: Success
          formForgotReset.style.display = 'none';
          if (viewForgotSuccess) viewForgotSuccess.style.display = 'block';

          // Pre-fill the login form
          const txtEmail = document.getElementById('txt-email');
          const txtPassword = document.getElementById('txt-password');
          if (txtEmail && verifiedEmail) txtEmail.value = verifiedEmail;
          if (txtPassword) txtPassword.value = newPassword;
        } catch (err) {
          if (fgtResetErr) {
            fgtResetErr.textContent = err.message;
            fgtResetErr.style.display = 'block';
          }
        } finally {
          if (txtResetBtn) txtResetBtn.textContent = 'LOCK IN NEW PASSWORD ✓';
          const btn = document.getElementById('btn-submit-reset');
          if (btn) btn.disabled = false;
        }
      });
    }

    // Step 3 Finish button
    if (btnFgtFinish) {
      btnFgtFinish.addEventListener('click', () => {
        closeForgotModal();
        const txtPassword = document.getElementById('txt-password');
        if (txtPassword) txtPassword.focus();
      });
    }