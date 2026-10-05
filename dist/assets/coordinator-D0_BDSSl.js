import"./modulepreload-polyfill-B5Qt9EMX.js";let p=[],T="all",x="all",Q="";const M=[{key:"highTea",name:"High Tea"},{key:"dinner",name:"Dinner"},{key:"midnightFuel",name:"Midnight"},{key:"breakfast",name:"Breakfast"},{key:"lunch",name:"Lunch"}],I=document.getElementById("sec-login"),$=document.getElementById("sec-dashboard"),X=document.getElementById("form-coord-login"),w=document.getElementById("login-err"),E=document.getElementById("btn-logout"),N=document.getElementById("btn-refresh");function i(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function Y(){try{const t=sessionStorage.getItem("infinity_coord_auth");if(!t)return"";const a=JSON.parse(t);return a.token||(typeof a=="string"?a:"")}catch{return""}}function S(t={}){const a=Y();return{...t,...a?{Authorization:`Bearer ${a}`}:{}}}N.addEventListener("click",async()=>{N.classList.add("spinning");try{$.style.display!=="none"?await _():window.location.reload()}catch(t){console.error("Coordinator refresh failed:",t)}finally{setTimeout(()=>{N.classList.remove("spinning")},500)}});const v=document.getElementById("teams-tbody"),Z=document.getElementById("search-teams");async function U(t,a=!1){a||(w.style.display="none");try{const c=await fetch("/api/coordinator/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:t})}),e=await c.json();if(!c.ok||!e.success)throw new Error(e.error||"Invalid coordinator passphrase.");return sessionStorage.setItem("infinity_coord_auth",JSON.stringify({token:e.token})),I.style.display="none",$.style.display="block",E.style.display="inline-block",await _(),!0}catch(c){return a?sessionStorage.removeItem("infinity_coord_auth"):(w.textContent=c.message,w.style.display="block"),!1}}X.addEventListener("submit",async t=>{t.preventDefault();const a=document.getElementById("txt-passcode").value;await U(a,!1)});E.addEventListener("click",()=>{sessionStorage.removeItem("infinity_coord_auth"),$.style.display="none",I.style.display="block",E.style.display="none"});const K=sessionStorage.getItem("infinity_coord_auth");if(K)try{const t=JSON.parse(K);t.token?(I.style.display="none",$.style.display="block",E.style.display="inline-block",_()):t.password&&U(t.password,!0)}catch{}async function _(){try{const t=await fetch("/api/coordinator/teams",{headers:S()});if(t.status===401){sessionStorage.removeItem("infinity_coord_auth"),$.style.display="none",I.style.display="block",E.style.display="none",w.textContent="Coordinator session expired. Please enter passphrase.",w.style.display="block";return}p=(await t.json()).teams||[],k(),A()}catch(t){console.error("Error fetching coordinator teams:",t)}}function V(t,a){if(!t||typeof t!="string")return a;const c=t.trim();if(!c)return a;const e=c.split(" ")[0];return e.length>8?e.slice(0,7)+"…":e}function A(){document.getElementById("kpi-total-teams").textContent=p.length;let t=0,a=0,c=0;p.forEach(e=>{var o,u,d,l;(u=(o=e.reviews)==null?void 0:o.r1)!=null&&u.attended&&t++,(l=(d=e.reviews)==null?void 0:d.r2)!=null&&l.attended&&a++;const m=e.food||{},s=e.teamSize||(e.members?e.members.length+1:4);M.forEach(n=>{const r=m[n.key];(r==null?void 0:r.count)!==void 0?c+=r.count:r!=null&&r.collected&&(c+=s)})}),document.getElementById("kpi-r1-attended").textContent=t,document.getElementById("kpi-r2-attended").textContent=a,document.getElementById("kpi-meals-served").textContent=c}function k(){const t=Q.toLowerCase(),a=p.filter(e=>{var o;const m=T==="all"||e.preferredDomain&&e.preferredDomain.toLowerCase()===T,s=!t||e.teamName&&e.teamName.toLowerCase().includes(t)||e.id&&e.id.toLowerCase().includes(t)||e.college&&e.college.toLowerCase().includes(t)||((o=e.leader)==null?void 0:o.email)&&e.leader.email.toLowerCase().includes(t);return m&&s});if(a.length===0){v.innerHTML='<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">No teams found matching filter criteria.</td></tr>';return}let c="";a.forEach(e=>{var r,h,L,q,D,O,P,j,H,J;const m=e.food||{},s=e.reviews||{},o=e.teamSize||(e.members?e.members.length+1:4),u=[{role:"L",fullName:((r=e.leader)==null?void 0:r.name)||"Leader",shortName:V((h=e.leader)==null?void 0:h.name,"Leader")}],d=Array.isArray(e.members)?e.members:[];for(let y=1;y<o;y++){const g=d[y-1]||{},f=`M${y+1}`;u.push({role:f,fullName:g.name||f,shortName:V(g.name,f)})}let l='<div class="food-meals-list">';(x==="all"?M:M.filter(y=>y.key===x)).forEach(y=>{const g=m[y.key]||{};let f=[];for(Array.isArray(g.members)?f=g.members:g.collected?f=Array(o).fill(!0):f=Array(o).fill(!1);f.length<o;)f.push(!1);const B=f.slice(0,o).filter(Boolean).length,b=B===o,G=B>0&&!b,W=b?"all-done":G?"has-some":"";let z="";u.forEach((C,F)=>{const R=!!f[F];z+=`
              <button type="button" class="member-food-chip ${R?"checked":""}"
                data-team="${i(e.id)}"
                data-meal="${y.key}"
                data-member="${F}"
                title="${i(C.role)}: ${i(C.fullName)} (Click to toggle)">
                ${R?"✓ ":""}${i(C.role)}: ${i(C.shortName)}
              </button>
            `}),l+=`
            <div class="meal-check-group ${b?"all-served":""}">
              <div class="meal-header">
                <span class="meal-name">${i(y.name)}</span>
                <button type="button" class="btn-meal-all"
                  data-team="${i(e.id)}"
                  data-meal="${y.key}"
                  data-action="${b?"unmark-all":"mark-all"}"
                  title="Click to ${b?"unmark":"mark"} all ${o} members">
                  <span class="meal-count-badge ${W}">${B}/${o}</span>
                </button>
              </div>
              <div class="meal-members-chips">
                ${z}
              </div>
            </div>
          `}),l+="</div>",c+=`
          <tr data-team-id="${i(e.id)}">
            <td>
              <div class="team-cell-title">${i(e.teamName)} <span class="font-mono" style="color:var(--cyan); font-size:0.7rem;">(${i(e.id)})</span></div>
              <div class="team-cell-sub">${i(e.college)} • Leader: ${i(((L=e.leader)==null?void 0:L.name)||"N/A")} (${i(((q=e.leader)==null?void 0:q.phone)||"")})</div>
            </td>
            <td>
              <span class="portal-badge">${i((e.preferredDomain||"MIND").toUpperCase())}</span>
              <div class="team-cell-sub">${i(e.roomAllocated||"Lab Block 3")}</div>
            </td>
            <td>
              ${l}
            </td>
            <td>
              <div class="chip-group">
                <label class="check-chip ${(D=s.r1)!=null&&D.attended?"checked":""}">
                  <input type="checkbox" data-team="${i(e.id)}" data-type="review" data-key="r1" ${(O=s.r1)!=null&&O.attended?"checked":""}>
                  R1: Idea
                </label>
                <label class="check-chip ${(P=s.r2)!=null&&P.attended?"checked":""}">
                  <input type="checkbox" data-team="${i(e.id)}" data-type="review" data-key="r2" ${(j=s.r2)!=null&&j.attended?"checked":""}>
                  R2: Logic
                </label>
                <label class="check-chip ${(H=s.r3)!=null&&H.attended?"checked":""}">
                  <input type="checkbox" data-team="${i(e.id)}" data-type="review" data-key="r3" ${(J=s.r3)!=null&&J.attended?"checked":""}>
                  R3: Pitch
                </label>
              </div>
            </td>
          </tr>
        `}),v.innerHTML=c,v.querySelectorAll(".member-food-chip").forEach(e=>{e.addEventListener("click",async m=>{m.preventDefault();const s=e.getAttribute("data-team"),o=e.getAttribute("data-meal"),u=parseInt(e.getAttribute("data-member"),10),l=!e.classList.contains("checked");e.disabled=!0;try{const n=await fetch("/api/coordinator/mark",{method:"POST",headers:S({"Content-Type":"application/json"}),body:JSON.stringify({teamId:s,type:"food",key:o,memberIndex:u,value:l})});if(n.status===401){alert("Coordinator session expired. Please log in again."),window.location.reload();return}const r=await n.json();if(!n.ok||!r.success)throw new Error(r.error||"Failed to update member food status.");const h=p.find(L=>L.id===s);h&&r.team&&Object.assign(h,r.team),k(),A()}catch(n){console.error("Error saving member food checkmark:",n),alert(n.message||"Error updating status"),e.disabled=!1}})}),v.querySelectorAll(".btn-meal-all").forEach(e=>{e.addEventListener("click",async m=>{m.preventDefault();const s=e.getAttribute("data-team"),o=e.getAttribute("data-meal"),d=e.getAttribute("data-action")==="mark-all";e.disabled=!0;try{const l=await fetch("/api/coordinator/mark",{method:"POST",headers:S({"Content-Type":"application/json"}),body:JSON.stringify({teamId:s,type:"food",key:o,value:d})});if(l.status===401){alert("Coordinator session expired. Please log in again."),window.location.reload();return}const n=await l.json();if(!l.ok||!n.success)throw new Error(n.error||"Failed to update squad food status.");const r=p.find(h=>h.id===s);r&&n.team&&Object.assign(r,n.team),k(),A()}catch(l){console.error("Error updating all food checkmarks:",l),alert(l.message||"Error updating status"),e.disabled=!1}})}),v.querySelectorAll('input[data-type="review"]').forEach(e=>{e.addEventListener("change",async()=>{const m=e.getAttribute("data-team"),s=e.getAttribute("data-key"),o=e.checked,u=e.closest(".check-chip");u.classList.toggle("checked",o);try{const d=await fetch("/api/coordinator/mark",{method:"POST",headers:S({"Content-Type":"application/json"}),body:JSON.stringify({teamId:m,type:"review",key:s,value:o})});if(d.status===401){alert("Coordinator session expired. Please log in again."),window.location.reload();return}const l=await d.json();if(!d.ok||!l.success)throw new Error(l.error||"Failed to update review status.");const n=p.find(r=>r.id===m);n&&(n.reviews||(n.reviews={}),n.reviews[s]={attended:o}),A()}catch(d){console.error("Error saving review checkmark:",d),e.checked=!o,u.classList.toggle("checked",!o),alert(d.message||"Error updating status")}})})}Z.addEventListener("input",t=>{Q=t.target.value,k()});document.querySelectorAll("#domain-filters .f-pill").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#domain-filters .f-pill").forEach(a=>a.classList.remove("active")),t.classList.add("active"),T=t.getAttribute("data-domain"),k()})});document.querySelectorAll("#meal-filters .f-pill").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#meal-filters .f-pill").forEach(a=>a.classList.remove("active")),t.classList.add("active"),x=t.getAttribute("data-meal"),k()})});
