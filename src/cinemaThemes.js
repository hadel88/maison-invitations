export const cinemaThemes = [
 {id:'rose-garden',name:'Rose & Ribbon',occasion:'Wedding',audience:'Romantic',kind:'rose',image:'atelier-rose',cover:'atelier-rose-cover',color:'#c29789',ink:'#634b45',names:'Juliette & Hugo',line:'Together is a beautiful place to be.',tag:'BLUSH ROSES · A SATIN RIBBON',motif:'ribbon'},
 {id:'ivory',name:'The Ivory Garden',occasion:'Wedding',audience:'Romantic',kind:'ivory',image:'atelier-ivory',cover:'atelier-ivory-cover',color:'#9a8967',ink:'#4d514b',names:'Sofia & Alexander',line:'A lifetime of love begins here.',tag:'EMBROIDERED LINEN · LAKE COMO',motif:'doors'},
 {id:'sage',name:'A Secret in Sage',occasion:'Wedding',audience:'Romantic',kind:'sage',image:'atelier-sage',cover:'atelier-sage-cover',color:'#8d654e',ink:'#4b4936',names:'Clara & Gabriel',line:'Some days stay with us forever.',tag:'BOTANICAL PAPER · A WAX SEAL',motif:'envelope'},
 {id:'embroidered-chateau',name:'The Secret Conservatory',occasion:'Wedding',audience:'Romantic',kind:'craft',image:'craft-conservatory',cover:'craft-conservatory',color:'#a77a86',ink:'#414b40',names:'Élise & Théodore',line:'A little thread. A lifetime together.',tag:'SWEET-PEA SILK · A SECRET GLASSHOUSE',motif:'embroidery'},
];
export const cinemaGroups=['The collection'];
export function sceneFor(event={}){return cinemaThemes.find(t=>t.id===event.scene)||cinemaThemes[0]}
export function cinemaEvent(theme,base={}){
 const event={...base,scene:theme.id,occasion:theme.occasion,names:theme.names,subtitle:theme.line,music:'soft',worldTheme:'garden'};
 if(theme.kind!=='craft')return event;
 return {...event,date:'2027-06-12',time:'17:00',timezone:'Europe/Paris',venue:'The Rosier Conservatory',address:'Provence, France',dressCode:'Garden formal',message:'With full hearts, we invite you to a day of laughter, little wonders and a lifetime of love. We cannot wait to celebrate with you.',timeline:[{time:'16:30',title:'A warm welcome',note:'Arrive, wander through the garden and find your seat.'},{time:'17:00',title:'The ceremony',note:'A little promise, made forever.'},{time:'18:00',title:'Cocktails in the garden',note:'A toast to the beginning of our story.'},{time:'19:30',title:'Dinner & dancing',note:'Good food, favourite people and one more dance.'}],gifts:[{title:'Your presence is our favourite gift',note:'Sharing this day with you is what matters most to us.'}]};
}
