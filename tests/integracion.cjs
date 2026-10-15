'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
class Emitter{
 constructor(){this.listeners={};}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 dispatchEvent(event){event.target??=this;event.preventDefault??=function(){this.defaultPrevented=true;};for(const fn of this.listeners[event.type]||[])fn(event);return !event.defaultPrevented;}
}
function dom(){
 let document;
 const context2d=()=>new Proxy({measureText:text=>({width:String(text).length*7}),drawImage(image,...args){assert(image,'drawImage sin recurso');assert(args.every(Number.isFinite),'drawImage con coordenadas no válidas');},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 class Element extends Emitter{
  constructor(tag='div',attrs={}){super();this.tagName=tag.toUpperCase();this.attrs={...attrs};this.children=[];this.parentElement=null;this.style={setProperty(name,value){this[name]=value;}};this.scrollTop=0;this.scrollLeft=0;this.width=720;this.height=420;this.clientWidth=1100;this.clientHeight=800;this._text='';this._value='';this.open='open'in attrs;this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.inert=false;this.selectedIndex=0;this.dataset=new Proxy({}, {get:(_,k)=>this.attrs['data-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())],set:(_,k,v)=>(this.attrs['data-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())]=String(v),true)});
   this.classList={add:(...n)=>{this.className=[...new Set([...this.className.split(/\s+/),...n])].filter(Boolean).join(' ');},remove:(...n)=>{this.className=this.className.split(/\s+/).filter(x=>!n.includes(x)).join(' ');},contains:n=>this.className.split(/\s+/).includes(n),toggle:(n,force)=>{const on=force??!this.classList.contains(n);this.classList[on?'add':'remove'](n);return on;}};
  }
  get id(){return this.attrs.id||'';} set id(v){this.attrs.id=v;}
  get className(){return this.attrs.class||'';}set className(v){this.attrs.class=v;}
  get options(){return this.querySelectorAll('option');}
  get value(){return this.tagName==='SELECT'?(this.options[this.selectedIndex]?.attrs.value??''):this._value;}
  set value(v){if(this.tagName==='SELECT'){const i=this.options.findIndex(o=>o.attrs.value===String(v));this.selectedIndex=i<0?0:i;}else this._value=String(v);}
  get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}set textContent(v){this._text=String(v);this.children=[];}
  set innerHTML(v){this.textContent=v;}
  get firstElementChild(){return this.children[0]||null;}
  append(...nodes){for(const n of nodes){if(typeof n==='string'){this._text+=n;continue;}n.parentElement=this;this.children.push(n);}}
  replaceChildren(...nodes){for(const c of this.children)c.parentElement=null;this.children=[];this._text='';this.append(...nodes);}
  after(node){const list=this.parentElement.children,index=list.indexOf(this);list.splice(index+1,0,node);node.parentElement=this.parentElement;}
  remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null;}}
  contains(node){for(let n=node;n;n=n.parentElement)if(n===this)return true;return false;}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}hasAttribute(k){return k in this.attrs;}
  matches(selector){return selector.split(',').some(selector=>{
   selector=selector.trim();if(!selector)return false;
   const nots=[...selector.matchAll(/:not\(([^)]+)\)/g)].map(m=>m[1]);if(nots.some(n=>this.matches(n)))return false;selector=selector.replace(/:not\([^)]+\)/g,'');
   if(selector.includes(':disabled')){if(!this.disabled)return false;selector=selector.replace(':disabled','');}
   const tag=/^[a-zA-Z][\w-]*/.exec(selector)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;
   for(const match of selector.matchAll(/#([\w-]+)/g))if(this.id!==match[1])return false;
   for(const match of selector.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(match[1]))return false;
   for(const match of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){const value=match[1]==='type'?this.type||this.attrs.type:this.attrs[match[1]];if(value===undefined||match[2]!==undefined&&value!==match[2])return false;}
   return true;
  });}
  querySelectorAll(selector){const found=[];const visit=n=>{for(const c of n.children){if(c.matches(selector))found.push(c);visit(c);}};visit(this);return found;}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  focus(){document.activeElement=this;this.dispatchEvent({type:'focus',target:this});for(let n=this;n;n=n.parentElement)n.dispatchEvent({type:'focusin',target:this});}
  click(){if(!this.disabled)this.dispatchEvent({type:'click',target:this});}
  showModal(){this.open=true;this.attrs.open='';}close(){if(!this.open)return;this.open=false;delete this.attrs.open;this.dispatchEvent({type:'close'});}
  getContext(){return this.ctx??=context2d();}scrollIntoView(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,right:this.width,bottom:this.height,width:this.width,height:this.height};}
 }
 const root=new Element('root'),stack=[root],voids=new Set(['meta','link','img','input','br','hr','source','wbr']);
 for(const token of fs.readFileSync(path.join(ROOT,'index.html'),'utf8').match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)||[]){
  if(token.startsWith('<!--')||token.startsWith('<!'))continue;
  if(token.startsWith('</')){const tag=token.slice(2).split(/[ >]/)[0];while(stack.length>1){const e=stack.pop();if(e.tagName.toLowerCase()===tag)break;}continue;}
  if(token.startsWith('<')){const tag=/^<([\w-]+)/.exec(token)?.[1];if(!tag)continue;const attrs={};for(const m of token.slice(tag.length+1,-1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[m[1]]=m[2]??m[3]??m[4]??'';const e=new Element(tag,attrs);if(attrs.type)e.type=attrs.type;stack.at(-1).append(e);if(!voids.has(tag)&&!token.endsWith('/>'))stack.push(e);}
  else stack.at(-1)._text+=token;
 }
 document=new Emitter();Object.assign(document,{documentElement:root.querySelector('html'),head:root.querySelector('head'),body:root.querySelector('body'),hidden:false,activeElement:null,createElement:tag=>new Element(tag),getElementById:id=>root.querySelector('#'+id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),hasFocus:()=>true});
 return {document,Element};
}
async function runtime(seed=[],options={}){
 const {document}=dom(),storage=new Map(seed),window=new Emitter(),tools=new Map();let pads=[];
 class Image {constructor(){this.complete=true;this.naturalWidth=1400;this.naturalHeight=1300;this.width=1400;this.height=1300;}set src(value){this._src=value;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
 class Audio extends Emitter {constructor(){super();this.paused=true;this.currentTime=0;this.duration=156;this.readyState=4;}play(){if(this.rejectNextPlay){const error=this.rejectNextPlay;this.rejectNextPlay=null;this.paused=true;return Promise.reject(error);}this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){}removeAttribute(){}}
 class Music{constructor(){this.ready=true;this.effects=[];window.__music=this;}setEnabled(v){this.enabled=v;}setPaused(v){this.paused=v;}setMusicPaused(v){this.musicOnlyPaused=v;}setScene(v){this.scene=v;}update(){}effect(kind){this.effects.push(kind);}stopVoices(){}destroy(){}activate(){return Promise.resolve(true);}}
 Object.assign(window,{document,console,Image,Audio,innerWidth:1100,innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:false}),performance:{now:()=>1000},navigator:{getGamepads:()=>pads},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},getComputedStyle:n=>({display:n.hidden?'none':'block',visibility:'visible',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr'}),CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},Event:class{constructor(type,options){this.type=type;Object.assign(this,options);}},AbortController,URL,Blob,SchoolAudio:{Player:Music,AUDIO_PATHS:{}},SchoolAssets:{url:p=>p},SchoolUpdater:{configure(value){this.hooks=value;},check:async()=>false,status:()=>'',isPending:()=>false}});
 window.window=window;document.modelContext={registerTool(item){tools.set(item.name,item);}};
 const ctx=vm.createContext(window);
 for(const file of ['engine.js','characters.js','adventure-save.js','school-settings.js','keyboard.js','character-ui.js','playground-engine.js','playground-ui.js','pacman-engine.js','pacman-ui.js','theater-song.js','theater-engine.js','theater-ui.js','game.js','school-editor.js']){
  if(file==='game.js'&&options.realAudio)vm.runInContext(fs.readFileSync(path.join(ROOT,'audio.js'),'utf8'),ctx,{filename:'audio.js'});
  let source=fs.readFileSync(path.join(ROOT,file),'utf8');if(file==='game.js')source=source.replace(/\}\)\(\);\s*$/,"window.__test={getState:()=>state,getMusic:()=>music,startGame,finishWelcome,openMap,closeMap,openPlayground,openCharacters,interact,controllerInput,frame,saveProgress,openPacman,openTheater,closeTrompo};})();");
  if(file==='playground-ui.js')source=source.replace(/\}\)\(\);\s*$/,'window.__playgroundTest={getState:()=>state};})();');
  vm.runInContext(source,ctx,{filename:file});
 }
 await new Promise(setImmediate);return {window,document,storage,tools,setPads(value){pads=value;}};
}
function talkToCriss(r,accept=true){
 const w=r.window,T=w.__test,criss=w.SchoolGame.TEACHERS.find(a=>a.id==='criss').positions.outside;
 Object.assign(T.getState().player,{x:criss.x,y:criss.y});T.interact();assert(r.document.getElementById('criss-dialog').open);assert.equal(w.SchoolUpdater.hooks.canReload(),false);
 if(accept)r.document.getElementById('criss-accept').click();
}
test('integración: selección de director, bienvenida, mapa, cinco retos y regreso',async()=>{
 const r=await runtime(),{window:w,document:d}=r,T=w.__test;
 assert.equal(d.getElementById('start-button').disabled,false);T.startGame();assert(w.CharacterSelect.isOpen());
 const director=d.querySelector('[data-character="guadalupe"]');director.focus();d.getElementById('character-confirm').click();assert.equal(T.getState().player.id,'guadalupe');assert.equal(T.getState().phase,'welcome');T.finishWelcome();assert.equal(T.getState().phase,'play');
 T.openMap();assert.equal(d.getElementById('challenge-list').children.length,5);T.closeMap();
 for(const id of Object.keys(w.SchoolPlayground.TASKS)){if(id==='criss')talkToCriss(r);else T.openPlayground(id);assert(w.PlaygroundGames.isOpen());assert.equal(w.PlaygroundGames.snapshot().id,id);w.PlaygroundGames.key({key:'Enter'});w.PlaygroundGames.tick(.02);T.frame(10000);assert.equal(w.SchoolUpdater.hooks.canReload(),false);w.PlaygroundGames.close();assert.equal(T.getState().phase,'play');}
 const saved=JSON.parse(r.storage.get(w.SchoolAdventureSave.KEY));assert.equal(saved.playerId,'guadalupe');assert.equal(saved.started,true);
 assert.equal(r.tools.get('read_school_adventure').execute({}).player.id,'guadalupe');
});
test('integración: teclas y cruceta de mando funcionan en el selector y los nuevos juegos',async()=>{
 const r=await runtime(),w=r.window,d=r.document,T=w.__test;T.startGame();
 d.querySelector('[data-character="daniel"]').focus();assert(w.CharacterSelect.key({key:'ArrowRight'}));assert.notEqual(d.activeElement.dataset.character,'daniel');
 d.getElementById('character-confirm').click();T.finishWelcome();talkToCriss(r);w.PlaygroundGames.key({key:'ArrowLeft'});w.PlaygroundGames.tick(.05);
 assert.equal(w.PlaygroundGames.snapshot().phase,'playing');w.PlaygroundGames.suspend();assert.equal(w.PlaygroundGames.snapshot().phase,'paused');w.PlaygroundGames.close();
 const button=n=>({pressed:!!n,value:n?1:0});let keys=Array(17).fill(0);
 function pad(){r.setPads([{index:0,id:'Xbox One',mapping:'standard',connected:true,axes:[0,0],buttons:keys.map(button)}]);T.controllerInput(10000);}
 keys[9]=1;pad();assert(d.getElementById('map-dialog').open);keys[9]=0;pad();
 d.getElementById('map-character').focus();keys[0]=1;pad();assert(w.CharacterSelect.isOpen());keys[0]=0;pad();keys[1]=1;pad();assert.equal(w.CharacterSelect.isOpen(),false);
});
test('integración: editor mantiene sus ajustes y los minijuegos anteriores abren',async()=>{
 const {window:w,document:d}=await runtime(),T=w.__test;
 T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();
 w.SchoolEditor.open();assert.equal(w.SchoolUpdater.hooks.canReload(),false);w.InsurgentesSchool.setLabel('edificio-01','6.º C');w.SchoolEditor.close();assert.equal(w.SchoolGame.MAP_LABELS[0].text,'6.º C');
 T.openPacman();assert(w.PacmanArcade.isOpen());w.PacmanArcade.close();assert.equal(T.getState().phase,'play');
 T.openTheater();assert(w.TheaterRehearsal.isOpen());w.TheaterRehearsal.close();assert.equal(T.getState().phase,'play');
 const oliver=T.getState().classmates.find(a=>a.id==='oliver');Object.assign(T.getState().player,{x:oliver.x,y:oliver.y});T.interact();assert(d.getElementById('trompo-dialog').open);T.closeTrompo();assert.equal(T.getState().phase,'play');
 T.frame(20000);
});
test('integración: continuar una pregunta guardada devuelve los controles al patio',async()=>{
 const first=await runtime(),T=first.window.__test,w=first.window;
 T.startGame();first.document.getElementById('character-confirm').click();T.finishWelcome();
 const s=T.getState();s.quiz={station:'fountain',index:1,correct:true,awarded:false,feedback:'Correcto'};T.saveProgress();
 const next=await runtime([...first.storage]),T2=next.window.__test,d=next.document;
 T2.startGame();assert(d.getElementById('quiz-dialog').open);d.getElementById('next-question').click();assert(T2.getState().completed.fountain);assert.equal(d.getElementById('touch-controls').inert,false);assert.equal(T2.getState().quiz,null);
});
test('integración: Criss exige hablar, permite posponer y desbloquea de forma persistente',async()=>{
 const r=await runtime(),w=r.window,d=r.document,T=w.__test;T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();
 T.openPlayground('criss');assert.equal(w.PlaygroundGames.isOpen(),false);assert.equal(d.getElementById('criss-dialog').open,false);assert.equal(T.getState().unlocks.cleanup,false);
 talkToCriss(r,false);assert.match(d.getElementById('criss-message').textContent,/90 segundos/);d.getElementById('criss-later').click();assert.equal(T.getState().unlocks.cleanup,false);assert.equal(T.getState().phase,'play');
 talkToCriss(r);assert(w.PlaygroundGames.isOpen());assert.equal(w.PlaygroundGames.snapshot().phase,'playing');assert.equal(d.getElementById('cleanup-time').textContent,'1:30');assert(T.getState().unlocks.cleanup);assert.equal(w.__music.scene,'cleanup');
 for(let i=0;i<20;i++)w.PlaygroundGames.tick(.05);assert.equal(d.getElementById('cleanup-time').textContent,'1:29');assert(w.__music.effects.includes('cleanup-tick'));
 w.PlaygroundGames.suspend();T.frame(30000);assert(w.__music.paused);const remaining=w.PlaygroundGames.snapshot().remaining;w.PlaygroundGames.tick(.05);assert.equal(w.PlaygroundGames.snapshot().remaining,remaining);
 w.PlaygroundGames.close();assert.equal(w.__music.scene,'outside');assert.equal(w.__music.musicOnlyPaused,false);
 const next=await runtime([...r.storage]);next.window.__test.startGame();assert(next.window.__test.getState().unlocks.cleanup);next.window.__test.openPlayground('criss');assert(next.window.PlaygroundGames.isOpen());
});
test('integración: el botón de sonido del reto respeta la preferencia global',async()=>{
 const r=await runtime(),w=r.window,d=r.document,T=w.__test;T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();talkToCriss(r);d.getElementById('playground-sound').click();assert.equal(r.storage.get('insurgentes-sound'),'no');assert.equal(d.getElementById('playground-sound').getAttribute('aria-pressed'),'false');d.getElementById('playground-sound').click();assert.equal(r.storage.get('insurgentes-sound'),'yes');
});
test('integración: teclado y mando pueden rechazar, aceptar y pausar la misión de Criss',async()=>{
 const r=await runtime(),w=r.window,d=r.document,T=w.__test;T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();talkToCriss(r,false);
 w.dispatchEvent({type:'keydown',key:'Escape',repeat:false});assert.equal(d.getElementById('criss-dialog').open,false);assert.equal(T.getState().unlocks.cleanup,false);
 talkToCriss(r,false);let buttons=Array(17).fill(0);const pad=()=>{r.setPads([{index:0,id:'Xbox One',mapping:'standard',connected:true,axes:[0,0],buttons:buttons.map(v=>({pressed:!!v,value:v}))}]);T.controllerInput(10000);};
 buttons[0]=1;pad();assert.equal(w.PlaygroundGames.snapshot().phase,'playing');assert(T.getState().unlocks.cleanup);buttons[0]=0;pad();buttons[9]=1;pad();T.frame(20000);assert.equal(w.PlaygroundGames.snapshot().phase,'paused');assert(w.__music.paused);buttons[9]=0;pad();buttons[1]=1;pad();assert.equal(T.getState().phase,'play');assert.equal(w.__music.scene,'outside');
});
test('integración con Player real: salir del teatro, Pac-Man y los retos restaura la música',async()=>{
 const r=await runtime([],{realAudio:true}),w=r.window,d=r.document,T=w.__test;T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();await new Promise(setImmediate);const music=T.getMusic();
 for(const kind of ['theater','pacman','football','rope']){
  if(kind==='theater'){T.openTheater();w.TheaterRehearsal.begin();assert(music.musicOnlyPaused);w.TheaterRehearsal.close();}
  else if(kind==='pacman'){T.openPacman();assert(music.musicOnlyPaused);w.PacmanArcade.close();}
  else{T.openPlayground(kind==='football'?'daniel':'dalila');w.PlaygroundGames.key({key:'Enter'});T.frame(2000);assert.equal(music.scene,kind);w.PlaygroundGames.close();}
  await new Promise(setImmediate);assert.equal(music.enabled,true);assert.equal(music.musicOnlyPaused,false);assert.equal(music.paused,false);assert.equal(music.music.paused,false);assert.equal(music.scene,'outside');assert.notEqual(r.storage.get('insurgentes-sound'),'no');
 }
 d.getElementById('sound-button').click();assert.equal(music.enabled,false);T.openTheater();w.TheaterRehearsal.close();await new Promise(setImmediate);assert.equal(music.enabled,false);assert.equal(r.storage.get('insurgentes-sound'),'no');
});
test('integración con Player real: fallo al reanudar el patio se corrige automáticamente',async()=>{
 const r=await runtime([],{realAudio:true}),w=r.window,d=r.document,T=w.__test;let now=1000;w.performance.now=()=>now;
 T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();await new Promise(setImmediate);T.openTheater();const music=T.getMusic();music.music.rejectNextPlay={name:'AbortError'};w.TheaterRehearsal.close();await new Promise(setImmediate);assert(music.blocked);assert(music.enabled);
 now=3000;T.frame(now);await new Promise(setImmediate);assert.equal(music.blocked,false);assert.equal(music.music.paused,false);assert.equal(music.enabled,true);
});
test('integración: los nueve depósitos usan START; recoger o equivocarse no lo dispara',async()=>{
 const r=await runtime(),w=r.window,d=r.document,T=w.__test;T.startGame();d.getElementById('character-confirm').click();T.finishWelcome();await new Promise(setImmediate);talkToCriss(r);await new Promise(setImmediate);
 const game=w.__playgroundTest.getState(),effects=w.__music.effects,initial=effects.filter(e=>e==='start').length;
 for(const item of game.litter){
  Object.assign(game.player,{x:item.x,y:item.y});const count=effects.filter(e=>e==='start').length;w.PlaygroundGames.key({key:'Enter'});assert.equal(effects.filter(e=>e==='start').length,count);
  const bin=w.SchoolPlayground.BINS.find(b=>b.type===item.type),wrong=w.SchoolPlayground.BINS.find(b=>b.type!==item.type);
  Object.assign(game.player,{x:wrong.x,y:wrong.y+35});w.PlaygroundGames.key({key:'Enter'});assert.equal(effects.filter(e=>e==='start').length,count);assert(game.carrying);
  Object.assign(game.player,{x:bin.x,y:bin.y+35});w.PlaygroundGames.key({key:'Enter'});assert.equal(effects.filter(e=>e==='start').length,count+1);assert.equal(game.carrying,null);for(let i=0;i<14;i++)w.PlaygroundGames.tick(.05);
 }
 assert.equal(effects.filter(e=>e==='start').length,initial+9);assert.equal(game.won,true);assert.equal(T.getState().points,80);assert.equal(T.getState().challenges.criss.won,true);
});
