(function(){
  const C = window.CURRICULUM, A = window.ACTIVITIES || {};
  const root = document.body.dataset.root || "";
  const page = document.body.dataset.page;
  const subjects = ["math","reading","science"];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);

  /* ---------- learners and stars (saved in this browser, never reset by playing) ---------- */
  const DKEY = "maz-data";
  let D = null;
  try { D = JSON.parse(localStorage.getItem(DKEY)); } catch(e) {}
  if(!D || !Array.isArray(D.users)) D = {users:[], current:null, stars:{}, done:{}};
  D.stars = D.stars || {}; D.done = D.done || {};
  let legacy = null; try { legacy = JSON.parse(localStorage.getItem("maz-progress")); } catch(e) {}
  const save = () => { try { localStorage.setItem(DKEY, JSON.stringify(D)); } catch(e) {} };
  try { if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e) {}
  const me = () => D.users.find(u=>u.id===D.current) || null;
  const uid = () => (me() ? me().id : "_guest");
  function addUser(name){
    const u = {id:"u"+Date.now().toString(36)+Math.random().toString(36).slice(2,6), name:name.slice(0,20)};
    D.users.push(u); D.current = u.id;
    if(legacy && !D.legacyUsed){ D.done[u.id] = legacy; D.legacyUsed = true; }
    if(D.stars._guest && !D.guestMoved){ D.stars[u.id] = D.stars._guest; delete D.stars._guest; D.guestMoved = true; }
    save(); return u;
  }
  function best(key, id){ const s = D.stars[id||uid()]; return s && s[key] ? s[key] : 0; }
  function setBest(key, n){ const id = uid(); D.stars[id] = D.stars[id] || {}; if(n > (D.stars[id][key]||0)){ D.stars[id][key] = n; save(); refreshChip(); return true; } return false; }
  function total(id, prefix){ const s = D.stars[id] || {}; return Object.keys(s).filter(k=>!prefix || k.startsWith(prefix)).reduce((a,k)=>a+(s[k]||0),0); }
  const isDone = (s,w,id) => !!(D.done[id||uid()] && D.done[id||uid()][s] && D.done[id||uid()][s][w]);
  function toggleDone(s,w){ const id = uid(); D.done[id] = D.done[id] || {}; D.done[id][s] = D.done[id][s] || {}; if(D.done[id][s][w]) delete D.done[id][s][w]; else D.done[id][s][w] = true; save(); }

  function weeks(s){ const out = []; let n = 0; C[s].units.forEach((u,ui)=>u.w.forEach(w=>{ n++; out.push({n, unit:u.t, ui, title:w[0], goal:w[1], mat:w[2], steps:w[3], qs:w[4], extra:w[5]||{}}); })); return out; }
  const nextWeek = s => { const all = weeks(s); return all.find(w=>!isDone(s,w.n)) || all[all.length-1]; };
  const doneCount = s => weeks(s).filter(w=>isDone(s,w.n)).length;

  /* ---------- header with Home button and learner chip ---------- */
  const current = page === "home" ? "home" : page === "stars" ? "stars" : (page === "teacher" || page === "supplies") ? "teacher" : (document.body.dataset.subject || new URLSearchParams(location.search).get("s"));
  const head = document.createElement("header");
  head.className = "site-head";
  head.innerHTML = '<div class="in"><a class="logo" href="'+root+'index.html" aria-label="MAZ School home"><picture><source srcset="'+root+'assets/logo-light.svg" media="(prefers-color-scheme: dark)"><img src="'+root+'assets/logo.svg" alt="MAZ School"></picture></a>' +
    '<a class="who" id="whoChip" href="'+root+'stars/index.html"></a>' +
    '<nav class="site-nav" aria-label="Main"><a class="home" href="'+root+'index.html"'+(current==="home"?' aria-current="page"':'')+'>🏠 Home</a>' +
    subjects.map(s=>'<a href="'+root+s+'/index.html"'+(current===s?' aria-current="page"':'')+'><span class="dot" style="background:var(--'+s+')"></span>'+C[s].name+'</a>').join("") +
    '<a href="'+root+'stars/index.html"'+(current==="stars"?' aria-current="page"':'')+'>⭐ Stars</a><a href="'+root+'teacher/index.html"'+(current==="teacher"?' aria-current="page"':'')+'>📋 Teacher</a></nav></div>';
  document.body.prepend(head);
  function refreshChip(){ const c = document.getElementById("whoChip"); if(!c) return; const u = me(); c.innerHTML = u ? '<span class="av">'+esc(u.name[0].toUpperCase())+'</span>'+esc(u.name)+' <b>⭐ '+total(u.id)+'</b>' : '👤 Who’s learning?'; c.classList.toggle("empty", !u); }
  refreshChip();
  const foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML = '<img src="'+root+'assets/icon.svg" alt=""><span>© 2026 MAZ School</span>';
  document.body.appendChild(foot);
  const main = document.getElementById("main");

  /* ---------- speech ---------- */
  const canSpeak = "speechSynthesis" in window;
  function speak(t){ if(!canSpeak) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).replace(/___/g,"blank")); u.rate = .9; speechSynthesis.speak(u); } catch(e) {} }
  let actx = null;
  function tone(ok){ try { actx = actx || new (window.AudioContext||window.webkitAudioContext)(); (ok?[523,659,784]:[300,220]).forEach((f,i)=>{ const o=actx.createOscillator(), g=actx.createGain(); o.type="triangle"; o.frequency.value=f; g.gain.setValueAtTime(.15,actx.currentTime+i*.1); g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+i*.1+.25); o.connect(g).connect(actx.destination); o.start(actx.currentTime+i*.1); o.stop(actx.currentTime+i*.1+.3); }); } catch(e) {} }

  /* ---------- practice engine ---------- */
  function buildRounds(s, wn){
    const spec = A[s] && A[s][wn]; if(!spec) return [];
    if(spec.gen) return Array.from({length:spec.n}, ()=>spec.gen());
    const specs = Array.isArray(spec) ? spec : [spec]; let out = [];
    specs.forEach(sp=>{
      if(sp.type==="sort") out = out.concat(shuffle(sp.items).slice(0,8).map(it=>({t:"sort", bins:sp.bins, item:it[0], a:it[1], say:sp.say})));
      if(sp.type==="mcq") out = out.concat(shuffle(sp.items).slice(0,8).map(it=>{ const o = shuffle(it[1]); return {t:"mcq", q:it[0], opts:o, a:o.indexOf(it[1][0])}; }));
      if(sp.type==="build") out = out.concat(shuffle(sp.words).slice(0,6).map(w=>({t:"build", word:w})));
      if(sp.type==="order") out = out.concat(sp.sets.map(st=>({t:"order", q:st.q, items:st.items})));
    });
    if(out.length < 8){ const seen = new Set(out.map(keyOf)); extraPool(s, wn).forEach(r=>{ const k = keyOf(r); if(out.length < 8 && !seen.has(k)){ out.push(r); seen.add(k); } }); }
    return out;
  }
  function misspell(w){ const o = new Set(); let g = 0; while(o.size < 2 && g++ < 60){ const k = Math.floor(Math.random()*w.length), t = Math.random(); let m; if(t < .34 && w.length > 2){ const i = Math.min(k, w.length-2); m = w.slice(0,i)+w[i+1]+w[i]+w.slice(i+2); } else if(t < .67){ m = w.slice(0,k)+w[k]+w.slice(k); } else { m = w.slice(0,k)+w.slice(k+1); } if(m !== w && m.length) o.add(m); } return [...o]; }
  function mcqR(q,c,wr,vis){ const o = shuffle([c].concat(wr.filter(x=>String(x)!==String(c))).map(String)); return {t:"mcq", q, opts:o, a:o.indexOf(String(c)), vis}; }
  function extraPool(s, wn){
    const spec = A[s] && A[s][wn]; if(!spec) return [];
    if(spec.gen) return Array.from({length:12}, ()=>{ const r = spec.gen(); if(r.t === "num"){ const T = window.MAZ_TOOLS; return mcqR(r.q, r.a, T.near(r.a, Math.max(2, Math.round(r.a*.15))), r.vis); } return r; });
    const specs = Array.isArray(spec) ? spec : [spec]; let out = [];
    specs.forEach(sp=>{
      if(sp.type==="sort") out = out.concat(sp.items.map(it=>mcqR("Where does “"+it[0]+"” go?", sp.bins[it[1]], sp.bins)));
      if(sp.type==="mcq") out = out.concat(sp.items.map(it=>mcqR(it[0], it[1][0], it[1].slice(1))));
      if(sp.type==="build") out = out.concat(sp.words.map(w=>mcqR("Which word is spelled correctly?", w, misspell(w))));
      if(sp.type==="order") sp.sets.forEach(st=>{
        const m = st.q.match(/^Put (?:the )?(.+?) in order/); const ctx = m ? "the "+m[1] : "this order";
        for(let k=0;k<st.items.length-1;k++){ const wrong = st.items.filter((x,j)=>j!==k+1 && j!==k); out.push(mcqR("In "+ctx+", what comes right after “"+st.items[k]+"”?", st.items[k+1], shuffle(wrong).slice(0,2))); }
        out.push(mcqR("What comes first in "+ctx+"?", st.items[0], shuffle(st.items.slice(1)).slice(0,2)));
      });
    });
    return shuffle(out);
  }
  const keyOf = r => r.t==="sort" ? "Where does “"+r.item+"” go?|"+r.bins[r.a] : r.t==="build" ? "build|"+r.word : r.t==="order" ? r.q : r.q+"|"+r.opts[r.a];
  function quickCheck(s, w, wn){
    const base = w.qs.map(qq=>{ const o = shuffle(qq[1]); return {q:qq[0], opts:o, a:o.indexOf(qq[1][qq[2]])}; });
    const used = new Set(base.map(b=>b.q));
    const extra = extraPool(s, wn).filter(r=>s==="math" || !used.has(r.q));
    return base.concat(extra.slice(0,4));
  }
  function practice(el, s, wn){
    const key = s+":"+wn+":act";
    let rounds, i, earned, missed, placed;
    const cheers = ["You got it!","That’s right!","Nice work!","Super!","Correct!"];
    function start(){ rounds = buildRounds(s, wn); i = 0; earned = 0; placed = []; show(); }
    function header(){ return '<div class="act-top"><span>Round '+(i+1)+' of '+rounds.length+'</span><span class="act-stars">'+'⭐'.repeat(earned)+'<span class="dim">'+'☆'.repeat(rounds.length-earned-(rounds.length-i))+'</span></span></div>'; }
    function fb(text, ok){ const f = el.querySelector(".act-fb"); f.textContent = text; f.className = "act-fb " + (ok ? "ok" : "no"); }
    function win(){ tone(true); if(!missed) earned++; fb(missed ? "Got it! Next one." : cheers[Math.floor(Math.random()*cheers.length)]+" +1 ⭐", true); el.querySelectorAll(".act-body button").forEach(b=>b.disabled=true); setTimeout(()=>{ i++; if(i < rounds.length) show(); else finish(); }, 1100); }
    function miss(btn, text){ tone(false); missed = true; if(btn){ btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong"); } fb(text || "Not yet. Try again!", false); }
    function show(){
      const r = rounds[i]; missed = false;
      const prompt = r.t==="sort" ? "Where does “"+r.item+"” go?" : r.t==="build" ? "Listen, then spell the word." : r.q;
      const spoken = r.t==="build" ? r.word : r.t==="sort" ? (r.say ? r.item : prompt) : prompt;
      let h = header() + '<div class="act-q"><p>'+esc(prompt)+'</p>'+(canSpeak?'<button class="say" aria-label="Read it to me">🔊</button>':'')+'</div>' + (r.vis ? '<div class="act-vis">'+r.vis+'</div>' : '') + '<div class="act-body"></div><div class="act-fb" aria-live="polite"></div>';
      el.innerHTML = h;
      const sayBtn = el.querySelector(".say"); if(sayBtn) sayBtn.onclick = () => speak(spoken);
      if(r.t==="build") setTimeout(()=>speak(r.word), 300);
      const body = el.querySelector(".act-body");
      if(r.t==="mcq"){
        body.innerHTML = '<div class="opts">'+r.opts.map((o,k)=>'<button class="opt" data-k="'+k+'">'+esc(o)+'</button>').join("")+'</div>';
        body.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ if(+b.dataset.k===r.a){ b.classList.add("right"); win(); } else miss(b); });
      }
      if(r.t==="num"){
        let typed = "";
        body.innerHTML = '<div class="numwrap"><span class="numans">&nbsp;</span><div class="pad">'+["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map(k=>'<button class="padk'+(k==="✓"?" go":"")+'" data-k="'+k+'" aria-label="'+(k==="⌫"?"Erase":k==="✓"?"Check":k)+'">'+k+'</button>').join("")+'</div></div>';
        const disp = body.querySelector(".numans");
        body.querySelectorAll(".padk").forEach(b=>b.onclick=()=>{
          const k = b.dataset.k;
          if(k==="⌫") typed = typed.slice(0,-1);
          else if(k==="✓"){ if(!typed) return; if(parseInt(typed,10)===r.a){ disp.classList.add("right"); win(); return; } miss(null, "Not yet. Check your work and try again."); typed = ""; }
          else if(typed.length < 4) typed += k;
          disp.innerHTML = typed || "&nbsp;";
        });
      }
      if(r.t==="sort"){
        body.innerHTML = '<div class="bins">'+r.bins.map((b,k)=>'<button class="bin b'+k+'" data-k="'+k+'">'+esc(b)+'</button>').join("")+'</div>'+(placed.length?'<div class="placed">'+r.bins.map((b,k)=>'<div><small>'+esc(b)+'</small>'+placed.filter(p=>p[1]===k).map(p=>'<span class="chip">'+esc(p[0])+'</span>').join("")+'</div>').join("")+'</div>':'');
        body.querySelectorAll(".bin").forEach(b=>b.onclick=()=>{ if(+b.dataset.k===r.a){ placed.push([r.item, r.a]); b.classList.add("right"); win(); } else miss(b); });
      }
      if(r.t==="build"){
        const letters = r.word.split(""); const extra = shuffle("abcdefghilmnoprstu".split("").filter(c=>!letters.includes(c))).slice(0,2);
        const tiles = shuffle(letters.concat(extra)); let typed = []; let tries = 0;
        body.innerHTML = '<div class="slots"></div><div class="tiles">'+tiles.map((c,k)=>'<button class="tile" data-k="'+k+'">'+c+'</button>').join("")+'</div><div class="opts"><button class="opt" data-x="back">⌫ Undo</button><button class="opt go" data-x="check">Check</button></div>';
        const slots = body.querySelector(".slots");
        const paint = () => { slots.innerHTML = letters.map((c,k)=>'<span class="slot">'+(typed[k]!==undefined ? tiles[typed[k]] : "")+'</span>').join(""); body.querySelectorAll(".tile").forEach(t=>t.disabled = typed.includes(+t.dataset.k)); };
        body.querySelectorAll(".tile").forEach(t=>t.onclick=()=>{ if(typed.length < letters.length){ typed.push(+t.dataset.k); paint(); } });
        body.querySelector('[data-x="back"]').onclick = () => { typed.pop(); paint(); };
        body.querySelector('[data-x="check"]').onclick = () => {
          const w = typed.map(k=>tiles[k]).join("");
          if(w === r.word){ slots.classList.add("right"); win(); return; }
          tries++; miss(null, tries >= 2 ? "Here’s a hint: it starts with “"+r.word[0]+"”. Try again!" : "Not yet. Tap 🔊 to hear it again."); typed = []; paint();
        };
        paint();
      }
      if(r.t==="order"){
        const shuffled = shuffle(r.items); let next = 0;
        body.innerHTML = '<ol class="ordered"></ol><div class="ordopts">'+shuffled.map((o,k)=>'<button class="opt" data-k="'+k+'">'+esc(o)+'</button>').join("")+'</div>';
        const ol = body.querySelector(".ordered");
        body.querySelectorAll(".ordopts .opt").forEach(b=>b.onclick=()=>{
          if(shuffled[+b.dataset.k] === r.items[next]){ next++; b.remove(); ol.insertAdjacentHTML("beforeend","<li>"+esc(r.items[next-1])+"</li>"); tone(true); if(next === r.items.length) win(); }
          else miss(b, "Not that one yet. What comes next?");
        });
      }
    }
    function finish(){
      const isNew = setBest(key, earned);
      el.innerHTML = '<div class="act-done"><div class="big">'+'⭐'.repeat(earned)+'<span class="dim">'+'☆'.repeat(rounds.length-earned)+'</span></div><p><b>You earned '+earned+' of '+rounds.length+' stars!</b></p><p class="kicker">'+(me() ? (isNew ? "New best for "+esc(me().name)+"!" : "Best so far: "+best(key)+" stars.") : 'Pick a learner on the <a href="'+root+'stars/index.html">Stars page</a> to save stars.')+'</p><button class="btn" id="again">Play again</button></div>';
      el.querySelector("#again").onclick = start;
      if(earned === rounds.length) tone(true);
      updateWeekStars && updateWeekStars();
    }
    start();
  }
  let updateWeekStars = null;
  function teacherPlan(s, w, wn, QS){
    const u = window.TEACHER.units[s][w.ui];
    return '<section class="card tplan"><div class="tp-top"><div><span class="kicker">Teacher plan · '+C[s].name+' · Week '+wn+' · Unit '+(w.ui+1)+': '+esc(w.unit)+'</span><h2>'+esc(w.title)+'</h2><p class="goal"><b>Goal:</b> '+esc(w.goal)+'</p></div><button class="btn ghost small" onclick="window.print()">Print plan</button></div>' +
      '<div class="tp-grid"><div><h3>Before you start</h3><ul>'+w.mat.split(/,\s*/).map(m=>'<li>'+esc(m)+'</li>').join("")+'</ul><p class="kicker">Time: about 35–40 minutes. <a href="../supplies/index.html">Full supply list</a></p></div>' +
      '<div><h3>Questions to ask while they work</h3><ul>'+u.ask.map(a=>'<li>'+esc(a)+'</li>').join("")+'</ul></div></div>' +
      '<h3>Lesson flow</h3><ol class="flow">' +
      '<li><b>Warm-up, 5 minutes.</b> '+esc(u.warm)+'</li>' +
      '<li><b>Teach and do, 15 minutes.</b> Show them how first, then let them try each step.<ol type="a">'+w.steps.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ol></li>' +
      '<li><b>Practice game, 10 minutes.</b> Let them play on their own. Step in only after two misses in a row, and ask one of the questions above instead of giving the answer.'+(w.extra.game ? ' This week also uses '+esc(w.extra.gameName)+'.' : '')+'</li>' +
      '<li><b>Quick check, 5 minutes.</b> Six questions. Five or six right on the first try means they’re ready to move on. Three or fewer means repeat the hands-on part tomorrow.</li>' +
      '<li><b>Wrap-up, 5 minutes.</b> Ask them to teach you one thing from today, then tap “Mark this week done.”</li></ol>' +
      '<div class="tp-grid"><div class="tp-easy"><h3>Make it easier</h3><p>'+esc(u.support)+'</p></div><div class="tp-hard"><h3>Make it harder</h3><p>'+esc(u.challenge)+'</p></div></div>' +
      '<h3>Answer key for today’s quick check</h3><ol class="akey">'+QS.map(q=>'<li>'+esc(q.q)+' <b>'+esc(q.opts[q.a])+'</b></li>').join("")+'</ol></section>';
  }

  /* ---------- pages ---------- */
  if(page === "home"){
    main.querySelector("#subjects").innerHTML = subjects.map(s=>{
      const n = doneCount(s), nw = nextWeek(s);
      return '<a class="card subj" style="--c:var(--'+s+')" href="'+s+'/index.html"><h3>'+C[s].name+'</h3><p>'+C[s].blurb+'</p>' +
        '<div class="bar" aria-label="'+n+' of 36 weeks done"><span style="width:'+(n/36*100)+'%"></span></div><p>'+n+' of 36 weeks done'+(me() ? ' · ⭐ '+total(me().id, s+":") : '')+'</p>' +
        '<span class="next"><small>Up next'+(me() ? ' for '+esc(me().name) : '')+'</small>Week '+nw.n+': '+esc(nw.title)+'</span></a>';
    }).join("");
    const g = document.getElementById("mbBest"); if(g && me()) g.textContent = "Best: ⭐ " + best("game:moon-bakery");
  }

  if(page === "subject"){
    const s = document.body.dataset.subject, all = weeks(s), n = doneCount(s), nw = nextWeek(s);
    document.title = C[s].name + " | MAZ School";
    let html = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><span>'+C[s].name+'</span></nav>' +
      '<div class="subhead" style="--c:var(--'+s+')"><h1>'+C[s].name+'</h1><p class="lead">'+C[s].blurb+' One lesson a week for the whole school year.</p>' +
      '<div class="prog"><div class="bar"><span style="width:'+(n/36*100)+'%"></span></div><b>'+n+' of 36 weeks done'+(me()?' · ⭐ '+total(me().id, s+":"):'')+'</b></div>' +
      '<p style="margin-top:14px"><a class="btn" href="../lesson/index.html?s='+s+'&w='+nw.n+'">Start week '+nw.n+': '+esc(nw.title)+'</a></p></div>';
    C[s].units.forEach((u,ui)=>{
      const ws = all.filter(w=>w.ui===ui);
      html += '<section class="unit" style="--c:var(--'+s+')"><h2>Unit '+(ui+1)+': '+esc(u.t)+' <small>Weeks '+ws[0].n+'–'+ws[ws.length-1].n+'</small></h2><div class="weeks">' +
        ws.map(w=>{ const st = best(s+":"+w.n+":act") + best(s+":"+w.n+":quiz"); return '<a class="wk'+(isDone(s,w.n)?' is-done':'')+(w.n===nw.n&&!isDone(s,w.n)?' is-next':'')+'" href="../lesson/index.html?s='+s+'&w='+w.n+'"><small>Week '+w.n+'</small><b>'+esc(w.title)+'</b>'+(st?'<span class="wkst">⭐ '+st+'</span>':'')+'</a>'; }).join("") +
        '</div></section>';
    });
    main.innerHTML = html;
  }

  if(page === "lesson"){
    const q = new URLSearchParams(location.search);
    const s = subjects.includes(q.get("s")) ? q.get("s") : "math";
    const wn = Math.min(36, Math.max(1, parseInt(q.get("w"),10) || 1));
    const w = weeks(s)[wn-1];
    const QS = quickCheck(s, w, wn);
    document.title = "Week " + wn + ": " + w.title + " | " + C[s].name + " | MAZ School";
    let html = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../'+s+'/index.html">'+C[s].name+'</a><span>/</span><span>Unit '+(w.ui+1)+': '+esc(w.unit)+'</span></nav>' +
      '<div class="lesson-head" style="--c:var(--'+s+')"><span class="kicker">'+C[s].name+' · Week '+wn+' of 36</span><h1>'+esc(w.title)+'</h1><p class="goal">'+esc(w.goal)+'</p><p class="kicker" id="weekStars"></p></div>' +
      '<div class="ltabs" role="tablist"><button class="ltab on" data-v="kid">🧒 Lesson</button><button class="ltab" data-v="teach">📋 Teacher plan</button></div><div id="kidView">' +
      (me() ? '' : '<div class="card notice">Stars won’t be saved until you pick who’s learning. <a class="btn small" href="../stars/index.html">Pick a learner</a></div>') +
      '<div class="lgrid"><section class="card"><h2>Let’s do it</h2><ol class="steps">' +
      w.steps.map((st,i)=>'<li><label><input type="checkbox"><span><span class="n">'+(i+1)+'.</span> '+esc(st)+'</span></label></li>').join("") +
      '</ol>' + (w.extra.game ? '<div class="game"><a class="btn" href="../'+w.extra.game+'">Play '+esc(w.extra.gameName)+'</a></div>' : '') +
      '</section><aside class="card"><h2>You’ll need</h2><p class="mat">'+esc(w.mat)+'</p></aside></div>' +
      '<section class="card practice" style="margin-top:18px;--c:var(--'+s+')"><h2>Practice game</h2><div id="act"></div></section>' +
      '<section class="card quiz" style="margin-top:18px"><h2>Quick check</h2><p class="lead" style="margin:0">'+QS.length+' questions. Get each one right on the first try for a star.</p>' +
      QS.map((qq,qi)=>'<div class="q"><p><span class="qn">'+(qi+1)+'.</span> '+esc(qq.q)+'</p>'+(qq.vis ? '<div class="act-vis">'+qq.vis+'</div>' : '')+'<div class="opts">'+qq.opts.map((o,k)=>'<button class="opt" data-ok="'+(k===qq.a?1:0)+'">'+esc(o)+'</button>').join("")+'</div><div class="qfb" aria-live="polite"></div></div>').join("") +
      '<div class="finish"><button class="btn" id="markDone"></button><span id="doneNote" class="kicker"></span></div></section>' +
      '</div><div id="teachView" hidden>'+teacherPlan(s, w, wn, QS)+'</div>' +
      '<nav class="pager">' + (wn>1 ? '<a class="btn ghost" href="?s='+s+'&w='+(wn-1)+'">Week '+(wn-1)+'</a>' : '<span></span>') +
      (wn<36 ? '<a class="btn ghost" href="?s='+s+'&w='+(wn+1)+'">Week '+(wn+1)+'</a>' : '<a class="btn ghost" href="../'+s+'/index.html">Back to '+C[s].name+'</a>') + '</nav>';
    main.innerHTML = html;
    const showView = v => { const t = v === "teach"; main.querySelectorAll(".ltab").forEach(x=>x.classList.toggle("on", x.dataset.v === v)); document.getElementById("kidView").hidden = t; document.getElementById("teachView").hidden = !t; };
    main.querySelectorAll(".ltab").forEach(b=>b.onclick=()=>showView(b.dataset.v));
    if(q.get("view") === "teach") showView("teach");
    updateWeekStars = () => { const a = best(s+":"+wn+":act"), b = best(s+":"+wn+":quiz"); document.getElementById("weekStars").textContent = me() ? (a+b ? "⭐ "+(a+b)+" stars earned this week by "+me().name : "Learning now: "+me().name) : ""; };
    updateWeekStars();
    main.querySelectorAll(".steps input").forEach(cb=>cb.onchange=()=>cb.parentElement.classList.toggle("is-done",cb.checked));
    practice(document.getElementById("act"), s, wn);
    let quizStars = 0;
    main.querySelectorAll(".q").forEach(qe=>{
      const fbq = qe.querySelector(".qfb"); let missedQ = false;
      qe.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
        if(b.dataset.ok === "1"){ b.classList.add("right"); qe.querySelectorAll(".opt").forEach(x=>x.disabled=true); tone(true); if(!missedQ){ quizStars++; setBest(s+":"+wn+":quiz", quizStars); updateWeekStars(); } fbq.textContent = missedQ ? "That’s it!" : "Correct! +1 ⭐"; fbq.className="qfb ok"; }
        else { missedQ = true; tone(false); b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); fbq.textContent = "Not yet. Try another answer."; fbq.className="qfb no"; }
      });
    });
    const md = document.getElementById("markDone");
    const paint = () => { const d = isDone(s,wn); md.textContent = d ? "Week done ✓" : "Mark this week done"; md.className = "btn" + (d ? " done" : ""); document.getElementById("doneNote").textContent = d ? "Tap again to undo." : ""; };
    md.onclick = () => { toggleDone(s,wn); paint(); };
    paint();
  }

  if(page === "teacher"){
    document.title = "Teacher | MAZ School";
    const days = [["Monday","Math lesson"],["Tuesday","Reading lesson"],["Wednesday","Science lesson"],["Thursday","Replay practice games and Moon Bakery"],["Friday","Redo quick checks, then look at the Stars page together"]];
    let h = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><span>Teacher</span></nav><h1>Teacher’s guide</h1><p class="lead">Everything for the grown-up: the weekly rhythm, the whole year at a glance and a teacher plan for every lesson.</p>' +
      '<div class="tlinks"><a class="card tl" href="../supplies/index.html"><b>🛒 Supply list</b><span>Everything to buy for the year, with checkboxes.</span></a><a class="card tl" href="../stars/index.html"><b>⭐ Stars</b><span>Learners, star totals and backups.</span></a><a class="card tl" href="../moon-bakery/index.html#guide"><b>🍪 Moon Bakery guide</b><span>The step-by-step guide for the bakery game.</span></a></div>' +
      '<section class="card" style="margin-top:20px"><h2>A typical week</h2><p>One lesson per subject each week, about 35–40 minutes each. Open any lesson and tap <b>📋 Teacher plan</b> for timing, a script, questions to ask, easier and harder options and an answer key.</p><div class="week">'+days.map(d=>'<div><b>'+d[0]+'</b><span>'+d[1]+'</span></div>').join("")+'</div></section>' +
      '<section class="sec"><h2>The year at a glance</h2><p class="lead">Tap any lesson to open its teacher plan.</p><div class="yr-wrap"><table class="yr"><thead><tr><th>Week</th><th>Math</th><th>Reading</th><th>Science</th></tr></thead><tbody>';
    const W = {}; subjects.forEach(s=>W[s]=weeks(s));
    for(let i=0;i<36;i++) h += '<tr><td>'+(i+1)+'</td>'+subjects.map(s=>{ const w = W[s][i]; return '<td><a href="../lesson/index.html?s='+s+'&w='+(i+1)+'&view=teach">'+esc(w.title)+'</a><small>'+esc(w.unit)+'</small></td>'; }).join("")+'</tr>';
    main.innerHTML = h + '</tbody></table></div></section>';
  }

  if(page === "supplies"){
    document.title = "Supplies | MAZ School";
    const SK = "maz-supplies"; let got = {}; try { got = JSON.parse(localStorage.getItem(SK)) || {}; } catch(e) {}
    let only = false;
    function renderS(){
      const all = window.TEACHER.supplies, tot = all.reduce((a,c)=>a+c.items.length,0), n = all.reduce((a,c)=>a+c.items.filter(it=>got[it[0]]).length,0);
      let h = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../teacher/index.html">Teacher</a><span>/</span><span>Supplies</span></nav><h1>Supply list</h1><p class="lead">Everything the 108 lessons use, in one place. Items marked “probably at home” are things most families already have. Check off each one once you have it.</p>' +
        '<div class="prog"><div class="bar"><span style="width:'+(n/tot*100)+'%"></span></div><b>'+n+' of '+tot+' ready</b></div><div class="lbtns"><button class="btn ghost small" id="only">'+(only ? 'Show everything' : 'Show only what I still need')+'</button><button class="btn ghost small" onclick="window.print()">Print shopping list</button></div>';
      all.forEach(c=>{ const items = c.items.filter(it=>!only || !got[it[0]]); if(!items.length) return;
        h += '<section class="card sup"><h2>'+esc(c.cat)+'</h2>'+items.map(it=>'<label class="chk'+(got[it[0]]?' is-done':'')+'"><input type="checkbox" data-k="'+esc(it[0])+'"'+(got[it[0]]?' checked':'')+'><span><b>'+esc(it[0])+'</b> <span class="qty">'+esc(it[1])+'</span>'+(it[3]?' <span class="home">probably at home</span>':'')+'<small>'+esc(it[2])+'</small></span></label>').join("")+'</section>'; });
      main.innerHTML = h;
      main.querySelectorAll("input[data-k]").forEach(cb=>cb.onchange=()=>{ got[cb.dataset.k] = cb.checked; try { localStorage.setItem(SK, JSON.stringify(got)); } catch(e) {} renderS(); });
      document.getElementById("only").onclick = () => { only = !only; renderS(); };
    }
    renderS();
  }

  if(page === "stars"){
    let armed = null;
    function render(){
      let h = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><span>Stars</span></nav><h1>Stars</h1>' +
        '<p class="lead">Each learner earns stars in practice games, quick checks and Moon Bakery. Lessons keep each learner’s best score, so stars never go down.</p>';
      if(!D.users.length) h += '<div class="card notice">Add a learner to start saving stars.</div>';
      h += '<div class="learners">' + D.users.map(u=>{
        const t = total(u.id), mine = u.id === D.current;
        const dn = subjects.reduce((a,s)=>a+weeks(s).filter(w=>isDone(s,w.n,u.id)).length,0);
        return '<article class="card learner'+(mine?' is-me':'')+'"><div class="lhead"><span class="av big">'+esc(u.name[0].toUpperCase())+'</span><div><h2>'+esc(u.name)+'</h2>'+(mine?'<span class="kicker">Learning now</span>':'')+'</div><span class="tot">⭐ '+t+'</span></div>' +
          '<div class="sub-stars">'+subjects.map(s=>'<span style="--c:var(--'+s+')"><b>'+total(u.id,s+":")+'</b>'+C[s].name+'</span>').join("")+'<span style="--c:var(--pink)"><b>'+total(u.id,"game:")+'</b>Games</span></div>' +
          '<p class="kicker">'+dn+' of 108 weeks done</p><div class="lbtns">' +
          (mine ? '' : '<button class="btn" data-pick="'+u.id+'">Switch to '+esc(u.name)+'</button>') +
          '<button class="btn ghost" data-ren="'+u.id+'">Rename</button><button class="btn ghost" data-del="'+u.id+'">'+(armed===u.id?'Tap again to remove':'Remove')+'</button></div></article>';
      }).join("") + '</div>' +
      '<section class="card" style="margin-top:22px"><h2>Add a learner</h2><div class="addrow"><input id="newName" maxlength="20" placeholder="Name" autocomplete="off"><button class="btn" id="addBtn">Add learner</button></div></section>' +
      '<section class="card" style="margin-top:18px"><h2>Keep stars safe</h2><p>Stars are saved in this browser on this device. Playing, refreshing or closing the page never resets them. Clearing your browser’s data would erase them, so download a backup now and then. Restore it here, or on another device, to bring the stars back.</p><div class="lbtns"><button class="btn" id="dl">Download backup</button><label class="btn ghost" for="ul">Restore backup</label><input type="file" id="ul" accept=".json,application/json" hidden></div><p class="kicker" id="bkMsg"></p></section>';
      main.innerHTML = h;
      main.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{ D.current = b.dataset.pick; save(); refreshChip(); render(); });
      main.querySelectorAll("[data-ren]").forEach(b=>b.onclick=()=>{ const u = D.users.find(x=>x.id===b.dataset.ren); const art = b.closest(".learner"); const h2 = art.querySelector("h2"); h2.innerHTML = '<input class="ren" maxlength="20" value="'+esc(u.name)+'">'; const inp = h2.querySelector("input"); inp.focus(); inp.select(); const done = () => { const v = inp.value.trim(); if(v) u.name = v; save(); refreshChip(); render(); }; inp.onkeydown = e => { if(e.key==="Enter") done(); }; inp.onblur = done; });
      main.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ const id = b.dataset.del; if(armed !== id){ armed = id; render(); setTimeout(()=>{ if(armed===id){ armed=null; render(); } }, 3000); return; } armed = null; D.users = D.users.filter(u=>u.id!==id); delete D.stars[id]; delete D.done[id]; if(D.current===id) D.current = D.users[0] ? D.users[0].id : null; save(); refreshChip(); render(); });
      const add = () => { const v = document.getElementById("newName").value.trim(); if(!v) return; addUser(v); refreshChip(); render(); };
      document.getElementById("addBtn").onclick = add;
      document.getElementById("newName").onkeydown = e => { if(e.key==="Enter") add(); };
      document.getElementById("dl").onclick = () => { const blob = new Blob([JSON.stringify(D,null,1)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "maz-school-stars-"+new Date().toISOString().slice(0,10)+".json"; document.body.appendChild(a); a.click(); a.remove(); document.getElementById("bkMsg").textContent = "Backup downloaded."; };
      document.getElementById("ul").onchange = e => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => { try { const n = JSON.parse(r.result); if(!Array.isArray(n.users)) throw 0; D = Object.assign({stars:{}, done:{}}, n); save(); refreshChip(); render(); document.getElementById("bkMsg").textContent = "Backup restored."; } catch(err) { document.getElementById("bkMsg").textContent = "That file isn’t a MAZ School backup."; } }; r.readAsText(f); };
    }
    render();
  }
})();
