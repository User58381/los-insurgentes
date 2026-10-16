'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../engine.js'),C=require('../characters.js'),M=require('../missions-engine.js'),P=require('../playground-engine.js'),Save=require('../adventure-save.js'),Settings=require('../school-settings.js');
function drawing(){const s=M.createState('dibujo',G);M.action(s);return s;}
function advance(s,seconds,input={}){for(let t=0;t<seconds-.000001;t+=.05)M.tick(s,Math.min(.05,seconds-t),input);}
function completeQuiz(s){M.action(s);while(s.phase==='playing'){assert(M.answer(s,s.cards[s.index].answer));M.action(s);}return s;}
test('dibujo: empieza en pausa de invitación, con 12 zonas, seis claves y 90 segundos',()=>{
 const s=M.createState('dibujo',G);advance(s,10);assert.equal(s.phase,'intro');assert.equal(s.remaining,90);assert.equal(s.regions.length,12);assert.equal(M.COLORS.length,6);assert.equal(s.score,0);
 M.action(s);advance(s,1);assert(Math.abs(s.remaining-89)<.000001);
});
test('dibujo: cada número corresponde a una región visible, incluidas las figuras superpuestas',()=>{
 const s=drawing();for(const region of s.regions){assert.equal(M.hitRegion(s,...region.label).id,region.id,region.id);assert(M.COLORS[region.key-1]);}
 assert.equal(M.hitRegion(s,280,215).id,'ventana-izquierda');assert.equal(M.hitRegion(s,360,257).id,'puerta');assert.equal(M.hitRegion(s,5,5),null);
});
test('dibujo: la cubeta elige los seis colores desde la paleta sin pintar una zona',()=>{
 const s=drawing();for(const chip of M.PALETTE){M.setCursor(s,chip.x+10,chip.y+10);assert(M.action(s));assert.equal(s.selectedColor,chip.key-1);assert.equal(s.score,0);}
 assert.equal(M.color(s,9),false);M.cycleColor(s,1);assert.equal(s.selectedColor,0);M.cycleColor(s,-1);assert.equal(s.selectedColor,5);
});
test('dibujo: la cubeta rellena toda la figura, admite corregir y no duplica aciertos',()=>{
 const s=drawing(),wall=s.regions.find(r=>r.id==='escuela');M.setCursor(s,...wall.label);assert.equal(M.action(s),false);assert.equal(wall.paint,0);assert.equal(s.score,0);assert.match(s.message,/número 2.*amarillo/);
 M.color(s,1);assert(M.action(s));assert.equal(wall.paint,1);assert.equal(s.score,1);const events=s.events.length;assert.equal(M.action(s),false);assert.equal(s.events.length,events);
 M.color(s,0);M.action(s);assert.equal(s.score,0);M.color(s,1);M.action(s);assert.equal(s.score,1);
});
test('dibujo: pintar las 12 zonas antes de cero gana una sola vez y detiene el reloj',()=>{
 const s=drawing();advance(s,20);for(const region of s.regions){M.color(s,region.key-1);M.setCursor(s,...region.label);M.action(s);}
 assert(s.won);assert.equal(s.score,12);assert.equal(s.phase,'complete');assert.equal(s.events.filter(e=>e.type==='complete').length,1);const before=JSON.stringify(s);advance(s,90);M.action(s);assert.equal(JSON.stringify(s),before);
});
test('dibujo: al agotarse 90 segundos termina sin recompensa y no vuelve a terminar',()=>{
 const s=drawing();advance(s,90);assert.equal(s.remaining,0);assert.equal(s.phase,'complete');assert.equal(s.reason,'timeout');assert.equal(s.won,false);assert.equal(s.events.filter(e=>e.type==='complete').length,1);advance(s,10);assert.equal(s.events.filter(e=>e.type==='complete').length,1);
});
test('dibujo: el reloj avisa más rápido al final y la pausa congela reloj y cubeta',()=>{
 const s=drawing();advance(s,79);const normal=s.events.filter(e=>e.type==='timer-tick').length;s.events=[];advance(s,2);assert(normal>=78);assert(s.events.some(e=>e.type==='timer-tick'&&e.urgent));
 M.pause(s);const before=JSON.stringify(s);advance(s,60,{x:1,y:1});assert.equal(JSON.stringify(s),before);M.resume(s);advance(s,.05,{x:1});assert(s.remaining<9);assert(s.cursor.x>360);
});
test('dibujo: movimiento analógico normalizado, límites y entrada de tiempo inválida',()=>{
 const a=drawing(),b=drawing();M.tick(a,.05,{x:1});M.tick(b,.05,{x:1,y:1});assert(Math.abs(Math.hypot(b.cursor.x-360,b.cursor.y-185)-(a.cursor.x-360))<.00001);
 for(let i=0;i<200;i++)M.tick(a,.05,{x:1,y:-1});assert(a.cursor.x<=710&&a.cursor.y>=10);const old=a.remaining;M.tick(a,-1,{x:1});assert.equal(a.remaining,old);
});
test('uniforme: imágenes de los cinco días y alternativa del martes respetan la guía existente',()=>{
 const cards=M.uniformCards(G);assert.equal(new Set(cards.map(c=>c.day)).size,5);assert(cards.some(c=>c.answer===0));assert(cards.some(c=>c.answer===1));
 assert.equal(cards.find(c=>c.day===2&&c.shownDay===2).answer,0);assert.equal(cards.find(c=>c.day===2&&c.shownDay===4).answer,0);assert.equal(cards.find(c=>c.day===1&&c.shownDay===3).answer,1);assert.equal(cards.find(c=>c.day===5&&c.shownDay===2).answer,1);
 for(const card of cards)assert.deepEqual(card.options,['Verdadero','Falso']);
});
test('inglés: las palabras correctas corresponden a los colores y útiles que se muestran',()=>{
 const answers=M.ENGLISH_CARDS.map(c=>c.options[c.answer]);assert.deepEqual(answers,['red','blue','yellow','pencil','book','backpack']);assert.deepEqual(M.ENGLISH_CARDS.slice(3).map(c=>c.picture),['pencil','book','backpack']);
});
test('puntualidad: entrada 8:00 a. m., salida 12:30 p. m. y preparación con tiempo',()=>{
 const cards=M.PUNCTUALITY_CARDS;assert.equal(cards[0].options[cards[0].answer],'8:00 a. m.');assert.equal(cards[1].options[cards[1].answer],'12:30 p. m.');assert.equal(cards[1].hour,12);assert.equal(cards[1].minute,30);assert.equal(cards[1].period,'p. m.');assert.match(cards[3].options[cards[3].answer],/mochila desde la noche/);assert.match(cards[4].options[cards[4].answer],/calma/);
});
for(const id of ['ingles','uniforme','puntualidad'])test(id+': una respuesta equivocada se corrige; acertar no se cuenta dos veces ni salta preguntas',()=>{
 const s=M.createState(id,G);M.action(s);const card=s.cards[0];assert.equal(M.action(s),false);assert.equal(M.answer(s,(card.answer+1)%card.options.length),false);assert.equal(s.index,0);assert.equal(s.score,0);
 assert(M.answer(s,card.answer));assert.equal(M.answer(s,card.answer),false);assert.equal(s.score,1);M.action(s);assert.equal(s.index,1);
 while(s.phase==='playing'){M.answer(s,s.cards[s.index].answer);M.action(s);}assert(s.won);assert.equal(s.score,s.cards.length);assert.equal(s.events.filter(e=>e.type==='complete').length,1);
});
test('comisiones: los siete docentes ofrecen su misión en el lugar correcto',()=>{
 Settings.createStore(G,{getItem:()=>null,setItem(){}});
 for(const [hostId,mission] of Object.entries(G.TEACHER_MISSIONS)){
  const s=G.createState();s.phase='play';s.scene=mission.scene||'outside';const spot=G.TEACHERS.find(t=>t.id===hostId).positions[s.scene];Object.assign(s.player,{x:spot.x,y:spot.y});assert(G.canStand(s.scene,spot.x,spot.y),hostId);
  assert.equal(G.nearby(s).id,'teacher-'+hostId,hostId);G.interact(s);const event=s.events.find(e=>e.type==='teacher-mission');assert.equal(event.id,mission.id);assert.equal(event.hostId,hostId);
 }
});
for(const id of ['cesia','diana'])test(id+': limpiar el salón después de comer conserva los tres botes y nueve depósitos',()=>{
 const task=P.TASKS[id],s=P.createState(id);assert.equal(task.scene,'classroom');assert.match(task.copy,/recreo/);P.action(s);
 for(const item of s.litter){Object.assign(s.player,{x:item.x,y:item.y});assert(P.action(s));const bin=P.BINS.find(b=>b.type===item.type);Object.assign(s.player,{x:bin.x,y:bin.y+33});assert(P.action(s));}
 assert(s.won);assert.equal(s.collected,9);assert.match(s.message,/Salón limpio después de comer/);
});
test('guardado: los seis nuevos logros y los antiguos se exportan e importan sin perder puntos',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v))},store=Save.createStore(G,C,storage),school=Settings.createStore(G,storage),s=G.createState();s.started=true;s.points=560;
 for(const id of ['criss','cesia','diana','dibujo','ingles','uniforme','puntualidad'])s.challenges[id]={won:true,best:9,wins:1};assert(store.save(s));const restored=G.createState();Save.restore(G,C,restored,store.load());assert.equal(restored.points,560);
 for(const id of Object.keys(s.challenges))assert(restored.challenges[id].won,id);const bundle=store.parseBundle(store.bundle(s,school),school.getConfig(),Settings);assert.equal(bundle.progress.challenges.dibujo.won,true);assert.equal(bundle.progress.challenges.criss.won,true);
});
