import React,{useEffect,useRef} from 'react';
import {dateLabel} from './catalog';
import './sageInterior.css';
import './sageWorlds.css';

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
  <div className="sage-interior-composition"><SageWorldContent layout={layout} theme={theme} event={event} lang={lang}/></div>
 </header>;
}
function SageWorldContent({layout,theme,event,lang}){
 const date=<time dateTime={event.date}>{dateLabel(event.date,lang)}</time>;
 const caption=captions[layout]?.[{en:0,de:1,fr:2}[lang]||0];
 const title=<h2>{event.names}</h2>,venue=<p className="sage-world-venue">{event.venue}</p>;
 const stock={backgroundImage:`url("/${theme.materialCover}.webp")`};
 const number=String(event.date||'').split('-')[2]||'19';
 const names=event.names.split(/\s*&\s*/);
 switch(layout){
  case 'ticket':return <div className="sage-party-ticket"><aside><b>{number}</b>{date}</aside><article><span className="sage-world-kicker">{caption}</span>{title}{venue}<div className="sage-ticket-barcode" aria-hidden="true"/></article><div className="sage-ticket-stub"><span>MAISON</span><i>✦</i></div></div>;
  case 'diamond':return <div className="sage-two-leaves"><article className="sage-leaf-one" style={stock}><span className="sage-world-kicker">{caption}</span><h2>{names[0]}</h2><b>&amp;</b></article><article className="sage-leaf-two"><h2>{names[1]||event.names}</h2>{date}{venue}</article></div>;
  case 'cloud':return <div className="sage-storybook"><article className="sage-storybook-picture" style={stock}><span>{caption}</span></article><article className="sage-storybook-letter"><span className="sage-world-kicker">MAISON</span>{title}<p>{event.subtitle||theme.line}</p>{date}{venue}</article></div>;
  case 'diploma':return <div className="sage-honours-scroll"><div className="sage-scroll-cap"/><article><span className="sage-world-kicker">{caption}</span><small>{String(event.date||'').slice(0,4)}</small>{title}<div className="sage-honours-rule"/>{date}{venue}<b>❧</b></article><div className="sage-scroll-foot"/></div>;
  case 'menu':return <div className="sage-bistro-menu"><div className="sage-menu-spine" style={stock}/><article><span className="sage-world-kicker">{caption}</span><b>À TABLE</b>{title}<i/>{date}{venue}<p className="sage-menu-note">{event.subtitle||theme.line}</p></article></div>;
  case 'cameo':return <div className="sage-memory-keepsake"><figure><div style={{backgroundImage:`url("/${theme.image}.webp")`}}/><figcaption>{event.names}</figcaption></figure><article><span className="sage-world-kicker">{caption}</span><p>{event.subtitle||theme.line}</p>{date}{venue}</article></div>;
  case 'editorial':return <div className="sage-event-poster"><aside>{number}<span>{String(event.date||'').slice(0,4)}</span></aside><article><span className="sage-world-kicker">{caption}</span>{title}{venue}</article><footer>{date}<span>MAISON / INVITATION</span></footer></div>;
  case 'chapel':return <div className="sage-blessing-triptych"><aside className="sage-blessing-left" style={stock}/><article><i>✝</i><span className="sage-world-kicker">{caption}</span>{title}{date}{venue}</article><aside className="sage-blessing-right" style={stock}/></div>;
  case 'festive':return <div className="sage-winter-postcard"><div className="sage-winter-window" style={{backgroundImage:`url("/${theme.image}.webp")`}}><i/><i/></div><article><span className="sage-world-kicker">{caption}</span>{title}<div>{date}{venue}</div></article></div>;
  default:return <div className="sage-vow-folio"><div className="sage-vow-lining" style={stock}/><article><span className="sage-world-kicker">{caption}</span>{title}<i>❦</i>{date}{venue}</article><p className="sage-vow-note">{event.subtitle||theme.line}</p></div>;
 }
}
export function SageReplyHeading({theme,lang='en'}){
 const labels={arch:['The reply letter','Die Antwort','Votre réponse'],ticket:['Your party pass','Dein Partyticket','Votre billet de fête'],diamond:['Be part of our beginning','Sei bei unserem Anfang dabei','Partagez notre premier chapitre'],cloud:['A note for our little wonder','Eine Nachricht fürs kleine Wunder','Un mot pour notre petit bonheur'],diploma:['Join the next chapter','Feiere das nächste Kapitel','Rejoignez ce nouveau chapitre'],menu:['A place at the table','Ein Platz an unserem Tisch','Une place à notre table'],cameo:['Another beautiful memory','Eine weitere schöne Erinnerung','Un nouveau beau souvenir'],editorial:['Confirm your attendance','Teilnahme bestätigen','Confirmez votre présence'],chapel:['Share this blessing','Teile diesen Segen','Partagez cette bénédiction'],festive:['Save a little seasonal magic','Gemeinsam die Festzeit genießen','Partageons la magie des fêtes']};
 return <div className="sage-reply-heading" aria-hidden="true"><span>{theme.pageLayout==='ticket'?'ADMIT ONE':theme.pageLayout==='menu'?'À TABLE':theme.pageLayout==='editorial'?'RÉPONSE':'MAISON'}</span><p>{labels[theme.pageLayout]?.[{en:0,de:1,fr:2}[lang]||0]}</p><i/></div>;
}
