(function(){
  'use strict';
  const P=window.SchoolPlayground,C=window.SchoolCharacters,K=window.SchoolKeyboard,$=id=>document.getElementById(id);
  const dialog=$('playground-dialog'),canvas=$('playground-canvas'),ctx=canvas.getContext('2d'),held=new Set(),touch=new Map();
  let state=null,options={},opened=false,padVector={x:0,y:0},lastPhase='';
  const deposits=[];
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:false};
  const actor=(id)=>C.find(options.game,id),drawActor=(person,x,y,height=73,facing='down',motion=null)=>C.draw(ctx,options.game,options.images,person,options.day,x,y,height,facing,motion);
  function label(text,x,y,color='#fff1cf'){
    const lines=text.split('\n'),extra=(lines.length-1)*18;
    ctx.font='bold 16px Trebuchet MS';ctx.textAlign='center';const width=Math.max(...lines.map(line=>ctx.measureText(line).width))+18;
    ctx.fillStyle='#17493ded';ctx.fillRect(x-width/2,y-18-extra,width,27+extra);ctx.fillStyle=color;
    lines.forEach((line,index)=>ctx.fillText(line,x,y+2-extra+index*18));
  }
  function football(){
    ctx.fillStyle='#4c9667';ctx.fillRect(0,0,720,420);
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#549e6d':'#4c9667';ctx.fillRect(i*90,0,90,420);}
    ctx.strokeStyle='#d6e7b6';ctx.lineWidth=3;ctx.strokeRect(40,26,640,368);ctx.strokeRect(118,119,484,176);ctx.beginPath();ctx.arc(360,349,53,Math.PI,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#174a4690';ctx.fillRect(157,49,406,109);
    ctx.strokeStyle='#f4eacc';ctx.lineWidth=6;ctx.strokeRect(157,49,406,109);
    ctx.lineWidth=1;ctx.strokeStyle='#d3e2ca70';for(let x=175;x<560;x+=24){ctx.beginPath();ctx.moveTo(x,52);ctx.lineTo(x,157);ctx.stroke();}for(let y=70;y<158;y+=22){ctx.beginPath();ctx.moveTo(158,y);ctx.lineTo(562,y);ctx.stroke();}
    const npc=actor(P.TASKS[state.id].npc),keeper=state.role==='keeper'?options.player:npc,striker=state.role==='keeper'?npc:options.player;
    if(state.role==='striker'&&state.stage==='ready'){
      const target=360+state.aim*185;ctx.strokeStyle='#ffdf77';ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(360,347);ctx.lineTo(target,154);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#ffdf77';ctx.beginPath();ctx.arc(target,154,9,0,Math.PI*2);ctx.fill();
    }
    ctx.save();ctx.translate(state.keeperX,160);if(state.dive>0)ctx.rotate(state.keeperX<360?-.32:.32);drawActor(keeper,0,0,78,'down',{walking:state.keeperWalking&&state.phase==='playing',time:state.keeperTime,reducedMotion:reducedMotion.matches});ctx.restore();
    label((state.role==='keeper'?'Tú':npc.name)+' · portero',state.keeperX,194);
    drawActor(striker,360,354,80,'up');label(state.role==='keeper'?npc.name:'Tú',360,389);
    const ball=state.ball||{x:360,y:348};ctx.font='27px Arial';ctx.textAlign='center';ctx.fillText('⚽',ball.x,ball.y);
    if(state.role==='keeper'&&state.stage==='ready')label('Prepárate…',360,237,'#ffdc7a');
  }
  function courtyard(){
    ctx.fillStyle='#cec7a7';ctx.fillRect(0,0,720,420);
    if(options.images.map)ctx.drawImage(options.images.map,307,707,650,253,0,0,720,420);
    ctx.fillStyle='#e6dcb544';ctx.fillRect(0,0,720,420);
  }
  function rope(){
    courtyard();const phase=state.cycle/state.period,until=state.period-state.cycle;
    ctx.fillStyle='#295d4850';ctx.beginPath();ctx.ellipse(345,320,132,30,0,0,Math.PI*2);ctx.fill();
    drawActor(actor('dalila'),575,300,105,'left');label('Dalila',575,338);
    const a=phase*Math.PI*2,back=Math.sin(a)<0;
    function ropeLine(){ctx.strokeStyle=until<.4?'#f3c44e':'#f1f5de';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(220,230);ctx.bezierCurveTo(220,252+Math.cos(a)*100,458,252+Math.cos(a)*100,458,230);ctx.stroke();ctx.fillStyle='#946a38';ctx.fillRect(212,218,13,26);ctx.fillRect(454,218,13,26);}
    if(back)ropeLine();drawActor(options.player,340,320-P.jumpHeight(state),122,'down');if(!back)ropeLine();
    label(options.player.name,340,367);
    ctx.fillStyle='#244b3e';ctx.fillRect(147,49,425,22);ctx.fillStyle='#e7b94b';ctx.fillRect(147+425*(1-.4/state.period),49,425*.26/state.period,22);ctx.fillStyle='#f9f0d3';ctx.fillRect(147+425*phase-3,43,6,34);
    label(until<.4&&until>.11?'¡SALTA!':'Sigue la cuerda',360,115,until<.4?'#ffdc7a':'#fff1cf');
    label('Oportunidades: '+'♥'.repeat(3-state.misses),360,408,'#ffe49d');
  }
  function trash(item,x=item.x,y=item.y,size=32){
    const frame=P.CLEANUP_FRAMES.litter[item.type],image=options.images.cleanupSprites;
    if(image&&frame){const [sx,sy,sw,sh]=frame,factor=size/Math.max(sw,sh);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,sw,sh,x-sw*factor/2,y-sh*factor/2,sw*factor,sh*factor);return;}
    ctx.save();ctx.translate(x,y);
    if(item.type==='organic'){ctx.fillStyle='#f4ce4d';ctx.strokeStyle='#785125';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1,-16);ctx.quadraticCurveTo(-2,0,-16,4);ctx.quadraticCurveTo(-21,10,-13,8);ctx.quadraticCurveTo(-3,9,1,-2);ctx.quadraticCurveTo(1,14,-12,14);ctx.quadraticCurveTo(5,22,8,0);ctx.quadraticCurveTo(14,15,20,9);ctx.quadraticCurveTo(8,7,5,-15);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#785125';ctx.fillRect(0,-20,5,5);}
    else if(item.type==='bottle'){ctx.fillStyle='#a0dddf';ctx.strokeStyle='#306f76';ctx.lineWidth=2;ctx.fillRect(-5,-24,10,6);ctx.fillRect(-8,-17,16,28);ctx.strokeRect(-8,-17,16,28);ctx.fillStyle='#468fa8';ctx.fillRect(-8,-7,16,8);}
    else{ctx.fillStyle='#d16f66';ctx.strokeStyle='#91594a';ctx.lineWidth=2;ctx.fillRect(-14,-11,28,19);ctx.strokeRect(-14,-11,28,19);ctx.fillStyle='#edbc64';ctx.fillRect(-5,-8,10,13);}
    ctx.restore();
  }
  function cleanup(){
    courtyard();
    for(const bin of P.BINS){
      const frame=P.CLEANUP_FRAMES.bins[bin.type],image=options.images.cleanupSprites;
      const receiving=deposits.some(item=>item.type===bin.type&&item.age<.65);
      if(receiving){ctx.fillStyle='#ffe28d80';ctx.beginPath();ctx.ellipse(bin.x,bin.y+12,40,12,0,0,Math.PI*2);ctx.fill();}
      if(image&&frame){const [sx,sy,sw,sh]=frame,factor=100/sh;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,sw,sh,bin.x-sw*factor/2,bin.y+16-100,sw*factor,100);}
      else{ctx.fillStyle=bin.color;ctx.fillRect(bin.x-31,bin.y-45,62,55);ctx.fillStyle='#254a3c';ctx.fillRect(bin.x-34,bin.y-51,68,9);}
      label(bin.heading+'\n'+bin.detail,bin.x,bin.y-91);
    }
    drawActor(actor('criss'),646,222,87,'left');label('Criss',646,249);
    for(const item of state.litter)if(!item.picked){
      if(!state.carrying&&Math.hypot(item.x-state.player.x,item.y-state.player.y)<=43){ctx.strokeStyle='#ffe49b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(item.x,item.y+3,23,12,0,0,Math.PI*2);ctx.stroke();}
      trash(item);
    }
    const player=state.player;drawActor(options.player,player.x,player.y,70,player.facing,{walking:player.walking&&state.phase==='playing',time:player.time,reducedMotion:reducedMotion.matches});
    if(state.carrying)trash(state.carrying,player.x+20,player.y-49);
    for(const item of deposits){const t=Math.min(1,item.age/.58),ease=1-Math.pow(1-t,2),x=item.fromX+(item.toX-item.fromX)*ease,y=item.fromY+(item.toY-item.fromY)*ease-Math.sin(t*Math.PI)*43;ctx.save();ctx.globalAlpha=t>.82?(1-t)/.18:1;trash(item,x,y,32*(1-t*.65));ctx.restore();}
    if(state.carrying)label('Lleva a '+P.BINS.find(b=>b.type===state.carrying.type).name,360,409,'#ffe49d');
  }
  function render(){
    if(!opened)return;
    const task=P.TASKS[state.id],menu=['intro','paused','complete'].includes(state.phase)&&!(state.phase==='complete'&&deposits.length),result=state.type==='football'&&state.stage==='result';
    const cleanupRound=state.type==='cleanup';dialog.classList.toggle('cleanup-round',cleanupRound);$('playground-timer').hidden=!cleanupRound;
    if(cleanupRound){
      const remaining=Math.max(0,Math.ceil(state.remaining-.000001)),text=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
      if($('cleanup-time').textContent!==text){$('cleanup-time').textContent=text;$('cleanup-time').setAttribute('aria-label','Tiempo restante: '+remaining+' segundos');}
      $('playground-timer').classList.toggle('urgent',remaining<=10);$('playground-timer').classList.toggle('clock-paused',state.phase!=='playing');
    }
    const sound=options.isSoundEnabled?.()!==false;$('playground-sound').textContent=sound?'♫':'♪';$('playground-sound').setAttribute('aria-pressed',String(sound));$('playground-sound').setAttribute('aria-label',sound?'Silenciar sonido':'Activar sonido');
    $('playground-score').textContent=state.type==='football'?'Tú '+state.score+' · '+(state.id==='joaquin'?'Joaquín':state.id==='alexis'?'Alexis':'Daniel')+' '+state.rival:state.type==='rope'?state.hits+' / 10 saltos':state.collected+' / 9 residuos';
    $('playground-record').textContent=options.record?.won?'✓ Reto conseguido':'Nueva misión';
    if($('playground-message').textContent!==state.message)$('playground-message').textContent=state.message;
    $('playground-pause').disabled=state.phase==='intro'||state.phase==='complete';$('playground-pause').textContent=state.phase==='paused'?'▶ Seguir':'Ⅱ Pausa';
    $('playground-action').textContent=state.phase==='intro'?'Enter / A · ¡Vamos!':state.phase==='paused'?'Enter / A · Continuar':state.phase==='complete'?'Enter / A · Volver al patio':result?'Enter / A · Siguiente tiro':state.type==='rope'?'A · Saltar':state.type==='cleanup'?(state.carrying?'A · Depositar':'A · Recoger'):state.role==='keeper'?'A · Estirarte':'A · Patear';
    $('playground-directions').hidden=menu||state.type==='rope';
    canvas.setAttribute('aria-label',task.title+'. '+state.message);
    ctx.clearRect(0,0,720,420);if(state.type==='football')football();else if(state.type==='rope')rope();else cleanup();
    if(menu){
      ctx.fillStyle='#0b302ce0';ctx.fillRect(0,0,720,420);ctx.fillStyle='#ffe295';ctx.font='bold 29px Georgia';ctx.textAlign='center';
      ctx.fillText(state.phase==='paused'?'Reto en pausa':state.phase==='complete'?(state.won?'¡Reto conseguido!':state.reason==='timeout'?'¡Se acabó el tiempo!':'¡Sigue practicando!'):task.title,360,145);
      drawActor(options.player,294,298,112);drawActor(actor(task.npc),428,298,112);
      ctx.font='bold 17px Trebuchet MS';ctx.fillStyle='#fff1ce';ctx.fillText(state.phase==='intro'?'Lee las instrucciones y pulsa ¡Vamos!':state.phase==='paused'?'El reto te espera.':'Vuelve al patio cuando quieras.',360,354);
    }
    const phaseKey=state.phase+':'+menu;
    if(lastPhase!==phaseKey){lastPhase=phaseKey;if(menu){clear();K.focus($('playground-action'),false);}else K.clear();}
  }
  function events(){for(const event of state.events.splice(0)){
    if(event.type==='complete'){if(event.won)options.onAward?.(state.id,state.score);if(state.type!=='cleanup'||!event.won)options.sound?.(event.won?'victory':'try');}
    else if(event.type==='success'&&state.type==='cleanup'){if(event.deposit)deposits.push({...event.deposit,age:0});options.sound?.('start');}
    else if(event.type==='timer-tick')options.sound?.(event.urgent?'cleanup-tick-urgent':'cleanup-tick');
    else options.sound?.({success:'correct',kick:'kick',jump:'throw',pickup:'correct',try:'try'}[event.type]);
  }}
  function clear(){held.clear();touch.clear();padVector={x:0,y:0};document.querySelectorAll('[data-playground-direction]').forEach(b=>b.classList.remove('pressed'));}
  function open(config){if(opened)return;options=config;deposits.length=0;state=P.createState(config.id);if(config.autoStart)P.action(state);opened=true;lastPhase='';clear();$('playground-title').textContent=P.TASKS[config.id].title;$('playground-subtitle').textContent='LOS INSURGENTES · '+config.player.name;dialog.showModal();render();}
  function close(){if(!opened)return;const report=P.snapshot(state);opened=false;deposits.length=0;clear();dialog.close();options.onClose?.(report);}
  function action(){if(!opened)return;if(state.phase==='complete'){close();return;}P.action(state);events();render();}
  function pause(){if(state.phase==='paused')P.resume(state);else P.pause(state);clear();render();}
  function tick(dt){if(!opened)return;
    if(state.phase!=='paused')for(let i=deposits.length-1;i>=0;i--){deposits[i].age+=Math.max(0,Math.min(.05,dt));if(deposits[i].age>=.65)deposits.splice(i,1);}
    let x=(held.has('arrowright')||held.has('d')?1:0)-(held.has('arrowleft')||held.has('a')?1:0),y=(held.has('arrowdown')||held.has('s')?1:0)-(held.has('arrowup')||held.has('w')?1:0);
    for(const dir of touch.values()){if(dir==='left')x--;if(dir==='right')x++;if(dir==='up')y--;if(dir==='down')y++;}
    P.tick(state,dt,{x:padVector.x||x,y:padVector.y||y});events();render();
  }
  function key(event){
    const key=event.key.toLowerCase();if(K.isBack(event)){if(!event.repeat)close();return true;}
    if(key==='e'||key==='p'){if(!event.repeat)pause();return true;}
    if(state.phase!=='playing')return K.key(event,dialog,{defaultTarget:$('playground-action')});
    if(['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'].includes(key)){held.add(key);return true;}
    if(key==='enter'){if(!event.repeat)action();return true;}return false;
  }
  function pad({x,y,confirm:go,pause:stop,back}){padVector={x,y};if(back)close();else if(stop)pause();else if(go)action();}
  window.addEventListener('keyup',event=>held.delete(event.key.toLowerCase()));
  for(const button of document.querySelectorAll('[data-playground-direction]')){
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);touch.set(event.pointerId,button.dataset.playgroundDirection);button.classList.add('pressed');});
    for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,event=>{touch.delete(event.pointerId);button.classList.remove('pressed');});
  }
  $('playground-action').addEventListener('click',action);$('playground-pause').addEventListener('click',pause);$('playground-close').addEventListener('click',close);
  $('playground-sound').addEventListener('click',()=>{options.onSoundChange?.(options.isSoundEnabled?.()===false);render();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.PlaygroundGames={open,close,tick,key,pad,suspend(){if(opened&&state.phase==='playing'){P.pause(state);clear();render();}},isOpen:()=>opened,snapshot:()=>state?P.snapshot(state):null};
})();
