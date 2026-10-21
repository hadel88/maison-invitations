import {occasionScenes, occasionEvent} from './occasionScenes.js';

const palettes = [
 ['Wedding','sage','A Secret in Sage','#788164','#eae9db','#46513e','#a99563','botanical','atelier-sage',0],
 ['Birthday','sage-birthday','Lilac Wishes','#aea0bc','#f5eef8','#594365','#c2a362','stars','birthday-party-v2',0],
 ['Engagement','sage-engagement','An Emerald Yes','#426b5b','#edf1e8','#274d3e','#c8a460','diamonds','cinema-garden',-18],
 ['Baby shower','sage-baby','A Little Cloud','#abc4c9','#f0f7f6','#416269','#c6a878','clouds','baby-film-end',-105],
 ['Graduation','sage-graduation','The Gilded Letter','#343e57','#f4eee1','#303b53','#bd994d','laurel','graduation-night',24],
 ['Dinner party','sage-dinner','The Olive Letter','#a17a55','#f6eee2','#63462f','#b78a49','olive','occasion-dinner-inside',35],
 ['Anniversary','sage-anniversary','Champagne Letters','#b6a088','#faf1e5','#71543d','#b49755','medallion','cinema-palace',30],
 ['Corporate event','sage-corporate','Midnight Correspondence','#454d5b','#eef0f3','#303a4a','#a8b5c8','geometric','cinema-noir',-125],
 ['Christening','sage-christening','An Ivory Blessing','#c6c3ac','#faf8ee','#6d6956','#bcab7d','cross','occasion-christening-inside',40],
 ['Seasonal celebration','sage-seasonal','A Winter Letter','#70464d','#f6ece8','#623b43','#bfa164','snowflake','occasion-seasonal-inside',0],
];
export const sageThemes = palettes.map(([occasion,id,name,envelope,paper,ink,color,ornament,image,waxHue])=>{
 const base=occasionScenes.find(s=>s.occasion===occasion);
 const radius={botanical:4,stars:26,diamonds:0,clouds:42,laurel:0,olive:18,medallion:55,geometric:0,cross:28,snowflake:8}[ornament];
 const stationery={Wedding:['botanical','round','arch'],Birthday:['confetti','scalloped','ticket'],Engagement:['trellis','diamond','diamond'], 'Baby shower':['clouds','oval','cloud'],Graduation:['laurel','octagon','diploma'],'Dinner party':['olive','oval','menu'],Anniversary:['damask','scalloped','cameo'],'Corporate event':['deco','octagon','editorial'],Christening:['chapel','oval','chapel'],'Seasonal celebration':['snowflakes','star','festive']}[occasion];
 return {...base,...(id==='sage'?{names:'Clara & Gabriel',line:'Some days stay with us forever.'}:{}),id,name,kind:'sage',sageCollection:true,occasionDoor:false,cover:'atelier-sage-cover',image,envelope,paper,ink,color,ornament,waxHue,radius,envelopePattern:stationery[0],sealShape:stationery[1],pageLayout:stationery[2],audience:'Neutral',motif:'envelope',tag:'EMBOSSED PAPER · '+occasion.toUpperCase()};
});
for(const occasion of ['Birthday','Baby shower','Christening']){
 const base=sageThemes.find(t=>t.occasion===occasion);
 for(const [audience,envelope,paper,ink,waxHue,ornament] of [
  ['Boys','#8caec2','#edf3f8','#395b78',-115,'stars'],
  ['Girls','#c5a1b0','#fcf0f3','#79495d',-12,'blossom'],
 ]) sageThemes.push({...base,id:base.id+'-'+audience.toLowerCase(),name:base.name+(audience==='Boys'?' · Blue':' · Rose'),audience,envelope,paper,ink,waxHue,ornament});
}
export function sageEvent(theme,base){return occasionEvent(theme,base)}
