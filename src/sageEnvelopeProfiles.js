// Coordinates describe the actual flap cut; renderer and gallery share this outline.
// The flap starts on the body's fold line, with only its free edge lifted over the pocket.
export const sageFlapLift=(localY,length)=>Math.max(0,Math.min(1,-localY/length))*.025;
export const sageEnvelopeProfiles={
 proposal:{name:'gardenia heart',side:.4,curve:.9,tip:.97},
 workshop:{name:'atelier fold',side:.5,curve:.76,tip:.99,angular:true},
 opening:{name:'launch arch',side:.68,curve:.88,tip:.98},
 newyear:{name:'midnight fan',side:.38,curve:.7,tip:.99,angular:true},
 arch:{name:'botanical petal',side:.55,curve:.83,tip:.985},
 ticket:{name:'festival scallop',side:.48,curve:.6,tip:1,scallop:true},
 diamond:{name:'jeweller point',side:.36,curve:.62,tip:1,angular:true},
 cloud:{name:'nursery cloud',side:.48,curve:.78,tip:.985,scallop:true},
 diploma:{name:'archival shield',side:.62,curve:.82,tip:1,angular:true},
 menu:{name:'bistro round',side:.65,curve:.93,tip:1},
 cameo:{name:'heirloom heart',side:.43,curve:.78,tip:1},
 editorial:{name:'architect fold',side:.32,curve:.58,tip:1,angular:true},
 chapel:{name:'soft chapel',side:.58,curve:.83,tip:.99},
 festive:{name:'winter crest',side:.6,curve:.72,tip:1,angular:true},
};
export function traceSageFlap(pen,width,length,layout='arch'){
 const p=sageEnvelopeProfiles[layout]||sageEnvelopeProfiles.arch,x=width/2;
 pen.moveTo(-x,0);pen.lineTo(x,0);pen.lineTo(x,-length*p.side);
 if(p.angular){pen.lineTo(x*.53,-length*p.curve);pen.lineTo(0,-length*p.tip);pen.lineTo(-x*.53,-length*p.curve);pen.lineTo(-x,-length*p.side);}
 else if(p.scallop){
  pen.bezierCurveTo(x*.88,-length*.84,x*.56,-length*.64,x*.43,-length*.84);
  pen.bezierCurveTo(x*.24,-length*1.03,x*.09,-length*.93,0,-length*p.tip);
  pen.bezierCurveTo(-x*.09,-length*.93,-x*.24,-length*1.03,-x*.43,-length*.84);
  pen.bezierCurveTo(-x*.56,-length*.64,-x*.88,-length*.84,-x,-length*p.side);
 }else{
  pen.bezierCurveTo(x,-length*p.curve,x*.3,-length*.94,0,-length*p.tip);
  pen.bezierCurveTo(-x*.3,-length*.94,-x,-length*p.curve,-x,-length*p.side);
 }
 pen.closePath();
}
// The pocket's opening uses the same lower decorative contour, compressed to the
// envelope mouth. Its centre dip stays unchanged, so the existing card rise fits.
export function traceSagePocket(pen,width,height,side,dip,layout='arch'){
 const p=sageEnvelopeProfiles[layout]||sageEnvelopeProfiles.arch;
 const factor=(side-dip)/(p.tip-p.side),length=1;
 const y=value=>side+(value+p.side)*factor;
 let lines=0;
 pen.moveTo(-width/2,-height/2);pen.lineTo(width/2,-height/2);pen.lineTo(width/2,side);
 const lower={moveTo(){},lineTo(x,v){if(++lines===1)return;if(lines===2)return;pen.lineTo(x,y(v));},bezierCurveTo(a,b,c,d,e,f){pen.bezierCurveTo(a,y(b),c,y(d),e,y(f))},closePath(){}};
 traceSageFlap(lower,width,length,layout);pen.closePath();
}
