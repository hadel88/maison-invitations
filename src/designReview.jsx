// Local Vite-only review entry. This HTML is not an input to the production build.
import React,{useState}from'react';
import{createRoot}from'react-dom/client';
import{JourneyMap}from'./RoyalHub';
import{worldFor}from'./worlds';
import{EventTabs}from'./EventTabs';
import{useCastleBackdrop}from'./useCastleBackdrop';
import'./style.css';import'./luxe.css';import'./royal.css';import'./app.css';import'./magicJourney.css';
function Review(){
 const castleBackdrop=useCastleBackdrop();
 const[occasion,setOccasion]=useState('Wedding'),[tab,setTab]=useState('Wall'),[action,setAction]=useState('');
 const world=worldFor(occasion),progress={stages:[true,true,false,true,false],replies:18,attending:15,days:78};
 return <main className="ws ws-journey ev" data-world={occasion==='Birthday'?'rose':'garden'}>
 <p style={{fontSize:11,color:'#776b57'}}>LOCAL DESIGN REVIEW · Demonstration data · No account or database changes</p>
 <div style={{display:'flex',gap:12,marginBottom:18}}>{['Wedding','Birthday','Graduation'].map(o=><button key={o} className="btn secondary" aria-pressed={occasion===o} onClick={()=>setOccasion(o)}>{o}</button>)}</div>
 <section className="ev-hero"><JourneyMap world={world} progress={progress} onAction={i=>setAction('Chapter '+(i+1)+' selected')} theme={occasion==='Birthday'?'rose':'garden'}><div className="ev-map-info"><h1>{occasion==='Birthday'?'Amélie turns 30':occasion==='Graduation'?'Clara’s graduation':'Élise & Théodore'}</h1><p>17 July 2027 · The Garden House</p><strong className="ev-map-days">78 days left</strong></div></JourneyMap></section>
 <p role="status" style={{minHeight:20,fontSize:12}}>{action}</p>
 <section className="ev-card" ref={castleBackdrop}><div className="ev-head"><div><h2>Manage your magical day</h2><p>Everything in one place.</p></div></div><div className="ev-stats">{[['24','Invited'],['15','Going'],['3','Can’t go'],['6','No answer']].map(([n,label])=><div className="ev-stat" key={label}><strong>{n}</strong><span>{label}</span></div>)}</div><EventTabs tabs={['Wall','Tasks','RSVPs','Gift registry','Event details','Photo gallery'].map(t=>[t,t])} value={tab} onChange={setTab}/><div className="ev-main" style={{minHeight:260,padding:'25px 0'}}><h3>{tab}</h3><p>The dashboard content stays in its normal layout inside the castle artwork.</p>{tab==='Tasks'&&<ol style={{margin:'20px 0',padding:0,listStyle:'none'}}>{[...world.tasks,...world.tasks].map((title,i)=><li key={i} style={{padding:'24px 0',borderBottom:'1px solid var(--ev-line)'}}><h4 style={{margin:'0 0 10px',fontSize:17}}>{title}</h4><p style={{lineHeight:1.7}}>Demonstration task {i+1}. Plan the details of your celebration with your favourite people and places.</p></li>)}</ol>}<p style={{maxWidth:580,lineHeight:1.8}}>This local review uses the real journey map and dashboard styles. In your event, the existing wall, tasks, replies, gifts, details and photos continue to work as before.</p></div></section>
 </main>;
}
createRoot(document.getElementById('root')).render(<Review/>);
