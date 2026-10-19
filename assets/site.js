(function(){
  const C = window.CURRICULUM;
  const root = document.body.dataset.root || "";
  const page = document.body.dataset.page;
  const KEY = "maz-progress";
  let P = {};
  try { P = JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e) { P = {}; }
  const saveP = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch(e) {} };
  const isDone = (s,w) => !!(P[s] && P[s][w]);
  const subjects = ["math","reading","science"];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  // Flatten weeks with numbers and unit info
  function weeks(s){
    const out = []; let n = 0;
    C[s].units.forEach((u,ui)=>u.w.forEach(w=>{ n++; out.push({n, unit:u.t, ui, title:w[0], goal:w[1], mat:w[2], steps:w[3], qs:w[4], extra:w[5]||{}}); }));
    return out;
  }
  function nextWeek(s){ const all = weeks(s); return all.find(w=>!isDone(s,w.n)) || all[all.length-1]; }
  function doneCount(s){ return weeks(s).filter(w=>isDone(s,w.n)).length; }

  // Header with home button on every page
  const current = page === "home" ? "home" : (document.body.dataset.subject || new URLSearchParams(location.search).get("s"));
  const head = document.createElement("header");
  head.className = "site-head";
  head.innerHTML = '<div class="in"><a class="logo" href="'+root+'index.html" aria-label="MAZ School home"><picture><source srcset="'+root+'assets/logo-light.svg" media="(prefers-color-scheme: dark)"><img src="'+root+'assets/logo.svg" alt="MAZ School"></picture></a>' +
    '<nav class="site-nav" aria-label="Main"><a class="home" href="'+root+'index.html"'+(current==="home"?' aria-current="page"':'')+'>🏠 Home</a>' +
    subjects.map(s=>'<a href="'+root+s+'/index.html"'+(current===s?' aria-current="page"':'')+'><span class="dot" style="background:var(--'+s+')"></span>'+C[s].name+'</a>').join("") + '</nav></div>';
  document.body.prepend(head);
  const foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML = '<img src="'+root+'assets/icon.svg" alt=""><span>© 2026 MAZ School</span>';
  document.body.appendChild(foot);

  const main = document.getElementById("main");

  if(page === "home"){
    main.querySelector("#subjects").innerHTML = subjects.map(s=>{
      const n = doneCount(s), nw = nextWeek(s);
      return '<a class="card subj" style="--c:var(--'+s+')" href="'+s+'/index.html"><h3>'+C[s].name+'</h3><p>'+C[s].blurb+'</p>' +
        '<div class="bar" aria-label="'+n+' of 36 weeks done"><span style="width:'+(n/36*100)+'%"></span></div><p>'+n+' of 36 weeks done</p>' +
        '<span class="next"><small>Up next</small>Week '+nw.n+': '+esc(nw.title)+'</span></a>';
    }).join("");
  }

  if(page === "subject"){
    const s = document.body.dataset.subject, all = weeks(s), n = doneCount(s), nw = nextWeek(s);
    document.title = C[s].name + " | MAZ School";
    let html = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><span>'+C[s].name+'</span></nav>' +
      '<div class="subhead" style="--c:var(--'+s+')"><h1>'+C[s].name+'</h1><p class="lead">'+C[s].blurb+' One lesson a week for the whole school year.</p>' +
      '<div class="prog"><div class="bar"><span style="width:'+(n/36*100)+'%"></span></div><b>'+n+' of 36 weeks done</b></div>' +
      '<p style="margin-top:14px"><a class="btn" href="../lesson/index.html?s='+s+'&w='+nw.n+'">Start week '+nw.n+': '+esc(nw.title)+'</a></p></div>';
    C[s].units.forEach((u,ui)=>{
      const ws = all.filter(w=>w.ui===ui);
      html += '<section class="unit" style="--c:var(--'+s+')"><h2>Unit '+(ui+1)+': '+esc(u.t)+' <small>Weeks '+ws[0].n+'–'+ws[ws.length-1].n+'</small></h2><div class="weeks">' +
        ws.map(w=>'<a class="wk'+(isDone(s,w.n)?' is-done':'')+(w.n===nw.n&&!isDone(s,w.n)?' is-next':'')+'" href="../lesson/index.html?s='+s+'&w='+w.n+'"><small>Week '+w.n+'</small><b>'+esc(w.title)+'</b></a>').join("") +
        '</div></section>';
    });
    main.innerHTML = html;
  }

  if(page === "lesson"){
    const q = new URLSearchParams(location.search);
    const s = subjects.includes(q.get("s")) ? q.get("s") : "math";
    const all = weeks(s);
    const wn = Math.min(36, Math.max(1, parseInt(q.get("w"),10) || 1));
    const w = all[wn-1];
    document.title = "Week " + wn + ": " + w.title + " | " + C[s].name + " | MAZ School";
    const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);
    let html = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../'+s+'/index.html">'+C[s].name+'</a><span>/</span><span>Unit '+(w.ui+1)+': '+esc(w.unit)+'</span></nav>' +
      '<div class="lesson-head" style="--c:var(--'+s+')"><span class="kicker">'+C[s].name+' · Week '+wn+' of 36</span><h1>'+esc(w.title)+'</h1><p class="goal">'+esc(w.goal)+'</p></div>' +
      '<div class="lgrid"><section class="card"><h2>Let’s do it</h2><ol class="steps">' +
      w.steps.map((st,i)=>'<li><label><input type="checkbox"><span><span class="n">'+(i+1)+'.</span> '+esc(st)+'</span></label></li>').join("") +
      '</ol>' + (w.extra.game ? '<div class="game"><a class="btn" href="../'+w.extra.game+'">Play '+esc(w.extra.gameName)+'</a></div>' : '') +
      '</section><aside class="card"><h2>You’ll need</h2><p class="mat">'+esc(w.mat)+'</p></aside></div>' +
      '<section class="card quiz" style="margin-top:18px"><h2>Quick check</h2><p class="lead" style="margin:0">Tap the right answer.</p>' +
      w.qs.map((qq,qi)=>{ const opts = shuffle(qq[1].map((o,oi)=>({o,ok:oi===qq[2]}))); return '<div class="q" data-q="'+qi+'"><p>'+esc(qq[0])+'</p><div class="opts">' + opts.map(o=>'<button class="opt" data-ok="'+(o.ok?1:0)+'">'+esc(o.o)+'</button>').join("") + '</div><div class="qfb" aria-live="polite"></div></div>'; }).join("") +
      '<div class="finish"><button class="btn" id="markDone"></button><span id="doneNote" class="kicker"></span></div></section>' +
      '<nav class="pager">' + (wn>1 ? '<a class="btn ghost" href="?s='+s+'&w='+(wn-1)+'">Week '+(wn-1)+'</a>' : '<span></span>') +
      (wn<36 ? '<a class="btn ghost" href="?s='+s+'&w='+(wn+1)+'">Week '+(wn+1)+'</a>' : '<a class="btn ghost" href="../'+s+'/index.html">Back to '+C[s].name+'</a>') + '</nav>';
    main.innerHTML = html;

    main.querySelectorAll(".steps input").forEach(cb=>cb.onchange=()=>cb.parentElement.classList.toggle("is-done",cb.checked));
    const cheers = ["You got it!","That’s right!","Nice work!","Correct!"];
    main.querySelectorAll(".q").forEach(qe=>{
      const fb = qe.querySelector(".qfb");
      qe.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
        if(b.dataset.ok === "1"){ b.classList.add("right"); qe.querySelectorAll(".opt").forEach(x=>x.disabled=true); fb.textContent = cheers[Math.floor(Math.random()*cheers.length)]; fb.className="qfb ok"; }
        else { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); fb.textContent = "Not yet. Try another answer."; fb.className="qfb no"; }
      });
    });
    const md = document.getElementById("markDone");
    const paint = () => {
      const d = isDone(s,wn);
      md.textContent = d ? "Week done ✓" : "Mark this week done";
      md.className = "btn" + (d ? " done" : "");
      document.getElementById("doneNote").textContent = d ? "Tap again to undo." : "";
    };
    md.onclick = () => { P[s] = P[s] || {}; if(P[s][wn]) delete P[s][wn]; else P[s][wn] = true; saveP(); paint(); };
    paint();
  }
})();
