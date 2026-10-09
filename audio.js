(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolAudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const AUDIO_PATHS={
    patio1:'assets/audio/cancionpatio1.mp3',patio2:'assets/audio/cancionpatio2.mp3',
    classroom:'assets/audio/cancion3a.mp3',trompo:'assets/audio/retooliver.mp3',
    start:'assets/audio/start-106.wav',throw:'assets/audio/trompo-435.wav',kick:'assets/audio/balon-130.wav'
  };
  const PLAYLISTS={title:['patio1'],welcome:['patio1'],outside:['patio2','patio1'],classroom:['classroom'],trompo:['trompo']};
  // Keep the existing short educational cues alongside the supplied samples.
  const EFFECTS={correct:[72,76],star:[72,76,79],victory:[72,76,79,84],goal:[67,72,79],try:[62,60]};
  class Player{
    constructor(options={}){
      this.Context=options.AudioContext||root.AudioContext||root.webkitAudioContext;
      this.Audio=options.Audio||root.Audio;
      this.fetch=options.fetch||root.fetch?.bind(root);
      this.sources={...AUDIO_PATHS,...root.INSURGENTES_AUDIO,...options.sources};
      this.context=null;this.master=null;this.enabled=true;this.ready=false;this.activated=false;this.paused=false;
      this.scene='title';this.track='patio1';this.playlist=PLAYLISTS.title;this.playlistIndex=0;
      this.voices=new Set();this.bufferPromises=new Map();this.effectEpoch=0;
      this.music=null;this.playPending=false;this.blocked=false;this.playEpoch=0;this.destroyed=false;
      if(this.Audio){
        this.music=new this.Audio();this.music.preload='none';this.music.volume=.32;
        this.music.addEventListener('ended',()=>{
          if(this.destroyed||this.playlist.length<2)return;
          this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;
          this.useTrack(this.playlist[this.playlistIndex]);
        });
        this.music.addEventListener('error',()=>{this.blocked=true;});
        this.useTrack(this.track);
      }
    }
    async activate(){
      if(this.destroyed)return false;
      this.activated=true;this.blocked=false;
      // Call play and resume directly in the gesture, before any asynchronous load.
      this.startMusic();
      try{
        if(this.Context&&!this.context){this.context=new this.Context();this.master=this.context.createGain();this.master.gain.value=.45;this.master.connect(this.context.destination);}
        if(this.context)await this.context.resume();
        this.ready=this.context?.state==='running'||!!(this.music&&!this.music.paused);
        if(this.context?.state==='running')for(const kind of ['start','throw','kick'])void this.loadBuffer(kind);
        return this.ready;
      }catch(_){this.ready=!!(this.music&&!this.music.paused);return this.ready;}
    }
    startMusic(){
      if(!this.music||!this.activated||!this.enabled||this.paused||this.destroyed||this.blocked||this.playPending||!this.music.paused)return;
      this.playPending=true;const epoch=this.playEpoch;
      try{
        Promise.resolve(this.music.play()).then(()=>{
          if(epoch!==this.playEpoch)return;
          this.playPending=false;
          if(!this.enabled||this.paused||this.destroyed)this.music.pause();
        }).catch(()=>{if(epoch===this.playEpoch){this.playPending=false;this.blocked=true;}});
      }catch(_){this.playPending=false;this.blocked=true;}
    }
    pauseMusic(){if(this.music)this.music.pause();this.playEpoch++;this.playPending=false;}
    useTrack(key){
      const changed=this.track!==key||!this.music?.src;
      this.track=key;
      if(!this.music)return;
      if(changed){this.pauseMusic();this.music.src=this.sources[key];this.blocked=false;}
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
      if(!this.enabled){this.pauseMusic();this.stopVoices();}else this.startMusic();
    }
    setPaused(paused){
      if(this.paused===!!paused)return;
      this.paused=!!paused;
      if(this.paused){this.pauseMusic();this.stopVoices();}else this.startMusic();
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
    note(midi,at,length,volume){
      if(!midi||!this.context||this.context.state!=='running')return;
      const osc=this.context.createOscillator(),gain=this.context.createGain();
      osc.type='triangle';osc.frequency.value=440*Math.pow(2,(midi-69)/12);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
      osc.connect(gain);gain.connect(this.master);this.attachVoice(osc,gain);osc.start(at);osc.stop(at+length+.025);
    }
    update(){this.startMusic();}
    async effect(kind){
      if(!this.ready||!this.enabled||this.paused||this.destroyed||this.context?.state!=='running')return false;
      if(['start','throw','kick'].includes(kind)){
        const epoch=this.effectEpoch,buffer=await this.loadBuffer(kind);
        if(!buffer||epoch!==this.effectEpoch||!this.enabled||this.paused||this.destroyed)return false;
        const source=this.context.createBufferSource();source.buffer=buffer;source.loop=false;
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
  return {Player,AUDIO_PATHS,PLAYLISTS,EFFECTS};
});
