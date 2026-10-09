(function(){
  'use strict';
  const S=window.SchoolSettings,G=window.SchoolGame,store=window.InsurgentesSchool;
  const $=id=>document.getElementById(id),dialog=$('school-editor'),map=$('school-map-canvas'),ctx=map.getContext('2d');
  const rowElements=new Map(),mapImage=new Image();let selectedLabel=0,returnFocus=null;
  function status(message,error=false){$('school-save-status').textContent=message;$('school-save-status').classList.toggle('save-error',error);}
  function showStoredStatus(){const value=store.getStatus();status(value.message,!value.persisted);}
  function redrawMap(){
    ctx.fillStyle='#dee8cf';ctx.fillRect(0,0,map.width,map.height);
    if(mapImage.complete&&mapImage.naturalWidth)ctx.drawImage(mapImage,0,0,map.width,map.height);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 32px sans-serif';
    G.MAP_LABELS.forEach((label,index)=>{
      ctx.fillStyle=index===selectedLabel?'#ffd36d':'#184e45';ctx.strokeStyle='#fff7de';ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(label.x,label.y,33,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=index===selectedLabel?'#173c39':'#fff7de';ctx.fillText(String(index+1),label.x,label.y+1);
    });
    $('school-selected-building').textContent=(selectedLabel+1)+' · '+G.MAP_LABELS[selectedLabel].text.replace(/\n/g,' ');
  }
  function selectLabel(index,focus=false){
    selectedLabel=index;
    for(const [id,row] of rowElements)if(id.startsWith('edificio-'))row.classList.toggle('selected',id===S.labelId(index));
    redrawMap();
    if(focus){const row=rowElements.get(S.labelId(index));row.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});row.querySelector('input').focus({preventScroll:true});}
  }
  function makeField(labelText,control){const label=document.createElement('label');label.textContent=labelText;label.append(control);return label;}
  function makeRow(id,title,value,isLabel,index){
    const row=document.createElement('div'),heading=document.createElement('h4'),name=document.createElement('input');
    const grade=document.createElement('select'),group=document.createElement('input'),error=document.createElement('p');
    row.className='school-editor-row';row.dataset.schoolId=id;heading.textContent=title;
    name.type='text';name.maxLength=64;name.value=value.replace(/\n/g,' ');name.autocomplete='off';
    name.setAttribute('aria-label',(isLabel?'Etiqueta del edificio '+(index+1):'Cargo o grupo de '+title));
    for(let n=0;n<=6;n++){const option=document.createElement('option');option.value=String(n);option.textContent=n?n+'.º':(isLabel?'Espacio':'Sin grado');grade.append(option);}
    grade.setAttribute('aria-label','Grado de '+title);group.type='text';group.maxLength=3;group.autocomplete='off';group.placeholder='A';group.setAttribute('aria-label','Grupo de '+title);
    error.className='school-row-error';error.hidden=true;
    function syncGroup(){const parsed=S.parseGroup(name.value);grade.value=String(parsed?.grade||0);group.value=parsed?.group||'';group.disabled=!parsed;}
    function save(){
      try{if(isLabel)store.setLabel(id,name.value);else store.setTeacher(id,name.value);error.hidden=true;name.removeAttribute('aria-invalid');}
      catch(reason){error.textContent=reason.message;error.hidden=false;name.setAttribute('aria-invalid','true');status('Hay un campo pendiente de completar. Los últimos ajustes válidos siguen guardados.',true);}
    }
    name.addEventListener('input',()=>{syncGroup();save();});
    grade.addEventListener('change',()=>{
      group.disabled=grade.value==='0';
      if(group.disabled){name.value='';group.value='';name.placeholder=isLabel?'Nombre del espacio':'Materia o cargo';name.focus();save();return;}
      if(!group.value)group.value='A';name.value=S.groupName(grade.value,group.value);save();
    });
    group.addEventListener('input',()=>{
      group.value=group.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);
      if(!group.value){error.textContent='Escribe el grupo, por ejemplo A, B o C.';error.hidden=false;status('Completa el grupo para guardar este cambio.',true);return;}
      name.value=S.groupName(grade.value,group.value);save();
    });
    if(isLabel)row.addEventListener('focusin',()=>selectLabel(index));
    syncGroup();row.append(heading,makeField(isLabel?'Etiqueta visible':'Cargo o grupo',name),makeField('Grado',grade),makeField('Grupo',group),error);
    rowElements.set(id,row);return row;
  }
  function renderRows(){
    const config=store.getConfig();rowElements.clear();$('school-label-rows').replaceChildren();$('school-teacher-rows').replaceChildren();
    config.labels.forEach((label,index)=>$('school-label-rows').append(makeRow(label.id,(index+1)+' · Edificio',label.name,true,index)));
    for(const teacher of S.orderedTeachers(G)){
      const assignment=config.teachers.find(row=>row.id===teacher.id).assignment,row=makeRow(teacher.id,teacher.name,assignment,false);
      if(teacher.fullName){const detail=document.createElement('p');detail.className='school-official-name';detail.textContent=teacher.fullName;row.firstElementChild.after(detail);}
      const room=document.createElement('div'),caption=document.createElement('span'),button=document.createElement('button');
      room.className='school-teacher-room';room.dataset.roomFor=teacher.id;button.className='uniform-button';button.type='button';button.textContent='Ver salón';button.setAttribute('aria-label','Ver salón de '+teacher.name);
      button.addEventListener('click',()=>{const matches=S.matchingBuildings(G,teacher.group);if(matches.length===1){tab('labels');selectLabel(matches[0],true);}});
      room.append(caption,button);row.append(room);$('school-teacher-rows').append(row);
    }
    updateRoomHints();
    selectLabel(selectedLabel);showStoredStatus();
  }
  function updateRoomHints(){
    for(const teacher of G.TEACHERS){
      const room=rowElements.get(teacher.id)?.querySelector('[data-room-for]');if(!room)continue;
      const isGroup=!!S.parseGroup(teacher.group),matches=S.matchingBuildings(G,teacher.group),unique=matches.length===1;
      room.hidden=!isGroup;room.classList.toggle('school-room-warning',isGroup&&!unique);room.querySelector('button').hidden=!unique;
      room.querySelector('span').textContent=unique?'Salón: edificio '+(matches[0]+1)+' · '+G.MAP_LABELS[matches[0]].text.replace(/\n/g,' '):matches.length?'Este grupo está en '+matches.length+' edificios. Revisa sus etiquetas.':'Falta ubicar este grupo: asígnalo a un edificio en el mapa.';
    }
  }
  function tab(value){
    $('school-label-panel').hidden=value!=='labels';$('school-teacher-panel').hidden=value!=='teachers';
    for(const button of document.querySelectorAll('[data-school-tab]'))button.setAttribute('aria-pressed',String(button.dataset.schoolTab===value));
  }
  function open(){
    if(dialog.open)return;returnFocus=document.activeElement;renderRows();
    dialog.showModal();window.dispatchEvent(new CustomEvent('school-editor-visibility',{detail:{open:true}}));
    $('school-editor-close').focus({preventScroll:true});
  }
  function close(){if(dialog.open)dialog.close();}
  dialog.addEventListener('close',()=>{window.dispatchEvent(new CustomEvent('school-editor-visibility',{detail:{open:false}}));returnFocus?.focus({preventScroll:true});});
  $('school-editor-close').addEventListener('click',close);
  for(const button of document.querySelectorAll('[data-open-school-editor]'))button.addEventListener('click',open);
  for(const button of document.querySelectorAll('[data-school-tab]'))button.addEventListener('click',()=>tab(button.dataset.schoolTab));
  map.addEventListener('click',event=>{
    const bounds=map.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*map.width,y=(event.clientY-bounds.top)/bounds.height*map.height;
    const nearest=G.MAP_LABELS.map((label,index)=>({index,distance:Math.hypot(label.x-x,label.y-y)})).sort((a,b)=>a.distance-b.distance)[0];
    if(nearest.distance<115)selectLabel(nearest.index,true);
  });
  $('school-export').addEventListener('click',()=>{
    const value=store.exportSave(),url=URL.createObjectURL(new Blob([value],{type:'application/json;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download='Escuela_Los_Insurgentes.json';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);status('Copia exportada. Impórtala en otro navegador para usar los mismos ajustes.');
  });
  $('school-import').addEventListener('click',()=>$('school-import-file').click());
  $('school-apply-list').addEventListener('click',()=>{
    const result=store.applyOfficialAssignments();renderRows();
    if(result.persisted)status('✓ Grupos de la lista aplicados. Tus etiquetas y ubicaciones se conservan.');
  });
  $('school-import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>S.MAX_FILE_SIZE)throw new Error('El archivo es demasiado grande. Selecciona un guardado de la escuela.');
      const result=store.importSave(await file.text());renderRows();
      if(result.persisted)status('✓ Guardado importado y conservado en este navegador.');
    }catch(error){status(error.message,true);}finally{event.target.value='';}
  });
  $('school-clear-cache').addEventListener('click',async()=>{
    const button=$('school-clear-cache');button.disabled=true;button.textContent='Actualizando…';status('Cargando la versión más reciente del juego…');
    try{
      let caches=null,serviceWorker=null;try{caches=window.caches;serviceWorker=navigator.serviceWorker;}catch(_){}
      const fresh=await S.freshGameUrl({href:location.href,caches,serviceWorker});
      location.replace(fresh);
    }catch(_){button.disabled=false;button.textContent='↻ Borrar caché y actualizar';status('No se pudo recargar. Vuelve a intentarlo.',true);}
  });
  store.subscribe(()=>{if(dialog.open){showStoredStatus();redrawMap();updateRoomHints();}});
  window.addEventListener('storage',event=>{if(event.key===S.STORAGE_KEY){store.receive(event.newValue);if(dialog.open)renderRows();}});
  mapImage.onload=redrawMap;mapImage.src=window.SchoolAssets?.url(G.ASSET_PATHS.map)||G.ASSET_PATHS.map;
  window.SchoolEditor={open,close,isOpen:()=>dialog.open};
})();
