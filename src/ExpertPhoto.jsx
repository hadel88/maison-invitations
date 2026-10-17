import React,{useState} from 'react';
import {ImageOff,ExternalLink} from 'lucide-react';
export default function ExpertPhoto({provider,large=false}){
 const [failed,setFailed]=useState(false);
 return <div className={'expert-photo '+(large?'large':'')}>
  {!failed?<img src={provider.photo} alt={provider.name+' — photo from its public listing'} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="expert-photo-missing"><ImageOff size={26}/><span>View photos on the original listing</span></div>}
  <a className="expert-photo-credit" href={provider.photoSource||provider.url} target="_blank" rel="noopener noreferrer">Photo: {provider.photoCredit}<ExternalLink size={10}/></a>
 </div>
}
