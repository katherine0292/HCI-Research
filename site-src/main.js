(function(){
const R=document.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let L='en';
const t=k=>{const v=COPY[k];if(!v){console.warn('missing',k);return k}return v[L==='en'?1:0]};
const gs=k=>{try{return localStorage.getItem(k)}catch(e){return null}},ss=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const NAV=$$('section.ch').map((s,i)=>({id:s.id,k:s.dataset.nav,n:String(i+1).padStart(2,'0')}));

function applyText(){$$('[data-k]').forEach(el=>{el.innerHTML=t(el.dataset.k)})}
function setLang(l){L=l;R.lang=l==='en'?'en':'zh-CN';R.classList.toggle('zh',l!=='en');$('#l-zh').setAttribute('aria-pressed',l!=='en');$('#l-en').setAttribute('aria-pressed',l==='en');ss('rim-lang',l);applyText();renderAll()}
$('#l-zh').onclick=()=>setLang('zh');$('#l-en').onclick=()=>setLang('en');

/* rail, menu, chip */
function buildNav(){const ol=$('#rail');ol.querySelectorAll('li').forEach(l=>l.remove());const ml=$('#menu-list');ml.innerHTML='';
  NAV.forEach((n,i)=>{const li=document.createElement('li');li.innerHTML=`<button data-go="${n.id}">${t(n.k)}</button>`;ol.appendChild(li);
    const m=document.createElement('li');m.innerHTML=`<button data-go="${n.id}" style="transition-delay:${i*40}ms"><small>${n.n}</small>${t(n.k)}</button>`;ml.appendChild(m)});moveDot()}
let curIdx=-1;
function moveDot(){const lis=$$('#rail li');lis.forEach((l,i)=>l.classList.toggle('on',i===curIdx));const li=lis[Math.max(0,curIdx)];if(li)$('#rail-dot').style.transform=`translateY(${li.offsetTop+li.offsetHeight/2-4}px)`}
function setNow(i){if(i===curIdx)return;const now=$('#now');const dir=i>curIdx?1:-1;curIdx=i;moveDot();
  if(i<0){now.textContent='';return}const txt=NAV[i].n+' — '+t(NAV[i].k);
  if(RM){now.textContent=txt;return}now.style.transform=`translateY(${-100*dir}%)`;now.style.opacity=0;setTimeout(()=>{now.textContent=txt;now.style.transition='none';now.style.transform=`translateY(${100*dir}%)`;requestAnimationFrame(()=>{now.style.transition='';now.style.transform='none';now.style.opacity=1})},250)}
(function(){const nav=$('.rail'),ol=$('#rail');if(RM)return;
  function reset(){nav.classList.remove('hot');ol.querySelectorAll('li').forEach(li=>{li.style.transform='';li.style.opacity='';li.classList.remove('near')})}
  ol.addEventListener('mousemove',e=>{nav.classList.add('hot');ol.querySelectorAll('li').forEach(li=>{const r=li.getBoundingClientRect();const d=(e.clientY-(r.top+r.height/2))/r.height;const f=Math.max(0,1-Math.abs(d)/3);
    li.style.transform=`translateX(${(f*12).toFixed(1)}px) translateZ(${(f*70).toFixed(1)}px) rotateX(${Math.max(-50,Math.min(50,d*-11)).toFixed(1)}deg)`;li.style.opacity=(.35+f*.65).toFixed(2);li.classList.toggle('near',f>.66)})});
  ol.addEventListener('mouseleave',reset)})();
$('#menu-open').onclick=()=>{$('#menu').classList.add('open');setTimeout(()=>$('#menu-close').focus(),300)};
$('#menu-close').onclick=()=>$('#menu').classList.remove('open');
addEventListener('keydown',e=>{if(e.key==='Escape')$('#menu').classList.remove('open')});

/* chapter jump: plain smooth scroll */
function go(id){const el=document.getElementById(id);if(!el)return;$('#menu').classList.remove('open');
  const top=id==='hero'?0:el.getBoundingClientRect().top+scrollY-64;scrollTo({top,behavior:RM?'auto':'smooth'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){e.preventDefault();go(b.dataset.go)}});

/* scroll: progress, current chapter */
function onScroll(){const bn=$('.banner');if(bn){const away=bn.getBoundingClientRect().bottom>innerHeight*.35;$('.rail').classList.toggle('away',away);$('.chip-now').classList.toggle('away',away)}const h=document.documentElement.scrollHeight-innerHeight;$('#prog').style.setProperty('--p',(scrollY/h).toFixed(4));
  const mid=innerHeight*.45;let idx=-1;$$('section.ch').forEach((s,i)=>{const r=s.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid)idx=i});setNow(idx)}
addEventListener('scroll',()=>requestAnimationFrame(onScroll),{passive:true});addEventListener('resize',()=>{moveDot();onScroll()});

/* reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});
$$('.head,.rv,.body').forEach(el=>io.observe(el));
if(RM)$$('.head,.rv,.body').forEach(el=>el.classList.add('revealed'));
requestAnimationFrame(()=>$('.banner').classList.add('in'));

/* counters */
$$('[data-c]').forEach(b=>{if(RM)return;const o=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;o.disconnect();const n=+b.dataset.c,t0=performance.now();(function f(tm){const p=Math.min(1,(tm-t0)/1100);b.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)},{threshold:.5});o.observe(b)});

