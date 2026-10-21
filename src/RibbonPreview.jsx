import React,{useEffect,useState} from 'react';

let clothStill;
function captureCloth(){
 if(!clothStill)clothStill=import('./ribbonSatin').then(({createRibbonRenderer})=>{
  const c=document.createElement('canvas');Object.assign(c.style,{position:'fixed',left:'-2000px',top:'0',width:'600px',height:'1066px',pointerEvents:'none'});document.body.appendChild(c);
  let renderer;try{renderer=createRibbonRenderer(c,{static:true});return renderer.capture()}finally{renderer?.dispose();c.remove()}
 });
 return clothStill;
}

// The closed view is baked from the same mesh and lighting as the opening.
export default function RibbonPreview({ className = '' }) {
  const [src,setSrc]=useState('/rose-ribbon-still.png');
  useEffect(()=>{let dead=false;captureCloth().then(value=>{if(!dead)setSrc(value)}).catch(()=>{});return()=>{dead=true}},[]);
  return <span className={'ribbon-preview ' + className} aria-hidden="true"><img src={src} alt="" decoding="async"/></span>;
}
