(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolCharacters=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function list(game){return [...game.STUDENTS.map(actor=>({...actor,kind:'student',group:game.classroomLabel()})),...game.TEACHERS.map(actor=>({...actor,kind:'staff',style:'girl'}))];}
  function find(game,id){return list(game).find(actor=>actor.id===id)||null;}
  function select(game,state,id){
    const actor=find(game,id);if(!actor)return false;
    const {x,y,facing,time}=state.player;
    state.player={...actor,x,y,facing,time,walking:false};return true;
  }
  function frame(game,actor,day,facing='down'){
    const row={down:0,left:1,right:2,up:3}[facing]??0;
    if(actor.kind==='staff'&&actor.frames&&actor.assetKey)return {key:actor.assetKey,rect:actor.frames[row],baseHeight:actor.frames[0][3]};
    const column=game.studentUniformColumn(actor,day);
    return {key:'students',rect:game.STUDENT_FRAMES[row][column],baseHeight:game.STUDENT_FRAMES[0][column][3]};
  }
  function draw(ctx,game,images,actor,day,x,y,height,facing='down'){
    const spec=frame(game,actor,day,facing),image=images[spec.key];if(!image)return;
    const [sx,sy,sw,sh,ax,ay]=spec.rect,scale=height/spec.baseHeight;
    ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,sw,sh,x-ax*scale,y-ay*scale,sw*scale,sh*scale);
  }
  return {list,find,select,frame,draw};
});
