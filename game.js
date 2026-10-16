(function () {
  'use strict';
  const G=window.SchoolGame;
  const keyboard=window.SchoolKeyboard,C=window.SchoolCharacters,P=window.SchoolPlayground,M=window.SchoolMissions,Save=window.SchoolAdventureSave;
  const $=id=>document.getElementById(id);
  const schoolStore=window.SchoolSettings.createStore(G,{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
  window.InsurgentesSchool=schoolStore;
  const canvas=$('world'), ctx=canvas.getContext('2d',{alpha:false});
  let state=G.createState(), loaded=false, width=innerWidth, height=innerHeight, scale=1, lastTime=0;
  const progressStore=Save.createStore(G,C,{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
  const recovered=progressStore.load();if(recovered)Save.restore(G,C,state,recovered);
  let characterConfirmed=!!recovered,lastAutosave=0,saveNotice=false;
  let camera={x:1034,y:1080}, mapOpen=false, toastTimer=0, animationHandle=0;
  const held=new Set(), touch=new Map(), images={};
  const quizDialog=$('quiz-dialog'), mapDialog=$('map-dialog'), victoryDialog=$('victory-dialog');
  const welcomeDialog=$('welcome-dialog'), trompoDialog=$('trompo-dialog');
  const uniformDialog=$('uniform-dialog'),crissDialog=$('criss-dialog');
  const trompoCanvas=$('trompo-canvas'), topCtx=trompoCanvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const audioSources=Object.fromEntries(Object.entries({...window.SchoolAudio.AUDIO_PATHS,...window.INSURGENTES_AUDIO}).map(([key,path])=>[key,window.SchoolAssets?.url(path)||path]));
  const music=new window.SchoolAudio.Player({sources:audioSources});
  let soundOn=true, currentFeedback='', windowActive=true,schoolEditorOpen=false,keyboardRun=false,trompoPaused=false;
  let gamepadButtons=[],gamepadIndex=null,gamepadId='',menuDirection=0,menuRepeatAt=0,selectedAnswer=0,questionKey='';
  const gamepadSamples=new Map();
  let controllerTitleStatus=null,controllerMapStatus=null,controllerStatus='';
  try {soundOn=localStorage.getItem('insurgentes-sound')!=='no';} catch (_) {}
  music.setEnabled(soundOn);
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
    if(!soundOn||document.hidden)return;
    syncMusic();
    const ready=await music.activate();
    syncMusic();if(ready&&effect)playTone(effect);
    updateSoundButton();
  }
  function setSound(enabled) {
    soundOn=enabled;music.setEnabled(enabled);
    window.TheaterRehearsal.setEnabled(enabled);
    try{localStorage.setItem('insurgentes-sound',enabled?'yes':'no');}catch(_){}
    updateSoundButton();if(enabled)void activateSound();
  }
  function syncMusic() {
    const playground=window.PlaygroundGames.isOpen()?window.PlaygroundGames.snapshot():null;
    const mission=window.MissionActivities.isOpen()?window.MissionActivities.snapshot():null,activity=playground||mission;
    const miniMusic=playground?({football:'football',rope:'rope',cleanup:'cleanup'}[playground.type]||null):mission?.type==='drawing'?'cleanup':null;
    music.setMusicPaused(!!(window.PacmanArcade.isOpen()||window.TheaterRehearsal.isOpen()||(miniMusic&&activity.phase!=='playing')));
    const scene=state.phase==='uniform'&&state.uniformReturnPhase==='welcome'?'welcome':state.phase;
    music.setScene(miniMusic||(['title','welcome','trompo'].includes(scene)?scene:state.scene));
    music.setPaused(!!(document.hidden||!windowActive||schoolEditorOpen||trompoPaused||mission?.phase==='paused'||(miniMusic&&activity.phase==='paused')));
    music.update();
  }
  function resumeWorldMusic(){syncMusic();if(soundOn)void activateSound();}
  function updateSoundButton() {
    $('sound-button').setAttribute('aria-pressed',String(soundOn));
    $('sound-button').setAttribute('aria-label',soundOn?'Silenciar sonido':'Activar sonido');
    $('sound-button').title=soundOn?'Silenciar sonido':'Activar sonido';
    $('sound-button').textContent=soundOn?'♫':'♪';
    $('title-music').setAttribute('aria-pressed',String(soundOn&&music.ready));
    $('title-music').textContent=soundOn&&music.ready?'♫ Silenciar música':'♪ Escuchar música';
    $('map-sound').textContent=soundOn?'♫ Sonido activado':'♪ Sonido apagado';
    $('map-sound').setAttribute('aria-pressed',String(soundOn));
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
  function saveProgress(){
    if(!state.started&&!characterConfirmed)return true;
    const result=progressStore.save(state);
    $('adventure-save-status').textContent=progressStore.status()||'Se guarda automáticamente en este navegador.';
    $('adventure-save-status').classList.toggle('save-error',!result);
    if(!result&&!saveNotice){saveNotice=true;showToast(progressStore.status());}
    return result;
  }
  function openCharacters(begin=false){
    if(!loaded||window.CharacterSelect.isOpen())return;
    if(mapOpen)closeMap();clearInput();enableWorldControls(false);
    window.CharacterSelect.open({game:G,images,day:state.schoolDay,playerId:state.player.id,
      onClose(){clearInput();enableWorldControls(state.phase==='play');},
      onPick(id){C.select(G,state,id);characterConfirmed=true;saveProgress();syncUI();if(begin)startGame();else if(state.started)showToast('Ahora juegas como '+state.player.name+'. Tus estrellas se conservan.');}
    });
  }
  function openCrissDialogue(){
    if(!loaded||state.quiz||crissDialog.open||window.PlaygroundGames.isOpen())return;
    const criss=G.TEACHERS.find(actor=>actor.id==='criss').positions.outside;
    if(mapOpen)closeMap();
    if(state.scene!=='outside'||Math.hypot(state.player.x-criss.x,state.player.y-criss.y)>=62){showToast('Busca a Criss a la derecha de la explanada. Acércate y pulsa Enter / A para hablar con ella.');return;}
    clearInput();state.phase='criss-dialogue';enableWorldControls(false);
    $('criss-message').textContent='¡Hola, '+state.player.name+'! ¿Me ayudas a dejar limpia la explanada? Las cáscaras de fruta son orgánicas; las botellas y envolturas de plástico son inorgánicas. Usa los tres botes: Orgánica, Inorgánica: envases e Inorgánica: envolturas. Recoge y separa los nueve residuos en 90 segundos. ¡Hagamos que nuestra escuela brille!';
    const portrait=$('criss-portrait'),context=portrait.getContext('2d');context.clearRect(0,0,portrait.width,portrait.height);C.draw(context,G,images,C.find(G,'criss'),state.schoolDay,100,220,190);
    crissDialog.showModal();keyboard.focus($('criss-accept'),false);syncUI();
  }
  function closeCrissDialogue(){
    if(!crissDialog.open)return;crissDialog.close();state.phase='play';clearInput();enableWorldControls(true);syncUI();syncMusic();canvas.focus({preventScroll:true});
  }
  function acceptCrissDialogue(){
    if(!crissDialog.open)return;state.unlocks.cleanup=true;saveProgress();closeCrissDialogue();syncChallengeList();openPlayground('criss',{autoStart:true});
  }
  function openPlayground(id,options={}){
    if(!loaded||!P.TASKS[id]||window.PlaygroundGames.isOpen()||state.quiz)return;
    if(id==='criss'&&!state.unlocks.cleanup){openCrissDialogue();return;}
    if(mapOpen)closeMap();clearInput();state.phase='playground';enableWorldControls(false);
    window.PlaygroundGames.open({id,game:G,images,day:state.schoolDay,player:state.player,record:state.challenges[id],sound:playTone,autoStart:options.autoStart,isSoundEnabled:()=>soundOn,onSoundChange:setSound,
      onAward(taskId,score){const old=state.challenges[taskId]||{won:false,best:0,wins:0};state.challenges[taskId]={won:true,best:Math.max(old.best,score),wins:old.wins+1};if(!old.won)state.points+=80;saveProgress();particles();},
      onClose(report){music.stopVoices();state.phase='play';clearInput();enableWorldControls(true);resumeWorldMusic();syncUI();saveProgress();syncChallengeList();canvas.focus({preventScroll:true});showToast(report.won?'¡Reto conseguido! Puedes seguir explorando.':'Volviste al patio. El reto te espera cuando quieras.');}
    });syncMusic();syncUI();void activateSound();
  }
  function openMission(id,hostId){
    if(!loaded||!M.TASKS[id]||window.MissionActivities.isOpen()||state.quiz)return false;
    if(id==='dibujo'&&state.scene!=='classroom'){if(mapOpen)closeMap();showToast('Entra a '+G.STATIONS.classroom.name+' y habla con el maestro Ángel para pintar.');return false;}
    if(mapOpen)closeMap();clearInput();state.phase='mission';enableWorldControls(false);
    window.MissionActivities.open({id,hostId,game:G,images,day:state.schoolDay,player:state.player,record:state.challenges[id],sound:playTone,isSoundEnabled:()=>soundOn,onSoundChange:setSound,
      onAward(taskId,score){const old=state.challenges[taskId]||{won:false,best:0,wins:0};state.challenges[taskId]={won:true,best:Math.max(old.best,score),wins:old.wins+1};if(!old.won)state.points+=80;saveProgress();particles();},
      onClose(report){music.stopVoices();state.phase='play';clearInput();enableWorldControls(true);resumeWorldMusic();syncUI();saveProgress();syncChallengeList();canvas.focus({preventScroll:true});showToast(report.won?'¡Misión conseguida! Tus avances quedaron guardados.':'Volviste a la escuela. Puedes practicar la misión cuando quieras.');}
    });syncMusic();syncUI();void activateSound();return true;
  }
  function syncTeacherMissions(){
    $('teacher-mission-list').replaceChildren();const activities=[...Object.entries(P.TASKS).filter(([,task])=>task.commission),...Object.entries(M.TASKS)];
    for(const [id,task] of activities){
      const button=document.createElement('button'),icon=document.createElement('span'),copy=document.createElement('span'),where=document.createElement('small');
      const won=state.challenges[id]?.won;button.type='button';button.classList.toggle('won',!!won);icon.textContent=won?'✓':id==='dibujo'?'🎨':task.type==='cleanup'?'♻':task.type==='punctuality'?'◷':task.type==='english'?'ABC':'👕';copy.textContent=task.title;
      where.textContent=(id==='dibujo'?G.STATIONS.classroom.name:task.commission)+(won?' · Conseguida':' · Aprender');copy.append(where);button.append(icon,copy);button.addEventListener('click',()=>P.TASKS[id]?openPlayground(id):openMission(id));$('teacher-mission-list').append(button);
    }
  }
  function syncChallengeList(){
    $('challenge-list').replaceChildren();
    for(const [id,task] of Object.entries(P.TASKS).filter(([,task])=>!task.commission)){
      const button=document.createElement('button'),icon=document.createElement('span'),copy=document.createElement('span'),where=document.createElement('small');
      const won=state.challenges[id]?.won;button.type='button';button.classList.toggle('won',!!won);icon.textContent=won?'✓':task.type==='football'?'⚽':task.type==='rope'?'↻':'♻';copy.textContent=task.title;
      const locked=id==='criss'&&!state.unlocks.cleanup;if(locked){icon.textContent='🔒';button.setAttribute('aria-label','Habla con Criss para desbloquear la limpieza');}
      where.textContent=locked?'Habla con Criss · Explanada':(task.type==='football'?'Cancha':'Explanada')+(won?' · Conseguido':' · Jugar');copy.append(where);button.append(icon,copy);button.addEventListener('click',()=>openPlayground(id));$('challenge-list').append(button);
    }
    syncTeacherMissions();
  }
  function startGame() {
    if(!loaded) return {error:'El terreno sigue cargando.'};
    if(state.phase!=='title')return G.snapshot(state);
    if(!state.started&&!characterConfirmed){openCharacters(true);return G.snapshot(state);}
    if(state.started){state.phase='play';$('start-screen').hidden=true;clearInput();enableWorldControls(true);if(state.quiz){renderQuestion();quizDialog.showModal();}else canvas.focus({preventScroll:true});syncMusic();syncUI();void activateSound();return G.snapshot(state);}
    if(!G.start(state))return G.snapshot(state);
    $('start-screen').hidden=true;clearInput();
    $('director-message').textContent=G.WELCOME_TEXT;
    welcomeDialog.showModal();keyboard.focus($('welcome-continue'),false);
    syncMusic();
    void activateSound('start');
    syncUI();return G.snapshot(state);
  }
  function finishWelcome() {
    if(!G.finishWelcome(state))return null;
    welcomeDialog.close();enableWorldControls(true);clearInput();canvas.focus({preventScroll:true});
    syncMusic();syncUI();saveProgress();
    showToast('Juegas como '+state.player.name+'. Enter: A · Espacio: B · E: pausa y mapa.');
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
    trompoPaused=false;
    G.leaveTrompo(state);drainEvents();clearInput();syncUI();canvas.focus({preventScroll:true});
  }
  function toggleTrompoPause(){
    if(state.phase!=='trompo')return;
    trompoPaused=!trompoPaused;clearInput();renderTrompo();syncMusic();
    keyboard.focus($('trompo-action').disabled?$('trompo-pause'):$('trompo-action'),false);
  }
  function openPacman(){
    if(window.PacmanArcade.isOpen())return;
    clearInput();state.phase='pacman';enableWorldControls(false);
    window.PacmanArcade.open({playerName:state.player.name,group:classroomLabel(),sound:playTone,
      onClose(report){music.stopVoices();state.phase='play';clearInput();enableWorldControls(true);resumeWorldMusic();syncUI();canvas.focus({preventScroll:true});
        showToast(report.score?'Pac-Man · '+report.score+' puntos · '+report.correct+' '+(report.correct===1?'suma resuelta':'sumas resueltas'):'Volviste al salón. ¡La aventura continúa!');}
    });syncMusic();syncUI();
  }
  function openTheater(){
    if(window.TheaterRehearsal.isOpen())return;
    clearInput();state.phase='theater';enableWorldControls(false);
    window.TheaterRehearsal.open({player:state.player,group:classroomLabel(),students:G.STUDENTS,teachers:G.TEACHERS,images,enabled:soundOn,
      studentFrame:(student,row)=>G.STUDENT_FRAMES[row][G.studentUniformColumn(student,state.schoolDay)],sound:playTone,onSoundChange:setSound,
      onClose(report){music.stopVoices();state.phase='play';clearInput();enableWorldControls(true);resumeWorldMusic();syncUI();canvas.focus({preventScroll:true});
        showToast(report.completed?'¡Ensayo completo! '+report.score+' puntos · '+report.accuracy+'% de precisión.':'Volviste a la explanada. Puedes ensayar cuando quieras.');}
    });syncMusic();syncUI();
  }
  function restart() {
    if(crissDialog.open)closeCrissDialogue();
    if(window.PlaygroundGames.isOpen())window.PlaygroundGames.close();
    if(window.CharacterSelect.isOpen())window.CharacterSelect.close();
    if(window.TheaterRehearsal.isOpen())window.TheaterRehearsal.close();
    if(window.PacmanArcade.isOpen())window.PacmanArcade.close();
    if(victoryDialog.open) victoryDialog.close();
    if(quizDialog.open) quizDialog.close();
    if(mapDialog.open) mapDialog.close();
    if(welcomeDialog.open)welcomeDialog.close();
    if(trompoDialog.open)trompoDialog.close();
    if(uniformDialog.open)uniformDialog.close();
    const previous=state.player.id;mapOpen=false;state=G.createState();C.select(G,state,previous);G.start(state);G.finishWelcome(state);saveProgress();syncChallengeList();enableWorldControls(true);clearInput();snapCamera();syncMusic();syncUI();
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
      if(event.type==='criss-talk')openCrissDialogue();
      if(event.type==='playground-open')openPlayground(event.id);
      if(event.type==='arcade')openPacman();
      if(event.type==='theater-open')openTheater();
      if(['correct','try','kick'].includes(event.type))playTone(event.type==='correct'?'start':event.type);
      if(event.type==='trompo-open'){
        clearInput();renderTrompo();if(!trompoDialog.open)trompoDialog.showModal();
        keyboard.focus($('trompo-action'),false);
      }
      if(event.type==='teacher-mission'){if(P.TASKS[event.id])openPlayground(event.id);else openMission(event.id,event.hostId);}
      if(event.type==='trompo-close'){if(trompoDialog.open)trompoDialog.close();clearInput();resumeWorldMusic();canvas.focus({preventScroll:true});}
      if(event.type==='trompo-throw')playTone('throw');
      if(event.type==='trompo-win')playTone('correct');
      if(event.type==='uniform-open'){
        clearInput();enableWorldControls(false);
        $('uniform-return').textContent=state.uniformReturnPhase==='welcome'?'Enter / A · Volver con el director':'Enter / A · Seguir explorando';
        $('uniform-today').textContent=(state.dayMode==='auto'?'Hoy: ':'Día elegido: ')+G.UNIFORM_DAYS[state.schoolDay].name+'. '+G.UNIFORM_DAYS[state.schoolDay].description;
        if(!uniformDialog.open)uniformDialog.showModal();
        uniformDialog.scrollTop=0;keyboard.focus($('uniform-return'),false);
      }
      if(event.type==='uniform-close'){
        if(uniformDialog.open)uniformDialog.close();clearInput();
        enableWorldControls(state.phase==='play');
        if(state.phase==='welcome')$('welcome-uniform').focus({preventScroll:true});else canvas.focus({preventScroll:true});
      }
    }
  }
  function interact() {
    if(trompoPaused){toggleTrompoPause();return null;}
    if(state.phase==='title')return startGame();
    if(state.phase==='welcome')return finishWelcome();
    if(state.phase==='uniform')return closeUniformGuide();
    if(mapOpen)return null;
    if(state.quiz){if(state.quiz.correct)nextQuestion();return null;}
    const action=G.interact(state);drainEvents();syncUI();saveProgress();return action;
  }
  function drawTop(owner,x,y,energy,angle,age) {
    const frame=energy<=10?3:media.matches?0:Math.floor(angle*3)%3;
    const [sx,sy,sw,sh,ax,ay]=G.TOP_FRAMES[owner][frame],factor=42/G.TOP_FRAMES[owner][0][3];
    const lift=age&&age<.5?Math.sin(age/.5*Math.PI)*22:0;
    topCtx.fillStyle='#173d3940';topCtx.beginPath();topCtx.ellipse(x,y,12,4,0,0,Math.PI*2);topCtx.fill();
    topCtx.drawImage(images.tops,sx,sy,sw,sh,x-ax*factor,y-ay*factor-lift,sw*factor,sh*factor);
  }
  function drawTrompoActors() {
    C.draw(topCtx,G,images,state.player,state.schoolDay,184,246,64,'right');
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
    const message=trompoPaused?'Pausa. Pulsa E / START o Enter / A para continuar.':game.message;
    if($('trompo-message').textContent!==message)$('trompo-message').textContent=message;
    $('trompo-pause').textContent=trompoPaused?'▶ Continuar':'Ⅱ Pausa';
    $('trompo-pause').setAttribute('aria-pressed',String(trompoPaused));
    $('trompo-meter').style.visibility=game.stage==='aim'?'visible':'hidden';
    $('trompo-needle').style.left=(game.power*100)+'%';
    const wasDisabled=$('trompo-action').disabled;
    $('trompo-action').disabled=!trompoPaused&&game.stage==='spin';
    if(wasDisabled&&!$('trompo-action').disabled&&document.activeElement!==$('trompo-close'))keyboard.focus($('trompo-action'),false);
    $('trompo-action').textContent=trompoPaused?'Enter / A · Continuar':game.stage==='aim'?'Enter / A · Lanzar trompo':game.stage==='spin'?'Girando…':game.stage==='complete'?'Enter / A · Volver al patio':game.round===3?'Enter / A · Ver resultado':'Enter / A · Siguiente ronda';
    topCtx.imageSmoothingEnabled=false;
    topCtx.drawImage(images.map,327,699,630,194,0,0,720,280);
    topCtx.strokeStyle='#fff2c3';topCtx.lineWidth=4;topCtx.beginPath();topCtx.ellipse(360,142,98,89,0,0,Math.PI*2);topCtx.stroke();
    topCtx.strokeStyle='#bd852dc0';topCtx.lineWidth=2;topCtx.beginPath();topCtx.ellipse(360,142,101,92,0,0,Math.PI*2);topCtx.stroke();
    if(game.tops.length)for(const top of game.tops)drawTop(top.owner,top.x,top.y,top.energy,top.angle,top.age);
    else{drawTop('red',290,185,60,0,0);drawTop('blue',430,185,60,0,0);}
    drawTrompoActors();
    if(trompoPaused){topCtx.fillStyle='#10332dd9';topCtx.fillRect(0,0,720,280);topCtx.fillStyle='#ffe295';topCtx.font='bold 32px Georgia';topCtx.textAlign='center';topCtx.fillText('PAUSA',360,140);}
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
      button.addEventListener('focus',()=>{
        selectedAnswer=index;
        Array.from($('answers').children).forEach((choice,n)=>choice.classList.toggle('controller-choice',!quiz.correct&&n===index));
      });
      button.addEventListener('click',()=>submitAnswer(index));$('answers').append(button);
    });
    currentFeedback=quiz.feedback;
    keyboard.focus(quiz.correct?$('next-question'):$('answers').children[selectedAnswer],false);
  }
  function submitAnswer(index) {
    if(!state.quiz||state.quiz.correct)return false;
    selectedAnswer=index;
    const correct=G.answer(state,index);drainEvents();renderQuestion();
    if(!correct){const button=$('answers').children[index];if(button)button.classList.add('wrong');}
    syncUI();saveProgress();return correct;
  }
  function nextQuestion() {
    G.nextQuestion(state);drainEvents();saveProgress();
    if(state.quiz)renderQuestion();else if(!victoryDialog.open)canvas.focus({preventScroll:true});
    syncUI();
  }
  function openMap() {
    if(!loaded||state.phase!=='play'||state.quiz)return;
    mapOpen=true;clearInput();syncChallengeList();saveProgress();
    const p=state.scene==='classroom'?G.CLASSROOM_DOOR:state.player;
    $('map-player').style.left=(p.x/1215*100)+'%';$('map-player').style.top=(p.y/1295*100)+'%';
    if(!mapDialog.open)mapDialog.showModal();
    keyboard.focus($('close-map'),false);
  }
  function closeMap(){mapDialog.close();mapOpen=false;clearInput();canvas.focus({preventScroll:true});}
  function classroomLabel(){return G.classroomLabel();}
  function syncSchoolNames(){
    $('map-classroom-name').textContent=G.STATIONS.classroom.name;
    $('uniform-title').textContent='Uniforme de '+classroomLabel();
    $('class-roster-title').textContent=classroomLabel()+' · '+G.STUDENTS.length+' alumnos';
    $('teacher-list').replaceChildren();
    for(const teacher of window.SchoolSettings.orderedTeachers(G)){
      const item=document.createElement('li'),name=document.createElement('span');
      name.textContent=teacherLabel(teacher);item.append(name);
      if(teacher.fullName){const fullName=document.createElement('small');fullName.className='staff-full-name';fullName.textContent=teacher.fullName;item.append(fullName);}
      $('teacher-list').append(item);
    }
  }
  function syncUI() {
    $('player-name').textContent=state.player.name+' · '+(state.player.kind==='staff'?(C.find(G,state.player.id)?.group||'Personal'):classroomLabel());
    $('player-name').title='Juegas como '+state.player.name;
    $('objective').textContent=G.objective(state);
    $('stars').textContent='★'.repeat(Object.values(state.completed).filter(Boolean).length)+'☆'.repeat(3-Object.values(state.completed).filter(Boolean).length);
    $('points').textContent=state.points+' puntos';
    const p=state.player;
    $('location-tag').textContent=state.scene==='classroom'?G.STATIONS.classroom.name:p.y>1150?'Entrada · Los Insurgentes':p.y<520?'Cancha de fútbol':p.y>960?'Fuente y mural':'Patio de la escuela';
    const target=G.nearby(state);
    $('interaction').hidden=!target||state.phase!=='play'||!!state.quiz||mapOpen||schoolEditorOpen;
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
    C.draw(context,G,images,student,state.schoolDay,student.x,student.y,unitHeight,student.facing,
      {walking:student.walking,time:student.time,reducedMotion:media.matches});
  }
  function drawPlayer() {
    const p=state.player;
    ctx.save();ctx.fillStyle='#142f2945';ctx.beginPath();ctx.ellipse(p.x,p.y-1,12,4.2,0,0,Math.PI*2);ctx.fill();
    if(p.kind==='staff')C.draw(ctx,G,images,p,state.schoolDay,p.x,p.y,53,p.facing,{walking:p.walking,time:p.time,reducedMotion:media.matches});else drawStudentSprite(ctx,p,45);ctx.restore();
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
  function placeCrissInvitation(){
    const bubble=$('criss-invitation'),criss=G.TEACHERS.find(actor=>actor.id==='criss').positions.outside;
    bubble.hidden=state.scene!=='outside'||state.phase!=='play'||!!state.quiz||mapOpen||schoolEditorOpen||Math.hypot(criss.x-state.player.x,criss.y-state.player.y)>=180;
    if(bubble.hidden)return;
    const x=width/2+(criss.x-camera.x)*scale,y=height/2+(criss.y-camera.y-61)*scale;
    if(x<0||x>width||y<150||y>height-100){bubble.hidden=true;return;}
    bubble.style.left=Math.max(126,Math.min(width-126,x))+'px';bubble.style.top=y+'px';
  }
  function drawClassmate(student) {
    ctx.save();ctx.fillStyle='#142f293b';ctx.beginPath();ctx.ellipse(student.x,student.y-1,8,3,0,0,Math.PI*2);ctx.fill();
    drawStudentSprite(ctx,student,36);ctx.restore();
  }
  function drawTeacher(teacher) {
    ctx.save();ctx.fillStyle='#142f2945';ctx.beginPath();ctx.ellipse(teacher.x,teacher.y-1,12,4,0,0,Math.PI*2);ctx.fill();
    C.draw(ctx,G,images,{...teacher,kind:'staff'},state.schoolDay,teacher.x,teacher.y,53,teacher.facing,{walking:teacher.walking,time:teacher.time,reducedMotion:media.matches});ctx.restore();
  }
  function drawArcade(){
    const cabinet=G.ARCADE,[sx,sy,sw,sh]=cabinet.frame;
    ctx.save();ctx.fillStyle='#142f293b';ctx.beginPath();ctx.ellipse(cabinet.x,cabinet.y-1,35,6,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(images.arcade,sx,sy,sw,sh,cabinet.x-cabinet.width/2,cabinet.y-cabinet.height,cabinet.width,cabinet.height);ctx.restore();
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
    placeOliverInvitation();placeCrissInvitation();
    ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.translate(-camera.x,-camera.y);
    ctx.imageSmoothingEnabled=false;
    const world=G.WORLD[state.scene];ctx.drawImage(state.scene==='outside'?images.map:images.room,0,0,world.width,world.height);
    if(state.scene==='outside'){
      drawMapLabels();
      for(const actor of G.challengeActors(state)){const task=P.TASKS[actor.id],complete=state.challenges[actor.id]?.won;ctx.save();ctx.font='bold 19px Trebuchet MS';ctx.textAlign='center';ctx.fillStyle=complete?'#bce9a9':'#ffdd84';ctx.strokeStyle='#173c35';ctx.lineWidth=5;const icon=complete?'✓':task.type==='football'?'⚽':task.type==='rope'?'↻':'♻';ctx.strokeText(icon,actor.x,actor.y-48);ctx.fillText(icon,actor.x,actor.y-48);ctx.restore();}
      marker(998,1016,'Sumas',state.completed.fountain,time);
      marker(G.CLASSROOM_DOOR.x,G.CLASSROOM_DOOR.y-2,classroomLabel(),state.completed.classroom,time);
      marker(643,413,'Números',state.completed.field,time);
      const theater=G.THEATER,bob=media.matches?0:Math.sin(time*2.5)*3;
      ctx.save();ctx.translate(theater.x,theater.y-46+bob);ctx.fillStyle='#173f3ce8';ctx.strokeStyle='#ffe09a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect(-24,-26,48,40,9);ctx.fill();ctx.stroke();ctx.font='bold 27px Trebuchet MS';ctx.textAlign='center';ctx.fillStyle='#ffdf83';ctx.fillText('♫',0,4);
      ctx.font='bold 12px Trebuchet MS';ctx.strokeStyle='#173f3c';ctx.lineWidth=4;ctx.strokeText('Ensayo',0,31);ctx.fillText('Ensayo',0,31);ctx.restore();
      const b=state.ball;ctx.save();ctx.font='25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#153b3140';ctx.beginPath();ctx.ellipse(b.x,b.y+7,11,4,0,0,Math.PI*2);ctx.fill();ctx.fillText('⚽',b.x,b.y);ctx.restore();
    }else{
      marker(640,166,'Lectura',state.completed.classroom,time);
      ctx.save();ctx.font='bold 17px Trebuchet MS';ctx.fillStyle='#28554d';ctx.textAlign='center';ctx.fillText(classroomLabel()+' · El cuaderno de Lucía',640,85);ctx.restore();
    }
    const classmates=G.classmatesInScene(state),teachers=G.teachersInScene(state);
    const actors=[...classmates.map(student=>({student,y:student.y})),...teachers.map(teacher=>({teacher,y:teacher.y})),...(state.scene==='classroom'?[{arcade:true,y:G.ARCADE.y}]:[]),{player:true,y:state.player.y}].sort((a,b)=>a.y-b.y);
    for(const actor of actors){if(actor.student)drawClassmate(actor.student);else if(actor.teacher)drawTeacher(actor.teacher);else if(actor.arcade)drawArcade();else drawPlayer();}
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
    const count=$('answers').children.length;
    selectedAnswer=(selectedAnswer+direction+count)%count;
    Array.from($('answers').children).forEach((button,index)=>{
      if(index===selectedAnswer){button.classList.add('controller-choice');button.focus({preventScroll:true});}
      else button.classList.remove('controller-choice');
    });
  }
  function isXboxGamepad(pad) {
    return /xbox|xinput|microsoft|045e/i.test(pad.id||'');
  }
  function gamepadKey(pad) {return String(pad.index)+':'+(pad.id||'');}
  function buttonPressed(button) {
    return typeof button==='number'?button>.5:!!button?.pressed||Number(button?.value)>.5;
  }
  function normalizeGamepad(pad) {
    const raw=Array.from(pad.buttons||[],buttonPressed),axes=Array.from(pad.axes||[]);
    let pressed=raw;
    // Windows Bluetooth HID can expose an unmapped Xbox layout: X/Y are
    // 3/4, View/Menu are 10/11, and the D-pad is a hat on axis 9.
    // Never remap a browser-standard or XInput layout a second time.
    const bluetoothHid=pad.mapping!=='standard'&&isXboxGamepad(pad)&&raw.length>=15&&raw.length<16&&axes.length>=10;
    if(bluetoothHid){
      pressed=Array(17).fill(false);
      [0,1,3,4,6,7,null,null,10,11,13,14,null,null,null,null,12].forEach((source,index)=>{
        if(source!==null)pressed[index]=!!raw[source];
      });
      pressed[6]=Number(axes[3])>0;pressed[7]=Number(axes[4])>0;
      const hat=Number(axes[9]);
      if(Number.isFinite(hat)&&hat!==0){
        pressed[12]=(hat>=-1&&hat<-.7)||(hat>=.95&&hat<=1);
        pressed[13]=hat>=-.2&&hat<.45;
        pressed[14]=hat>=.4&&hat<=1;
        pressed[15]=hat>=-.75&&hat<-.1;
      }
    }
    const axis=index=>Number.isFinite(Number(axes[index]))?Math.max(-1,Math.min(1,Number(axes[index]))):0;
    let x=axis(0),y=axis(1);
    const magnitude=Math.hypot(x,y),deadzone=.18;
    if(magnitude<=deadzone)x=y=0;
    else{const factor=(Math.min(1,magnitude)-deadzone)/(1-deadzone)/magnitude;x*=factor;y*=factor;}
    if(pressed[14]||pressed[15])x=(pressed[15]?1:0)-(pressed[14]?1:0);
    if(pressed[12]||pressed[13])y=(pressed[13]?1:0)-(pressed[12]?1:0);
    return {pad,pressed,x,y,active:pressed.some(Boolean)||Math.hypot(x,y)>.1,
      signature:pressed.map(Number).join('')+':'+x.toFixed(2)+','+y.toFixed(2)};
  }
  function updateControllerStatus(message) {
    if(controllerStatus===message)return;
    controllerStatus=message;
    if(controllerTitleStatus)controllerTitleStatus.textContent=message;
    if(controllerMapStatus)controllerMapStatus.textContent=message;
  }
  function resetController() {
    gamepadButtons=[];gamepadIndex=null;gamepadId='';menuDirection=0;menuRepeatAt=0;
  }
  function readController() {
    let pads=[];
    try{
      const getPads=navigator.getGamepads||navigator.webkitGetGamepads;
      if(typeof getPads!=='function'){
        resetController();gamepadSamples.clear();updateControllerStatus('Mando: abre el juego en Chrome o Edge y pulsa A.');return null;
      }
      pads=Array.from(getPads.call(navigator)||[]).filter(pad=>pad&&pad.connected!==false);
    }catch(_){
      resetController();gamepadSamples.clear();updateControllerStatus('Mando: abre el enlace del juego en su propia pestaña y pulsa A.');return null;
    }
    if(!pads.length){
      resetController();gamepadSamples.clear();updateControllerStatus('Mando Xbox: haz clic en el juego y pulsa A para activarlo.');return null;
    }
    const samples=pads.map(normalizeGamepad);
    const changed=samples.filter(sample=>sample.active&&sample.signature!==gamepadSamples.get(gamepadKey(sample.pad)));
    const current=samples.find(sample=>sample.pad.index===gamepadIndex&&(sample.pad.id||'')===gamepadId);
    const selected=changed.find(sample=>isXboxGamepad(sample.pad))||changed[0]||current||samples.find(sample=>isXboxGamepad(sample.pad))||samples.find(sample=>sample.pad.mapping==='standard')||samples[0];
    const liveKeys=new Set(samples.map(sample=>gamepadKey(sample.pad)));
    for(const key of gamepadSamples.keys())if(!liveKeys.has(key))gamepadSamples.delete(key);
    for(const sample of samples)gamepadSamples.set(gamepadKey(sample.pad),sample.signature);
    if(selected.pad.index!==gamepadIndex||(selected.pad.id||'')!==gamepadId){
      resetController();gamepadIndex=selected.pad.index;gamepadId=selected.pad.id||'';
    }
    updateControllerStatus(isXboxGamepad(selected.pad)?'Control Xbox listo · A: acción · B: correr · START: mapa':'Control listo · A: acción · B: correr · START: mapa');
    return selected;
  }
  function initControllerHints() {
    const titleControls=document.querySelector('.title-controls');
    if(titleControls){
      titleControls.innerHTML='Flechas · Mover y elegir &nbsp; | &nbsp; Enter · A<br>Espacio · B (correr / volver) &nbsp; | &nbsp; E · Pausa<br>Xbox One / 360: joystick · Caminar &nbsp; | &nbsp; A · Acción<br>';
      controllerTitleStatus=document.createElement('span');titleControls.append(controllerTitleStatus);
    }
    const mapHelp=document.querySelector('.controller-help');
    if(mapHelp){
      mapHelp.textContent='Xbox One por Bluetooth, Xbox 360 y XInput: joystick o cruceta para caminar; A para actuar; B para correr o cerrar; X / START para abrir el mapa; Y para sonido. En los retos, elige con la cruceta y confirma con A.';
      controllerMapStatus=document.createElement('p');controllerMapStatus.className='fine-print';
      mapHelp.parentElement.append(controllerMapStatus);
    }
  }
  function controllerMenu(root,x,y,confirm,timestamp,defaultTarget){
    const direction=Math.abs(x)>Math.abs(y)?(x<-.55?'ArrowLeft':x>.55?'ArrowRight':''):(y<-.55?'ArrowUp':y>.55?'ArrowDown':'');
    if(direction&&(direction!==menuDirection||timestamp>=menuRepeatAt)){keyboard.key({key:direction},root,{defaultTarget});menuRepeatAt=timestamp+(direction===menuDirection?170:350);}
    menuDirection=direction;if(confirm)keyboard.key({key:'Enter'},root,{defaultTarget});
  }
  function controllerInput(timestamp) {
    const controller=readController();
    if(!controller){if(window.PlaygroundGames.isOpen())window.PlaygroundGames.pad({x:0,y:0});if(window.MissionActivities.isOpen())window.MissionActivities.pad({x:0,y:0});return {x:0,y:0,run:false};}
    const pressed=controller.pressed,{x,y}=controller;
    const edge=index=>!!pressed[index]&&!gamepadButtons[index];
    if(schoolEditorOpen){
      if(edge(1))window.SchoolEditor?.close();else controllerMenu($('school-editor'),x,y,edge(0),timestamp);
      gamepadButtons=pressed.slice();return {x:0,y:0,run:false};
    }
    if(edge(3))setSound(window.TheaterRehearsal.isOpen()?!soundOn:!(soundOn&&music.ready));
    if(window.CharacterSelect.isOpen()){window.CharacterSelect.pad({x,y,confirm:edge(0),back:edge(1),timestamp});gamepadButtons=pressed.slice();return {x:0,y:0,run:false};}
    if(window.MissionActivities.isOpen()){window.MissionActivities.pad({x,y,confirm:edge(0),pause:edge(9),back:edge(1),previous:edge(4),next:edge(5),timestamp});gamepadButtons=pressed.slice();return {x:0,y:0,run:false};}
    if(window.PlaygroundGames.isOpen()){window.PlaygroundGames.pad({x,y,confirm:edge(0),pause:edge(9),back:edge(1)});gamepadButtons=pressed.slice();return {x:0,y:0,run:false};}
    if(window.TheaterRehearsal.isOpen()){
      window.TheaterRehearsal.pad({x,y,confirm:edge(0),pause:edge(9),back:edge(1),timestamp});
      gamepadButtons=pressed.slice();return {x:0,y:0,run:false};
    }
    if(window.PacmanArcade.isOpen()){
      window.PacmanArcade.pad({x,y,confirm:edge(0),pause:edge(9),back:edge(1)});
      gamepadButtons=pressed.slice();return {x:0,y:0,run:false};
    }
    if(state.phase==='title'){if(edge(9))startGame();else controllerMenu($('start-screen'),x,y,edge(0),timestamp,$('start-button'));}
    else if(state.phase==='welcome'){if(edge(2))showUniformGuide();else if(edge(9))finishWelcome();else controllerMenu(welcomeDialog,x,y,edge(0),timestamp,$('welcome-continue'));}
    else if(state.phase==='criss-dialogue'){if(edge(1))closeCrissDialogue();else if(edge(9))acceptCrissDialogue();else controllerMenu(crissDialog,x,y,edge(0),timestamp,$('criss-accept'));}
    else if(state.phase==='uniform'){if(edge(1)||edge(2)||edge(9))closeUniformGuide();else controllerMenu(uniformDialog,x,y,edge(0),timestamp,$('uniform-return'));}
    else if(mapOpen){if(edge(1)||edge(2)||edge(8)||edge(9))closeMap();else controllerMenu(mapDialog,x,y,edge(0),timestamp,$('close-map'));}
    else if(state.quiz){
      const direction=y<-.55||x<-.55?-1:y>.55||x>.55?1:0;
      if(direction&&(direction!==menuDirection||timestamp>=menuRepeatAt)){chooseAnswer(direction);menuRepeatAt=timestamp+(direction===menuDirection?180:350);}
      menuDirection=direction;
      if(edge(0)){if(state.quiz.correct)nextQuestion();else submitAnswer(selectedAnswer);}
      else if(edge(9)&&state.quiz.correct)nextQuestion();
    }
    else if(state.phase==='trompo'){if(edge(1))closeTrompo();else if(edge(9))toggleTrompoPause();else controllerMenu(trompoDialog,x,y,edge(0),timestamp,$('trompo-action'));}
    else if(state.phase==='victory'){
      if(edge(0)||edge(1)||edge(9)){victoryDialog.close();state.phase='play';clearInput();canvas.focus({preventScroll:true});}
    }
    else if(state.phase==='play'){
      menuDirection=0;
      if(edge(2)||edge(8)||edge(9))openMap();else if(edge(0))interact();
    }
    gamepadButtons=pressed.slice();
    return {x,y,run:!!pressed[1]};
  }
  function inputVector(controller) {
    let x=(held.has('arrowright')||held.has('d')?1:0)-(held.has('arrowleft')||held.has('a')?1:0);
    let y=(held.has('arrowdown')||held.has('s')?1:0)-(held.has('arrowup')||held.has('w')?1:0);
    for(const direction of touch.values()){if(direction==='right')x++;if(direction==='left')x--;if(direction==='down')y++;if(direction==='up')y--;}
    if(controller.x)x=controller.x;if(controller.y)y=controller.y;
    return{x,y,run:keyboardRun||held.has(' ')||held.has('shift')||controller.run};
  }
  function frame(timestamp) {
    const dt=Math.min(.05,lastTime?(timestamp-lastTime)/1000:1/60);lastTime=timestamp;
    if(timestamp-lastDayCheck>30000){G.refreshSchoolDay(state);lastDayCheck=timestamp;}
    if(document.hasFocus?.())windowActive=true;
    if(!document.hidden&&windowActive&&loaded){
      const controller=controllerInput(timestamp);
      if(window.CharacterSelect.isOpen()){}
      else if(window.MissionActivities.isOpen())window.MissionActivities.tick(dt);
      else if(window.PlaygroundGames.isOpen())window.PlaygroundGames.tick(dt);
      else if(window.TheaterRehearsal.isOpen())window.TheaterRehearsal.tick();
      else if(window.PacmanArcade.isOpen())window.PacmanArcade.tick(dt);
      else if(!mapOpen&&!schoolEditorOpen&&!trompoPaused)G.tick(state,dt,inputVector(controller));
    }
    drainEvents();if(state.started&&timestamp-lastAutosave>2000){saveProgress();lastAutosave=timestamp;}syncUI();syncMusic();drawFrame(timestamp/1000,dt);animationHandle=requestAnimationFrame(frame);
  }
  $('criss-accept').addEventListener('click',acceptCrissDialogue);
  $('criss-later').addEventListener('click',closeCrissDialogue);$('criss-close').addEventListener('click',closeCrissDialogue);
  crissDialog.addEventListener('cancel',event=>{event.preventDefault();closeCrissDialogue();});
  $('start-button').addEventListener('click',startGame);
  $('title-character').addEventListener('click',()=>openCharacters(false));
  $('map-character').addEventListener('click',()=>openCharacters(false));
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
  $('trompo-pause').addEventListener('click',toggleTrompoPause);
  trompoDialog.addEventListener('cancel',event=>{event.preventDefault();closeTrompo();});
  $('action-button').addEventListener('click',interact);
  $('next-question').addEventListener('click',nextQuestion);
  $('map-button').addEventListener('click',openMap);
  $('school-day').addEventListener('change',()=>{
    const value=$('school-day').value;G.setSchoolDay(state,value==='auto'?'auto':Number(value));clearInput();syncUI();saveProgress();
  });
  $('close-map').addEventListener('click',closeMap);
  mapDialog.addEventListener('close',()=>{mapOpen=false;clearInput();});
  mapDialog.addEventListener('click',event=>{if(event.target===mapDialog){const r=mapDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeMap();}});
  quizDialog.addEventListener('cancel',event=>{event.preventDefault();showToast('Termina las dos preguntas para recoger tu estrella.');});
  victoryDialog.addEventListener('cancel',event=>{event.preventDefault();victoryDialog.close();state.phase='play';clearInput();});
  $('continue-button').addEventListener('click',()=>{victoryDialog.close();state.phase='play';clearInput();canvas.focus({preventScroll:true});});
  $('restart-button').addEventListener('click',restart);
  $('sound-button').addEventListener('click',()=>setSound(!soundOn));
  $('map-sound').addEventListener('click',()=>setSound(!soundOn));
  $('map-run').addEventListener('click',()=>{
    keyboardRun=!keyboardRun;$('map-run').setAttribute('aria-pressed',String(keyboardRun));
    $('map-run').textContent=keyboardRun?'Paso: correr':'Paso: caminar';
    $('movement-hint').textContent=keyboardRun?'Flechas · Correr':'Flechas · Caminar';
  });
  for(const button of document.querySelectorAll('[data-direction]')){
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);touch.set(event.pointerId,button.dataset.direction);button.classList.add('pressed');});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,event=>{touch.delete(event.pointerId);button.classList.remove('pressed');});
  }
  window.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;
    if(window.CharacterSelect.isOpen()){if(window.CharacterSelect.key(event))event.preventDefault();return;}
    if(window.MissionActivities.isOpen()){if(window.MissionActivities.key(event))event.preventDefault();return;}
    if(window.PlaygroundGames.isOpen()){if(window.PlaygroundGames.key(event))event.preventDefault();return;}
    if(window.TheaterRehearsal.isOpen()){if(window.TheaterRehearsal.key(event))event.preventDefault();return;}
    if(window.PacmanArcade.isOpen()){if(window.PacmanArcade.key(event))event.preventDefault();return;}
    const key=event.key.toLowerCase();
    if(schoolEditorOpen){
      if(keyboard.isBack(event)||(key==='e'&&!keyboard.isEditing(event))){event.preventDefault();if(!event.repeat)window.SchoolEditor.close();}
      else if(keyboard.key(event,$('school-editor')))event.preventDefault();
      return;
    }
    const menu=state.phase==='criss-dialogue'?crissDialog:mapOpen?mapDialog:state.phase==='title'?$('start-screen'):state.phase==='uniform'?uniformDialog:state.phase==='welcome'?welcomeDialog:state.phase==='trompo'?trompoDialog:state.quiz?quizDialog:state.phase==='victory'?victoryDialog:null;
    if(menu&&keyboard.isBack(event)){
      event.preventDefault();if(event.repeat)return;
      if(state.phase==='criss-dialogue')closeCrissDialogue();
      else if(mapOpen)closeMap();
      else if(state.phase==='uniform')closeUniformGuide();
      else if(state.phase==='trompo')closeTrompo();
      else if(state.phase==='victory')$('continue-button').click();
      return;
    }
    if(key==='e'&&!keyboard.isEditing(event)){
      event.preventDefault();if(event.repeat)return;
      if(mapOpen)closeMap();else if(state.phase==='trompo')toggleTrompoPause();else if(state.phase==='play'&&!state.quiz)openMap();
      return;
    }
    if(state.phase==='trompo'&&!trompoPaused&&state.trompo.stage==='spin'&&key==='enter'&&![$('trompo-close'),$('trompo-pause')].includes(document.activeElement)){event.preventDefault();return;}
    if(menu&&keyboard.key(event,menu,{defaultTarget:state.phase==='title'?$('start-button'):null})){event.preventDefault();return;}
    if(menu&&document.activeElement?.matches('input,select,textarea,[contenteditable="true"]'))return;
    const gameKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','enter','m','shift'];
    if(state.phase==='title')return;
    if(state.phase==='uniform'){
      if(['a','u','x'].includes(key)){event.preventDefault();if(!event.repeat)closeUniformGuide();}return;
    }
    if(state.phase==='welcome'&&['u','x'].includes(key)){event.preventDefault();if(!event.repeat)showUniformGuide();return;}
    if(state.phase==='welcome'||state.phase==='trompo'){
      if(key==='a'){event.preventDefault();if(!event.repeat)interact();}
      return;
    }
    if(mapOpen){if(key==='m'||key==='escape'){event.preventDefault();closeMap();}return;}
    if(state.quiz){
      if(['1','2','3'].includes(key)){event.preventDefault();submitAnswer(Number(key)-1);}
      return;
    }
    if(state.phase!=='play')return;
    if(gameKeys.includes(key))event.preventDefault();
    if(key==='m'&&!event.repeat){openMap();return;}
    if(key==='enter'){if(!event.repeat)interact();return;}
    held.add(key);
  });
  window.addEventListener('keyup',event=>{
    const key=event.key.toLowerCase();held.delete(key);
    if(key===' '&&!keyboard.isEditing(event))event.preventDefault();
  });
  window.addEventListener('school-editor-visibility',event=>{
    schoolEditorOpen=!!event.detail.open;clearInput();
    enableWorldControls(state.phase==='play'&&!schoolEditorOpen);syncMusic();
  });
  window.addEventListener('pointerdown',()=>{if(soundOn&&(!music.ready||music.blocked||music.context?.state==='suspended'))void activateSound();});
  window.addEventListener('gamepadconnected',event=>{
    if(event.gamepad)gamepadSamples.delete(gamepadKey(event.gamepad));
    readController();if(document.hasFocus?.())windowActive=true;
  });
  window.addEventListener('gamepaddisconnected',event=>{
    if(event.gamepad){gamepadSamples.delete(gamepadKey(event.gamepad));if(event.gamepad.index===gamepadIndex){resetController();clearInput();}}
    readController();
  });
  window.addEventListener('blur',()=>{windowActive=false;clearInput();gamepadButtons=[];menuDirection=0;window.PacmanArcade.suspend();window.TheaterRehearsal.suspend();window.PlaygroundGames.suspend();window.MissionActivities.suspend();saveProgress();music.setPaused(true);});
  window.addEventListener('focus',()=>{windowActive=true;lastTime=0;resumeWorldMusic();});
  document.addEventListener('visibilitychange',()=>{clearInput();lastTime=0;if(document.hidden){window.PacmanArcade.suspend();window.TheaterRehearsal.suspend();window.PlaygroundGames.suspend();window.MissionActivities.suspend();saveProgress();}G.refreshSchoolDay(state);syncUI();syncMusic();});
  window.addEventListener('pagehide',()=>{saveProgress();clearInput();window.TheaterRehearsal.destroy();music.destroy();cancelAnimationFrame(animationHandle);},{once:true});
  window.addEventListener('resize',resize);
  function loadImage(key,path) {
    return new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>{images[key]=img;resolve();};img.onerror=()=>reject(new Error('No se pudo cargar '+key));img.src=window.INSURGENTES_ASSETS?.[key]||window.SchoolAssets?.url(path)||path;
    });
  }
  const teacherAssets=new Map(G.TEACHERS.filter(teacher=>teacher.assetKey&&teacher.assetPath).map(teacher=>[teacher.assetKey,teacher.assetPath]));
  Promise.all([...Object.entries(G.ASSET_PATHS).map(([key,path])=>loadImage(key,path)),...Array.from(teacherAssets,([key,path])=>loadImage(key,path))]).then(()=>{
    loaded=true;$('start-button').disabled=false;$('title-character').disabled=false;$('start-button').textContent=state.started?'CONTINUAR AVENTURA':'PULSA ENTER / START PARA JUGAR';$('load-status').textContent=state.started?'Tu partida está lista. '+state.player.name+' te espera.':'Tu escuela. Tu gran aventura.';
    for(const [id,key] of [['title-school','introBg'],['welcome-school','introBg'],['director-portrait','directorPortrait'],['uniform-director-portrait','directorPortrait'],['uniform-poster','uniformGuide'],['overview-image','map']])$(id).src=images[key].src;
    if(!schoolEditorOpen)keyboard.focus($('start-button'),false);resize();
    if(window.INSURGENTES_ASSETS){$('overview-image').src=window.INSURGENTES_ASSETS.map;document.querySelector('.download-link').hidden=true;}
  }).catch(error=>{
    console.error(error);$('start-button').textContent='Intentar de nuevo';$('start-button').disabled=false;$('load-status').textContent='No se pudo cargar el terreno. Revisa tu conexión y vuelve a intentarlo.';
    $('start-button').addEventListener('click',()=>location.reload(),{once:true});
  });
  function downloadBackup(){
    const value=progressStore.bundle(state,schoolStore),url=URL.createObjectURL(new Blob([value],{type:'application/json;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download='Los_Insurgentes_Partida.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);showToast('Copia completa exportada.');
  }
  $('adventure-export').addEventListener('click',downloadBackup);
  $('adventure-import').addEventListener('click',()=>$('adventure-import-file').click());
  $('adventure-import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>262144)throw new Error('La copia debe pesar menos de 256 KB.');
      const data=progressStore.parseBundle(await file.text(),schoolStore.getConfig(),window.SchoolSettings);
      progressStore.restoreRecords(data.records);schoolStore.importSave(JSON.stringify(data.school));
      const next=G.createState();Save.restore(G,C,next,data.progress);next.phase='play';next.started=true;state=next;characterConfirmed=true;progressStore.allowSaving();saveProgress();
      if(data.records['insurgentes-sound'])setSound(data.records['insurgentes-sound']==='yes');
      closeMap();snapCamera();syncChallengeList();syncUI();
      if(state.quiz){renderQuestion();quizDialog.showModal();}
      showToast('Copia restaurada: personaje, avances, escuela y récords.');
    }catch(error){$('adventure-save-status').textContent=error.message;$('adventure-save-status').classList.add('save-error');}
    finally{event.target.value='';}
  });
  window.SchoolUpdater?.configure({canReload:()=>loaded&&!schoolEditorOpen&&!window.CharacterSelect.isOpen()&&!window.MissionActivities.isOpen()&&!mapOpen&&!state.quiz&&['title','play'].includes(state.phase),save:saveProgress});
  function installAgentTools(){
    const model=document.modelContext;if(!model?.registerTool)return;
    const lifecycle=new AbortController();
    const tool={name:'read_school_adventure',title:'Leer estado de la aventura',description:'Consulta la posición, estrellas, reto actual y acción cercana del juego de Los Insurgentes.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(input&&Object.keys(input).length)throw new Error('Esta consulta no acepta parámetros.');return {...G.snapshot(state),pacman:window.PacmanArcade.snapshot(),theater:window.TheaterRehearsal.snapshot(),playground:window.PlaygroundGames.snapshot(),missions:window.MissionActivities.snapshot(),challenges:{...state.challenges}};}};
    const startTool={name:'start_school_adventure',title:'Pulsar START',description:'Pulsa START en la portada y abre la bienvenida del director. No reinicia una partida en curso.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(input&&Object.keys(input).length)throw new Error('Esta acción no acepta parámetros.');if(state.phase!=='title')throw new Error('La aventura ya está en curso.');return startGame();}};
    for(const item of [tool,startTool]){try{void Promise.resolve(model.registerTool(item,{signal:lifecycle.signal})).catch(error=>console.warn('No se pudo registrar la herramienta del juego',error));}catch(error){console.warn('Herramientas del juego no disponibles',error);}}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
  for(const student of [...G.STUDENTS].sort((a,b)=>a.name.localeCompare(b.name,'es'))){const item=document.createElement('li');item.textContent=student.name;$('class-list').append(item);}
  schoolStore.subscribe(()=>{syncSchoolNames();syncUI();});
  syncSchoolNames();syncChallengeList();
  for(const [day,uniform] of Object.entries(G.UNIFORM_DAYS)){
    const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=uniform.name+' · '+uniform.uniform;
    description.textContent=uniform.description+(day==='2'?' También se permite camisa blanca con pantalón o blusa blanca con uniforme de cuadros.':'');
    $('uniform-daily-details').append(term,description);
  }
  initControllerHints();readController();
  enableWorldControls(false);updateSoundButton();resize();installAgentTools();animationHandle=requestAnimationFrame(frame);
})();
