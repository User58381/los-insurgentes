(function(){
  'use strict';
  const M=window.SchoolMissions,C=window.SchoolCharacters,K=window.SchoolKeyboard,$=id=>document.getElementById(id);
  const dialog=$('missions-dialog'),canvas=$('missions-canvas'),ctx=canvas.getContext('2d'),held=new Set(),touch=new Map();
  let opened=false,state=null,options={},padVector={x:0,y:0},selectedAnswer=0,questionKey='',phaseKey='',menuDirection='',menuAt=0,lastSound=null;
  function clear(){held.clear();touch.clear();padVector={x:0,y:0};document.querySelectorAll('[data-mission-direction]').forEach(button=>button.classList.remove('pressed'));}
  function text(id,value){const next=String(value);if($(id).textContent!==next)$(id).textContent=next;}
  function box(x,y,w,h,fill,stroke='#295448',radius=12){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.fill();ctx.stroke();}
  function caption(value,x,y,size=24,color='#214b40'){ctx.font='bold '+size+'px Trebuchet MS';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(value,x,y);}
  function regionPath(region){
    ctx.beginPath();const b=region.bounds;
    if(region.shape==='rect')ctx.rect(...b);
    else if(region.shape==='ellipse')ctx.ellipse(...b,0,0,Math.PI*2);
    else{region.points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
  }
  function drawing(){
    ctx.fillStyle='#d6ddc4';ctx.fillRect(0,0,M.WIDTH,M.HEIGHT);
    if(options.images.room){ctx.globalAlpha=.22;ctx.drawImage(options.images.room,0,0,1280,800,0,0,M.WIDTH,M.HEIGHT);ctx.globalAlpha=1;}
    box(18,15,684,355,'#fffdf1','#31584b',8);
    ctx.strokeStyle='#365b43';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(570,274);ctx.lineTo(570,315);ctx.stroke();
    const hovered=M.hitRegion(state);
    for(const region of state.regions){
      regionPath(region);ctx.fillStyle=region.paint===null?'#f3f0e5':M.COLORS[region.paint].color;ctx.fill();ctx.strokeStyle='#2c4e42';ctx.lineWidth=3;ctx.stroke();
      if(region===hovered&&state.phase==='playing'){regionPath(region);ctx.strokeStyle='#e49f3b';ctx.lineWidth=5;ctx.stroke();}
      const [x,y]=region.label;ctx.fillStyle='#fffdf2ee';ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();caption(region.key,x,y+5,16);
    }
    caption('ESCUELA',360,169,13);
    for(const chip of M.PALETTE){
      box(chip.x,chip.y,chip.width,chip.height,chip.color,state.selectedColor===chip.key-1?'#153f36':'#799584',7);
      const color=[0,3,4].includes(chip.key-1)?'#fffef5':'#193e32';caption(chip.key,chip.x+chip.width/2,chip.y+20,19,color);caption(chip.name,chip.x+chip.width/2,chip.y+39,14,color);
      if(state.selectedColor===chip.key-1){ctx.strokeStyle='#fff6c8';ctx.lineWidth=2;ctx.strokeRect(chip.x+5,chip.y+5,chip.width-10,chip.height-10);}
    }
    if(state.phase==='playing'){
      const {x,y}=state.cursor;ctx.save();ctx.translate(x,y);ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#16483c';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=M.COLORS[state.selectedColor].color;ctx.fillRect(5,-22,20,17);ctx.strokeRect(5,-22,20,17);ctx.beginPath();ctx.arc(15,-23,8,Math.PI,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  function schoolIcon(){box(200,190,320,190,'#f0c767');ctx.fillStyle='#cb6653';ctx.beginPath();ctx.moveTo(180,190);ctx.lineTo(360,75);ctx.lineTo(540,190);ctx.closePath();ctx.fill();ctx.stroke();box(320,272,80,108,'#6cacc4');box(230,223,60,56,'#9cd5e2');box(430,223,60,56,'#9cd5e2');caption('LOS INSURGENTES',360,250,20);}
  function objectPicture(kind,color){
    if(kind==='color'){box(220,105,280,245,color,'#31584b',45);return;}
    if(kind==='school'){schoolIcon();return;}
    if(kind==='pencil'){
      ctx.save();ctx.translate(360,215);ctx.rotate(-.55);box(-42,-120,84,222,'#f2c852');ctx.fillStyle='#e76a78';ctx.fillRect(-42,-120,84,40);ctx.fillStyle='#d8e0d8';ctx.fillRect(-42,-80,84,18);ctx.fillStyle='#e4bd8a';ctx.beginPath();ctx.moveTo(-42,102);ctx.lineTo(42,102);ctx.lineTo(0,169);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#344a43';ctx.beginPath();ctx.moveTo(-14,146);ctx.lineTo(14,146);ctx.lineTo(0,169);ctx.fill();ctx.restore();return;
    }
    if(kind==='book'){
      box(205,105,310,245,'#5a99c8');box(217,115,143,220,'#fff7d8');box(360,115,143,220,'#fffbed');ctx.strokeStyle='#537569';ctx.lineWidth=3;for(let y=155;y<300;y+=28){ctx.beginPath();ctx.moveTo(235,y);ctx.lineTo(340,y);ctx.moveTo(380,y);ctx.lineTo(485,y);ctx.stroke();}return;
    }
    ctx.strokeStyle='#31584b';ctx.lineWidth=12;ctx.beginPath();ctx.arc(360,120,55,Math.PI,Math.PI*2);ctx.stroke();box(238,120,244,255,'#d98169','#31584b',45);box(268,245,184,100,'#e9ae73');ctx.fillStyle='#ebd57f';ctx.fillRect(281,158,158,12);
  }
  function clock(card){
    const x=360,y=220,r=140;ctx.fillStyle='#fffdf2';ctx.strokeStyle='#2a5647';ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(let n=1;n<=12;n++){const a=n*Math.PI/6-Math.PI/2;caption(n,x+Math.cos(a)*112,y+Math.sin(a)*112+7,24);}
    const hand=(angle,length,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);ctx.stroke();};
    hand((card.hour%12+card.minute/60)*Math.PI/6-Math.PI/2,72,10,'#2e6151');hand(card.minute*Math.PI/30-Math.PI/2,101,6,'#c87c3f');ctx.fillStyle='#295545';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();caption(card.period,x,405,22);
  }
  function questionPicture(){
    ctx.fillStyle='#e4eddd';ctx.fillRect(0,0,M.WIDTH,M.HEIGHT);box(25,20,670,420,'#fff9e9','#b1c4a2');
    const card=state.cards[state.index];
    if(card.picture==='uniform'){
      const day=options.game.UNIFORM_DAYS[card.day];caption(day.name.toUpperCase(),360,66,28);
      C.draw(ctx,options.game,options.images,{kind:'student',style:'boy'},card.shownDay,250,374,275);
      C.draw(ctx,options.game,options.images,{kind:'student',style:'girl'},card.shownDay,470,374,275);
    }else if(card.picture==='clock')clock(card);else objectPicture(card.picture,card.color);
  }
  function events(){for(const event of state.events.splice(0)){
    if(event.type==='complete'){if(event.won)options.onAward?.(state.id,state.score);options.sound?.(event.won?'victory':'try');}
    else if(event.type==='timer-tick')options.sound?.(event.urgent?'cleanup-tick-urgent':'cleanup-tick');
    else options.sound?.(event.type==='correct'?'start':'try');
  }}
  function answer(index){selectedAnswer=index;M.answer(state,index);events();render();}
  function action(){if(!opened)return;if(state.phase==='complete'){close();return;}if(state.phase==='playing'&&state.type!=='drawing'&&!state.answered)M.answer(state,selectedAnswer);else M.action(state);events();render();}
  function pause(){if(!opened)return;if(state.phase==='paused')M.resume(state);else M.pause(state);clear();render();}
  function render(){
    if(!opened)return;const task=M.TASKS[state.id],drawingRound=state.type==='drawing',playing=state.phase==='playing';
    text('missions-progress',state.score+' / '+(drawingRound?state.regions.length:state.cards.length)+(drawingRound?' zonas':' respuestas'));
    text('missions-record',options.record?.won?'✓ Misión conseguida':'Nueva misión');text('missions-message',state.message);
    $('missions-copy').hidden=state.phase!=='intro';$('missions-drawing-controls').hidden=!drawingRound||!playing;
    $('missions-questions').hidden=drawingRound||!playing;$('missions-timer').hidden=!drawingRound;
    if(drawingRound){const seconds=Math.max(0,Math.ceil(state.remaining-.000001));text('missions-time',Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));$('missions-timer').classList.toggle('urgent',seconds<=10);$('missions-time').setAttribute('aria-label','Tiempo restante: '+seconds+' segundos');}
    const enabled=options.isSoundEnabled?.()!==false;lastSound=enabled;$('missions-sound').setAttribute('aria-pressed',String(enabled));text('missions-sound',enabled?'♫':'♪');$('missions-sound').setAttribute('aria-label',enabled?'Silenciar sonido':'Activar sonido');
    $('missions-pause').disabled=['intro','complete'].includes(state.phase);text('missions-pause',state.phase==='paused'?'▶ Continuar':'Ⅱ Pausa');
    text('missions-action',state.phase==='intro'?'Enter / A · Comenzar':state.phase==='paused'?'Enter / A · Continuar':state.phase==='complete'?'Enter / A · Volver':drawingRound?'A · Rellenar':state.answered?(state.index+1===state.cards.length?'Enter / A · Terminar misión':'Enter / A · Siguiente'):'Enter / A · Responder');
    if(!drawingRound&&playing){
      const card=state.cards[state.index];text('missions-prompt',card.prompt);const signature=state.index+':'+state.answered;
      if(signature!==questionKey){
        questionKey=signature;selectedAnswer=state.answered?selectedAnswer:0;$('missions-answers').replaceChildren();
        card.options.forEach((choice,index)=>{const button=document.createElement('button');button.type='button';button.className='mission-answer';button.textContent=choice;button.disabled=state.answered;button.setAttribute('aria-pressed',String(index===selectedAnswer));if(state.answered&&index===card.answer)button.classList.add('correct');button.addEventListener('focus',()=>{selectedAnswer=index;});button.addEventListener('click',()=>answer(index));$('missions-answers').append(button);});
        if(state.answered)K.focus($('missions-action'));else K.focus($('missions-answers').children[selectedAnswer]);
      }
    }
    for(const button of $('missions-palette').children)button.setAttribute('aria-pressed',String(Number(button.dataset.color)===state.selectedColor));
    ctx.clearRect(0,0,M.WIDTH,M.HEIGHT);if(drawingRound)drawing();else questionPicture();
    if(!playing){
      ctx.fillStyle='#153d36bb';ctx.fillRect(0,0,M.WIDTH,M.HEIGHT);box(90,135,540,170,'#fff7e6','#e3c778');
      caption(state.phase==='intro'?(drawingRound?'¡Pinta nuestra escuela!':'¡Aprendemos juntos!'):state.phase==='paused'?'MISIÓN EN PAUSA':state.won?'¡MISIÓN CONSEGUIDA!':'¡Puedes volver a intentar!',360,198,29);
      caption(state.phase==='intro'?'Lee la invitación y pulsa Comenzar.':state.phase==='paused'?'El juego espera. Tu tiempo está detenido.':state.won?'Tus avances quedan guardados.':'Vuelve a practicar cuando quieras.',360,252,19);
    }
    canvas.setAttribute('aria-label',task.title+'. '+state.message);
    if(phaseKey!==state.phase){phaseKey=state.phase;if(!playing){clear();K.focus($('missions-action'),false);}else if(drawingRound){K.clear();canvas.focus({preventScroll:true});}}
  }
  function open(config){
    if(opened)return;options=config;state=M.createState(config.id,config.game,config.hostId);questionKey='';phaseKey='';selectedAnswer=0;menuDirection='';menuAt=0;clear();
    text('missions-title',M.TASKS[state.id].title);text('missions-commission',M.TASKS[state.id].commission);text('missions-copy',M.TASKS[state.id].copy);
    text('missions-help',state.type==='drawing'?'Flechas / palanca: cubeta · Enter / A: rellenar · Z / X o LB / RB: color · 1 a 6: elegir color · E / START: pausa · Espacio / B: volver. También puedes tocar los colores y el dibujo.':'Flechas / cruceta: elegir · Enter / A: confirmar · E / START: pausa · Espacio / B: volver.');
    const host=C.find(config.game,state.hostId),portrait=$('missions-portrait'),context=portrait.getContext('2d');context.clearRect(0,0,portrait.width,portrait.height);C.draw(context,config.game,config.images,host,config.day,50,108,100);text('missions-host',host.name);
    $('missions-palette').replaceChildren();M.COLORS.forEach((color,index)=>{const button=document.createElement('button');button.type='button';button.dataset.color=String(index);button.style.setProperty('--paint-color',color.color);button.textContent=color.key+' · '+color.name;button.addEventListener('click',()=>{M.color(state,index);render();});$('missions-palette').append(button);});
    opened=true;dialog.showModal();render();
  }
  function close(){if(!opened)return;const report=M.snapshot(state);opened=false;clear();dialog.close();options.onClose?.(report);}
  function tick(dt){if(!opened)return;let x=(held.has('arrowright')?1:0)-(held.has('arrowleft')?1:0),y=(held.has('arrowdown')?1:0)-(held.has('arrowup')?1:0);for(const direction of touch.values()){if(direction==='right')x++;if(direction==='left')x--;if(direction==='down')y++;if(direction==='up')y--;}
    const animated=state.type==='drawing'&&state.phase==='playing';M.tick(state,dt,{x:padVector.x||x,y:padVector.y||y});events();if(animated||lastSound!==(options.isSoundEnabled?.()!==false))render();}
  function key(event){
    if(!opened)return false;const key=event.key.toLowerCase();
    if(K.isBack(event)){if(!event.repeat)close();return true;}
    if(key==='e'||key==='p'){if(!event.repeat)pause();return true;}
    if(state.phase!=='playing')return K.key(event,dialog,{defaultTarget:$('missions-action')});
    if(state.type==='drawing'){
      if(key.startsWith('arrow')){held.add(key);return true;}
      if(['z','x'].includes(key)){if(!event.repeat){M.cycleColor(state,key==='z'?-1:1);render();}return true;}
      if(/^[1-6]$/.test(key)){if(!event.repeat){M.color(state,Number(key)-1);render();}return true;}
    }else if(key.startsWith('arrow')&&!state.answered){
      const choices=$('missions-answers').children,step=key==='arrowleft'||key==='arrowup'?-1:1;selectedAnswer=(selectedAnswer+step+choices.length)%choices.length;K.focus(choices[selectedAnswer]);return true;
    }
    if(key==='enter'){if(!event.repeat)action();return true;}return false;
  }
  function pad({x=0,y=0,confirm=false,pause:stop=false,back=false,previous=false,next=false,timestamp=performance.now()}={}){
    if(!opened)return;padVector={x,y};if(back){close();return;}if(stop){pause();return;}
    if(state.type==='drawing'&&state.phase==='playing'){if(previous||next)M.cycleColor(state,previous?-1:1);if(confirm)action();return;}
    const direction=Math.abs(x)>Math.abs(y)?x<-.55?'ArrowLeft':x>.55?'ArrowRight':'':y<-.55?'ArrowUp':y>.55?'ArrowDown':'';
    if(direction&&(direction!==menuDirection||timestamp>=menuAt)){key({key:direction});menuAt=timestamp+(direction===menuDirection?170:350);}menuDirection=direction;
    if(confirm){if(state.phase==='playing')action();else K.key({key:'Enter'},dialog,{defaultTarget:$('missions-action')});}
  }
  $('missions-action').addEventListener('click',action);$('missions-close').addEventListener('click',close);$('missions-pause').addEventListener('click',pause);$('missions-sound').addEventListener('click',()=>{options.onSoundChange?.(options.isSoundEnabled?.()===false);render();});
  canvas.addEventListener('pointerdown',event=>{if(!opened||state.type!=='drawing'||state.phase!=='playing')return;event.preventDefault();const bounds=canvas.getBoundingClientRect();M.setCursor(state,(event.clientX-bounds.left)/bounds.width*M.WIDTH,(event.clientY-bounds.top)/bounds.height*M.HEIGHT);action();});
  for(const button of document.querySelectorAll('[data-mission-direction]')){button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);touch.set(event.pointerId,button.dataset.missionDirection);button.classList.add('pressed');});for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,event=>{touch.delete(event.pointerId);button.classList.remove('pressed');});}
  window.addEventListener('keyup',event=>held.delete(event.key.toLowerCase()));dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(opened)close();});
  window.MissionActivities={open,close,key,pad,tick,suspend(){if(opened&&state.phase==='playing'){M.pause(state);clear();render();}},isOpen:()=>opened,snapshot:()=>opened?M.snapshot(state):null};
})();
