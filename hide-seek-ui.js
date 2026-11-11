(function(){
  'use strict';
  const H=window.SchoolHideSeek;let game=null,world=null,session=null,options=null,lastPhase='',padDir=0,padAt=0;
  function el(tag,id,text){const node=document.createElement(tag);if(id)node.id=id;if(text)node.textContent=text;return node;}
  const hud=el('section','hide-seek-hud'),heading=el('strong',null,'ESCONDIDAS CON ROMINA'),stats=el('span','hide-seek-stats'),message=el('p','hide-seek-message');
  hud.hidden=true;hud.setAttribute('aria-label','Escondidas con Romina');message.setAttribute('role','status');
  const actions=el('div'),searchButton=el('button',null,'A · Buscar aquí'),hintButton=el('button',null,'Pista'),pauseButton=el('button',null,'Ⅱ Pausa');
  for(const button of [searchButton,hintButton,pauseButton])button.type='button';actions.append(searchButton,hintButton,pauseButton);hud.append(heading,stats,message,actions);document.body.append(hud);
  const dialog=el('dialog','hide-seek-dialog'),title=el('h2','hide-seek-title'),portrait=el('canvas','hide-seek-portrait'),copy=el('p'),main=el('button',null,'¡Vamos a jugar!'),leave=el('button',null,'Después');
  portrait.width=130;portrait.height=150;main.type=leave.type='button';main.className='primary-button';leave.className='uniform-button';dialog.setAttribute('aria-labelledby','hide-seek-title');dialog.append(portrait,title,copy,main,leave);document.body.append(dialog);
  function isOpen(){return !!session;}
  function render(){
    if(!session)return;const s=session;
    const total=Math.ceil(s.remaining),minutes=Math.floor(total/60),seconds=total%60;stats.textContent=s.found+'/'+s.spots.length+' encontrados · '+minutes+':'+String(seconds).padStart(2,'0');
    hud.classList.toggle('urgent',s.remaining<=10);message.textContent=s.phase==='counting'?'¡'+Math.max(1,Math.ceil(s.countdown))+'! Todos a esconderse…':s.message;
    hud.hidden=dialog.open;searchButton.disabled=s.phase!=='playing';hintButton.disabled=s.phase!=='playing';
    if(lastPhase===s.phase)return;lastPhase=s.phase;
    if(['ready','paused','complete'].includes(s.phase)){
      title.textContent=s.phase==='ready'?'¿Jugamos a las escondidas?':s.phase==='paused'?'Escondidas en pausa':s.won?'¡Encontraste a todos!':'¡Buen intento!';
      copy.textContent=s.phase==='ready'?'¡Hola! Cinco compañeros se esconderán entre las jardineras y los biombos de la explanada. Cuenta hasta cinco y tendrás 2 minutos para encontrarlos. Acércate y pulsa Enter / A. Espacio / B para correr; E / START para pausar; H / X para una pista.':s.phase==='paused'?'El reloj está detenido. Continúa cuando estés listo o vuelve al patio.':s.won?'Encontraste a los cinco. Tu logro está guardado; la primera victoria suma 80 puntos. ¿Jugamos otra vez?':'Encontraste a '+s.found+' de cinco. Puedes volver a intentarlo con otros escondites.';
      main.textContent=s.phase==='ready'?'¡Vamos a jugar!':s.phase==='paused'?'Continuar':'Jugar otra vez';leave.textContent=s.phase==='ready'?'Después':'Volver al patio';
      if(!dialog.open)dialog.showModal();hud.hidden=true;options.clearInput?.();window.SchoolKeyboard.focus(main,false);
    }else{if(dialog.open)dialog.close();hud.hidden=false;options.focus?.();}
    options.onPhase?.(s.phase);
  }
  function open(value){if(session)return false;options=value;game=value.game;world=value.world;session=H.create(game,world.player.id);lastPhase='';
    const c=portrait.getContext('2d');c.clearRect(0,0,130,150);window.SchoolCharacters.draw(c,game,value.images,{...game.STUDENTS.find(s=>s.id==='romina'),kind:'student'},world.schoolDay,65,145,135);render();return true;}
  function action(){if(!session)return;if(session.phase==='ready'){H.start(session);options.sound?.('start');}
    else if(session.phase==='paused')H.pause(session);
    else if(session.phase==='complete'){session=H.create(game,world.player.id);H.start(session);options.sound?.('start');}
    else if(session.phase==='playing')H.search(session,world.player,game);
    drain();render();}
  function pause(){if(!session)return;H.pause(session);options.clearInput?.();render();}
  function hint(){if(!session)return;H.hint(session,world.player);render();}
  function close(){if(!session)return;const old=options,report={won:session.won};session=null;lastPhase='';hud.hidden=true;if(dialog.open)dialog.close();old.onClose?.(report);}
  function drain(){for(const event of session.events.splice(0)){if(event.type==='complete'){if(H.award(session,world))options.onAward?.();options.sound?.(event.won?'victory':'try');}else if(event.type==='timer-tick')options.sound?.(event.urgent?'cleanup-tick-urgent':'cleanup-tick');else options.sound?.('start');}}
  function tick(dt,input){if(!session)return;H.tick(session,dt);if(session.phase==='playing'){
      game.move(world,input?.x||0,input?.y||0,dt,!!input?.run);
      world.player.x=Math.max(H.AREA.left,Math.min(H.AREA.right,world.player.x));world.player.y=Math.max(H.AREA.top,Math.min(H.AREA.bottom,world.player.y));
    }else world.player.walking=false;drain();render();}
  function key(event){if(!session)return false;const k=event.key.toLowerCase();
    if(dialog.open){if(k==='escape'||k===' '){if(!event.repeat)close();return true;}if(k==='e'&&session.phase==='paused'){if(!event.repeat)pause();return true;}return window.SchoolKeyboard.key(event,dialog,{defaultTarget:main});}
    if(k==='e'||k==='escape'){if(!event.repeat)pause();return true;}if(k==='h'){if(!event.repeat)hint();return true;}if(k==='enter'){if(!event.repeat)action();return true;}return false;
  }
  function pad({x,y,confirm,back,pause:pauseInput,hint:hintInput,timestamp}){if(!session)return;
    if(dialog.open){if(back){close();return;}if(pauseInput&&session.phase==='paused'){pause();return;}const dir=y<-.5||x<-.5?-1:y>.5||x>.5?1:0;if(dir&&(dir!==padDir||timestamp>=padAt)){window.SchoolKeyboard.move(dialog,dir);padAt=timestamp+260;}padDir=dir;if(confirm)(dialog.contains(document.activeElement)?document.activeElement:main).click();return;}
    if(pauseInput)pause();else if(hintInput)hint();else if(confirm)action();}
  function draw(ctx,time){if(!session)return;const s=session;
    if(s.phase==='counting')return;
    s.spots.forEach((spot,index)=>{
      ctx.save();ctx.translate(spot.x,spot.y);const near=H.nearby(s,world.player)===spot;
      if(near||s.hintIndex===index){ctx.strokeStyle='#ffe17e';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,3,30,11,0,0,Math.PI*2);ctx.stroke();}
      if(spot.found){const actor={...game.STUDENTS.find(a=>a.id===spot.id),kind:'student'};window.SchoolCharacters.draw(ctx,game,options.images,actor,world.schoolDay,0,-4,36);ctx.fillStyle='#ffe993';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('✓ '+actor.name,0,17);}
      else if(spot.kind==='planter'){
        ctx.fillStyle='#895b3d';ctx.fillRect(-22,-15,44,16);ctx.fillStyle='#bd8553';ctx.fillRect(-24,-19,48,7);
        for(const [x,y,r] of [[-14,-26,13],[0,-32,16],[15,-25,13]]){ctx.fillStyle=x===0?'#53994d':'#397942';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#d6e99b';ctx.fillRect(-10,-35,5,5);
      }else{ctx.fillStyle='#754c38';ctx.fillRect(-24,-1,5,8);ctx.fillRect(19,-1,5,8);ctx.fillStyle='#227e8e';ctx.fillRect(-26,-40,52,40);ctx.fillStyle='#efbb59';ctx.fillRect(-22,-36,44,3);ctx.fillStyle='#f17a65';ctx.fillRect(-18,-25,12,12);ctx.fillStyle='#badb9b';ctx.fillRect(5,-27,12,16);}
      if(near&&!spot.found){ctx.fillStyle='#fff5d5';ctx.strokeStyle='#173d35';ctx.lineWidth=3;ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.strokeText('Enter / A · Buscar',0,-51);ctx.fillText('Enter / A · Buscar',0,-51);}ctx.restore();
    });
  }
  searchButton.addEventListener('click',action);hintButton.addEventListener('click',hint);pauseButton.addEventListener('click',pause);main.addEventListener('click',action);leave.addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.RominaHideSeek={open,close,isOpen,action,pause,key,pad,tick,draw,hint,suspend(){if(session&&['playing','counting'].includes(session.phase))pause();},hiddenIds(){return session?new Set(session.spots.map(s=>s.id)):new Set();},snapshot(){return session?{phase:session.phase,found:session.found,total:session.spots.length,remaining:Math.ceil(session.remaining),won:session.won}:null;}};
})();
