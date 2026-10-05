import"./modulepreload-polyfill-B5Qt9EMX.js";let t=null,r=null,f="";function o(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const p=document.getElementById("sec-login"),O=document.getElementById("sec-dashboard"),P=document.getElementById("form-leader-login"),h=document.getElementById("login-err"),b=document.getElementById("btn-logout"),v=document.getElementById("btn-refresh");function S(){try{localStorage.removeItem("infinity_leader_auth");const e=sessionStorage.getItem("infinity_leader_auth");if(!e)return"";const n=JSON.parse(e);return n.token||(typeof n=="string"?n:"")}catch{return""}}async function H(){const e=S();if(!e){p.style.display="block";return}try{const n=await fetch("/api/teams/me",{headers:{Authorization:`Bearer ${e}`}}),s=await n.json();if(!n.ok||!s.success){sessionStorage.removeItem("infinity_leader_auth"),p.style.display="block";return}f=e,t=s.team,r=s.domainInfo,I()}catch(n){console.error("Session restore failed:",n),p.style.display="block"}}async function z(e,n,s=!1){s||(h.style.display="none");try{const l=await fetch("/api/teams/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,password:n})}),i=await l.json();if(!l.ok||!i.success)throw new Error(i.error||"Authentication failed.");f=i.token,t=i.team,r=i.domainInfo;try{sessionStorage.setItem("infinity_leader_auth",JSON.stringify({token:i.token})),localStorage.removeItem("infinity_leader_auth")}catch{}return I(),!0}catch(l){if(!s)h.textContent=l.message,h.style.display="block";else try{sessionStorage.removeItem("infinity_leader_auth"),localStorage.removeItem("infinity_leader_auth")}catch{}return!1}}v.addEventListener("click",async()=>{v.classList.add("spinning");try{const e=f||S();if(e){const s=await(await fetch("/api/teams/me",{headers:{Authorization:`Bearer ${e}`}})).json();s.success?(f=e,t=s.team,r=s.domainInfo,I()):(sessionStorage.removeItem("infinity_leader_auth"),window.location.reload())}else window.location.reload()}catch(e){console.error("Leader portal refresh failed:",e)}finally{setTimeout(()=>{v.classList.remove("spinning")},500)}});P.addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("txt-email").value.trim(),s=document.getElementById("txt-password").value;await z(n,s,!1)});b.addEventListener("click",()=>{try{sessionStorage.removeItem("infinity_leader_auth"),localStorage.removeItem("infinity_leader_auth")}catch{}t=null,r=null,f="",O.style.display="none",p.style.display="block",b.style.display="none"});H();function I(){var l,i,a,c,d,g,u,T,k,L,w,B,N,C,$,A,M,_,R;p.style.display="none",O.style.display="block",b.style.display="inline-block",document.getElementById("dash-team-id").textContent=t.id,document.getElementById("dash-team-name").textContent=t.teamName,document.getElementById("dash-college").textContent=t.college,document.getElementById("dash-team-size").textContent=`${t.teamSize} Members`,document.getElementById("dash-room").textContent=t.roomAllocated||"Lab Block 3";const e=(t.preferredDomain||"mind").toUpperCase();document.getElementById("dash-domain-tag").textContent=`${e} STONE // ${(r==null?void 0:r.domainName)||""}`;const n=document.getElementById("dash-payment-badge");((l=t.payment)==null?void 0:l.status)==="verified"?n.innerHTML=`<div class="status-badge status-verified">✓ PAYMENT VERIFIED (UTR: ${o(t.payment.utr||"N/A")})</div>`:n.innerHTML=`<div class="status-badge status-pending">⏳ PAYMENT UNDER VERIFICATION (UTR: ${o(((i=t.payment)==null?void 0:i.utr)||"N/A")})</div>`,m("status-r1",(c=(a=t.reviews)==null?void 0:a.r1)==null?void 0:c.attended),m("status-r2",(g=(d=t.reviews)==null?void 0:d.r2)==null?void 0:g.attended),m("status-r3",(T=(u=t.reviews)==null?void 0:u.r3)==null?void 0:T.attended),m("status-r4",((L=(k=t.reviews)==null?void 0:k.r4)==null?void 0:L.attended)||t.isTop6),m("food-dinner",(B=(w=t.food)==null?void 0:w.dinner)==null?void 0:B.collected),m("food-breakfast",(C=(N=t.food)==null?void 0:N.breakfast)==null?void 0:C.collected),m("food-lunch",(A=($=t.food)==null?void 0:$.lunch)==null?void 0:A.collected);const s=document.getElementById("roster-list");s.innerHTML=`
        <div class="member-row">
          <div>
            <strong>${o(((M=t.leader)==null?void 0:M.name)||"Leader")}</strong>
            <div style="font-size:0.7rem; color:#999;">${o(((_=t.leader)==null?void 0:_.email)||"")} • ${o(((R=t.leader)==null?void 0:R.phone)||"")}</div>
          </div>
          <span class="m-role">TEAM LEADER</span>
        </div>
      `,(t.members||[]).forEach((E,x)=>{s.innerHTML+=`
          <div class="member-row">
            <div>
              <strong>${o(E.name||"Member "+(x+2))}</strong>
              <div style="font-size:0.7rem; color:#999;">${o(E.email||"")} • ${o(E.phone||"")}</div>
            </div>
            <span class="m-role">MEMBER 0${x+2}</span>
          </div>
        `}),y()}function m(e,n){const s=document.getElementById(e);s&&(n?(s.className="badge-check badge-done",s.textContent="RECEIVED / ATTENDED"):(s.className="badge-check badge-wait",s.textContent="PENDING"))}function y(){const e=document.getElementById("ps-container"),n=document.getElementById("ps-status-pill");if(!(r==null?void 0:r.isPsReleased)){n.textContent="RELEASE STATUS: LOCKED",n.style.color="#ffd000",e.innerHTML=`
          <div class="ps-locked-box">
            <div class="lock-icon">🔒</div>
            <h4 class="lock-title">PROBLEM STATEMENTS LOCKED</h4>
            <p class="lock-sub">
              Classified problem statements for the <strong>${o((r==null?void 0:r.domainName)||"")}</strong> domain will be unlocked by the organizer command post 1 to 2 days prior to hackathon kickoff.
            </p>
          </div>
        `;return}n.textContent="RELEASE STATUS: UNLOCKED",n.style.color="#00ff88";const l=r.problemStatements||[];if(l.length===0){e.innerHTML='<p style="color:#aaa; font-size:0.85rem;">No problem statements uploaded yet for this domain.</p>';return}let i="";l.forEach(a=>{var d;const c=((d=t.selectedProblemStatement)==null?void 0:d.id)===a.id;i+=`
          <div class="ps-card ${c?"selected":""}">
            <div class="ps-meta-row">
              <span class="ps-code">${o(a.code)}</span>
              <span class="ps-diff">${o(a.difficulty)}</span>
            </div>
            <h4 class="ps-title">${o(a.title)}</h4>
            <p class="ps-desc">${o(a.description)}</p>
            <button class="btn-select-ps ${c?"active":""}" data-ps-id="${o(a.id)}">
              ${c?"✓ CHOSEN PROBLEM STATEMENT":"SELECT THIS STATEMENT"}
            </button>
          </div>
        `}),e.innerHTML=i,e.querySelectorAll(".btn-select-ps").forEach(a=>{a.addEventListener("click",async()=>{const c=a.getAttribute("data-ps-id");a.textContent="Locking selection...";try{const d=f||S(),u=await(await fetch("/api/teams/update-selection",{method:"POST",headers:{"Content-Type":"application/json",...d?{Authorization:`Bearer ${d}`}:{}},body:JSON.stringify({problemStatementId:c})})).json();u.success?(t=u.team,y()):(alert("Selection update failed: "+(u.error||"Unknown error")),y())}catch(d){alert("Error selecting problem statement: "+d.message),y()}})})}
