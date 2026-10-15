(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolAudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const AUDIO_PATHS={
    patio1:'assets/audio/cancionpatio1.mp3',patio2:'assets/audio/cancionpatio2.mp3',
    classroom:'assets/audio/cancion3a.mp3',trompo:'assets/audio/retooliver.mp3',
    start:'assets/audio/start-106.wav',throw:'assets/audio/trompo-435.wav',kick:'assets/audio/balon-130.wav',
    cleanup:'assets/audio/limpieza-criss.mp3','cleanup-tick':'assets/audio/contador-criss.wav',
    football:'assets/audio/futbol.mp3',rope:'assets/audio/cuerda-dalila.mp3'
  };
  const PLAYLISTS={title:['patio1'],welcome:['patio1'],outside:['patio2','patio1'],classroom:['classroom'],trompo:['trompo'],cleanup:['cleanup'],football:['football'],rope:['rope']};
  // Keep the existing short educational cues alongside the supplied samples.
  const EFFECTS={correct:[72,76],star:[72,76,79],victory:[72,76,79,84],goal:[67,72,79],try:[62,60]};
  const PAC_EFFECTS={
    'pac-dot':{notes:[78,66],step:.035,length:.045,volume:.055},
    'pac-power':{notes:[72,79,84,91],step:.065,length:.11,volume:.09},
    'pac-ready':{notes:[60,67,72,76,79],step:.075,length:.13,volume:.08},
    'pac-hit':{notes:[67,64,60,55,48],step:.06,length:.12,volume:.08}
  };
  class Player{
    constructor(options={}){
      this.Context=options.AudioContext||root.AudioContext||root.webkitAudioContext;
      this.Audio=options.Audio||root.Audio;
      this.fetch=options.fetch||root.fetch?.bind(root);
      this.sources={...AUDIO_PATHS,...root.INSURGENTES_AUDIO,...options.sources};
      this.context=null;this.master=null;this.enabled=true;this.ready=false;this.activated=false;this.paused=false;this.musicOnlyPaused=false;
      this.scene='title';this.track='patio1';this.playlist=PLAYLISTS.title;this.playlistIndex=0;
      this.voices=new Set();this.bufferPromises=new Map();this.effectEpoch=0;
      this.music=null;this.playPending=false;this.blocked=false;this.playEpoch=0;this.destroyed=false;
      this.now=options.now||(()=>root.performance?.now?.()??Date.now());this.retryAt=0;
      if(this.Audio){
        this.music=new this.Audio();this.music.preload='none';this.music.volume=.32;
        this.music.addEventListener('ended',()=>{
          if(this.destroyed||this.playlist.length<2)return;
          this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;
          this.useTrack(this.playlist[this.playlistIndex]);
        });
        this.music.addEventListener('error',()=>{this.blocked=true;this.playPending=false;this.retryAt=this.now()+1500;});
        this.useTrack(this.track);
      }
    }
    async activate(){
      if(this.destroyed)return false;
      this.activated=true;this.blocked=false;this.retryAt=0;
      // Call play and resume directly in the gesture, before any asynchronous load.
      this.startMusic();
      try{
        if(this.Context&&!this.context){this.context=new this.Context();this.master=this.context.createGain();this.master.gain.value=.45;this.master.connect(this.context.destination);}
        if(this.context)await this.context.resume();
        this.ready=this.context?.state==='running'||!!(this.music&&!this.music.paused);
        if(this.context?.state==='running')for(const kind of ['start','throw','kick','cleanup-tick'])void this.loadBuffer(kind);
        return this.ready;
      }catch(_){this.ready=!!(this.music&&!this.music.paused);return this.ready;}
    }
    startMusic(){
      if(!this.music||!this.activated||!this.enabled||this.paused||this.musicOnlyPaused||this.destroyed||this.blocked||this.playPending||!this.music.paused)return;
      this.playPending=true;const epoch=this.playEpoch;
      try{
        Promise.resolve(this.music.play()).then(()=>{
          if(epoch!==this.playEpoch)return;
          this.playPending=false;
          this.blocked=false;this.retryAt=0;
          if(!this.enabled||this.paused||this.destroyed)this.music.pause();
        }).catch(()=>{if(epoch===this.playEpoch){this.playPending=false;this.blocked=true;this.retryAt=this.now()+1500;}});
      }catch(_){this.playPending=false;this.blocked=true;this.retryAt=this.now()+1500;}
    }
    pauseMusic(){if(this.music)this.music.pause();this.playEpoch++;this.playPending=false;}
    useTrack(key){
      const changed=this.track!==key||!this.music?.src;
      this.track=key;
      if(!this.music)return;
      if(changed){this.pauseMusic();this.music.src=this.sources[key];this.blocked=false;this.retryAt=0;}
      this.music.loop=this.playlist.length===1;
      this.startMusic();
    }
    setScene(scene){
      if(this.scene===scene)return;
      this.scene=scene;this.playlist=PLAYLISTS[scene]||PLAYLISTS.outside;this.playlistIndex=0;
      this.useTrack(this.playlist[0]);
    }
    stopVoices(){for(const voice of this.voices){try{voice.stop();}catch(_){}}this.voices.clear();this.effectEpoch++;}
    setEnabled(enabled){
      this.enabled=!!enabled;
      if(!this.enabled){this.pauseMusic();this.stopVoices();}else{this.blocked=false;this.retryAt=0;this.startMusic();}
    }
    setPaused(paused){
      if(this.paused===!!paused)return;
      this.paused=!!paused;
      if(this.paused){this.pauseMusic();this.stopVoices();}else{this.blocked=false;this.retryAt=0;this.startMusic();}
    }
    setMusicPaused(paused){
      if(this.musicOnlyPaused===!!paused)return;this.musicOnlyPaused=!!paused;
      if(this.musicOnlyPaused)this.pauseMusic();else{this.blocked=false;this.retryAt=0;this.startMusic();}
    }
    async loadBuffer(kind){
      if(!this.context?.decodeAudioData||!this.fetch)return null;
      if(!this.bufferPromises.has(kind)){
        const request=Promise.resolve().then(()=>this.fetch(this.sources[kind])).then(response=>{
          if(!response.ok)throw new Error('Audio unavailable');return response.arrayBuffer();
        }).then(bytes=>this.context.decodeAudioData(bytes)).catch(()=>null);
        this.bufferPromises.set(kind,request);
      }
      return this.bufferPromises.get(kind);
    }
    attachVoice(voice,gain){
      this.voices.add(voice);voice.onended=()=>{this.voices.delete(voice);voice.disconnect();gain?.disconnect();};
    }
    note(midi,at,length,volume,type='triangle'){
      if(!midi||!this.context||this.context.state!=='running')return;
      const osc=this.context.createOscillator(),gain=this.context.createGain();
      osc.type=type;osc.frequency.value=440*Math.pow(2,(midi-69)/12);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
      osc.connect(gain);gain.connect(this.master);this.attachVoice(osc,gain);osc.start(at);osc.stop(at+length+.025);
    }
    update(){
      if(this.blocked&&this.activated&&this.enabled&&!this.paused&&!this.musicOnlyPaused&&this.now()>=this.retryAt){
        this.blocked=false;this.retryAt=0;
        if(this.music?.error){
          if(this.playlist.length>1){this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;this.useTrack(this.playlist[this.playlistIndex]);}
          else this.music.load();
        }
      }
      this.startMusic();
    }
    async mediaEffect(sample,urgent,epoch){
      // Local file:// copies cannot fetch WAV bytes in some browsers.
      // The media element can still play the supplied file directly.
      if(!this.Audio)return false;
      const media=new this.Audio();media.src=this.sources[sample];media.preload='auto';media.volume=.45;media.playbackRate=urgent?1.18:1;
      const cleanup=()=>{this.voices.delete(voice);media.pause();media.removeAttribute('src');media.load();};
      const voice={stop:cleanup};this.voices.add(voice);
      media.addEventListener('ended',cleanup,{once:true});media.addEventListener('error',cleanup,{once:true});
      try{await media.play();if(epoch!==this.effectEpoch||!this.enabled||this.paused||this.destroyed){cleanup();return false;}return true;}
      catch(_){cleanup();return false;}
    }
    async effect(kind){
      if(!this.ready||!this.enabled||this.paused||this.destroyed||this.context?.state!=='running')return false;
      if(PAC_EFFECTS[kind]){const cue=PAC_EFFECTS[kind],now=this.context.currentTime;cue.notes.forEach((midi,i)=>this.note(midi,now+i*cue.step,cue.length,cue.volume,'square'));return true;}
      if(['start','throw','kick','cleanup-tick','cleanup-tick-urgent'].includes(kind)){
        const urgent=kind==='cleanup-tick-urgent',sample=urgent?'cleanup-tick':kind;
        const epoch=this.effectEpoch,buffer=await this.loadBuffer(sample);
        if(epoch!==this.effectEpoch||!this.enabled||this.paused||this.destroyed)return false;
        if(!buffer)return this.mediaEffect(sample,urgent,epoch);
        const source=this.context.createBufferSource();source.buffer=buffer;source.loop=false;
        if(urgent)source.playbackRate.value=1.18;
        source.connect(this.master);this.attachVoice(source);source.start();return true;
      }
      const notes=EFFECTS[kind]||EFFECTS.correct,now=this.context.currentTime;
      notes.forEach((midi,i)=>this.note(midi,now+i*.075,.16,.14));return true;
    }
    destroy(){
      this.destroyed=true;this.pauseMusic();this.stopVoices();
      if(this.music){this.music.removeAttribute('src');this.music.load();}
      if(this.context)void this.context.close();this.ready=false;
    }
  }
  return {Player,AUDIO_PATHS,PLAYLISTS,EFFECTS,PAC_EFFECTS};
});
