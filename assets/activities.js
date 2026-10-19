/* MAZ School interactive practice for every week. Math is generated fresh each time. */
(function(){
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);
function mcq(q,c,w,vis){const o=shuffle([c,...w.filter(x=>String(x)!==String(c))].map(String));return {t:"mcq",q,opts:o,a:o.indexOf(String(c)),vis};}
function num(q,a,vis){return {t:"num",q,a,vis};}
function near(n,s){const out=new Set();let g=0;while(out.size<2&&g++<50){const d=R(-s,s);if(d&&n+d>=0)out.add(n+d);}return [...out];}

/* visuals */
const V={
 tens:(t,o)=>'<div class="v-bt">'+'<span class="ten"></span>'.repeat(t)+'<span class="ones">'+'<span class="one"></span>'.repeat(o)+'</span></div>',
 hund:(h,t,o)=>'<div class="v-bt">'+'<span class="hund"></span>'.repeat(h)+'<span class="ten"></span>'.repeat(t)+'<span class="ones">'+'<span class="one"></span>'.repeat(o)+'</span></div>',
 pairs:n=>{let s='<div class="v-pairs">';for(let i=0;i<Math.ceil(n/2);i++){s+='<span class="pr"><i></i>'+(i*2+1<n?'<i></i>':'')+'</span>';}return s+'</div>';},
 clock:(h,m)=>{let s='<svg class="v-clock" viewBox="0 0 120 120" role="img" aria-label="clock"><circle cx="60" cy="60" r="56" class="face"/>';for(let i=1;i<=12;i++){const a=i*Math.PI/6;s+='<text x="'+(60+44*Math.sin(a)).toFixed(1)+'" y="'+(64-44*Math.cos(a)).toFixed(1)+'" text-anchor="middle">'+i+'</text>';}
  const ha=((h%12)+m/60)*30*Math.PI/180, ma=m*6*Math.PI/180;
  s+='<line x1="60" y1="60" x2="'+(60+26*Math.sin(ha)).toFixed(1)+'" y2="'+(60-26*Math.cos(ha)).toFixed(1)+'" class="hh"/><line x1="60" y1="60" x2="'+(60+40*Math.sin(ma)).toFixed(1)+'" y2="'+(60-40*Math.cos(ma)).toFixed(1)+'" class="mh"/><circle cx="60" cy="60" r="4" class="pin"/></svg>';return s;},
 ruler:(len,max,unit,len2)=>{const w=300,px=(w-20)/max;let s='<svg class="v-ruler" viewBox="0 0 '+w+' '+(len2?110:80)+'">';
  s+='<rect x="10" y="12" width="'+(len*px)+'" height="16" rx="8" class="bar1"/>';if(len2)s+='<rect x="10" y="36" width="'+(len2*px)+'" height="16" rx="8" class="bar2"/>';
  const y=len2?60:36;s+='<rect x="6" y="'+y+'" width="'+(w-12)+'" height="34" rx="4" class="rul"/>';
  for(let i=0;i<=max;i++){const x=10+i*px;s+='<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y+12)+'" class="tick"/><text x="'+x+'" y="'+(y+28)+'" text-anchor="middle">'+i+'</text>';}
  return s+'<text x="'+(w-8)+'" y="'+(y-4)+'" text-anchor="end" class="unit">'+unit+'</text></svg>';},
 coins:list=>'<div class="v-coins">'+list.map(c=>'<span class="coin c'+c+'">'+c+'¢</span>').join('')+'</div>',
 dots:(r,c)=>'<div class="v-arr" style="grid-template-columns:repeat('+c+',22px)">'+'<i></i>'.repeat(r*c)+'</div>',
 groups:(g,n)=>'<div class="v-groups">'+('<span class="grp">'+'<i></i>'.repeat(n)+'</span>').repeat(g)+'</div>',
 poly:n=>{let p=[];for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;p.push((60+48*Math.cos(a)).toFixed(1)+','+(60+48*Math.sin(a)).toFixed(1));}return '<svg class="v-poly" viewBox="0 0 120 120"><polygon points="'+p.join(' ')+'"/></svg>';},
 frac:n=>{let s='<svg class="v-frac" viewBox="0 0 240 90"><rect x="4" y="4" width="232" height="82" rx="6"/>';for(let i=1;i<n;i++){const x=4+232*i/n;s+='<line x1="'+x+'" y1="4" x2="'+x+'" y2="86"/>';}return s+'</svg>';},
 bars:(cats,vals)=>{const mx=Math.max(...vals,6);let s='<svg class="v-bars" viewBox="0 0 260 170">';for(let y=0;y<=mx;y++){const yy=140-y*120/mx;s+='<line x1="30" y1="'+yy+'" x2="250" y2="'+yy+'" class="grid"/><text x="22" y="'+(yy+4)+'" text-anchor="end">'+y+'</text>';}
  cats.forEach((c,i)=>{const x=46+i*70,h=vals[i]*120/mx;s+='<rect x="'+x+'" y="'+(140-h)+'" width="40" height="'+h+'" class="b'+i+'"/><text x="'+(x+20)+'" y="158" text-anchor="middle">'+c+'</text>';});return s+'</svg>';},
 pic:(cats,vals)=>'<div class="v-pic">'+cats.map((c,i)=>'<div><b>'+c[1]+'</b><span>'+c[0].repeat(vals[i])+'</span></div>').join('')+'</div>'
};

/* math generators, one per week */
const names=["Sam","Ava","Leo","Mia","Ben","Zoe","Max","Lily"];
const G={
1:()=>{const n=R(20,119);return pick([()=>num("What number comes after "+n+"?",n+1),()=>num("What number comes before "+n+"?",n-1),()=>num("What is 10 more than "+n+"?",n+10)])();},
2:()=>{const st=pick([2,5,10]),k=R(1,8),a=st*k;return num("Skip count by "+st+"s: "+a+", "+(a+st)+", "+(a+2*st)+", ___",a+3*st);},
3:()=>{const n=R(3,20);return mcq("Pair up the dots. Is "+n+" even or odd?",n%2?"Odd":"Even",["Even","Odd"],V.pairs(n));},
4:()=>{const a=R(10,95);return pick([()=>num("What number is between "+a+" and "+(a+2)+"?",a+1),()=>{const s=shuffle([a,a+R(2,9),a-R(2,9)]);return mcq("Which number is the greatest: "+s.join(", ")+"?",Math.max(...s),s);}])();},
5:()=>{const t=R(1,9),o=R(0,9);return pick([()=>num("How many cookies? Each box holds 10.",t*10+o,V.tens(t,o)),()=>num("How many tens are in "+(t*10+o)+"?",t)])();},
6:()=>{const h=R(1,9),t=R(0,9),o=R(0,9);return num(h+" hundreds, "+t+" tens and "+o+" ones make what number?",h*100+t*10+o,V.hund(Math.min(h,4),t,o).replace('class="v-bt"','class="v-bt'+(h>4?' hide':'')+'"'));},
7:()=>{let a=R(10,99),b=R(10,99);if(Math.random()<.15)b=a;if(Math.random()<.3)b=Math.floor(a/10)*10+R(0,9);return mcq("Which symbol makes it true?  "+a+" ___ "+b,a>b?">":a<b?"<":"=",[">","<","="]);},
8:()=>{const h=R(1,9),t=R(0,9),o=R(1,9);return pick([()=>num(h*100+" + "+t*10+" + "+o+" = ?",h*100+t*10+o),()=>mcq("Which is "+(h*100+t*10+o)+" in expanded form?",h*100+" + "+t*10+" + "+o,[h+" + "+t+" + "+o,h*10+" + "+t*100+" + "+o])])();},
9:()=>{const st=pick([10,100]),a=st===10?R(10,95)*10:R(1,6)*100;return num("Count by "+st+"s: "+a+", "+(a+st)+", "+(a+2*st)+", ___",a+3*st);},
10:()=>{const a=R(7,9),b=R(11-a,9);return num(a+" + "+b+" = ?  Hint: make a ten first.",a+b);},
11:()=>{const n=R(2,9);return Math.random()<.5?num(n+" + "+n+" = ?",2*n):num(n+" + "+(n+1)+" = ?  Hint: use the double "+n+" + "+n+".",2*n+1);},
12:()=>{const a=R(3,9),b=R(3,9),c=a+b;return num("If "+a+" + "+b+" = "+c+", then "+c+" − "+a+" = ?",b);},
13:()=>{const n=pick(names),a=R(5,12),b=R(2,8);return Math.random()<.5?num(n+" has "+a+" stickers and gets "+b+" more. How many stickers now?",a+b):num(n+" has "+(a+b)+" crackers and eats "+b+". How many are left?",a);},
14:()=>{const a=R(11,69),k=R(1,3)*10;return num(a+" + "+k+" = ?",a+k);},
15:()=>{const a1=R(1,5),a0=R(0,5),b1=R(1,4),b0=R(0,9-a0);return num((a1*10+a0)+" + "+(b1*10+b0)+" = ?",a1*10+a0+b1*10+b0);},
16:()=>{const a0=R(5,9),b0=R(10-a0,9),a1=R(1,4),b1=R(1,4);const a=a1*10+a0,b=b1*10+b0;return num(a+" + "+b+" = ?  Remember: 10 ones make a new ten.",a+b);},
17:()=>{const b1=R(1,4),a1=R(b1+1,9),b0=R(0,6),a0=R(b0,9);return num((a1*10+a0)+" − "+(b1*10+b0)+" = ?",(a1-b1)*10+a0-b0);},
18:()=>{const a0=R(0,5),b0=R(a0+1,9),b1=R(1,5),a1=R(b1+1,9);const a=a1*10+a0,b=b1*10+b0;return num(a+" − "+b+" = ?  Open a ten if you need to.",a-b);},
19:()=>{if(Math.random()<.25){const f=R(1,3);return num("How many inches are in "+f+" foot"+(f>1?"s":"")+"?",12*f);}const l=R(1,11);return num("How long is the bar in inches?",l,V.ruler(l,12,"inches"));},
20:()=>{const l=R(2,14);return num("How long is the bar in centimeters?",l,V.ruler(l,15,"cm"));},
21:()=>{const o=pick([["a crayon","4 inches",["4 feet","40 inches"]],["a pencil","7 inches",["7 feet","70 inches"]],["a door","7 feet",["7 inches","70 feet"]],["a car","15 feet",["15 inches","150 feet"]],["a book","10 inches",["10 feet","100 inches"]],["a bed","6 feet",["6 inches","60 feet"]],["a spoon","6 inches",["6 feet","60 inches"]],["a school bus","40 feet",["40 inches","4 inches"]]]);return mcq("About how long is "+o[0]+"?",o[1],o[2]);},
22:()=>{const a=R(5,11),b=R(1,a-1);return num("The pink bar is "+a+" inches. The blue bar is "+b+" inches. How much longer is the pink bar?",a-b,V.ruler(a,12,"inches",b));},
23:()=>{const h=R(1,12),m=pick([0,30]);const f=(H,M)=>H+":"+String(M).padStart(2,"0");return mcq("What time does the clock show?",f(h,m),[f(h,m?0:30),f(h%12+1,m),f(m?h:(h+11)%12||12,30)],V.clock(h,m));},
24:()=>{const h=R(1,12),m=R(1,11)*5;const f=(H,M)=>H+":"+String(M).padStart(2,"0");return mcq("What time does the clock show?",f(h,m),[f(h,(m+30)%60),f(m/5,h*5%60)].concat([f(h%12+1,m)]),V.clock(h,m));},
25:()=>{const c=pick([["penny",1],["nickel",5],["dime",10],["quarter",25]]);const lab=v=>v===1?"1 cent":v+" cents";return Math.random()<.5?mcq("How much is a "+c[0]+" worth?",lab(c[1]),[1,5,10,25].filter(v=>v!==c[1]).sort(()=>Math.random()-.5).slice(0,2).map(lab)):mcq("Which coin is worth "+lab(c[1])+"?",c[0][0].toUpperCase()+c[0].slice(1),["Penny","Nickel","Dime","Quarter"].filter(x=>x.toLowerCase()!==c[0]).sort(()=>Math.random()-.5).slice(0,2));},
26:()=>{let l=[];const k=R(2,5);for(let i=0;i<k;i++)l.push(pick([1,5,10,10,25]));l.sort((a,b)=>b-a);return num("How many cents in all?",l.reduce((a,b)=>a+b,0),V.coins(l));},
27:()=>{const cats=[["🍎","Apples"],["🍌","Bananas"],["🍇","Grapes"]],v=cats.map(()=>R(1,6));const i=R(0,2),j=(i+R(1,2))%3;return pick([()=>num("How many people picked "+cats[i][1].toLowerCase()+"?",v[i],V.pic(cats,v)),()=>num("How many votes in all?",v[0]+v[1]+v[2],V.pic(cats,v)),()=>{const a=v[i]>=v[j]?i:j,b=a===i?j:i;return num("How many more votes for "+cats[a][1].toLowerCase()+" than "+cats[b][1].toLowerCase()+"?",v[a]-v[b],V.pic(cats,v));}])();},
28:()=>{const cats=["Red","Blue","Green"],v=cats.map(()=>R(1,9));const i=R(0,2);return pick([()=>num("How many "+cats[i].toLowerCase()+" cars?",v[i],V.bars(cats,v)),()=>num("How many cars in all?",v[0]+v[1]+v[2],V.bars(cats,v)),()=>mcq("Which color has the most cars?",cats[v.indexOf(Math.max(...v))],cats,V.bars(cats,v))])();},
29:()=>{const s=pick([[3,"Triangle"],[4,"Square"],[5,"Pentagon"],[6,"Hexagon"],[8,"Octagon"]]);return Math.random()<.5?num("How many sides does this shape have?",s[0],V.poly(s[0])):mcq("What is this shape called?",s[1],["Triangle","Square","Pentagon","Hexagon","Octagon"].filter(x=>x!==s[1]).sort(()=>Math.random()-.5).slice(0,2),V.poly(s[0]));},
30:()=>{const o=pick([["⚽","a soccer ball","Sphere"],["🎲","a die","Cube"],["🥫","a can","Cylinder"],["🍦","an ice cream cone","Cone"],["📦","a box","Rectangular prism"],["🏀","a basketball","Sphere"]]);return mcq(o[0]+"  What solid shape is "+o[1]+"?",o[2],["Sphere","Cube","Cylinder","Cone","Rectangular prism"].filter(x=>x!==o[2]).sort(()=>Math.random()-.5).slice(0,2));},
31:()=>{const n=pick([2,3,4]);const w={2:"Halves",3:"Thirds",4:"Fourths"};return Math.random()<.5?mcq("This shape is split into equal parts. What are they called?",w[n],["Halves","Thirds","Fourths"],V.frac(n)):num("How many equal parts make the whole shape?",n,V.frac(n));},
32:()=>{const r=R(2,5),c=R(2,5);return num("How many dots? Count the rows and columns.",r*c,V.dots(r,c));},
33:()=>{const g=R(2,5),n=pick([2,3,5,10]);return num(g+" groups of "+n+". How many in all?",g*n,n<=5?V.groups(g,n):"");},
34:()=>{const a=R(100,599),b=R(100,399);return num(a+" + "+b+" = ?",a+b);},
35:()=>{const b=R(100,450),a=R(b+50,999);return num(a+" − "+b+" = ?",a-b);},
36:()=>G[pick([5,10,15,16,23,26,32,34])]()
};
const math={};for(let i=1;i<=36;i++)math[i]={gen:G[i],n:6};

/* reading and science */
const S=(bins,items,say)=>({type:"sort",bins,items,say:!!say});
const M=items=>({type:"mcq",items});
const B=words=>({type:"build",words});
const O=sets=>({type:"order",sets});
const reading={
1:S(["short a","short e","short i","short o","short u"],[["cat",0],["bed",1],["pig",2],["dog",3],["sun",4],["map",0],["web",1],["fox",3]],1),
2:B(["stop","frog","flag","crab","drum","slip"]),
3:S(["sh","ch","th"],[["ship",0],["chip",1],["thin",2],["shell",0],["chin",1],["bath",2],["fish",0],["lunch",1]],1),
4:S(["Character","Setting"],[["a brave knight",0],["a dark forest",1],["a talking cat",0],["a big castle",1],["a little girl",0],["the beach",1],["a grumpy troll",0],["outer space",1]]),
5:B(["cake","kite","hope","cube","bike","rope"]),
6:S(["ai","ay"],[["rain",0],["play",1],["tail",0],["day",1],["paint",0],["stay",1],["snail",0],["tray",1]],1),
7:S(["ee","ea"],[["tree",0],["seat",1],["feet",0],["leaf",1],["bee",0],["read",1],["green",0],["team",1]],1),
8:B(["boat","road","coat","snow","grow","slow"]),
9:O([{q:"Put the story in order.",items:["Sam plants a seed.","Sam waters it every day.","A little sprout pops up.","A big sunflower blooms."]},{q:"Put the story in order.",items:["Mia wakes up.","She eats breakfast.","She rides her bike to the park.","She plays on the swings."]}]),
10:M([["Dogs can fetch. Dogs can swim. Dogs can learn tricks. What is this mostly about?",["Things dogs can do","How to swim","Cats"]],["Bees make honey. Bees help flowers grow. Bees live in hives. What is the main idea?",["Facts about bees","Flowers are red","How to make toast"]],["We packed snacks, set up the tent and built a campfire. What is this mostly about?",["Going camping","Going to school","A snowy day"]],["Apples can be red, green or yellow. Some are sweet and some are sour. What is this mostly about?",["Apples","Bananas","Trees in winter"]]]),
11:S(["Feeling word","Not a feeling"],[["happy",0],["table",1],["sad",0],["angry",0],["chair",1],["excited",0],["pencil",1],["scared",0]],1),
12:S(["Problem","Solution"],[["The kite got stuck in a tree.",0],["Dad got a ladder and grabbed it.",1],["The puppy ran away.",0],["They found him at the park.",1],["It started to rain on the picnic.",0],["They ate under a tent.",1]]),
13:M([["Dark clouds fill the sky. What will probably happen next?",["It will rain","It will snow candy","The sun will get bigger"]],["Max drops his ice cream on the hot sidewalk. What will happen?",["It will melt","It will grow","It will fly away"]],["Lily puts on her swimsuit and grabs a towel. Where is she going?",["To the pool","To a snowball fight","To bed"]],["A puppy sees a ball roll by. What will it do?",["Chase the ball","Read a book","Bake a cake"]]]),
14:S(["ar","or"],[["car",0],["fork",1],["star",0],["corn",1],["park",0],["horn",1],["jar",0],["storm",1]],1),
15:B(["her","bird","fur","girl","turn","shirt"]),
16:S(["oi","oy"],[["coin",0],["boy",1],["soil",0],["toy",1],["point",0],["joy",1],["oil",0],["enjoy",1]],1),
17:S(["ou","ow"],[["out",0],["cow",1],["house",0],["town",1],["cloud",0],["owl",1],["mouth",0],["brown",1]],1),
18:M([["sun + flower = ?",["sunflower","flowersun","sunny"]],["rain + coat = ?",["raincoat","coatrain","rainy"]],["foot + ball = ?",["football","ballfoot","feet"]],["cup + cake = ?",["cupcake","cakecup","cups"]],["star + fish = ?",["starfish","fishstar","stars"]]]),
19:M([["You want to know what a picture shows. What do you read?",["The caption","The cover","The page number"]],["You want the chapter about sharks. Where do you look?",["The table of contents","A caption","The last page"]],["What tells you what a section is about?",["The heading","A period","The author’s name"]],["Words that point to parts of a diagram are called:",["Labels","Opinions","Rhymes"]]]),
20:S(["Fact","Opinion"],[["Cats have whiskers.",0],["Cats are the best pets.",1],["Water is wet.",0],["Rainy days are boring.",1],["A week has seven days.",0],["Broccoli tastes yucky.",1],["Birds have feathers.",0],["Soccer is the most fun sport.",1]]),
21:M([["Which question word asks about time?",["When","Where","Who"]],["Which question word asks about a place?",["Where","Why","What"]],["Which question word asks for a reason?",["Why","Who","When"]],["Which question word asks about a person?",["Who","Where","How"]],["Which question word asks how something is done?",["How","Who","Where"]]]),
22:S(["To teach","To entertain","To persuade"],[["A book about how volcanoes work",0],["A funny story about a dancing pig",1],["An ad that says buy Crunchy Cereal",2],["A guide to taking care of fish",0],["A fairy tale about a dragon",1],["A sign that says vote for Max for class leader",2]]),
23:M([["What does unlock mean?",["To open a lock","To lock again","A big lock"]],["What does redo mean?",["Do again","Not do","Do fast"]],["What does unkind mean?",["Not kind","Kind again","Very kind"]],["What does reread mean?",["Read again","Not read","Read slowly"]]]),
24:M([["What does careful mean?",["Full of care","Without care","Care again"]],["What does helpless mean?",["Without help","Full of help","Help again"]],["What does joyful mean?",["Full of joy","No joy","Joy again"]],["What does painless mean?",["Without pain","Full of pain","Pain again"]]]),
25:M([["Yesterday we ___ cookies.",["baked","bake","baking"]],["Right now the dog is ___.",["sleeping","slept","sleeps"]],["Last night I ___ a movie.",["watched","watch","watching"]],["Look! The frog is ___.",["hopping","hoped","hop"]]]),
26:M([["do not = ?",["don’t","doesn’t","didn’t"]],["I am = ?",["I’m","I’ll","I’d"]],["it is = ?",["it’s","its","it’ll"]],["we are = ?",["we’re","were","we’ll"]],["can not = ?",["can’t","cann’t","ca’nt"]]]),
27:S(["Same meaning","Opposite"],[["big / large",0],["hot / cold",1],["happy / glad",0],["up / down",1],["fast / quick",0],["day / night",1],["small / little",0],["open / shut",1]]),
28:O([{q:"Put The Tortoise and the Hare in order.",items:["The hare brags that he is the fastest.","The race starts and the hare zooms ahead.","The hare takes a nap under a tree.","The tortoise keeps going and wins."]}]),
29:O([{q:"Put Goldilocks and the Three Bears in order.",items:["The bears go for a walk.","Goldilocks tastes their porridge.","She falls asleep in Baby Bear’s bed.","The bears come home and find her."]},{q:"Put The Three Little Pigs in order.",items:["Three pigs build houses.","The wolf blows down the straw house.","The wolf blows down the stick house.","The brick house stays standing."]}]),
30:M([["Which word rhymes with cat?",["hat","cup","dog"]],["Which word rhymes with tree?",["bee","tray","top"]],["Which word rhymes with cake?",["lake","cat","kick"]],["Which word rhymes with moon?",["spoon","man","milk"]],["Which word rhymes with bug?",["rug","bag","big"]]]),
31:M([["Which sentence shows someone talking?",["“Let’s play,” said Ben.","Ben went to play.","Ben likes games."]],["Which sentence shows someone talking?",["“I’m hungry,” said Mom.","Mom was hungry.","Mom made lunch."]],["What do quotation marks show?",["The words someone says","A question","The end of the book"]],["Which sentence shows someone talking?",["“Look at that bird!” shouted Ava.","Ava saw a bird.","The bird flew away."]]]),
32:M([["Which is a complete sentence?",["The cat sat on the mat.","the cat","Sat on the mat"]],["Which sentence is written correctly?",["We went to the zoo.","we went to the zoo","We went to the zoo"]],["Which is a complete sentence?",["My dog barks.","My dog","Barks loud"]],["Which mark ends a question?",["?",".","!"]]]),
33:M([["Which sentence gives a reason?",["I like summer because I can swim.","I like summer.","Summer is a season."]],["Which sentence gives a reason?",["Dogs are great because they love to play.","Dogs are great.","I have a dog."]],["Which is an opinion?",["Recess is the best part of the day.","Recess is at noon.","We have recess outside."]],["Which word helps you give a reason?",["because","the","then"]]]),
34:O([{q:"Put the steps for making a sandwich in order.",items:["First, get two slices of bread.","Next, spread peanut butter on one slice.","Then, put the slices together.","Last, take a big bite!"]},{q:"Put the steps for brushing your teeth in order.",items:["First, wet your toothbrush.","Next, add toothpaste.","Then, brush every tooth.","Last, rinse your mouth."]}]),
35:O([{q:"Put this story in order: beginning, middle and end.",items:["Once upon a time, a dragon lived alone on a hill.","One day, he found a lost puppy.","He helped the puppy find its way home.","From then on, they were best friends."]},{q:"Put this story in order.",items:["Zoe wanted to win the science fair.","She built a volcano that did not work.","She fixed it and tried again.","Her volcano erupted and she won a ribbon."]}]),
36:B(["rain","boat","star","coin","shirt","cloud"])
};
const science={
1:M([["Which sense do you use to hear a bird sing?",["Hearing","Taste","Smell"]],["Which sense tells you a stove is hot?",["Touch","Sight","Hearing"]],["Which sense tells you a cookie is sweet?",["Taste","Hearing","Sight"]],["Which sense helps you see a rainbow?",["Sight","Smell","Touch"]],["Which sense tells you cookies are baking?",["Smell","Touch","Hearing"]]]),
2:M([["To see tiny bug legs, use a:",["Magnifier","Thermometer","Scale"]],["To measure how long a leaf is, use a:",["Ruler","Thermometer","Magnet"]],["To find out how hot it is, use a:",["Thermometer","Ruler","Magnifier"]],["To find out how heavy a rock is, use a:",["Scale","Ruler","Thermometer"]]]),
3:[O([{q:"Put the science steps in order.",items:["Ask a question","Make a prediction","Do the test","Write what happened"]}]),M([["Changing only one thing makes a test:",["Fair","Unfair","Silly"]],["A smart guess before a test is a:",["Prediction","Result","Tool"]]])],
4:S(["Solid","Liquid","Gas"],[["rock",0],["milk",1],["steam",2],["ice cube",0],["juice",1],["air in a balloon",2],["pencil",0],["rain",1]]),
5:S(["Hard","Soft"],[["rock",0],["pillow",1],["spoon",0],["cotton ball",1],["brick",0],["teddy bear",1],["nail",0],["sponge",1]]),
6:S(["Melts when heated","Freezes when cooled"],[["ice cube",0],["water",1],["chocolate",0],["juice",1],["butter",0],["milk",1]]),
7:S(["Can undo","Can’t undo"],[["Melting ice",0],["Baking a cake",1],["Folding paper",0],["Burning wood",1],["Freezing juice",0],["Cooking an egg",1],["Melting a crayon",0],["Popping popcorn",1]]),
8:M([["A LEGO castle is made of:",["Many small pieces","One big piece","Water"]],["If you take apart a block tower, you can:",["Build something new","Make the blocks vanish","Turn them into water"]],["A puzzle is made of:",["Many small pieces","Air","One piece"]]]),
9:M([["Which part takes in water from the soil?",["Roots","Flower","Leaf"]],["Which part makes food from sunlight?",["Leaves","Roots","Seeds"]],["Which part holds the plant up?",["Stem","Petal","Seed"]],["Which part makes seeds?",["Flower","Root","Stem"]]]),
10:S(["Plants need it","Plants don’t need it"],[["Water",0],["Sunlight",0],["Candy",1],["Air",0],["Toys",1],["Space to grow",0],["Music",1],["Video games",1]]),
11:[O([{q:"Put the plant life cycle in order.",items:["Seed","Sprout","Young plant","Flower","Fruit with seeds"]}]),M([["Bees help flowers by carrying:",["Pollen","Rocks","Water"]],["Seeds grow into:",["New plants","Rocks","Bugs"]]])],
12:S(["Wind","Animals","Water"],[["Dandelion seed",0],["Burr",1],["Coconut",2],["Maple seed",0],["Berry seeds",1],["Acorn carried by a squirrel",1],["Seed floating down a river",2]]),
13:S(["Animals need it","Animals don’t need it"],[["Food",0],["Water",0],["Video games",1],["Air",0],["Toys",1],["Shelter",0],["Money",1],["Cars",1]]),
14:S(["Desert","Ocean","Forest"],[["Camel",0],["Whale",1],["Deer",2],["Scorpion",0],["Octopus",1],["Bear",2],["Shark",1],["Squirrel",2]]),
15:O([{q:"Put the butterfly life cycle in order.",items:["Egg","Caterpillar","Chrysalis","Butterfly"]},{q:"Put the frog life cycle in order.",items:["Egg","Tadpole","Froglet","Frog"]}]),
16:O([{q:"Build the food chain, starting with the sun.",items:["Sun","Grass","Rabbit","Fox"]},{q:"Build the ocean food chain, starting with the sun.",items:["Sun","Seaweed","Small fish","Shark"]}]),
17:S(["Living","Nonliving"],[["Tree",0],["Rock",1],["Dog",0],["Car",1],["Flower",0],["Chair",1],["Mushroom",0],["Cloud",1]]),
18:M([["A very tall, pointy landform is a:",["Mountain","Plain","Valley"]],["Low land between mountains is a:",["Valley","Peak","Island"]],["Land with water all around it is an:",["Island","Hill","Plain"]],["Big, flat land is a:",["Plain","Mountain","Canyon"]]]),
19:S(["Salt water","Fresh water"],[["Ocean",0],["River",1],["Sea",0],["Pond",1],["Rain",1],["Glass of tap water",1]]),
20:M([["Erosion is when wind and water move:",["Soil and rock","Clouds","Stars"]],["What helps stop erosion?",["Plant roots","Bare dirt","Wind"]],["Over a long time, a river can carve a:",["Canyon","Mountain","Cloud"]]]),
21:M([["Soil is made of:",["Bits of rock and old plants","Plastic","Sugar"]],["Which is softer?",["Soil","Rock","Brick"]],["Worms help soil by:",["Mixing it up","Turning it to stone","Freezing it"]]]),
22:M([["On a map, a little tree symbol might mean:",["A park","A school","A road"]],["A map key tells you:",["What the symbols mean","The time","The weather"]],["A compass rose shows:",["Directions","Colors","Animals"]]]),
23:M([["A thermometer measures:",["Temperature","Rain","Wind"]],["A rain gauge measures:",["Rain","Temperature","Sunlight"]],["A windsock shows:",["Which way the wind blows","How much rain fell","How cloudy it is"]]]),
24:[O([{q:"Put the water cycle in order.",items:["The sun warms the water","Water rises as vapor","Vapor makes clouds","Rain falls back down"]}]),M([["Clouds are made of:",["Tiny water drops","Cotton","Smoke"]]])],
25:S(["Summer","Winter"],[["Swimming",0],["Building a snowman",1],["Sunscreen",0],["Mittens",1],["Ice pops",0],["Hot cocoa",1],["Lemonade stand",0],["Sledding",1]]),
26:S(["Safe","Not safe"],[["Going inside when there is lightning",0],["Swimming in a thunderstorm",1],["Going to the basement in a tornado warning",0],["Standing under a tree in lightning",1],["Staying away from fallen power lines",0],["Playing outside in a tornado warning",1]]),
27:M([["Day and night happen because Earth:",["Spins","Stops","Shrinks"]],["When your side of Earth faces the sun, it is:",["Day","Night","Winter"]],["Shadows are longest in the:",["Morning and evening","Middle of the day","Dark"]]]),
28:[O([{q:"Put the moon phases in order, starting with the new moon.",items:["New moon","First quarter (half moon)","Full moon","Last quarter (half moon)"]}]),M([["The moon’s light comes from the:",["Sun","Moon itself","Earth"]]])],
29:M([["The sun is a:",["Star","Planet","Moon"]],["A group of stars that makes a picture is a:",["Constellation","Comet","Cloud"]],["Stars look tiny because they are:",["Very far away","Very small","Painted on"]]]),
30:O([{q:"Put the planets in order from the sun.",items:["Mercury","Venus","Earth","Mars"]},{q:"Now the outer planets, in order from the sun.",items:["Jupiter","Saturn","Uranus","Neptune"]}]),
31:S(["Push","Pull"],[["Kicking a ball",0],["Opening a drawer",1],["Pushing a swing",0],["Pulling a wagon",1],["Closing a door",0],["Tug of war",1],["Throwing a ball",0],["Pulling weeds",1]]),
32:S(["Magnet sticks","Magnet doesn’t stick"],[["Paper clip",0],["Crayon",1],["Steel spoon",0],["Plastic cup",1],["Nail",0],["Wooden block",1],["Fridge door",0],["Penny",1]]),
33:S(["Lever","Wheel and axle","Ramp"],[["Seesaw",0],["Wagon",1],["Slide",2],["Bottle opener",0],["Bike",1],["Wheelchair ramp",2]]),
34:M([["Sound is made by:",["Vibrations","Light","Magnets"]],["A tight rubber band makes a ___ sound.",["High","Low","Silent"]],["Which makes a low sound?",["A big drum","A tiny bell","A whistle"]],["When you hum, your throat:",["Vibrates","Freezes","Glows"]]]),
35:S(["Light goes through","Light is blocked"],[["Window glass",0],["A book",1],["Plastic wrap",0],["Foil",1],["Clear water",0],["A wooden door",1],["A clear cup",0],["Your hand",1]]),
36:[O([{q:"Put the engineering steps in order.",items:["Ask","Plan","Build","Test","Improve"]}]),M([["After testing, engineers:",["Improve the design","Give up","Hide it"]]])]
};
window.ACTIVITIES={math,reading,science};
})();
