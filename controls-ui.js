(function(root,factory){
  const model=factory();
  if(typeof module==='object'&&module.exports){module.exports=model;return;}
  const K=root.SchoolKeyboard,doc=document,KEY='insurgentes-controls-v15';
  let settings=model.sanitize(null),capture=null,returnFocus=null,padDir=0,padAt=0;
  try{settings=model.sanitize(JSON.parse(localStorage.getItem(KEY)));}catch(_){}
  const synthetic=new WeakSet(),forwarded=new Map();
  const dialog=doc.createElement('dialog');dialog.id='controls-dialog';dialog.setAttribute('aria-labelledby','controls-title');
  // This markup is fixed application text. User-provided keys are always textContent.
  dialog.innerHTML='<header class="controls-heading"><div><p class="eyebrow">A TU MANERA</p><h2 id="controls-title">Controles</h2></div><button id="controls-close" class="close-button" type="button" aria-label="Cerrar controles">✕</button></header><p>Camina con <b>flechas o WASD</b>. En los menús, elige con flechas y confirma con Enter.</p><div class="controls-presets"><button type="button" data-control-preset="default">Teclado habitual</button><button type="button" data-control-preset="compact">Teclas J · K · P</button></div><div class="controls-bindings"><span>Acción / confirmar <small>A del mando</small></span><button type="button" data-bind="action"></button><span>Correr / volver <small>B del mando</small></span><button type="button" data-bind="back"></button><span>Pausa / mapa <small>START del mando</small></span><button type="button" data-bind="pause"></button></div><p id="controls-message" class="controls-message" role="status">Toca una tecla para cambiarla. Enter, espacio y E siguen disponibles como atajos.</p><label class="controls-option"><input id="controls-run" type="checkbox"> Correr siempre al explorar la escuela</label><label class="controls-option" for="controls-touch">Botones en pantalla<select id="controls-touch"><option value="normal">Normales</option><option value="large">Grandes</option><option value="xl">Muy grandes</option></select></label><p class="controls-pad-help"><b>Mando Xbox</b><br>Palanca / cruceta: mover · A: acción · B: correr / volver · START: pausa · Y: sonido.<br>En minijuegos, sigue los botones que aparecen en pantalla.</p><div class="controls-footer"><button id="controls-reset" type="button" class="uniform-button">Restablecer</button><button id="controls-done" type="button" class="primary-button">Listo</button></div>';
  doc.body.append(dialog);
  const $=id=>doc.getElementById(id),message=text=>$('controls-message').textContent=text;
  function apply(){
    doc.documentElement.dataset.touchSize=settings.touchSize;
    for(const button of dialog.querySelectorAll('[data-bind]'))button.textContent=model.label(settings.bindings[button.dataset.bind]);
    $('controls-run').checked=settings.alwaysRun;$('controls-touch').value=settings.touchSize;
    try{localStorage.setItem(KEY,JSON.stringify(settings));}catch(_){}
    const hint=$('keyboard-hint');if(hint){
      let note=$('controls-current-keys');if(!note){note=doc.createElement('span');note.id='controls-current-keys';hint.append(note);}
      note.textContent=settings.bindings.action==='enter'&&settings.bindings.back===' '&&settings.bindings.pause==='e'?'':model.label(settings.bindings.action)+' · Acción | '+model.label(settings.bindings.back)+' · Correr | '+model.label(settings.bindings.pause)+' · Pausa';
      note.hidden=!note.textContent;
    }
    root.dispatchEvent(new CustomEvent('school-controls-change',{detail:{...settings}}));
  }
  function open(){if(dialog.open)return;capture=null;returnFocus=doc.activeElement;releaseForwarded();dialog.showModal();root.dispatchEvent(new CustomEvent('school-controls-visibility',{detail:{open:true}}));K.focus($('controls-done'),false);}
  function close(){if(!dialog.open)return;capture=null;dialog.close();root.dispatchEvent(new CustomEvent('school-controls-visibility',{detail:{open:false}}));returnFocus?.focus({preventScroll:true});}
  function releaseForwarded(){for(const [physical,entry] of forwarded){dispatch(entry.target,'keyup',entry.key,false);forwarded.delete(physical);}}
  function dispatch(target,type,key,repeat){const event=new KeyboardEvent(type,{key,code:key===' '?'Space':key==='enter'?'Enter':key==='e'?'KeyE':'',bubbles:true,cancelable:true,repeat});synthetic.add(event);(target?.dispatchEvent?target:doc).dispatchEvent(event);}
  function intercept(event){
    if(synthetic.has(event))return;
    const key=event.key.toLowerCase(),physical=event.code||key;
    if(dialog.open){
      if(event.type==='keyup'){event.stopImmediatePropagation();event.preventDefault();return;}
      if(capture){
        event.stopImmediatePropagation();event.preventDefault();if(event.repeat)return;
        if(key==='escape'){capture=null;apply();message('Cambio cancelado.');return;}
        const result=model.rebind(settings,capture,key);
        if(result.error){message(result.error);return;}
        settings=result.settings;capture=null;apply();message('Tecla guardada. Puedes seguir jugando.');return;
      }
      if(key==='escape'||((key===' '||key==='e')&&!K.isEditing(event)&&doc.activeElement?.tagName!=='SELECT')){event.stopImmediatePropagation();event.preventDefault();if(!event.repeat)close();return;}
      if(K.key(event,dialog,{defaultTarget:$('controls-done')})){event.stopImmediatePropagation();event.preventDefault();return;}
      event.stopPropagation();return;
    }
    // Release the same canonical key even if focus moved into an input meanwhile.
    if(event.type==='keyup'&&forwarded.has(physical)){
      const entry=forwarded.get(physical);forwarded.delete(physical);event.preventDefault();event.stopImmediatePropagation();dispatch(entry.target,'keyup',entry.key,false);return;
    }
    if(event.altKey||event.ctrlKey||event.metaKey||K.isEditing(event)||doc.activeElement?.tagName==='SELECT')return;
    const canonical=model.translate(settings,key);if(canonical===key)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.type==='keydown')forwarded.set(physical,{target:event.target,key:canonical});
    dispatch(event.target,event.type,canonical,event.repeat);
  }
  for(const type of ['keydown','keyup'])root.addEventListener(type,intercept,true);
  root.addEventListener('blur',releaseForwarded);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)releaseForwarded();});
  for(const button of dialog.querySelectorAll('[data-bind]'))button.addEventListener('click',()=>{capture=button.dataset.bind;button.textContent='Pulsa una tecla…';message('Pulsa una letra libre. Escape cancela. Flechas, WASD y teclas de minijuegos se conservan.');});
  for(const button of dialog.querySelectorAll('[data-control-preset]'))button.addEventListener('click',()=>{settings={...settings,bindings:{...(button.dataset.controlPreset==='compact'?model.COMPACT:model.DEFAULT)}};capture=null;apply();message('Distribución guardada.');});
  $('controls-run').addEventListener('change',()=>{settings.alwaysRun=$('controls-run').checked;apply();});
  $('controls-touch').addEventListener('change',()=>{settings.touchSize=$('controls-touch').value;apply();});
  $('controls-reset').addEventListener('click',()=>{settings=model.sanitize(null);capture=null;apply();message('Controles originales restaurados.');});
  $('controls-close').addEventListener('click',close);$('controls-done').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  for(const [parent,id] of [[doc.querySelector('.title-composition'),'title-controls-settings'],[doc.querySelector('.keyboard-options'),'map-controls-settings']]){
    if(!parent)continue;const button=doc.createElement('button');button.id=id;button.type='button';button.className=id.startsWith('title')?'title-music':'uniform-button';button.textContent='⚙ Controles';button.addEventListener('click',open);parent.append(button);
  }
  function pad({x=0,y=0,confirm=false,back=false,timestamp=performance.now()}){
    if(back){if(capture){capture=null;apply();message('Cambio cancelado.');}else close();return;}
    if(capture)return;
    const direction=Math.abs(x)>Math.abs(y)?x<-.5?'ArrowLeft':x>.5?'ArrowRight':'':y<-.5?'ArrowUp':y>.5?'ArrowDown':'';
    if(direction&&(direction!==padDir||timestamp>=padAt)){K.key({key:direction},dialog);padAt=timestamp+(direction===padDir?160:330);}padDir=direction;
    if(confirm)K.key({key:'Enter'},dialog,{defaultTarget:$('controls-done')});
  }
  root.SchoolControls={open,close,pad,isOpen:()=>dialog.open,alwaysRun:()=>settings.alwaysRun,restore(value){settings=model.sanitize(value);capture=null;releaseForwarded();apply();},snapshot:()=>JSON.parse(JSON.stringify(settings))};apply();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DEFAULT={action:'enter',back:' ',pause:'e'},COMPACT={action:'j',back:'k',pause:'p'};
  const freeKeys=new Set('bcfgijklnoqrtvy'.split(''));
  function label(key){return key==='enter'?'Enter':key===' '?'Espacio':key.toUpperCase();}
  function validKey(action,key){return key===DEFAULT[action]||(action==='pause'&&key==='p')||freeKeys.has(key);}
  function sanitize(raw){
    const result={bindings:{...DEFAULT},alwaysRun:raw?.alwaysRun===true,touchSize:['normal','large','xl'].includes(raw?.touchSize)?raw.touchSize:'normal'};
    const candidates=raw?.bindings;
    if(candidates&&Object.keys(DEFAULT).every(action=>typeof candidates[action]==='string'&&validKey(action,candidates[action]))&&new Set(Object.values(candidates)).size===3)result.bindings={action:candidates.action,back:candidates.back,pause:candidates.pause};
    return result;
  }
  function rebind(settings,action,key){
    if(!Object.hasOwn(DEFAULT,action)||!validKey(action,key))return {error:'Elige otra letra: esa tecla se usa para moverte, escribir o jugar los minijuegos.'};
    if(Object.keys(DEFAULT).some(a=>a!==action&&settings.bindings[a]===key))return {error:'Esa tecla ya tiene una función. Elige otra.'};
    return {settings:{...settings,bindings:{...settings.bindings,[action]:key}}};
  }
  function translate(settings,key){for(const action of Object.keys(DEFAULT))if(settings.bindings[action]===key)return DEFAULT[action];return key;}
  return {DEFAULT,COMPACT,label,sanitize,rebind,translate};
});
