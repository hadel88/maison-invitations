import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Share2, Sparkles, X, ImagePlus, Compass, PenLine } from 'lucide-react';
import { createBeachScene } from './beachScene';
import { BEACH_COPY, BEACH_STEPS, nextBeachStep } from './beachFlow';
import './beachDemo.css';

const sampleEvent={names:'Maya & Arjun',date:'2027-06-19',time:'17:30',venue:'Sunset Cove · Goa',meeting:BEACH_COPY[2].text,proposal:BEACH_COPY[3].text};
const eventDate=date=>new Intl.DateTimeFormat('en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));

export default function BeachDemo({ onClose }) {
  const host=useRef(null), engine=useRef(null), advanceRef=useRef(null), actionRef=useRef(null), lock=useRef(false);
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[fallback,setFallback]=useState(false),[notice,setNotice]=useState('');
  const current=Math.min(step,4),c=BEACH_COPY[current];
  const [details,setDetails]=useState(sampleEvent),[editing,setEditing]=useState(false),[personalised,setPersonalised]=useState(false);
  const photoInput=useRef(null),photoUrls=useRef([]),[photoCount,setPhotoCount]=useState(0);
  useEffect(()=>()=>photoUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
  function addPhotos(e){
    const files=[...e.target.files].slice(0,4);
    if(!files.length)return;
    if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){setNotice('Choose JPG, PNG or WebP photos, up to 10 MB each.');e.target.value='';return;}
    const old=photoUrls.current;photoUrls.current=files.map(f=>URL.createObjectURL(f));
    engine.current?.setPhotos(photoUrls.current);setPhotoCount(files.length);
    old.forEach(url=>URL.revokeObjectURL(url));e.target.value='';
    setNotice('Your photos are in this preview. Tap the camera after the doors open to discover them. Photos stay in this browser session and are not uploaded or saved.');
  }
  function advance(){
    if(lock.current||step>=5)return;
    if(step===4){engine.current?.centre();setStep(5);return;}
    lock.current=true;setBusy(true);
    const complete=()=>{setStep(s=>nextBeachStep(s,BEACH_STEPS[step]));setBusy(false);lock.current=false;};
    if(fallback)complete();else engine.current?.play(step,complete);
  }
  advanceRef.current=advance;
  useEffect(()=>{
    try{engine.current=createBeachScene(host.current,{onTap:()=>advanceRef.current?.(),onReady:()=>setReady(true),onError:()=>{setFallback(true);setReady(true);setBusy(false);lock.current=false;}});engine.current.setEvent({...details,dateLabel:eventDate(details.date)});}
    catch{setFallback(true);setReady(true);}
    return()=>{engine.current?.dispose();engine.current=null;};
  },[]);
  function replay(){engine.current?.reset();lock.current=false;setStep(0);setBusy(false);setNotice('');}
  async function share(){
    if(photoCount||personalised){setNotice('Your personalisation is preview-only. Saving and publishing it is not connected yet; sharing now would show the sample invitation.');return;}
    if(['localhost','127.0.0.1'].includes(location.hostname)){setNotice('This local preview needs to be published before you can share it with friends.');return;}
    const data={title:'Beach Sunset Romance · Maya & Arjun',text:'Step into a little love story by the sea.',url:new URL('/?demo=beach-sunset-romance',location.origin).href};
    try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);setNotice('Demo link copied. Share it on WhatsApp or Instagram.');}}catch(e){if(e.name!=='AbortError')setNotice('Copy the page address to share this demo.');}
  }
  return <main className={'beach-demo'+(fallback?' beach-fallback':'')} data-step={current} data-busy={busy}>
    <div ref={host} className="beach-world" tabIndex={0} role="group" aria-label="Explore the 3D beach. Drag to look around, or use arrow keys. Press Home to centre the view." onKeyDown={e=>{const moves={ArrowLeft:[-.35,0],ArrowRight:[.35,0],ArrowUp:[0,.2],ArrowDown:[0,-.2]};if(moves[e.key]){e.preventDefault();engine.current?.look(...moves[e.key]);}if(e.key==='Home'){e.preventDefault();engine.current?.centre();}}}/>
    <div className="beach-vignette" aria-hidden="true"/>
    <div className="beach-letterbox" aria-hidden="true"/><div className="beach-shutter" aria-hidden="true"/>
    <input ref={photoInput} className="beach-photo-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addPhotos}/>
    <div className="beach-topbar"><a href="/" aria-label="Maison home" onClick={e=>{if(onClose){e.preventDefault();onClose();}}}>maison<span>A LITTLE WORLD OF WONDER</span></a><div><button onClick={()=>setEditing(true)} disabled={!ready||busy} aria-label="Personalise the story and event"><PenLine size={16}/></button><button onClick={()=>photoInput.current?.click()} disabled={!ready||busy} aria-label={`Add your photos${photoCount?` (${photoCount} added)`:''}`}><ImagePlus size={17}/></button><button onClick={()=>engine.current?.centre()} aria-label="Centre the beach view"><Compass size={17}/></button><button onClick={share} aria-label="Share demo"><Share2 size={17}/></button><button onClick={replay} disabled={busy} aria-label="Replay Beach Sunset Romance"><RotateCcw size={17}/></button>{onClose&&<button onClick={onClose} aria-label="Close beach demo"><X size={18}/></button>}</div></div>
    <div className={'beach-narrative'+(busy?' is-transitioning':'')} key={current} aria-live="polite">
      <span className="beach-eyebrow">{c.eyebrow}</span><h1>{[0,4].includes(current)?details.names:c.title}</h1><p>{current===2?details.meeting:current===3?details.proposal:c.text}</p>
      {current===4&&<div className="beach-wedding-details"><span>{eventDate(details.date)}</span><strong>{details.time}</strong><span>{details.venue}</span><small>Dinner, dancing & a lifetime of memories to follow.</small></div>}
    </div>
    <div className="beach-action-area">
      <span className="beach-touch-hint">{!ready?'Preparing your little escape…':busy?'Let the moment unfold…':current===4?'WE SAVED YOU A PLACE':'DRAG TO EXPLORE · TAP THE '+['GOLDEN DOORS','CAMERA OR HEART','RING BOX','FLORAL ARCH'][current]}</span>
      <button ref={actionRef} className="beach-action" disabled={!ready||busy} onClick={advance}><Sparkles size={16}/>{busy?'A little magic…':c.action}<ArrowRight size={17}/></button>
      <div className="beach-progress" aria-label={`Chapter ${current+1} of 5`}>{BEACH_STEPS.map((s,i)=><span key={s} className={i<=current?'is-lit':''} aria-hidden="true"/>)}</div>
      <small className="beach-demo-note">INTERACTIVE DEMO · FICTIONAL COUPLE & EVENT</small>
    </div>
    {notice&&<div className="beach-notice" role="status">{notice}<button aria-label="Dismiss message" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {fallback&&<p className="beach-render-note">The simple version is active. All five chapters are still available.</p>}
    {editing&&<PersonaliseStory details={details} onClose={()=>setEditing(false)} onSave={next=>{setDetails(next);setPersonalised(true);engine.current?.setEvent({...next,dateLabel:eventDate(next.date)});setEditing(false);setNotice('Your story and the 3D invitation have been updated for this preview. Changes are not saved or published yet.');}}/>}
    {step===5&&<SampleRSVP names={details.names} onClose={()=>{setStep(4);requestAnimationFrame(()=>actionRef.current?.focus());}}/>}
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

function PersonaliseStory({details,onSave,onClose}){
  const dialog=useRef(null),[draft,setDraft]=useState(details);
  useEffect(()=>{const el=dialog.current;el.showModal();return()=>{if(el.open)el.close();};},[]);
  const field=(name,value)=>setDraft(d=>({...d,[name]:value}));
  return <dialog ref={dialog} className="beach-editor" aria-label="Personalise your cinematic invitation" onCancel={onClose}><button className="beach-rsvp-close" aria-label="Close personalisation" onClick={onClose}><X size={20}/></button><h2>Your story, in this world.</h2><p>Try your details in the 3D invitation. This is a local preview; nothing is saved or published.</p><form onSubmit={e=>{e.preventDefault();onSave({...draft,names:draft.names.trim(),venue:draft.venue.trim()});}}><label>Names<input required maxLength={65} value={draft.names} onChange={e=>field('names',e.target.value)}/></label><label>Event date<input required type="date" min="2020-01-01" max="2099-12-31" value={draft.date} onChange={e=>field('date',e.target.value)}/></label><label>Time<input required type="time" value={draft.time} onChange={e=>field('time',e.target.value)}/></label><label>Venue<input required maxLength={90} value={draft.venue} onChange={e=>field('venue',e.target.value)}/></label><label>How you met<textarea required maxLength={240} value={draft.meeting} onChange={e=>field('meeting',e.target.value)}/></label><label>The proposal<textarea required maxLength={240} value={draft.proposal} onChange={e=>field('proposal',e.target.value)}/></label><button className="beach-action">Preview my story<ArrowRight size={16}/></button></form></dialog>;
}

function SampleRSVP({onClose,names}){
  const dialog=useRef(null),[sent,setSent]=useState(false);
  useEffect(()=>{const el=dialog.current;el.showModal();return()=>{if(el.open)el.close();};},[]);
  return <dialog ref={dialog} className="beach-rsvp" aria-labelledby="beach-rsvp-title" onCancel={onClose}>
    <button type="button" className="beach-rsvp-close" aria-label="Close sample RSVP" onClick={onClose}><X size={20}/></button>
    <span className="beach-eyebrow">A LETTER TO {names.toUpperCase()}</span>
    <h2 id="beach-rsvp-title">{sent?'Sealed with love.':'Your place in our story.'}</h2>
    {sent?<div className="beach-rsvp-success" role="status"><img className="beach-reply-seal" src="/maison-wax-seal.png" alt="Maison wax seal"/><p>Thank you for trying our invitation.</p><small>This was a sample reply. Nothing was saved or sent.</small><button className="beach-action" onClick={onClose}>Back to the sunset<ArrowRight size={16}/></button></div>:<form onSubmit={e=>{e.preventDefault();setSent(true);}}>
      <p className="beach-sample-note">Sample RSVP form · No replies are saved or sent.</p>
      <label>Your name<input name="name" autoComplete="off" required maxLength={100} placeholder="Your name"/></label>
      <fieldset><legend>Will you be celebrating with us?</legend><label><input type="radio" name="attending" value="yes" defaultChecked/>Joyfully accepts</label><label><input type="radio" name="attending" value="no"/>Regretfully declines</label></fieldset>
      <label>A little note<textarea name="note" rows={3} maxLength={500} placeholder="A wish for the happy couple…"/></label>
      <button className="beach-action beach-seal-reply" type="submit"><span aria-hidden="true">M</span>Seal my sample reply<ArrowRight size={16}/></button>
    </form>}
  </dialog>;
}
