/* MAZ School arcade: one themed game per unit, 3 stations each */
(function(){
  const A = window.ACTIVITIES, G = window.MAZ_GEN, T = window.MAZ_TOOLS, C = window.CURRICULUM;
  const API = window.MAZ_API || {};
  const page = document.body.dataset.page, root = document.body.dataset.root || "";
  const R = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const range = (a,b) => Array.from({length:b-a+1}, (_,i)=>a+i);
  const starStr = n => "⭐".repeat(n) + '<span class="dim">' + "☆".repeat(3-n) + "</span>";

  let actx = null;
  function tone(ok){ try { actx = actx || new (window.AudioContext||window.webkitAudioContext)(); (ok?[523,659,784]:[300,220]).forEach((f,i)=>{ const o=actx.createOscillator(), g=actx.createGain(); o.type="triangle"; o.frequency.value=f; g.gain.setValueAtTime(.15,actx.currentTime+i*.1); g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+i*.1+.25); o.connect(g).connect(actx.destination); o.start(actx.currentTime+i*.1); o.stop(actx.currentTime+i*.1+.3); }); } catch(e) {} }
  const speak = t => API.speak && API.speak(t);

  /* ---------- question helpers ---------- */
  function misspell(w){ const o = new Set(); let g = 0; while(o.size < 2 && g++ < 60){ const k = Math.floor(Math.random()*w.length), t = Math.random(); let m; if(t < .34 && w.length > 2){ const i = Math.min(k, w.length-2); m = w.slice(0,i)+w[i+1]+w[i]+w.slice(i+2); } else if(t < .67){ m = w.slice(0,k)+w[k]+w.slice(k); } else { m = w.slice(0,k)+w.slice(k+1); } if(m !== w && m.length) o.add(m); } return [...o]; }
  function mcqR(q,c,wr,vis){ const o = shuffle([c].concat(wr.filter(x=>String(x)!==String(c))).map(String)); return {q, opts:o, a:o.indexOf(String(c)), vis}; }
  function specs(s,w){ const sp = A[s][w]; return Array.isArray(sp) ? sp : [sp]; }
  function specOf(s,w,type){ return specs(s,w).find(x=>x.type===type); }
  function pool(s, weeks){
    return () => {
      const w = pick(weeks);
      if(s === "math"){ const r = G[w](); return r.t === "num" ? mcqR(r.q, r.a, T.near(r.a, Math.max(2, Math.round(r.a*.15))), r.vis) : r; }
      const x = pick(specs(s,w));
      if(x.type==="sort"){ const it = pick(x.items); return mcqR("Where does “"+it[0]+"” go?", x.bins[it[1]], x.bins); }
      if(x.type==="mcq"){ const it = pick(x.items); return mcqR(it[0], it[1][0], it[1].slice(1)); }
      if(x.type==="build"){ const ww = pick(x.words); return mcqR("Which word is spelled correctly?", ww, misspell(ww)); }
      const st = pick(x.sets), k = R(0, st.items.length-2);
      return mcqR("What comes right after “"+st.items[k]+"”?", st.items[k+1], shuffle(st.items.filter((_,j)=>j!==k && j!==k+1)).slice(0,2));
    };
  }

  /* ---------- drawings ---------- */
  function clockSVG(h,m){ let s='<svg class="v-clock" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" class="face"/>'; for(let i=1;i<=12;i++){ const a=i*Math.PI/6; s+='<text x="'+(60+44*Math.sin(a)).toFixed(1)+'" y="'+(64-44*Math.cos(a)).toFixed(1)+'" text-anchor="middle">'+i+'</text>'; } const ha=((h%12)+m/60)*30*Math.PI/180, ma=m*6*Math.PI/180; return s+'<line x1="60" y1="60" x2="'+(60+26*Math.sin(ha)).toFixed(1)+'" y2="'+(60-26*Math.cos(ha)).toFixed(1)+'" class="hh"/><line x1="60" y1="60" x2="'+(60+40*Math.sin(ma)).toFixed(1)+'" y2="'+(60-40*Math.cos(ma)).toFixed(1)+'" class="mh"/><circle cx="60" cy="60" r="4" class="pin"/></svg>'; }
  function shapeSVG(n, size){ size = size || 56; if(n === 0) return '<svg viewBox="0 0 60 60" width="'+size+'" height="'+size+'"><circle cx="30" cy="30" r="22" class="shp"/></svg>'; let p=[]; for(let i=0;i<n;i++){ const a=-Math.PI/2+(n%2===0?Math.PI/n:0)+i*2*Math.PI/n; p.push((30+24*Math.cos(a)).toFixed(1)+','+(30+24*Math.sin(a)).toFixed(1)); } return '<svg viewBox="0 0 60 60" width="'+size+'" height="'+size+'"><polygon points="'+p.join(' ')+'" class="shp"/></svg>'; }
  const SHAPES = [[3,"Triangle"],[4,"Square"],[5,"Pentagon"],[6,"Hexagon"],[8,"Octagon"],[0,"Circle"]];
  function rulerSVG(len, max){ const w=300, px=(w-20)/max; let s='<svg class="v-ruler" viewBox="0 0 '+w+' 80"><rect x="10" y="12" width="'+(len*px)+'" height="16" rx="8" class="bar1"/><rect x="6" y="36" width="'+(w-12)+'" height="34" rx="4" class="rul"/>'; for(let i=0;i<=max;i++){ const x=10+i*px; s+='<line x1="'+x+'" y1="36" x2="'+x+'" y2="48" class="tick"/><text x="'+x+'" y="64" text-anchor="middle">'+i+'</text>'; } return s+'</svg>'; }

  /* ---------- pop boards ---------- */
  function popList(rule, good, bad, html){ const g = shuffle(good).slice(0, R(3,5)), b = shuffle(bad).slice(0, 12-g.length); return {rule, html, items: shuffle(g.map(x=>[x,true]).concat(b.map(x=>[x,false])))}; }
  function popSort(s, w, rules){ return () => { const sp = specOf(s,w,"sort"); const k = R(0, rules.length-1); return popList(rules[k], sp.items.filter(i=>i[1]===k).map(i=>i[0]), sp.items.filter(i=>i[1]!==k).map(i=>i[0])); }; }
  const POP = {
    numbers: () => { const r = pick(["even","odd","gt","ten","five"]), N = R(30,70); const set = new Set(); if(r==="ten"||r==="five") for(let i=0;i<4;i++) set.add(R(1,9)*10 + (r==="five" && i%2 ? 5 : 0)); while(set.size<12) set.add(R(1,99)); const test = {even:n=>n%2===0, odd:n=>n%2===1, gt:n=>n>N, ten:n=>n%10===0, five:n=>n%5===0}[r]; return {rule:{even:"Tap all the even numbers",odd:"Tap all the odd numbers",gt:"Tap every number greater than "+N,ten:"Tap the numbers you say counting by 10s",five:"Tap the numbers you say counting by 5s"}[r], items: shuffle([...set]).map(n=>[String(n), test(n)])}; },
    makeT: () => { const t = R(10,18); const good = [], bad = []; const seen = new Set(); while(good.length<4){ const a = R(t-9,9); const k = a+" + "+(t-a); if(a>=1 && t-a>=1 && t-a<=9 && !seen.has(k)){ seen.add(k); good.push(k); } } while(bad.length<8){ const a = R(2,9), b = R(2,9); const k = a+" + "+b; if(a+b!==t && !seen.has(k)){ seen.add(k); bad.push(k); } } return {rule:"Tap every fact that makes "+t, items: shuffle(good.map(x=>[x,true]).concat(bad.map(x=>[x,false])))}; },
    equal2: () => { const t = R(4,9)*10 + R(0,9); const good = [], bad = [], seen = new Set(); while(good.length<4){ const a = R(11, t-11); const k = a+" + "+(t-a); if(!seen.has(k)){ seen.add(k); good.push(k); } } while(bad.length<8){ const a = R(11, t-11), b = t-a+pick([-10,-2,-1,1,2,10]); const k = a+" + "+b; if(b>0 && !seen.has(k)){ seen.add(k); bad.push(k); } } return {rule:"Tap every problem that equals "+t, items: shuffle(good.map(x=>[x,true]).concat(bad.map(x=>[x,false])))}; },
    shapes: () => { const target = pick(SHAPES); const items = []; for(let i=0;i<4;i++) items.push([target[0], true]); while(items.length<12){ const o = pick(SHAPES); if(o[0]!==target[0]) items.push([o[0], false]); } return {rule:"Tap every "+target[1].toLowerCase(), html:true, items: shuffle(items).map(i=>[shapeSVG(i[0]), i[1]])}; },
    shortV: () => { const L = {a:["cat","map","hat","bag","jam","pan","van"],e:["bed","web","hen","pet","leg","red","ten"],i:["pig","fish","sit","lip","win","kid","six"],o:["dog","fox","mop","pot","log","top","hop"],u:["sun","bug","cup","rug","nut","tub","bus"]}; const v = pick(Object.keys(L)); return popList("Tap the words with a short "+v+" sound", L[v], Object.keys(L).filter(k=>k!==v).flatMap(k=>L[k])); },
    silentE: () => popList("Tap the words with a silent e", ["cake","kite","hope","cube","bike","rope","game","tune","lake","bone"], ["cat","kit","hop","cub","bit","rob","gam","tub","lap","bon"]),
    sentences: () => popList("Tap the complete sentences", ["The dog ran fast.","We went to the park.","Mia likes red apples.","The sun is hot.","Birds sing in the morning.","I read a book."], ["the big dog","Ran fast","In the morning","Red apples and","Is hot sun","A book about"])
  };

  /* ---------- match pairs ---------- */
  const PAIRS = {
    numWords: [["twelve","12"],["twenty","20"],["thirty-five","35"],["fifty","50"],["ninety-nine","99"],["one hundred","100"],["eighteen","18"],["sixty-one","61"]],
    expanded: () => { const out = [], seen = new Set(); while(out.length<6){ const n = R(101,989); if(seen.has(n)) continue; seen.add(n); const h=Math.floor(n/100)*100, t=Math.floor(n%100/10)*10, o=n%10; out.push([h+" + "+t+" + "+o, String(n)]); } return out; },
    facts: () => { const out = [], seen = new Set(); while(out.length<6){ const a = R(2,9), b = R(2,9); if(seen.has(a+b)) continue; seen.add(a+b); out.push([a+" + "+b, String(a+b)]); } return out; },
    lengths: [["pencil","7 inches"],["door","7 feet"],["paper clip","1 inch"],["car","15 feet"],["crayon","4 inches"],["bed","6 feet"],["1 foot","12 inches"],["1 meter","100 cm"]],
    shapes: () => shuffle(SHAPES).slice(0,6).map(sh=>[shapeSVG(sh[0],46), sh[1]]),
    problems: [["The kite got stuck in a tree.","Dad got a ladder."],["The puppy ran away.","They found him at the park."],["It rained on the picnic.","They ate under a tent."],["The dog chewed the homework.","Mia printed a new copy."],["The car had a flat tire.","Mom put on the spare."],["Max was hungry.","He made a sandwich."]],
    compounds: [["sun + flower","sunflower"],["rain + bow","rainbow"],["foot + ball","football"],["cup + cake","cupcake"],["star + fish","starfish"],["snow + man","snowman"],["back + pack","backpack"],["butter + fly","butterfly"]],
    wordParts: [["unhappy","not happy"],["redo","do again"],["careful","full of care"],["helpless","without help"],["can’t","can not"],["I’m","I am"],["unlock","open a lock"],["refill","fill again"]],
    rhymes: [["cat","hat"],["tree","bee"],["cake","lake"],["moon","spoon"],["bug","rug"],["fish","dish"],["king","ring"],["frog","log"]],
    tools: [["Magnifier","See tiny details"],["Ruler","Measure length"],["Thermometer","How hot or cold"],["Scale","How heavy"],["Timer","How long it takes"],["Goggles","Protect your eyes"]],
    plants: [["Roots","Take in water"],["Stem","Holds the plant up"],["Leaves","Make food from sunlight"],["Flower","Makes seeds"],["Seed","Grows a new plant"],["Fruit","Holds the seeds"]],
    land: [["Mountain","Very tall land"],["Valley","Low land between mountains"],["Island","Water all around it"],["Plain","Big, flat land"],["River","Flowing fresh water"],["Canyon","Carved by a river"],["Ocean","Huge and salty"],["Desert","Dry, with little rain"]],
    space: [["Sun","Our closest star"],["Moon","Travels around Earth"],["Earth","Our home planet"],["Jupiter","Biggest planet"],["Saturn","Planet with big rings"],["Mars","The red planet"],["Constellation","A star picture"],["Full moon","Whole circle lit up"]]
  };

  /* ---------- the 25 games ---------- */
  const S = (type, title, intro, cfg) => Object.assign({type, title, intro}, cfg || {});
  const GAMES = [
    {id:"m1", s:"math", ui:0, emoji:"🐒", title:"Number Jungle", color:"#3FB58A", story:"The monkeys mixed up all the jungle numbers. Help them sort it out!", stations:[
      S("pop","Banana bubbles","Pop the bubbles that follow the rule.",{gen:POP.numbers}),
      S("match","Vine match","Match each number word to its number.",{pairs:()=>PAIRS.numWords}),
      S("race","Monkey race","Answer fast to swing through the trees. You have 60 seconds!",{pool:pool("math",range(1,4)), runner:"🐒"})]},
    {id:"m2", s:"math", ui:1, emoji:"🏰", title:"Castle Builders", color:"#8E7CF0", story:"The king needs towers built with exactly the right number of bricks.", stations:[
      S("build","Build the tower","Use hundreds, tens and ones blocks to build the number.",{tokens:[{v:100,l:"100",c:"t100"},{v:10,l:"10",c:"t10"},{v:1,l:"1",c:"t1"}], target:()=>{ const n=R(100,999); return {n, show:"Build "+n}; }, rounds:4}),
      S("match","Royal match","Match the expanded form to its number.",{pairs:PAIRS.expanded}),
      S("race","Drawbridge dash","Answer place value questions before the drawbridge closes!",{pool:pool("math",range(5,9)), runner:"🐴"})]},
    {id:"m3", s:"math", ui:2, emoji:"🚀", title:"Fact Rocket", color:"#3E9FE0", story:"Fuel the rocket with math facts and blast off to the stars.", stations:[
      S("pop","Fuel bubbles","Pop every fact that makes the target number.",{gen:POP.makeT}),
      S("match","Star match","Match each fact to its answer.",{pairs:PAIRS.facts}),
      S("race","Blast-off race","How many facts can you get in 60 seconds?",{pool:pool("math",range(10,13)), runner:"🚀"})]},
    {id:"m4", s:"math", ui:3, emoji:"🐙", title:"Treasure Divers", color:"#1FA3A3", story:"Dive deep and load the right amount of gold onto the ship.", stations:[
      S("build","Load the gold","Add bags of 10 and single coins to load the right amount.",{tokens:[{v:10,l:"bag of 10",c:"t10"},{v:1,l:"1 coin",c:"t1"}], target:()=>{ const a=R(11,49), b=R(11,49); return {n:a+b, show:"Load "+a+" + "+b+" coins"}; }, rounds:4}),
      S("pop","Bubble treasure","Pop every problem that equals the target.",{gen:POP.equal2}),
      S("board","Sea map","Answer questions to sail across the map to the treasure.",{pool:pool("math",range(14,18)), piece:"⛵"})]},
    {id:"m5", s:"math", ui:4, emoji:"🤠", title:"Ruler Ranch", color:"#D9893B", story:"The ranch needs ribbons, ropes and fences measured just right.", stations:[
      S("build","Ribbon cutter","Stretch the ribbon to the right length.",{tokens:[{v:1,l:"+1 inch",c:"t1"}], display:"ruler", target:()=>{ const n=R(2,11); return {n, show:"Make the ribbon "+n+" inches long"}; }, rounds:4}),
      S("match","Size match","Match each thing to its length.",{pairs:()=>PAIRS.lengths}),
      S("race","Rodeo race","Answer measuring questions as fast as you can!",{pool:pool("math",range(19,22)), runner:"🐎"})]},
    {id:"m6", s:"math", ui:5, emoji:"🛒", title:"Clock and Coin Shop", color:"#E5603F", story:"Run the shop: set the clocks and count the coins.", stations:[
      S("clock","Clock fixer","Set the clock to the right time.",{rounds:4}),
      S("build","Pay the price","Tap coins to pay exactly the price.",{tokens:[{v:25,l:"25¢",c:"c25"},{v:10,l:"10¢",c:"c10"},{v:5,l:"5¢",c:"c5"},{v:1,l:"1¢",c:"c1"}], target:()=>{ const n=R(11,99); return {n, show:"Pay "+n+"¢"}; }, rounds:4}),
      S("race","Rush hour","Answer time and money questions before the shop closes!",{pool:pool("math",range(23,26)), runner:"🛒"})]},
    {id:"m7", s:"math", ui:6, emoji:"🌻", title:"Graph Garden", color:"#7FB33A", story:"Count the garden and build graphs for the gardener.", stations:[
      S("build","Count and graph","Count the flowers, then build a bar that matches.",{tokens:[{v:1,l:"+1",c:"t1"}], display:"emoji", target:()=>{ const n=R(3,12), e=pick(["🌻","🌷","🍓","🐝","🐞"]); return {n, show:"Build a bar for these", vis:'<div class="pile">'+e.repeat(n)+'</div>', e}; }, rounds:4}),
      S("race","Garden race","Read the graphs fast!",{pool:pool("math",[27,28]), runner:"🐝"}),
      S("board","Garden path","Answer graph questions to walk the garden path.",{pool:pool("math",[27,28]), piece:"🐞"})]},
    {id:"m8", s:"math", ui:7, emoji:"🦒", title:"Shape Safari", color:"#C98A2E", story:"Spot the shapes hiding all over the safari.", stations:[
      S("pop","Shape spotting","Tap every shape that matches.",{gen:POP.shapes}),
      S("match","Shape match","Match each shape to its name.",{pairs:PAIRS.shapes}),
      S("race","Safari race","Shapes, fractions and arrays in 60 seconds!",{pool:pool("math",range(29,32)), runner:"🦒"})]},
    {id:"m9", s:"math", ui:8, emoji:"🛰️", title:"Space Station", color:"#5867D6", story:"Pack supplies for the astronauts in equal groups.", stations:[
      S("build","Pack the pods","Add equal groups to pack exactly the right amount.",{tokens:[], groupTarget:true, target:()=>{ const g=pick([2,3,4,5,10]), n=g*R(2,6); return {n, show:"Pack "+n+" moon rocks in groups of "+g, g}; }, rounds:4}),
      S("race","Launch race","Answer fast to launch the station!",{pool:pool("math",range(33,35)), runner:"🛰️"}),
      S("board","Orbit board","Answer questions to orbit all the way around.",{pool:pool("math",range(32,36)), piece:"🧑‍🚀"})]},
    {id:"r1", s:"reading", ui:0, emoji:"🦁", title:"Sound Safari", color:"#E0A21B", story:"Listen closely and track down the sounds on the safari.", stations:[
      S("pop","Sound spotting","Pop the words that have the sound.",{gen:POP.shortV, say:true}),
      S("spell","Animal spellers","Listen to the word, then spell it.",{words:specOf("reading",2,"build").words.concat(["ship","chop","this","when"]), rounds:5}),
      S("race","Safari race","Answer as many as you can in 60 seconds!",{pool:pool("reading",range(1,4)), runner:"🦁"})]},
    {id:"r2", s:"reading", ui:1, emoji:"🌋", title:"Vowel Volcano", color:"#E5603F", story:"The volcano only calms down when you read long vowel words!", stations:[
      S("spell","Lava spellers","Listen, then spell the long vowel word.",{words:specOf("reading",5,"build").words.concat(specOf("reading",8,"build").words), rounds:5}),
      S("pop","Silent e bubbles","Pop the words that end with a silent e.",{gen:POP.silentE, say:true}),
      S("race","Eruption race","Answer before the volcano erupts!",{pool:pool("reading",range(5,9)), runner:"🏃"})]},
    {id:"r3", s:"reading", ui:2, emoji:"🕵️", title:"Story Detectives", color:"#5A6690", story:"Crack the case by figuring out what happens in each story.", stations:[
      S("order","Put the clues in order","Tap the events in the right order.",{sets:()=>specOf("reading",9,"order").sets.concat(specOf("reading",35,"order").sets)}),
      S("match","Problem and solution","Match each problem to how it was solved.",{pairs:()=>PAIRS.problems}),
      S("board","Case board","Answer story questions to solve the case.",{pool:pool("reading",range(10,13)), piece:"🔍"})]},
    {id:"r4", s:"reading", ui:3, emoji:"🧪", title:"Sound Lab", color:"#3FB58A", story:"Mix letters together in the lab to make tricky sounds.", stations:[
      S("pop","Sound bubbles","Pop the words with the sound.",{gen:()=>pick([popSort("reading",14,["Tap the ar words","Tap the or words"]),popSort("reading",16,["Tap the oi words","Tap the oy words"]),popSort("reading",17,["Tap the ou words","Tap the ow words"])])(), say:true}),
      S("spell","Lab spellers","Listen, then spell the word.",{words:specOf("reading",15,"build").words, rounds:5}),
      S("match","Word mixer","Match the two small words to the compound word.",{pairs:()=>PAIRS.compounds})]},
    {id:"r5", s:"reading", ui:4, emoji:"🔎", title:"Fact Finders", color:"#2F8FD6", story:"Search the library for facts and spot the opinions.", stations:[
      S("sort","Fact or opinion","Sort each sentence.",{from:["reading",20]}),
      S("pop","Why was it written?","Pop the ones that match the rule.",{gen:popSort("reading",22,["Tap the ones written to teach","Tap the ones written to entertain","Tap the ones written to persuade"])}),
      S("board","Library hunt","Answer nonfiction questions to find the secret book.",{pool:pool("reading",range(19,22)), piece:"📚"})]},
    {id:"r6", s:"reading", ui:5, emoji:"🔨", title:"Word Workshop", color:"#C9693A", story:"Build new words by adding parts in the workshop.", stations:[
      S("match","Word parts","Match each word to what it means.",{pairs:()=>PAIRS.wordParts}),
      S("pop","Same or opposite","Pop the pairs that match the rule.",{gen:popSort("reading",27,["Tap the pairs that mean the same","Tap the opposite pairs"])}),
      S("race","Workshop race","Answer word questions fast!",{pool:pool("reading",range(23,27)), runner:"🔨"})]},
    {id:"r7", s:"reading", ui:6, emoji:"🧚", title:"Fairy Tale Forest", color:"#C46BC9", story:"Walk through the forest of fables, poems and fairy tales.", stations:[
      S("order","Story path","Put the fairy tale events in order.",{sets:()=>specOf("reading",28,"order").sets.concat(specOf("reading",29,"order").sets)}),
      S("match","Rhyme match","Match the rhyming words.",{pairs:()=>PAIRS.rhymes}),
      S("board","Enchanted board","Answer questions to cross the forest.",{pool:pool("reading",range(28,31)), piece:"🧚"})]},
    {id:"r8", s:"reading", ui:7, emoji:"☕", title:"Writers’ Café", color:"#9B6B43", story:"Serve up great sentences and stories at the café.", stations:[
      S("pop","Sentence bubbles","Pop the complete sentences.",{gen:POP.sentences}),
      S("order","Recipe steps","Put the how-to steps in order.",{sets:()=>specOf("reading",34,"order").sets}),
      S("race","Café rush","Answer writing questions before the café closes!",{pool:pool("reading",range(32,36)), runner:"☕"})]},
    {id:"s1", s:"science", ui:0, emoji:"🔬", title:"Lab Explorers", color:"#2F8FD6", story:"Grab your goggles. It’s time to think like a scientist!", stations:[
      S("match","Tool match","Match each tool to what it does.",{pairs:()=>PAIRS.tools}),
      S("order","Experiment steps","Put the science steps in order.",{sets:()=>specOf("science",3,"order").sets}),
      S("board","Lab board","Answer science questions to finish the experiment.",{pool:pool("science",range(1,3)), piece:"🧪"})]},
    {id:"s2", s:"science", ui:1, emoji:"🧊", title:"Matter Mixers", color:"#3E9FE0", story:"Freeze it, melt it, sort it. Explore solids, liquids and gases.", stations:[
      S("sort","Matter sort","Sort each thing into solid, liquid or gas.",{from:["science",4]}),
      S("pop","Change bubbles","Pop the changes that match the rule.",{gen:popSort("science",7,["Tap the changes you can undo","Tap the changes you can’t undo"])}),
      S("race","Melting race","Answer before the ice cube melts!",{pool:pool("science",range(4,8)), runner:"🧊"})]},
    {id:"s3", s:"science", ui:2, emoji:"🌱", title:"Garden Growers", color:"#3FB58A", story:"Grow a garden from tiny seeds to big flowers.", stations:[
      S("order","Grow a plant","Put the plant life cycle in order.",{sets:()=>specOf("science",11,"order").sets}),
      S("match","Plant parts","Match each plant part to its job.",{pairs:()=>PAIRS.plants}),
      S("sort","Seed travelers","Sort how each seed travels.",{from:["science",12]})]},
    {id:"s4", s:"science", ui:3, emoji:"🦓", title:"Zoo Keepers", color:"#C98A2E", story:"Help every animal find the right home at the zoo.", stations:[
      S("sort","Habitat homes","Sort each animal into its habitat.",{from:["science",14]}),
      S("order","Growing up","Put the life cycle in order.",{sets:()=>specOf("science",15,"order").sets.concat(specOf("science",16,"order").sets)}),
      S("pop","Living or not","Pop the ones that match the rule.",{gen:popSort("science",17,["Tap the living things","Tap the nonliving things"])})]},
    {id:"s5", s:"science", ui:4, emoji:"🗺️", title:"Earth Explorers", color:"#7FB33A", story:"Explore mountains, rivers and oceans all over the Earth.", stations:[
      S("match","Landform match","Match each landform to what it looks like.",{pairs:()=>PAIRS.land}),
      S("sort","Salt or fresh","Sort each kind of water.",{from:["science",19]}),
      S("race","Explorer race","Answer Earth questions as fast as you can!",{pool:pool("science",range(18,22)), runner:"🧭"})]},
    {id:"s6", s:"science", ui:5, emoji:"⛅", title:"Weather Watchers", color:"#5BA8E0", story:"Track the weather and get ready for every season.", stations:[
      S("sort","Season sort","Sort each thing into summer or winter.",{from:["science",25]}),
      S("order","Water cycle","Put the water cycle in order.",{sets:()=>specOf("science",24,"order").sets}),
      S("board","Storm board","Answer weather questions to beat the storm.",{pool:pool("science",range(23,26)), piece:"☂️"})]},
    {id:"s7", s:"science", ui:6, emoji:"🌙", title:"Space Cadets", color:"#5867D6", story:"Blast off to visit the sun, moon, stars and planets.", stations:[
      S("order","Planet line-up","Put the planets in order from the sun.",{sets:()=>specOf("science",30,"order").sets}),
      S("match","Space match","Match each space word to what it means.",{pairs:()=>PAIRS.space}),
      S("race","Comet race","Answer space questions at comet speed!",{pool:pool("science",range(27,30)), runner:"☄️"})]},
    {id:"s8", s:"science", ui:7, emoji:"⚙️", title:"Inventors’ Workshop", color:"#8C8C9E", story:"Push, pull, stick and build your way to a great invention.", stations:[
      S("sort","Magnet test","Sort what a magnet sticks to.",{from:["science",32]}),
      S("pop","Push or pull","Pop the ones that match the rule.",{gen:popSort("science",31,["Tap the pushes","Tap the pulls"])}),
      S("order","Engineer steps","Put the engineering steps in order.",{sets:()=>specOf("science",36,"order").sets})]}
  ];
  window.MAZ_GAMES = GAMES;
  const FACE_LEFT = ["🐒","🐴","🐎","🐝","🦒","🏃","☄️"];
  const SUBJ = {math:"Math", reading:"Reading", science:"Science"};
  const gameStars = g => g.stations.reduce((a,_,k)=>a+(API.best ? API.best("game:"+g.id+":"+k) : 0), 0);

  /* ---------- station players ---------- */
  function playStation(el, g, k, done){
    const st = g.stations[k];
    let rounds = st.rounds || 0, i = 0, firsts = 0, missed = false;
    const fb = (t, ok) => { const f = el.querySelector(".act-fb"); if(f){ f.textContent = t; f.className = "act-fb " + (ok ? "ok" : "no"); } };
    const shake = b => { if(!b) return; b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); };
    const top = extra => '<div class="act-top"><span>'+esc(st.title)+'</span><span>'+(extra||"")+'</span></div>';
    const roundStars = () => firsts === rounds ? 3 : firsts >= Math.ceil(rounds*.6) ? 2 : 1;
    function nextRound(fn){ if(!missed) firsts++; setTimeout(()=>{ i++; if(i < rounds) fn(); else done(roundStars()); }, 1000); }

    if(st.type === "pop"){
      let board = 0, mistakes = 0;
      const show = () => {
        const b = st.gen(); const need = b.items.filter(x=>x[1]).length; let got = 0;
        el.innerHTML = top("Board "+(board+1)+" of 2") + '<div class="act-q"><p>'+esc(b.rule)+'</p></div><div class="popgrid">'+b.items.map((it,j)=>'<button class="bubble" data-j="'+j+'">'+(b.html ? it[0] : esc(it[0]))+'</button>').join("")+'</div><div class="act-fb" aria-live="polite">Find all '+need+'!</div>';
        el.querySelectorAll(".bubble").forEach(btn=>btn.onclick=()=>{
          const it = b.items[+btn.dataset.j];
          if(st.say && !b.html) speak(it[0]);
          if(it[1]){ btn.classList.add("popped"); btn.disabled = true; got++; tone(true); fb(got < need ? (need-got)+" more to go!" : "Board cleared!", true); if(got === need){ board++; setTimeout(()=>{ if(board < 2) show(); else done(mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1); }, 900); } }
          else { mistakes++; tone(false); shake(btn); fb("Not that one. Read the rule again.", false); }
        });
      };
      return show();
    }

    if(st.type === "match"){
      const pairs = shuffle(typeof st.pairs === "function" ? st.pairs() : st.pairs).slice(0,6);
      const cards = shuffle(pairs.flatMap((p,j)=>[{t:p[0],j},{t:p[1],j}]));
      let open = [], moves = 0, matched = 0, lock = false;
      el.innerHTML = top('Moves: <b id="mv">0</b>') + '<div class="act-q"><p>Flip two cards to find a match.</p></div><div class="memgrid">'+cards.map((c,x)=>'<button class="mem" data-x="'+x+'"><span class="back">?</span><span class="front">'+(c.t.startsWith("<svg") ? c.t : esc(c.t))+'</span></button>').join("")+'</div><div class="act-fb" aria-live="polite"></div>';
      el.querySelectorAll(".mem").forEach(b=>b.onclick=()=>{
        if(lock || b.classList.contains("up")) return;
        b.classList.add("up"); open.push(b);
        if(open.length === 2){
          moves++; el.querySelector("#mv").textContent = moves; lock = true;
          const [a, c] = open;
          if(cards[+a.dataset.x].j === cards[+c.dataset.x].j){ tone(true); a.classList.add("got"); c.classList.add("got"); open = []; lock = false; matched++; fb("Match!", true); if(matched === pairs.length) setTimeout(()=>done(moves <= pairs.length+3 ? 3 : moves <= pairs.length+7 ? 2 : 1), 700); }
          else setTimeout(()=>{ a.classList.remove("up"); c.classList.remove("up"); open = []; lock = false; }, 900);
        }
      });
      return;
    }

    if(st.type === "race"){
      let score = 0, left = 60, timer;
      el.innerHTML = top('⏱ <b id="tl">60</b>s') + '<div class="track"><span class="runner" id="rn"'+(FACE_LEFT.includes(st.runner)?' style="transform:scaleX(-1)"':'')+'>'+st.runner+'</span><span class="finish">🏁</span></div><div id="rq"></div><div class="act-fb" aria-live="polite"></div>';
      const rn = el.querySelector("#rn");
      const ask = () => {
        const q = st.pool();
        el.querySelector("#rq").innerHTML = '<div class="act-q"><p>'+esc(q.q)+'</p></div>'+(q.vis?'<div class="act-vis">'+q.vis+'</div>':'')+'<div class="opts">'+q.opts.map((o,j)=>'<button class="opt" data-j="'+j+'">'+esc(o)+'</button>').join("")+'</div>';
        el.querySelectorAll("#rq .opt").forEach(b=>b.onclick=()=>{ if(left <= 0) return; if(+b.dataset.j === q.a){ score++; tone(true); fb("+1! Score: "+score, true); rn.style.left = Math.min(88, score*9)+"%"; ask(); } else { tone(false); shake(b); fb("Oops! Try another answer.", false); } });
      };
      ask();
      timer = setInterval(()=>{ left--; const t = el.querySelector("#tl"); if(!t){ clearInterval(timer); return; } t.textContent = left; if(left <= 0){ clearInterval(timer); fb("Time! You got "+score+" right.", true); el.querySelectorAll("#rq .opt").forEach(b=>b.disabled=true); setTimeout(()=>done(score >= 8 ? 3 : score >= 5 ? 2 : score >= 1 ? 1 : 0), 1200); } }, 1000);
      return;
    }

    if(st.type === "board"){
      const N = 14; let pos = 0, wrong = 0;
      const draw = () => '<div class="board">'+Array.from({length:N+1},(_,x)=>'<span class="sq'+(x===N?' end':'')+(x===pos?' here':'')+'">'+(x===pos ? st.piece : x===N ? "🏆" : x)+'</span>').join("")+'</div>';
      const ask = () => {
        const q = st.pool();
        el.innerHTML = top("Space "+pos+" of "+N) + draw() + '<div class="act-q"><p>'+esc(q.q)+'</p></div>'+(q.vis?'<div class="act-vis">'+q.vis+'</div>':'')+'<div class="opts">'+q.opts.map((o,j)=>'<button class="opt" data-j="'+j+'">'+esc(o)+'</button>').join("")+'</div><div class="act-fb" aria-live="polite"></div>';
        let tried = false;
        el.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
          if(+b.dataset.j === q.a){ const roll = tried ? 1 : R(1,3); pos = Math.min(N, pos+roll); tone(true); el.querySelectorAll(".opt").forEach(x=>x.disabled=true); fb("🎲 You rolled "+roll+"! Move "+roll+" space"+(roll>1?"s":"")+".", true); setTimeout(()=>{ if(pos >= N) done(wrong <= 1 ? 3 : wrong <= 3 ? 2 : 1); else ask(); }, 1100); }
          else { if(!tried) wrong++; tried = true; tone(false); shake(b); fb("Not quite. Find the right answer to roll.", false); }
        });
      };
      return ask();
    }

    if(st.type === "build"){
      rounds = st.rounds;
      const show = () => {
        missed = false; const tg = st.target(); let placed = [];
        const toks = st.groupTarget ? [{v:tg.g, l:"+ group of "+tg.g, c:"tg"}] : st.tokens;
        const sum = () => placed.reduce((a,b)=>a+b.v,0);
        const tray = () => st.display === "ruler" ? rulerSVG(Math.min(sum(),12), 12) : st.display === "emoji" ? '<div class="pile bar">'+(tg.e.repeat(sum()) || '<span class="kicker">Tap +1 to grow the bar</span>')+'</div>' : '<div class="chips">'+(placed.map(p=>'<span class="tok '+p.c+'">'+esc(p.l)+'</span>').join("") || '<span class="kicker">Tap the buttons to add.</span>')+'</div>';
        el.innerHTML = top("Round "+(i+1)+" of "+rounds) + '<div class="act-q"><p>'+esc(tg.show)+'</p></div>'+(tg.vis||"")+'<div class="tray" id="tray">'+tray()+'</div><div class="opts">'+toks.map((t,j)=>'<button class="opt tokbtn '+t.c+'" data-j="'+j+'">'+esc(t.l)+'</button>').join("")+'<button class="opt" data-x="undo">↩ Undo</button><button class="opt go" data-x="check">Check</button></div><div class="act-fb" aria-live="polite"></div>';
        const paint = () => { el.querySelector("#tray").innerHTML = tray(); };
        el.querySelectorAll(".tokbtn").forEach(b=>b.onclick=()=>{ placed.push(toks[+b.dataset.j]); paint(); });
        el.querySelector('[data-x="undo"]').onclick = () => { placed.pop(); paint(); };
        el.querySelector('[data-x="check"]').onclick = () => {
          const s = sum();
          if(s === tg.n){ tone(true); fb("Perfect! That’s exactly "+tg.n+".", true); el.querySelectorAll(".opts .opt").forEach(x=>x.disabled=true); nextRound(show); }
          else { missed = true; tone(false); fb(s < tg.n ? "Not enough yet. Add more!" : "That’s too much. Take some away!", false); }
        };
      };
      return show();
    }

    if(st.type === "clock"){
      rounds = st.rounds;
      const show = () => {
        missed = false; const th = R(1,12), tm = R(0,11)*5; let h = 12, m = 0;
        const f = (H,M) => H+":"+String(M).padStart(2,"0");
        el.innerHTML = top("Round "+(i+1)+" of "+rounds) + '<div class="act-q"><p>Set the clock to '+f(th,tm)+'</p></div><div class="clockset"><div id="ck">'+clockSVG(h,m)+'</div><div class="ckbtns"><span>Hour</span><button class="opt" data-a="h-">−</button><button class="opt" data-a="h+">+</button><span>Minutes</span><button class="opt" data-a="m-">−5</button><button class="opt" data-a="m+">+5</button></div></div><div class="opts"><button class="opt go" data-a="check">Check</button></div><div class="act-fb" aria-live="polite"></div>';
        const paint = () => { el.querySelector("#ck").innerHTML = clockSVG(h,m); };
        el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{
          const a = b.dataset.a;
          if(a==="h+") h = h%12+1; if(a==="h-") h = (h+10)%12+1;
          if(a==="m+") m = (m+5)%60; if(a==="m-") m = (m+55)%60;
          if(a==="check"){ if(h===th && m===tm){ tone(true); fb("Right on time!", true); el.querySelectorAll(".opt").forEach(x=>x.disabled=true); nextRound(show); } else { missed = true; tone(false); fb("Not yet. The clock shows "+f(h,m)+".", false); } return; }
          paint();
        });
      };
      return show();
    }

    if(st.type === "sort"){
      const sp = specOf(st.from[0], st.from[1], "sort"); const items = shuffle(sp.items).slice(0,8); rounds = items.length; const placed = [];
      const show = () => {
        missed = false; const it = items[i];
        el.innerHTML = top("Item "+(i+1)+" of "+rounds) + '<div class="act-q"><p>Where does “'+esc(it[0])+'” go?</p><button class="say" aria-label="Read it to me">🔊</button></div><div class="bins">'+sp.bins.map((b,j)=>'<button class="bin b'+j+'" data-j="'+j+'">'+esc(b)+'</button>').join("")+'</div>'+(placed.length?'<div class="placed">'+sp.bins.map((b,j)=>'<div><small>'+esc(b)+'</small>'+placed.filter(p=>p[1]===j).map(p=>'<span class="chip">'+esc(p[0])+'</span>').join("")+'</div>').join("")+'</div>':'')+'<div class="act-fb" aria-live="polite"></div>';
        el.querySelector(".say").onclick = () => speak(it[0]);
        el.querySelectorAll(".bin").forEach(b=>b.onclick=()=>{ if(+b.dataset.j === it[1]){ tone(true); placed.push(it); fb("Yes!", true); el.querySelectorAll(".bin").forEach(x=>x.disabled=true); nextRound(show); } else { missed = true; tone(false); shake(b); fb("Not there. Try another one.", false); } });
      };
      return show();
    }

    if(st.type === "spell"){
      const words = shuffle(st.words).slice(0, st.rounds); rounds = words.length;
      const show = () => {
        missed = false; const w = words[i]; const letters = w.split(""); const extra = shuffle("abcdefghilmnoprstu".split("").filter(c=>!letters.includes(c))).slice(0,2); const tiles = shuffle(letters.concat(extra)); let typed = [];
        el.innerHTML = top("Word "+(i+1)+" of "+rounds) + '<div class="act-q"><p>Listen, then spell the word.</p><button class="say" aria-label="Hear the word">🔊</button></div><div class="slots"></div><div class="tiles">'+tiles.map((c,j)=>'<button class="tile" data-j="'+j+'">'+c+'</button>').join("")+'</div><div class="opts"><button class="opt" data-x="undo">↩ Undo</button><button class="opt go" data-x="check">Check</button></div><div class="act-fb" aria-live="polite"></div>';
        const slots = el.querySelector(".slots");
        const paint = () => { slots.innerHTML = letters.map((_,j)=>'<span class="slot">'+(typed[j]!==undefined ? tiles[typed[j]] : "")+'</span>').join(""); el.querySelectorAll(".tile").forEach(t=>t.disabled = typed.includes(+t.dataset.j)); };
        el.querySelector(".say").onclick = () => speak(w); setTimeout(()=>speak(w), 300);
        el.querySelectorAll(".tile").forEach(t=>t.onclick=()=>{ if(typed.length < letters.length){ typed.push(+t.dataset.j); paint(); } });
        el.querySelector('[data-x="undo"]').onclick = () => { typed.pop(); paint(); };
        el.querySelector('[data-x="check"]').onclick = () => { if(typed.map(j=>tiles[j]).join("") === w){ tone(true); slots.classList.add("right"); fb("You spelled “"+w+"”!", true); el.querySelectorAll(".tile,.opt").forEach(x=>x.disabled=true); nextRound(show); } else { missed = true; tone(false); fb("Not yet. It starts with “"+w[0]+"”. Tap 🔊 to hear it again.", false); typed = []; paint(); } };
        paint();
      };
      return show();
    }

    if(st.type === "order"){
      const sets = shuffle(st.sets()).slice(0,3); rounds = sets.length;
      const show = () => {
        missed = false; const set = sets[i]; const sh = shuffle(set.items); let next = 0;
        el.innerHTML = top("Puzzle "+(i+1)+" of "+rounds) + '<div class="act-q"><p>'+esc(set.q)+'</p></div><ol class="ordered"></ol><div class="ordopts">'+sh.map((o,j)=>'<button class="opt" data-j="'+j+'">'+esc(o)+'</button>').join("")+'</div><div class="act-fb" aria-live="polite"></div>';
        const ol = el.querySelector(".ordered");
        el.querySelectorAll(".ordopts .opt").forEach(b=>b.onclick=()=>{ if(sh[+b.dataset.j] === set.items[next]){ next++; b.remove(); ol.insertAdjacentHTML("beforeend","<li>"+esc(set.items[next-1])+"</li>"); tone(true); if(next === set.items.length){ fb("All in order!", true); nextRound(show); } } else { missed = true; tone(false); shake(b); fb("Not that one yet. What comes next?", false); } });
      };
      return show();
    }
  }

  /* ---------- game page ---------- */
  if(page === "game"){
    const id = new URLSearchParams(location.search).get("id");
    const g = GAMES.find(x=>x.id===id) || GAMES[0];
    const main = document.getElementById("main");
    document.title = g.title + " | MAZ School";
    const map = () => {
      const tot = gameStars(g);
      main.innerHTML = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../games/index.html">Games</a><span>/</span><span>'+esc(g.title)+'</span></nav>' +
        '<section class="gamehero" style="--gc:'+g.color+'"><span class="gemoji">'+g.emoji+'</span><div><span class="kicker">'+SUBJ[g.s]+' · Unit '+(g.ui+1)+': '+esc(C[g.s].units[g.ui].t)+'</span><h1>'+esc(g.title)+'</h1><p>'+esc(g.story)+'</p><p class="gtot">⭐ '+tot+' of 9 stars</p></div></section>' +
        '<div class="stations">'+g.stations.map((st,k)=>{ const b = API.best ? API.best("game:"+g.id+":"+k) : 0; return '<button class="card station" data-k="'+k+'" style="--gc:'+g.color+'"><span class="snum">'+(k+1)+'</span><b>'+esc(st.title)+'</b><span>'+esc(st.intro)+'</span><span class="sstars">'+starStr(b)+'</span><span class="btn small">'+(b ? "Play again" : "Play")+'</span></button>'; }).join("")+'</div>' +
        (API.me && API.me() ? '' : '<div class="card notice">Stars won’t be saved until you pick who’s learning. <a class="btn small" href="../stars/index.html">Pick a learner</a></div>') +
        '<p style="margin-top:20px"><a class="btn ghost" href="../games/index.html">All games</a> <a class="btn ghost" href="../'+g.s+'/index.html">'+SUBJ[g.s]+' lessons</a></p>';
      main.querySelectorAll(".station").forEach(b=>b.onclick=()=>run(+b.dataset.k));
    };
    const run = k => {
      const st = g.stations[k];
      main.innerHTML = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../games/index.html">Games</a><span>/</span><a href="#" id="toMap">'+esc(g.title)+'</a><span>/</span><span>'+esc(st.title)+'</span></nav><section class="card practice gameplay" style="--c:'+g.color+'"><p class="kicker">Station '+(k+1)+' of 3 · '+esc(st.intro)+'</p><div id="gp"></div></section><p style="margin-top:14px"><button class="btn ghost" id="back">Back to the map</button></p>';
      main.querySelector("#toMap").onclick = e => { e.preventDefault(); map(); };
      main.querySelector("#back").onclick = map;
      window.scrollTo({top:0});
      playStation(main.querySelector("#gp"), g, k, stars => {
        const isNew = API.setBest ? API.setBest("game:"+g.id+":"+k, stars) : false;
        if(stars === 3) tone(true);
        main.querySelector("#gp").innerHTML = '<div class="act-done"><div class="big">'+starStr(stars)+'</div><p><b>Station complete! You earned '+stars+' of 3 stars.</b></p><p class="kicker">'+(isNew ? "New best score!" : "")+'</p><div class="lbtns" style="justify-content:center">'+(k < 2 ? '<button class="btn" id="nx">Next station</button>' : '<button class="btn" id="mp">See your stars</button>')+'<button class="btn ghost" id="ag">Play again</button></div></div>';
        const nx = main.querySelector("#nx"); if(nx) nx.onclick = () => run(k+1);
        const mp = main.querySelector("#mp"); if(mp) mp.onclick = map;
        main.querySelector("#ag").onclick = () => run(k);
      });
    };
    map();
  }

  /* ---------- arcade page ---------- */
  if(page === "games"){
    document.title = "Games | MAZ School";
    const main = document.getElementById("main");
    let h = '<nav class="crumbs"><a href="../index.html">Home</a><span>/</span><span>Games</span></nav><h1>Game arcade</h1><p class="lead">One game for every unit, with three stations in each. Earn up to 9 stars per game. Stars are saved for whoever is learning.</p>' +
      '<a class="card feature" href="../moon-bakery/index.html" style="margin-bottom:10px"><span class="gemoji sm">🍪</span><span><h3>Moon Bakery Math</h3><p>Pack cookies into boxes of 10. Goes with Math unit 2.</p></span></a>';
    ["math","reading","science"].forEach(s=>{
      h += '<section class="sec"><h2>'+SUBJ[s]+'</h2><div class="arcade">' + GAMES.filter(g=>g.s===s).map(g=>'<a class="card agame" href="../game/index.html?id='+g.id+'" style="--gc:'+g.color+'"><span class="gemoji sm">'+g.emoji+'</span><b>'+esc(g.title)+'</b><small>Unit '+(g.ui+1)+': '+esc(C[s].units[g.ui].t)+'</small><span class="gst">⭐ '+gameStars(g)+' / 9</span></a>').join("") + '</div></section>';
    });
    main.innerHTML = h;
  }

  /* ---------- lesson page: unit game button ---------- */
  const slot = document.getElementById("unitGame");
  if(slot){
    const g = GAMES.find(x=>x.s===slot.dataset.s && x.ui===+slot.dataset.ui);
    if(g) slot.innerHTML = '<a class="unitgame" href="../game/index.html?id='+g.id+'" style="--gc:'+g.color+'"><span class="gemoji sm">'+g.emoji+'</span><span><small>Unit game</small><b>Play '+esc(g.title)+'</b></span><span class="gst">⭐ '+gameStars(g)+' / 9</span></a>';
  }
})();
