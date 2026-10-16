(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolPlayground=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TASKS={
    daniel:{type:'football',npc:'daniel',role:'keeper',title:'Ataja con Daniel',copy:'Daniel tira y tú eres el portero. Muévete con ← → y pulsa Enter / A para estirarte. Gana quien consiga primero 3: tú atajadas, Daniel goles.'},
    alexis:{type:'football',npc:'jose_alexis',role:'keeper',title:'Ataja con Alexis',copy:'Alexis tira un poco más rápido. Muévete con ← → y pulsa Enter / A para estirarte. Consigue 3 atajadas antes de que Alexis meta 3 goles.'},
    joaquin:{type:'football',npc:'joaquin',role:'striker',title:'Marca contra Joaquín',copy:'Joaquín es el portero y tú tiras. Apunta con ← → y pulsa Enter / A para patear. Ganas con 3 goles; Joaquín gana con 3 atajadas.'},
    dalila:{type:'rope',npc:'dalila',title:'La cuerda de Dalila',copy:'¡A saltar! Pulsa Enter / A un poquito antes de que la cuerda toque tus pies. Mira la zona dorada. Consigue 10 saltos; tienes 3 oportunidades.'},
    criss:{type:'cleanup',npc:'criss',title:'La explanada con Criss',copy:'Ayuda a Criss a cuidar la escuela. Muévete con las flechas; Enter / A recoge un residuo. Llévalo al contenedor de su tipo y pulsa otra vez. Separa los 9 residuos antes de que terminen los 90 segundos.'}
  };
  const CLEANUP_SECONDS=90;
  const CLEANUP_FRAMES={bins:{paper:[126,88,331,578],bottle:[603,88,330,578],wrapper:[1082,88,331,578]},litter:{paper:[150,726,252,228],bottle:[618,709,297,252],wrapper:[1083,722,345,239]}};
  const BINS=[{type:'paper',name:'Papel',x:170,y:155,color:'#5a9ed1'},{type:'bottle',name:'Envases',x:360,y:155,color:'#e6c35b'},{type:'wrapper',name:'Otros',x:550,y:155,color:'#78af86'}];
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function createState(id){
    if(!Object.hasOwn(TASKS,id))throw new Error('Reto desconocido.');
    return {id,type:TASKS[id].type,role:TASKS[id].role,phase:'intro',time:0,score:0,rival:0,events:[],won:false,message:TASKS[id].copy,
      aim:0,keeperX:360,keeperDir:1,keeperWalking:false,keeperTime:0,dive:0,ball:null,round:1,stage:'ready',wait:0,
      period:1.7,cycle:0,jump:-1,hits:0,misses:0,turns:0,
      player:{x:360,y:363,facing:'up',walking:false,time:0},carrying:null,collected:0,remaining:TASKS[id].type==='cleanup'?CLEANUP_SECONDS:null,tickClock:0,reason:null,
      litter:Array.from({length:9},(_,i)=>({id:i,type:BINS[i%3].type,x:[160,350,540][i%3]+(Math.floor(i/3)%2?28:-15),y:233+Math.floor(i/3)*57,picked:false}))};
  }
  function emit(s,type,data={}){s.events.push({type,...data});}
  function finish(s,won,reason=null){if(s.phase==='complete')return;s.phase='complete';s.won=won;s.reason=reason;
    s.message=won?(s.type==='football'?'¡Ganaste el duelo! ':s.type==='rope'?'¡Diez saltos! ': '¡La explanada está limpia! ')+(s.type==='cleanup'?'Gracias por ayudar a Criss.':'¡Buen trabajo en equipo!'):'¡Buen intento! Puedes volver a practicar.';
    if(reason==='timeout')s.message='¡Se acabó el tiempo! Separaste '+s.collected+' de 9 residuos. Criss te espera para volver a intentarlo.';
    emit(s,'complete',{won,score:s.score,reason});
  }
  function pause(s){if(s.phase!=='playing')return false;s.phase='paused';return true;}
  function resume(s){if(s.phase!=='paused')return false;s.phase='playing';return true;}
  function jumpHeight(s){return s.jump<0?0:Math.sin(Math.min(1,s.jump/.7)*Math.PI)*75;}
  function result(s,success){
    if(success)s.score++;else s.rival++;
    s.stage='result';s.ball=null;
    s.message=s.role==='keeper'?(success?'¡Atajaste! Tu punto.':'¡Gol de '+(s.id==='daniel'?'Daniel':'Alexis')+'!'):(success?'¡Gooool!':'¡Joaquín atajó!');
    emit(s,success?'success':'try');
    if(s.score===3||s.rival===3)finish(s,s.score===3);
  }
  function action(s){
    if(s.phase==='intro'){s.phase='playing';s.message=s.type==='football'?(s.role==='keeper'?'Prepárate: observa hacia dónde va el balón.':'Busca un espacio en la portería y tira.'):s.type==='rope'?'Espera la zona dorada y salta antes del paso de la cuerda.':'Acércate a un residuo y pulsa Enter / A.';return true;}
    if(s.phase==='paused')return resume(s);
    if(s.phase!=='playing')return false;
    if(s.type==='football'){
      if(s.stage==='result'){s.stage='ready';s.wait=0;s.round++;s.keeperX=360;s.dive=0;s.message=s.role==='keeper'?'Prepárate para el siguiente tiro.':'Apunta y vuelve a tirar.';return true;}
      if(s.role==='striker'&&s.stage==='ready'){s.ball={target:360+s.aim*185,progress:0,x:360,y:355};s.stage='shot';emit(s,'kick');return true;}
      if(s.role==='keeper'&&s.dive===0){s.dive=.45;emit(s,'jump');return true;}
      return false;
    }
    if(s.type==='rope'){
      if(s.jump>=0)return false;s.jump=0;emit(s,'jump');return true;
    }
    const p=s.player;
    if(s.carrying){
      const bin=BINS.find(b=>Math.hypot(b.x-p.x,b.y+33-p.y)<65);
      if(!bin){s.message='Llevas '+label(s.carrying.type)+'. Acércate a su contenedor.';return false;}
      if(bin.type!==s.carrying.type){s.message='Ese residuo va en '+BINS.find(b=>b.type===s.carrying.type).name+'. ¡Busca su letrero!';emit(s,'try');return false;}
      const deposit={type:s.carrying.type,fromX:p.x+20,fromY:p.y-49,toX:bin.x,toY:bin.y-52};
      s.carrying=null;s.collected++;s.score=s.collected;s.message='¡Bien separado! '+s.collected+' de 9 residuos.';emit(s,'success',{deposit});
      if(s.collected===9)finish(s,true);return true;
    }
    const nearest=s.litter.filter(item=>!item.picked).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    if(!nearest||Math.hypot(nearest.x-p.x,nearest.y-p.y)>43){s.message='Acércate un poco más al residuo.';return false;}
    nearest.picked=true;s.carrying={id:nearest.id,type:nearest.type};s.message='Recogiste '+label(nearest.type)+'. Llévalo a '+BINS.find(b=>b.type===nearest.type).name+'.';emit(s,'pickup');return true;
  }
  function label(type){return {paper:'un papel',bottle:'una botella',wrapper:'una envoltura'}[type];}
  function tick(s,dt,input={},random=Math.random){
    if(s.phase!=='playing')return;dt=clamp(Number(dt)||0,0,.05);s.time+=dt;
    if(s.type==='cleanup'){
      const interval=s.remaining<=10.000001?.5:1;
      s.remaining=Math.max(0,CLEANUP_SECONDS-s.time);
      if(s.remaining<.000001){s.remaining=0;finish(s,false,'timeout');return;}
      s.tickClock+=dt;
      if(s.tickClock+.000001>=interval){s.tickClock=Math.max(0,s.tickClock-interval);emit(s,'timer-tick',{urgent:s.remaining<=10.000001,seconds:Math.ceil(s.remaining)});}
    }
    const x=clamp(Number(input.x)||0,-1,1),y=clamp(Number(input.y)||0,-1,1);
    if(s.type==='football'){
      const keeperStart=s.keeperX;s.keeperWalking=false;
      if(s.stage==='result')return;
      if(s.role==='keeper'){s.keeperX=clamp(s.keeperX+x*360*dt,170,550);s.dive=Math.max(0,s.dive-dt);}
      else if(s.stage==='ready'){s.aim=clamp(s.aim+x*1.8*dt,-1,1);s.keeperX=360+Math.sin(s.time*1.4)*148;}
      if(s.stage==='ready'&&s.role==='keeper'){
        s.wait+=dt;
        if(s.wait>=(s.id==='alexis'?1.35:1.85)){
          const n=clamp(Number(random())||0,0,1);s.ball={target:180+n*360,progress:0,x:360,y:355};s.stage='shot';s.message='¡Tiro! Sigue el balón.';emit(s,'kick');
        }
      }
      if(s.stage==='shot'&&s.ball){
        const ball=s.ball;
        if(s.role==='striker'){const delta=ball.target-s.keeperX;s.keeperX+=Math.sign(delta)*Math.min(Math.abs(delta),130*dt);}
        ball.progress=clamp(ball.progress+dt/(s.id==='alexis'?.65:.88),0,1);
        ball.x=360+(ball.target-360)*ball.progress;ball.y=355-201*ball.progress;
        if(ball.progress>=1){const saved=Math.abs(ball.target-s.keeperX)<=(s.role==='keeper'&&s.dive>0?76:37);result(s,s.role==='keeper'?saved:!saved);}
      }
      const travelled=Math.abs(s.keeperX-keeperStart);s.keeperWalking=travelled>.0001;s.keeperTime+=travelled/165;
    }else if(s.type==='rope'){
      if(s.jump>=0){s.jump+=dt;if(s.jump>=.7)s.jump=-1;}
      s.cycle+=dt;
      if(s.cycle>=s.period){
        const success=jumpHeight(s)>23;s.cycle-=s.period;s.turns++;
        if(success){s.hits++;s.score=s.hits;s.message='¡'+s.hits+' de 10 saltos!';emit(s,'success');}
        else{s.misses++;s.message='La cuerda tocó tus pies. Te quedan '+(3-s.misses)+' oportunidades.';emit(s,'try');}
        s.period=Math.max(1.3,1.7-s.hits*.035);
        if(s.hits===10||s.misses===3)finish(s,s.hits===10);
      }
    }else{
      const length=Math.max(1,Math.hypot(x,y)),p=s.player;
      const startX=p.x,startY=p.y;
      if(Math.hypot(x,y)>.1)p.facing=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
      p.x=clamp(p.x+x/length*230*dt,65,655);p.y=clamp(p.y+y/length*230*dt,185,390);
      const travelled=Math.hypot(p.x-startX,p.y-startY);p.walking=travelled>.0001;p.time+=travelled/165;
    }
  }
  function snapshot(s){return {id:s.id,type:s.type,phase:s.phase,stage:s.stage,score:s.score,rival:s.rival,won:s.won,hits:s.hits,misses:s.misses,collected:s.collected,carrying:s.carrying?.type||null,message:s.message,remaining:s.remaining===null?null:Math.max(0,Math.round(s.remaining*1000)/1000),reason:s.reason};}
  return {TASKS,BINS,CLEANUP_SECONDS,CLEANUP_FRAMES,createState,action,tick,pause,resume,jumpHeight,snapshot};
});
