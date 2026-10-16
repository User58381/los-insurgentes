(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolCharacters=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Source-pixel joints and shoe bounds: down, left, right, up. Each outfit
  // keeps hands, long hair, dresses and coats outside the moving legs.
  const STAFF_LEGS={
    angel:[[429,37,133,229],[429,39,114,190],[425,71,146,221],[425,38,138,239]],
    raul:[[238,46,108,171],[227,31,81,131],[216,27,78,130],[211,37,103,169]],
    claudia:[[230,31,78,125],[222,44,84,125],[214,56,94,133],[210,31,76,122]],
    ema:[[231,37,80,123],[226,24,60,96],[215,60,93,126],[212,35,82,128]],
    luis_miguel:[[239,24,76,129],[227,19,61,103],[216,38,76,114],[212,24,75,126]],
    norma:[[258,40,89,138],[254,19,66,114],[242,55,102,148],[240,34,84,135]],
    emilia:[[258,40,90,141],[241,23,66,110],[233,53,94,135],[176,34,76,118]],
    angelica:[[289,30,86,143],[268,31,80,130],[257,55,96,138],[196,30,74,119]],
    criss:[[261,37,86,135],[248,33,72,112],[236,42,86,131],[181,36,74,111]],
    emilio:[[265,31,90,149],[242,19,70,122],[233,29,78,127],[176,28,74,121]],
    cesia:[[257,60,114,167],[241,36,82,128],[230,62,107,152],[176,41,84,126]],
    blanca:[[251,42,90,137],[241,22,64,107],[228,47,86,126],[191,31,75,119]],
    diana:[[263,45,88,131],[265,21,62,104],[248,56,94,132],[205,39,80,122]],
    laura:[[275,39,88,137],[271,18,62,105],[254,60,96,132],[214,37,78,120]],
    lolo:[[251,28,87,146],[243,14,64,113],[228,27,70,112],[191,26,78,129]],
    mauricio:[[258,28,82,136],[241,18,63,108],[230,36,77,118],[191,25,72,120]],
    guadalupe:[[457,42,146,250],[452,34,112,191],[449,69,146,222],[449,44,143,242]]
  };
  const STUDENT_LEGS=[
    [[21,93],[27,87],[21,94],[25,88],[21,95],[21,87],[20,93],[21,87]],
    [[17,84],[26,78],[17,84],[23,81],[14,85],[14,83],[17,87],[21,82]],
    [[26,97],[56,109],[25,96],[56,111],[26,97],[45,118],[23,95],[57,116]],
    [[19,85],[41,97],[20,87],[47,104],[18,88],[41,102],[18,86],[42,102]]
  ];
  function list(game){return [...game.STUDENTS.map(actor=>({...actor,kind:'student',group:game.classroomLabel()})),...game.TEACHERS.map(actor=>({...actor,kind:'staff',style:'girl'}))];}
  // Keep directory entries recognizable when loading older saves.
  function selectable(game){return list(game).filter(actor=>actor.selectable!==false);}
  function find(game,id){return list(game).find(actor=>actor.id===id)||null;}
  function select(game,state,id){
    const actor=find(game,id);if(!actor)return false;
    const {x,y,facing,time}=state.player;
    state.player={...actor,x,y,facing,time,walking:false};return true;
  }
  function frame(game,actor,day,facing='down'){
    const row={down:0,left:1,right:2,up:3}[facing]??0;
    if(actor.kind==='staff'&&actor.frames&&actor.assetKey)return {key:actor.assetKey,rect:actor.frames[row],baseHeight:actor.frames[row][3]};
    const column=game.studentUniformColumn(actor,day);
    return {key:'students',rect:game.STUDENT_FRAMES[row][column],baseHeight:game.STUDENT_FRAMES[0][column][3]};
  }
  function draw(ctx,game,images,actor,day,x,y,height,facing='down',motion=null){
    const spec=frame(game,actor,day,facing),image=images[spec.key];if(!image)return;
    const [sx,sy,sw,sh,ax,ay]=spec.rect,scale=height/spec.baseHeight,dx=x-ax*scale,dy=y-ay*scale;
    ctx.imageSmoothingEnabled=false;
    if(!motion?.walking||motion.reducedMotion){ctx.drawImage(image,sx,sy,sw,sh,dx,dy,sw*scale,sh*scale);return;}
    const row={down:0,left:1,right:2,up:3}[facing]??0;
    let cut,left,split,right;
    if(spec.key!=='students'){
      const rig=STAFF_LEGS[actor.id]?.[row];
      if(!rig){ctx.drawImage(image,sx,sy,sw,sh,dx,dy,sw*scale,sh*scale);return;}
      [cut,left,split,right]=rig;
    }else{
      const column=game.studentUniformColumn(actor,day),skirt=actor.style==='girl'&&(column===1||column===3);
      cut=Math.round(sh*(skirt?.84:.72));split=Math.round(ax);
      const bounds=STUDENT_LEGS[row][column];left=Math.max(0,bounds[0]-3);right=Math.min(sw,bounds[1]+4);
    }
    const overlap=Math.max(1,Math.round(sh*.012)),lowerY=cut-overlap,lowerH=sh-lowerY,legHeight=lowerH*scale;
    const phase=(Number(motion.time)||0)*13,wave=Math.sin(phase),sideView=facing==='left'||facing==='right';
    const unit=height/(spec.key==='students'?45:53),stride=(sideView?2.8:.55)*unit,lift=(sideView?1.6:1.8)*unit;
    for(const [start,width,side] of [[left,split-left,-1],[split,right-split,1]]){
      const step=side*wave,footLift=Math.min(legHeight*.45,Math.max(0,step)*lift);
      ctx.save();ctx.translate(dx+start*scale,dy+lowerY*scale);
      // A fixed joint and a small overlap prevent detached feet or holes.
      ctx.transform(1,0,step*stride/legHeight,1-footLift/legHeight,0,0);
      ctx.drawImage(image,sx+start,sy+lowerY,width,lowerH,0,0,width*scale,legHeight);ctx.restore();
    }
    // Keep the original sampling grid for the stationary body and hair. Cropping
    // before scaling can otherwise shift pixel details between idle and walking.
    ctx.save();ctx.beginPath();ctx.rect(dx-1,dy-1,sw*scale+2,cut*scale+1);
    if(left>0)ctx.rect(dx-1,dy+lowerY*scale,left*scale+1,legHeight+1);
    if(right<sw)ctx.rect(dx+right*scale,dy+lowerY*scale,(sw-right)*scale+1,legHeight+1);
    ctx.clip();ctx.drawImage(image,sx,sy,sw,sh,dx,dy,sw*scale,sh*scale);ctx.restore();
  }
  return {list,selectable,find,select,frame,draw};
});
