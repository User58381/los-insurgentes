(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SchoolGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WORLD = { outside: { width: 1215, height: 1295 }, classroom: { width: 1280, height: 800 } };
  const GAME_TITLE = 'Los Insurgentes: La aventura del saber';
  const WELCOME_TEXT = '¡Bienvenido a la Escuela Primaria Los Insurgentes! Soy el director José Guadalupe. Pasa, resuelve retos matemáticos y diviértete aprendiendo. ¿Quieres saber cómo es tu uniforme de cada día?';
  const ASSET_PATHS = {map:'assets/mapa.png',player:'assets/personaje.png',room:'assets/salon-3a-real.png',students:'assets/alumnos-uniformes.png',introBg:'assets/escuela-intro.png',directorPortrait:'assets/director-bienvenida.png',tops:'assets/trompos.png',uniformGuide:'assets/guia-uniformes-pixel.png'};
  const TOP_FRAMES = {
    red:[[113,84,275,354,137,346],[106,494,273,346,175.5,335],[127,897,276,351,100,341],[101,1330,271,327,226.5,318]],
    blue:[[499,84,276,354,138,346],[486,494,273,344,174.5,335],[514,899,275,348,95,339],[477,1330,271,327,228.5,318]]
  };
  const QUESTIONS = {
    fountain: [
      { text: 'En la biblioteca hay 125 libros de cuentos y 234 de ciencias. ¿Cuántos libros hay en total?', options: ['349 libros', '359 libros', '369 libros'], answer: 1, hint: 'Suma centenas, decenas y unidades: 100 + 200, 20 + 30 y 5 + 4.' },
      { text: 'La escuela reunió 240 botellas el lunes y 315 el martes. ¿Cuántas reunió entre los dos días?', options: ['555 botellas', '545 botellas', '565 botellas'], answer: 0, hint: 'Primero suma 240 + 300. Después agrega 15.' }
    ],
    classroom: [
      { passage: 'Lucía encontró un cuaderno en el patio. Lo llevó al maestro para que su dueño pudiera recuperarlo.', text: '¿Qué hizo Lucía después de encontrar el cuaderno?', options: ['Se lo llevó a su casa.', 'Lo dejó junto a la fuente.', 'Lo entregó al maestro.'], answer: 2, hint: 'Vuelve a leer la segunda oración. Allí se cuenta lo que hizo Lucía.' },
      { passage: 'Lucía encontró un cuaderno en el patio. Lo llevó al maestro para que su dueño pudiera recuperarlo.', text: '¿Por qué lo llevó al maestro?', options: ['Para que lo recuperara su dueño.', 'Para arrancarle las hojas.', 'Para esconderlo.'], answer: 0, hint: 'Busca en el texto las palabras «para que».' }
    ],
    field: [
      { text: 'Al contar los pases aparecen estos números: 11, 22, 33, __. ¿Qué número sigue?', options: ['43', '44', '45'], answer: 1, hint: 'Cada número aumenta 11. Suma 33 + 11.' },
      { text: 'Hay 3 equipos con 7 jugadores en cada uno. ¿Cuántos jugadores hay en total?', options: ['10 jugadores', '18 jugadores', '21 jugadores'], answer: 2, hint: 'Puedes sumar 7 + 7 + 7, o multiplicar 3 × 7.' }
    ]
  };
  const STATIONS = {
    fountain: { name: 'La fuente', subject: 'Sumas', icon: '✦', x: 998, y: 1016, reach: 82, scene: 'outside' },
    classroom: { name: 'Salón 3.º A', subject: 'Lectura', icon: '✦', x: 640, y: 145, reach: 112, scene: 'classroom' },
    field: { name: 'La cancha', subject: 'Números', icon: '✦', x: 643, y: 413, reach: 76, scene: 'outside' }
  };
  const CLASSROOM_DOOR = { x: 1090, y: 702 };
  let classroomLabelIndex = 9;
  const MAP_LABELS = [
    {text:'6.º B',x:245,y:602}, {text:'4.º A',x:338,y:602},
    {text:'2.º B',x:431,y:602}, {text:'5.º A',x:524,y:602},
    {text:'3.º B',x:617,y:602}, {text:'5.º B',x:710,y:602},
    {text:'4.º B',x:803,y:602}, {text:'1.º B',x:916,y:602},
    {text:'2.º A',x:996,y:602}, {text:'3.º A',x:1075,y:602},
    {text:'Dirección\ntarde',x:133,y:579},
    {text:'Cooperativa',x:342,y:938}, {text:'Baños',x:499,y:938},
    {text:'1.º A',x:606,y:938}, {text:'6.º A',x:709,y:938},
    {text:'Dirección',x:811,y:938}, {text:'Usos\nmúltiples',x:1035,y:815},
    {text:'Teatro',x:241,y:800}
  ];
  // Each numbered label stays attached to its physical building.
  function buildingEntrance(index) {
    const label=MAP_LABELS[index];
    if(!label)return null;
    if(index<10)return {x:label.x+15,y:index===0?697:702};
    if(index===10)return {x:148,y:699};
    if(index<16)return {x:label.x+15,y:1045};
    return index===16?{x:1055,y:1000}:{x:335,y:820};
  }
  function setClassroomBuilding(index) {
    const entrance=buildingEntrance(index);
    if(!entrance||!canStand('outside',entrance.x,entrance.y))return false;
    classroomLabelIndex=index;Object.assign(CLASSROOM_DOOR,entrance);return true;
  }
  function classroomLabel(){return MAP_LABELS[classroomLabelIndex].text.replace(/\n/g,' ');}
  // Ground footprints omit roof overhangs and stage shadows that cover walkways.
  const OUTSIDE_RECTS = [
    [89, 503, 80, 176], [206, 544, 645, 138], [875, 544, 241, 138],
    [238, 893, 637, 136], [234, 1060, 160, 80], [72, 1058, 165, 87],
    [164, 225, 34, 127], [1014, 225, 37, 129],
    [187, 711, 120, 154]
  ];
  // Fixed fences enclose the fountain plaza; only the middle gate leads to the patio.
  const FENCE_SEGMENTS = [
    [875, 984, 875, 1154], [1083, 940, 1158, 1011],
    [879, 961, 905, 939], [933, 921, 963, 899]
  ];
  // The mural belongs to the south wall of this narrow north–south hall.
  const MURAL = [[988, 724], [1082, 724], [1082, 984], [988, 984], [962, 936], [962, 738]];
  // Footprints follow the photographed room: TV/books at left, teacher desk,
  // cupboard at right, and three columns of orange chairs with open aisles.
  const ROOM_RECTS = [[113,60,116,218],[188,198,168,92],[263,108,64,91],[1048,74,113,168]];
  for (const x of [226,537,845]) for (const y of [267,390,514]) ROOM_RECTS.push([x, y, 200, 95]);
  const OUTSIDE_CIRCLES = [[998, 1016, 29], [237, 714, 6], [507, 714, 6], [665, 714, 6], [958, 714, 6]];
  const FRAME_BOUNDS = [
    [[129,80,266,351], [108,86,249,360], [98,86,239,361]],
    [[127,60,263,333], [109,60,250,333], [98,60,235,333]],
    [[129,33,269,308], [108,33,254,309], [103,33,242,309]],
    [[128,7,265,272], [108,8,254,279], [98,8,242,283]]
  ];
  const STUDENTS = [
    {id:'oliver',name:'Oliver',style:'boy'},
    {id:'estefania',name:'Estefanía',style:'girl'},
    {id:'regina',name:'Regina',style:'girl'},
    {id:'vannia',name:'Vannia',style:'girl'},
    {id:'geronimo',name:'Gerónimo',style:'boy'},
    {id:'dalila',name:'Dalila',style:'girl'},
    {id:'joaquin',name:'Joaquín',style:'boy'},
    {id:'daniel',name:'Daniel',style:'boy'},
    {id:'emiliano',name:'Emiliano',style:'boy'},
    {id:'elias',name:'Elías',style:'boy'},
    {id:'romina',name:'Romina',style:'girl'},
    {id:'arian_sofia',name:'Arian Sofía',style:'girl'},
    {id:'karla',name:'Karla',style:'girl'},
    {id:'nicolas',name:'Nicolás',style:'boy'},
    {id:'yesly',name:'Yesly',style:'girl'},
    {id:'keira',name:'Keira',style:'girl'},
    {id:'jose_alexis',name:'José Alexis',style:'boy'},
    {id:'lucia',name:'Lucía',style:'girl'},
    {id:'eden',name:'Eden',style:'boy'},
    {id:'daniel_alejandro',name:'Daniel Alejandro',style:'boy'},
    {id:'francisco',name:'Francisco',style:'boy'},
    {id:'ada',name:'Ada',style:'girl'},
    {id:'alicia',name:'Alicia',style:'girl'},
    {id:'aaron',name:'Aarón',style:'boy'},
    {id:'miguel',name:'Miguel',style:'boy'},
    {id:'karla_valeria',name:'Karla Valeria',style:'girl'},
    {id:'yaneisi',name:'Yaneisi',style:'girl'}
  ];
  const TEACHERS = [
    {id:'angel',name:'Maestro Ángel',group:'3.º A',assetKey:'teacherAngel',assetPath:'assets/maestro-angel.png',frames:[[246,79,268,536,133,524],[766,79,257,536,122.5,526],[246,629,263,531,137,520],[750,629,276,531,138.5,521]],positions:{outside:{x:1100,y:754,facing:'down'},classroom:{x:175,y:315,facing:'down'}}},
    {id:'raul',name:'Teacher Raúl',group:'',assetKey:'staffBatch1',assetPath:'assets/personal-escuela-tanda-1.png',frames:[[138,16,216,290,108.5,279],[163,308,162,277,81.5,271],[154,585,170,263,78.5,257],[139,848,207,257,103,247]],positions:{outside:{x:670,y:805,facing:'down'}}},
    {id:'claudia',name:'Señora Claudia',group:'Intendente',assetKey:'staffBatch1',assetPath:'assets/personal-escuela-tanda-1.png',frames:[[407,28,158,280,78,268],[396,314,176,271,85.5,262],[388,587,181,261,94.5,257],[405,848,151,256,76.5,246]],positions:{outside:{x:450,y:1050,facing:'down'}}},
    {id:'ema',name:'Maestra Ema',group:'2.º B',assetKey:'staffBatch1',assetPath:'assets/personal-escuela-tanda-1.png',frames:[[619,26,162,282,80,271],[630,309,154,276,60,269],[608,586,163,262,93,257],[617,848,162,259,81.5,249]],positions:{outside:{x:398,y:705,facing:'down'}}},
    {id:'luis_miguel',name:'Maestro Luis Miguel',group:'5.º A',assetKey:'staffBatch1',assetPath:'assets/personal-escuela-tanda-1.png',frames:[[842,16,154,292,76.5,283],[856,308,142,277,61,270],[845,585,145,263,76,257],[843,848,149,258,75,249]],positions:{outside:{x:563,y:705,facing:'down'}}},
    {id:'norma',name:'Maestra Norma',group:'2.º A',assetKey:'staffBatch1',assetPath:'assets/personal-escuela-tanda-1.png',frames:[[1068,24,180,284,89,276],[1090,309,170,276,66.5,272],[1058,585,177,263,104,261],[1073,848,171,264,84.5,253]],positions:{outside:{x:916,y:705,facing:'down'}}},
    {id:'emilia',name:'Maestra Emilia',group:'4.º A',assetKey:'staffBatch2',assetPath:'assets/personal-escuela-tanda-2.png',frames:[[91,13,181,315,91,311],[110,328,157,294,67,292],[88,622,162,284,94,281],[103,906,154,215,76,207]],positions:{outside:{x:245,y:697,facing:'down'}}},
    {id:'angelica',name:'Maestra Angélica',group:'5.º B',assetKey:'staffBatch2',assetPath:'assets/personal-escuela-tanda-2.png',frames:[[354,9,171,321,86,315],[363,330,166,294,71,293],[349,624,173,282,96.5,279],[366,906,147,215,73.5,207]],positions:{outside:{x:372,y:735,facing:'down'}}},
    {id:'criss',name:'Criss',group:'Intendente',assetKey:'staffBatch2',assetPath:'assets/personal-escuela-tanda-2.png',frames:[[616,19,172,311,86,305],[620,330,163,295,73.5,290],[616,625,162,281,86.5,278],[628,906,152,215,73.5,208]],positions:{outside:{x:909,y:1050,facing:'down'}}},
    {id:'emilio',name:'Maestro Emilio',group:'6.º B',assetKey:'staffBatch2',assetPath:'assets/personal-escuela-tanda-2.png',frames:[[865,4,178,323,90,320],[883,327,155,295,70,293],[879,622,154,284,79.5,281],[882,906,148,215,74.5,207]],positions:{outside:{x:525,y:790,facing:'down'}}},
    {id:'cesia',name:'Maestra Cesia',group:'4.º B',assetKey:'staffBatch2',assetPath:'assets/personal-escuela-tanda-2.png',frames:[[1114,19,223,313,113.5,305],[1138,332,190,294,81.5,290],[1128,626,194,280,107,277],[1144,906,167,215,83.5,207]],positions:{outside:{x:810,y:705,facing:'down'}}},
    {id:'blanca',name:'Maestra Blanca',group:'1.º A',assetKey:'staffBatch3',assetPath:'assets/personal-escuela-tanda-3.png',frames:[[109,11,172,306,89.5,299],[124,317,156,294,66.5,290],[110,611,156,278,86,275],[119,889,150,233,74.5,223]],positions:{outside:{x:580,y:1040,facing:'down'}}},
    {id:'diana',name:'Maestra Diana',group:'1.º B',assetKey:'staffBatch3',assetPath:'assets/personal-escuela-tanda-3.png',frames:[[361,17,176,302,88,294],[378,319,156,294,62.5,288],[362,613,157,276,94,272],[368,889,161,233,80.5,226]],positions:{outside:{x:386,y:805,facing:'down'}}},
    {id:'laura',name:'Maestra Laura',group:'3.º B',assetKey:'staffBatch3',assetPath:'assets/personal-escuela-tanda-3.png',frames:[[609,16,175,302,88,295],[623,318,161,295,61.5,289],[606,613,158,276,96,273],[618,889,155,233,78.5,226]],positions:{outside:{x:628,y:705,facing:'down'}}},
    {id:'lolo',name:'Maestro Lolo',group:'6.º A',assetKey:'staffBatch3',assetPath:'assets/personal-escuela-tanda-3.png',frames:[[857,9,176,306,87,301],[877,315,129,296,63.5,292],[875,611,130,278,69.5,275],[864,889,155,233,77.5,225]],positions:{outside:{x:714,y:1040,facing:'down'}}},
    {id:'mauricio',name:'Mauricio',group:'Administrativo · Dirección',assetKey:'staffBatch3',assetPath:'assets/personal-escuela-tanda-3.png',frames:[[1120,0,164,315,82,310],[1133,315,141,294,64.5,292],[1134,609,141,280,75.5,278],[1132,889,145,233,72.5,225]],positions:{outside:{x:831,y:1040,facing:'down'}}},
    {id:'guadalupe',name:'Maestro José Guadalupe',group:'Director',assetKey:'directorGuadalupe',assetPath:'assets/director-guadalupe.png',frames:[[243,61,288,557,146,546],[766,68,252,551,126,541],[252,636,260,548,135,539],[740,638,285,547,143,538]],positions:{outside:{x:777,y:868,facing:'down'}}}
  ];
  const ORGANIZATION_REVISION='20261009-lista-maestros';
  const OFFICIAL_STAFF = {
    blanca:{fullName:'Blanca Griselda Martínez Sánchez',assignment:'1.º A'},
    diana:{fullName:'Diana Paola Ruiz Gómez',assignment:'1.º B'},
    norma:{fullName:'Norma Alicia Manzano Sepúlveda',assignment:'2.º A'},
    ema:{fullName:'Ema Alejandra Caudillo Guerrero',assignment:'2.º B'},
    angel:{fullName:'Ángel Arroyo Vargas',assignment:'3.º A'},
    laura:{fullName:'Laura Vanessa Rodríguez Castro',assignment:'3.º B'},
    emilia:{fullName:'Emilia Mijares Rubio',assignment:'4.º A'},
    cesia:{fullName:'Cesia Hernández Rosales',assignment:'4.º B'},
    luis_miguel:{fullName:'Luis Miguel García Robles',assignment:'5.º A'},
    angelica:{fullName:'Angélica Martínez Rico',assignment:'5.º B'},
    lolo:{fullName:'Dolores Niño Morín',assignment:'6.º A'},
    emilio:{fullName:'José Emilio Arroyo Mijares',assignment:'6.º B'},
    criss:{fullName:'Cristel Deyanira Montes Dimas',assignment:'Intendente'},
    mauricio:{fullName:'Mauricio Vidal Salinas',assignment:'Administrativo · Dirección'}
  };
  for(const teacher of TEACHERS){
    const official=OFFICIAL_STAFF[teacher.id];
    if(official)Object.assign(teacher,{fullName:official.fullName,group:official.assignment,officialAssignment:official.assignment});
  }
  // A directory entry can be added before a portrait is available.
  TEACHERS.push({id:'maria_alejandra',name:'María Alejandra',fullName:'María Alejandra Alvarado Sandoval',group:'Velador',officialAssignment:'Velador',positions:{}});
  function teachersInScene(state) {
    return TEACHERS.filter(teacher=>teacher.positions[state.scene]).map(teacher=>({...teacher,...teacher.positions[state.scene]}));
  }
  const UNIFORM_DAYS = {
    1:{name:'Lunes',uniform:'Gala',column:0,description:'Camisa blanca y corbata roja; blusa blanca, chaleco y boina rojos con falda azul marino.'},
    2:{name:'Martes',uniform:'Educación Física',column:6,description:'Polo roja, bermuda azul marino, calcetas y tenis blancos.'},
    3:{name:'Miércoles',uniform:'Polo rojo',column:4,description:'Polo roja, pantalón de mezclilla y tenis blancos.'},
    4:{name:'Jueves',uniform:'Blanco y cuadros',column:2,description:'Camisa blanca con pantalón azul marino; blusa blanca con uniforme de cuadros y zapatos negros.'},
    5:{name:'Viernes',uniform:'Polo rojo',column:4,description:'Polo roja, pantalón de mezclilla y tenis blancos.'}
  };
const STUDENT_FRAMES = [[[65,27,117,213,57,213],[279,25,138,215,57,215],[501,27,117,213,57.5,213],[713,32,144,208,56.5,208],[938,27,117,215,58,215],[1151,32,141,210,54,210],[1376,27,117,215,56.5,215],[1589,32,142,210,54,210]],[[65,254,115,214,50.5,214],[279,250,133,218,52,218],[501,254,116,214,50.5,214],[712,259,140,209,52,209],[939,256,116,215,49.5,215],[1147,261,140,210,48.5,210],[1376,256,115,214,52,214],[1587,261,140,209,51.5,209]],[[64,476,116,214,61.5,214],[262,472,140,218,82.5,218],[500,476,117,214,60.5,214],[699,483,139,207,83.5,207],[938,478,117,213,61.5,213],[1136,484,140,206,81.5,206],[1376,478,117,213,59,213],[1572,484,141,207,86.5,207]],[[67,698,105,181,52,181],[273,694,124,185,69,185],[502,698,107,181,53.5,181],[706,702,127,177,75.5,177],[942,698,107,183,53,183],[1143,702,123,179,71.5,179],[1379,698,107,182,52,182],[1583,702,123,179,72,179]]];
  const SCHOOL_WEEKDAY = new Intl.DateTimeFormat('en-US',{timeZone:'America/Matamoros',weekday:'short'});
  const STUDENT_HOMES = [
    [330,755],[435,762],[565,750],[700,765],[830,752],
    [335,830],[470,825],[610,835],[745,821],[865,830],
    [325,875],[550,867],[820,875],[310,700],[485,700],[735,700],
    [340,180],[500,155],[690,180],[875,180],
    [345,380],[500,430],[800,410],[920,390],[260,460],[960,455],[1055,1030]
  ];
  function schoolDay(date=new Date()) {
    const weekday=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(SCHOOL_WEEKDAY.format(date));
    // The weekend keeps Friday's uniform until the next school day.
    return weekday===0||weekday===6?5:weekday;
  }
  function setSchoolDay(state,day,date=new Date()) {
    if(day!=='auto'&&(!Number.isInteger(day)||day<1||day>5))return false;
    state.dayMode=day==='auto'?'auto':'manual';state.schoolDay=day==='auto'?schoolDay(date):day;
    return true;
  }
  function refreshSchoolDay(state,date=new Date()) {
    if(state.dayMode!=='auto')return false;
    const day=schoolDay(date),changed=day!==state.schoolDay;state.schoolDay=day;return changed;
  }
  function studentUniformColumn(student,day) {
    return UNIFORM_DAYS[day].column+(student.style==='girl'?1:0);
  }
  function createClassmates() {
    return STUDENTS.map((student,index)=>{
      const [x,y]=STUDENT_HOMES[index];
      return {id:student.id,x,y,homeX:x,direction:index%2?1:-1,pause:1+(index%5)*.8,facing:'down',walking:false,time:0};
    });
  }
  function classmatesInScene(state) {
    return state.classmates.map((actor,index)=>{
      const student=STUDENTS[index];
      if(state.scene==='outside')return {...actor,name:student.name,style:student.style};
      const desk=Math.floor(index/3),seat=index%3;
      return {...actor,name:student.name,style:student.style,x:[250,563,872][desk%3]+[0,66,133][seat],y:[375,498,622][Math.floor(desk/3)],facing:'up',walking:false};
    });
  }
  function updateClassmates(state,dt) {
    if(state.phase!=='play'||state.quiz||state.scene!=='outside')return;
    dt=Math.max(0,Math.min(.05,dt));
    state.classmates.forEach((actor,index)=>{
      actor.time+=dt;
      if(actor.pause>0){actor.pause-=dt;actor.walking=false;actor.facing='down';return;}
      const x=actor.x+actor.direction*(18+index%4*2)*dt;
      if(Math.abs(x-actor.homeX)>14||!canStand('outside',x,actor.y)){
        actor.direction*=-1;actor.pause=1.5+index%3;actor.walking=false;return;
      }
      actor.x=x;actor.walking=true;actor.facing=actor.direction<0?'left':'right';
    });
  }
  function createState(date=new Date(),random=Math.random) {
    const student=STUDENTS[Math.min(STUDENTS.length-1,Math.max(0,Math.floor(random()*STUDENTS.length)))];
    return { phase: 'title', scene: 'outside', player: { ...student, x: 1034, y: 1174, facing: 'up', walking: false, time: 0 }, ball: { x: 605, y: 285, vx: 0, vy: 0 }, completed: { fountain: false, classroom: false, field: false }, points: 0, goals: 0, quiz: null, trompo:null, won: false, events: [], classmates:createClassmates(),dayMode:'auto',schoolDay:schoolDay(date) };
  }
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function pointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [ax, ay] = polygon[i], [bx, by] = polygon[j];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  }
  function rectBlocked(x, y, radius, rect) {
    const [rx, ry, w, h] = rect;
    const nx = Math.max(rx, Math.min(x, rx + w));
    const ny = Math.max(ry, Math.min(y, ry + h));
    return Math.hypot(x - nx, y - ny) < radius;
  }
  function fenceBlocked(x, y, radius, segment) {
    const [ax, ay, bx, by] = segment;
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x-ax)*dx + (y-ay)*dy) / (dx*dx + dy*dy)));
    return Math.hypot(x - (ax+t*dx), y - (ay+t*dy)) < radius + 3;
  }
  function canStand(scene, x, y, radius = 7) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    if (scene === 'classroom') {
      if (x < 112 + radius || x > 1167 - radius || y < 201 + radius || y > 731 - radius) return false;
      return !ROOM_RECTS.some(r => rectBlocked(x, y, radius, r));
    }
    const courtyard = x >= 89 + radius && x <= 1157 - radius && y >= 62 + radius && y <= 1137 - radius;
    const sidewalk = x >= 42 + radius && x <= 1172 - radius && y >= 1163 + radius && y <= 1206 - radius;
    if (!courtyard && !sidewalk) return false;
    if (OUTSIDE_RECTS.some(r => rectBlocked(x, y, radius, r))) return false;
    if (FENCE_SEGMENTS.some(s => fenceBlocked(x, y, radius, s))) return false;
    if (OUTSIDE_CIRCLES.some(([cx, cy, cr]) => Math.hypot(x-cx,y-cy) < cr + radius)) return false;
    for (const [dx, dy] of [[0,0], [radius,0], [-radius,0], [0,radius], [0,-radius]]) {
      if (pointInPolygon(x + dx, y + dy, MURAL)) return false;
    }
    return true;
  }
  function start(state) { if(state.phase!=='title')return false;state.phase='welcome';return true; }
  function finishWelcome(state) { if(state.phase!=='welcome')return false;state.phase='play';return true; }
  function openUniformGuide(state) {
    if(!['welcome','play'].includes(state.phase)||state.quiz)return false;
    state.uniformReturnPhase=state.phase;state.phase='uniform';state.player.walking=false;
    emit(state,'uniform-open');return true;
  }
  function closeUniformGuide(state) {
    if(state.phase!=='uniform')return false;
    state.phase=state.uniformReturnPhase;state.uniformReturnPhase=null;
    emit(state,'uniform-close');return true;
  }
  function move(state, horizontal, vertical, dt, running = false) {
    if (state.phase !== 'play' || state.quiz) return;
    dt = Math.max(0, Math.min(0.05, dt));
    let dx = Math.max(-1, Math.min(1, horizontal));
    let dy = Math.max(-1, Math.min(1, vertical));
    const length = Math.hypot(dx, dy);
    if (length > 1) { dx /= length; dy /= length; }
    const p = state.player;
    p.walking = length > 0.08;
    if (!p.walking) return;
    if (Math.abs(dx) > Math.abs(dy)) p.facing = dx < 0 ? 'left' : 'right';
    else p.facing = dy < 0 ? 'up' : 'down';
    p.time += dt;
    const speed = running ? 255 : 165;
    // Small steps prevent crossing walls during a slow animation frame.
    const pieces = Math.max(1, Math.ceil(speed * dt / 4));
    for (let i=0; i<pieces; i++) {
      const nx = p.x + dx * speed * dt / pieces;
      if (canStand(state.scene, nx, p.y)) p.x = nx;
      const ny = p.y + dy * speed * dt / pieces;
      if (canStand(state.scene, p.x, ny)) p.y = ny;
    }
  }
  function nearby(state) {
    const p = state.player;
    if (state.scene === 'classroom') {
      if (distance(p, {x:640,y:721}) < 75) return { id:'exit', label:'Salir al patio', x:640, y:722 };
      if (distance(p, STATIONS.classroom) < STATIONS.classroom.reach) return { id:'classroom', label:state.completed.classroom ? 'Leer de nuevo' : 'Reto de lectura', x:640, y:145 };
      return null;
    }
    if (p.y > 1150 && distance(p, {x:1034,y:1174}) < 78) return {id:'gate',label:'Entrar a la escuela',x:1034,y:1139};
    if (p.y < 1140 && distance(p, {x:1104,y:1090}) < 63) return {id:'leave',label:'Salir por la entrada',x:1104,y:1090};
    if (distance(p,CLASSROOM_DOOR) < 65) return {id:'door',label:'Entrar a '+STATIONS.classroom.name,x:CLASSROOM_DOOR.x,y:CLASSROOM_DOOR.y-11};
    for (const id of ['fountain','field']) {
      const s = STATIONS[id];
      if (distance(p,s) < s.reach) return {id,label: state.completed[id] ? 'Repetir el reto' : 'Reto de '+s.subject.toLowerCase(),x:s.x,y:s.y};
    }
    if (distance(p,state.ball) < 47 && p.y < 505) return {id:'ball',label:'Patear el balón',x:state.ball.x,y:state.ball.y};
    const oliver=state.classmates.find(actor=>actor.id==='oliver');
    if(oliver&&distance(p,oliver)<55)return {id:'oliver',label:'Jugar trompo con Oliver',x:oliver.x,y:oliver.y};
    const director=TEACHERS.find(teacher=>teacher.id==='guadalupe').positions.outside;
    if(distance(p,director)<62)return {id:'director',label:'Hablar con el director · Mi uniforme',x:director.x,y:director.y};
    if (distance(p,{x:150,y:1179}) < 65) return {id:'bicentenario',label:'Portón Bicentenario',x:150,y:1139};
    return null;
  }
  function emit(state,type,payload={}) { state.events.push({type,...payload}); }
  function interact(state) {
    if(state.phase==='welcome')return finishWelcome(state)?'welcome':null;
    if(state.phase==='uniform')return closeUniformGuide(state)?'uniform':null;
    if(state.phase==='trompo')return trompoAction(state)?'trompo':null;
    if (state.phase !== 'play' || state.quiz) return null;
    const target = nearby(state);
    if (!target) return null;
    const p = state.player;
    switch (target.id) {
      case 'gate': p.x=1104; p.y=1033; p.facing='up'; emit(state,'transition'); break;
      case 'leave': p.x=1034; p.y=1174; p.facing='down'; emit(state,'transition'); break;
      case 'door': state.scene='classroom'; p.x=640; p.y=705; p.facing='up'; emit(state,'transition'); break;
      case 'exit': state.scene='outside'; p.x=CLASSROOM_DOOR.x; p.y=CLASSROOM_DOOR.y+6; p.facing='down'; emit(state,'transition'); break;
      case 'fountain': case 'classroom': case 'field':
        state.quiz={station:target.id,index:0,feedback:'',correct:false,awarded:state.completed[target.id]};
        p.walking=false; emit(state,'quiz'); break;
      case 'ball': {
        const vector={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.facing];
        state.ball.vx=vector[0]*600; state.ball.vy=vector[1]*600; emit(state,'kick'); break;
      }
      case 'bicentenario': emit(state,'toast',{text:'Este es el portón Bicentenario. Tu aventura empieza en la entrada azul, a la derecha.'}); break;
      case 'director': openUniformGuide(state);break;
      case 'oliver':
        state.phase='trompo';p.walking=false;
        state.trompo={round:1,stage:'aim',clock:0,power:0,wins:0,oliverWins:0,elapsed:0,tops:[],message:'Pulsa A cuando la aguja esté en la zona dorada.'};
        emit(state,'trompo-open');break;
    }
    return target.id;
  }
  function answer(state,index) {
    const q=state.quiz;
    if (!q || q.correct || !Number.isInteger(index) || index<0 || index>2) return false;
    const question=QUESTIONS[q.station][q.index];
    q.correct=index===question.answer;
    q.feedback=q.correct ? '¡Correcto! Bien pensado.' : question.hint;
    if(q.correct) { if(!q.awarded) state.points+=10; emit(state,'correct'); }
    else emit(state,'try');
    return q.correct;
  }
  function nextQuestion(state) {
    const q=state.quiz;
    if (!q || !q.correct) return false;
    if (q.index+1<QUESTIONS[q.station].length) {
      q.index++; q.correct=false; q.feedback='';
    } else {
      state.completed[q.station]=true; state.quiz=null; emit(state,'star',{station:q.station});
      if (Object.values(state.completed).every(Boolean) && !state.won) {
        state.won=true; state.phase='victory'; emit(state,'victory');
      }
    }
    return true;
  }
  function cancelQuiz(state) {
    // Keep progress on the current question to prevent farming points by reopening it.
    if (state.quiz) return false;
    return true;
  }
  function updateBall(state,dt) {
    if(state.phase!=='play'||state.quiz||state.scene!=='outside') return;
    dt=Math.max(0,Math.min(dt,.05));
    const b=state.ball;
    b.x+=b.vx*dt; b.y+=b.vy*dt;
    const damp=Math.exp(-.95*dt); b.vx*=damp; b.vy*=damp;
    if(Math.abs(b.vx)<3) b.vx=0; if(Math.abs(b.vy)<3) b.vy=0;
    const goalLane=b.y>239&&b.y<339;
    if(goalLane&&(b.x<194||b.x>1020)) {
      state.goals++; state.points+=20; b.x=605; b.y=285; b.vx=0; b.vy=0;
      emit(state,'goal',{text:'¡Gooool! +20 puntos'}); return;
    }
    if(!goalLane&&(b.x<205||b.x>1000)) {b.x=Math.max(205,Math.min(1000,b.x));b.vx*=-.65;}
    if(b.y<92||b.y>487) {b.y=Math.max(92,Math.min(487,b.y));b.vy*=-.65;}
  }
  function trompoAction(state) {
    const t=state.trompo;if(state.phase!=='trompo'||!t)return false;
    if(t.stage==='aim'){
      const quality=Math.max(0,1-Math.abs(t.power-.78)/.6),opponent=[.61,.73,.67][t.round-1];
      const make=(owner,q)=>({owner,x:owner==='red'?290:430,y:190,vx:owner==='red'?63:-59,vy:-46,energy:38+q*40,duration:0,age:0,angle:0});
      t.tops=[make('red',quality),make('blue',opponent)];t.stage='spin';t.elapsed=0;
      t.message=quality>.86?'¡Gran lanzamiento! Mira cuánto gira.':'¡Trompos al suelo! El que gira más tiempo gana.';
      emit(state,'trompo-throw');return true;
    }
    if(t.stage==='result'){
      if(t.round===3){t.stage='complete';t.message=t.wins>t.oliverWins?'¡Ganaste el reto de Oliver!':t.wins===t.oliverWins?'¡Empate! Fue un gran reto.':'¡Bien jugado! Puedes volver a retar a Oliver.';return true;}
      t.round++;t.stage='aim';t.clock=0;t.power=0;t.tops=[];t.message='Pulsa A cuando la aguja esté en la zona dorada.';return true;
    }
    if(t.stage==='complete')return leaveTrompo(state);
    return false;
  }
  function leaveTrompo(state) {
    if(state.phase!=='trompo')return false;
    state.trompo=null;state.phase='play';emit(state,'trompo-close');return true;
  }
  function updateTrompo(state,dt) {
    const t=state.trompo;if(state.phase!=='trompo'||!t)return;
    dt=Math.max(0,Math.min(.05,dt));
    if(t.stage==='aim'){t.clock+=dt;t.power=(1-Math.cos(t.clock*3.2))/2;return;}
    if(t.stage!=='spin')return;
    t.elapsed+=dt;
    for(const top of t.tops){
      if(top.energy<=0)continue;
      top.duration+=dt;top.age+=dt;top.angle+=top.energy*.28*dt;
      top.energy=Math.max(0,top.energy-12*dt);
      top.vx+=(360-top.x)*.25*dt;top.vy+=(142-top.y)*.25*dt;
      const damp=Math.exp(-.85*dt);top.vx*=damp;top.vy*=damp;top.x+=top.vx*dt;top.y+=top.vy*dt;
      const dx=top.x-360,dy=top.y-142,d=Math.hypot(dx,dy);
      if(d>91){const nx=dx/d,ny=dy/d,dot=top.vx*nx+top.vy*ny;top.x=360+nx*91;top.y=142+ny*91;if(dot>0){top.vx-=1.5*dot*nx;top.vy-=1.5*dot*ny;}}
    }
    const [a,b]=t.tops,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(a.energy>0&&b.energy>0&&d<18){
      const nx=d?dx/d:1,ny=d?dy/d:0,push=(18-d)/2;
      a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
      const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
      if(closing>0){a.vx-=closing*nx;a.vy-=closing*ny;b.vx+=closing*nx;b.vy+=closing*ny;}
    }
    if(t.tops.every(top=>top.energy===0)){
      t.stage='result';const difference=a.duration-b.duration;
      if(Math.abs(difference)<.08)t.message='¡Empate en esta ronda!';
      else if(difference>0){t.wins++;state.points+=20;t.message='¡Tu trompo giró más! +20 puntos';emit(state,'trompo-win');}
      else {t.oliverWins++;t.message='Oliver ganó esta ronda. ¡Vamos por la siguiente!';}
    }
  }
  function tick(state,dt,input={}) { if(state.phase==='trompo'){updateTrompo(state,dt);return;}move(state,input.x||0,input.y||0,dt,!!input.run); updateBall(state,dt); updateClassmates(state,dt); }
  function objective(state) {
    if(state.phase==='title')return 'Pulsa START para jugar';
    if(state.phase==='welcome')return 'La bienvenida del director José Guadalupe';
    if(state.phase==='uniform')return 'Tu uniforme de cada día';
    if(state.phase==='trompo')return 'Reto del trompo con Oliver';
    if(state.scene==='outside'&&state.player.y>1150) return 'Entra por el portón azul';
    if(!state.completed.fountain) return 'Busca la estrella de la fuente';
    if(!state.completed.classroom) return state.scene==='classroom'?'Acércate al pizarrón':'Visita '+STATIONS.classroom.name;
    if(!state.completed.field) return 'Sube a la cancha para el último reto';
    return '¡Tres estrellas! Sigue explorando';
  }
  function snapshot(state) {
    return {phase:state.phase,scene:state.scene,player:{id:state.player.id,name:state.player.name,style:state.player.style},position:{x:Math.round(state.player.x),y:Math.round(state.player.y)},stars:Object.values(state.completed).filter(Boolean).length,points:state.points,goals:state.goals,completed:{...state.completed},objective:objective(state),nearby:nearby(state)?.label||null,question:state.quiz?{station:state.quiz.station,index:state.quiz.index,correct:state.quiz.correct,feedback:state.quiz.feedback}:null,trompo:state.trompo?{round:state.trompo.round,stage:state.trompo.stage,power:Math.round(state.trompo.power*100),wins:state.trompo.wins,oliverWins:state.trompo.oliverWins}:null,classmates:STUDENTS.length,schoolDay:UNIFORM_DAYS[state.schoolDay].name,uniform:UNIFORM_DAYS[state.schoolDay].uniform,automaticDay:state.dayMode==='auto',teachers:teachersInScene(state).map(teacher=>({name:teacher.name,group:teacher.group}))};
  }
  return {GAME_TITLE,WELCOME_TEXT,ASSET_PATHS,TOP_FRAMES,WORLD,QUESTIONS,STATIONS,CLASSROOM_DOOR,MAP_LABELS,buildingEntrance,setClassroomBuilding,classroomLabel,ORGANIZATION_REVISION,FRAME_BOUNDS,OUTSIDE_RECTS,OUTSIDE_CIRCLES,FENCE_SEGMENTS,MURAL,ROOM_RECTS,STUDENTS,TEACHERS,teachersInScene,UNIFORM_DAYS,STUDENT_FRAMES,schoolDay,setSchoolDay,refreshSchoolDay,studentUniformColumn,classmatesInScene,updateClassmates,createState,start,finishWelcome,openUniformGuide,closeUniformGuide,move,canStand,nearby,interact,answer,nextQuestion,cancelQuiz,trompoAction,leaveTrompo,tick,objective,snapshot};
});
