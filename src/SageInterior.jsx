import React,{useEffect,useRef} from 'react';
import {dateLabel} from './catalog';
import './sageInterior.css';

const captions={
 arch:['A garden promise','Ein Gartenversprechen','Une promesse au jardin'],
 ticket:['Make a little magic','Ein bisschen Geburtstagsmagie','Un peu de magie'],
 diamond:['The beginning of forever','Für immer beginnt hier','Le début de toujours'],
 cloud:['A little wonder is on the way','Ein kleines Wunder kommt','Un petit bonheur arrive'],
 diploma:['The next chapter awaits','Das nächste Kapitel wartet','Un nouveau chapitre commence'],
 menu:['Pull up a chair','Nimm bei uns Platz','Prenez place à notre table'],
 cameo:['A love worth celebrating','Eine Liebe zum Feiern','Un amour à célébrer'],
 editorial:['An extraordinary gathering','Eine besondere Begegnung','Une rencontre extraordinaire'],
 chapel:['A little life. A beautiful blessing.','Ein kleines Leben. Ein großer Segen.','Une petite vie. Une belle bénédiction.'],
 festive:['Let the season bring us together','Die schönste Zeit ist gemeinsam','La joie de se retrouver'],
};
export function SageAtmosphere({theme,active=false}){
 const layout=theme.pageLayout||'arch';
 return <div className={`sage-atmosphere atmosphere-${layout} ${active?'is-active':''}`} aria-hidden="true">
  {Array.from({length:layout==='cloud'?5:layout==='menu'?3:14},(_,i)=><i key={i} style={{'--i':i,'--x':`${(i*37+11)%100}%`,'--delay':`${-i*1.7}s`,'--duration':`${9+i%5*2}s`}}/>)}
 </div>;
}
function InteriorArt({layout,audience}){
 if(layout==='ticket'&&audience==='Boys')return <div className="sage-orbit"><span/><i/><b/></div>;
 if(layout==='ticket'&&audience==='Girls')return <div className="sage-butterflies">{[0,1,2].map(i=><span key={i} style={{'--i':i}}><i/><b/></span>)}</div>;
 switch(layout){
  case 'ticket':return <div className="sage-birthday-sculpture"><span className="gift-lid"/><span className="gift-box"/><b className="gift-loop left"/><b className="gift-loop right"/><span className="gift-ribbon"/></div>;
  case 'cloud':return <div className="sage-mobile"><b className="mobile-moon">☾</b>{[0,1,2].map(i=><span className="mobile-star" style={{'--i':i}} key={i}>✦</span>)}</div>;
  case 'diamond':return <div className="sage-rings"><span/><span/></div>;
  case 'menu':return <div className="sage-tablescape">{[0,1,2].map(i=><span className="sage-candle" style={{'--i':i}} key={i}><i/></span>)}<b className="sage-place-setting"/></div>;
  case 'diploma':return <div className="sage-diploma"><span/><i/><b>❧</b></div>;
  case 'cameo':return <div className="sage-locket"><span>❦</span><i/></div>;
  case 'editorial':return <div className="sage-artdeco">{[0,1,2,3,4].map(i=><i style={{'--i':i}} key={i}/>)}</div>;
  case 'chapel':return <div className="sage-sanctuary"><span/><i>✝</i></div>;
  case 'festive':return <div className="sage-baubles">{[0,1,2].map(i=><span style={{'--i':i}} key={i}/>)}</div>;
  default:return <div className="sage-garden-arch"><span/><i>❦</i><b/></div>;
 }
}
export function SageInterior({theme,event,lang='en'}){
 const ref=useRef(null),layout=theme.pageLayout||'arch';
 useEffect(()=>{const el=ref.current;if(!el)return;
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}})},{threshold:.18});
  observer.observe(el);el.closest('.cinema-detail-sheet')?.querySelectorAll('.event-details,.rsvp').forEach(node=>{node.classList.add('sage-scroll-reveal');observer.observe(node)});
  return()=>observer.disconnect();
 },[theme.id]);
 return <header ref={ref} className={`sage-interior sage-interior-${layout}`} style={{'--sage-art':`url("/${theme.image}.webp")`}}>
  <div className="sage-interior-photo" aria-hidden="true"/>
  <SageAtmosphere theme={theme} active/>
  <div className="sage-interior-composition"><InteriorArt layout={layout} audience={theme.audience}/><span className="sage-interior-caption">{captions[layout]?.[{en:0,de:1,fr:2}[lang]||0]}</span><h2>{event.names}</h2><time dateTime={event.date}>{dateLabel(event.date,lang)}</time></div>
 </header>;
}
export function SageReplyHeading({theme,lang='en'}){
 const labels={arch:['The reply letter','Die Antwort','Votre réponse'],ticket:['Your party pass','Dein Partyticket','Votre billet de fête'],diamond:['Be part of our beginning','Sei bei unserem Anfang dabei','Partagez notre premier chapitre'],cloud:['A note for our little wonder','Eine Nachricht fürs kleine Wunder','Un mot pour notre petit bonheur'],diploma:['Join the next chapter','Feiere das nächste Kapitel','Rejoignez ce nouveau chapitre'],menu:['A place at the table','Ein Platz an unserem Tisch','Une place à notre table'],cameo:['Another beautiful memory','Eine weitere schöne Erinnerung','Un nouveau beau souvenir'],editorial:['Confirm your attendance','Teilnahme bestätigen','Confirmez votre présence'],chapel:['Share this blessing','Teile diesen Segen','Partagez cette bénédiction'],festive:['Save a little seasonal magic','Gemeinsam die Festzeit genießen','Partageons la magie des fêtes']};
 return <div className="sage-reply-heading" aria-hidden="true"><span>{theme.pageLayout==='ticket'?'ADMIT ONE':theme.pageLayout==='menu'?'À TABLE':theme.pageLayout==='editorial'?'RÉPONSE':'MAISON'}</span><p>{labels[theme.pageLayout]?.[{en:0,de:1,fr:2}[lang]||0]}</p><i/></div>;
}
