import"./modulepreload-polyfill-B5Qt9EMX.js";let b=[],C=[],ie="",m=null;function d(n){return n==null?"":String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function ee(n){if(!n||typeof n!="string")return"";const o=n.trim();return/^https?:\/\/[^\s"'<>]+$/i.test(o)||/^\/uploads\/[a-zA-Z0-9_\-\.]+$/i.test(o)?d(o):""}function de(){try{const n=sessionStorage.getItem("infinity_admin_auth");if(!n)return"";const o=JSON.parse(n);return o.token||(typeof o=="string"?o:"")}catch{return""}}function h(n={}){const o=de(),e={...n};return o&&(e.Authorization=`Bearer ${o}`),e}const T=document.getElementById("sec-login"),$=document.getElementById("sec-dashboard"),te=document.getElementById("form-admin-login"),L=document.getElementById("login-err"),k=document.getElementById("btn-logout"),Y=document.getElementById("btn-refresh");Y.addEventListener("click",async()=>{Y.classList.add("spinning");try{$.style.display!=="none"?await X():window.location.reload()}catch(n){console.error("Admin refresh failed:",n)}finally{setTimeout(()=>{Y.classList.remove("spinning")},500)}});const J=document.getElementById("admin-tbody"),ce=document.getElementById("admin-search"),K=document.getElementById("modal-edit-team"),me=document.getElementById("btn-close-edit"),pe=document.getElementById("form-edit-team"),re=document.getElementById("modal-ps-mgr"),ue=document.getElementById("btn-open-ps-mgr"),fe=document.getElementById("btn-close-ps-mgr"),N=document.getElementById("ps-mgr-domains-list");async function Z(n,o=!1){!o&&L&&(L.style.display="none");try{const e=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:(n||"").trim()})}),t=await e.json();if(!e.ok||!t.success)throw new Error(t.error||"Invalid administrator passphrase.");return sessionStorage.setItem("infinity_admin_auth",JSON.stringify({token:t.token})),T&&(T.style.display="none"),$&&($.style.display="block"),k&&(k.style.display="inline-block"),await X(),!0}catch(e){return!o&&L?(L.textContent=e.message,L.style.display="block"):sessionStorage.removeItem("infinity_admin_auth"),!1}}te&&te.addEventListener("submit",async n=>{var e;n.preventDefault(),n.stopPropagation();const o=((e=document.getElementById("txt-passphrase"))==null?void 0:e.value)||"";await Z(o,!1)});const ne=document.getElementById("btn-do-login");ne&&ne.addEventListener("click",async n=>{var e;n.preventDefault();const o=((e=document.getElementById("txt-passphrase"))==null?void 0:e.value)||"";await Z(o,!1)});k&&k.addEventListener("click",()=>{sessionStorage.removeItem("infinity_admin_auth"),$&&($.style.display="none"),T&&(T.style.display="block"),k.style.display="none"});const ae=sessionStorage.getItem("infinity_admin_auth");if(ae)try{const n=JSON.parse(ae);n.token?(T&&(T.style.display="none"),$&&($.style.display="block"),k&&(k.style.display="inline-block"),X()):n.password&&Z(n.password,!0)}catch{}async function X(){try{const[n,o]=await Promise.all([fetch("/api/admin/teams",{headers:h()}),fetch("/api/domains")]);if(n.status===401){sessionStorage.removeItem("infinity_admin_auth"),$&&($.style.display="none"),T&&(T.style.display="block"),k&&(k.style.display="none"),L&&(L.textContent="Session expired or unauthorized. Please log in again.",L.style.display="block");return}const e=await n.json(),t=await o.json();b=e.teams||[],C=t.domains||[];const a=document.querySelector(".btn-excel");a&&!a.dataset.bound&&(a.dataset.bound="true",a.removeAttribute("href"),a.style.cursor="pointer",a.addEventListener("click",async s=>{s.preventDefault();const c=de();if(!c){alert("Organizer clearance required.");return}const l=a.textContent;try{a.style.opacity="0.6",a.textContent="Preparing Workbook...";const p=await(await fetch("/api/admin/export-ticket",{method:"POST",headers:{Authorization:`Bearer ${c}`,"Content-Type":"application/json"}})).json();p.success&&p.ticket?window.location.href=`/api/admin/export?ticket=${encodeURIComponent(p.ticket)}`:alert("Export failed: "+(p.error||"Could not generate export clearance ticket"))}catch(i){alert("Export error: "+i.message)}finally{setTimeout(()=>{a.style.opacity="1",a.textContent=l},1200)}})),P(),W()}catch(n){console.error("Error loading admin data:",n)}}function W(){document.getElementById("kpi-total-teams").textContent=b.length;let n=0,o=0,e=0;b.forEach(t=>{var c,l;const a=t.teamSize||4;e+=a;const s=((c=t.payment)==null?void 0:c.amount)||a*349;n+=s,((l=t.payment)==null?void 0:l.status)==="verified"&&o++}),document.getElementById("kpi-total-fees").textContent=`₹${n.toLocaleString("en-IN")}`,document.getElementById("kpi-verified-payments").textContent=o,document.getElementById("kpi-total-hackers").textContent=e}function P(){const n=ie.toLowerCase(),o=b.filter(t=>{var a,s;return!n||t.teamName.toLowerCase().includes(n)||t.id.toLowerCase().includes(n)||t.college&&t.college.toLowerCase().includes(n)||((a=t.leader)==null?void 0:a.email)&&t.leader.email.toLowerCase().includes(n)||((s=t.payment)==null?void 0:s.utr)&&t.payment.utr.toLowerCase().includes(n)});if(o.length===0){const t=b.length===0?"No squads registered yet. The system is clean and ready for live registrations.":"No teams match the search criteria.";J.innerHTML=`<tr><td colspan="8" style="text-align:center; padding:45px 20px; color:#888; font-family:'JetBrains Mono', monospace; font-size:0.8rem; letter-spacing:0.04em;">${t}</td></tr>`;return}let e="";o.forEach(t=>{var A;const a=t.payment||{},s=t.food||{},c=t.reviews||{},l=t.scores||{};let i=0;["highTea","dinner","midnightFuel","breakfast","lunch"].forEach(w=>{var E;(E=s[w])!=null&&E.collected&&i++});let p=0;["r1","r2","r3"].forEach(w=>{var E;(E=c[w])!=null&&E.attended&&p++});const u=a.status||"pending";let v='<span class="badge-status badge-pending">PENDING</span>';u==="verified"&&(v='<span class="badge-status badge-verified">VERIFIED</span>'),u==="rejected"&&(v='<span class="badge-status badge-rejected">REJECTED</span>'),e+=`
          <tr>
            <td>
              <strong>${d(t.teamName)}</strong>
              <div style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--red);">${d(t.id)}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${d(t.college)}</div>
            </td>
            <td>
              <span class="portal-badge font-mono">${d((t.preferredDomain||"MIND").toUpperCase())}</span>
              <div style="font-size:0.68rem; color:#888;">${d(t.teamSize||4)} Members</div>
            </td>
            <td>
              ${v}
              <div style="font-size:0.7rem; color:#aaa; margin-top:2px;">₹${a.amount||(t.teamSize||4)*349}</div>
            </td>
            <td>
              <div class="font-mono" style="font-size:0.72rem;">${d(a.utr||"N/A")}</div>
              <div style="font-size:0.68rem; color:#888;">Phone: ${d(a.phone||((A=t.leader)==null?void 0:A.phone)||"N/A")}</div>
              ${ee(a.screenshotUrl)?`<a href="${ee(a.screenshotUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:0.68rem; color:var(--cyan);">View Receipt ↗</a>`:a.screenshotUrl?'<span style="font-size:0.68rem; color:#888;">Receipt Attached</span>':""}
            </td>
            <td>
              <span class="font-mono" style="font-weight:700;">${i} / 5</span>
            </td>
            <td>
              <span class="font-mono" style="font-weight:700;">${p} / 3</span>
            </td>
            <td>
              <span class="font-mono" style="font-weight:800; color:var(--green); font-size:0.95rem;">${l.total||0}</span>
            </td>
            <td>
              <div class="tbl-actions">
                <select class="sel-quick-status ${u}" data-status-id="${d(t.id)}" title="Select payment verification status">
                  <option value="verified" ${u==="verified"?"selected":""}>✓ VERIFIED</option>
                  <option value="pending" ${u==="pending"?"selected":""}>⏳ PENDING</option>
                  <option value="rejected" ${u==="rejected"?"selected":""}>✕ REJECTED</option>
                </select>
                <button class="btn-tbl-edit" data-edit-id="${d(t.id)}">EDIT</button>
                <button class="btn-tbl-del" data-del-id="${d(t.id)}">DEL</button>
              </div>
            </td>
          </tr>
        `}),J.innerHTML=e,J.querySelectorAll(".sel-quick-status").forEach(t=>{t.addEventListener("change",async a=>{const s=t.getAttribute("data-status-id"),c=b.find(i=>i.id===s);if(!c)return;const l=a.target.value;t.disabled=!0;try{const p=await(await fetch(`/api/admin/teams/${s}`,{method:"PUT",headers:h({"Content-Type":"application/json"}),body:JSON.stringify({payment:{...c.payment,status:l}})})).json();if(p.success){const u=b.findIndex(v=>v.id===s);u>=0&&(b[u]=p.team),P(),W()}else alert("Failed to update status: "+(p.error||"Unknown error")),P()}catch(i){alert("Error updating payment status: "+i.message),P()}})}),J.querySelectorAll(".btn-tbl-edit").forEach(t=>{t.addEventListener("click",()=>{ge(t.getAttribute("data-edit-id"))})}),J.querySelectorAll(".btn-tbl-del").forEach(t=>{t.addEventListener("click",async()=>{const a=t.getAttribute("data-del-id");if(confirm(`Are you sure you want to completely delete team ${a}?`))try{(await(await fetch(`/api/admin/teams/${a}`,{method:"DELETE",headers:h()})).json()).success&&(b=b.filter(l=>l.id!==a),P(),W())}catch(s){alert("Error deleting squad: "+s.message)}})})}ce.addEventListener("input",n=>{ie=n.target.value,P()});function ge(n){var i,p,u,v,A,w,E,G,V,B,U;if(m=b.find(_=>_.id===n),!m)return;document.getElementById("edit-team-id").textContent=m.id,document.getElementById("edt-team-name").value=m.teamName||"",document.getElementById("edt-college").value=m.college||"",document.getElementById("edt-room").value=m.roomAllocated||"";const o=(m.preferredDomain||"intelligence").toLowerCase(),e={mind:"intelligence",space:"connectivity",reality:"digital",power:"automation",time:"analytics",soul:"impact",intelligence:"intelligence",connectivity:"connectivity",digital:"digital",automation:"automation",analytics:"analytics",impact:"impact"};document.getElementById("edt-domain").value=e[o]||"intelligence",document.getElementById("edt-size").value=m.teamSize||4;const t=document.getElementById("edt-password");t&&(t.value="",t.placeholder=m.hasPassword?"•••••••• (Leave blank to keep current)":"Enter new password"),document.getElementById("edt-leader-name").value=((i=m.leader)==null?void 0:i.name)||"",document.getElementById("edt-leader-email").value=((p=m.leader)==null?void 0:p.email)||"",document.getElementById("edt-leader-phone").value=((u=m.leader)==null?void 0:u.phone)||"";const a=m.payment||{};document.getElementById("edt-pay-status").value=a.status||"pending",document.getElementById("edt-pay-utr").value=a.utr||"",document.getElementById("edt-pay-amount").value=a.amount||(m.teamSize||4)*349;const s=m.food||{};document.getElementById("edt-food-ht").checked=!!((v=s.highTea)!=null&&v.collected),document.getElementById("edt-food-din").checked=!!((A=s.dinner)!=null&&A.collected),document.getElementById("edt-food-mid").checked=!!((w=s.midnightFuel)!=null&&w.collected),document.getElementById("edt-food-bf").checked=!!((E=s.breakfast)!=null&&E.collected),document.getElementById("edt-food-ln").checked=!!((G=s.lunch)!=null&&G.collected);const c=m.reviews||{};document.getElementById("edt-rev-r1").checked=!!((V=c.r1)!=null&&V.attended),document.getElementById("edt-rev-r2").checked=!!((B=c.r2)!=null&&B.attended),document.getElementById("edt-rev-r3").checked=!!((U=c.r3)!=null&&U.attended);const l=m.scores||{};document.getElementById("edt-score-total").value=l.total||0,document.getElementById("edt-score-remarks").value=l.remarks||"",K.classList.add("is-open")}me.addEventListener("click",()=>K.classList.remove("is-open"));pe.addEventListener("submit",async n=>{var t,a;if(n.preventDefault(),!m)return;const o={teamName:document.getElementById("edt-team-name").value.trim(),college:document.getElementById("edt-college").value.trim(),roomAllocated:document.getElementById("edt-room").value.trim(),preferredDomain:document.getElementById("edt-domain").value,teamSize:parseInt(document.getElementById("edt-size").value,10)||4,leader:{name:document.getElementById("edt-leader-name").value.trim(),email:document.getElementById("edt-leader-email").value.trim(),phone:document.getElementById("edt-leader-phone").value.trim()},payment:{...m.payment,status:document.getElementById("edt-pay-status").value,utr:document.getElementById("edt-pay-utr").value.trim(),amount:parseFloat(document.getElementById("edt-pay-amount").value)||0},food:{highTea:{collected:document.getElementById("edt-food-ht").checked},dinner:{collected:document.getElementById("edt-food-din").checked},midnightFuel:{collected:document.getElementById("edt-food-mid").checked},breakfast:{collected:document.getElementById("edt-food-bf").checked},lunch:{collected:document.getElementById("edt-food-ln").checked}},reviews:{r1:{attended:document.getElementById("edt-rev-r1").checked},r2:{attended:document.getElementById("edt-rev-r2").checked},r3:{attended:document.getElementById("edt-rev-r3").checked}},scores:{...m.scores,total:parseFloat(document.getElementById("edt-score-total").value)||0,remarks:document.getElementById("edt-score-remarks").value.trim()}},e=(a=(t=document.getElementById("edt-password"))==null?void 0:t.value)==null?void 0:a.trim();e&&(o.teamPassword=e);try{const c=await(await fetch(`/api/admin/teams/${m.id}`,{method:"PUT",headers:h({"Content-Type":"application/json"}),body:JSON.stringify(o)})).json();if(c.success){const l=b.findIndex(i=>i.id===m.id);l>=0&&(b[l]=c.team),K.classList.remove("is-open"),P(),W()}}catch(s){alert("Error updating team: "+s.message)}});ue.addEventListener("click",()=>{q(),re.classList.add("is-open")});fe.addEventListener("click",()=>re.classList.remove("is-open"));function q(){const n={intelligence:"INTEL",connectivity:"CONN",digital:"DIG",automation:"AUTO",analytics:"ANA",impact:"IMP",mind:"INTEL",space:"CONN",reality:"DIG",power:"AUTO",time:"ANA",soul:"IMP"};let o="";C.forEach(e=>{const t=!!e.isPsReleased,a=e.problemStatements||[],c=`PS-${n[e.id]||e.id.substring(0,4).toUpperCase()}-${String(a.length+1).padStart(2,"0")}`,l=e.accentHex||"#ffd000";o+=`
          <div class="field-card" style="border-left: 4px solid ${l}; margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:12px;">
              <div>
                <h4 style="font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:8px;">
                  <span>${d(e.domainName)}</span>
                  <span style="font-family:'JetBrains Mono'; font-size:0.75rem; color:${l}; font-weight:700;">(${d(e.stoneName)})</span>
                </h4>
                <div style="font-size:0.75rem; color:var(--text-muted);">${d(e.tagline||"")}</div>
              </div>

              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <button class="btn-toggle-add-ps" data-domain-id="${d(e.id)}" style="padding:6px 12px; border-radius:6px; background:rgba(255,255,255,0.06); border:1px solid ${l}50; color:${l}; font-family:'JetBrains Mono',monospace; font-size:0.72rem; font-weight:700; cursor:pointer; transition:all 0.2s;">
                  + ADD STATEMENT
                </button>
                <label class="switch-wrap">
                  <input type="checkbox" class="toggle-release-ps" data-domain-id="${d(e.id)}" ${t?"checked":""}>
                  <span style="font-family:'JetBrains Mono'; font-size:0.72rem; font-weight:700; color:${t?"var(--green)":"var(--gold)"};">
                    ${t?"RELEASED (LIVE)":"LOCKED (HIDDEN)"}
                  </span>
                </label>
              </div>
            </div>

            <!-- Expandable Add Problem Statement Panel -->
            <div id="add-panel-${d(e.id)}" style="display:none; margin: 12px 0 16px 0; padding:16px; border-radius:10px; background:rgba(6,6,12,0.95); border:1px solid ${l}60; box-shadow:0 8px 25px rgba(0,0,0,0.6);">
              <div style="font-family:'Syne',sans-serif; font-size:0.86rem; font-weight:700; color:${l}; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span>✦</span> NEW PROBLEM STATEMENT // ${d(e.stoneName.toUpperCase())} (${d(e.domainName)})
              </div>

              <div class="edit-grid-3" style="margin-bottom:10px;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label">CHALLENGE CODE</label>
                  <input type="text" id="new-code-${d(e.id)}" class="form-input font-mono" value="${d(c)}" style="padding:8px 10px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">PROBLEM TITLE</label>
                  <input type="text" id="new-title-${d(e.id)}" class="form-input" placeholder="e.g. Distributed Telemetry Mesh Engine" style="padding:8px 10px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">DIFFICULTY</label>
                  <select id="new-diff-${d(e.id)}" class="form-input custom-select" style="padding:8px 10px; font-size:0.82rem;">
                    <option value="Advanced" selected>Advanced</option>
                    <option value="Hardcore">Hardcore</option>
                    <option value="Intermediate">Intermediate</option>
                  </select>
                </div>
              </div>

              <div class="edit-grid-2" style="margin-bottom:10px;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label">CATEGORY / TRACK</label>
                  <input type="text" id="new-cat-${d(e.id)}" class="form-input" value="${d(e.domainName)} & Systems" style="padding:8px 10px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">DELIVERABLES (COMMA-SEPARATED)</label>
                  <input type="text" id="new-deliv-${d(e.id)}" class="form-input" placeholder="Interactive UI visualizer, Core architecture daemon, Benchmark testbench" style="padding:8px 10px; font-size:0.82rem;">
                </div>
              </div>

              <div class="form-group" style="margin-bottom:12px;">
                <label class="form-label">PROBLEM STATEMENT DESCRIPTION</label>
                <textarea id="new-desc-${d(e.id)}" class="form-input" rows="3" placeholder="Provide background context, technical specifications, and key engineering expectations..." style="padding:8px 10px; font-size:0.82rem;"></textarea>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
                <button class="btn-cancel-add-ps" data-domain-id="${d(e.id)}" style="padding:7px 14px; border-radius:6px; background:transparent; border:1px solid var(--border-subtle); color:var(--text-muted); font-size:0.75rem; cursor:pointer;">
                  Cancel
                </button>
                <button class="btn-save-new-ps" data-domain-id="${d(e.id)}" style="padding:7px 18px; border-radius:6px; background:${l}; color:#000; font-family:'Syne',sans-serif; font-size:0.8rem; font-weight:800; border:none; cursor:pointer; box-shadow:0 0 12px ${l}40;">
                  SAVE STATEMENT TO ${d(e.stoneName.toUpperCase())}
                </button>
              </div>
            </div>

            <!-- Active Statements List -->
            <div style="margin-top:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:0.75rem; color:#bbb; text-transform:uppercase;">
                  Active Statements (${a.length}):
                </strong>
              </div>

              ${a.length===0?`
                <div style="padding:14px; text-align:center; font-size:0.75rem; color:#777; background:rgba(255,255,255,0.01); border-radius:6px; border:1px dashed rgba(255,255,255,0.08);">
                  No problem statements for this stone yet. Click <strong>+ ADD STATEMENT</strong> above to create one.
                </div>
              `:`
                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${a.map((i,p)=>`
                    <div style="padding:10px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                      <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                          <span style="color:${l}; font-family:'JetBrains Mono'; font-weight:700; font-size:0.75rem;">${d(i.code)}:</span>
                          <strong style="font-size:0.82rem; color:#fff;">${d(i.title)}</strong>
                          <span style="font-size:0.65rem; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.06); color:#aaa; font-family:'JetBrains Mono';">
                            ${d(i.difficulty||"Advanced")}
                          </span>
                        </div>
                        <div style="font-size:0.74rem; color:#888; line-height:1.4;">${d(i.description)}</div>
                        ${i.deliverables&&i.deliverables.length>0?`
                          <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
                            ${i.deliverables.map(u=>`
                              <span style="font-size:0.65rem; padding:1px 6px; border-radius:3px; background:rgba(255,255,255,0.04); color:#aaa;">✦ ${d(u)}</span>
                            `).join("")}
                          </div>
                        `:""}
                      </div>

                      <button class="btn-del-ps" data-domain-id="${d(e.id)}" data-ps-id="${d(i.id||i.code)}" title="Remove this problem statement" style="padding:4px 8px; border-radius:4px; background:rgba(255,42,75,0.1); border:1px solid var(--red); color:var(--red); font-size:0.68rem; cursor:pointer; white-space:nowrap;">
                        ✕ REMOVE
                      </button>
                    </div>
                  `).join("")}
                </div>
              `}
            </div>
          </div>
        `}),N.innerHTML=o,N.querySelectorAll(".btn-toggle-add-ps").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-domain-id"),a=document.getElementById(`add-panel-${t}`);if(a){const s=a.style.display!=="none";a.style.display=s?"none":"block",e.textContent=s?"+ ADD STATEMENT":"✕ CLOSE FORM"}})}),N.querySelectorAll(".btn-cancel-add-ps").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-domain-id"),a=document.getElementById(`add-panel-${t}`),s=N.querySelector(`.btn-toggle-add-ps[data-domain-id="${t}"]`);a&&(a.style.display="none"),s&&(s.textContent="+ ADD STATEMENT")})}),N.querySelectorAll(".btn-save-new-ps").forEach(e=>{e.addEventListener("click",async()=>{const t=e.getAttribute("data-domain-id"),a=C.find(B=>B.id===t);if(!a)return;const s=document.getElementById(`new-code-${t}`),c=document.getElementById(`new-title-${t}`),l=document.getElementById(`new-cat-${t}`),i=document.getElementById(`new-diff-${t}`),p=document.getElementById(`new-desc-${t}`),u=document.getElementById(`new-deliv-${t}`),v=s?s.value.trim().toUpperCase():"",A=c?c.value.trim():"",w=p?p.value.trim():"";if(!v||!A||!w){alert("Please provide at least the Problem Code, Title, and Description.");return}const E=u?u.value.trim():"",G=E?E.split(",").map(B=>B.trim()).filter(Boolean):["Architecture document and testbench report","Interactive demonstration visualizer"],V={id:v.toLowerCase().replace(/[^a-z0-9]/g,"-"),code:v,title:A,category:l&&l.value.trim()||a.domainName,difficulty:i&&i.value||"Advanced",description:w,deliverables:G};a.problemStatements||(a.problemStatements=[]),a.problemStatements.push(V),e.disabled=!0,e.textContent="SAVING TO R2...";try{const U=await(await fetch("/api/admin/domains",{method:"PUT",headers:h({"Content-Type":"application/json"}),body:JSON.stringify(a)})).json();if(U.success){const _=C.findIndex(le=>le.id===t);_>=0&&(C[_]=U.domain),q()}else alert("Failed to save statement: "+(U.error||"Unknown error")),q()}catch(B){alert("Error saving statement: "+B.message),q()}})}),N.querySelectorAll(".btn-del-ps").forEach(e=>{e.addEventListener("click",async()=>{const t=e.getAttribute("data-domain-id"),a=e.getAttribute("data-ps-id"),s=C.find(i=>i.id===t);if(!s)return;const c=(s.problemStatements||[]).find(i=>i.id===a||i.code===a),l=c?c.code:a;if(confirm(`Are you sure you want to remove problem statement "${l}" from ${s.stoneName}?`)){s.problemStatements=(s.problemStatements||[]).filter(i=>i.id!==a&&i.code!==a);try{const p=await(await fetch("/api/admin/domains",{method:"PUT",headers:h({"Content-Type":"application/json"}),body:JSON.stringify(s)})).json();if(p.success){const u=C.findIndex(v=>v.id===t);u>=0&&(C[u]=p.domain),q()}}catch(i){alert("Error removing statement: "+i.message)}}})}),N.querySelectorAll(".toggle-release-ps").forEach(e=>{e.addEventListener("change",async()=>{const t=e.getAttribute("data-domain-id"),a=e.checked,s=C.find(c=>c.id===t);if(s){s.isPsReleased=a;try{await fetch("/api/admin/domains",{method:"PUT",headers:h({"Content-Type":"application/json"}),body:JSON.stringify(s)}),q()}catch(c){alert("Error updating domain status: "+c.message)}}})})}const M=document.getElementById("modal-qr-mgr"),oe=document.getElementById("btn-open-qr-mgr"),se=document.getElementById("btn-close-qr-mgr"),x=document.getElementById("preview-qr-3"),I=document.getElementById("preview-qr-4"),j=document.getElementById("file-qr-3"),F=document.getElementById("file-qr-4"),S=document.getElementById("lbl-file-qr-3"),R=document.getElementById("lbl-file-qr-4"),g=document.getElementById("txt-qr-3"),y=document.getElementById("txt-qr-4"),D=document.getElementById("btn-save-qrs"),H=document.getElementById("btn-reset-qrs"),r=document.getElementById("qr-mgr-status"),z=document.getElementById("qr-last-updated");let f={member3:"/3mem.png",member4:"/4mem.png"},Q=null,O=null;async function ye(){r&&(r.textContent="Fetching current payment QR codes...",r.style.color="var(--text-muted)");try{const n=await fetch("/api/admin/payment-qrs",{headers:h()});let o=null;if(n.ok)try{o=await n.json()}catch{}if(!o||!o.success)try{const e=await fetch("/api/payment-qrs");e.ok&&(o=await e.json())}catch{}if((!o||!o.paymentQrs)&&(o={success:!0,paymentQrs:{member3:"/3mem.png",member4:"/4mem.png"}}),o&&o.paymentQrs){if(f=o.paymentQrs,Q=null,O=null,x&&(x.src=f.member3||"/3mem.png"),I&&(I.src=f.member4||"/4mem.png"),g&&(g.value=f.member3||""),y&&(y.value=f.member4||""),S&&(S.textContent="Upload 3-Member QR Image"),R&&(R.textContent="Upload 4-Member QR Image"),z)if(f.updatedAt){const e=new Date(f.updatedAt).toLocaleString();z.textContent=`✦ ACTIVE CONFIGURATION // Last synchronized: ${e}`}else z.textContent="✦ DEFAULT PRE-CONFIGURED PAYMENT QRS ACTIVE";r&&(r.textContent="Payment QR codes loaded.",r.style.color="var(--green)")}}catch(n){r&&(r.textContent="Error loading QR codes: "+n.message,r.style.color="var(--red)")}}oe&&M&&oe.addEventListener("click",()=>{M.classList.add("is-open"),ye()});se&&M&&se.addEventListener("click",()=>{M.classList.remove("is-open")});window.addEventListener("click",n=>{M&&n.target===M&&M.classList.remove("is-open")});j&&j.addEventListener("change",n=>{const o=n.target.files&&n.target.files[0];if(!o)return;if(!o.type.startsWith("image/")){alert("Please select a valid image file (PNG, JPG, WebP, SVG).");return}const e=new FileReader;e.onload=t=>{Q=t.target.result,x&&(x.src=Q),S&&(S.textContent=`Selected: ${o.name} (${Math.round(o.size/1024)} KB)`),g&&(g.value=`[Uploaded File: ${o.name}]`),r&&(r.textContent='3-member QR preview updated. Click "SAVE & DEPLOY" to commit.',r.style.color="var(--gold)")},e.readAsDataURL(o)});F&&F.addEventListener("change",n=>{const o=n.target.files&&n.target.files[0];if(!o)return;if(!o.type.startsWith("image/")){alert("Please select a valid image file (PNG, JPG, WebP, SVG).");return}const e=new FileReader;e.onload=t=>{O=t.target.result,I&&(I.src=O),R&&(R.textContent=`Selected: ${o.name} (${Math.round(o.size/1024)} KB)`),y&&(y.value=`[Uploaded File: ${o.name}]`),r&&(r.textContent='4-member QR preview updated. Click "SAVE & DEPLOY" to commit.',r.style.color="var(--cyan)")},e.readAsDataURL(o)});g&&g.addEventListener("input",()=>{const n=g.value.trim();n&&!n.startsWith("[Uploaded File:")&&(Q=null,x&&(x.src=n))});y&&y.addEventListener("input",()=>{const n=y.value.trim();n&&!n.startsWith("[Uploaded File:")&&(O=null,I&&(I.src=n))});D&&D.addEventListener("click",async()=>{D.disabled=!0;const n=D.textContent;D.textContent="COMMITTING TO R2...",r&&(r.textContent="Uploading and committing new QR codes to Cloudflare R2...",r.style.color="var(--cyan)");const o=Q||(g&&g.value.trim()&&!g.value.startsWith("[Uploaded File:")?g.value.trim():null)||f.member3,e=O||(y&&y.value.trim()&&!y.value.startsWith("[Uploaded File:")?y.value.trim():null)||f.member4;try{const a=await(await fetch("/api/admin/payment-qrs",{method:"POST",headers:h({"Content-Type":"application/json"}),body:JSON.stringify({member3:o,member4:e})})).json();if(a.success&&a.paymentQrs)f=a.paymentQrs,Q=null,O=null,j&&(j.value=""),F&&(F.value=""),x&&(x.src=f.member3),I&&(I.src=f.member4),g&&(g.value=f.member3),y&&(y.value=f.member4),S&&(S.textContent="Upload 3-Member QR Image"),R&&(R.textContent="Upload 4-Member QR Image"),z&&f.updatedAt&&(z.textContent=`✦ ACTIVE CONFIGURATION // Last synchronized: ${new Date(f.updatedAt).toLocaleString()}`),r&&(r.textContent="✓ Payment QR codes updated and deployed to Cloudflare R2 successfully!",r.style.color="var(--green)");else throw new Error(a.error||"Failed to update payment QR codes.")}catch(t){r&&(r.textContent="✕ Error saving QRs: "+t.message,r.style.color="var(--red)")}finally{D.disabled=!1,D.textContent=n}});H&&H.addEventListener("click",async()=>{if(confirm("Are you sure you want to restore both payment QR codes back to defaults (/3mem.png and /4mem.png)?")){H.disabled=!0,r&&(r.textContent="Resetting to default QR codes...",r.style.color="var(--gold)");try{const o=await(await fetch("/api/admin/payment-qrs/reset",{method:"POST",headers:h()})).json();o.success&&o.paymentQrs&&(f=o.paymentQrs,Q=null,O=null,j&&(j.value=""),F&&(F.value=""),x&&(x.src="/3mem.png"),I&&(I.src="/4mem.png"),g&&(g.value="/3mem.png"),y&&(y.value="/4mem.png"),S&&(S.textContent="Upload 3-Member QR Image"),R&&(R.textContent="Upload 4-Member QR Image"),z&&(z.textContent="✦ DEFAULT PRE-CONFIGURED PAYMENT QRS ACTIVE"),r&&(r.textContent="✓ Restored default payment QR codes.",r.style.color="var(--green)"))}catch(n){r&&(r.textContent="✕ Reset failed: "+n.message,r.style.color="var(--red)")}finally{H.disabled=!1}}});
