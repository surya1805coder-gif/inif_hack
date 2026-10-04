let allTeams = [];
    let activeDomain = 'all';
    let activeEvaluatingTeam = null;

    const secLogin = document.getElementById('sec-login');
    const secDash = document.getElementById('sec-dashboard');
    const formLogin = document.getElementById('form-judge-login');
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
        const raw = sessionStorage.getItem('infinity_judge_auth');
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
        console.error('Judges refresh failed:', err);
      } finally {
        setTimeout(() => {
          btnRefresh.classList.remove('spinning');
        }, 500);
      }
    });

    const teamsGrid = document.getElementById('teams-grid');

    const modalEval = document.getElementById('modal-eval');
    const btnCloseEval = document.getElementById('btn-close-eval');
    const scoreInno = document.getElementById('score-inno');
    const scoreTech = document.getElementById('score-tech');
    const scoreExec = document.getElementById('score-exec');
    const scorePres = document.getElementById('score-pres');
    const evalTotal = document.getElementById('eval-total-display');
    const txtRemarks = document.getElementById('txt-remarks');
    const btnSaveScore = document.getElementById('btn-save-score');

    async function doJudgeLogin(password, isSilent = false) {
      if (!isSilent) loginErr.style.display = 'none';

      try {
        const res = await fetch('/api/judges/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid judges passphrase.');
        }

        // Store ONLY the signed bearer token, never the plaintext password
        sessionStorage.setItem('infinity_judge_auth', JSON.stringify({ token: data.token }));
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
          sessionStorage.removeItem('infinity_judge_auth');
        }
        return false;
      }
    }

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('txt-passcode').value;
      await doJudgeLogin(password, false);
    });

    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('infinity_judge_auth');
      secDash.style.display = 'none';
      secLogin.style.display = 'block';
      btnLogout.style.display = 'none';
    });

    // Auto-restore judge session if browser is refreshed (F5 / reload)
    const savedJudge = sessionStorage.getItem('infinity_judge_auth');
    if (savedJudge) {
      try {
        const creds = JSON.parse(savedJudge);
        if (creds.token) {
          secLogin.style.display = 'none';
          secDash.style.display = 'block';
          btnLogout.style.display = 'inline-block';
          loadTeams();
        } else if (creds.password) {
          doJudgeLogin(creds.password, true);
        }
      } catch (e) { }
    }

    async function loadTeams() {
      try {
        const res = await fetch('/api/judges/teams', {
          headers: authHeaders()
        });
        if (res.status === 401) {
          sessionStorage.removeItem('infinity_judge_auth');
          secDash.style.display = 'none';
          secLogin.style.display = 'block';
          btnLogout.style.display = 'none';
          loginErr.textContent = 'Judge session expired. Please enter passphrase.';
          loginErr.style.display = 'block';
          return;
        }
        const data = await res.json();
        allTeams = data.teams || [];
        renderTeams();
      } catch (e) {
        console.error('Error fetching judges teams:', e);
      }
    }

    function renderTeams() {
      const filtered = allTeams.filter(t => {
        return activeDomain === 'all' || (t.preferredDomain && t.preferredDomain.toLowerCase() === activeDomain);
      });

      if (filtered.length === 0) {
        teamsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#888;">No teams registered under this domain yet.</div>`;
        return;
      }

      let html = '';
      filtered.forEach(t => {
        const scores = t.scores || {};
        const total = scores.total || 0;
        const ps = t.selectedProblemStatement;

        html += `
          <div class="team-card">
            <div>
              <div class="t-header">
                <div>
                  <h4 class="t-name">${escapeHTML(t.teamName)}</h4>
                  <div class="t-college">${escapeHTML(t.college)}</div>
                </div>
                <span class="t-id">${escapeHTML(t.id)}</span>
              </div>

              <div class="t-ps-box">
                ${ps ? `<span class="t-ps-code">${escapeHTML(ps.code)}:</span> ${escapeHTML(ps.title)}` : '<span style="color:#888;">No Problem Statement Locked Yet</span>'}
              </div>

              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">
                <strong>Domain:</strong> ${escapeHTML((t.preferredDomain || 'MIND').toUpperCase())} • <strong>Tech:</strong> ${Array.isArray(t.techStack) ? escapeHTML(t.techStack.join(', ')) : escapeHTML(t.techStack || 'Standard')}
              </div>
            </div>

            <div class="score-badge-row">
              <div>
                <span style="font-size:0.65rem; color:var(--text-muted); font-family:'JetBrains Mono';">CURRENT MARKS:</span>
                <div class="score-val">${total > 0 ? `${total} / 100` : '<span style="color:#666; font-size:1rem;">UNRATED</span>'}</div>
              </div>
              <button class="btn-eval" data-team-id="${escapeHTML(t.id)}">
                ${total > 0 ? 'EDIT SCORES' : 'EVALUATE SQUAD'}
              </button>
            </div>
          </div>
        `;
      });
      teamsGrid.innerHTML = html;

      // Bind Evaluate buttons
      teamsGrid.querySelectorAll('.btn-eval').forEach(btn => {
        btn.addEventListener('click', () => {
          const tId = btn.getAttribute('data-team-id');
          openEvalModal(tId);
        });
      });
    }

    function openEvalModal(teamId) {
      activeEvaluatingTeam = allTeams.find(t => t.id === teamId);
      if (!activeEvaluatingTeam) return;

      document.getElementById('eval-modal-id').textContent = activeEvaluatingTeam.id;
      document.getElementById('eval-modal-name').textContent = activeEvaluatingTeam.teamName;
      document.getElementById('eval-modal-domain').textContent = `${(activeEvaluatingTeam.preferredDomain || '').toUpperCase()} STONE // ${activeEvaluatingTeam.college}`;

      const s = activeEvaluatingTeam.scores || {};
      scoreInno.value = s.innovation || 20;
      scoreTech.value = s.technical || 20;
      scoreExec.value = s.execution || 20;
      scorePres.value = s.presentation || 20;
      txtRemarks.value = s.remarks || '';

      calcTotal();
      modalEval.classList.add('is-open');
    }

    function calcTotal() {
      const inno = Math.min(25, Math.max(0, parseFloat(scoreInno.value) || 0));
      const tech = Math.min(25, Math.max(0, parseFloat(scoreTech.value) || 0));
      const exec = Math.min(25, Math.max(0, parseFloat(scoreExec.value) || 0));
      const pres = Math.min(25, Math.max(0, parseFloat(scorePres.value) || 0));
      const sum = inno + tech + exec + pres;
      evalTotal.textContent = `${sum} / 100`;
      return sum;
    }

    [scoreInno, scoreTech, scoreExec, scorePres].forEach(inp => {
      inp.addEventListener('input', calcTotal);
    });

    btnCloseEval.addEventListener('click', () => modalEval.classList.remove('is-open'));

    btnSaveScore.addEventListener('click', async () => {
      if (!activeEvaluatingTeam || btnSaveScore.disabled) return;
      btnSaveScore.disabled = true;
      btnSaveScore.textContent = 'Saving to R2...';

      const inno = parseFloat(scoreInno.value) || 0;
      const tech = parseFloat(scoreTech.value) || 0;
      const exec = parseFloat(scoreExec.value) || 0;
      const pres = parseFloat(scorePres.value) || 0;
      const remarks = txtRemarks.value.trim();

      try {
        const res = await fetch('/api/judges/score', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            teamId: activeEvaluatingTeam.id,
            innovation: inno,
            technical: tech,
            execution: exec,
            presentation: pres,
            remarks: remarks,
          }),
        });
        if (res.status === 401) {
          alert('Judge session expired. Please log in again.');
          window.location.reload();
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          activeEvaluatingTeam.scores = data.scores;
          modalEval.classList.remove('is-open');
          renderTeams();
        } else {
          throw new Error(data.error || 'Failed to save scores.');
        }
      } catch (e) {
        alert('Error saving marks: ' + e.message);
      } finally {
        btnSaveScore.disabled = false;
        btnSaveScore.textContent = 'CONFIRM & COMMIT MARKS TO R2';
      }
    });

    // Domain Filter Buttons
    document.querySelectorAll('#domain-filters .d-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#domain-filters .d-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeDomain = btn.getAttribute('data-domain');
        renderTeams();
      });
    });