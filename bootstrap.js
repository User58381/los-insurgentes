(function(){
  'use strict';
  const version=document.documentElement.dataset.version;
  const refresh=new URL(location.href).searchParams.get('_refresh');
  function url(path){
    const value=new URL(path,location.href);
    if(!['http:','https:'].includes(value.protocol)||value.origin!==location.origin)return path;
    value.searchParams.set('v',version);if(refresh)value.searchParams.set('_refresh',refresh);
    return value.href;
  }
  window.SchoolAssets={url,version,refresh};
  document.getElementById('game-style').href=url('style.css');
  async function load(path){
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=url(path);script.async=false;
      script.onload=resolve;script.onerror=()=>reject(new Error('No se pudo cargar '+path));document.head.append(script);
    });
  }
  (async()=>{
    for(const path of ['engine.js','audio.js','school-settings.js','game.js','school-editor.js'])await load(path);
  })().catch(error=>{
    console.error(error);
    document.getElementById('load-status').textContent='La actualización está incompleta. Sube todos los archivos del paquete a GitHub y vuelve a cargar el juego.';
    const button=document.getElementById('start-button');button.disabled=false;button.textContent='Volver a cargar';
    button.addEventListener('click',()=>{const fresh=new URL(location.href);fresh.searchParams.set('_refresh',String(Date.now()));location.replace(fresh.href);},{once:true});
  });
})();
