(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PacmanGame=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAZE=[
    '#####################',
    '#o........#........o#',
    '#.###.###.#.###.###.#',
    '#...................#',
    '#.###.#.#####.#.###.#',
    '#.....#...#...#.....#',
    '#####.### # ###.#####',
    '#####.#       #.#####',
    '#####.# ##=## #.#####',
    '     .  #   #  .     ',
    '#####.# #   # #.#####',
    '#####.# ##### #.#####',
    '#####.#       #.#####',
    '#.........#.........#',
    '#.###.###.#.###.###.#',
    '#...#...........#...#',
    '###.#.#.#####.#.#.###',
    '#.....#...#...#.....#',
    '#.#######.#.#######.#',
    '#......... .........#',
    '#.###.###.#.###.###.#',
    '#o........#........o#',
    '#####################'
  ];
  const COLS=MAZE[0].length,ROWS=MAZE.length,TILE=20,POWER_SECONDS=22;
  const DIRS={left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}},OPPOSITE={left:'right',right:'left',up:'down',down:'up'};
  const GHOSTS=[{name:'Blinky',color:'#ff555a',x:10,y:7,dir:'left',delay:0,corner:{x:19,y:1}},{name:'Pinky',color:'#ff9ccd',x:9,y:9,dir:'up',delay:1.4,corner:{x:1,y:1}},{name:'Inky',color:'#65e4ed',x:10,y:9,dir:'up',delay:2.6,corner:{x:19,y:21}},{name:'Clyde',color:'#ffb85a',x:11,y:9,dir:'up',delay:3.8,corner:{x:1,y:21}}];
  const boundedRandom=random=>Math.max(0,Math.min(.999999999,Number(random())||0));
  function shuffle(values,random){const result=[...values];for(let n=result.length-1;n>0;n--){const i=Math.floor(boundedRandom(random)*(n+1));[result[n],result[i]]=[result[i],result[n]];}return result;}
  function makeQuestion(maxAddend=9,random=Math.random){
    const limit=maxAddend===49?49:9,a=Math.floor(boundedRandom(random)*(limit+1)),b=Math.floor(boundedRandom(random)*(limit+1)),answer=a+b,options=new Set([answer]);
    for(let n=0;n<24&&options.size<4;n++){const value=answer+Math.floor(boundedRandom(random)*7)-3;if(value>=0)options.add(value);}
    for(let value=Math.max(0,answer-3);options.size<4;value++)options.add(value);
    return {a,b,text:a+' + '+b,answer,options:shuffle(options,random)};
  }
  function cell(x,y){return MAZE[y]?.[x]??'#';}
  function canEnter(x,y,ghost=false){const tile=cell(x,y);return tile!=='#'&&(ghost||tile!=='=');}
  function neighbors(x,y,ghost=false){
    const result=[];
    for(const [dir,vector] of Object.entries(DIRS)){
      let nx=x+vector.x,ny=y+vector.y;
      if(y===9&&ny===9){if(nx<0)nx=COLS-1;else if(nx>=COLS)nx=0;}
      if(canEnter(nx,ny,ghost))result.push({x:nx,y:ny,dir});
    }
    return result;
  }
  function nearestTile(target,ghost=true){
    const x=Math.max(0,Math.min(COLS-1,Math.round(target.x))),y=Math.max(0,Math.min(ROWS-1,Math.round(target.y)));
    if(canEnter(x,y,ghost))return {x,y};
    for(let r=1;r<COLS+ROWS;r++)for(let dx=-r;dx<=r;dx++)for(const dy of [r-Math.abs(dx),Math.abs(dx)-r])if(canEnter(x+dx,y+dy,ghost))return {x:x+dx,y:y+dy};
    return {x:10,y:7};
  }
  function distanceMap(target,ghost=true){
    const start=nearestTile(target,ghost),distances=new Map([[start.y*COLS+start.x,0]]),queue=[start];
    for(let n=0;n<queue.length;n++){const tile=queue[n],nextDistance=distances.get(tile.y*COLS+tile.x)+1;for(const next of neighbors(tile.x,tile.y,ghost)){const key=next.y*COLS+next.x;if(!distances.has(key)){distances.set(key,nextDistance);queue.push(next);}}}
    return distances;
  }
  function actor(x,y,dir){return {x,y,dir,nextX:null,nextY:null,progress:0};}
  function position(item){const direction=DIRS[item.dir];return item.nextX===null?{x:item.x,y:item.y}:{x:item.x+direction.x*item.progress,y:item.y+direction.y*item.progress};}
  function distance(a,b){let dx=Math.abs(a.x-b.x);if(Math.abs(a.y-9)<.7&&Math.abs(b.y-9)<.7)dx=Math.min(dx,COLS-dx);return Math.hypot(dx,a.y-b.y);}
  function reverse(item){if(item.nextX!==null){const x=item.x,y=item.y;item.x=item.nextX;item.y=item.nextY;item.nextX=x;item.nextY=y;item.progress=1-item.progress;}item.dir=OPPOSITE[item.dir];}
  function emit(state,type,data={}){state.events.push({type,...data});}
  function giveScore(state,value){
    state.score+=value;state.highScore=Math.max(state.highScore,state.score);
    if(state.score>=state.nextExtraLife){if(state.lives<5){state.lives++;emit(state,'extra-life');}state.nextExtraLife+=10000;}
  }
  function placeActors(state){
    state.player=actor(10,19,'left');state.wanted='left';state.power=0;state.educational=false;state.combo=0;
    state.ghosts=GHOSTS.map((ghost,index)=>({...actor(ghost.x,ghost.y,ghost.dir),id:index,name:ghost.name,color:ghost.color,corner:{...ghost.corner},delay:ghost.delay,mode:'normal',answer:state.question.options[index]}));
  }
  function buildLevel(state){
    state.food=MAZE.map(row=>Array.from(row,tile=>tile==='.'?1:tile==='o'?2:0));state.dotsLeft=state.food.flat().filter(Boolean).length;state.foodEaten=0;
    state.question=makeQuestion(state.maxAddend,state.random);state.levelTime=0;state.fruit=null;state.fruitOffered=false;placeActors(state);
  }
  function createState({random=Math.random,highScore=0,maxAddend=9}={}){
    const state={phase:'intro',previousPhase:null,level:1,score:0,highScore:Number.isFinite(highScore)?Math.max(0,Math.floor(highScore)):0,lives:3,nextExtraLife:10000,correct:0,wrong:0,random,maxAddend:maxAddend===49?49:9,time:0,stageTimer:0,events:[],message:'Come una bolita grande, resuelve la suma y busca el fantasma correcto.'};
    buildLevel(state);return state;
  }
  function start(state){
    if(state.phase!=='intro'&&state.phase!=='gameover')return false;
    state.level=1;state.score=0;state.lives=3;state.correct=0;state.wrong=0;state.nextExtraLife=10000;buildLevel(state);state.phase='ready';state.stageTimer=1.2;state.message='¡Listo!';emit(state,'start');return true;
  }
  function setRange(state,value){if(state.phase!=='intro'&&state.phase!=='gameover')return false;state.maxAddend=Number(value)===49?49:9;buildLevel(state);return true;}
  function setDirection(state,dir){if(!DIRS[dir]||state.phase!=='playing')return false;state.wanted=dir;return true;}
  function pause(state){
    if(state.phase==='paused'){state.phase=state.previousPhase;state.previousPhase=null;return false;}
    if(!['playing','ready','levelclear','dying'].includes(state.phase))return false;
    state.previousPhase=state.phase;state.phase='paused';return true;
  }
  function activatePower(state){
    state.power=POWER_SECONDS;state.educational=true;state.combo=0;
    for(const ghost of state.ghosts)if(ghost.mode!=='returning'){ghost.mode='frightened';ghost.delay=0;reverse(ghost);}
    state.message='Resuelve '+state.question.text+' y alcanza al fantasma correcto.';emit(state,'power');
  }
  function replenishPower(state){
    if(state.food.some(row=>row.includes(2)))return;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(cell(x,y)==='o'){if(!state.food[y][x])state.dotsLeft++;state.food[y][x]=2;}
  }
  function eatFood(state){
    const {x,y}=state.player,value=state.food[y]?.[x];if(!value)return;
    state.food[y][x]=0;state.dotsLeft--;state.foodEaten++;giveScore(state,value===2?50:10);
    if(value===2)activatePower(state);else emit(state,'dot');
    if(!state.fruitOffered&&state.foodEaten>=60){state.fruitOffered=true;state.fruit={x:10,y:12,time:12};}
    if(state.dotsLeft===0&&state.power<=0){replenishPower(state);state.message='¡Laberinto limpio! Recarga el poder para resolver la suma.';}
  }
  function winLevel(state){giveScore(state,500);state.correct++;state.phase='levelclear';state.stageTimer=2.2;state.message='¡Correcto! '+state.question.text+' = '+state.question.answer;emit(state,'correct',{answer:state.question.answer,bonus:500});}
  function loseLife(state){
    if(state.phase!=='playing')return;
    state.lives--;state.phase='dying';state.stageTimer=1.1;state.power=0;state.educational=false;state.message=state.lives?'¡Otra oportunidad!':'Fin de la partida';emit(state,'death');
  }
  function checkGhosts(state){
    const player=position(state.player);
    for(const ghost of state.ghosts){
      if(ghost.mode==='returning'||ghost.delay>0||distance(player,position(ghost))>.63)continue;
      if(state.power>0&&ghost.mode==='frightened'){
        if(ghost.answer===state.question.answer){winLevel(state);return;}
        state.wrong++;giveScore(state,200*Math.pow(2,Math.min(3,state.combo++)));ghost.mode='returning';ghost.delay=0;
        state.message='Ese fantasma llevaba '+ghost.answer+'. Sigue buscando: '+state.question.text+' = ?';emit(state,'wrong',{answer:ghost.answer});
      }else{loseLife(state);return;}
    }
  }
  function advance(item,distanceToMove,choose,onArrival=()=>{}){
    let remaining=distanceToMove;
    while(remaining>1e-8){
      if(item.nextX===null){const next=choose();if(!next)return;item.dir=next.dir;item.nextX=next.x;item.nextY=next.y;}
      const amount=Math.min(remaining,1-item.progress);item.progress+=amount;remaining-=amount;
      if(item.progress>=1-1e-8){item.x=item.nextX;item.y=item.nextY;item.nextX=item.nextY=null;item.progress=0;if(onArrival()===false)return;}
    }
  }
  function playerChoice(state){const possible=neighbors(state.player.x,state.player.y);return possible.find(next=>next.dir===state.wanted)||possible.find(next=>next.dir===state.player.dir)||null;}
  function ghostChoice(state,ghost){
    let possible=neighbors(ghost.x,ghost.y,true);if(!possible.length)return null;
    const forward=possible.filter(next=>next.dir!==OPPOSITE[ghost.dir]);if(forward.length)possible=forward;
    if(ghost.mode==='frightened'&&!(ghost.x>=9&&ghost.x<=11&&ghost.y>=9&&ghost.y<=10)){
      const distances=distanceMap(position(state.player));
      if(boundedRandom(state.random)<.22)return possible[Math.floor(boundedRandom(state.random)*possible.length)];
      return possible.sort((a,b)=>(distances.get(b.y*COLS+b.x)??0)-(distances.get(a.y*COLS+a.x)??0))[0];
    }
    let target;
    if(ghost.mode==='returning')target={x:10,y:9};
    else if(ghost.x>=9&&ghost.x<=11&&ghost.y>=9&&ghost.y<=10)target={x:10,y:7};
    else if(state.levelTime%27<6)target=ghost.corner;
    else{
      const player=position(state.player),direction=DIRS[state.player.dir];
      target=ghost.id===0?player:ghost.id===1?{x:player.x+direction.x*3,y:player.y+direction.y*3}:ghost.id===2?{x:player.x-direction.y*3,y:player.y+direction.x*3}:distance(position(ghost),player)<6?ghost.corner:player;
    }
    const distances=distanceMap(target);
    return possible.sort((a,b)=>(distances.get(a.y*COLS+a.x)??Infinity)-(distances.get(b.y*COLS+b.x)??Infinity))[0];
  }
  function playStep(state,dt){
    state.levelTime+=dt;
    if(state.power>0){state.power=Math.max(0,state.power-dt);if(!state.power){state.educational=false;for(const ghost of state.ghosts)if(ghost.mode==='frightened')ghost.mode='normal';replenishPower(state);emit(state,'power-end');state.message='Busca otra bolita grande para activar las respuestas.';}}
    const player=state.player;if(player.nextX!==null&&state.wanted===OPPOSITE[player.dir])reverse(player);
    advance(player,dt*(5+Math.min(.65,(state.level-1)*.08)),()=>playerChoice(state),()=>{eatFood(state);return state.phase==='playing';});
    for(const ghost of state.ghosts){
      if(ghost.delay>0){ghost.delay=Math.max(0,ghost.delay-dt);continue;}
      const speed=ghost.mode==='returning'?7:ghost.mode==='frightened'?2.5:3.15+Math.min(1.3,(state.level-1)*.1);
      advance(ghost,dt*speed,()=>ghostChoice(state,ghost),()=>{
        if(ghost.mode==='returning'&&ghost.x===10&&ghost.y===9){ghost.mode=state.power>0?'frightened':'normal';ghost.delay=1.2;return false;}
      });
    }
    if(state.fruit){state.fruit.time-=dt;if(state.fruit.time<=0)state.fruit=null;else if(distance(position(player),state.fruit)<.55){state.fruit=null;giveScore(state,100);emit(state,'fruit');}}
    checkGhosts(state);
  }
  function tick(state,seconds){
    const dt=Math.max(0,Math.min(.1,Number(seconds)||0));if(state.phase==='paused'||state.phase==='gameover'||state.phase==='intro')return;
    state.time+=dt;
    if(state.phase!=='playing'){
      state.stageTimer-=dt;if(state.stageTimer>0)return;
      if(state.phase==='levelclear'){state.level++;buildLevel(state);state.phase='ready';state.stageTimer=1.2;state.message='¡Nivel '+state.level+'!';emit(state,'level');}
      else if(state.phase==='dying'){if(state.lives<=0){state.phase='gameover';emit(state,'gameover');}else{placeActors(state);replenishPower(state);state.phase='ready';state.stageTimer=1.2;state.message='¡Tú puedes!';}}
      else if(state.phase==='ready')state.phase='playing';
      return;
    }
    for(let remaining=dt;remaining>1e-8&&state.phase==='playing';remaining-=Math.min(1/120,remaining))playStep(state,Math.min(1/120,remaining));
  }
  function pixelPac(ctx,x,y,dir,frame,scale=1){
    ctx.fillStyle='#ffe239';const vector=DIRS[dir],open=frame?.62:.16;
    for(let py=0;py<16;py++)for(let px=0;px<16;px++){
      const dx=px-7.5,dy=py-7.5,a=dx*vector.x+dy*vector.y,b=-dx*vector.y+dy*vector.x;
      if(dx*dx+dy*dy<58&&!(a>0&&Math.abs(b)<a*open))ctx.fillRect(Math.round(x)+(px-8)*scale,Math.round(y)+(py-8)*scale,scale,scale);
    }
  }
  function pixelGhost(ctx,x,y,ghost,time,power){
    const eyeOnly=ghost.mode==='returning',blue=ghost.mode==='frightened'&&power>0,flash=blue&&power<4&&Math.floor(time*6)%2===0;
    if(!eyeOnly){ctx.fillStyle=blue?(flash?'#f5ead0':'#243feb'):ghost.color;const frame=Math.floor(time*8)%2;
      for(let py=0;py<16;py++)for(let px=0;px<16;px++){
        const curve=py<6?(px-7.5)**2+(py-7.5)**2<58:px>0&&px<15;
        const foot=py<13||(frame?(px<5||px>10||px===7||px===8):(px<3||px>12||px>5&&px<10));
        if(curve&&foot)ctx.fillRect(Math.round(x)+px-8,Math.round(y)+py-8,1,1);
      }
    }
    if(blue){ctx.fillStyle=flash?'#fa4c55':'#ffe8d5';ctx.fillRect(Math.round(x)-4,Math.round(y)-2,2,2);ctx.fillRect(Math.round(x)+2,Math.round(y)-2,2,2);for(let n=0;n<8;n++)ctx.fillRect(Math.round(x)-4+n,Math.round(y)+3+n%2,1,1);}
    else{const vector=DIRS[ghost.dir];ctx.fillStyle='#fff8e8';for(const offset of [-5,2]){ctx.fillRect(Math.round(x)+offset,Math.round(y)-4,4,5);ctx.fillStyle='#3d50e5';ctx.fillRect(Math.round(x)+offset+1+vector.x,Math.round(y)-2+vector.y,2,2);ctx.fillStyle='#fff8e8';}}
  }
  function draw(state,ctx,{reducedMotion=false}={}){
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#030815';ctx.fillRect(0,0,COLS*TILE,ROWS*TILE);
    const glow=state.phase==='levelclear'&&!reducedMotion&&Math.floor(state.time*6)%2;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      if(cell(x,y)==='#'){
        ctx.fillStyle='#09102a';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);ctx.fillStyle=glow?'#e6f5ff':'#344afa';
        if(cell(x-1,y)!=='#')ctx.fillRect(x*TILE+2,y*TILE,2,TILE);
        if(cell(x+1,y)!=='#')ctx.fillRect((x+1)*TILE-4,y*TILE,2,TILE);
        if(cell(x,y-1)!=='#')ctx.fillRect(x*TILE,y*TILE+2,TILE,2);
        if(cell(x,y+1)!=='#')ctx.fillRect(x*TILE,(y+1)*TILE-4,TILE,2);
      }else if(cell(x,y)==='='){ctx.fillStyle='#ff9ccd';ctx.fillRect(x*TILE,y*TILE+8,TILE,3);}
      const food=state.food[y][x];ctx.fillStyle='#ffdbad';
      if(food===1)ctx.fillRect(x*TILE+9,y*TILE+9,3,3);
      if(food===2&&(reducedMotion||Math.floor(state.time*3)%2===0)){ctx.fillStyle='#fff5a4';ctx.fillRect(x*TILE+6,y*TILE+6,8,8);ctx.fillRect(x*TILE+4,y*TILE+8,12,4);}
    }
    if(state.fruit){const x=state.fruit.x*TILE,y=state.fruit.y*TILE;ctx.fillStyle='#55d87a';ctx.fillRect(x+8,y+4,2,6);ctx.fillRect(x+10,y+3,4,2);ctx.fillStyle='#ff475c';ctx.fillRect(x+3,y+9,6,6);ctx.fillRect(x+11,y+9,6,6);ctx.fillStyle='#fff4e4';ctx.fillRect(x+4,y+10,2,2);ctx.fillRect(x+12,y+10,2,2);}
    const labels=[];
    for(const ghost of state.ghosts){const p=position(ghost),x=Math.round((p.x+.5)*TILE),y=Math.round((p.y+.5)*TILE);pixelGhost(ctx,x,y,ghost,state.time,state.power);
      if(x<10)pixelGhost(ctx,x+COLS*TILE,y,ghost,state.time,state.power);if(x>COLS*TILE-10)pixelGhost(ctx,x-COLS*TILE,y,ghost,state.time,state.power);
      if(state.educational&&ghost.mode!=='returning'&&ghost.delay<=0&&!(p.x>=8&&p.x<=12&&p.y>=8&&p.y<=11)){
        const text=String(ghost.answer);ctx.font='bold 16px monospace';const width=ctx.measureText(text).width+8;let top=y-30;
        while(labels.some(label=>Math.abs(label.x-x)<(label.w+width)/2&&Math.abs(label.y-top)<20))top-=21;
        labels.push({x,y:top,w:width});ctx.fillStyle='#060b1b';ctx.fillRect(x-width/2,top,width,20);ctx.strokeStyle=ghost.color;ctx.lineWidth=1;ctx.strokeRect(x-width/2,top,width,20);ctx.fillStyle='#fffbed';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,top+10);
      }
    }
    const p=position(state.player),x=(p.x+.5)*TILE,y=(p.y+.5)*TILE;
    if(state.phase==='dying'){ctx.fillStyle='#ffe239';const radius=8*Math.max(.05,state.stageTimer/1.1);ctx.fillRect(x-radius,y-radius,radius*2,radius*2);}
    else{const frame=state.player.nextX!==null&&Math.floor(state.time*11)%2;pixelPac(ctx,x,y,state.player.dir,frame);if(x<10)pixelPac(ctx,x+COLS*TILE,y,state.player.dir,frame);if(x>COLS*TILE-10)pixelPac(ctx,x-COLS*TILE,y,state.player.dir,frame);}
    ctx.restore();
  }
  function snapshot(state){return {phase:state.phase,score:state.score,highScore:state.highScore,level:state.level,lives:state.lives,correct:state.correct,wrong:state.wrong,power:Math.ceil(state.power),operation:state.question.text,answers:state.question.options.slice(),player:position(state.player),ghosts:state.ghosts.map(ghost=>({name:ghost.name,mode:ghost.mode,answer:ghost.answer,position:position(ghost)}))};}
  return {MAZE,COLS,ROWS,TILE,POWER_SECONDS,DIRS,GHOSTS,makeQuestion,canEnter,neighbors,distanceMap,position,createState,start,setRange,setDirection,pause,tick,draw,snapshot};
});
