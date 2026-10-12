(function(){
  'use strict';
  const selector='button,a[href],input:not([type="hidden"]):not([type="file"]),select,textarea,summary,[data-keyboard-scroll]';
  function visible(node,root,styles=new Map()){
    if(node.matches(':disabled')||node.getAttribute('aria-disabled')==='true')return false;
    for(let parent=node;parent;parent=parent.parentElement){
      if(parent.hidden||parent.inert||parent.hasAttribute('inert'))return false;
      if(parent.tagName==='DIALOG'&&!parent.open)return false;
      if(parent.tagName==='DETAILS'&&!parent.open&&!parent.querySelector('summary')?.contains(node))return false;
      if(!styles.has(parent))styles.set(parent,getComputedStyle(parent));
      const style=styles.get(parent);
      if(style.display==='none'||style.visibility==='hidden')return false;
      if(parent===root)return true;
    }
    return false;
  }
  function items(root,filter=()=>true){
    const styles=new Map();
    return Array.from(root.querySelectorAll(selector)).filter(node=>visible(node,root,styles)&&filter(node));
  }
  function clear(){document.querySelectorAll('.keyboard-choice').forEach(node=>node.classList.remove('keyboard-choice'));}
  function focus(node,scroll=true){
    if(!node)return;clear();node.classList.add('keyboard-choice');node.focus({preventScroll:true});
    if(scroll)node.scrollIntoView?.({block:'nearest',inline:'nearest'});
  }
  function move(root,step,options={}){
    const controls=items(root,options.filter);if(!controls.length)return;
    const index=controls.indexOf(document.activeElement);
    focus(controls[index<0?(step<0?controls.length-1:0):(index+step+controls.length)%controls.length]);
  }
  function changeSelect(node,step){
    const options=Array.from(node.options).filter(option=>!option.disabled&&!option.hidden);
    if(!options.length)return;
    const index=options.findIndex(option=>option.index===node.selectedIndex);
    node.selectedIndex=options[(Math.max(0,index)+step+options.length)%options.length].index;
    node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));
    focus(node);
  }
  function key(event,root,options={}){
    const key=event.key.toLowerCase();
    if(event.altKey||event.ctrlKey||event.metaKey||!['arrowup','arrowdown','arrowleft','arrowright','enter',' '].includes(key))return false;
    const controls=items(root,options.filter),active=root.contains(document.activeElement)?document.activeElement:null;
    const editable=active?.matches('input,textarea,[contenteditable="true"]');
    if(key===' '&&editable)return false;
    if(active?.hasAttribute('data-keyboard-scroll')&&key.startsWith('arrow')){
      const vertical=key==='arrowup'||key==='arrowdown',delta=(key==='arrowup'||key==='arrowleft'?-1:1)*80;
      if(vertical)active.scrollTop+=delta;else active.scrollLeft+=delta;
      return true;
    }
    if(key==='arrowleft'||key==='arrowright'){
      if(editable)return false;
      if(active?.tagName==='SELECT'){changeSelect(active,key==='arrowleft'?-1:1);return true;}
    }
    if(key.startsWith('arrow')){move(root,key==='arrowup'||key==='arrowleft'?-1:1,options);return true;}
    if(event.repeat)return true;
    // A temporarily disabled launch button must never activate a different action.
    if(active?.matches(':disabled'))return true;
    const target=controls.includes(active)?active:(options.defaultTarget||controls[0]);
    if(!target||!visible(target,root))return true;
    if(target.tagName==='SELECT'||target.matches('input,textarea,[data-keyboard-scroll]'))move(root,1,options);
    else if(target.tagName==='SUMMARY'){target.parentElement.open=!target.parentElement.open;focus(target);}
    else target.click();
    return true;
  }
  document.addEventListener('pointerdown',clear);
  window.SchoolKeyboard={items,focus,move,key,clear};
})();