/* ---------- recorded incidents: replay in the question chapter ---------- */
const INC=[{k:'i1',ty:1,ev:'P-05–P-09 · E-05–E-08'},{k:'i2',ty:1,ev:'P-11–P-14 · E-09–E-10'},{k:'i3',ty:1,ev:'P-16–P-19 · E-12–E-14'},{k:'i4',ty:2,ev:'P-31–P-34'},{k:'i5',ty:2,ev:'P-46–P-49 · E-33–E-36 · E-42'}];
let rIdx=0,rTm=[];
function renderReplay(i,animate){rIdx=i;const d=INC[i];rTm.forEach(clearTimeout);rTm=[];
  $('#st-chips').innerHTML=INC.map((x,k)=>`<button type="button" role="tab" aria-selected="${k===i}" data-i="${k}">${t(x.k+'.n')}</button>`).join('');
  $$('#st-chips button').forEach(b=>b.onclick=()=>renderReplay(+b.dataset.i,true));
  $('#rp').innerHTML=`<div class="rp-top"><span class="ty t${d.ty}">${t('hs.ty'+d.ty)}</span><span class="rev"><i>${t('hs.ev')}</i> ${d.ev}</span></div>
   <div class="rp-line"><i id="rp-fill"></i></div>
   <div class="rp-row">
    <div class="rn" data-n="0"><span class="rl">${t('hs.c1')}</span><p>${t(d.k+'.a')}</p></div>
    <div class="rn" data-n="1"><span class="rl">${t('hs.c2')}</span><p>${t(d.k+'.b')}</p></div>
    <div class="rn" data-n="2"><span class="rl">${t('hs.c3')}</span><p>${t(d.k+'.c')}</p></div>
   </div>`;
  const nodes=$$('#rp .rn'),fill=$('#rp-fill');
  const show=n=>{nodes.forEach((x,k)=>x.classList.toggle('on',k<=n));fill.style.width=((n+1)/3*100)+'%'};
  if(!animate||RM){show(2);return}
  show(-1);[0,1,2].forEach(n=>rTm.push(setTimeout(()=>show(n),250+n*900)))}

/* ---------- interview themes ---------- */
const TCOL=['','#E0583F','#3C6EE0','#1FA37A','#D99A1E','#8A5AD6','#5B6B7B'];
const TH=[[1,65,15],[2,70,14],[3,61,14],[4,45,15],[5,72,15],[6,43,14]];
function renderThemes(){
  $('#themes').innerHTML=TH.map(([n,e,p])=>`<div class="th"><span class="tn" style="--c:${TCOL[n]}">T${n}</span><p>${t('iv.t'+n)}</p><div class="tb"><i style="--w:${(e/72*100).toFixed(1)}%;--c:${TCOL[n]}"></i><b>${e}</b></div><div class="tp" title="${p}/15">${Array.from({length:15},(_,k)=>`<i class="${k<p?'y':''}" style="--c:${TCOL[n]}"></i>`).join('')}</div></div>`).join('')}
let ivT=0;
function renderClusters(){
  $('#iv-flt').innerHTML=[0,1,2,3,4,5,6].map(n=>`<button type="button" aria-pressed="${n===ivT}" data-n="${n}">${n?`<i style="background:${TCOL[n]}"></i>T${n}`:t('iv.ex.all')}</button>`).join('');
  $$('#iv-flt button').forEach(b=>b.onclick=()=>{ivT=+b.dataset.n;renderClusters()});
  const rows=DATA.iv.filter(c=>!ivT||c.t===ivT).sort((a,b)=>a.t-b.t||b.e-a.e);
  $('#iv-cl').innerHTML=rows.map(c=>`<div class="cr${c.main?'':' sup'}"><span class="cn"><i style="background:${TCOL[c.t]}"></i>${t('iv.c'+c.id.slice(1))}</span><div class="cb"><i style="--w:${(c.e/25*100).toFixed(1)}%;--c:${TCOL[c.t]}"></i></div><b>${c.e}</b><em>${c.p}</em></div>`).join('')}

