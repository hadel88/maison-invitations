import React,{useEffect,useRef,useState} from 'react';
export default function ProposalRing({onReveal}){
 const ref=useRef(null),[ready,setReady]=useState(false);
 const notify=useRef(onReveal);notify.current=onReveal;
 useEffect(()=>{let dead=false,engine,started=false;
  const observer=new IntersectionObserver(entries=>{if(started||!entries.some(e=>e.isIntersecting))return;started=true;observer.disconnect();
   import('./proposalRing.js').then(async({createProposalRing})=>{if(dead||!ref.current)return;const ring=await createProposalRing(ref.current,{reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,onReveal:()=>notify.current?.()});if(dead){ring.destroy();return}engine=ring;setReady(true);ring.play()}).catch(()=>{if(!dead)notify.current?.()});
  },{threshold:.4});observer.observe(ref.current);
  return()=>{dead=true;observer.disconnect();engine?.destroy()};
 },[]);
 return <div className={'proposal-ring-scene '+(ready?'is-ready':'')} role="img" aria-label="A velvet ring box opens to reveal a gold engagement ring"><div className="proposal-ring-fallback" aria-hidden="true"><span/><i/><b/></div><canvas ref={ref} aria-hidden="true"/></div>;
}
export function ProposalMoment({children}){
 const [revealed,setRevealed]=useState(false);
 return <div className={'proposal-moment '+(revealed?'ring-revealed':'')}><ProposalRing onReveal={()=>setRevealed(true)}/><article aria-hidden={!revealed}>{children}</article></div>;
}
