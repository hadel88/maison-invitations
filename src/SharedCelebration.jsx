import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, ArrowLeft, CalendarDays, MapPin, Heart, Upload, Clock, ArrowUpRight, Users } from 'lucide-react';
import { api } from './client';
import { dateLabel } from './catalog';
import { resizePhoto } from './photoUpload';
import PhotoAlbum from './PhotoAlbum';
import { sceneFor } from './cinemaThemes';
import { sceneVariables } from './occasionScenes';
import { ivoryVariables } from './ivoryDesigns';
import { ensureFont } from './fonts';
import { pageVoice, occasionSlug } from './occasionPages';
import './occasionPages.css';
import './sharedCelebration.css';

// The guest's shared celebration space wears the same design as the invitation it belongs to:
// its scene, paper, ink, accent and lettering come from the invitation itself.

function useCountdown(date, time) {
  const target = useMemo(() => { const t = new Date(`${date || ''}T${time || '12:00'}`); return isNaN(t) ? null : t; }, [date, time]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  if (!target) return null;
  const ms = target - now;
  if (ms <= 0) return { past: ms < -86400000, days: 0, hours: 0, minutes: 0 };
  return { days: Math.floor(ms / 86400000), hours: Math.floor(ms / 3600000) % 24, minutes: Math.floor(ms / 60000) % 60 };
}

export default function SharedCelebration({ slug, token }) {
  const [data,setData]=useState(null),[design,setDesign]=useState(null),[error,setError]=useState(''),[uploading,setUploading]=useState(false),[caption,setCaption]=useState(''),[file,setFile]=useState(null),[consent,setConsent]=useState(false),[kind,setKind]=useState('photo'),[message,setMessage]=useState(''),[designDone,setDesignDone]=useState(false);
  useEffect(()=>{
    let active=true;
    async function refresh(){try{const d=await api('shared-dashboard',{query:{slug,guest:token||''}});if(active){setData(d);setError('')}}catch(e){if(active){setData(null);setError(e.message)}}}
    refresh();const timer=setInterval(refresh,15000);
    const focus=()=>refresh();window.addEventListener('focus',focus);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus)};
  },[slug,token]);
  // the invitation itself (its design, occasion and lettering); the dashboard still works without it
  useEffect(()=>{let active=true;api('open',{query:{slug,...(token?{guest:token}:{})}}).then(d=>{if(active&&d)setDesign(d)}).catch(()=>{}).finally(()=>{if(active)setDesignDone(true)});return()=>{active=false}},[slug,token]);
  const loadPhoto=useCallback(p=>api('shared-photo',{query:{slug,guest:token,photo:p.id}}).then(d=>d.image),[slug,token]);
  const photos=useMemo(()=>data?.memories.filter(m=>m.kind==='photo')||[],[data]);
  const content={...(design?.content||{}),...(data?.event||{})};
  const countdown=useCountdown(content.date,content.time);
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
  const theme=sceneFor(content);
  const vars={...sceneVariables(theme),...ivoryVariables(theme),'--shared-scene':theme.image?`url(/${theme.image}.webp)`:'none'};
  const shell=(children)=><main className="maison-shared shared-themed" data-occasion={occasionSlug(content.occasion||theme.occasion)} style={vars}>{children}</main>;
  if(error)return shell(<div className="shared-hero shared-hero-plain"><Lock/><h1>A private celebration.</h1><p role="alert">{error}</p><a className="shared-btn" href={link}>Back to the invitation</a></div>);
  if(!data||!designDone)return shell(<p className="shared-loading" role="status">Preparing your shared celebration space…</p>);
  const e=content, lang=e.language||'en', voice=pageVoice(e.occasion||theme.occasion,lang);
  const font=ensureFont(e.font&&e.font!=='classic'?e.font:'vibes');
  const names=String(e.names||'').split(/\s*&\s*/);
  const reply=design?.guest?.response;
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(`${e.venue||''} ${e.address||''}`);
  return shell(<>
    <section className="shared-hero">
      <div className="shared-hero-scene" aria-hidden="true"/>
      <a className="shared-back" href={link}><ArrowLeft size={15}/>Your invitation</a>
      <div className="shared-hero-card">
        <span className="shared-kicker">A PRIVATE SPACE FOR {String(data.guest.name||'').toUpperCase()}</span>
        <h1 style={{fontFamily:font.family}}>{names.map((n,i)=><React.Fragment key={i}>{i>0&&<em>&amp;</em>}<span>{n}</span></React.Fragment>)}</h1>
        {e.subtitle&&<p className="shared-line">{e.subtitle}</p>}
        <span className="shared-ornament" aria-hidden="true"/>
        <p className="shared-date">{dateLabel(e.date,lang,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}{e.time?' · '+e.time:''}</p>
        <p className="shared-venue">{e.venue}</p>
        {countdown&&!countdown.past&&<div className="shared-countdown" aria-label="Time until the celebration">
          {[['days','days'],['hours','hours'],['minutes','min']].map(([k,l])=><div key={k}><strong>{countdown[k]}</strong><small>{l}</small></div>)}
        </div>}
      </div>
    </section>

    <section className="shared-facts">
      <a className="shared-fact" href={maps} target="_blank" rel="noreferrer"><MapPin size={18}/><span><small>WHERE</small><strong>{e.venue}</strong>{e.address}</span><ArrowUpRight size={14}/></a>
      <div className="shared-fact"><CalendarDays size={18}/><span><small>WHEN</small><strong>{dateLabel(e.date,lang)}</strong>{e.time}</span></div>
      {data.guest.table&&<div className="shared-fact shared-fact-table"><Users size={18}/><span><small>YOUR TABLE</small><strong>{data.guest.table}</strong></span></div>}
      {reply&&reply!=='pending'&&<div className="shared-fact"><Heart size={18}/><span><small>YOUR REPLY</small><strong>{reply==='yes'?voice.yes:voice.no}</strong></span></div>}
    </section>

    <section className="shared-stats">
      {[['invited','Invited'],['attending','Attending'],['waiting','Awaiting a reply']].map(([key,label])=><div key={key}><strong>{data.counts[key]}</strong><span>{label}</span></div>)}
    </section>

    <div className="shared-grid">
      <section className="shared-card">
        <span className="shared-kicker">{voice.details.toUpperCase()}</span>
        <h2>The programme</h2>
        {e.timeline?.length?<ol className="shared-timeline">{e.timeline.map((t,i)=><li key={i}><time><Clock size={13}/>{t.time}</time><div><strong>{t.title}</strong>{t.note&&<p>{t.note}</p>}</div></li>)}</ol>:<p className="shared-muted">Your host will add the programme here.</p>}
      </section>
      <section className="shared-card">
        <span className="shared-kicker">COMING TOGETHER</span>
        <h2>Little steps. A beautiful day.</h2>
        <p className="shared-progress"><strong>{data.progress.completed}</strong> planning tasks already completed by your host.</p>
        <p className="shared-muted"><Lock size={14}/> You can view this celebration and add to its memory book. Guest names, private replies and account details stay private.</p>
      </section>
    </div>

    <section className="shared-card shared-memories">
      <span className="shared-kicker">THE MEMORY BOOK</span>
      <h2>The memories live on.</h2>
      <PhotoAlbum photos={photos} title={e.names} design={e.albumStyle||'ivory'} loadPhoto={loadPhoto}/>
      <form className="memory-upload" onSubmit={contribute}><strong>Add a little memory</strong><label>What would you like to share?<select value={kind} onChange={e=>setKind(e.target.value)} disabled={uploading}><option value="photo">A photograph</option><option value="wish">A wish or message</option></select></label>{kind==='photo'&&<label>Choose a photo<input type="file" accept="image/jpeg,image/png,image/webp" required disabled={uploading} onChange={e=>setFile(e.target.files[0]||null)}/></label>}<label>{kind==='photo'?'A caption (optional)':'Your wish'}<input value={caption} maxLength={500} required={kind==='wish'} disabled={uploading} onChange={e=>setCaption(e.target.value)}/></label><label className="memory-consent"><input type="checkbox" required checked={consent} disabled={uploading} onChange={e=>setConsent(e.target.checked)}/>I have permission to share this with the host and the guests who have dashboard access.</label><p className="shared-muted">Photos are resized before upload. Your host can remove contributions. Up to 50 contributions per guest.</p><button className="shared-btn" disabled={uploading}><Upload size={15}/>{uploading?'Adding your memory…':'Add to the memory book'}</button>{message&&<p role="status">{message}</p>}</form>
      {data.memories.some(m=>m.kind==='post')&&<div className="shared-wishes">{data.memories.filter(m=>m.kind==='post').map(m=><blockquote key={m.id||m.created_at}>{m.body}</blockquote>)}</div>}
    </section>
    <p className="shared-foot">Please keep your personal link private. Access is checked regularly and may be revoked by your host.</p>
  </>);
}
