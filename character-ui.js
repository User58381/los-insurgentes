(function(){
  'use strict';
  const $=id=>document.getElementById(id),dialog=$('character-dialog'),C=window.SchoolCharacters,K=window.SchoolKeyboard;
  const preview=$('character-preview'),ctx=preview.getContext('2d');
  let options={},selected=null,filter='student',facing='down',returnFocus=null,all=[],shown=[];
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const clearButton=document.createElement('button');clearButton.id='character-search-clear';clearButton.type='button';clearButton.textContent='Borrar';clearButton.setAttribute('aria-label','Borrar búsqueda');clearButton.hidden=true;
  $('character-search').after(clearButton);clearButton.addEventListener('click',()=>{$('character-search').value='';render();K.focus($('character-search'),false);});
  $('character-search').placeholder='Escribe tu nombre…';$('character-count').setAttribute('aria-live','polite');
  document.querySelector('.character-help').textContent='Toca tu personaje y pulsa Jugar. Flechas / cruceta: elegir · Enter / A: jugar · Espacio / B: volver.';
  function draw(node,actor,height=100){const context=node.getContext('2d');context.clearRect(0,0,node.width,node.height);C.draw(context,options.game,options.images,actor,options.day,node.width/2,node.height-12,height,facing);}
  function select(actor){
    if(!actor)return;selected=actor;$('character-name').textContent=actor.name;$('character-role').textContent=actor.kind==='student'?'Alumno · '+actor.group:(actor.group||'Personal de la escuela');
    $('character-detail').textContent=actor.fullName||'Listo para explorar Los Insurgentes';
    for(const button of $('character-grid').children){button.setAttribute('aria-pressed',String(button.dataset.character===actor.id));button.tabIndex=button.dataset.character===actor.id?0:-1;}
    ctx.clearRect(0,0,preview.width,preview.height);ctx.fillStyle='#143e3450';ctx.beginPath();ctx.ellipse(140,225,65,15,0,0,Math.PI*2);ctx.fill();
    C.draw(ctx,options.game,options.images,actor,options.day,140,225,178,facing);
    $('character-confirm').textContent='Jugar con '+actor.name;$('character-confirm').disabled=false;
  }
  function render(){
    const query=normalize($('character-search').value);
    shown=all.filter(actor=>(filter==='all'||actor.kind===filter)&&normalize(actor.name+' '+(actor.fullName||'')).includes(query));
    clearButton.hidden=!query;$('character-grid').replaceChildren();
    if(shown.length&&!shown.some(actor=>actor.id===selected?.id))selected=shown[0];
    for(const actor of shown){
      const button=document.createElement('button'),canvas=document.createElement('canvas'),name=document.createElement('span');
      button.type='button';button.className='character-card';button.dataset.character=actor.id;button.setAttribute('aria-pressed',String(selected?.id===actor.id));button.setAttribute('aria-label',(actor.fullName||actor.name)+(actor.kind==='student'?', alumno':', personal'));
      button.tabIndex=selected?.id===actor.id?0:-1;canvas.width=100;canvas.height=106;canvas.setAttribute('aria-hidden','true');name.textContent=actor.name;
      button.append(canvas,name);button.addEventListener('click',()=>select(actor));button.addEventListener('focus',()=>select(actor));$('character-grid').append(button);draw(canvas,actor,86);
    }
    $('character-count').textContent=shown.length+' de '+all.length;$('character-empty').hidden=shown.length>0;
    $('character-empty').textContent='No encontramos ese nombre. Borra la búsqueda o elige Todos.';
    for(const button of document.querySelectorAll('[data-character-filter]'))button.setAttribute('aria-pressed',String(button.dataset.characterFilter===filter));
    if(shown.length)select(selected);else{$('character-confirm').disabled=true;$('character-confirm').textContent='Busca otro nombre';}
  }
  function open(config){
    options=config;returnFocus=document.activeElement;all=C.selectable(config.game);facing='down';
    selected=all.find(actor=>actor.id===config.playerId)||all[0];filter=selected?.kind||'student';
    $('character-search').value='';$('character-background').src=config.images.introBg.src;render();dialog.showModal();
    K.focus($('character-grid').querySelector('[aria-pressed="true"]')||$('character-search'),true);
  }
  function close(){if(!dialog.open)return;dialog.close();options.onClose?.();returnFocus?.focus({preventScroll:true});}
  function confirm(){const id=selected?.id;if(!id||!shown.some(actor=>actor.id===id))return;const pick=options.onPick;close();pick?.(id);}
  function key(event){
    const key=event.key.toLowerCase(),active=document.activeElement;
    if(K.isBack(event)){if(!event.repeat)close();return true;}
    if(active?.matches('.character-card')){
      if(key==='enter'){if(!event.repeat)confirm();return true;}
      if(key.startsWith('arrow')){
        const cards=Array.from($('character-grid').children),index=cards.indexOf(active),columns=Math.max(1,getComputedStyle($('character-grid')).gridTemplateColumns.split(' ').filter(Boolean).length);
        const step=key==='arrowup'?-columns:key==='arrowdown'?columns:key==='arrowleft'?-1:1,next=index+step;
        if(next<0&&key==='arrowup')K.focus($('character-search'));else if(next>=cards.length&&key==='arrowdown')K.focus($('character-confirm'));else K.focus(cards[(next+cards.length)%cards.length]);return true;
      }
    }
    if(active===$('character-search')){
      if(['enter','arrowdown'].includes(key)){K.focus($('character-grid').firstElementChild||clearButton);return true;}
      if(key!=='arrowup')return false;
    }
    // From the prominent play button, direction input goes straight back to the roster.
    if(active===$('character-confirm')&&key.startsWith('arrow')){K.focus($('character-grid').querySelector('[aria-pressed="true"]')||$('character-search'));return true;}
    return K.key(event,dialog,{defaultTarget:$('character-confirm')});
  }
  let padDir=0,padAt=0;
  function pad({x=0,y=0,confirm:go,back,timestamp}){
    if(back){close();return;}
    const dir=Math.abs(x)>Math.abs(y)?(x<-.5?3:x>.5?4:0):(y<-.5?1:y>.5?2:0);
    if(dir&&(dir!==padDir||timestamp>=padAt)){key({key:['','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'][dir],preventDefault(){}});padAt=timestamp+(dir===padDir?150:330);}padDir=dir;
    if(go)key({key:'Enter',preventDefault(){}});
  }
  $('character-confirm').addEventListener('click',confirm);$('character-close').addEventListener('click',close);$('character-search').addEventListener('input',render);
  for(const button of document.querySelectorAll('[data-character-filter]'))button.addEventListener('click',()=>{filter=button.dataset.characterFilter;render();K.focus($('character-grid').firstElementChild||$('character-search'));});
  $('character-turn').addEventListener('click',()=>{const directions=['down','left','up','right'];facing=directions[(directions.indexOf(facing)+1)%4];render();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  document.addEventListener('school-weather-change',()=>{if(!dialog.open)return;const focused=document.activeElement?.dataset?.character,scroll=$('character-grid').scrollTop;render();$('character-grid').scrollTop=scroll;if(focused)K.focus(Array.from($('character-grid').children).find(button=>button.dataset.character===focused),false);});
  window.CharacterSelect={open,close,key,pad,isOpen:()=>dialog.open};
})();
