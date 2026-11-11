'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../controls-ui.js');
test('controles v15 conservan predeterminados al cargar datos dañados',()=>{
 for(const input of [null,{},'bad',{bindings:{action:'w',back:'k',pause:'p'}},{bindings:{action:'j',back:'j',pause:'p'}}])assert.deepEqual(C.sanitize(input).bindings,C.DEFAULT);
 assert.equal(C.sanitize({alwaysRun:'true',touchSize:'huge'}).alwaysRun,false);
 assert.equal(C.sanitize({touchSize:'huge'}).touchSize,'normal');
});
test('configuración de controles conserva preferencias válidas y no muta partida',()=>{
 const raw={bindings:{...C.COMPACT},alwaysRun:true,touchSize:'xl'},state=C.sanitize(raw);assert.deepEqual(state,raw);state.bindings.action='f';assert.equal(raw.bindings.action,'j');
 const changed=C.rebind(C.sanitize(raw),'action','f');assert(!changed.error);assert.equal(changed.settings.bindings.action,'f');assert.equal(raw.bindings.action,'j');
});
test('reasignar rechaza conflictos y teclas usadas por movimiento y minijuegos',()=>{
 const state=C.sanitize({bindings:C.COMPACT});
 for(const key of ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','1','2','3','4','5','6','z','x','h','m','u','escape','tab','shift','p',' '])assert(C.rebind(state,'action',key).error,key+' debía estar reservado');
 assert(C.rebind(state,'action','k').error);
 assert(C.rebind(state,'mystery','f').error);
 assert(!C.rebind(state,'pause','p').error);
});
test('traduce acciones elegidas sin reemplazar flechas ni atajos originales',()=>{
 const state=C.sanitize({bindings:C.COMPACT});assert.equal(C.translate(state,'j'),'enter');assert.equal(C.translate(state,'k'),' ');assert.equal(C.translate(state,'p'),'e');
 for(const key of ['arrowup','w','enter',' ','e','h','z','x','1'])assert.equal(C.translate(state,key),key);
 assert.equal(C.label(' '),'Espacio');assert.equal(C.label('enter'),'Enter');
});
