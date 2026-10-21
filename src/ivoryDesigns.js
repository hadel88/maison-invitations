import {occasionScene,occasionEvent} from './occasionScenes.js';

const rows = [
 ['ivory','The Ivory Garden','Wedding','Neutral','ivory','#f3efe3','#505343','#a88a4e','floral','Sofia & Alexander'],
 ['ivory-engagement','The Magnolia Promise','Engagement','Neutral','engagement','#e7ecdf','#3e5141','#9c8349','botanical','Clara & Adrien'],
 ['ivory-birthday','The Woodland Birthday','Birthday','Neutral','birthday-neutral','#f2ecdd','#5d6546','#aa8d49','woodland','Alex turns 8'],
 ['ivory-birthday-boy','A Little Space Adventure','Birthday','Boys','birthday-boy','#e5edf3','#415970','#a28c58','stars','Leo turns 7'],
 ['ivory-birthday-girl','The Butterfly Birthday','Birthday','Girls','birthday-girl','#f0e7f2','#6b4e75','#b09958','butterflies','Mia turns 6'],
 ['ivory-baby','The Little Woodland Letter','Baby shower','Neutral','baby-neutral','#eee8d9','#52634c','#a18b52','woodland','A little wonder'],
 ['ivory-baby-boy','A Letter to the Moon','Baby shower','Boys','baby-boy','#e9f0f4','#4d6575','#a29368','clouds','Oliver'],
 ['ivory-baby-girl','The Blossom Letter','Baby shower','Girls','baby-girl','#f4e8e6','#825b60','#b29a62','blossoms','Amelia'],
 ['ivory-graduation','The Laurel Letter','Graduation','Neutral','graduation-neutral','#f0ecdf','#56523f','#a48943','laurel','Alex’s graduation'],
 ['ivory-graduation-boy','The Midnight Laurel','Graduation','Boys','graduation-boy','#e5eaf0','#3d4b63','#ae914d','laurel','Louis’s graduation'],
 ['ivory-graduation-girl','The Champagne Laurel','Graduation','Girls','graduation-girl','#eee4eb','#6a4b61','#ac8c55','laurel','Clara’s graduation'],
 ['ivory-dinner','The Olive & Lemon Letter','Dinner party','Neutral','dinner','#f3e9d9','#67573b','#ac8148','citrus','An evening at our table'],
 ['ivory-anniversary','The Gilded Heirloom','Anniversary','Neutral','anniversary','#eadbd4','#603d42','#b68a52','roses','Camille & Arthur'],
 ['ivory-corporate','The Gilded Letter','Corporate event','Neutral','corporate','#e8e6df','#42433f','#a58c50','geometry','The Maison Evening'],
 ['ivory-christening','The Little Blessing','Christening','Neutral','christening-neutral','#f4f0e6','#66624e','#ab985e','olive','Noah'],
 ['ivory-christening-boy','The Blue Olive Blessing','Christening','Boys','christening-boy','#e8eef2','#516575','#a49a70','olive','Oliver'],
 ['ivory-christening-girl','The Blossom Blessing','Christening','Girls','christening-girl','#f4e9e6','#7b5a60','#b29b67','blossoms','Sophie'],
 ['ivory-seasonal','The Christmas Keepsake','Seasonal celebration','Neutral','seasonal','#e6eadd','#425b47','#a9914e','evergreen','A winter gathering'],
 ['ivory-proposal','The Gardenia Question','Marriage proposal','Neutral','proposal','#f5e8ed','#653e59','#be9865','botanical','Emma & Louis'],
 ['ivory-workshop','The Paper Atelier','Workshops & seminars','Neutral','workshop','#f0e6d8','#5b4a39','#ad7849','geometry','The Creative Atelier'],
 ['ivory-opening','The Opening Arch','Store & business opening','Neutral','opening','#e1efea','#28584f','#c0a36a','geometry','Atelier Maison'],
 ['ivory-newyear','The Midnight Star','New Year’s Eve','Neutral','newyear','#eae7f2','#353b60','#c4a262','stars','Midnight at Maison'],
];

export const ivoryThemes=rows.map(([id,name,occasion,audience,art,paper,ink,gold,motif,names])=>{
 const base=occasionScene(occasion);
 return {...base,id,name,occasion,audience,kind:'ivory',family:'ivory',ivoryCollection:true,
  cover:art==='seasonal'?'ivory-christmas-cover-v2':art==='newyear'?'ivory-newyear-cover-v2':art==='ivory'?'atelier-ivory-cover':'ivory-'+art+'-cover',
  image:art==='ivory'?'atelier-ivory':art==='birthday-boy'?'cinema-cosmos':art==='birthday-girl'?'cinema-candy':art==='birthday-neutral'?'cinema-garden':art==='baby-boy'?'atelier-sage':art==='baby-neutral'?'cinema-garden':base.image,paper,ink,gold,motif,names,color:gold,
  plaqueShape:art,
  tag:'EMBROIDERED PAPER · '+(audience==='Neutral'?occasion.toUpperCase():audience.toUpperCase()),
  line:occasion==='Wedding'?'A lifetime of love begins here.':occasion==='Christening'?'A small blessing. A lifetime of love.':base.line};
});

export function ivoryEvent(theme,base={}) {
 const event=occasionEvent(theme,base);
 if(theme.occasion==='Wedding')return {...event,names:theme.names,time:'16:00',timezone:'Europe/Rome',address:'Lake Como, Italy',dressCode:'Garden elegance',timeline:[{time:'16:00',title:'A warm welcome',note:'Meet us among the gardens.'},{time:'16:30',title:'The ceremony',note:'A little promise, made forever.'},{time:'18:00',title:'A toast to our story',note:'Dinner, laughter and our favourite people.'}]};
 if(theme.occasion==='Engagement')return {...event,timezone:'Europe/Paris'};
 if(theme.occasion==='Birthday'&&theme.audience!=='Neutral')return {...event,time:'14:00',venue:'The Secret Garden',dressCode:'Ready for a little adventure',message:theme.line+' Join us for cake, games and a little birthday magic.',timeline:[{time:'14:00',title:'Welcome, little adventurers',note:'Games and discoveries with our favourite people.'},{time:'15:00',title:'Cake & birthday wishes',note:'Make a wish and celebrate together.'}]};
 return event;
}

export function filterInvitationDesigns(scenes,{occasion='All designs',family='all',audience='all'}={}) {
 return scenes.filter(scene=>(occasion==='All designs'||scene.occasion===occasion)
  &&(family==='all'||(family==='ivory'?scene.kind==='ivory':family==='ribbon'?scene.kind==='rose':family==='sage'?scene.kind==='sage':!['ivory','rose'].includes(scene.kind)))
  &&(audience==='all'||(['Boys','Girls'].includes(scene.audience)?scene.audience:'Neutral')===audience));
}

export function monogramLetters(names='') {
 const parts=String(names||'').split(/\s*(?:&|\band\b|\bet\b|\bund\b)\s*/iu).filter(Boolean);
 return parts.slice(0,2).map(part=>part.match(/\p{L}/u)?.[0]?.toLocaleUpperCase()||'').filter(Boolean);
}

export function ivoryVariables(theme={}) {
 return {'--ivory-paper':theme.paper||'#f3efe3','--ivory-ink':theme.ink||'#505343','--ivory-gold':theme.gold||'#a88a4e',
  '--ivory-cover':`url("/${theme.cover||'atelier-ivory-cover'}.webp")`};
}
