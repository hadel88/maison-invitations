import * as THREE from 'three';

export const SAGE_POCKET_DEPTH=.016;
export const SAGE_FLAP_DEPTH=.009;

export function createSagePocketPaper(shape,width,height){
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:SAGE_POCKET_DEPTH,bevelEnabled:true,bevelSize:.005,bevelThickness:.0018,bevelSegments:4,curveSegments:48,steps:1});
 // Keep the printed face at its established position; thickness extends backwards.
 geometry.translate(0,0,-SAGE_POCKET_DEPTH);
 const pos=geometry.attributes.position,uv=geometry.attributes.uv;
 for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/width+.5,pos.getY(i)/height+.5);
 return geometry;
}

export function createSageFlapEdge(shape){
 const points=shape.getPoints(80),positions=[],indices=[];
 for(const point of points)positions.push(point.x,point.y,0,point.x,point.y,-SAGE_FLAP_DEPTH);
 for(let i=0;i<points.length-1;i++){const j=i*2;indices.push(j,j+1,j+2,j+2,j+1,j+3)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

export function bendSageFlapEdge(geometry,length,bend,liftAt){
 const pos=geometry.attributes.position;
 for(let i=0;i<pos.count;i++){
  const y=pos.getY(i),fraction=y/length;
  pos.setZ(i,liftAt(y,length)-bend*fraction*fraction*length*.55-(i%2?SAGE_FLAP_DEPTH:0));
 }
 pos.needsUpdate=true;geometry.computeVertexNormals();
}
