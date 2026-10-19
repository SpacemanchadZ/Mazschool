/* MAZ School cloud sync: keeps learners, stars and finished weeks the same on every device signed in with the family Google account. */
(function(){
  const CONFIG = {
    apiKey: "AIzaSyCKKVMdagOyyrjKVqoh4nG917xSuSB_QJY",
    authDomain: "mazschool.firebaseapp.com",
    projectId: "mazschool",
    storageBucket: "mazschool.firebasestorage.app",
    messagingSenderId: "958951519037",
    appId: "1:958951519037:web:c7454b1c0ad0cdf9c7cb54"
  };
  const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  const DKEY = "maz-data";
  const ls = window.localStorage;
  const origSet = ls.setItem.bind(ls);

  /* ---------- merging two copies of the progress data ---------- */
  const blank = () => ({users:[], current:null, stars:{}, done:{}, doneT:{}, removed:[]});
  function norm(x){ const d = Object.assign(blank(), x || {}); d.users = Array.isArray(d.users) ? d.users : []; d.stars = d.stars || {}; d.done = d.done || {}; d.doneT = d.doneT || {}; d.removed = Array.isArray(d.removed) ? d.removed : []; return d; }
  function merge(localIn, remoteIn){
    const a = norm(localIn), b = norm(remoteIn);
    const removed = [...new Set(a.removed.concat(b.removed))];
    const gone = id => removed.includes(id);
    const users = [], byName = {}, idMap = {};
    const key = n => String(n || "").trim().toLowerCase();
    b.users.forEach(u => { if(gone(u.id)) return; users.push(Object.assign({}, u)); byName[key(u.name)] = u.id; });
    a.users.forEach(u => {
      if(gone(u.id)) return;
      const ex = users.find(x => x.id === u.id);
      if(ex){ if((u.t || 0) > (ex.t || 0)){ Object.keys(ex).forEach(k => delete ex[k]); Object.assign(ex, u); } return; }
      const same = byName[key(u.name)];
      if(same){ idMap[u.id] = same; return; }
      users.push(Object.assign({}, u)); byName[key(u.name)] = u.id;
    });
    const map = id => idMap[id] || id;
    const stars = {};
    [b, a].forEach(src => Object.keys(src.stars).forEach(id => {
      const k = map(id); if(gone(k)) return;
      const t = stars[k] = stars[k] || {};
      Object.keys(src.stars[id] || {}).forEach(s => { t[s] = Math.max(t[s] || 0, +src.stars[id][s] || 0); });
    }));
    const entries = src => { const out = {}; Object.keys(src.done).forEach(id => Object.keys(src.done[id] || {}).forEach(s => Object.keys(src.done[id][s] || {}).forEach(w => { if(src.done[id][s][w]) out[map(id)+"|"+s+"|"+w] = true; }))); return out; };
    const times = src => { const out = {}; Object.keys(src.doneT).forEach(k => { const p = k.split("|"); const mk = map(p[0])+"|"+p[1]+"|"+p[2]; out[mk] = Math.max(out[mk] || 0, +src.doneT[k] || 0); }); return out; };
    const ea = entries(a), eb = entries(b), ta = times(a), tb = times(b);
    const done = {}, doneT = {};
    new Set(Object.keys(ea).concat(Object.keys(eb), Object.keys(ta), Object.keys(tb))).forEach(k => {
      const p = k.split("|"); if(gone(p[0])) return;
      const xa = ta[k] || 0, xb = tb[k] || 0;
      const on = xa > xb ? !!ea[k] : xb > xa ? !!eb[k] : !!(ea[k] || eb[k]);
      if(xa || xb) doneT[k] = Math.max(xa, xb);
      if(on){ done[p[0]] = done[p[0]] || {}; done[p[0]][p[1]] = done[p[0]][p[1]] || {}; done[p[0]][p[1]][p[2]] = true; }
    });
    const fin = {};
    [b, a].forEach(src => Object.keys(src.fin || {}).forEach(id => { const k = map(id); if(gone(k)) return; const t = fin[k] = fin[k] || {}; Object.keys(src.fin[id] || {}).forEach(w => { t[w] = Object.assign(t[w] || {}, src.fin[id][w]); }); }));
    const out = Object.assign({}, b, a, {users, stars, done, doneT, removed, fin});
    let cur = a.current ? map(a.current) : null;
    if(!users.some(u => u.id === cur)) cur = users[0] ? users[0].id : null;
    out.current = cur;
    return out;
  }
  const canon = v => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : (v && typeof v === "object") ? "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}" : JSON.stringify(v === undefined ? null : v);
  const shared = d => { const c = Object.assign({}, d); delete c.current; return canon(c); };
  window.MAZ_MERGE = merge;
  if(window.MAZ_SYNC_TEST) return;

  /* ---------- header button ---------- */
  const st = document.createElement("style");
  st.textContent = ".site-head .cloud{border:none;font:inherit;font-weight:800;font-size:.95rem;border-radius:999px;padding:7px 14px;cursor:pointer;background:var(--surface);color:var(--ink);box-shadow:0 3px 0 var(--line);margin-left:8px;white-space:nowrap}.site-head .cloud.in{background:var(--sun);color:#1F2A5C;box-shadow:0 3px 0 #D9A21B}.site-head .cloud.off{opacity:.75}.site-head .cloud.wait{opacity:.8}.syncnote{margin-top:14px}.syncwarn{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:center;background:#F27BA3;color:#1F2A5C;font-weight:800;padding:10px 16px;text-align:center}.syncwarn button{border:none;font:inherit;font-weight:800;border-radius:999px;padding:7px 14px;cursor:pointer}.syncwarn .go{background:#1F2A5C;color:#fff}.syncwarn .later{background:transparent;color:#1F2A5C;text-decoration:underline}.synctoast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#1F2A5C;color:#fff;font-weight:800;padding:12px 18px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:50;transition:opacity .4s}.syncstat b{color:var(--ink)}@media (max-width:560px){.site-head .cloud{font-size:.85rem;padding:6px 10px}}";
  document.head.appendChild(st);
  const page = document.body.dataset.page;
  let statusHtml = '<b>☁️ Checking sync…</b>';
  const paintStatus = () => { const main = document.getElementById("main"); if(page !== "stars" || !main) return; let el = main.querySelector(".syncnote"); if(!el){ main.insertAdjacentHTML("beforeend", '<div class="card notice syncnote syncstat"></div>'); el = main.querySelector(".syncnote"); } if(el.innerHTML !== statusHtml) el.innerHTML = statusHtml; };
  const setStatus = h => { statusHtml = h; paintStatus(); };
  if(page === "stars"){ const main = document.getElementById("main"); paintStatus(); if(main) new MutationObserver(paintStatus).observe(main, {childList:true}); }
  let warn = null;
  const showWarn = on => {
    if(!on){ if(warn){ warn.remove(); warn = null; } return; }
    if(warn || sessionStorage.getItem("maz-warn-hide")) return;
    const head = document.querySelector(".site-head"); if(!head) return;
    warn = document.createElement("div"); warn.className = "syncwarn"; warn.setAttribute("role", "status");
    warn.innerHTML = '<span>⚠️ This device isn’t saving stars to the cloud. They’ll only show up on this device.</span><button class="go" type="button">Sign in to sync</button><button class="later" type="button">Not now</button>';
    head.insertAdjacentElement("afterend", warn);
    warn.querySelector(".go").onclick = () => btn.click();
    warn.querySelector(".later").onclick = () => { sessionStorage.setItem("maz-warn-hide", "1"); showWarn(false); };
  };
  const toast = t => { const d = document.createElement("div"); d.className = "synctoast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => { d.style.opacity = "0"; }, 3500); setTimeout(() => d.remove(), 4000); };
  if(sessionStorage.getItem("maz-sync-toast")){ sessionStorage.removeItem("maz-sync-toast"); setTimeout(() => toast("⭐ Updated with new progress from another device"), 400); }
  const fmtTime = d => d ? d.toLocaleString([], {weekday:"short", hour:"numeric", minute:"2-digit"}) : "";
  const chip = document.getElementById("whoChip");
  const btn = document.createElement("button");
  btn.className = "cloud"; btn.type = "button";
  if(chip) chip.insertAdjacentElement("afterend", btn);
  const show = (t, cls, tip) => { btn.textContent = t; btn.className = "cloud " + (cls || ""); btn.title = tip || ""; };
  show("☁️ …", "wait", "Connecting");

  const load = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  const readLocal = () => { try { return JSON.parse(ls.getItem(DKEY)); } catch(e) { return null; } };

  Promise.all([load(SDK + "firebase-app-compat.js")])
    .then(() => Promise.all([load(SDK + "firebase-auth-compat.js"), load(SDK + "firebase-firestore-compat.js")]))
    .then(start)
    .catch(() => { show("☁️ Offline", "off", "Can’t reach the sync service. Progress is still saved on this device."); setStatus("<b>☁️ Can’t reach the sync service right now.</b> Stars are still saved on this device and will sync once the internet is back."); });

  function start(){
    const app = firebase.initializeApp(CONFIG);
    const auth = firebase.auth(), db = firebase.firestore();
    let user = null, ref = null, remote = null, unsub = null, timer = null, first = true, lastSaved = null;
    const syncedStatus = () => setStatus("<b>☁️ This device is syncing.</b> Signed in as <b>"+(user.email||"")+"</b>"+(lastSaved ? " · last saved "+fmtTime(lastSaved) : "")+". Stars and finished weeks update on every device signed in with this account.");

    function push(){
      if(!ref) return;
      const local = readLocal(); if(!local) return;
      const merged = merge(local, remote);
      if(canon(merged) !== canon(local)) { origSet(DKEY, JSON.stringify(merged)); window.MAZ_API && MAZ_API.reload && MAZ_API.reload(); }
      if(remote && shared(merged) === shared(norm(remote))) { show("☁️ Synced", "on", "Signed in as " + user.email + ". Tap to sign out."); syncedStatus(); return; }
      const c = Object.assign({}, merged); delete c.current;
      show("☁️ Saving…", "on wait", "Saving");
      ref.set({ data: JSON.stringify(c), updated: firebase.firestore.FieldValue.serverTimestamp(), by: user.email || "" })
        .then(() => { lastSaved = new Date(); show("☁️ Synced", "on", "Signed in as " + user.email + ". Tap to sign out."); syncedStatus(); })
        .catch(() => { show("☁️ Not synced", "off", "Couldn’t save to the cloud. Progress is still saved on this device."); setStatus("<b>☁️ Couldn’t save to the cloud just now.</b> Stars are still saved on this device. It will try again the next time progress is saved."); });
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(push, 1200); };

    ls.setItem = function(k, v){ origSet(k, v); if(k === DKEY && ref) schedule(); };

    auth.onAuthStateChanged(u => {
      if(unsub){ unsub(); unsub = null; }
      user = u; ref = null; remote = null; first = true;
      if(!u){ show("☁️ Sign in to sync", "in", "Sign in with Google to keep stars the same on every device"); showWarn(true); setStatus("<b>⚠️ This device isn’t syncing.</b> Stars earned here stay on this device only. Tap <b>Sign in to sync</b> at the top and choose the family Google account (the same one on every device)."); return; }
      showWarn(false);
      show("☁️ Syncing…", "on wait", "Syncing");
      ref = db.collection("families").doc(u.uid);
      unsub = ref.onSnapshot(snap => {
        if(snap.metadata.hasPendingWrites) return;
        try { remote = snap.exists ? JSON.parse(snap.data().data || "null") : null; const up = snap.exists && snap.data().updated; if(up && up.toDate) lastSaved = up.toDate(); } catch(e) { remote = null; }
        const local = readLocal();
        const merged = merge(local, remote);
        const changed = canon(merged) !== canon(norm(local));
        if(changed) origSet(DKEY, JSON.stringify(merged));
        if(first && changed && !sessionStorage.getItem("maz-sync-reloaded")){
          sessionStorage.setItem("maz-sync-reloaded", "1");
          if(!remote || shared(merged) !== shared(norm(remote))) push();
          setTimeout(() => location.reload(), 900);
          return;
        }
        const wasFirst = first; first = false;
        if(changed && !wasFirst){
          const busy = page === "lesson" || page === "game" || (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName));
          if(!busy){ sessionStorage.setItem("maz-sync-toast", "1"); setTimeout(() => location.reload(), 300); return; }
          toast("⭐ New progress from another device");
        }
        if(changed && window.MAZ_API && MAZ_API.reload) MAZ_API.reload();
        push();
      }, () => { show("☁️ Not synced", "off", "Couldn’t reach your family’s saved progress."); setStatus("<b>☁️ Couldn’t reach your family’s saved progress.</b> Try reloading the page. Stars are still saved on this device."); });
    });

    btn.onclick = () => {
      if(!user){
        const p = new firebase.auth.GoogleAuthProvider();
        p.setCustomParameters({prompt: "select_account"});
        auth.signInWithPopup(p).catch(e => {
          if(e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) auth.signInWithRedirect(p);
        });
        return;
      }
      if(confirm("Signed in as " + user.email + ".\n\nSign out on this device? Stars stay saved in the cloud and on this device.")) auth.signOut();
    };
  }
})();
