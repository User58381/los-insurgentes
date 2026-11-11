(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolHideSeek=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const AREA={left:322,right:938,top:735,bottom:880};
  const SPOTS=[
    {x:365,y:755,label:'junto al teatro',kind:'planter'},
    {x:470,y:746,label:'frente a los salones',kind:'screen'},
    {x:620,y:748,label:'en el lado norte de la explanada',kind:'planter'},
    {x:780,y:748,label:'frente a los salones del este',kind:'screen'},
    {x:907,y:782,label:'cerca de usos múltiples',kind:'planter'},
    {x:875,y:865,label:'en la esquina sureste de la explanada',kind:'screen'},
    {x:704,y:866,label:'en el lado sur de la explanada',kind:'planter'},
    {x:495,y:865,label:'en el lado sur, cerca del teatro',kind:'screen'}
  ];
  function shuffle(list,random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function create(game,playerId,random=Math.random){
    const valid=SPOTS.filter(s=>game.canStand('outside',s.x,s.y)&&game.canStand('outside',s.x,s.y+10));
    const students=shuffle(game.STUDENTS.filter(s=>s.id!=='romina'&&s.id!==playerId),random);
    const ids=playerId==='romina'?students.slice(0,5).map(s=>s.id):['romina',...students.slice(0,4).map(s=>s.id)];
    if(valid.length<ids.length)throw new Error('No hay suficientes escondites accesibles.');
    return {phase:'ready',countdown:5,remaining:120,tickClock:0,hintClock:0,hintIndex:null,found:0,won:false,awarded:false,
      spots:shuffle(valid,random).slice(0,ids.length).map((s,i)=>({...s,id:ids[i],found:false})),events:[],message:'Romina y cuatro compañeros se esconderán en la explanada.'};
  }
  function start(s){if(!['ready','complete'].includes(s.phase))return false;s.phase='counting';s.countdown=5;s.remaining=120;s.tickClock=0;s.found=0;s.won=false;s.awarded=false;s.hintIndex=null;s.spots.forEach(p=>p.found=false);s.message='Cuenta hasta cinco mientras se esconden…';return true;}
  function pause(s){if(['playing','counting'].includes(s.phase)){s.resume=s.phase;s.phase='paused';return true;}if(s.phase==='paused'){s.phase=s.resume||'playing';return true;}return false;}
  function nearby(s,p){if(s.phase!=='playing')return null;return s.spots.filter(t=>!t.found&&Math.hypot(t.x-p.x,t.y-p.y)<53).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;}
  function search(s,p,game){
    if(s.phase!=='playing')return false;const target=nearby(s,p);
    if(!target){s.message='Acércate a una jardinera o al biombo de colores y pulsa Enter / A.';return false;}
    target.found=true;s.found++;s.hintIndex=null;s.message='¡Encontraste a '+game.STUDENTS.find(a=>a.id===target.id).name+'! '+s.found+' de '+s.spots.length+'.';s.events.push({type:'found',id:target.id});
    if(s.found===s.spots.length){s.phase='complete';s.won=true;s.events.push({type:'complete',won:true});}return true;
  }
  function hint(s,p){if(s.phase!=='playing')return '';const target=s.spots.filter(t=>!t.found).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!target)return '';s.hintIndex=s.spots.indexOf(target);s.hintClock=5;s.message='Pista: busca '+target.label+'. Sigue el aro dorado.';return s.message;}
  function tick(s,dt){
    if(!['playing','counting'].includes(s.phase))return;dt=Math.max(0,Math.min(.1,Number(dt)||0));s.hintClock=Math.max(0,s.hintClock-dt);if(!s.hintClock)s.hintIndex=null;
    s.tickClock+=dt;const period=s.phase==='playing'&&s.remaining<=10?.5:1;
    if(s.tickClock>=period){s.tickClock-=period;s.events.push({type:'timer-tick',urgent:s.phase==='playing'&&s.remaining<=10});}
    if(s.phase==='counting'){s.countdown=Math.max(0,s.countdown-dt);if(s.countdown===0){s.phase='playing';s.tickClock=0;s.message='¡Listos o no, allá voy! Busca en los cinco escondites.';s.events.push({type:'start'});}return;}
    s.remaining=Math.max(0,s.remaining-dt);if(!s.remaining){s.phase='complete';s.won=false;s.message='¡Se acabó el tiempo! Romina te invita a intentarlo otra vez.';s.events.push({type:'complete',won:false});}
  }
  function award(s,state){if(s.phase!=='complete'||!s.won||s.awarded)return false;s.awarded=true;const old=state.challenges.romina||{won:false,best:0,wins:0};state.challenges.romina={won:true,best:Math.max(old.best,Math.ceil(s.remaining)),wins:old.wins+1};if(!old.won)state.points+=80;return true;}
  return {AREA,SPOTS,create,start,pause,nearby,search,hint,tick,award};
});
