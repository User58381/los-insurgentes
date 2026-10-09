(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolSettings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FORMAT='los-insurgentes-escuela',VERSION=1,STORAGE_KEY='insurgentes-school-settings-v1',MAX_FILE_SIZE=65536;
  const LEGACY_ASSIGNMENTS={norma:'1.º B',emilia:'6.º B',angelica:'4.º A',emilio:'5.º A',diana:'4.º A'};
  const copy=value=>JSON.parse(JSON.stringify(value));
  const labelId=index=>'edificio-'+String(index+1).padStart(2,'0');
  function groupName(grade,group){return grade+'.º '+group.trim().toUpperCase();}
  function parseGroup(text){
    const match=text.trim().match(/^([1-6])\s*(?:\.\s*[º°o]?|(?:ro|do|to|mo|vo)|[º°])?\s*[-–]?\s*([a-z]{1,3})$/i);
    return match?{grade:Number(match[1]),group:match[2].toUpperCase()}:null;
  }
  function defaultConfig(game){
    return {format:FORMAT,version:VERSION,organizationRevision:game.ORGANIZATION_REVISION||null,
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
    if(input.organizationRevision!==undefined&&input.organizationRevision!==null&&(typeof input.organizationRevision!=='string'||input.organizationRevision.length>64))throw new Error('La información de la lista de maestros no es válida.');
    result.organizationRevision=input.organizationRevision||null;
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
    const name=game.classroomLabel?game.classroomLabel():game.MAP_LABELS[9].text.replace(/\n/g,' ');
    return parseGroup(name)?'Salón '+name:name;
  }
  function matchingBuildings(game,assignment){
    const wanted=parseGroup(assignment);if(!wanted)return [];
    return game.MAP_LABELS.reduce((indices,label,index)=>{
      const group=parseGroup(label.text);
      if(group&&group.grade===wanted.grade&&group.group===wanted.group)indices.push(index);
      return indices;
    },[]);
  }
  function orderedTeachers(game){
    return [...game.TEACHERS].sort((a,b)=>{
      const left=parseGroup(a.group),right=parseGroup(b.group);
      if(left&&right)return left.grade-right.grade||left.group.localeCompare(right.group,'es')||a.name.localeCompare(b.name,'es');
      if(left||right)return left?-1:1;
      return a.name.localeCompare(b.name,'es');
    });
  }
  function apply(game,config,initialPositions){
    const labels=new Map(config.labels.map(row=>[row.id,row.name]));
    const teachers=new Map(config.teachers.map(row=>[row.id,row.assignment]));
    game.MAP_LABELS.forEach((label,index)=>{label.text=labels.get(labelId(index));});
    game.TEACHERS.forEach(teacher=>{teacher.group=teachers.get(teacher.id);});
    if(game.buildingEntrance){
      for(const teacher of game.TEACHERS){
        const original=initialPositions.get(teacher.id)?.outside;if(!original)continue;
        const matches=matchingBuildings(game,teacher.group),entrance=matches.length===1?game.buildingEntrance(matches[0]):null;
        teacher.positions.outside=entrance&&game.canStand('outside',entrance.x,entrance.y)?{...original,...entrance}:{...original};
      }
      const angel=game.TEACHERS.find(teacher=>teacher.id==='angel'),matches=matchingBuildings(game,angel?.group||'');
      if(matches.length===1)game.setClassroomBuilding(matches[0]);
    }
    game.STATIONS.classroom.name=roomName(game);
  }
  function createStore(game,storage){
    const defaults=defaultConfig(game),listeners=new Set(),initialPositions=new Map(game.TEACHERS.map(teacher=>[teacher.id,copy(teacher.positions)]));
    let config=copy(defaults),status={persisted:true,message:'Los cambios se guardan automáticamente en este navegador.'};
    function notify(){for(const callback of listeners)callback(copy(config),{...status});}
    function load(raw){
      try{
        config=raw?parseSave(raw,defaults):copy(defaults);status={persisted:true,message:raw?'Ajustes recuperados de este navegador.':'Los cambios se guardan automáticamente en este navegador.'};
        if(raw&&!config.organizationRevision&&defaults.organizationRevision){
          for(const row of config.teachers){
            const legacy=parseGroup(LEGACY_ASSIGNMENTS[row.id]||''),saved=parseGroup(row.assignment);
            if(legacy&&saved&&legacy.grade===saved.grade&&legacy.group===saved.group)row.assignment=defaults.teachers.find(teacher=>teacher.id===row.id).assignment;
          }
          config.organizationRevision=defaults.organizationRevision;
          try{storage.setItem(STORAGE_KEY,JSON.stringify(config));status={persisted:true,message:'Lista de maestros actualizada. Tus etiquetas y ajustes personales se conservan.'};}
          catch(_){status={persisted:false,message:'Lista de maestros actualizada. Exporta una copia: este navegador no permite guardar los cambios.'};}
        }
      }
      catch(error){status={persisted:false,message:error.message+' Puedes importar una copia de tus ajustes.'};}
      apply(game,config,initialPositions);
    }
    try{load(storage.getItem(STORAGE_KEY));}catch(_){status={persisted:false,message:'Este navegador no permite guardar ajustes. Puedes exportar una copia para conservarlos.'};apply(game,config,initialPositions);}
    function commit(value){
      const next=validate(value,defaults);
      next.organizationRevision=defaults.organizationRevision;
      try{storage.setItem(STORAGE_KEY,JSON.stringify(next));status={persisted:true,message:'✓ Guardado en este navegador'};}
      catch(_){status={persisted:false,message:'Los cambios están aplicados, pero el navegador no permite guardarlos. Exporta una copia para conservarlos.'};}
      config=next;apply(game,config,initialPositions);notify();return {...status};
    }
    function edit(key,id,field,value){
      const next=copy(config),row=next[key].find(row=>row.id===id);
      if(!row)throw new Error('No se encontró ese edificio o profesor.');
      row[field]=value;return commit(next);
    }
    return {getConfig:()=>copy(config),getStatus:()=>({...status}),
      setLabel:(id,name)=>edit('labels',id,'name',name),setTeacher:(id,assignment)=>edit('teachers',id,'assignment',assignment),
      importSave:text=>commit(parseSave(text,defaults)),
      applyOfficialAssignments(){
        const next=copy(config);
        for(const teacher of game.TEACHERS)if(teacher.officialAssignment!==undefined)next.teachers.find(row=>row.id===teacher.id).assignment=teacher.officialAssignment;
        return commit(next);
      },
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
  return {FORMAT,VERSION,STORAGE_KEY,MAX_FILE_SIZE,labelId,groupName,parseGroup,defaultConfig,validate,parseSave,roomName,matchingBuildings,orderedTeachers,createStore,assetUrl,freshGameUrl};
});
