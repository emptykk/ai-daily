/* Sentence cards have their own media transport; course position stays untouched. */
(function(root){
'use strict';
let active=null;
function stop(){if(active){active.pause();active=null;}}
function normalized(text){return text.toLowerCase().replace(/[^a-z0-9]/g,'');}
function runs(card){
 const raw=card.notes.raw_words;let cursor=0;
 const spans=raw.map(w=>{const start=cursor;cursor+=normalized(w.text).length;return {id:w.id,start,end:cursor};});
 if(normalized(card.text_en)!==raw.map(w=>normalized(w.text)).join(''))throw Error('卡片英文与原始词编号不匹配：'+card.card_id);
 cursor=0;
 return card.text_en.split(/(\s+)/).filter(Boolean).map(text=>{const n=normalized(text).length,start=cursor;cursor+=n;const ids=spans.filter(w=>w.end>start&&w.start<cursor).map(w=>w.id);const highlights=(card.highlights||[]).filter(h=>h.word_ids.some(id=>ids.includes(id)));return {text,word_ids:ids,highlights};});
}
function mediaURL(uri,base){if(!uri)return null;return new URL(uri,base).href;}
function mount(host,cards,options){
 stop();host.replaceChildren();const doc=host.ownerDocument||document;
 if(!cards?.length){const p=doc.createElement('p');p.textContent='本段尚无句子卡片。';host.append(p);return;}
 function el(tag,text){const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
 for(const c of cards){
  const article=el('article');article.className='sentence-card';article.dataset.cardId=c.card_id;
  article.append(el('h3',c.card_id));
  const english=el('p');english.className='card-english';const meaning=el('p','点击高亮词或短语查看本句释义。');meaning.className='card-meaning';meaning.setAttribute('role','status');
  for(const r of runs(c)){
   if(!r.highlights.length){const span=el('span',r.text);english.append(span);continue;}
   const b=el('button',r.text);b.type='button';b.className='card-highlight';b.title=r.highlights.map(h=>h.term).join(' / ');b.onclick=()=>{meaning.textContent=r.highlights.map(h=>h.term+'：'+h.meaning_zh).join('；');};english.append(b);
  }
  article.append(english);article.append(el('p',c.text_zh));article.append(meaning);
  const controls=el('div');controls.className='card-buttons';const player=el('audio');player.controls=true;player.preload='none';player.hidden=true;player.setAttribute('aria-label',c.card_id+' 卡片音频');
  const mode=el('p','选择原声、标准朗读或讲解。');mode.className='card-mode';
  const loopLabel=el('label');const loop=el('input');loop.type='checkbox';loopLabel.append(loop);loopLabel.append(el('span','原声循环'));
  const speedLabel=el('label','原声速度 ');const speed=el('select');for(const value of [.6,.75,1,1.25]){const opt=el('option',value+'×');opt.value=String(value);if(value===1)opt.selected=true;speed.append(opt);}speed.value='1';speedLabel.append(speed);
  for(const [kind,label] of [['original','原声'],['reading','标准朗读'],['explain','讲解']]){
   const b=el('button',label);b.type='button';b.dataset.kind=kind;const a=c.audio[kind];b.disabled=!a?.uri;
   b.onclick=()=>{
    if(options.canPlay&&!options.canPlay()){options.notify?.('请先结束提问，再播放句子卡片。');return;}
    stop();options.onStart?.();active=player;player.dataset.kind=kind;player.src=mediaURL(a.uri,options.mediaBase);player.loop=kind==='original'&&loop.checked;player.playbackRate=kind==='original'?Number(speed.value):1;player.hidden=false;
    mode.textContent=label+' · '+a.duration_sec.toFixed(2)+'秒'+(a.status!=='ready'?' · 待复核预览':'');player.play().catch(e=>options.notify?.('点击卡片音频播放控件继续：'+e.message));
   };controls.append(b);
  }
  loop.onchange=()=>{if(player.dataset.kind==='original')player.loop=loop.checked;};speed.onchange=()=>{if(player.dataset.kind==='original')player.playbackRate=Number(speed.value);};
  player.addEventListener('play',()=>{if(active&&active!==player)active.pause();active=player;options.onStart?.();});
  article.append(controls);article.append(loopLabel);article.append(speedLabel);article.append(mode);article.append(player);
  const explanation=el('details');explanation.append(el('summary','讲解文字'));explanation.append(el('p',c.explain_text));article.append(explanation);
  host.append(article);
 }
}
const api={runs,mediaURL,mount,stop};if(typeof module!=='undefined')module.exports=api;else root.TutorCards=api;
})(typeof window==='undefined'?globalThis:window);
