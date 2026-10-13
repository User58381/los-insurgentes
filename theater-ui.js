(function(){
  'use strict';
  const R=window.TheaterRhythm,song=window.TheaterSong,K=window.SchoolKeyboard,$=id=>document.getElementById(id);
  const dialog=$('theater-dialog'),scene=$('theater-scene'),stageCtx=scene.getContext('2d'),laneCanvas=$('theater-lanes'),laneCtx=laneCanvas.getContext('2d');
  const audio=new Audio(),RECORD_KEY='insurgentes-theater-record-v1',heldKeys=new Set();
  const directions={arrowleft:0,a:0,arrowdown:1,s:1,arrowup:2,w:2,arrowright:3,d:3};
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let opened=false,state=null,callbacks={},record={easy:0,hard:0,mode:'easy',offsetMs:0},cast=null,uiPhase='',playEpoch=0,buffering=false,enabled=true;
  let padHeld=Array(4).fill(false),menuDirection=0,menuAt=0;
  audio.preload='metadata';audio.loop=false;audio.volume=.48;
  scene.width=960;scene.height=640;laneCanvas.width=360;laneCanvas.height=420;
  function text(id,value){const node=$(id),next=String(value);if(node.textContent!==next)node.textContent=next;}
  function timeLabel(seconds){seconds=Math.max(0,Math.floor(seconds));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
  function readRecord(){
    record={easy:0,hard:0,mode:'easy',offsetMs:0};
    try{const value=JSON.parse(localStorage.getItem(RECORD_KEY));if(value&&typeof value==='object'){
      for(const mode of ['easy','hard'])if(Number.isFinite(value[mode]))record[mode]=Math.max(0,Math.floor(value[mode]));
      if(R.MODES[value.mode])record.mode=value.mode;if(Number.isFinite(value.offsetMs))record.offsetMs=Math.max(-250,Math.min(250,value.offsetMs));
    }}catch(_){}
  }
  function saveRecord(){
    if(state){record[state.mode]=Math.max(record[state.mode],state.highScore,state.score);record.mode=state.mode;record.offsetMs=state.offsetMs;}
    try{localStorage.setItem(RECORD_KEY,JSON.stringify(record));}catch(_){}
  }
  function resetState(mode=record.mode){state=R.createState(song,{mode,offsetMs:record.offsetMs,highScore:record[mode],finishAtDuration:false});if(Number.isFinite(audio.duration)&&audio.duration>song.beats.at(-1)+.3)state.duration=audio.duration;uiPhase='';}
  function buildCast(){
    const students=callbacks.students||[],player=students.find(actor=>actor.id===callbacks.player?.id)||students[0];
    const choir=player?[player,...students.filter(actor=>actor.id!==player.id).slice(0,5)]:[];
    const choirIds=new Set(choir.map(actor=>actor.id));
    return {choir,audience:students.filter(actor=>!choirIds.has(actor.id)),staff:(callbacks.teachers||[]).filter(actor=>actor.id!=='angel'&&actor.assetKey&&actor.frames)};
  }
  function drawStudent(student,row,x,y,height){
    const frame=callbacks.studentFrame?.(student,row);if(!frame||!callbacks.images?.students)return;
    const [sx,sy,sw,sh,ax,ay]=frame,scale=height/sh;stageCtx.drawImage(callbacks.images.students,sx,sy,sw,sh,x-ax*scale,y-ay*scale,sw*scale,sh*scale);
  }
  function drawStaff(teacher,row,x,y,height){
    const image=callbacks.images?.[teacher.assetKey];if(!image)return;
    const [sx,sy,sw,sh,ax,ay]=teacher.frames[row],scale=height/sh;stageCtx.drawImage(image,sx,sy,sw,sh,x-ax*scale,y-ay*scale,sw*scale,sh*scale);
  }
  function note(x,y,color,scale=1){
    stageCtx.save();stageCtx.translate(Math.round(x),Math.round(y));stageCtx.scale(scale,scale);stageCtx.fillStyle=color;
    stageCtx.fillRect(0,9,7,5);stageCtx.fillRect(3,7,5,6);stageCtx.fillRect(6,-5,3,17);stageCtx.fillRect(8,-5,6,3);stageCtx.fillRect(11,-2,3,4);stageCtx.restore();
  }
  function caption(label,x,y,color='#fff0c9'){
    stageCtx.font='bold 14px Trebuchet MS';stageCtx.textAlign='center';const width=stageCtx.measureText(label).width+18;
    stageCtx.fillStyle='#143e37e8';stageCtx.fillRect(x-width/2,y-13,width,22);stageCtx.fillStyle=color;stageCtx.fillText(label,x,y+3);
  }
  function drawScene(){
    if(!cast)return;const images=callbacks.images||{},time=state.elapsed,performing=['playing','paused','complete'].includes(state.phase);
    stageCtx.imageSmoothingEnabled=false;stageCtx.fillStyle='#baceaf';stageCtx.fillRect(0,0,960,640);
    if(images.theaterBackdrop)stageCtx.drawImage(images.theaterBackdrop,0,0,960,640);
    const beat=Math.max(0,(time-song.offset)/song.beatPeriod),bounce=performing&&!reducedMotion?Math.sin(beat*Math.PI*2)*1.2:0;
    const choirX=[200,280,360,610,690,770];
    cast.choir.forEach((student,i)=>{
      const x=choirX[i],y=326+bounce;drawStudent(student,0,x,y,67);
      if(performing){const age=reducedMotion?.3:(time*.65+i*.21)%1.5;stageCtx.globalAlpha=reducedMotion?.85:1-age/1.5;note(x+14,253-age*25,R.COLORS[i%4],1.05);stageCtx.globalAlpha=1;}
      if(student.id===callbacks.player?.id)caption(student.name+' · tú',x,346,'#ffe487');
    });
    if(images.guitarAngel){
      const singing=state.lastJudgment&&['perfect','good','ok'].includes(state.lastJudgment.kind)&&state.judgeTime-state.lastJudgment.at<.3;
      const frame=singing?3:performing&&!reducedMotion?[0,2,1,2][Math.floor(beat*2)%4]:0;
      const [sx,sy,sw,sh,ax,ay]=song.guitarFrames[frame],scale=125/sh;
      stageCtx.drawImage(images.guitarAngel,sx,sy,sw,sh,480-ax*scale,324-ay*scale,sw*scale,sh*scale);
    }
    caption('Maestro Ángel · guitarra',480,348);
    if(performing)for(let i=0;i<3;i++){const age=reducedMotion?.5:(time*.7+i*.65)%1.9;stageCtx.globalAlpha=reducedMotion?.85:1-age/1.9;note(459+i*23,196-age*24,['#ffc747','#87d9fb','#f997b1'][i],1.2);stageCtx.globalAlpha=1;}
    cast.audience.forEach((student,i)=>{const x=245+(i%7)*75,y=428+Math.floor(i/7)*49;drawStudent(student,3,x,y+(performing&&!reducedMotion?Math.sin(beat*Math.PI+i)*.55:0),43);});
    const director=cast.staff.find(actor=>actor.id==='guadalupe'),admin=cast.staff.find(actor=>actor.id==='mauricio');
    if(director){drawStaff(director,1,836,434,62);caption('Director José Guadalupe',829,450);}
    if(admin)drawStaff(admin,2,121,435,52);
    cast.staff.filter(actor=>actor!==director&&actor!==admin).forEach((teacher,i)=>drawStaff(teacher,3,222+(i%7)*83,584+Math.floor(i/7)*48,53));
    const hit=state.lastJudgment&&['perfect','good','ok'].includes(state.lastJudgment.kind),age=hit?state.judgeTime-state.lastJudgment.at:2;
    if(hit&&age>=0&&age<.6&&!reducedMotion){
      stageCtx.globalAlpha=1-age/.6;for(let i=0;i<8;i++){stageCtx.fillStyle=R.COLORS[i%4];const x=176+i*87,y=367-Math.sin(i+age*5)*6-age*17;stageCtx.fillRect(x,y,4,4);}stageCtx.globalAlpha=1;
    }
    if((hit&&age>=0&&age<.6)||state.phase==='complete'){
      // The front row joins the music with small clapping hands.
      stageCtx.fillStyle='#e5a26c';for(let i=0;i<7;i++){const x=245+i*75;stageCtx.fillRect(x-12,411,4,5);stageCtx.fillRect(x+8,411,4,5);}
    }
  }
  function events(){
    for(const event of state.events.splice(0))if(event.type==='complete'){saveRecord();callbacks.sound?.('victory');}
  }
  function render(){
    if(!state||!opened)return;
    const report=R.snapshot(state);text('theater-score',state.score.toLocaleString('es-MX'));text('theater-record',Math.max(record[state.mode],state.highScore).toLocaleString('es-MX'));
    text('theater-combo',state.combo);text('theater-accuracy',report.hits+state.misses?report.accuracy+'%':'—');
    text('theater-time',timeLabel(state.elapsed)+' / '+timeLabel(state.duration));$('theater-progress').value=state.elapsed;$('theater-progress').max=state.duration;
    const stage=state.phase,menu=['intro','paused','complete','audioerror'].includes(stage);
    dialog.dataset.phase=stage;dialog.classList.toggle('theater-compact',!['intro','audioerror'].includes(stage));
    $('theater-overlay').hidden=!menu;$('theater-mode-row').hidden=!['intro','complete','audioerror'].includes(stage);$('theater-offset-row').hidden=!menu;
    $('theater-play').hidden=!menu;$('theater-pause').disabled=!['playing','paused'].includes(stage);text('theater-pause',stage==='paused'?'▶ Continuar':'Ⅱ Pausa');
    text('theater-mode-info',R.MODES[state.mode].label+' · '+state.notes.length+' flechas · canción completa');
    if(stage==='intro'){text('theater-overlay-title','¡La escuela hace música!');text('theater-overlay-copy','¿Quieres ensayar una canción en el teatro con el maestro Ángel? Tú cantas con tus compañeros y él toca la guitarra. Los profes y el director vienen a escucharlos.');text('theater-play','Enter / A · Sí, ensayar');}
    else if(stage==='paused'){text('theater-overlay-title','Ensayo en pausa');text('theater-overlay-copy','La canción y las flechas te esperan. Elige continuar o volver a la explanada.');text('theater-play','Enter / A · Continuar ensayo');}
    else if(stage==='complete'){text('theater-overlay-title','¡Bravo, '+(callbacks.player?.name||'artista')+'!');text('theater-overlay-copy','Ensayaron toda la canción. '+report.hits+' de '+report.notes+' flechas · '+report.accuracy+'% de precisión · mejor racha: '+report.bestCombo+'. ¡El director José Guadalupe y toda la escuela los aplauden!');text('theater-play','Enter / A · Ensayar otra vez');}
    else if(stage==='audioerror'){text('theater-overlay-title','La canción no se pudo cargar');text('theater-overlay-copy','Vuelve a intentarlo o actualiza el juego con el paquete completo. También puedes regresar a la explanada.');text('theater-play','Enter / A · Volver a intentar');}
    text('theater-now',stage==='playing'?(buffering?'Cargando la canción…':'Pulsa la flecha cuando coincida con la de arriba'):stage==='complete'?'¡Canción completa!':stage==='paused'?'Música y flechas detenidas':'Flechas para elegir · Enter para confirmar');
    drawScene();R.draw(state,laneCtx,{reducedMotion});
    if(uiPhase!==stage){uiPhase=stage;if(menu)K.focus($('theater-play'));else{dialog.scrollTop=0;K.clear();laneCanvas.focus({preventScroll:true});}}
  }
  function setEnabled(value){enabled=!!value;audio.muted=!enabled;const button=$('theater-sound');button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Silenciar ensayo':'Activar sonido del ensayo');button.textContent=enabled?'♫':'♪';}
  function open(options={}){
    if(opened)return;callbacks=options;readRecord();resetState();cast=buildCast();heldKeys.clear();padHeld.fill(false);menuDirection=0;menuAt=0;buffering=false;
    audio.src=window.SchoolAssets?.url(song.audioPath)||song.audioPath;audio.loop=false;audio.playbackRate=1;setEnabled(options.enabled!==false);
    text('theater-player',(options.player?.name||'Alumno')+' · '+(options.group||'3.º A'));$('theater-mode').value=record.mode;$('theater-offset').value=String(record.offsetMs);
    opened=true;dialog.showModal();render();
  }
  function close(){
    if(!opened)return;const report=R.snapshot(state);saveRecord();opened=false;playEpoch++;audio.pause();heldKeys.clear();padHeld.fill(false);
    if(dialog.open)dialog.close();callbacks.onClose?.(report);
  }
  function playAudio(){
    const epoch=++playEpoch;buffering=false;
    try{Promise.resolve(audio.play()).catch(()=>{if(epoch===playEpoch&&opened&&state.phase==='playing')failAudio();});}catch(_){failAudio();}
  }
  function begin(){
    if(!opened)return;
    if(state.phase==='paused'){R.pause(state);heldKeys.clear();playAudio();render();return;}
    if(!['intro','complete','audioerror'].includes(state.phase))return;
    saveRecord();resetState(record.mode);audio.pause();audio.currentTime=0;R.start(state);heldKeys.clear();callbacks.sound?.('start');playAudio();events();render();
  }
  function togglePause(){
    if(!opened)return;if(['intro','complete','audioerror'].includes(state.phase)){begin();return;}
    if(state.phase==='paused'){begin();return;}
    if(state.phase==='playing'){R.advance(state,audio.currentTime);audio.pause();playEpoch++;R.pause(state);heldKeys.clear();padHeld.fill(false);saveRecord();render();}
  }
  function failAudio(){if(!opened||state.phase==='complete')return;playEpoch++;audio.pause();state.phase='audioerror';buffering=false;render();}
  function hit(lane){if(!opened||state.phase!=='playing'||audio.paused||buffering)return;R.hit(state,lane,audio.currentTime);events();render();}
  function key(event){
    if(!opened||event.altKey||event.ctrlKey||event.metaKey)return false;const key=event.key.toLowerCase();
    if(key==='escape'){if(!event.repeat)close();return true;}
    if(key==='p'){if(!event.repeat)togglePause();return true;}
    if(state.phase!=='playing')return K.key(event,dialog,{filter:node=>!node.hasAttribute('data-theater-direction'),defaultTarget:$('theater-play')});
    if(Object.hasOwn(directions,key)){if(!event.repeat&&!heldKeys.has(key)){heldKeys.add(key);hit(directions[key]);}return true;}
    if(key==='enter'||key===' '){if(!event.repeat){const active=document.activeElement;if([$('theater-close'),$('theater-pause'),$('theater-sound')].includes(active))active.click();else togglePause();}return true;}
    return false;
  }
  function pad({x=0,y=0,confirm=false,pause=false,back=false,timestamp=performance.now()}={}){
    if(!opened)return;if(back){close();return;}
    const down=[x<-.45,y>.45,y<-.45,x>.45];
    if(state.phase==='playing'){
      if(confirm||pause)togglePause();else down.forEach((pressed,lane)=>{if(pressed&&!padHeld[lane])hit(lane);});
    }else{
      const direction=y<-.55||x<-.55?-1:y>.55||x>.55?1:0;
      if(direction&&(direction!==menuDirection||timestamp>=menuAt)){K.move(dialog,direction,{filter:node=>!node.hasAttribute('data-theater-direction')});menuAt=timestamp+(direction===menuDirection?180:350);}
      menuDirection=direction;
      if(confirm)K.key({key:'Enter',repeat:false},dialog,{filter:node=>!node.hasAttribute('data-theater-direction'),defaultTarget:$('theater-play')});else if(pause)togglePause();
    }
    padHeld=down;
  }
  function tick(){if(!opened)return;if(state.phase==='playing'&&!audio.paused&&!buffering)R.advance(state,audio.currentTime);events();render();}
  function suspend(){if(opened&&state.phase==='playing')togglePause();heldKeys.clear();padHeld.fill(false);}
  function snapshot(){return opened?{...R.snapshot(state),roster:{choir:cast.choir.map(actor=>actor.id),audience:cast.audience.map(actor=>actor.id),staff:cast.staff.map(actor=>actor.id),guitarist:'angel'}}:null;}
  $('theater-play').addEventListener('click',begin);$('theater-close').addEventListener('click',close);$('theater-pause').addEventListener('click',togglePause);
  $('theater-sound').addEventListener('click',()=>{setEnabled(!enabled);callbacks.onSoundChange?.(enabled);});
  $('theater-mode').addEventListener('change',()=>{if(!['intro','complete','audioerror'].includes(state.phase))return;saveRecord();record.mode=R.MODES[$('theater-mode').value]?$('theater-mode').value:'easy';resetState();saveRecord();render();});
  $('theater-offset').addEventListener('change',()=>{state.offsetMs=Number($('theater-offset').value)||0;record.offsetMs=state.offsetMs;saveRecord();render();});
  for(const button of dialog.querySelectorAll('[data-theater-direction]')){
    button.addEventListener('pointerdown',event=>{event.preventDefault();hit(Number(button.dataset.theaterDirection));});
    button.addEventListener('click',event=>{if(event.detail===0)hit(Number(button.dataset.theaterDirection));});
  }
  window.addEventListener('keyup',event=>heldKeys.delete(event.key.toLowerCase()));
  audio.addEventListener('durationchange',()=>{if(opened&&Number.isFinite(audio.duration)&&audio.duration>song.beats.at(-1)+.3)state.duration=audio.duration;});
  audio.addEventListener('waiting',()=>{if(opened){buffering=true;render();}});audio.addEventListener('playing',()=>{buffering=false;});
  audio.addEventListener('error',failAudio);
  audio.addEventListener('ended',()=>{if(opened&&state.phase==='playing'){R.advance(state,audio.currentTime);R.finish(state);events();render();}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(opened)close();});
  window.TheaterRehearsal={open,close,begin,togglePause,key,pad,tick,suspend,setEnabled,snapshot,isOpen:()=>opened,destroy(){if(opened)close();playEpoch++;audio.pause();audio.removeAttribute?.('src');audio.load?.();}};
})();
