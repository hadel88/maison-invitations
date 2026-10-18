// Local Vite-only visual QA. Not an input to the production build; no database calls.
import React,{useState}from'react';import{createRoot}from'react-dom/client';
import{GuestExperience}from'./Guest';import{defaultEvent,templates}from'./catalog';import{cinemaThemes,cinemaEvent}from'./cinemaThemes';
import Editor from './Editor';
import'./style.css';import'./luxe.css';import'./royal.css';import'./app.css';
function photo(i){const c=document.createElement('canvas');c.width=420;c.height=600;const g=c.getContext('2d');g.fillStyle=['#8d3b4f','#376e83','#638657','#ba8243'][i];g.fillRect(0,0,420,600);g.strokeStyle='#fff8db';g.lineWidth=10;g.strokeRect(20,20,380,560);g.fillStyle='#fff8db';g.textAlign='center';g.font='bold 56px Georgia';g.fillText('PHOTO',210,280);g.font='bold 130px Georgia';g.fillText(String(i+1),210,420);return c.toDataURL('image/png');}
function Review(){
 const [version,setVersion]=useState(0),[custom,setCustom]=useState(true),[edit,setEdit]=useState(false);
 const event={...cinemaEvent(cinemaThemes.find(x=>x.id==='pearl-promise'),defaultEvent(templates[0])),music:'none',names:'Maya & Arjun',venue:'The Pearl Terrace',address:'Goa, India',...(custom?Object.fromEntries(['photo','photo2','photo3','photo4'].map((key,i)=>[key,photo(i)])): {})};
 function seek(t){const v=document.querySelector('.pearl-stage video');if(v){v.pause();v.currentTime=t;}}
 if(edit)return <Editor record={{content:event,step:'photo'}} user={null} onClose={()=>setEdit(false)} onSave={async()=>setEdit(false)} onPreview={()=>setEdit(false)}/>;
 return <><aside style={{position:'fixed',top:10,left:10,zIndex:100,width:175,font:'12px sans-serif',color:'#554538',background:'#fff8ed',padding:10,border:'1px solid #c8ae81',borderRadius:8}}><strong>LOCAL FILM REVIEW</strong><p>No uploads or saved replies</p><label><input type="checkbox" checked={custom} onChange={e=>{setCustom(e.target.checked);setVersion(v=>v+1);}}/>Use four test photos</label><div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:10}}>{[1.75,2.25,2.75,3.5,4,4.5,4.8,20.5,22,22.5,24.5,25,27.5,28,29,34,37,39.8].map(t=><button key={t} onClick={()=>seek(t)}>{t}s</button>)}</div><button onClick={()=>setVersion(v=>v+1)} style={{marginTop:10}}>Restart film</button><button onClick={()=>setEdit(true)}>Review photo editor</button></aside><GuestExperience key={version} event={event} preview slug="local-pearl-review" guest={null}/></>;
}createRoot(document.getElementById('root')).render(<Review/>);
