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
    const out = Object.assign({}, b, a, {users, stars, done, doneT, removed});
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
  st.textContent = ".site-head .cloud{border:none;font:inherit;font-weight:800;font-size:.95rem;border-radius:999px;padding:7px 14px;cursor:pointer;background:var(--surface);color:var(--ink);box-shadow:0 3px 0 var(--line);margin-left:8px;white-space:nowrap}.site-head .cloud.in{background:var(--sun);color:#1F2A5C;box-shadow:0 3px 0 #D9A21B}.site-head .cloud.off{opacity:.75}.site-head .cloud.wait{opacity:.8}.syncnote{margin-top:14px}@media (max-width:560px){.site-head .cloud{font-size:.85rem;padding:6px 10px}}";
  document.head.appendChild(st);
  if(document.body.dataset.page === "stars"){
    const main = document.getElementById("main");
    const note = () => { if(!main || main.querySelector(".syncnote")) return; main.insertAdjacentHTML("beforeend", '<div class="card notice syncnote"><b>☁️ Same stars on every device.</b> Tap <b>Sign in to sync</b> at the top and choose the family Google account. Do this once on each device the boys use. After that, stars and finished weeks save to the cloud on their own.</div>'); };
    note(); if(main) new MutationObserver(note).observe(main, {childList:true});
  }
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
    .catch(() => show("☁️ Offline", "off", "Can’t reach the sync service. Progress is still saved on this device."));

  function start(){
    const app = firebase.initializeApp(CONFIG);
    const auth = firebase.auth(), db = firebase.firestore();
    let user = null, ref = null, remote = null, unsub = null, timer = null, first = true;

    function push(){
      if(!ref) return;
      const local = readLocal(); if(!local) return;
      const merged = merge(local, remote);
      if(canon(merged) !== canon(local)) { origSet(DKEY, JSON.stringify(merged)); window.MAZ_API && MAZ_API.reload && MAZ_API.reload(); }
      if(remote && shared(merged) === shared(norm(remote))) { show("☁️ Synced", "on", "Signed in as " + user.email + ". Tap to sign out."); return; }
      const c = Object.assign({}, merged); delete c.current;
      show("☁️ Saving…", "on wait", "Saving");
      ref.set({ data: JSON.stringify(c), updated: firebase.firestore.FieldValue.serverTimestamp(), by: user.email || "" })
        .then(() => show("☁️ Synced", "on", "Signed in as " + user.email + ". Tap to sign out."))
        .catch(() => show("☁️ Not synced", "off", "Couldn’t save to the cloud. Progress is still saved on this device."));
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(push, 1200); };

    ls.setItem = function(k, v){ origSet(k, v); if(k === DKEY && ref) schedule(); };

    auth.onAuthStateChanged(u => {
      if(unsub){ unsub(); unsub = null; }
      user = u; ref = null; remote = null; first = true;
      if(!u){ show("☁️ Sign in to sync", "in", "Sign in with Google to keep stars the same on every device"); return; }
      show("☁️ Syncing…", "on wait", "Syncing");
      ref = db.collection("families").doc(u.uid);
      unsub = ref.onSnapshot(snap => {
        if(snap.metadata.hasPendingWrites) return;
        try { remote = snap.exists ? JSON.parse(snap.data().data || "null") : null; } catch(e) { remote = null; }
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
        first = false;
        if(changed && window.MAZ_API && MAZ_API.reload) MAZ_API.reload();
        push();
      }, () => show("☁️ Not synced", "off", "Couldn’t reach your family’s saved progress."));
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
