import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Share2, Sparkles, X, Check } from 'lucide-react';
import { createBeachScene } from './beachScene';
import { BEACH_COPY, BEACH_STEPS, nextBeachStep } from './beachFlow';
import './beachDemo.css';

export default function BeachDemo({ onClose }) {
  const host=useRef(null), engine=useRef(null), advanceRef=useRef(null), actionRef=useRef(null), lock=useRef(false);
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[fallback,setFallback]=useState(false),[notice,setNotice]=useState('');
  const current=Math.min(step,4),c=BEACH_COPY[current];
  function advance(){
    if(lock.current||step>=5)return;
    if(step===4){setStep(5);return;}
    lock.current=true;setBusy(true);
    const complete=()=>{setStep(s=>nextBeachStep(s,BEACH_STEPS[step]));setBusy(false);lock.current=false;};
    if(fallback)complete();else engine.current?.play(step,complete);
  }
  advanceRef.current=advance;
  useEffect(()=>{
    try{engine.current=createBeachScene(host.current,{onTap:()=>advanceRef.current?.(),onReady:()=>setReady(true),onError:()=>{setFallback(true);setReady(true);setBusy(false);lock.current=false;}});}
    catch{setFallback(true);setReady(true);}
    return()=>{engine.current?.dispose();engine.current=null;};
  },[]);
  function replay(){engine.current?.reset();lock.current=false;setStep(0);setBusy(false);setNotice('');}
  async function share(){
    if(['localhost','127.0.0.1'].includes(location.hostname)){setNotice('This local preview needs to be published before you can share it with friends.');return;}
    const data={title:'Beach Sunset Romance · Maya & Arjun',text:'Step into a little love story by the sea.',url:new URL('/?demo=beach-sunset-romance',location.origin).href};
    try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);setNotice('Demo link copied. Share it on WhatsApp or Instagram.');}}catch(e){if(e.name!=='AbortError')setNotice('Copy the page address to share this demo.');}
  }
  return <main className={'beach-demo'+(fallback?' beach-fallback':'')} data-step={current} data-busy={busy}>
    <div ref={host} className="beach-world"/>
    <div className="beach-vignette" aria-hidden="true"/>
    <div className="beach-topbar"><a href="/" aria-label="Maison home" onClick={e=>{if(onClose){e.preventDefault();onClose();}}}>maison<span>A LITTLE WORLD OF WONDER</span></a><div><button onClick={share} aria-label="Share demo"><Share2 size={17}/></button><button onClick={replay} disabled={busy} aria-label="Replay Beach Sunset Romance"><RotateCcw size={17}/></button>{onClose&&<button onClick={onClose} aria-label="Close beach demo"><X size={18}/></button>}</div></div>
    <div className={'beach-narrative'+(busy?' is-transitioning':'')} key={current} aria-live="polite">
      <span className="beach-eyebrow">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.text}</p>
      {current===4&&<div className="beach-wedding-details"><span>SATURDAY, 19 JUNE 2027</span><strong>At half past five, as the sun meets the sea.</strong><span>SUNSET COVE · GOA</span><small>Dinner, dancing & a lifetime of memories to follow.</small></div>}
    </div>
    <div className="beach-action-area">
      <span className="beach-touch-hint">{!ready?'Preparing your little escape…':busy?'Let the moment unfold…':current===4?'WE SAVED YOU A PLACE':'TAP THE '+['GOLDEN DOORS','FLOATING HEART','RING BOX','FLORAL ARCH'][current]}</span>
      <button ref={actionRef} className="beach-action" disabled={!ready||busy} onClick={advance}><Sparkles size={16}/>{busy?'A little magic…':c.action}<ArrowRight size={17}/></button>
      <div className="beach-progress" aria-label={`Chapter ${current+1} of 5`}>{BEACH_STEPS.map((s,i)=><span key={s} className={i<=current?'is-lit':''} aria-hidden="true"/>)}</div>
      <small className="beach-demo-note">INTERACTIVE DEMO · FICTIONAL COUPLE & EVENT</small>
    </div>
    {notice&&<div className="beach-notice" role="status">{notice}<button aria-label="Dismiss message" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {fallback&&<p className="beach-render-note">The simple version is active. All five chapters are still available.</p>}
    {step===5&&<SampleRSVP onClose={()=>{setStep(4);requestAnimationFrame(()=>actionRef.current?.focus());}}/>}
  </main>;
}

export function BeachDemoPreview({onClose}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';dialog.current.showModal();
    return()=>{if(dialog.current?.open)dialog.current.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <dialog ref={dialog} className="beach-demo-modal" aria-label="Beach Sunset Romance interactive demo" onCancel={e=>{if(e.target===dialog.current){e.preventDefault();onClose();}}}><BeachDemo onClose={onClose}/></dialog>;
}

function SampleRSVP({onClose}){
  const dialog=useRef(null),[sent,setSent]=useState(false);
  useEffect(()=>{const el=dialog.current;el.showModal();return()=>{if(el.open)el.close();};},[]);
  return <dialog ref={dialog} className="beach-rsvp" aria-labelledby="beach-rsvp-title" onCancel={onClose}>
    <button type="button" className="beach-rsvp-close" aria-label="Close sample RSVP" onClick={onClose}><X size={20}/></button>
    <span className="beach-eyebrow">MAYA & ARJUN · A CELEBRATION BY THE SEA</span>
    <h2 id="beach-rsvp-title">{sent?'A little joy, received.':'Will you join us?'}</h2>
    {sent?<div className="beach-rsvp-success" role="status"><Check size={30}/><p>Thank you for trying our invitation.</p><small>This was a sample reply. Nothing was saved or sent.</small><button className="beach-action" onClick={onClose}>Back to the sunset<ArrowRight size={16}/></button></div>:<form onSubmit={e=>{e.preventDefault();setSent(true);}}>
      <p className="beach-sample-note">Sample RSVP form · No replies are saved or sent.</p>
      <label>Your name<input name="name" autoComplete="off" required maxLength={100} placeholder="Your name"/></label>
      <fieldset><legend>Will you be celebrating with us?</legend><label><input type="radio" name="attending" value="yes" defaultChecked/>Joyfully accepts</label><label><input type="radio" name="attending" value="no"/>Regretfully declines</label></fieldset>
      <label>A little note<textarea name="note" rows={3} maxLength={500} placeholder="A wish for the happy couple…"/></label>
      <button className="beach-action" type="submit">Try the sample reply<ArrowRight size={16}/></button>
    </form>}
  </dialog>;
}
