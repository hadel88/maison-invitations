export function eventPhase(event,now=new Date()) {
  try {
    const parts=new Intl.DateTimeFormat('en',{timeZone:event.timezone||'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const part=type=>parts.find(p=>p.type===type).value;
    const today=part('year')+'-'+part('month')+'-'+part('day');
    return today<event.date?'before':today===event.date?'today':'after';
  } catch{return 'before'}
}
export function responseNote({note='',meal='',allergies='',attending=true}) {
  return [attending&&meal?'Meal preference: '+meal:'',attending&&allergies.trim()?'Allergies / dietary needs: '+allergies.trim():'',note.trim()].filter(Boolean).join('\n');
}
