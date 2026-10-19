import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, ArrowLeft, CalendarDays, MapPin, Heart, Upload } from 'lucide-react';
import { api } from './client';
import { dateLabel } from './catalog';
import { resizePhoto } from './photoUpload';
import PhotoAlbum from './PhotoAlbum';
export default function SharedCelebration({ slug, token }) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[uploading,setUploading]=useState(false),[caption,setCaption]=useState(''),[file,setFile]=useState(null),[consent,setConsent]=useState(false),[kind,setKind]=useState('photo'),[message,setMessage]=useState('');
  useEffect(()=>{
    let active=true;
    async function refresh(){try{const d=await api('shared-dashboard',{query:{slug,guest:token||''}});if(active){setData(d);setError('')}}catch(e){if(active){setData(null);setError(e.message)}}}
    refresh();const timer=setInterval(refresh,15000);
    const focus=()=>refresh();window.addEventListener('focus',focus);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus)};
  },[slug,token]);
  const loadPhoto=useCallback(p=>api('shared-photo',{query:{slug,guest:token,photo:p.id}}).then(d=>d.image),[slug,token]);
  const photos=useMemo(()=>data?.memories.filter(m=>m.kind==='photo')||[],[data]);
  async function contribute(e){
    e.preventDefault();const form=e.currentTarget;setUploading(true);setMessage('');
    try{
      if(!consent)throw new Error('Please confirm you have permission to share.');
      if(kind==='photo'&&!file)throw new Error('Choose a photo first.');
      const payload={slug,guest:token,caption,consent};
      if(kind==='photo'){payload.image=await resizePhoto(file);payload.thumb=await resizePhoto(file,360,.7,58000)}
      await api(kind==='photo'?'guest-photo':'guest-wish',{method:'POST',data:payload});
      const updated=await api('shared-dashboard',{query:{slug,guest:token}});setData(updated);setCaption('');setFile(null);setConsent(false);form.reset();setMessage(kind==='photo'?'Your photo is in the memory book. Thank you!':'Your wish has been added. Thank you!');
    }catch(err){setMessage(err.message)}finally{setUploading(false)}
  }
  const link='/?invite='+encodeURIComponent(slug)+(token?'&guest='+encodeURIComponent(token):'');
  if(error)return <main className="maison-shared"><div className="maison-shared-hero"><Lock/><h1>A private celebration.</h1><p role="alert">{error}</p><a className="lx-btn lx-btn-solid" href={link}>Back to the invitation</a></div></main>;
  if(!data)return <main className="maison-shared" role="status">Preparing your shared celebration space…</main>;
  const e=data.event;
  return <main className="maison-shared"><a className="maison-text-button" href={link}><ArrowLeft size={15}/>Back to your invitation</a><div className="maison-shared-hero"><span className="maison-kicker">A PRIVATE SPACE · SHARED WITH {data.guest.name}</span><h1>{e.names}</h1><p><CalendarDays size={15}/> {dateLabel(e.date,e.language)} · {e.time}</p><p><MapPin size={15}/> {e.venue}</p>{data.guest.table&&<div className="shared-my-table"><small>YOUR TABLE</small><strong>{data.guest.table}</strong></div>}<span className="maison-kicker">YOUR SHARED CELEBRATION SPACE</span></div><div className="ev-stats">{[['invited','Invited'],['attending','Attending'],['waiting','Awaiting a reply']].map(([key,label])=><div className="ev-stat" key={key}><strong>{data.counts[key]}</strong><span>{label}</span></div>)}</div><div className="maison-shared-grid"><section className="maison-shared-card"><span className="maison-kicker">THE LOVELY DETAILS</span><h2>The programme</h2>{e.timeline?.length?<ul>{e.timeline.map((t,i)=><li key={i}><strong>{t.time} · {t.title}</strong><p>{t.note}</p></li>)}</ul>:<p>Your host will add the programme here.</p>}<p>{e.address}</p></section><section className="maison-shared-card"><span className="maison-kicker">COMING TOGETHER</span><h2>Little steps. A beautiful day.</h2><p>{data.progress.completed} planning tasks completed by your host.</p><Lock size={20}/><p>You can view this celebration and contribute to its memory book. Guest names, private replies and account details stay private.</p></section></div><section className="maison-shared-card"><Heart size={22}/><h2>The memories live on.</h2><PhotoAlbum photos={photos} title={e.names} design={e.albumStyle||'ivory'} loadPhoto={loadPhoto}/><form className="memory-upload" onSubmit={contribute}><strong>Add a little memory</strong><label>What would you like to share?<select value={kind} onChange={e=>setKind(e.target.value)} disabled={uploading}><option value="photo">A photograph</option><option value="wish">A wish or message</option></select></label>{kind==='photo'&&<label>Choose a photo<input type="file" accept="image/jpeg,image/png,image/webp" required disabled={uploading} onChange={e=>setFile(e.target.files[0]||null)}/></label>}<label>{kind==='photo'?'A caption (optional)':'Your wish'}<input value={caption} maxLength={500} required={kind==='wish'} disabled={uploading} onChange={e=>setCaption(e.target.value)}/></label><label className="memory-consent"><input type="checkbox" required checked={consent} disabled={uploading} onChange={e=>setConsent(e.target.checked)}/>I have permission to share this with the host and the guests who have dashboard access.</label><p className="ws-muted">Photos are resized before upload. Your host can remove contributions. Up to 50 contributions per guest.</p><button className="lx-btn lx-btn-solid" disabled={uploading}><Upload size={15}/>{uploading?'Adding your memory…':'Add to the memory book'}</button>{message&&<p role="status">{message}</p>}</form><div className="shared-wishes">{data.memories.filter(m=>m.kind==='post').map(m=><blockquote key={m.id}>{m.body}</blockquote>)}</div></section><p className="ws-muted">Please keep your personal link private. Access is checked regularly and may be revoked by your host.</p></main>;
}
