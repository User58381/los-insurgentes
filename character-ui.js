(function(){
  'use strict';
  const $=id=>document.getElementById(id),dialog=$('character-dialog'),C=window.SchoolCharacters,K=window.SchoolKeyboard;
  const preview=$('character-preview'),ctx=preview.getContext('2d');
  let options={},selected=null,filter='all',facing='down',returnFocus=null,all=[];
  function draw(node,actor,height=100){const context=node.getContext('2d');context.clearRect(0,0,node.width,node.height);C.draw(context,options.game,options.images,actor,options.day,node.width/2,node.height-12,height,facing);}
  function select(actor){
    selected=actor;$('character-name').textContent=actor.name;$('character-role').textContent=actor.kind==='student'?'Alumno · '+actor.group:(actor.group||'Personal de la escuela');
    $('character-detail').textContent=actor.fullName||'Listo para explorar Los Insurgentes';
    for(const button of $('character-grid').children){button.setAttribute('aria-pressed',String(button.dataset.character===actor.id));}
    ctx.clearRect(0,0,preview.width,preview.height);
    ctx.fillStyle='#143e3450';ctx.beginPath();ctx.ellipse(140,225,65,15,0,0,Math.PI*2);ctx.fill();
    C.draw(ctx,options.game,options.images,actor,options.day,140,225,178,facing);
    $('character-confirm').textContent='Jugar como '+actor.name;
  }
  function render(){
    const query=$('character-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const shown=all.filter(actor=>(filter==='all'||actor.kind===filter)&& (actor.name+' '+(actor.fullName||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
    $('character-grid').replaceChildren();
    for(const actor of shown){
      const button=document.createElement('button'),canvas=document.createElement('canvas'),name=document.createElement('span');
      button.type='button';button.className='character-card';button.dataset.character=actor.id;button.setAttribute('aria-pressed',String(selected?.id===actor.id));
      canvas.width=100;canvas.height=106;canvas.setAttribute('aria-hidden','true');name.textContent=actor.name;
      button.append(canvas,name);button.addEventListener('click',()=>{select(actor);K.focus($('character-confirm'),false);});
      button.addEventListener('focus',()=>{select(actor);});$('character-grid').append(button);draw(canvas,actor,86);
    }
    $('character-count').textContent=shown.length+' personajes';$('character-empty').hidden=shown.length>0;
    for(const button of document.querySelectorAll('[data-character-filter]'))button.setAttribute('aria-pressed',String(button.dataset.characterFilter===filter));
  }
  function open(config){
    options=config;returnFocus=document.activeElement;all=C.list(config.game);filter='all';facing='down';
    $('character-search').value='';$('character-background').src=config.images.introBg.src;
    selected=all.find(actor=>actor.id===config.playerId)||all[0];render();select(selected);
    dialog.showModal();K.focus($('character-confirm'),false);
  }
  function close(){if(dialog.open)dialog.close();options.onClose?.();returnFocus?.focus({preventScroll:true});}
  function confirm(){const id=selected?.id;if(!id)return;const pick=options.onPick;close();pick?.(id);}
  function key(event){
    const key=event.key.toLowerCase(),active=document.activeElement;
    if(K.isBack(event)){if(!event.repeat)close();return true;}
    if(active?.matches('.character-card')&&key.startsWith('arrow')){
      const cards=Array.from($('character-grid').children),index=cards.indexOf(active),columns=getComputedStyle($('character-grid')).gridTemplateColumns.split(' ').length;
      const step=key==='arrowup'?-columns:key==='arrowdown'?columns:key==='arrowleft'?-1:1;
      K.focus(cards[Math.max(0,Math.min(cards.length-1,index+step))]);return true;
    }
    if(active===$('character-search')&&key!=='enter'&&key!=='arrowdown'&&key!=='arrowup')return false;
    return K.key(event,dialog,{defaultTarget:$('character-confirm')});
  }
  let padDir=0,padAt=0;
  function pad({x,y,confirm:go,back,timestamp}){
    if(back){close();return;}
    const dir=Math.abs(x)>Math.abs(y)?(x<-.5?3:x>.5?4:0):(y<-.5?1:y>.5?2:0);
    if(dir&&(dir!==padDir||timestamp>=padAt)){key({key:['','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'][dir],preventDefault(){}});padAt=timestamp+(dir===padDir?150:330);}padDir=dir;
    if(go)key({key:'Enter',preventDefault(){}});
  }
  $('character-confirm').addEventListener('click',confirm);$('character-close').addEventListener('click',close);
  $('character-search').addEventListener('input',render);
  for(const button of document.querySelectorAll('[data-character-filter]'))button.addEventListener('click',()=>{filter=button.dataset.characterFilter;render();K.focus($('character-grid').firstElementChild||$('character-confirm'));});
  $('character-turn').addEventListener('click',()=>{const directions=['down','left','up','right'];facing=directions[(directions.indexOf(facing)+1)%4];render();select(selected);});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.CharacterSelect={open,close,key,pad,isOpen:()=>dialog.open};
})();
