(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolAdventureSave=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // These keys describe the save format, never the deployment number.
  const KEY='insurgentes-adventure-v1',BACKUP=KEY+'-backup',FORMAT='los-insurgentes-aventura';
  const RECORD_KEYS=['insurgentes-pacman-record-v1','insurgentes-theater-record-v1','insurgentes-sound'];
  const TASK_IDS=['daniel','alexis','joaquin','dalila','criss'];
  const copy=value=>JSON.parse(JSON.stringify(value));
  function number(value,name,max=100000000){if(!Number.isFinite(value)||value<0||value>max)throw new Error('Dato no válido: '+name);return value;}
  function validate(game,characters,value){
    if(!value||value.format!==FORMAT||value.version!==1)throw new Error('El archivo no es una partida compatible.');
    if(!characters.find(game,value.playerId))throw new Error('El personaje de la partida no existe.');
    const out={format:FORMAT,version:1,playerId:value.playerId,started:value.started===true,scene:value.scene==='classroom'?'classroom':'outside',
      position:{x:number(value.position?.x,'posición X',2000),y:number(value.position?.y,'posición Y',2000),facing:['up','down','left','right'].includes(value.position?.facing)?value.position.facing:'down'},
      points:Math.floor(number(value.points,'puntos')),goals:Math.floor(number(value.goals,'goles')),completed:{},won:value.won===true,
      day:value.day==='auto'?'auto':Number.isInteger(value.day)&&value.day>=1&&value.day<=5?value.day:'auto',challenges:{},quiz:null,
      unlocks:{cleanup:value.unlocks?.cleanup===true||value.challenges?.criss?.won===true}};
    for(const key of ['fountain','classroom','field'])out.completed[key]=value.completed?.[key]===true;
    for(const key of TASK_IDS){const row=value.challenges?.[key];if(row)out.challenges[key]={won:row.won===true,best:Math.floor(number(row.best,'récord',10000)),wins:Math.floor(number(row.wins,'victorias',1000000))};}
    if(value.quiz){const q=value.quiz;if(!Object.hasOwn(game.QUESTIONS,q.station)||!Number.isInteger(q.index)||q.index<0||q.index>=game.QUESTIONS[q.station].length)throw new Error('Pregunta guardada no válida.');
      out.quiz={station:q.station,index:q.index,correct:q.correct===true,awarded:q.awarded===true,feedback:q.correct?'¡Correcto! Bien pensado.':''};}
    return out;
  }
  function capture(state){return {format:FORMAT,version:1,playerId:state.player.id,started:!!state.started,scene:state.scene,
    position:{x:state.player.x,y:state.player.y,facing:state.player.facing},points:state.points,goals:state.goals,completed:{...state.completed},won:!!state.won,
    day:state.dayMode==='auto'?'auto':state.schoolDay,challenges:copy(state.challenges||{}),quiz:state.quiz?copy(state.quiz):null,unlocks:{cleanup:state.unlocks?.cleanup===true}};}
  function restore(game,characters,state,value){
    const data=validate(game,characters,value);characters.select(game,state,data.playerId);
    state.scene=data.scene;
    if(game.canStand(data.scene,data.position.x,data.position.y)){Object.assign(state.player,data.position);}
    else {state.player.x=data.scene==='classroom'?640:1034;state.player.y=data.scene==='classroom'?705:1174;}
    Object.assign(state,{points:data.points,goals:data.goals,completed:data.completed,won:data.won,started:data.started,challenges:data.challenges,quiz:data.quiz,unlocks:data.unlocks});
    game.setSchoolDay(state,data.day);return state;
  }
  function createStore(game,characters,storage){
    let last='',message='',available=true;
    function load(){
      let raw=null;try{raw=storage.getItem(KEY);if(raw){const result=validate(game,characters,JSON.parse(raw));last=raw;return result;}}
      catch(_){message='Se recuperará la copia anterior de tu partida.';}
      if(raw){try{const backup=storage.getItem(BACKUP);if(backup){const result=validate(game,characters,JSON.parse(backup));return result;}}catch(_){}
        available=false;message='No se pudo leer la partida. Conservamos el archivo original; puedes importar una copia.';}
      return null;
    }
    function save(state,force=false){
      if(!available)return false;
      try{const next=JSON.stringify(validate(game,characters,capture(state)));if(next===last)return true;
        const old=storage.getItem(KEY);
        // Only a valid previous save can become the recovery copy.
        if(old&&old!==next){try{validate(game,characters,JSON.parse(old));storage.setItem(BACKUP,old);}catch(_){}}
        storage.setItem(KEY,next);last=next;message='Partida guardada automáticamente.';return true;
      }catch(_){message='No se pudo guardar. Exporta una copia desde el mapa antes de cerrar.';return false;}
    }
    function bundle(state,settings){
      const records={};for(const key of RECORD_KEYS){try{const value=storage.getItem(key);if(value!==null)records[key]=value;}catch(_){}}
      return JSON.stringify({format:'los-insurgentes-copia-completa',version:1,exportedAt:new Date().toISOString(),progress:validate(game,characters,capture(state)),school:JSON.parse(settings.exportSave()),records},null,2);
    }
    function parseBundle(text,settingsDefaults,schoolSettings){
      if(typeof text!=='string'||text.length>262144)throw new Error('La copia debe ser un JSON de menos de 256 KB.');
      let data;try{data=JSON.parse(text);}catch(_){throw new Error('No se pudo leer el archivo JSON.');}
      if(data.format!=='los-insurgentes-copia-completa'||data.version!==1)throw new Error('Selecciona una copia completa de Los Insurgentes. Para ajustes antiguos, usa Importar guardado en el editor.');
      const progress=validate(game,characters,data.progress),school=schoolSettings.validate(data.school,settingsDefaults),records={};
      for(const key of RECORD_KEYS)if(data.records?.[key]!==undefined){
        const raw=data.records[key];if(typeof raw!=='string'||raw.length>4096)throw new Error('Récord no válido.');
        if(key!=='insurgentes-sound'){const record=JSON.parse(raw);if(!record||Array.isArray(record)||typeof record!=='object')throw new Error('Récord no válido.');}
        else if(!['yes','no'].includes(raw))throw new Error('Ajuste de sonido no válido.');
        records[key]=raw;
      }
      return {progress,school,records};
    }
    return {load,save,bundle,parseBundle,status:()=>message,allowSaving(){available=true;},restoreRecords(records){for(const key of RECORD_KEYS)if(records[key]!==undefined)storage.setItem(key,records[key]);}};
  }
  return {KEY,BACKUP,FORMAT,RECORD_KEYS,TASK_IDS,validate,capture,restore,createStore};
});
