import React, { useEffect, useState } from 'react';
import { Lock, ArrowLeft, CalendarDays, MapPin, Heart } from 'lucide-react';
import { api } from './client';
import { dateLabel } from './catalog';

export default function SharedDashboard({ slug, token }) {
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    async function refresh(){try{const d=await api('shared-dashboard',{query:{slug,guest:token||''}});if(active){setData(d);setError('')}}catch(e){if(active){setData(null);setError(e.message)}}}
    refresh();const timer=setInterval(refresh,15000);
    const focus=()=>refresh();window.addEventListener('focus',focus);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus)};
  },[slug,token]);
  const link='/?invite='+encodeURIComponent(slug)+(token?'&guest='+encodeURIComponent(token):'');
  if(error)return <main className="maison-shared"><div className="maison-shared-hero"><Lock/><h1>A private celebration.</h1><p role="alert">{error}</p><a className="lx-btn lx-btn-solid" href={link}>Back to the invitation</a></div></main>;
  if(!data)return <main className="maison-shared" role="status">Preparing your shared celebration space…</main>;
  const e=data.event;
  return <main className="maison-shared"><a className="maison-text-button" href={link}><ArrowLeft size={15}/>Back to your invitation</a><div className="maison-shared-hero"><span className="maison-kicker">A PRIVATE SPACE · SHARED WITH {data.guest.name}</span><h1>{e.names}</h1><p><CalendarDays size={15}/> {dateLabel(e.date,e.language)} · {e.time}</p><p><MapPin size={15}/> {e.venue}</p><span className="maison-kicker">READ-ONLY GUEST DASHBOARD</span></div><div className="ev-stats">{[['invited','Invited'],['attending','Attending'],['waiting','Awaiting a reply']].map(([key,label])=><div className="ev-stat" key={key}><strong>{data.counts[key]}</strong><span>{label}</span></div>)}</div><div className="maison-shared-grid"><section className="maison-shared-card"><span className="maison-kicker">THE LOVELY DETAILS</span><h2>The programme</h2>{e.timeline?.length?<ul>{e.timeline.map((t,i)=><li key={i}><strong>{t.time} · {t.title}</strong><p>{t.note}</p></li>)}</ul>:<p>Your host will add the programme here.</p>}<p>{e.address}</p></section><section className="maison-shared-card"><span className="maison-kicker">COMING TOGETHER</span><h2>Little steps. A beautiful day.</h2><p>{data.progress.completed} planning tasks completed by your host.</p><Lock size={20}/><p>Your host shared this view with you. Guest names, private replies and account details stay private.</p></section></div><section className="maison-shared-card"><Heart size={22}/><h2>The memories live on.</h2><div className="maison-shared-photos">{data.memories.filter(m=>m.thumb).map((m,i)=><figure key={i}><img src={m.thumb} alt={m.body||'A celebration memory'}/>{m.body&&<figcaption>{m.body}</figcaption>}</figure>)}</div>{data.memories.filter(m=>!m.thumb).map((m,i)=><p key={i}>{m.body}</p>)}{!data.memories.length&&<p>Your host’s photos and notes will appear here.</p>}</section><p className="ws-muted">Please keep your personal link private. Access is checked again regularly and may be revoked by your host.</p></main>;
}
