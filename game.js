(function () {
  'use strict';
  const G=window.SchoolGame;
  const $=id=>document.getElementById(id);
  const canvas=$('world'), ctx=canvas.getContext('2d',{alpha:false});
  let state=G.createState(), loaded=false, width=innerWidth, height=innerHeight, scale=1, lastTime=0;
  let camera={x:1034,y:1080}, mapOpen=false, toastTimer=0, animationHandle=0;
  const held=new Set(), touch=new Map(), images={};
  const quizDialog=$('quiz-dialog'), mapDialog=$('map-dialog'), victoryDialog=$('victory-dialog');
  const welcomeDialog=$('welcome-dialog'), trompoDialog=$('trompo-dialog');
  const uniformDialog=$('uniform-dialog');
  const trompoCanvas=$('trompo-canvas'), topCtx=trompoCanvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const music=new window.SchoolAudio.Player();
  let soundOn=true, currentFeedback='', windowActive=true;
  let gamepadButtons=[],gamepadIndex=null,menuDirection=0,menuRepeatAt=0,selectedAnswer=0,questionKey='';
  try {soundOn=localStorage.getItem('insurgentes-sound')!=='no';} catch (_) {}
  music.setEnabled(soundOn);
  const spriteRows={down:0,left:1,right:2,up:3};
  const eventParticles=[];
  let lastDayCheck=-Infinity;
  function resize() {
    width=canvas.clientWidth||innerWidth; height=canvas.clientHeight||innerHeight;
    const pixelRatio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*pixelRatio); canvas.height=Math.round(height*pixelRatio);
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    scale=Math.max(.88,Math.min(1.8,width/730));
    ctx.imageSmoothingEnabled=false;
    snapCamera();
  }
  function clampCamera(x,y) {
    const world=G.WORLD[state.scene];
    const halfW=width/scale/2,halfH=height/scale/2;
    return {x:world.width<halfW*2?world.width/2:Math.max(halfW,Math.min(world.width-halfW,x)),y:world.height<halfH*2?world.height/2:Math.max(halfH,Math.min(world.height-halfH,y))};
  }
  function snapCamera(){camera=clampCamera(state.player.x,state.player.y-70);}
  function playTone(kind) {music.effect(kind);}
  async function activateSound(effect) {
    if(!soundOn)return;
    music.setPaused(false);
    const ready=await music.activate();
    if(ready&&effect)playTone(effect);
    updateSoundButton();
  }
  function setSound(enabled) {
    soundOn=enabled;music.setEnabled(enabled);
    try{localStorage.setItem('insurgentes-sound',enabled?'yes':'no');}catch(_){}
    updateSoundButton();if(enabled)void activateSound();
  }
  function syncMusic() {
    const scene=state.phase==='uniform'&&state.uniformReturnPhase==='welcome'?'welcome':state.phase;
    music.setScene(['title','welcome','trompo'].includes(scene)?scene:state.scene);
    music.setPaused(document.hidden||!windowActive);
    music.update();
  }
  function updateSoundButton() {
    $('sound-button').setAttribute('aria-pressed',String(soundOn));
    $('sound-button').setAttribute('aria-label',soundOn?'Silenciar sonido':'Activar sonido');
    $('sound-button').title=soundOn?'Silenciar sonido':'Activar sonido';
    $('sound-button').textContent=soundOn?'♫':'♪';
    $('title-music').setAttribute('aria-pressed',String(soundOn&&music.ready));
    $('title-music').textContent=soundOn&&music.ready?'♫ Silenciar música':'♪ Escuchar música';
  }
  function showToast(message) {
    $('toast').textContent=message;$('toast').classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);
  }
  function clearInput() {
    held.clear();touch.clear();
    document.querySelectorAll('[data-direction]').forEach(b=>b.classList.remove('pressed'));
    state.player.walking=false;
  }
  function enableWorldControls(enabled) {
    for(const id of ['world','hud','touch-controls'])$(id).inert=!enabled;
  }
  function flashTransition() {
    clearInput();snapCamera();$('fade').classList.add('flash');
    setTimeout(()=>$('fade').classList.remove('flash'),150);
  }
  function startGame() {
    if(!loaded) return {error:'El terreno sigue cargando.'};
    if(!G.start(state))return G.snapshot(state);
    $('start-screen').hidden=true;clearInput();
    $('director-message').textContent=G.WELCOME_TEXT;
    welcomeDialog.showModal();$('welcome-continue').focus({preventScroll:true});
    syncMusic();
    void activateSound('start');
    syncUI();return G.snapshot(state);
  }
  function finishWelcome() {
    if(!G.finishWelcome(state))return null;
    welcomeDialog.close();enableWorldControls(true);clearInput();canvas.focus({preventScroll:true});
    syncMusic();syncUI();
    showToast('Juegas como '+state.player.name+'. Entra por el portón azul con E o A.');
    return G.snapshot(state);
  }
  function showUniformGuide() {
    if(mapOpen)closeMap();
    if(!G.openUniformGuide(state))return false;
    drainEvents();syncUI();syncMusic();return true;
  }
  function closeUniformGuide() {
    if(!G.closeUniformGuide(state))return false;
    drainEvents();syncUI();syncMusic();return true;
  }
  function closeTrompo() {
    G.leaveTrompo(state);drainEvents();clearInput();syncUI();canvas.focus({preventScroll:true});
  }
  function restart() {
    if(victoryDialog.open) victoryDialog.close();
    if(quizDialog.open) quizDialog.close();
    if(mapDialog.open) mapDialog.close();
    if(welcomeDialog.open)welcomeDialog.close();
    if(trompoDialog.open)trompoDialog.close();
    if(uniformDialog.open)uniformDialog.close();
    mapOpen=false;state=G.createState();G.start(state);G.finishWelcome(state);enableWorldControls(true);clearInput();snapCamera();syncMusic();syncUI();
    showToast('Ahora juegas como '+state.player.name+'. ¡Vamos por las tres estrellas!');
  }
  function particles() {
    if(media.matches)return;
    for(let i=0;i<22;i++)eventParticles.push({x:state.player.x,y:state.player.y-30,vx:(Math.random()-.5)*170,vy:-60-Math.random()*130,life:1.1,color:i%2?'#ffdd7e':'#9edbaf'});
  }
  function drainEvents() {
    const events=state.events.splice(0);
    for(const event of events) {
      if(event.type==='transition')flashTransition();
      if(event.type==='quiz'){clearInput();renderQuestion();if(!quizDialog.open)quizDialog.showModal();}
      if(event.type==='star'){
        if(quizDialog.open)quizDialog.close();
        showToast('¡Una estrella de '+G.STATIONS[event.station].subject.toLowerCase()+' para ti!');particles();playTone('star');
      }
      if(event.type==='victory'){
        $('final-score').textContent=state.points+' puntos · '+state.goals+' '+(state.goals===1?'gol':'goles');
        victoryDialog.showModal();clearInput();playTone('victory');
      }
      if(event.type==='goal'){showToast(event.text);particles();playTone('goal');}
      if(event.type==='toast')showToast(event.text);
      if(['correct','try','kick'].includes(event.type))playTone(event.type);
      if(event.type==='trompo-open'){
        clearInput();renderTrompo();if(!trompoDialog.open)trompoDialog.showModal();
        $('trompo-action').focus({preventScroll:true});
      }
      if(event.type==='trompo-close'){if(trompoDialog.open)trompoDialog.close();clearInput();canvas.focus({preventScroll:true});}
      if(event.type==='trompo-throw')playTone('throw');
      if(event.type==='trompo-win')playTone('correct');
      if(event.type==='uniform-open'){
        clearInput();enableWorldControls(false);
        $('uniform-return').textContent=state.uniformReturnPhase==='welcome'?'A · Volver con el director':'A · Seguir explorando';
        $('uniform-today').textContent=(state.dayMode==='auto'?'Hoy: ':'Día elegido: ')+G.UNIFORM_DAYS[state.schoolDay].name+'. '+G.UNIFORM_DAYS[state.schoolDay].description;
        if(!uniformDialog.open)uniformDialog.showModal();
        uniformDialog.scrollTop=0;$('uniform-return').focus({preventScroll:true});
      }
      if(event.type==='uniform-close'){
        if(uniformDialog.open)uniformDialog.close();clearInput();
        enableWorldControls(state.phase==='play');
        if(state.phase==='welcome')$('welcome-uniform').focus({preventScroll:true});else canvas.focus({preventScroll:true});
      }
    }
  }
  function interact() {
    if(state.phase==='title')return startGame();
    if(state.phase==='welcome')return finishWelcome();
    if(state.phase==='uniform')return closeUniformGuide();
    if(mapOpen)return null;
    if(state.quiz){if(state.quiz.correct)nextQuestion();return null;}
    const action=G.interact(state);drainEvents();syncUI();return action;
  }
  function drawTop(owner,x,y,energy,angle,age) {
    const frame=energy<=10?3:media.matches?0:Math.floor(angle*3)%3;
    const [sx,sy,sw,sh,ax,ay]=G.TOP_FRAMES[owner][frame],factor=42/G.TOP_FRAMES[owner][0][3];
    const lift=age&&age<.5?Math.sin(age/.5*Math.PI)*22:0;
    topCtx.fillStyle='#173d3940';topCtx.beginPath();topCtx.ellipse(x,y,12,4,0,0,Math.PI*2);topCtx.fill();
    topCtx.drawImage(images.tops,sx,sy,sw,sh,x-ax*factor,y-ay*factor-lift,sw*factor,sh*factor);
  }
  function drawTrompoActors() {
    const playerColumn=G.studentUniformColumn(state.player,state.schoolDay);
    const [px,py,pw,ph,pax,pay]=G.STUDENT_FRAMES[2][playerColumn],playerFactor=64/G.STUDENT_FRAMES[0][playerColumn][3];
    topCtx.drawImage(images.students,px,py,pw,ph,184-pax*playerFactor,246-pay*playerFactor,pw*playerFactor,ph*playerFactor);
    const oliver=state.classmates.find(actor=>actor.id==='oliver'),column=G.studentUniformColumn(oliver,state.schoolDay);
    const [sx,sy,sw,sh,ax,ay]=G.STUDENT_FRAMES[1][column],factor=54/G.STUDENT_FRAMES[0][column][3];
    topCtx.drawImage(images.students,sx,sy,sw,sh,538-ax*factor,246-ay*factor,sw*factor,sh*factor);
    topCtx.font='bold 18px Trebuchet MS';topCtx.textAlign='center';topCtx.textBaseline='middle';
    for(const [name,x] of [[state.player.name+' (tú)',184],['Oliver',538]]){
      const labelWidth=Math.max(76,topCtx.measureText(name).width+18);
      topCtx.fillStyle='#fff4dfed';topCtx.fillRect(x-labelWidth/2,250,labelWidth,25);
      topCtx.fillStyle='#234a3b';topCtx.fillText(name,x,263);
    }
  }
  function renderTrompo() {
    const game=state.trompo;if(!game||!loaded)return;
    $('trompo-round').textContent='Ronda '+game.round+' de 3';
    $('trompo-score').textContent='Tú '+game.wins+' · Oliver '+game.oliverWins;
    if($('trompo-message').textContent!==game.message)$('trompo-message').textContent=game.message;
    $('trompo-meter').style.visibility=game.stage==='aim'?'visible':'hidden';
    $('trompo-needle').style.left=(game.power*100)+'%';
    $('trompo-action').disabled=game.stage==='spin';
    $('trompo-action').textContent=game.stage==='aim'?'A · Lanzar trompo':game.stage==='spin'?'Girando…':game.stage==='complete'?'A · Volver al patio':game.round===3?'A · Ver resultado':'A · Siguiente ronda';
    topCtx.imageSmoothingEnabled=false;
    topCtx.drawImage(images.map,327,699,630,194,0,0,720,280);
    topCtx.strokeStyle='#fff2c3';topCtx.lineWidth=4;topCtx.beginPath();topCtx.ellipse(360,142,98,89,0,0,Math.PI*2);topCtx.stroke();
    topCtx.strokeStyle='#bd852dc0';topCtx.lineWidth=2;topCtx.beginPath();topCtx.ellipse(360,142,101,92,0,0,Math.PI*2);topCtx.stroke();
    if(game.tops.length)for(const top of game.tops)drawTop(top.owner,top.x,top.y,top.energy,top.angle,top.age);
    else{drawTop('red',290,185,60,0,0);drawTop('blue',430,185,60,0,0);}
    drawTrompoActors();
  }
  function renderQuestion() {
    const quiz=state.quiz;if(!quiz)return;
    const questionId=quiz.station+':'+quiz.index;
    if(questionKey!==questionId){questionKey=questionId;selectedAnswer=0;}
    const station=G.STATIONS[quiz.station], question=G.QUESTIONS[quiz.station][quiz.index];
    $('quiz-title').textContent=station.name;
    $('quiz-subject').textContent='ESTRELLA DE '+station.subject.toUpperCase();
    $('quiz-progress').textContent=(quiz.index+1)+' de 2';
    $('question').textContent=question.text;
    $('passage').hidden=!question.passage;$('passage').textContent=question.passage||'';
    $('feedback').textContent=quiz.feedback;$('feedback').className=quiz.correct?'good':'';
    $('next-question').hidden=!quiz.correct;
    $('next-question').textContent=quiz.index===1?'Recoger mi estrella':'Siguiente pregunta';
    $('answers').replaceChildren();
    question.options.forEach((option,index)=>{
      const button=document.createElement('button'), key=document.createElement('span'), label=document.createElement('b');
      button.type='button';key.textContent=String(index+1);label.textContent=option;
      button.append(key,label);button.disabled=quiz.correct;
      if(index===selectedAnswer&&!quiz.correct)button.classList.add('controller-choice');
      if(quiz.correct&&index===question.answer)button.classList.add('correct');
      button.addEventListener('click',()=>submitAnswer(index));$('answers').append(button);
    });
    currentFeedback=quiz.feedback;
    if(quiz.correct)$('next-question').focus({preventScroll:true});
    else $('answers').firstElementChild?.focus({preventScroll:true});
  }
  function submitAnswer(index) {
    if(!state.quiz||state.quiz.correct)return false;
    selectedAnswer=index;
    const correct=G.answer(state,index);drainEvents();renderQuestion();
    if(!correct){const button=$('answers').children[index];if(button)button.classList.add('wrong');}
    syncUI();return correct;
  }
  function nextQuestion() {
    G.nextQuestion(state);drainEvents();
    if(state.quiz)renderQuestion();else if(!victoryDialog.open)canvas.focus({preventScroll:true});
    syncUI();
  }
  function openMap() {
    if(!loaded||state.phase!=='play'||state.quiz)return;
    mapOpen=true;clearInput();
    const p=state.scene==='classroom'?G.CLASSROOM_DOOR:state.player;
    $('map-player').style.left=(p.x/1215*100)+'%';$('map-player').style.top=(p.y/1295*100)+'%';
    if(!mapDialog.open)mapDialog.showModal();
  }
  function closeMap(){mapDialog.close();mapOpen=false;clearInput();canvas.focus({preventScroll:true});}
  function syncUI() {
    $('player-name').textContent=state.player.name+' · 3.º A';
    $('player-name').title='Juegas como '+state.player.name;
    $('objective').textContent=G.objective(state);
    $('stars').textContent='★'.repeat(Object.values(state.completed).filter(Boolean).length)+'☆'.repeat(3-Object.values(state.completed).filter(Boolean).length);
    $('points').textContent=state.points+' puntos';
    const p=state.player;
    $('location-tag').textContent=state.scene==='classroom'?'Salón 3.º A':p.y>1150?'Entrada · Los Insurgentes':p.y<520?'Cancha de fútbol':p.y>960?'Fuente y mural':'Patio de la escuela';
    const target=G.nearby(state);
    $('interaction').hidden=!target||state.phase!=='play'||!!state.quiz||mapOpen;
    $('interaction-label').textContent=target?.label||'';
    $('action-button').setAttribute('aria-label',target?.label||'Interactuar');
    const uniform=G.UNIFORM_DAYS[state.schoolDay];
    $('school-day').value=state.dayMode==='auto'?'auto':String(state.schoolDay);
    $('uniform-summary').textContent=uniform.name+' · '+uniform.uniform+'. '+uniform.description;
    if(state.trompo)renderTrompo();
  }
  function drawStar(x,y,color,size=12) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.strokeStyle='#173d3a';ctx.lineWidth=2;
    ctx.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?size*.45:size;const px=Math.cos(angle)*r,py=Math.sin(angle)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function marker(x,y,label,complete,time) {
    const bob=media.matches?0:Math.sin(time*2.5)*3;
    ctx.save();ctx.translate(x,y-44+bob);
    ctx.fillStyle='#17473be8';ctx.strokeStyle=complete?'#9ee8b5':'#ffe09a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(-20,-23,40,36,9);ctx.fill();ctx.stroke();
    drawStar(0,-6,complete?'#a3e1af':'#ffcf65',12);
    ctx.fillStyle='#fff4d4';ctx.font='bold 12px Trebuchet MS';ctx.textAlign='center';
    ctx.shadowColor='#092b27';ctx.shadowBlur=3;ctx.fillText(label,0,28);ctx.restore();
  }
  function drawStudentSprite(context,student,unitHeight) {
    const column=G.studentUniformColumn(student,state.schoolDay);
    const [sx,sy,sw,sh,ax,ay]=G.STUDENT_FRAMES[spriteRows[student.facing]][column];
    const factor=unitHeight/G.STUDENT_FRAMES[0][column][3],x=student.x-ax*factor,y=student.y-ay*factor;
    if(!student.walking){context.drawImage(images.students,sx,sy,sw,sh,x,y,sw*factor,sh*factor);return;}
    // Animate the two legs separately; keep the head and uniform body anchored.
    // The skirt stays intact while only the socks and shoes step underneath it.
    const skirt=student.style==='girl'&&(column===1||column===3);
    const cut=Math.round(sh*(skirt ? .84 : .72)),overlap=4,split=Math.round(ax);
    const wave=Math.sin(student.time*13),sideView=student.facing==='left'||student.facing==='right';
    const stride=(sideView?3.5:.7)*unitHeight/45,lift=2.5*unitHeight/45;
    for(const [start,w,side] of [[0,split,-1],[split,sw-split,1]]){
      const step=side*wave,lowerY=cut-overlap,lowerH=sh-lowerY;
      context.drawImage(images.students,sx+start,sy+lowerY,w,lowerH,
        x+start*factor+step*stride,y+lowerY*factor-Math.max(0,step)*lift,
        w*factor,lowerH*factor+(sideView?0:step*lift*.55));
    }
    context.drawImage(images.students,sx,sy,sw,cut,x,y,sw*factor,cut*factor);
  }
  function drawPlayer() {
    const p=state.player;
    ctx.save();ctx.fillStyle='#142f2945';ctx.beginPath();ctx.ellipse(p.x,p.y-1,12,4.2,0,0,Math.PI*2);ctx.fill();
    drawStudentSprite(ctx,p,45);ctx.restore();
  }
  function placeOliverInvitation() {
    const bubble=$('oliver-invitation'),oliver=state.classmates.find(actor=>actor.id==='oliver');
    const nearby=oliver&&Math.hypot(oliver.x-state.player.x,oliver.y-state.player.y)<180;
    bubble.hidden=!nearby||state.scene!=='outside'||state.phase!=='play'||!!state.quiz||mapOpen;
    if(bubble.hidden)return;
    const x=width/2+(oliver.x-camera.x)*scale,y=height/2+(oliver.y-camera.y-48)*scale;
    if(x<0||x>width||y<150||y>height-100){bubble.hidden=true;return;}
    bubble.style.left=Math.max(126,Math.min(width-126,x))+'px';
    bubble.style.top=y+'px';
  }
  function drawClassmate(student) {
    ctx.save();ctx.fillStyle='#142f293b';ctx.beginPath();ctx.ellipse(student.x,student.y-1,8,3,0,0,Math.PI*2);ctx.fill();
    drawStudentSprite(ctx,student,36);ctx.restore();
  }
  function drawTeacher(teacher) {
    const [sx,sy,sw,sh,ax,ay]=teacher.frames[spriteRows[teacher.facing]],factor=53/teacher.frames[0][3];
    ctx.save();ctx.fillStyle='#142f2945';ctx.beginPath();ctx.ellipse(teacher.x,teacher.y-1,12,4,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(images[teacher.assetKey],sx,sy,sw,sh,teacher.x-ax*factor,teacher.y-ay*factor,sw*factor,sh*factor);ctx.restore();
  }
  function teacherLabel(teacher){return teacher.name+(teacher.group?' · '+teacher.group:'');}
  function drawActorNames(classmates,teachers) {
    const range=state.scene==='outside'?145:80,limit=state.scene==='outside'?4:1;
    const distance=actor=>Math.hypot(actor.x-state.player.x,actor.y-state.player.y);
    const nearby=classmates.map(actor=>({actor,distance:distance(actor)})).filter(entry=>entry.distance<range).sort((a,b)=>a.distance-b.distance).slice(0,limit).map(entry=>entry.actor);
    nearby.push(...teachers.filter(teacher=>distance(teacher)<145).map(teacher=>({...teacher,name:teacherLabel(teacher)})));
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold '+Math.max(10,14/scale)+'px Trebuchet MS';
    const placed=[];
    for(const actor of nearby){
      const w=ctx.measureText(actor.name).width+12,h=Math.max(16,22/scale);
      const x=actor.x-w/2;let y=actor.y+4;
      // Keep names legible when several students and staff are close together.
      while(placed.some(box=>x<box.x+box.w+3&&x+w+3>box.x&&y<box.y+box.h+3&&y+h+3>box.y))y+=h+3;
      placed.push({x,y,w,h});
      ctx.fillStyle='#fff4dbea';ctx.strokeStyle='#31594bc0';ctx.lineWidth=1;
      if(y>actor.y+4){ctx.beginPath();ctx.moveTo(actor.x,actor.y+2);ctx.lineTo(actor.x,y);ctx.stroke();}
      ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.fill();ctx.stroke();
      ctx.fillStyle='#264b40';ctx.fillText(actor.name,actor.x,y+h/2);
    }
    ctx.restore();
  }
  function drawMapLabels() {
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 14px Trebuchet MS';
    for(const label of G.MAP_LABELS){
      const lines=label.text.split('\n');
      const boxWidth=Math.max(...lines.map(line=>ctx.measureText(line).width))+14;
      const boxHeight=lines.length*17+10;
      ctx.fillStyle='#fff3dbe8';ctx.strokeStyle='#31594bc0';ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(label.x-boxWidth/2,label.y-boxHeight/2,boxWidth,boxHeight,5);ctx.fill();ctx.stroke();
      ctx.fillStyle='#264b40';
      lines.forEach((line,index)=>ctx.fillText(line,label.x,label.y+(index-(lines.length-1)/2)*17));
    }
    ctx.restore();
  }
  function drawFrame(time,dt) {
    ctx.fillStyle='#13382e';ctx.fillRect(0,0,width,height);
    if(!loaded)return;
    const target=clampCamera(state.player.x,state.player.y-70),blend=media.matches?1:1-Math.exp(-9*dt);
    camera.x+=(target.x-camera.x)*blend;camera.y+=(target.y-camera.y)*blend;
    placeOliverInvitation();
    ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.translate(-camera.x,-camera.y);
    ctx.imageSmoothingEnabled=false;
    const world=G.WORLD[state.scene];ctx.drawImage(state.scene==='outside'?images.map:images.room,0,0,world.width,world.height);
    if(state.scene==='outside'){
      drawMapLabels();
      marker(998,1016,'Sumas',state.completed.fountain,time);
      marker(G.CLASSROOM_DOOR.x,G.CLASSROOM_DOOR.y-2,'3.º A',state.completed.classroom,time);
      marker(643,413,'Números',state.completed.field,time);
      const b=state.ball;ctx.save();ctx.font='25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#153b3140';ctx.beginPath();ctx.ellipse(b.x,b.y+7,11,4,0,0,Math.PI*2);ctx.fill();ctx.fillText('⚽',b.x,b.y);ctx.restore();
    }else{
      marker(640,166,'Lectura',state.completed.classroom,time);
      ctx.save();ctx.font='bold 17px Trebuchet MS';ctx.fillStyle='#28554d';ctx.textAlign='center';ctx.fillText('3.º A · El cuaderno de Lucía',640,85);ctx.restore();
    }
    const classmates=G.classmatesInScene(state),teachers=G.teachersInScene(state);
    const actors=[...classmates.map(student=>({student,y:student.y})),...teachers.map(teacher=>({teacher,y:teacher.y})),{player:true,y:state.player.y}].sort((a,b)=>a.y-b.y);
    for(const actor of actors){if(actor.student)drawClassmate(actor.student);else if(actor.teacher)drawTeacher(actor.teacher);else drawPlayer();}
    drawActorNames(classmates,teachers);
    for(let i=eventParticles.length-1;i>=0;i--){
      const e=eventParticles[i];e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=150*dt;
      if(e.life<=0){eventParticles.splice(i,1);continue;}
      ctx.globalAlpha=Math.min(1,e.life*2);ctx.fillStyle=e.color;ctx.fillRect(e.x,e.y,4,4);
    }
    ctx.restore();
  }
  function chooseAnswer(direction) {
    if(!state.quiz||state.quiz.correct)return;
    selectedAnswer=(selectedAnswer+direction+3)%3;
    Array.from($('answers').children).forEach((button,index)=>{
      if(index===selectedAnswer){button.classList.add('controller-choice');button.focus({preventScroll:true});}
      else button.classList.remove('controller-choice');
    });
  }
  function controllerInput(timestamp) {
    let pad=null;
    try{pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.connected!==false);}catch(_){}
    if(!pad){gamepadButtons=[];gamepadIndex=null;menuDirection=0;return {x:0,y:0,run:false};}
    if(gamepadIndex!==pad.index){gamepadButtons=[];gamepadIndex=pad.index;}
    const pressed=Array.from(pad.buttons,button=>typeof button==='number'?button>.5:!!button?.pressed||button?.value>.5);
    const edge=index=>!!pressed[index]&&!gamepadButtons[index];
    let x=Number(pad.axes[0])||0,y=Number(pad.axes[1])||0;
    const magnitude=Math.hypot(x,y),deadzone=.22;
    if(magnitude<=deadzone)x=y=0;
    else{const factor=(Math.min(1,magnitude)-deadzone)/(1-deadzone)/magnitude;x*=factor;y*=factor;}
    if(pressed[14]||pressed[15])x=(pressed[15]?1:0)-(pressed[14]?1:0);
    if(pressed[12]||pressed[13])y=(pressed[13]?1:0)-(pressed[12]?1:0);
    if(edge(3))setSound(!(soundOn&&music.ready));
    if(state.phase==='title'){if(edge(0)||edge(9))startGame();}
    else if(state.phase==='welcome'){if(edge(2))showUniformGuide();else if(edge(0)||edge(9))finishWelcome();}
    else if(state.phase==='uniform'){if(edge(0)||edge(1)||edge(2)||edge(9))closeUniformGuide();}
    else if(mapOpen){if(edge(0)||edge(1)||edge(2)||edge(8)||edge(9))closeMap();}
    else if(state.quiz){
      const direction=y<-.55||x<-.55?-1:y>.55||x>.55?1:0;
      if(direction&&(direction!==menuDirection||timestamp>=menuRepeatAt)){chooseAnswer(direction);menuRepeatAt=timestamp+(direction===menuDirection?180:350);}
      menuDirection=direction;
      if(edge(0)){if(state.quiz.correct)nextQuestion();else submitAnswer(selectedAnswer);}
      else if(edge(9)&&state.quiz.correct)nextQuestion();
    }
    else if(state.phase==='trompo'){if(edge(1))closeTrompo();else if(edge(0)||edge(9))interact();}
    else if(state.phase==='victory'){
      if(edge(0)||edge(1)||edge(9)){victoryDialog.close();state.phase='play';clearInput();canvas.focus({preventScroll:true});}
    }
    else if(state.phase==='play'){
      menuDirection=0;
      if(edge(2)||edge(8)||edge(9))openMap();else if(edge(0))interact();
    }
    gamepadButtons=pressed;
    return {x,y,run:!!pressed[1]};
  }
  function inputVector(controller) {
    let x=(held.has('arrowright')||held.has('d')?1:0)-(held.has('arrowleft')||held.has('a')?1:0);
    let y=(held.has('arrowdown')||held.has('s')?1:0)-(held.has('arrowup')||held.has('w')?1:0);
    for(const direction of touch.values()){if(direction==='right')x++;if(direction==='left')x--;if(direction==='down')y++;if(direction==='up')y--;}
    if(controller.x)x=controller.x;if(controller.y)y=controller.y;
    return{x,y,run:held.has('shift')||controller.run};
  }
  function frame(timestamp) {
    const dt=Math.min(.05,lastTime?(timestamp-lastTime)/1000:1/60);lastTime=timestamp;
    if(timestamp-lastDayCheck>30000){G.refreshSchoolDay(state);lastDayCheck=timestamp;}
    if(!document.hidden&&windowActive&&loaded){
      const controller=controllerInput(timestamp);
      if(!mapOpen)G.tick(state,dt,inputVector(controller));
    }
    drainEvents();syncUI();syncMusic();drawFrame(timestamp/1000,dt);animationHandle=requestAnimationFrame(frame);
  }
  $('start-button').addEventListener('click',startGame);
  $('welcome-continue').addEventListener('click',finishWelcome);
  $('welcome-uniform').addEventListener('click',showUniformGuide);
  $('map-uniform').addEventListener('click',showUniformGuide);
  $('uniform-close').addEventListener('click',closeUniformGuide);
  $('uniform-return').addEventListener('click',closeUniformGuide);
  uniformDialog.addEventListener('cancel',event=>{event.preventDefault();closeUniformGuide();});
  welcomeDialog.addEventListener('cancel',event=>event.preventDefault());
  $('title-music').addEventListener('click',()=>setSound(!(soundOn&&music.ready)));
  $('trompo-action').addEventListener('click',interact);
  $('trompo-close').addEventListener('click',closeTrompo);
  trompoDialog.addEventListener('cancel',event=>{event.preventDefault();closeTrompo();});
  $('action-button').addEventListener('click',interact);
  $('next-question').addEventListener('click',nextQuestion);
  $('map-button').addEventListener('click',openMap);
  $('school-day').addEventListener('change',()=>{
    const value=$('school-day').value;G.setSchoolDay(state,value==='auto'?'auto':Number(value));clearInput();syncUI();
  });
  $('close-map').addEventListener('click',closeMap);
  mapDialog.addEventListener('close',()=>{mapOpen=false;clearInput();});
  mapDialog.addEventListener('click',event=>{if(event.target===mapDialog){const r=mapDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeMap();}});
  quizDialog.addEventListener('cancel',event=>{event.preventDefault();showToast('Termina las dos preguntas para recoger tu estrella.');});
  victoryDialog.addEventListener('cancel',event=>{event.preventDefault();victoryDialog.close();state.phase='play';clearInput();});
  $('continue-button').addEventListener('click',()=>{victoryDialog.close();state.phase='play';clearInput();canvas.focus({preventScroll:true});});
  $('restart-button').addEventListener('click',restart);
  $('sound-button').addEventListener('click',()=>setSound(!soundOn));
  for(const button of document.querySelectorAll('[data-direction]')){
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);touch.set(event.pointerId,button.dataset.direction);button.classList.add('pressed');});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,event=>{touch.delete(event.pointerId);button.classList.remove('pressed');});
  }
  window.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    const gameKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','e','m','shift'];
    if(state.phase==='title'){if((key==='enter'||key===' ')&&!event.repeat){event.preventDefault();startGame();}return;}
    if(state.phase==='uniform'){
      if(['enter',' ','a','e','escape','u','x'].includes(key)){event.preventDefault();if(!event.repeat)closeUniformGuide();}return;
    }
    if(state.phase==='welcome'&&['u','x'].includes(key)){event.preventDefault();if(!event.repeat)showUniformGuide();return;}
    if(state.phase==='welcome'||state.phase==='trompo'){
      if(['enter',' ','a','e'].includes(key)){event.preventDefault();if(!event.repeat)interact();}
      if(key==='escape'&&state.phase==='trompo'){event.preventDefault();closeTrompo();}
      return;
    }
    if(mapOpen){if(key==='m'||key==='escape'){event.preventDefault();closeMap();}return;}
    if(state.quiz){
      if(['1','2','3'].includes(key)){event.preventDefault();submitAnswer(Number(key)-1);}
      if((key==='e'||key===' ')&&state.quiz.correct&&!event.repeat){event.preventDefault();nextQuestion();}
      return;
    }
    if(state.phase!=='play')return;
    if(gameKeys.includes(key))event.preventDefault();
    if(key==='m'&&!event.repeat){openMap();return;}
    if((key==='e'||key===' ')&&!event.repeat){interact();return;}
    held.add(key);
  });
  window.addEventListener('keyup',event=>held.delete(event.key.toLowerCase()));
  window.addEventListener('pointerdown',()=>{if(soundOn&&!music.ready)void activateSound();});
  window.addEventListener('blur',()=>{windowActive=false;clearInput();music.setPaused(true);});
  window.addEventListener('focus',()=>{windowActive=true;lastTime=0;syncMusic();});
  document.addEventListener('visibilitychange',()=>{clearInput();lastTime=0;G.refreshSchoolDay(state);syncUI();syncMusic();});
  window.addEventListener('pagehide',()=>{clearInput();music.destroy();cancelAnimationFrame(animationHandle);},{once:true});
  window.addEventListener('resize',resize);
  function loadImage(key,path) {
    return new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>{images[key]=img;resolve();};img.onerror=()=>reject(new Error('No se pudo cargar '+key));img.src=window.INSURGENTES_ASSETS?.[key]||path;
    });
  }
  const teacherAssets=new Map(G.TEACHERS.map(teacher=>[teacher.assetKey,teacher.assetPath]));
  Promise.all([...Object.entries(G.ASSET_PATHS).map(([key,path])=>loadImage(key,path)),...Array.from(teacherAssets,([key,path])=>loadImage(key,path))]).then(()=>{
    loaded=true;$('start-button').disabled=false;$('start-button').textContent='PULSA START PARA JUGAR';$('load-status').textContent='Tu escuela. Tu gran aventura.';
    $('title-school').src=window.INSURGENTES_ASSETS?.introBg||G.ASSET_PATHS.introBg;
    $('welcome-school').src=window.INSURGENTES_ASSETS?.introBg||G.ASSET_PATHS.introBg;
    $('director-portrait').src=window.INSURGENTES_ASSETS?.directorPortrait||G.ASSET_PATHS.directorPortrait;
    $('uniform-director-portrait').src=window.INSURGENTES_ASSETS?.directorPortrait||G.ASSET_PATHS.directorPortrait;
    $('uniform-poster').src=window.INSURGENTES_ASSETS?.uniformGuide||G.ASSET_PATHS.uniformGuide;
    $('start-button').focus({preventScroll:true});resize();
    if(window.INSURGENTES_ASSETS){$('overview-image').src=window.INSURGENTES_ASSETS.map;document.querySelector('.download-link').hidden=true;}
  }).catch(error=>{
    console.error(error);$('start-button').textContent='Intentar de nuevo';$('start-button').disabled=false;$('load-status').textContent='No se pudo cargar el terreno. Revisa tu conexión y vuelve a intentarlo.';
    $('start-button').addEventListener('click',()=>location.reload(),{once:true});
  });
  function installAgentTools(){
    const model=document.modelContext;if(!model?.registerTool)return;
    const lifecycle=new AbortController();
    const tool={name:'read_school_adventure',title:'Leer estado de la aventura',description:'Consulta la posición, estrellas, reto actual y acción cercana del juego de Los Insurgentes.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(input&&Object.keys(input).length)throw new Error('Esta consulta no acepta parámetros.');return G.snapshot(state);}};
    const startTool={name:'start_school_adventure',title:'Pulsar START',description:'Pulsa START en la portada y abre la bienvenida del director. No reinicia una partida en curso.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(input&&Object.keys(input).length)throw new Error('Esta acción no acepta parámetros.');if(state.phase!=='title')throw new Error('La aventura ya está en curso.');return startGame();}};
    for(const item of [tool,startTool]){try{void Promise.resolve(model.registerTool(item,{signal:lifecycle.signal})).catch(error=>console.warn('No se pudo registrar la herramienta del juego',error));}catch(error){console.warn('Herramientas del juego no disponibles',error);}}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
  for(const student of [...G.STUDENTS].sort((a,b)=>a.name.localeCompare(b.name,'es'))){const item=document.createElement('li');item.textContent=student.name;$('class-list').append(item);}
  $('class-roster-title').textContent='3.º A · '+G.STUDENTS.length+' alumnos';
  for(const teacher of G.TEACHERS){const item=document.createElement('li');item.textContent=teacherLabel(teacher);$('teacher-list').append(item);}
  for(const [day,uniform] of Object.entries(G.UNIFORM_DAYS)){
    const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=uniform.name+' · '+uniform.uniform;
    description.textContent=uniform.description+(day==='2'?' También se permite camisa blanca con pantalón o blusa blanca con uniforme de cuadros.':'');
    $('uniform-daily-details').append(term,description);
  }
  enableWorldControls(false);updateSoundButton();resize();installAgentTools();animationHandle=requestAnimationFrame(frame);
})();
