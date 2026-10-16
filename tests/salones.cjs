'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),S=require('../school-settings.js');
const supplied=JSON.parse(fs.readFileSync(path.join(ROOT,'Escuela_Los_Insurgentes.json'),'utf8'));
const previous=['6.º B','4.º A','2.º B','5.º A','3.º B','5.º B','4.º B','1.º B','2.º A','3.º A','Dirección\ntarde','Cooperativa','Baños','1.º A','6.º A','Dirección','Usos\nmúltiples','Teatro'];
const memory=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};};
function freshGame(){const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'engine.js'),'utf8'),sandbox);return sandbox.SchoolGame;}
function legacy(){return {...supplied,labels:supplied.labels.map((row,index)=>({...row,name:previous[index]}))};}
test('salones: los 18 edificios y las 18 asignaciones coinciden con el JSON recibido',()=>{
 const G=freshGame(),store=S.createStore(G,memory()),config=store.getConfig();
 assert.deepEqual(config.labels,supplied.labels);assert.deepEqual(config.teachers,supplied.teachers);
 let count=0;
 for(const teacher of G.TEACHERS){
  if(!S.parseGroup(teacher.group))continue;count++;
  const indices=S.matchingBuildings(G,teacher.group);assert.equal(indices.length,1,teacher.id);
  const entrance=G.buildingEntrance(indices[0]);assert(G.canStand('outside',entrance.x,entrance.y),teacher.id);
  assert.equal(teacher.positions.outside.x,entrance.x,teacher.id);assert.equal(teacher.positions.outside.y,entrance.y,teacher.id);
 }
 assert.equal(count,12);assert.equal(G.classroomLabel(),'3.º A');assert.equal(G.CLASSROOM_DOOR.x,G.buildingEntrance(9).x);
});
test('salones: actualizar la distribución anterior conserva partida, récords y cargos',()=>{
 const mem=memory(),raw=legacy();mem.setItem(S.STORAGE_KEY,JSON.stringify(raw));
 const untouched={'insurgentes-adventure-v1':'partida con 3 estrellas','insurgentes-pacman-record-v1':'récord 9000','insurgentes-sound':'no','otro-juego':'datos ajenos'};
 for(const [key,value] of Object.entries(untouched))mem.setItem(key,value);
 const G=freshGame(),store=S.createStore(G,mem);assert.deepEqual(store.getConfig().labels,supplied.labels);assert.deepEqual(store.getConfig().teachers,supplied.teachers);
 for(const [key,value] of Object.entries(untouched))assert.equal(mem.getItem(key),value,key);
 assert.equal(JSON.parse(mem.getItem(S.STORAGE_KEY)).layoutRevision,G.LAYOUT_REVISION);
 const again=S.createStore(freshGame(),mem);assert.deepEqual(again.getConfig(),store.getConfig());
});
test('salones: los cambios personales sobreviven; aplicar los nuevos salones conserva los grupos',()=>{
 const G=freshGame(),mem=memory(),raw=legacy();raw.labels[0].name='Biblioteca';raw.teachers.find(t=>t.id==='raul').assignment='Inglés';
 mem.setItem(S.STORAGE_KEY,JSON.stringify(raw));const store=S.createStore(G,mem);
 assert.deepEqual(store.getConfig().labels,raw.labels);assert.equal(G.TEACHERS.find(t=>t.id==='raul').group,'Inglés');
 store.applyDefaultLayout();assert.deepEqual(store.getConfig().labels,supplied.labels);assert.equal(G.TEACHERS.find(t=>t.id==='raul').group,'Inglés');
});
test('salones: importar sigue moviendo al maestro Ángel y la puerta al edificio elegido',()=>{
 const G=freshGame(),store=S.createStore(G,memory()),imported=JSON.parse(JSON.stringify(supplied));
 [imported.labels[0].name,imported.labels[9].name]=[imported.labels[9].name,imported.labels[0].name];
 store.importSave(JSON.stringify(imported));const door=G.buildingEntrance(0),angel=G.TEACHERS.find(t=>t.id==='angel');
 assert.equal(G.CLASSROOM_DOOR.x,door.x);assert.equal(angel.positions.outside.x,door.x);assert.equal(angel.positions.outside.y,door.y);
 const next=S.createStore(freshGame(),memory());next.importSave(store.exportSave());assert.deepEqual(next.getConfig(),store.getConfig());
});
test('salones: si falla el guardado, la distribución se aplica sin anunciar persistencia',()=>{
 const raw=JSON.stringify(legacy()),store=S.createStore(freshGame(),{getItem:()=>raw,setItem(){throw new Error('quota');}});
 assert.deepEqual(store.getConfig().labels,supplied.labels);assert.equal(store.getStatus().persisted,false);assert.match(store.getStatus().message,/Exporta una copia/);
});
