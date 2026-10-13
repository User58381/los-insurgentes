(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TheaterRhythm=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const LANES=['left','down','up','right'];
  const COLORS=['#71dafa','#b39aff','#ffda75','#86e6ac'];
  const MODES={easy:{label:'Ensayo tranquilo',stride:2,window:.25,perfect:.095,good:.17,travel:2.4},hard:{label:'Reto del ritmo',stride:1,window:.19,perfect:.065,good:.12,travel:2.1}};
  function makeChart(song,mode='easy'){
    if(!song||!Number.isFinite(song.duration)||song.duration<1||!Array.isArray(song.beats))throw new Error('La canción no tiene un mapa de ritmo válido.');
    let previous=-1;
    for(const beat of song.beats){if(!Number.isFinite(beat)||beat<=previous||beat<0||beat>=song.duration)throw new Error('El mapa de ritmo contiene un pulso inválido.');previous=beat;}
    const settings=MODES[mode]||MODES.easy,beats=song.beats.filter(time=>time>=3&&time<song.duration-.45),notes=[];
    // A fixed phrase pattern makes the rehearsal repeatable and learnable.
    const phrases=[[0,2,1,3,2,0,3,1],[1,0,3,2,0,1,2,3],[2,3,0,1,3,2,1,0],[3,1,2,0,1,3,0,2]];
    for(let i=0;i<beats.length;i+=settings.stride){
      const n=notes.length,phrase=phrases[Math.floor(n/16)%phrases.length];
      notes.push({id:n,time:beats[i],lane:phrase[n%phrase.length],status:'pending',delta:null});
    }
    return notes;
  }
  function createState(song,{mode='easy',offsetMs=0,highScore=0,finishAtDuration=true}={}){
    mode=MODES[mode]?mode:'easy';
    return {phase:'intro',song,mode,settings:MODES[mode],notes:makeChart(song,mode),duration:song.duration,
      offsetMs:Number.isFinite(offsetMs)?Math.max(-250,Math.min(250,offsetMs)):0,highScore:Math.max(0,Number(highScore)||0),
      score:0,perfect:0,good:0,ok:0,misses:0,offBeat:0,combo:0,bestCombo:0,elapsed:0,judgeTime:0,cursor:0,
      finishAtDuration,completed:false,flashes:Array(4).fill(null),lastJudgment:null,events:[]};
  }
  function emit(state,type,details={}){state.events.push({type,...details});}
  function start(state){
    if(!['intro','complete'].includes(state.phase))return false;
    state.notes=makeChart(state.song,state.mode);Object.assign(state,{phase:'playing',score:0,perfect:0,good:0,ok:0,misses:0,offBeat:0,combo:0,bestCombo:0,elapsed:0,judgeTime:-state.offsetMs/1000,cursor:0,completed:false,lastJudgment:null,flashes:Array(4).fill(null)});
    state.events=[];emit(state,'start');return true;
  }
  function advance(state,mediaTime){
    if(state.phase!=='playing'||!Number.isFinite(mediaTime))return false;
    state.elapsed=Math.max(state.elapsed,Math.max(0,Math.min(state.duration,mediaTime)));
    state.judgeTime=state.elapsed-state.offsetMs/1000;
    while(state.cursor<state.notes.length){
      const note=state.notes[state.cursor];
      if(note.status!=='pending'){state.cursor++;continue;}
      if(note.time>=state.judgeTime-state.settings.window)break;
      note.status='miss';state.misses++;state.combo=0;state.cursor++;
      state.lastJudgment={kind:'miss',at:state.judgeTime};emit(state,'miss',{noteId:note.id});
    }
    if(state.finishAtDuration&&state.elapsed>=state.duration)finish(state);
    return true;
  }
  function hit(state,lane,mediaTime=state.elapsed){
    if(state.phase!=='playing'||!Number.isFinite(mediaTime))return null;
    if(typeof lane==='string')lane=LANES.indexOf(lane);
    if(!Number.isInteger(lane)||lane<0||lane>3)return null;
    advance(state,mediaTime);if(state.phase!=='playing')return null;
    let nearest=null,distance=Infinity;
    for(let i=state.cursor;i<state.notes.length;i++){
      const note=state.notes[i];if(note.time>state.judgeTime+state.settings.window)break;
      if(note.lane===lane&&note.status==='pending'&&Math.abs(note.time-state.judgeTime)<distance){nearest=note;distance=Math.abs(note.time-state.judgeTime);}
    }
    if(!nearest){state.offBeat++;state.combo=0;state.flashes[lane]={at:state.judgeTime,kind:'empty'};state.lastJudgment={kind:'empty',at:state.judgeTime};emit(state,'empty',{lane});return {kind:'empty',lane};}
    const kind=distance<=state.settings.perfect?'perfect':distance<=state.settings.good?'good':'ok';
    nearest.status=kind;nearest.delta=state.judgeTime-nearest.time;state[kind]++;state.score+=kind==='perfect'?1000:kind==='good'?750:450;
    state.combo++;state.bestCombo=Math.max(state.bestCombo,state.combo);state.highScore=Math.max(state.highScore,state.score);
    state.flashes[lane]={at:state.judgeTime,kind};state.lastJudgment={kind,at:state.judgeTime};
    emit(state,'hit',{lane,kind,noteId:nearest.id,delta:nearest.delta});
    return {kind,lane,noteId:nearest.id,delta:nearest.delta};
  }
  function pause(state){if(state.phase==='playing'){state.phase='paused';return true;}if(state.phase==='paused'){state.phase='playing';return true;}return false;}
  function finish(state){
    if(state.completed||!['playing','paused'].includes(state.phase))return false;
    for(const note of state.notes)if(note.status==='pending'){note.status='miss';state.misses++;}
    state.cursor=state.notes.length;state.elapsed=state.duration;state.judgeTime=state.duration-state.offsetMs/1000;
    state.phase='complete';state.completed=true;state.highScore=Math.max(state.highScore,state.score);emit(state,'complete');return true;
  }
  function accuracy(state){
    const resolved=state.perfect+state.good+state.ok+state.misses;
    return resolved?Math.round((state.perfect+state.good*.85+state.ok*.6)/Math.max(1,resolved+state.offBeat*.25)*100):0;
  }
  function snapshot(state){return {phase:state.phase,mode:state.mode,time:Math.round(state.elapsed*1000)/1000,duration:state.duration,
    score:state.score,highScore:state.highScore,maxScore:state.notes.length*1000,notes:state.notes.length,hits:state.perfect+state.good+state.ok,
    perfect:state.perfect,good:state.good,ok:state.ok,misses:state.misses,offBeat:state.offBeat,combo:state.combo,bestCombo:state.bestCombo,
    accuracy:accuracy(state),offsetMs:state.offsetMs,completed:state.completed};}
  function drawArrow(ctx,lane,x,y,size,color,outline='#081e37'){
    ctx.save();ctx.translate(x,y);ctx.rotate([-.5,1,0,.5][lane]*Math.PI);ctx.scale(size/32,size/32);
    ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(16,0);ctx.lineTo(7,0);ctx.lineTo(7,15);ctx.lineTo(-7,15);ctx.lineTo(-7,0);ctx.lineTo(-16,0);ctx.closePath();
    ctx.fillStyle=color;ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.lineJoin='miter';ctx.fill();ctx.stroke();ctx.restore();
  }
  function draw(state,ctx,{width=360,height=420,reducedMotion=false}={}){
    const hitY=65,bottom=height-35,laneWidth=width/4;
    ctx.fillStyle='#09172d';ctx.fillRect(0,0,width,height);
    for(let lane=0;lane<4;lane++){
      const x=laneWidth*(lane+.5);ctx.fillStyle=lane%2?'#101e39':'#0c1a32';ctx.fillRect(lane*laneWidth+2,0,laneWidth-4,height);
      const flash=state.flashes[lane],lit=flash&&state.judgeTime-flash.at>=0&&state.judgeTime-flash.at<.18;
      if(lit){ctx.globalAlpha=.22;ctx.fillStyle=flash.kind==='empty'?'#fd8a98':COLORS[lane];ctx.fillRect(lane*laneWidth+2,0,laneWidth-4,height);ctx.globalAlpha=1;}
      drawArrow(ctx,lane,x,hitY,46,lit?(flash.kind==='empty'?'#ef9da9':COLORS[lane]):'#263e62','#587397');
      ctx.fillStyle=COLORS[lane];ctx.globalAlpha=.4;ctx.fillRect(lane*laneWidth+10,hitY+27,laneWidth-20,2);ctx.globalAlpha=1;
      ctx.fillStyle='#99b3d1';ctx.font='12px Trebuchet MS';ctx.textAlign='center';ctx.fillText(['IZQ.','ABAJO','ARRIBA','DER.'][lane],x,height-12);
    }
    for(let i=state.cursor;i<state.notes.length;i++){
      const note=state.notes[i],ahead=note.time-state.judgeTime;if(ahead>state.settings.travel)break;
      if(note.status!=='pending')continue;
      const x=laneWidth*(note.lane+.5),y=hitY+ahead/state.settings.travel*(bottom-hitY);
      if(y>=-30&&y<=height+30)drawArrow(ctx,note.lane,x,y,43,COLORS[note.lane]);
    }
    const judgment=state.lastJudgment;
    if(judgment&&state.judgeTime-judgment.at>=0&&state.judgeTime-judgment.at<.7){
      const labels={perfect:'¡PERFECTO!',good:'¡MUY BIEN!',ok:'¡BIEN!',miss:'Sigue el ritmo',empty:'Espera la flecha'};
      // Feedback stays above the receptors so it never obscures incoming notes.
      const dy=reducedMotion?0:Math.min(4,(state.judgeTime-judgment.at)*6);
      ctx.textAlign='center';ctx.font='bold 20px Trebuchet MS';ctx.lineWidth=5;ctx.strokeStyle='#071528';ctx.strokeText(labels[judgment.kind],width/2,25-dy);
      ctx.fillStyle=['miss','empty'].includes(judgment.kind)?'#c2d1e9':'#ffe68c';ctx.fillText(labels[judgment.kind],width/2,25-dy);
    }
  }
  return {LANES,COLORS,MODES,makeChart,createState,start,advance,hit,pause,finish,accuracy,snapshot,drawArrow,draw};
});
