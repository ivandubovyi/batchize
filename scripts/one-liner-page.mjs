// The one-liner tester as its own page.
//
// This is the whole product in miniature: paste one sentence, get the check
// back instantly, with no signup and nothing to install. Someone arriving from
// a search for "yc 50 character description" can use it in four seconds, which
// is a far better introduction than a landing page explaining that they could.
//
// The lexicons are injected at build time from the same arrays the real
// analyzer uses, so this page cannot fall behind the checker.

export function oneLinerPage({ page, esc, BASE, SITE, QUESTIONS, BUZZ_STEMS, BUZZ_PHRASES, MISSION_SPEAK }) {
  const canonical = `${SITE}/one-liner-tester/`;

  const data = JSON.stringify({
    stems: BUZZ_STEMS,
    phrases: BUZZ_PHRASES,
    mission: MISSION_SPEAK,
  });

  const script = `
(function(){
  var L = ${data};
  var box=document.getElementById('ol'), out=document.getElementById('olout'), count=document.getElementById('olcount');
  var CAP=50;
  function esc(s){ return s.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
  function check(){
    var t=box.value.trim(), n=t.length;
    count.textContent = n + ' / ' + CAP;
    count.className = n>CAP ? 'count over' : (n>CAP-8 ? 'count near' : 'count');
    if(!n){ out.innerHTML='<p class="muted">Type your one-liner above.</p>'; return; }

    var f=[];
    if(n>CAP) f.push(['red','Over the limit by '+(n-CAP)+' characters','The form will not accept it. Cut the words that describe how it feels and keep the ones that say what it is.']);

    var low=t.toLowerCase(), found=[];
    L.stems.forEach(function(s){ var m=low.match(new RegExp('\\\\b'+s.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+'\\\\w*')); if(m) found.push(m[0]); });
    L.phrases.forEach(function(p){ if(low.indexOf(p)!==-1) found.push(p); });
    if(found.length) f.push(['red','Buzzwords: '+found.slice(0,3).map(function(w){return '"'+w+'"';}).join(', '),'A partner skims past adjectives looking for what the thing actually is. Replace each one with the literal fact underneath it.']);

    var miss=L.mission.filter(function(m){ return low.indexOf(m)!==-1; });
    if(miss.length) f.push(['red','Mission statement, not a product','This question asks what the company does, not why it exists. Describe the thing a user touches.']);

    // "Broker software for brokers" repeats across the "for", not next to it,
    // so compare the two sides by stem rather than looking for adjacency.
    var forAt = low.search(/\\bfor\\b/);
    if(forAt !== -1){
      var STOP={'a':1,'an':1,'the':1,'and':1,'of':1,'to':1,'your':1,'our':1,'for':1};
      var stem=function(w){ return w.replace(/[^a-z]/g,'').replace(/(ing|ers|er|s)$/,''); };
      var words=function(part){ return part.split(/\\s+/).map(function(w){ return {raw:w.replace(/[^a-z]/g,''), s:stem(w)}; })
        .filter(function(o){ return o.s.length>2 && !STOP[o.s]; }); };
      var left=words(low.slice(0,forAt)), right=words(low.slice(forAt+3));
      var hit=null;
      left.forEach(function(l){ if(!hit) right.forEach(function(r){ if(!hit && l.s===r.s) hit=[l.raw,r.raw]; }); });
      if(hit) f.push(['amber','It defines the thing by itself','"'+hit[0]+'" and "'+hit[1]+'" sit on either side of "for", which tells a reader nothing they did not already get from your company name.']);
    }

    var words=t.split(/\\s+/).filter(Boolean);
    if(words.length && words.length<3) f.push(['amber','Only '+words.length+' word'+(words.length===1?'':'s'),'There is not enough here to tell what the product is.']);

    if(/\\b(platform|solution|ecosystem|suite|framework)\\b/i.test(t) && !/\\bfor\\b/i.test(t)) f.push(['amber','A category, not a product','Platform and solution are what people write instead of saying what the thing does.']);

    if(!f.length){
      out.innerHTML='<div class="fnd green"><b>Nothing wrong with it.</b> It fits the cap and it says something concrete. '+
        'The full check reads this against your other 25 answers, which is where the harder problems live.</div>';
      return;
    }
    out.innerHTML=f.map(function(x){
      return '<div class="fnd '+x[0]+'"><b>'+esc(x[1])+'.</b> '+esc(x[2])+'</div>';
    }).join('');
  }
  box.addEventListener('input', check);
  [].forEach.call(document.querySelectorAll('.try'),function(b){
    b.onclick=function(){ box.value=b.getAttribute('data-t'); check(); box.focus(); };
  });
  check();
})();`;

  const q = QUESTIONS.find((x) => x.id === "one_liner");

  const body = `
<h1>YC one-liner tester</h1>
<p class="lead">${esc(q ? q.label : "Describe what your company does in 50 characters or less.")} This checks the cap and the words that make a partner stop reading. It runs here in the page, and nothing you type is sent anywhere.</p>

<div class="card">
  <label class="lbl" for="ol">Your one-liner</label>
  <textarea id="ol" rows="2" placeholder="Stripe for freight invoices" spellcheck="false"></textarea>
  <div id="olcount" class="count">0 / 50</div>
  <div id="olout" class="out"><p class="muted">Type your one-liner above.</p></div>
  <p class="muted" style="margin-top:14px">Try one:
    <button type="button" class="try" data-t="A revolutionary platform to disrupt logistics">a bad one</button>
    <button type="button" class="try" data-t="Our mission is to empower every small carrier">a mission statement</button>
    <button type="button" class="try" data-t="Stripe for freight invoices">a good one</button>
  </p>
</div>

<h2>What the 50 characters are for</h2>
<p>This is the first thing read and often the only thing remembered. Fifty characters is roughly eight words, which is not enough room for what the product feels like, so it forces the only useful answer: what it literally is.</p>
<p>The shape that works most often is <b>a known thing, for a specific group</b>. "Stripe for freight invoices" works because the reader already knows what Stripe does, so the sentence spends its budget on the part they do not know. What fails is the reverse: a sentence that spends all fifty characters on adjectives and leaves the reader still asking what the thing does.</p>

<h2>Three ways this answer goes wrong</h2>
<ul>
<li><b>Adjectives instead of a product.</b> Revolutionary, seamless, AI-powered. Every one of them is a word somebody writes when they have not decided what the thing is yet, and a partner has read all of them a thousand times.</li>
<li><b>A category instead of a product.</b> "A platform for logistics" describes a shelf, not an object on it.</li>
<li><b>Defining the thing by itself.</b> "Broker software for brokers" tells the reader nothing they did not get from your company name.</li>
</ul>

<h2>This is one of 26 questions</h2>
<p>The one-liner is the cheapest one to fix and the least likely to be why an application fails. The expensive problems are the ones between answers: a user count here that disagrees with a user count there, revenue claimed where you said you have no users. Those are invisible when you read your answers one at a time.</p>

<a class="big-cta" href="${BASE}/#/app">Check all 26 answers, free</a>
<p class="note">No account, no API key, nothing uploaded. The whole checker runs in your browser, like this tester.</p>

<p><a href="${BASE}/questions/one-liner/">More on this question →</a> &nbsp; <a href="${BASE}/questions/">All 26 questions →</a> &nbsp; <a href="${BASE}/red-flags/">The red flags →</a></p>
<script>${script}</script>
`;

  return {
    path: "one-liner-tester/index.html",
    url: canonical,
    html: page({
      title: "YC one-liner tester: 50 characters, checked instantly",
      description:
        "Paste your YC one-liner and see whether it fits the 50-character cap and whether it hides behind adjectives. Free, instant, nothing uploaded.",
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / One-liner tester`,
    }),
  };
}
