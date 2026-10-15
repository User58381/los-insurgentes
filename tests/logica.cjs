'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../engine.js'),C=require('../characters.js'),P=require('../playground-engine.js'),Save=require('../adventure-save.js'),S=require('../school-settings.js'),U=require('../update-runtime.js');
const memory=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};};
function tick(s,seconds,input={},random=()=>.5){for(let t=0;t<seconds;t+=.01)P.tick(s,.01,input,random);}
function roundKeeper(s,win){
 if(s.stage==='result')P.action(s);tick(s,2,{},()=>.5);
 s.keeperX=win?360:170;tick(s,1,{},()=>.5);
}
test('45 personajes: se pueden elegir todos sin cambiar posición ni estrellas',()=>{
 const s=G.createState();s.points=80;s.completed.fountain=true;
 for(const actor of C.list(G)){
  const previous={x:s.player.x,y:s.player.y};assert(C.select(G,s,actor.id));assert.equal(s.player.id,actor.id);assert.deepEqual({x:s.player.x,y:s.player.y},previous);assert.equal(s.points,80);assert(s.completed.fountain);
  for(const day of [1,2,3,4,5])for(const facing of ['up','down','left','right']){const frame=C.frame(G,s.player,day,facing);assert.equal(frame.rect.length,6);assert(frame.rect.every(Number.isFinite));}
 }
 assert.equal(C.select(G,s,'inventado'),false);
});
test('los cinco personajes tienen posiciones accesibles y acciones correctas',()=>{
 const s=G.createState();G.start(s);G.finishWelcome(s);
 for(const actor of G.challengeActors(s)){
  assert(G.canStand('outside',actor.x,actor.y),actor.id);s.phase='play';s.player.x=actor.x;s.player.y=actor.y;
  assert.equal(G.nearby(s).id,'challenge-'+actor.id);G.interact(s);
  assert(s.events.some(e=>e.type===(actor.id==='criss'?'criss-talk':'playground-open')&&e.id===actor.id));s.events=[];
 }
});
for(const id of ['daniel','alexis']){
 test(id+': el compañero tira; tres atajadas ganan',()=>{
  const s=P.createState(id);assert.equal(s.role,'keeper');P.action(s);
  for(let i=0;i<3;i++){if(s.stage==='result')P.action(s);tick(s,1.9,{},()=>.5);s.keeperX=360;tick(s,1,{},()=>.5);}
  assert.equal(s.phase,'complete');assert.equal(s.score,3);assert.equal(s.rival,0);assert(s.won);assert.equal(s.events.filter(e=>e.type==='complete').length,1);
  tick(s,10);P.action(s);assert.equal(s.events.filter(e=>e.type==='complete').length,1);
 });
 test(id+': tres goles del rival terminan el duelo',()=>{const s=P.createState(id);P.action(s);for(let i=0;i<3;i++){if(s.stage==='result')P.action(s);s.keeperX=170;tick(s,3,{},()=>.5);}assert.equal(s.phase,'complete');assert.equal(s.rival,3);assert.equal(s.won,false);});
}
test('Joaquín es portero: apuntar a los lados permite marcar tres goles',()=>{
 const s=P.createState('joaquin');P.action(s);assert.equal(s.role,'striker');
 for(let i=0;i<3;i++){if(s.stage==='result')P.action(s);s.keeperX=175;s.aim=1;P.action(s);tick(s,1.2);}
 assert.equal(s.score,3);assert.equal(s.phase,'complete');assert(s.won);
});
test('Joaquín ataja tiros dirigidos a su posición',()=>{const s=P.createState('joaquin');P.action(s);for(let i=0;i<3;i++){if(s.stage==='result')P.action(s);s.aim=0;s.keeperX=360;P.action(s);tick(s,1.2);}assert.equal(s.rival,3);assert(!s.won);});
test('Dalila: diez saltos a tiempo completan el reto',()=>{
 const s=P.createState('dalila');P.action(s);
 for(let i=0;i<10;i++){
  while(s.period-s.cycle>.31)P.tick(s,.01);P.action(s);
  const turn=s.turns;while(s.turns===turn&&s.phase==='playing')P.tick(s,.01);
 }
 assert.equal(s.hits,10);assert(s.won);assert.equal(s.phase,'complete');
});
test('Dalila: tres tropiezos terminan sin dar victoria; saltar no se repite en el aire',()=>{
 const s=P.createState('dalila');P.action(s);assert(P.action(s));assert.equal(P.action(s),false);tick(s,7);assert.equal(s.misses,3);assert(!s.won);
});
test('Criss: separación equivocada conserva el residuo y nueve depósitos completan',()=>{
 const s=P.createState('criss');P.action(s);
 for(const item of s.litter){s.player.x=item.x;s.player.y=item.y;assert(P.action(s));const bin=P.BINS.find(b=>b.type===item.type),wrong=P.BINS.find(b=>b.type!==item.type);s.player.x=wrong.x;s.player.y=wrong.y+35;assert.equal(P.action(s),false);assert(s.carrying);s.player.x=bin.x;s.player.y=bin.y+35;assert(P.action(s));assert.equal(s.carrying,null);}
 assert.equal(s.collected,9);assert(s.won);assert.equal(s.phase,'complete');
});
for(const id of Object.keys(P.TASKS))test(id+': pausa y límites de movimiento',()=>{
 const s=P.createState(id);P.action(s);tick(s,.2,{x:1,y:1});P.pause(s);const before=JSON.stringify(s);tick(s,10,{x:1,y:1});assert.equal(JSON.stringify(s),before);P.resume(s);assert.equal(s.phase,'playing');
 if(s.type==='cleanup'){tick(s,10,{x:1,y:1});assert(s.player.x<=655&&s.player.y<=390);}
});
test('guardar y recuperar personaje, posición, retos, puntos, día y pregunta',()=>{
 const mem=memory(),store=Save.createStore(G,C,mem),s=G.createState();G.start(s);G.finishWelcome(s);C.select(G,s,'guadalupe');s.player.x=900;s.player.y=810;s.points=160;s.goals=2;s.completed.field=true;s.challenges.dalila={won:true,best:10,wins:1};G.setSchoolDay(s,2);s.quiz={station:'fountain',index:1,correct:true,awarded:false,feedback:'x'};
 assert(store.save(s));const next=G.createState();Save.restore(G,C,next,store.load());assert.equal(next.player.id,'guadalupe');assert.equal(next.player.x,900);assert.equal(next.points,160);assert(next.completed.field);assert.equal(next.schoolDay,2);assert.equal(next.challenges.dalila.best,10);assert(next.quiz.correct);assert(next.started);
});
test('copia anterior recupera una escritura corrupta y nunca se borran otros datos',()=>{
 const mem=memory(),store=Save.createStore(G,C,mem),s=G.createState();mem.setItem('otro-juego','secreto');s.started=true;store.save(s);s.points=80;store.save(s);mem.setItem(Save.KEY,'{incompleto');
 const loaded=Save.createStore(G,C,mem).load();assert(loaded);assert.equal(loaded.points,0);assert.equal(mem.getItem('otro-juego'),'secreto');
 const bad=memory();bad.setItem(Save.KEY,'{corrupto');const guard=Save.createStore(G,C,bad);assert.equal(guard.load(),null);assert.equal(guard.save(s),false);assert.equal(bad.getItem(Save.KEY),'{corrupto');
});
test('cuota agotada impide anunciar un guardado exitoso',()=>{
 const store=Save.createStore(G,C,{getItem:()=>null,setItem:()=>{throw new Error('quota');}});store.load();assert.equal(store.save(G.createState()),false);assert.match(store.status(),/No se pudo guardar/);
});
test('importar copia completa conserva maestros y récords; rechaza números inválidos',()=>{
 const mem=memory(),school=S.createStore(G,mem),store=Save.createStore(G,C,mem),s=G.createState();school.setLabel(S.labelId(0),'Mi salón');mem.setItem('insurgentes-pacman-record-v1',JSON.stringify({highScore:1234,maxAddend:49}));const bundle=store.bundle(s,school),parsed=store.parseBundle(bundle,school.getConfig(),S);assert.equal(parsed.school.labels[0].name,'Mi salón');assert.equal(JSON.parse(parsed.records['insurgentes-pacman-record-v1']).highScore,1234);
 const wrong=JSON.parse(bundle);wrong.progress.points=-1;assert.throws(()=>store.parseBundle(JSON.stringify(wrong),school.getConfig(),S));assert.throws(()=>store.parseBundle('{',school.getConfig(),S));
});
test('versionar solo archivos cambiados y respetar subrutas de GitHub Pages',()=>{
 const href='https://user.github.io/los-insurgentes/?x=1',old={version:'v8-a',assets:{'game.js':'abc','assets/mapa.png':'unchanged'}},next={version:'v8-b',assets:{'game.js':'def','assets/mapa.png':'unchanged'}};
 assert.equal(U.assetUrl('assets/mapa.png',href,old),U.assetUrl('assets/mapa.png',href,next));assert.notEqual(U.assetUrl('game.js',href,old),U.assetUrl('game.js',href,next));assert.equal(new URL(U.assetUrl('game.js',href,next)).pathname,'/los-insurgentes/game.js');assert.equal(U.assetUrl('game.js','file:///school/index.html',next),'game.js');assert.equal(U.htmlVersion('<html lang="es" data-version="v8-b">'),'v8-b');assert(U.validManifest(next));assert.equal(U.validManifest({version:'bad<>',assets:{}}),false);assert.equal(new URL(U.freshUrl(href,'v8-b')).searchParams.get('x'),'1');
});
test('actualización manual no borra cachés ni guardados ajenos',async()=>{
 let calls=0;const fresh=await S.freshGameUrl({href:'https://u.github.io/juego/',now:123,caches:{keys(){calls++;}},serviceWorker:{getRegistrations(){calls++;}}});assert.equal(calls,0);assert.equal(new URL(fresh).searchParams.get('_refresh'),'123');
});
test('retos originales: tres estrellas, victoria y trompo continúan disponibles',()=>{
 const game=require('../engine.js'),s=game.createState();game.start(s);game.finishWelcome(s);
 for(const station of ['fountain','classroom','field']){s.scene=station==='classroom'?'classroom':'outside';const spot=game.STATIONS[station];Object.assign(s.player,{x:spot.x,y:spot.y});game.interact(s);assert(s.quiz);for(const q of game.QUESTIONS[station]){assert(game.answer(s,q.answer));game.nextQuestion(s);}}
 assert.equal(Object.values(s.completed).filter(Boolean).length,3);assert.equal(s.phase,'victory');
 s.phase='play';s.scene='outside';const oliver=s.classmates.find(a=>a.id==='oliver');Object.assign(s.player,{x:oliver.x,y:oliver.y});assert.equal(game.interact(s),'oliver');assert.equal(s.phase,'trompo');s.trompo.power=.78;game.trompoAction(s);for(let i=0;i<1000;i++)game.tick(s,.01);assert.equal(s.trompo.stage,'result');assert(game.leaveTrompo(s));assert.equal(s.phase,'play');
});
test('Criss: cuenta 90 segundos, avisa más rápido al final y termina una sola vez',()=>{
 const s=P.createState('criss');assert.equal(s.remaining,90);tick(s,2);assert.equal(s.remaining,90);P.action(s);
 for(let i=0;i<7900;i++)P.tick(s,.01);assert(Math.abs(s.remaining-11)<.000001);
 const regular=s.events.filter(e=>e.type==='timer-tick');assert.equal(regular.length,79);assert(regular.every(e=>!e.urgent));s.events=[];
 for(let i=0;i<200;i++)P.tick(s,.01);
 const urgent=s.events.filter(e=>e.type==='timer-tick'&&e.urgent);assert.equal(urgent.length,3);assert.equal(P.snapshot(s).remaining,9);
 tick(s,10);assert.equal(s.phase,'complete');assert.equal(s.remaining,0);assert.equal(s.reason,'timeout');assert.equal(s.won,false);assert.equal(s.events.filter(e=>e.type==='complete').length,1);const before=JSON.stringify(s);tick(s,10);assert.equal(JSON.stringify(s),before);assert.equal(P.action(s),false);
});
test('Criss: el contador se congela en pausa y los otros retos no tienen reloj',()=>{
 const s=P.createState('criss');P.action(s);tick(s,3);P.pause(s);const before=s.remaining,events=s.events.length;tick(s,60);assert.equal(s.remaining,before);assert.equal(s.events.length,events);P.resume(s);tick(s,1);assert(s.remaining<before);
 for(const id of ['daniel','alexis','joaquin','dalila']){const other=P.createState(id);P.action(other);tick(other,1);assert.equal(other.remaining,null);assert.equal(other.events.filter(e=>e.type==='timer-tick').length,0);}
});
test('Criss: una victoria antes de cero detiene el reloj y conserva los puntos',()=>{
 const s=P.createState('criss');P.action(s);tick(s,30);
 for(const item of s.litter){Object.assign(s.player,{x:item.x,y:item.y});P.action(s);const bin=P.BINS.find(b=>b.type===item.type);Object.assign(s.player,{x:bin.x,y:bin.y+35});P.action(s);}
 assert(s.won);const remaining=s.remaining;tick(s,90);assert.equal(s.remaining,remaining);assert.equal(s.collected,9);assert.notEqual(s.reason,'timeout');
});
test('Criss: el desbloqueo se guarda y las partidas de v8 se migran sin perder avances',()=>{
 const mem=memory(),store=Save.createStore(G,C,mem),s=G.createState();s.started=true;s.points=160;s.unlocks.cleanup=true;assert(store.save(s));const next=G.createState();Save.restore(G,C,next,store.load());assert(next.unlocks.cleanup);assert.equal(next.points,160);
 const legacy=Save.capture(s);delete legacy.unlocks;legacy.challenges={};assert.equal(Save.validate(G,C,legacy).unlocks.cleanup,false);legacy.challenges.criss={won:true,best:9,wins:1};assert.equal(Save.validate(G,C,legacy).unlocks.cleanup,true);
});
test('limpieza: cada depósito correcto emite la trayectoria hasta la boca del bote',()=>{
 const s=P.createState('criss');P.action(s);const item=s.litter[0],bin=P.BINS.find(b=>b.type===item.type);Object.assign(s.player,{x:item.x,y:item.y});P.action(s);Object.assign(s.player,{x:bin.x,y:bin.y+35});P.action(s);
 const deposit=s.events.find(e=>e.type==='success').deposit;assert.equal(deposit.type,item.type);assert.equal(deposit.toX,bin.x);assert.equal(deposit.toY,bin.y-52);assert(Object.values(deposit).slice(1).every(Number.isFinite));
});
test('limpieza: los seis recortes caben en el PNG de sprites entregado',()=>{
 const fs=require('fs'),path=require('path'),png=fs.readFileSync(path.join(__dirname,'../assets/limpieza-sprites.png')),width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(png.subarray(1,4).toString(),'PNG');
 for(const group of Object.values(P.CLEANUP_FRAMES))for(const [x,y,w,h] of Object.values(group)){assert(x>=0&&y>=0&&w>0&&h>0);assert(x+w<=width&&y+h<=height);}
});
