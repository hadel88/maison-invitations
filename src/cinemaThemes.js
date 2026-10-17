export const cinemaThemes = [
 {id:'rose-garden',name:'Rose & Ribbon',occasion:'Wedding',audience:'Romantic',kind:'rose',image:'atelier-rose',cover:'atelier-rose-cover',color:'#c29789',ink:'#634b45',names:'Juliette & Hugo',line:'Together is a beautiful place to be.',tag:'BLUSH ROSES · A SATIN RIBBON',motif:'ribbon'},
 {id:'ivory',name:'The Ivory Garden',occasion:'Wedding',audience:'Romantic',kind:'ivory',image:'atelier-ivory',cover:'atelier-ivory-cover',color:'#9a8967',ink:'#4d514b',names:'Sofia & Alexander',line:'A lifetime of love begins here.',tag:'EMBROIDERED LINEN · LAKE COMO',motif:'doors'},
 {id:'sage',name:'A Secret in Sage',occasion:'Wedding',audience:'Romantic',kind:'sage',image:'atelier-sage',cover:'atelier-sage-cover',color:'#8d654e',ink:'#4b4936',names:'Clara & Gabriel',line:'Some days stay with us forever.',tag:'BOTANICAL PAPER · A WAX SEAL',motif:'envelope'},
];
export const cinemaGroups=['The collection'];
export function sceneFor(event={}){return cinemaThemes.find(t=>t.id===event.scene)||cinemaThemes[0]}
export function cinemaEvent(theme,base={}){return {...base,scene:theme.id,occasion:theme.occasion,names:theme.names,subtitle:theme.line,music:'soft',worldTheme:'garden'}}
