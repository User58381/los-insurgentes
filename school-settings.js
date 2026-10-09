(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolSettings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FORMAT='los-insurgentes-escuela',VERSION=1,STORAGE_KEY='insurgentes-school-settings-v1',MAX_FILE_SIZE=65536;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const labelId=index=>'edificio-'+String(index+1).padStart(2,'0');
  function groupName(grade,group){return grade+'.º '+group.trim().toUpperCase();}
  function parseGroup(text){
    const match=text.trim().match(/^([1-6])\s*(?:\.\s*[º°o]?|(?:ro|do|to|mo|vo)|[º°])?\s*[-–]?\s*([a-z]{1,3})$/i);
    return match?{grade:Number(match[1]),group:match[2].toUpperCase()}:null;
  }
  function defaultConfig(game){
    return {format:FORMAT,version:VERSION,
      labels:game.MAP_LABELS.map((label,index)=>({id:labelId(index),name:label.text})),
      teachers:game.TEACHERS.map(teacher=>({id:teacher.id,assignment:teacher.group}))};
  }
  function textValue(value,emptyAllowed,newlines){
    if(typeof value!=='string')throw new Error('Los nombres y grupos deben ser texto.');
    const text=value.replace(/\r\n?/g,'\n').trim();
    if(text.length>64||(!emptyAllowed&&!text))throw new Error('Usa nombres de 1 a 64 caracteres.');
    if(/[\u0000-\u0009\u000b-\u001f\u007f]/.test(text)||(!newlines&&text.includes('\n')))throw new Error('Hay caracteres no válidos en un nombre o grupo.');
    if(text.split('\n').length>3)throw new Error('Una etiqueta admite hasta tres líneas.');
    return text;
  }
  function validate(input,defaults){
    if(!input||typeof input!=='object'||Array.isArray(input)||input.format!==FORMAT)throw new Error('Este archivo no es un guardado de la escuela Los Insurgentes.');
    if(input.version!==VERSION)throw new Error('La versión de este guardado no es compatible con el juego.');
    const result=copy(defaults);
    for(const [key,field,empty,newlines] of [['labels','name',false,true],['teachers','assignment',true,false]]){
      const rows=input[key],known=new Map(result[key].map(row=>[row.id,row])),seen=new Set();
      if(!Array.isArray(rows)||!rows.length||rows.length>known.size)throw new Error('El guardado no contiene una lista válida de '+(key==='labels'?'edificios':'profesores')+'.');
      for(const row of rows){
        if(!row||typeof row!=='object'||Array.isArray(row)||!known.has(row.id)||seen.has(row.id))throw new Error('El guardado tiene edificios o profesores desconocidos o repetidos.');
        seen.add(row.id);known.get(row.id)[field]=textValue(row[field],empty,newlines);
      }
    }
    return result;
  }
  function parseSave(text,defaults){
    if(typeof text!=='string'||text.length>MAX_FILE_SIZE)throw new Error('El archivo de guardado es demasiado grande.');
    let data;try{data=JSON.parse(text);}catch(_){throw new Error('No se pudo leer el guardado. Selecciona el archivo JSON que exportó el juego.');}
    return validate(data,defaults);
  }
  function roomName(game){
    const name=game.MAP_LABELS[9].text.replace(/\n/g,' ');
    return parseGroup(name)?'Salón '+name:name;
  }
  function apply(game,config){
    const labels=new Map(config.labels.map(row=>[row.id,row.name]));
    const teachers=new Map(config.teachers.map(row=>[row.id,row.assignment]));
    game.MAP_LABELS.forEach((label,index)=>{label.text=labels.get(labelId(index));});
    game.TEACHERS.forEach(teacher=>{teacher.group=teachers.get(teacher.id);});
    game.STATIONS.classroom.name=roomName(game);
  }
  function createStore(game,storage){
    const defaults=defaultConfig(game),listeners=new Set();
    let config=copy(defaults),status={persisted:true,message:'Los cambios se guardan automáticamente en este navegador.'};
    function notify(){for(const callback of listeners)callback(copy(config),{...status});}
    function load(raw){
      try{config=raw?parseSave(raw,defaults):copy(defaults);status={persisted:true,message:raw?'Ajustes recuperados de este navegador.':'Los cambios se guardan automáticamente en este navegador.'};}
      catch(error){status={persisted:false,message:error.message+' Puedes importar una copia de tus ajustes.'};}
      apply(game,config);
    }
    try{load(storage.getItem(STORAGE_KEY));}catch(_){status={persisted:false,message:'Este navegador no permite guardar ajustes. Puedes exportar una copia para conservarlos.'};apply(game,config);}
    function commit(value){
      const next=validate(value,defaults);
      try{storage.setItem(STORAGE_KEY,JSON.stringify(next));status={persisted:true,message:'✓ Guardado en este navegador'};}
      catch(_){status={persisted:false,message:'Los cambios están aplicados, pero el navegador no permite guardarlos. Exporta una copia para conservarlos.'};}
      config=next;apply(game,config);notify();return {...status};
    }
    function edit(key,id,field,value){
      const next=copy(config),row=next[key].find(row=>row.id===id);
      if(!row)throw new Error('No se encontró ese edificio o profesor.');
      row[field]=value;return commit(next);
    }
    return {getConfig:()=>copy(config),getStatus:()=>({...status}),
      setLabel:(id,name)=>edit('labels',id,'name',name),setTeacher:(id,assignment)=>edit('teachers',id,'assignment',assignment),
      importSave:text=>commit(parseSave(text,defaults)),
      exportSave:()=>JSON.stringify({...copy(config),exportedAt:new Date().toISOString()},null,2),
      subscribe(callback){listeners.add(callback);return()=>listeners.delete(callback);},
      receive(raw){load(raw);notify();}};
  }
  function assetUrl(path,href,version,refresh){
    const url=new URL(path,href);
    if(!['http:','https:'].includes(url.protocol)||url.origin!==new URL(href).origin)return path;
    url.searchParams.set('v',version);
    if(refresh)url.searchParams.set('_refresh',refresh);
    return url.href;
  }
  async function freshGameUrl(environment){
    const base=new URL('.',environment.href),url=new URL(environment.href);
    // Remove only cached requests and workers belonging to this game path.
    if(environment.caches){try{
      for(const name of await environment.caches.keys()){
        const cache=await environment.caches.open(name);
        for(const request of await cache.keys())if(request.url.startsWith(base.href))await cache.delete(request);
      }
    }catch(_){/* A new URL still bypasses the browser's old asset entries. */}}
    if(environment.serviceWorker){try{
      for(const registration of await environment.serviceWorker.getRegistrations())if(registration.scope.startsWith(base.href))await registration.unregister();
    }catch(_){}}
    url.searchParams.set('_refresh',String(environment.now===undefined?Date.now():environment.now));
    return url.href;
  }
  return {FORMAT,VERSION,STORAGE_KEY,MAX_FILE_SIZE,labelId,groupName,parseGroup,defaultConfig,validate,parseSave,roomName,createStore,assetUrl,freshGameUrl};
});
