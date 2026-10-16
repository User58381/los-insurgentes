(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolMissions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TASKS={
    dibujo:{type:'drawing',npc:'angel',scene:'classroom',title:'Pinta con el maestro Ángel',commission:'Arte y creatividad',copy:'¡Vamos a pintar en nuestro salón! Sigue las claves del 1 al 6. Mueve la cubeta con las flechas o la palanca. Elige un color y pulsa Enter / A dentro de una figura para rellenarla. Hay 12 zonas y 90 segundos. Puedes corregir los colores.'},
    ingles:{type:'english',npc:'raul',title:'English con el Teacher Raúl',commission:'Inglés',copy:'Hello! Soy el Teacher Raúl. Mira los colores y los útiles escolares. Elige la palabra correcta en inglés con las flechas o la cruceta y confirma con Enter / A. Si te equivocas, te ayudo a intentarlo otra vez.'},
    uniforme:{type:'uniform',npc:'angelica',title:'El uniforme con Angélica',commission:'Uniforme escolar',copy:'¡Hola! Soy la maestra Angélica. Mira la imagen y el día que aparece. ¿Es un uniforme permitido para ese día? Responde Verdadero o Falso. Vamos a reconocer el uniforme de toda la semana.'},
    puntualidad:{type:'punctuality',npc:'luis_miguel',title:'A tiempo con Luis Miguel y Norma',commission:'Puntualidad',copy:'El maestro Luis Miguel y la maestra Norma te invitamos a llegar a tiempo. Entramos a las 8:00 a. m. y salimos a las 12:30 p. m. Lee los relojes y elige hábitos que te ayuden a prepararte.'}
  };
  const WIDTH=720,HEIGHT=460,DRAW_SECONDS=90;
  const COLORS=[{key:1,name:'Rojo',color:'#e95453'},{key:2,name:'Amarillo',color:'#f5ca54'},{key:3,name:'Verde',color:'#67af75'},{key:4,name:'Azul',color:'#56a4d9'},{key:5,name:'Café',color:'#a46c42'},{key:6,name:'Blanco',color:'#ffffff'}];
  const DRAW_REGIONS=[
    {id:'pasto',key:3,shape:'rect',bounds:[40,284,640,70],label:[610,330]},
    {id:'camino',key:5,shape:'polygon',points:[[270,354],[315,284],[405,284],[450,354]],label:[360,331]},
    {id:'escuela',key:2,shape:'rect',bounds:[230,150,260,135],label:[360,185]},
    {id:'techo',key:1,shape:'polygon',points:[[215,150],[360,55],[505,150]],label:[360,121]},
    {id:'ventana-izquierda',key:4,shape:'rect',bounds:[255,190,50,48],label:[280,215]},
    {id:'ventana-derecha',key:4,shape:'rect',bounds:[415,190,50,48],label:[440,215]},
    {id:'puerta',key:4,shape:'rect',bounds:[337,227,46,58],label:[360,257]},
    {id:'tronco',key:5,shape:'rect',bounds:[128,228,24,68],label:[140,269]},
    {id:'arbol',key:3,shape:'ellipse',bounds:[140,190,50,50],label:[140,190]},
    {id:'sol',key:2,shape:'ellipse',bounds:[590,90,32,32],label:[590,90]},
    {id:'nube',key:6,shape:'ellipse',bounds:[130,80,62,25],label:[130,80]},
    {id:'flor',key:1,shape:'ellipse',bounds:[570,250,24,24],label:[570,250]}
  ];
  const PALETTE=COLORS.map((color,index)=>({...color,x:36+index*108,y:390,width:100,height:50}));
  const ENGLISH_CARDS=[
    {prompt:'¿Cómo se dice «rojo» en inglés?',picture:'color',color:'#e95453',options:['red','blue','yellow'],answer:0,explanation:'Red significa rojo. ¡Muy bien!'},
    {prompt:'¿Cómo se dice «azul» en inglés?',picture:'color',color:'#56a4d9',options:['green','red','blue'],answer:2,explanation:'Blue significa azul. ¡Bien hecho!'},
    {prompt:'¿Cómo se dice «amarillo» en inglés?',picture:'color',color:'#f5ca54',options:['yellow','blue','green'],answer:0,explanation:'Yellow significa amarillo. ¡Muy bien!'},
    {prompt:'Mira el dibujo. ¿Cómo se dice «lápiz»?',picture:'pencil',options:['book','pencil','backpack'],answer:1,explanation:'Pencil significa lápiz. Lo usamos para escribir y dibujar.'},
    {prompt:'Mira el dibujo. ¿Cómo se dice «libro»?',picture:'book',options:['backpack','pencil','book'],answer:2,explanation:'Book significa libro. Podemos leer y aprender en él.'},
    {prompt:'Mira el dibujo. ¿Cómo se dice «mochila»?',picture:'backpack',options:['backpack','book','pencil'],answer:0,explanation:'Backpack significa mochila. Good job! ¡Buen trabajo!'}
  ];
  const PUNCTUALITY_CARDS=[
    {prompt:'¿A qué hora entramos a la escuela?',picture:'clock',hour:8,minute:0,period:'a. m.',options:['8:30 a. m.','8:00 a. m.','9:00 a. m.'],answer:1,explanation:'La entrada es a las 8:00 a. m. Llegar con tiempo nos ayuda a comenzar tranquilos.'},
    {prompt:'¿A qué hora salimos de la escuela?',picture:'clock',hour:12,minute:30,period:'p. m.',options:['12:00 p. m.','1:00 p. m.','12:30 p. m.'],answer:2,explanation:'La salida es a las 12:30 p. m. Esperamos a nuestra familia con orden.'},
    {prompt:'La entrada es a las 8:00. ¿Qué llegada te permite prepararte con tiempo?',picture:'clock',hour:7,minute:50,period:'a. m.',options:['7:50 a. m.','8:15 a. m.','8:30 a. m.'],answer:0,explanation:'A las 7:50 a. m. todavía faltan diez minutos para entrar. Podemos llegar y organizarnos sin correr.'},
    {prompt:'¿Qué hábito ayuda a llegar puntual?',picture:'backpack',options:['Buscar los cuadernos al salir','Preparar la mochila desde la noche','Dormirse muy tarde'],answer:1,explanation:'Preparar la mochila y el uniforme desde la noche ayuda a salir con tiempo.'},
    {prompt:'Si ya suena la entrada, ¿qué hacemos para cuidar a todos?',picture:'school',options:['Empujar para pasar primero','Correr entre los compañeros','Entrar con calma y seguir las indicaciones'],answer:2,explanation:'La puntualidad también se acompaña de orden y respeto. Entramos con calma, sin empujar.'}
  ];
  const clone=value=>JSON.parse(JSON.stringify(value)),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function uniformCards(game){
    return [[1,1],[2,2],[2,4],[3,1],[4,4],[5,2],[1,3],[5,5]].map(([day,shownDay])=>{
      const expected=game.UNIFORM_DAYS[day],shown=game.UNIFORM_DAYS[shownDay],allowed=[expected.column];
      if(day===2)allowed.push(game.UNIFORM_DAYS[4].column);
      const valid=allowed.includes(shown.column);
      return {prompt:'¿Este uniforme está permitido el '+expected.name.toLowerCase()+'?',picture:'uniform',day,shownDay,options:['Verdadero','Falso'],answer:valid?0:1,explanation:expected.name+': '+expected.description+(day===2?' También se permite el uniforme blanco y de cuadros.':'')};
    });
  }
  function createState(id,game,hostId){
    if(!TASKS[id])throw new Error('Misión desconocida.');
    return {id,type:TASKS[id].type,hostId:hostId||TASKS[id].npc,phase:'intro',won:false,score:0,index:0,answered:false,mistakes:0,events:[],message:TASKS[id].copy,
      time:0,remaining:id==='dibujo'?DRAW_SECONDS:null,tickClock:0,reason:null,cursor:{x:360,y:185},selectedColor:0,
      regions:id==='dibujo'?DRAW_REGIONS.map(region=>({...clone(region),paint:null})):[],
      cards:id==='uniforme'?uniformCards(game):clone(id==='ingles'?ENGLISH_CARDS:id==='puntualidad'?PUNCTUALITY_CARDS:[])};
  }
  function emit(state,type,payload={}){state.events.push({type,...payload});}
  function finish(state,won,reason=null){
    if(state.phase==='complete')return false;state.phase='complete';state.won=won;state.reason=reason;
    state.message=won?(state.type==='drawing'?'¡Terminaste el dibujo siguiendo todas las claves!':'¡Misión conseguida! '+(state.type==='punctuality'?'Entrada: 8:00 a. m. · Salida: 12:30 p. m.':'¡Gracias por aprender con tu maestro!')):'Se acabó el tiempo. Pintaste correctamente '+state.score+' de '+state.regions.length+' zonas. ¡Puedes intentarlo de nuevo!';
    emit(state,'complete',{won,score:state.score,reason});return true;
  }
  function pointInPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [ax,ay]=points[i],[bx,by]=points[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }return inside;}
  function contains(region,x,y){
    const b=region.bounds;if(region.shape==='rect')return x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3];
    if(region.shape==='ellipse')return ((x-b[0])/b[2])**2+((y-b[1])/b[3])**2<=1;
    return pointInPolygon(x,y,region.points);
  }
  function hitRegion(state,x=state.cursor.x,y=state.cursor.y){return [...state.regions].reverse().find(region=>contains(region,x,y))||null;}
  function setCursor(state,x,y){if(state.type!=='drawing'||state.phase!=='playing')return false;state.cursor.x=clamp(Number(x)||0,10,WIDTH-10);state.cursor.y=clamp(Number(y)||0,10,HEIGHT-10);return true;}
  function color(state,index){if(state.type!=='drawing'||state.phase!=='playing'||!Number.isInteger(index)||!COLORS[index])return false;state.selectedColor=index;state.message='Color '+COLORS[index].key+': '+COLORS[index].name+'. Busca ese número y pulsa Enter / A.';return true;}
  function cycleColor(state,step){return color(state,(state.selectedColor+step+COLORS.length)%COLORS.length);}
  function action(state){
    if(state.phase==='intro'){state.phase='playing';state.message=state.type==='drawing'?'Elige un color, busca su número y rellena con Enter / A.':state.cards[0].prompt;return true;}
    if(state.phase==='paused')return resume(state);
    if(state.phase!=='playing')return false;
    if(state.type!=='drawing'){
      if(!state.answered)return false;
      if(state.index+1===state.cards.length)return finish(state,true);
      state.index++;state.answered=false;state.message=state.cards[state.index].prompt;return true;
    }
    const chip=PALETTE.find(c=>state.cursor.x>=c.x&&state.cursor.x<=c.x+c.width&&state.cursor.y>=c.y&&state.cursor.y<=c.y+c.height);
    if(chip)return color(state,chip.key-1);
    const region=hitRegion(state);if(!region){state.message='Coloca la cubeta dentro de una figura o de un color de la paleta.';return false;}
    if(region.paint===state.selectedColor)return false;
    region.paint=state.selectedColor;const correct=region.key===state.selectedColor+1;
    state.score=state.regions.filter(area=>area.paint===area.key-1).length;
    if(correct){state.message='¡Bien! '+state.score+' de '+state.regions.length+' zonas correctas.';emit(state,'correct');}
    else{state.mistakes++;state.message='La zona tiene el número '+region.key+': usa '+COLORS[region.key-1].name.toLowerCase()+'. Puedes volver a rellenarla.';emit(state,'try');}
    if(state.score===state.regions.length)finish(state,true);return correct;
  }
  function answer(state,index){
    if(state.phase!=='playing'||state.type==='drawing'||state.answered||!Number.isInteger(index)||index<0||index>=state.cards[state.index].options.length)return false;
    const card=state.cards[state.index],correct=index===card.answer;
    if(correct){state.score++;state.answered=true;state.message='¡Correcto! '+card.explanation;emit(state,'correct');}
    else{state.mistakes++;state.message='Inténtalo de nuevo. '+(state.type==='uniform'?card.explanation:state.type==='english'?'Mira el dibujo y compara las palabras.':card.explanation);emit(state,'try');}
    return correct;
  }
  function pause(state){if(state.phase!=='playing')return false;state.phase='paused';return true;}
  function resume(state){if(state.phase!=='paused')return false;state.phase='playing';return true;}
  function tick(state,dt,input={}){
    if(state.phase!=='playing')return;dt=clamp(Number(dt)||0,0,.05);state.time+=dt;
    if(state.type!=='drawing')return;
    state.remaining=Math.max(0,DRAW_SECONDS-state.time);if(state.remaining<.000001){state.remaining=0;finish(state,false,'timeout');return;}
    state.tickClock+=dt;const interval=state.remaining<=10?.5:1;
    if(state.tickClock+.000001>=interval){state.tickClock=Math.max(0,state.tickClock-interval);emit(state,'timer-tick',{urgent:state.remaining<=10});}
    const x=clamp(Number(input.x)||0,-1,1),y=clamp(Number(input.y)||0,-1,1),length=Math.max(1,Math.hypot(x,y));
    setCursor(state,state.cursor.x+x/length*270*dt,state.cursor.y+y/length*270*dt);
  }
  function snapshot(state){return state?{id:state.id,type:state.type,phase:state.phase,won:state.won,score:state.score,total:state.type==='drawing'?state.regions.length:state.cards.length,index:state.index,answered:state.answered,remaining:state.remaining===null?null:Math.max(0,Math.round(state.remaining*1000)/1000),reason:state.reason,message:state.message,selectedColor:state.selectedColor+1,cursor:{...state.cursor},hostId:state.hostId}:null;}
  return {TASKS,WIDTH,HEIGHT,DRAW_SECONDS,COLORS,DRAW_REGIONS,PALETTE,ENGLISH_CARDS,PUNCTUALITY_CARDS,uniformCards,createState,contains,hitRegion,setCursor,color,cycleColor,action,answer,pause,resume,tick,snapshot};
});
