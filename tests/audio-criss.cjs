'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../audio.js');
class Media{
 constructor(){this.paused=true;this.src='';this.listeners={};}
 addEventListener(event,fn){this.listeners[event]=fn;}
 play(){if(this.rejectNextPlay){const error=this.rejectNextPlay;this.rejectNextPlay=null;this.paused=true;return Promise.reject(error);}this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}
}
class Context{
 constructor(){this.state='running';this.currentTime=0;this.destination={};this.created=[];}
 resume(){this.state='running';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
 decodeAudioData(bytes){return Promise.resolve({bytes});}
 createBufferSource(){const voice={playbackRate:{value:1},connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};this.created.push(voice);return voice;}
}
function make(fetch){return new A.Player({Audio:Media,AudioContext:Context,fetch:fetch|| (async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}))});}
test('audio: limpieza usa la pista recibida y vuelve a la música del patio',async()=>{
 const p=make();p.setScene('cleanup');assert.equal(p.music.src,'assets/audio/limpieza-criss.mp3');assert(p.music.loop);await p.activate();assert.equal(p.music.paused,false);
 p.setMusicPaused(true);assert(p.music.paused);p.setMusicPaused(false);await new Promise(setImmediate);assert.equal(p.music.paused,false);
 p.setScene('outside');assert.equal(p.music.src,'assets/audio/cancionpatio2.mp3');p.destroy();
});
test('audio: ambos ritmos usan el WAV corto; silencio y pausa bloquean el SFX',async()=>{
 const paths=[],p=make(async url=>{paths.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};});await p.activate();
 assert(await p.effect('cleanup-tick'));assert.equal(p.context.created.at(-1).playbackRate.value,1);
 assert(await p.effect('cleanup-tick-urgent'));assert.equal(p.context.created.at(-1).playbackRate.value,1.18);assert(paths.includes('assets/audio/contador-criss.wav'));assert.equal(paths.filter(v=>v.endsWith('contador-criss.wav')).length,1);
 const count=p.context.created.length;p.setEnabled(false);assert.equal(await p.effect('cleanup-tick'),false);assert.equal(p.context.created.length,count);p.setEnabled(true);p.setPaused(true);assert.equal(await p.effect('cleanup-tick'),false);p.destroy();
});
test('audio: salir descarta un tick cuyo WAV todavía estaba cargando',async()=>{
 let release;const p=make(url=>url.endsWith('contador-criss.wav')?new Promise(resolve=>{release=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});}):Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}));
 await p.activate();await new Promise(setImmediate);const pending=p.effect('cleanup-tick');p.stopVoices();release();assert.equal(await pending,false);assert.equal(p.context.created.length,0);p.destroy();
});
test('audio: los archivos recibidos están incluidos y el efecto es PCM WAV corto',()=>{
 const root=path.resolve(__dirname,'..');const wav=fs.readFileSync(path.join(root,'assets/audio/contador-criss.wav'));
 assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');assert(wav.length>1000&&wav.length<100000);assert(fs.statSync(path.join(root,'assets/audio/limpieza-criss.mp3')).size>1000000);
});
test('audio: las copias locales pueden reproducir el WAV aunque fetch no tenga acceso',async()=>{
 const p=make(async()=>{throw new Error('file CORS');});await p.activate();assert(await p.effect('cleanup-tick'));assert.equal(p.voices.size,1);p.setPaused(true);assert.equal(p.voices.size,0);p.destroy();
});
test('audio: fútbol y cuerda usan cada uno su MP3 recibido, con repetición',async()=>{
 const p=make();await p.activate();for(const [scene,file] of [['football','assets/audio/futbol.mp3'],['rope','assets/audio/cuerda-dalila.mp3']]){p.setScene(scene);assert.equal(p.music.src,file);assert(p.music.loop);}p.destroy();
});
test('audio: un play interrumpido al volver de un minijuego se recupera sin silenciar',async()=>{
 let now=0;const p=new A.Player({Audio:Media,AudioContext:Context,now:()=>now});await p.activate();await new Promise(setImmediate);p.setMusicPaused(true);
 p.music.rejectNextPlay={name:'AbortError'};p.setMusicPaused(false);await new Promise(setImmediate);assert(p.blocked);assert(p.enabled);assert(p.music.paused);
 now=1499;p.update();assert(p.blocked);now=1501;p.update();await new Promise(setImmediate);assert.equal(p.blocked,false);assert.equal(p.music.paused,false);assert(p.enabled);
 p.setEnabled(false);now=10000;p.update();assert(p.music.paused);assert.equal(p.enabled,false);p.destroy();
});
test('audio: un rechazo pendiente de la escena anterior no bloquea la nueva pista',async()=>{
 let reject;class Delayed extends Media{play(){if(!this.first){this.first=true;return new Promise((_,r)=>{reject=r;});}return super.play();}}
 const p=new A.Player({Audio:Delayed,AudioContext:Context});await p.activate();p.setMusicPaused(true);p.setScene('outside');p.setMusicPaused(false);await new Promise(setImmediate);reject({name:'AbortError'});await new Promise(setImmediate);assert.equal(p.blocked,false);assert.equal(p.playPending,false);assert.equal(p.music.paused,false);p.destroy();
});