/* ---------- probe heatmap ---------- */
function renderHeat(){
  const cols=['fp.s1','fp.s2','fp.s3','fp.s4'];
  let h=`<div class="hr hh"><span>${t('fp.hm.th')}</span>${cols.map(c=>`<span><b class="lg">${t(c)}</b><b class="sh">${t(c+'s')}</b></span>`).join('')}<span>Σ</span></div>`;
  [1,2,3,4,5,0].forEach(th=>{h+=`<div class="hr ht"><span style="--c:${th?TCOL[th]:'#5B6B7B'}"><i></i>${t('pf.t'+th)}</span></div>`;
    DATA.pr.filter(c=>c.t===th).sort((a,b)=>b.e-a.e).forEach(c=>{h+=`<div class="hr"><span class="hn">${t('pc.c'+c.id.slice(1))}</span>${c.s.map(v=>`<span class="hc${v?'':' z'}" style="--a:${(v/9).toFixed(2)};--c:${th?TCOL[th]:'#5B6B7B'}">${v||''}</span>`).join('')}<span class="hs">${c.e}</span></div>`});});
  $('#hm').innerHTML=h}

/* ---------- insight toggle ---------- */
let inM=0;
function renderInsight(){
  const m=inM;$$('#in-seg button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.m===m));
  $('#in-la').textContent=t(m?'in.a2':'in.a1');$('#in-lb').textContent=t(m?'in.b2':'in.b1');
  const item=k=>`<div class="bagbox${k?' alt':''}"><i class="key">⚷</i></div>`;
  const doc=()=>`<div class="docbox"><b>✓</b><span></span><span></span><span class="s"></span><em>${L==='en'?'Ready':'就绪'}</em></div>`;
  $('#in-ta').innerHTML=m?doc():item(0);$('#in-tb').innerHTML=m?doc():item(1);
  $('#ins').classList.toggle('task',!!m);
  const cues=m?['in.cue4','in.cue5','in.cue6']:['in.cue1','in.cue2','in.cue3'];
  $('#cues').innerHTML=cues.map(k=>`<span class="${m?'off':'on'}">${t(k)}</span>`).join('');
  $('#in-cap').textContent=t(m?'in.cap2':'in.cap1')}
$$('#in-seg button').forEach(b=>b.onclick=()=>{inM=+b.dataset.m;renderInsight()});

/* ---------- analysis wall tabs ---------- */
$$('#aw-seg button').forEach(b=>b.onclick=()=>{const m=b.dataset.m;$$('#aw-seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));$$('.awp').forEach(p=>p.hidden=p.dataset.m!==m)});

/* ---------- lightbox ---------- */
(function(){
  const lb=document.createElement('div');lb.className='lb';lb.hidden=true;
  lb.innerHTML='<button class="lb-x" type="button">×</button><button class="lb-p" type="button">‹</button><button class="lb-n" type="button">›</button><div class="lb-box"><img class="lb-i" alt=""></div><p class="lb-c"></p>';
  document.body.appendChild(lb);
  const im=lb.querySelector('.lb-i'),cap=lb.querySelector('.lb-c'),box=lb.querySelector('.lb-box');let grp=[],gi=0;
  function show(){const s=grp[gi];im.classList.remove('z');box.scrollTo(0,0);im.src=s.src;const f=s.closest('figure'),c=f&&f.querySelector('figcaption');cap.textContent=(c?c.textContent:'')+(grp.length>1?'  ('+(gi+1)+'/'+grp.length+')':'');im.alt=c?c.textContent:'';
    lb.querySelector('.lb-p').style.visibility=lb.querySelector('.lb-n').style.visibility=grp.length>1?'visible':'hidden'}
  function open(el){grp=[...document.querySelectorAll('img[data-lb="'+el.dataset.lb+'"]')].filter(x=>!x.closest('[hidden]'));gi=Math.max(0,grp.indexOf(el));lb.hidden=false;document.documentElement.style.overflow='hidden';show()}
  function close(){lb.hidden=true;document.documentElement.style.overflow='';im.removeAttribute('src')}
  document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('img[data-lb]');if(el)open(el)});
  lb.querySelector('.lb-x').onclick=close;
  lb.querySelector('.lb-p').onclick=()=>{gi=(gi+grp.length-1)%grp.length;show()};
  lb.querySelector('.lb-n').onclick=()=>{gi=(gi+1)%grp.length;show()};
  im.onclick=()=>im.classList.toggle('z');
  box.onclick=e=>{if(e.target===box)close()};
  document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')lb.querySelector('.lb-p').click();if(e.key==='ArrowRight')lb.querySelector('.lb-n').click()});
})();

/* copy email */
$('#copy').onclick=async function(){try{await navigator.clipboard.writeText($('#mail').textContent);this.textContent=t('ft.copied')}catch(e){const r=document.createRange();r.selectNodeContents($('#mail'));const s=getSelection();s.removeAllRanges();s.addRange(r)}};

function renderAll(){buildNav();renderReplay(rIdx,false);renderThemes();renderClusters();renderHeat();renderInsight();if(curIdx>=0){const i=curIdx;curIdx=-2;setNow(i)}}
setLang(gs('rim-lang')==='zh'?'zh':'en');onScroll();
window.CU={COPY,lang:()=>L,rerender:()=>setLang(L)};
})();
