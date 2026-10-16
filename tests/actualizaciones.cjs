'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../bootstrap.js'),'utf8');
async function boot({documentVersion='v8-a',manifestVersion='v8-a',htmlVersion=manifestVersion,offline=false}={}){
 const listeners={},nodes=new Map(),loads=[],replacements=[],requests=[],intervals=[],store=new Map([['insurgentes-school-settings-v1','escuela-original'],['insurgentes-adventure-v1','partida-original'],['otro-juego','otro']]);
 const state={manifestVersion,htmlVersion,offline};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,textContent:'',addEventListener(){}});return nodes.get(id);};
 const document={hidden:false,documentElement:{dataset:{version:documentVersion}},getElementById:node,createElement:()=>({}),head:{append(script){loads.push(script.src);queueMicrotask(()=>script.onload?.());}},addEventListener(name,fn){listeners[name]=fn;}};
 const location={href:'https://u.github.io/los-insurgentes/?opcion=si',origin:'https://u.github.io',protocol:'https:',replace(value){replacements.push(value);}};
 const context={document,location,console,URL,AbortController,localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>1,clearTimeout(){},setInterval(fn,time){intervals.push({fn,time});return 1;},addEventListener(name,fn){listeners[name]=fn;},async fetch(value,options){requests.push({url:new URL(value),options});if(state.offline)throw new Error('offline');const path=new URL(value).pathname;return {ok:true,json:async()=>({version:state.manifestVersion,assets:{'engine.js':'engine-hash','assets/mapa.png':'map-hash'}}),text:async()=>'<html lang="es" data-version="'+state.htmlVersion+'">',status:200};}};
 context.window=context;vm.runInNewContext(source,context,{filename:'bootstrap.js'});await new Promise(setImmediate);return {context,state,nodes,loads,replacements,requests,intervals,store};
}
test('arranque usa hashes por archivo y conserva claves de v7 y de otros juegos',async()=>{
 const r=await boot();assert.equal(r.loads.length,19);assert(r.loads.some(s=>s.includes('engine.js?v=engine-hash')));assert.equal(r.store.get('insurgentes-school-settings-v1'),'escuela-original');assert.equal(r.store.get('otro-juego'),'otro');assert(r.requests.every(r=>r.options.cache==='no-store'));assert.equal(r.replacements.length,0);
});
test('una página HTML anterior se actualiza antes de mezclar scripts de versiones distintas',async()=>{
 const r=await boot({manifestVersion:'v8-b'});assert.equal(r.loads.length,0);assert.equal(r.replacements.length,1);const url=new URL(r.replacements[0]);assert.equal(url.pathname,'/los-insurgentes/');assert.equal(url.searchParams.get('_build'),'v8-b');assert.equal(url.searchParams.get('opcion'),'si');assert.equal(r.store.get('insurgentes-adventure-v1'),'partida-original');
});
test('actualización incompleta no provoca un bucle de recarga',async()=>{
 const r=await boot();r.state.manifestVersion='v8-b';r.state.htmlVersion='v8-a';r.context.SchoolUpdater.configure({canReload:()=>true,save:()=>true});await r.context.SchoolUpdater.check();assert.equal(r.replacements.length,0);assert.equal(r.context.SchoolUpdater.isPending(),false);assert.match(r.nodes.get('update-status').textContent,/publicando/);
});
test('actualización espera al terminar el minijuego y guarda antes de recargar',async()=>{
 const r=await boot();r.state.manifestVersion='v8-b';r.state.htmlVersion='v8-b';let ready=false,saves=0;
 r.context.SchoolUpdater.configure({canReload:()=>ready,save:()=>{saves++;assert.equal(r.replacements.length,0);return true;}});await r.context.SchoolUpdater.check();assert.equal(r.replacements.length,0);assert.equal(saves,0);assert(r.context.SchoolUpdater.isPending());ready=true;r.intervals.find(i=>i.time===1200).fn();await new Promise(setImmediate);assert.equal(saves,1);assert.equal(r.replacements.length,1);assert.equal(r.store.get('otro-juego'),'otro');
});
test('si no puede guardar, no recarga; sin conexión permite usar los archivos ya disponibles',async()=>{
 const r=await boot();r.state.manifestVersion='v8-b';r.state.htmlVersion='v8-b';r.context.SchoolUpdater.configure({canReload:()=>true,save:()=>false});await r.context.SchoolUpdater.check();assert.equal(r.replacements.length,0);assert.match(r.nodes.get('update-status').textContent,/copia/);
 const offline=await boot({offline:true});assert.equal(offline.loads.length,19);assert.equal(offline.replacements.length,0);
});
