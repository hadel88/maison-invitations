// Shared by the gallery, studio and guest page so each occasion stays consistent.
export const occasionScenes = [
 {occasion:'Wedding',id:'rose-garden',name:'Rose & Ribbon',cover:'atelier-rose-cover',image:'atelier-rose',ribbonFilter:'none',bow:'Blush',paper:'#f5e9e1',ink:'#634b45',names:'Juliette & Hugo',line:'Together is a beautiful place to be.',venue:'Villa Balbiano',overline:'TOGETHER WITH OUR FAMILIES'},
 {occasion:'Birthday',id:'chiffon-birthday',name:'The Lilac Birthday',cover:'occasion-birthday-door',image:'birthday-party-v2',ribbonFilter:'hue-rotate(285deg) saturate(.85)',bow:'Lilac',paper:'#eee6f5',ink:'#514164',names:'Amélie turns 30',line:'Make a wish. Stay for the magic.',venue:'The Maison Rooftop',overline:'A LITTLE OLDER. A LITTLE MORE MAGIC.'},
 {occasion:'Engagement',id:'rose-engagement',name:'The Emerald Promise',cover:'occasion-engagement-door',image:'cinema-garden',ribbonFilter:'hue-rotate(160deg) saturate(1.25) brightness(.78)',bow:'Emerald',paper:'#e7eee6',ink:'#314e40',names:'Emma & Louis',line:'We said yes. Now let us celebrate.',venue:'The Jasmine Pavilion',overline:'THE BEGINNING OF OUR FOREVER'},
 {occasion:'Baby shower',id:'chiffon-baby',name:'A Cloud of Wonder',cover:'occasion-baby-door',image:'baby-film-end',ribbonFilter:'hue-rotate(220deg) saturate(.85)',bow:'Powder blue',paper:'#e8f0f5',ink:'#3b5368',names:'Amelia & Noah',line:'A little love. A whole new world.',venue:'The Willow Garden',overline:'A LITTLE WONDER IS ON THE WAY'},
 {occasion:'Graduation',id:'chiffon-graduation',name:'The Golden Chapter',cover:'occasion-graduation-door',image:'graduation-night',ribbonFilter:'brightness(.72) sepia(1) saturate(1.8) contrast(1.06)',bow:'Gold',paper:'#eee8dc',ink:'#443d32',names:'Clara’s graduation',line:'Here is to everything ahead.',venue:'The Old Academy Courtyard',overline:'THE FUTURE IS YOURS'},
 {occasion:'Dinner party',id:'chiffon-dinner',name:'The Amber Supper',cover:'occasion-dinner-door',image:'occasion-dinner-inside',ribbonFilter:'sepia(.65) saturate(2) hue-rotate(338deg) brightness(.83)',bow:'Copper',paper:'#f1e3d6',ink:'#64432e',names:'An evening at our table',line:'Good food. Slow stories. Your company.',venue:'The Olive House',overline:'A PLACE AT OUR TABLE'},
 {occasion:'Anniversary',id:'chiffon-anniversary',name:'A Champagne Forever',cover:'occasion-anniversary-door',image:'cinema-palace',ribbonFilter:'sepia(.65) saturate(.6) brightness(1.12)',bow:'Champagne',paper:'#f2eade',ink:'#68533d',names:'Sophie & Thomas',line:'Twenty-five years. Still our favourite story.',venue:'The Lumière Ballroom',overline:'TO ALL THE YEARS. AND ALL THOSE AHEAD.'},
 {occasion:'Corporate event',id:'chiffon-corporate',name:'The Midnight Invitation',cover:'occasion-corporate-door',image:'cinema-noir',ribbonFilter:'saturate(0) brightness(.42)',bow:'Charcoal',paper:'#e8e8e5',ink:'#363a3e',names:'The Maison Gala',line:'An evening of ideas, connection and possibility.',venue:'The Atrium',overline:'YOU ARE CORDIALLY INVITED'},
 {occasion:'Christening',id:'chiffon-christening',name:'The Ivory Blessing',cover:'occasion-christening-door',image:'occasion-christening-inside',ribbonFilter:'saturate(.08) brightness(1.22)',bow:'Ivory',paper:'#f2efe5',ink:'#666052',names:'Noah’s christening',line:'A small blessing. A lifetime of love.',venue:'St. Mary’s Chapel',overline:'SURROUNDED BY LOVE'},
 {occasion:'Seasonal celebration',id:'chiffon-seasonal',name:'The Winter Gathering',cover:'occasion-seasonal-door',image:'occasion-seasonal-inside',ribbonFilter:'hue-rotate(8deg) saturate(2.8) brightness(.65)',bow:'Burgundy',paper:'#eee6e2',ink:'#683f45',names:'A winter gathering',line:'Warm lights. Full hearts. Together again.',venue:'The Evergreen Manor',overline:'THE MOST WONDERFUL TIME TO GATHER'},
];

export const goldOccasionScenes = [
 ['Wedding','rose-garden-gold','The Golden Rose'],
 ['Birthday','chiffon-birthday-gold','The Golden Birthday'],
 ['Engagement','engagement-gold','An Emerald & Gold Promise'],
].map(([occasion,id,name])=>({...occasionScenes.find(scene=>scene.occasion===occasion),id,name,bow:'Gold',ribbonFilter:'brightness(.72) sepia(1) saturate(1.8) contrast(1.06)'}));

export function filterScenes(scenes, occasion='All designs') {
 return occasion==='All designs' ? scenes : scenes.filter(scene=>scene.occasion===occasion);
}
export function occasionScene(occasion) { return occasionScenes.find(scene=>scene.occasion===occasion); }
export function sceneVariables(scene={}) {
 return {'--ribbon-filter':scene.ribbonFilter||'none','--occasion-paper':scene.paper||'#f5e9e1','--occasion-ink':scene.ink||'#634b45'};
}
export function occasionEvent(theme,base={}) {
 const hour=['Baby shower','Christening'].includes(theme.occasion)?'14':'18';
 return {...base,scene:theme.id,occasion:theme.occasion,names:theme.names,subtitle:theme.line,music:'soft',worldTheme:'garden',date:'2027-06-19',time:hour+':00',timezone:'Europe/Berlin',venue:theme.venue,address:theme.occasion==='Wedding'?'Lake Como, Italy':theme.occasion==='Engagement'?'Paris, France':'Berlin, Germany',rsvpDeadline:'2027-06-01',dressCode:theme.occasion==='Corporate event'?'Evening attire':'Come as you feel wonderful',message:theme.line+' We would love to share this moment with you.',timeline:[{time:hour+':00',title:'A warm welcome',note:'Arrive, settle in and enjoy the moment.'},{time:hour+':30',title:'Let the celebration begin',note:'Time together with our favourite people.'}],gifts:[]};
}
