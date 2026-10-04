import"./modulepreload-polyfill-B5Qt9EMX.js";let f=[],$="all",F="";const b=document.getElementById("sec-login"),k=document.getElementById("sec-dashboard"),q=document.getElementById("form-coord-login"),u=document.getElementById("login-err"),g=document.getElementById("btn-logout"),v=document.getElementById("btn-refresh");function c(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function H(){try{const t=sessionStorage.getItem("infinity_coord_auth");if(!t)return"";const a=JSON.parse(t);return a.token||(typeof a=="string"?a:"")}catch{return""}}function M(t={}){const a=H();return{...t,...a?{Authorization:`Bearer ${a}`}:{}}}v.addEventListener("click",async()=>{v.classList.add("spinning");try{k.style.display!=="none"?await E():window.location.reload()}catch(t){console.error("Coordinator refresh failed:",t)}finally{setTimeout(()=>{v.classList.remove("spinning")},500)}});const w=document.getElementById("teams-tbody"),J=document.getElementById("search-teams");async function P(t,a=!1){a||(u.style.display="none");try{const n=await fetch("/api/coordinator/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:t})}),e=await n.json();if(!n.ok||!e.success)throw new Error(e.error||"Invalid coordinator passphrase.");return sessionStorage.setItem("infinity_coord_auth",JSON.stringify({token:e.token})),b.style.display="none",k.style.display="block",g.style.display="inline-block",await E(),!0}catch(n){return a?sessionStorage.removeItem("infinity_coord_auth"):(u.textContent=n.message,u.style.display="block"),!1}}q.addEventListener("submit",async t=>{t.preventDefault();const a=document.getElementById("txt-passcode").value;await P(a,!1)});g.addEventListener("click",()=>{sessionStorage.removeItem("infinity_coord_auth"),k.style.display="none",b.style.display="block",g.style.display="none"});const O=sessionStorage.getItem("infinity_coord_auth");if(O)try{const t=JSON.parse(O);t.token?(b.style.display="none",k.style.display="block",g.style.display="inline-block",E()):t.password&&P(t.password,!0)}catch{}async function E(){try{const t=await fetch("/api/coordinator/teams",{headers:M()});if(t.status===401){sessionStorage.removeItem("infinity_coord_auth"),k.style.display="none",b.style.display="block",g.style.display="none",u.textContent="Coordinator session expired. Please enter passphrase.",u.style.display="block";return}f=(await t.json()).teams||[],L(),j()}catch(t){console.error("Error fetching coordinator teams:",t)}}function j(){document.getElementById("kpi-total-teams").textContent=f.length;let t=0,a=0,n=0;f.forEach(e=>{var d,l,h,r,p,i,y,s,m;(l=(d=e.reviews)==null?void 0:d.r1)!=null&&l.attended&&t++,(r=(h=e.reviews)==null?void 0:h.r2)!=null&&r.attended&&a++;const o=e.food||{};(p=o.highTea)!=null&&p.collected&&n++,(i=o.dinner)!=null&&i.collected&&n++,(y=o.midnightFuel)!=null&&y.collected&&n++,(s=o.breakfast)!=null&&s.collected&&n++,(m=o.lunch)!=null&&m.collected&&n++}),document.getElementById("kpi-r1-attended").textContent=t,document.getElementById("kpi-r2-attended").textContent=a,document.getElementById("kpi-meals-served").textContent=n}function L(){const t=F.toLowerCase(),a=f.filter(e=>{var l;const o=$==="all"||e.preferredDomain&&e.preferredDomain.toLowerCase()===$,d=!t||e.teamName&&e.teamName.toLowerCase().includes(t)||e.id&&e.id.toLowerCase().includes(t)||e.college&&e.college.toLowerCase().includes(t)||((l=e.leader)==null?void 0:l.email)&&e.leader.email.toLowerCase().includes(t);return o&&d});if(a.length===0){w.innerHTML='<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">No teams found matching filter criteria.</td></tr>';return}let n="";a.forEach(e=>{var l,h,r,p,i,y,s,m,I,C,x,S,T,B,_,A,N,D;const o=e.food||{},d=e.reviews||{};n+=`
          <tr data-team-id="${c(e.id)}">
            <td>
              <div class="team-cell-title">${c(e.teamName)} <span class="font-mono" style="color:var(--cyan); font-size:0.7rem;">(${c(e.id)})</span></div>
              <div class="team-cell-sub">${c(e.college)} • Leader: ${c(((l=e.leader)==null?void 0:l.name)||"N/A")} (${c(((h=e.leader)==null?void 0:h.phone)||"")})</div>
            </td>
            <td>
              <span class="portal-badge">${c((e.preferredDomain||"MIND").toUpperCase())}</span>
              <div class="team-cell-sub">${c(e.roomAllocated||"Lab Block 3")}</div>
            </td>
            <td>
              <div class="chip-group">
                <label class="check-chip ${(r=o.highTea)!=null&&r.collected?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="food" data-key="highTea" ${(p=o.highTea)!=null&&p.collected?"checked":""}>
                  High Tea
                </label>
                <label class="check-chip ${(i=o.dinner)!=null&&i.collected?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="food" data-key="dinner" ${(y=o.dinner)!=null&&y.collected?"checked":""}>
                  Dinner
                </label>
                <label class="check-chip ${(s=o.midnightFuel)!=null&&s.collected?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="food" data-key="midnightFuel" ${(m=o.midnightFuel)!=null&&m.collected?"checked":""}>
                  Midnight
                </label>
                <label class="check-chip ${(I=o.breakfast)!=null&&I.collected?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="food" data-key="breakfast" ${(C=o.breakfast)!=null&&C.collected?"checked":""}>
                  Breakfast
                </label>
                <label class="check-chip ${(x=o.lunch)!=null&&x.collected?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="food" data-key="lunch" ${(S=o.lunch)!=null&&S.collected?"checked":""}>
                  Lunch
                </label>
              </div>
            </td>
            <td>
              <div class="chip-group">
                <label class="check-chip ${(T=d.r1)!=null&&T.attended?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="review" data-key="r1" ${(B=d.r1)!=null&&B.attended?"checked":""}>
                  R1: Idea
                </label>
                <label class="check-chip ${(_=d.r2)!=null&&_.attended?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="review" data-key="r2" ${(A=d.r2)!=null&&A.attended?"checked":""}>
                  R2: Logic
                </label>
                <label class="check-chip ${(N=d.r3)!=null&&N.attended?"checked":""}">
                  <input type="checkbox" data-team="${c(e.id)}" data-type="review" data-key="r3" ${(D=d.r3)!=null&&D.attended?"checked":""}>
                  R3: Pitch
                </label>
              </div>
            </td>
          </tr>
        `}),w.innerHTML=n,w.querySelectorAll('input[type="checkbox"]').forEach(e=>{e.addEventListener("change",async o=>{const d=e.getAttribute("data-team"),l=e.getAttribute("data-type"),h=e.getAttribute("data-key"),r=e.checked,p=e.closest(".check-chip");p.classList.toggle("checked",r);try{const i=await fetch("/api/coordinator/mark",{method:"POST",headers:M({"Content-Type":"application/json"}),body:JSON.stringify({teamId:d,type:l,key:h,value:r})});if(i.status===401){alert("Coordinator session expired. Please log in again."),window.location.reload();return}const y=await i.json();if(!i.ok||!y.success)throw new Error(y.error||"Failed to update status.");const s=f.find(m=>m.id===d);s&&(l==="food"?(s.food||(s.food={}),s.food[h]={collected:r}):l==="review"&&(s.reviews||(s.reviews={}),s.reviews[h]={attended:r})),j()}catch(i){console.error("Error saving checkmark:",i),e.checked=!r,p.classList.toggle("checked",!r),alert(i.message||"Error updating status")}})})}J.addEventListener("input",t=>{F=t.target.value,L()});document.querySelectorAll("#domain-filters .f-pill").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#domain-filters .f-pill").forEach(a=>a.classList.remove("active")),t.classList.add("active"),$=t.getAttribute("data-domain"),L()})});
