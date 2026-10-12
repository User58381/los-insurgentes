(function(){
  'use strict';
  const P=window.PacmanGame,$=id=>document.getElementById(id),dialog=$('pacman-dialog'),canvas=$('pacman-canvas'),ctx=canvas.getContext('2d');
  const RECORD_KEY='insurgentes-pacman-record-v1';let opened=false,state=null,callbacks={},savedRecord={highScore:0,maxAddend:9},uiPhase='',lastRecord=0,lastSavedAt=0;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  canvas.width=P.COLS*P.TILE;canvas.height=P.ROWS*P.TILE;
  function text(id,value){const node=$(id),next=String(value);if(node.textContent!==next)node.textContent=next;}
  function readRecord(){
    try{const value=JSON.parse(localStorage.getItem(RECORD_KEY));if(value&&typeof value==='object'){savedRecord.highScore=Number.isFinite(value.highScore)?Math.max(0,Math.floor(value.highScore)):0;savedRecord.maxAddend=value.maxAddend===49?49:9;}}catch(_){}
  }
  function saveRecord(){
    if(state)savedRecord={highScore:Math.max(savedRecord.highScore,state.highScore),maxAddend:state.maxAddend};
    try{localStorage.setItem(RECORD_KEY,JSON.stringify(savedRecord));}catch(_){}lastRecord=savedRecord.highScore;lastSavedAt=state?.time||0;
  }
  function sound(kind){callbacks.sound?.(kind);}
  function events(){
    for(const event of state.events.splice(0)){
      const tones={dot:'pac-dot',power:'pac-power',correct:'start',wrong:'try',death:'pac-hit',start:'pac-ready',level:'pac-ready',gameover:'pac-hit',fruit:'star','extra-life':'star'};
      if(tones[event.type])sound(tones[event.type]);
      if(event.type==='correct')callbacks.onCorrect?.(event);
    }
    if(state.highScore>lastRecord&&(state.time-lastSavedAt>=5||['levelclear','gameover'].includes(state.phase)))saveRecord();
  }
  function render(){
    if(!state)return;
    text('pacman-score',state.score.toLocaleString('es-MX'));text('pacman-record',state.highScore.toLocaleString('es-MX'));text('pacman-level',state.level);text('pacman-lives','♥'.repeat(state.lives));
    text('pacman-operation',state.educational||state.phase==='levelclear'?state.question.text+' = ?':'Busca una bolita grande');
    text('pacman-power',state.power>0?'PODER · '+Math.ceil(state.power)+' s':'SIN PODER');$('pacman-power').classList.toggle('pac-power-on',state.power>0);
    text('pacman-message',state.message);$('pacman-answers').hidden=!state.educational;
    for(const ghost of state.ghosts){const node=$('pacman-answer-'+ghost.id);node.style.setProperty('--ghost-color',ghost.color);node.title=ghost.name;text('pacman-answer-'+ghost.id,ghost.answer);}
    const overlay=$('pacman-overlay'),stage=state.phase;overlay.hidden=stage==='playing'||stage==='dying';$('pacman-range-row').hidden=stage!=='intro'&&stage!=='gameover';
    $('pacman-start').hidden=!['intro','paused','gameover'].includes(stage);$('pacman-pause').disabled=['intro','gameover'].includes(stage);text('pacman-pause',stage==='paused'?'▶ Continuar':'Ⅱ Pausa');
    if(stage==='intro'){text('pacman-overlay-title','PAC-MAN EDUCATIVO');text('pacman-overlay-copy','Come una bolita grande. Los fantasmas se pondrán azules y llevarán números. Resuelve la suma y cómete el que tenga la respuesta correcta.');text('pacman-start','A / Enter · Jugar');}
    else if(stage==='paused'){text('pacman-overlay-title','PAUSA');text('pacman-overlay-copy','Tu partida está detenida. Continúa cuando estés listo.');text('pacman-start','A / Enter · Continuar');}
    else if(stage==='levelclear'){text('pacman-overlay-title','¡CORRECTO!');text('pacman-overlay-copy',state.question.text+' = '+state.question.answer+' · +500 puntos. ¡Vamos al siguiente nivel!');}
    else if(stage==='ready'){text('pacman-overlay-title','¡LISTO!');text('pacman-overlay-copy','Muévete por el laberinto. Evita a los fantasmas hasta tener poder.');}
    else if(stage==='gameover'){text('pacman-overlay-title','¡BUENA PARTIDA!');text('pacman-overlay-copy',state.score.toLocaleString('es-MX')+' puntos · '+state.correct+' '+(state.correct===1?'suma resuelta':'sumas resueltas')+'. Inténtalo de nuevo.');text('pacman-start','A / Enter · Volver a jugar');}
    P.draw(state,ctx,{reducedMotion});
    if(uiPhase!==stage){uiPhase=stage;if(['intro','paused','gameover'].includes(stage))$('pacman-start').focus({preventScroll:true});}
  }
  function open(options={}){
    if(opened)return;readRecord();callbacks=options;state=P.createState({highScore:savedRecord.highScore,maxAddend:savedRecord.maxAddend});lastRecord=state.highScore;lastSavedAt=0;uiPhase='';
    text('pacman-player',(options.playerName||'Jugador')+(options.group?' · '+options.group:''));$('pacman-range').value=String(state.maxAddend);
    opened=true;dialog.showModal();render();
  }
  function close(){
    if(!opened)return;const report=P.snapshot(state);saveRecord();opened=false;if(dialog.open)dialog.close();callbacks.onClose?.(report);
  }
  function confirm(){if(!opened)return;if(state.phase==='paused')P.pause(state);else P.start(state);events();render();}
  function togglePause(){if(!opened)return;if(state.phase==='intro'||state.phase==='gameover')confirm();else{P.pause(state);render();}}
  function direction(dir){if(!opened)return;P.setDirection(state,dir);}
  function pad({x=0,y=0,confirm:go=false,pause:toggle=false,back=false}={}){
    if(!opened)return;if(back){close();return;}if(go)confirm();else if(toggle)togglePause();
    if(Math.abs(x)>.35||Math.abs(y)>.35)direction(Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down'));
  }
  function key(event){
    if(!opened||event.target?.matches?.('input,select,textarea,[contenteditable=true]'))return false;
    const key=event.key.toLowerCase(),directions={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};
    if(directions[key]){direction(directions[key]);return true;}
    if(key==='escape'){if(!event.repeat)close();return true;}
    if(key==='p'){if(!event.repeat)togglePause();return true;}
    if(key==='enter'||key===' '){if(!event.repeat)confirm();return true;}return false;
  }
  function tick(dt){if(!opened)return;P.tick(state,dt);events();render();}
  function suspend(){if(opened&&state.phase!=='paused'&&P.pause(state))render();}
  $('pacman-start').addEventListener('click',confirm);$('pacman-close').addEventListener('click',close);$('pacman-pause').addEventListener('click',togglePause);
  $('pacman-range').addEventListener('change',()=>{P.setRange(state,Number($('pacman-range').value));saveRecord();render();});
  for(const button of dialog.querySelectorAll('[data-pac-direction]')){
    button.addEventListener('pointerdown',event=>{event.preventDefault();direction(button.dataset.pacDirection);});
    button.addEventListener('click',()=>direction(button.dataset.pacDirection));
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(opened)close();});
  window.PacmanArcade={open,close,confirm,togglePause,direction,pad,key,tick,suspend,isOpen:()=>opened,snapshot:()=>opened?P.snapshot(state):null};
})();
