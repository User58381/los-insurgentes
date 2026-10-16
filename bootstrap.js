(function(){
  'use strict';
  const documentVersion=document.documentElement.dataset.version,base=new URL('.',location.href),online=['http:','https:'].includes(location.protocol);
  const refresh=new URL(location.href).searchParams.get('_refresh');
  const manifestKey='insurgentes-manifest:'+base.pathname;
  let current={version:documentVersion,assets:{}},hooks=null,busy=false,pending=null,reported='';
  function valid(value){return value&&typeof value.version==='string'&&/^[a-zA-Z0-9._-]{1,96}$/.test(value.version)&&value.assets&&typeof value.assets==='object';}
  async function fetchFresh(path){
    const url=new URL(path,base);url.searchParams.set('_check',String(Date.now()));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
    try{const response=await fetch(url.href,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('HTTP '+response.status);return response;}finally{clearTimeout(timer);}
  }
  function url(path){
    if(!online)return path;
    const value=new URL(path,base);if(value.origin!==location.origin)return path;
    value.searchParams.set('v',current.assets[path]||current.version);if(refresh)value.searchParams.set('_refresh',refresh);return value.href;
  }
  function announce(message){if(message===reported)return;reported=message;const node=document.getElementById('update-status');if(node)node.textContent=message;}
  async function applyPending(){
    if(!pending||!hooks||document.hidden||!hooks.canReload())return false;
    if(hooks.save()===false){announce('Actualización lista. Guarda una copia de tu partida desde el mapa para conservarla.');return false;}
    const target=new URL(location.href);target.searchParams.delete('_refresh');target.searchParams.set('_build',pending.version);
    announce('Partida guardada. Abriendo la nueva versión…');location.replace(target.href);return true;
  }
  async function check(manual=false){
    if(!online){if(manual)announce('Esta copia local ya está lista. Para actualizarla, reemplaza sus archivos con el nuevo paquete.');return false;}
    if(busy)return false;busy=true;
    try{
      const manifest=await (await fetchFresh('version.json')).json();if(!valid(manifest))throw new Error('Versión no válida.');
      if(manifest.version===current.version){if(manual)announce('Ya tienes la versión más reciente. Tu partida está guardada.');return false;}
      const html=await (await fetchFresh('index.html')).text(),version=/<html\b[^>]*\bdata-version\s*=\s*["']([^"']+)["']/i.exec(html)?.[1];
      if(version!==manifest.version){announce('Se está publicando una actualización. Seguimos jugando y la revisaremos de nuevo.');return false;}
      pending=manifest;announce('Nueva versión lista. Se aplicará al volver al patio; tu partida se conserva.');
      return await applyPending();
    }catch(_){if(manual)announce('No se pudo comprobar la actualización. Tu partida sigue disponible; lo intentaremos de nuevo.');return false;}
    finally{busy=false;}
  }
  window.SchoolUpdater={check,configure(value){hooks=value;},isPending:()=>!!pending,status:()=>reported};
  async function load(path){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url(path);script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error('No se pudo cargar '+path));document.head.append(script);});}
  (async()=>{
    if(online){
      try{
        const manifest=await (await fetchFresh('version.json')).json();
        if(valid(manifest)){
          if(manifest.version!==documentVersion){
            const html=await (await fetchFresh('index.html')).text();
            if(/<html\b[^>]*\bdata-version\s*=\s*["']([^"']+)["']/i.exec(html)?.[1]===manifest.version){const target=new URL(location.href);target.searchParams.set('_build',manifest.version);location.replace(target.href);return;}
          }else{current=manifest;try{localStorage.setItem(manifestKey,JSON.stringify(manifest));}catch(_){}}
        }
      }catch(_){try{const saved=JSON.parse(localStorage.getItem(manifestKey));if(valid(saved)&&saved.version===documentVersion)current=saved;}catch(_){}}
    }
    window.SchoolAssets={url,version:current.version,refresh};document.getElementById('game-style').href=url('style.css');
    for(const path of ['engine.js','characters.js','adventure-save.js','update-runtime.js','audio.js','school-settings.js','keyboard.js','character-ui.js','playground-engine.js','playground-ui.js','missions-engine.js','missions-ui.js','pacman-engine.js','pacman-ui.js','theater-song.js','theater-engine.js','theater-ui.js','game.js','school-editor.js'])await load(path);
    if(online){
      setInterval(()=>void check(),60000);setInterval(()=>void applyPending(),1200);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});window.addEventListener('focus',()=>void check());window.addEventListener('online',()=>void check());
    }
  })().catch(error=>{
    console.error(error);document.getElementById('load-status').textContent='No se pudo cargar el paquete completo. Comprueba tu conexión o sube todos los archivos de la actualización.';
    const button=document.getElementById('start-button');button.disabled=false;button.textContent='Volver a cargar';
    button.addEventListener('click',()=>{const fresh=new URL(location.href);fresh.searchParams.set('_refresh',String(Date.now()));location.replace(fresh.href);},{once:true});
  });
})();
