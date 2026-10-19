const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const attendingGuests = guests => guests.filter(g=>g.response==='yes');
export function autoSeat(tables, guests) {
  const free=Object.fromEntries(tables.map(t=>[t.id,t.capacity]));
  const assignments={},unseated=[];
  for(const g of [...attendingGuests(guests)].sort((a,b)=>b.party_size-a.party_size||a.name.localeCompare(b.name))){
    const table=tables.filter(t=>free[t.id]>=g.party_size).sort((a,b)=>free[a.id]-free[b.id])[0];
    if(table){assignments[g.id]=table.id;free[table.id]-=g.party_size}else unseated.push(g.id);
  }
  return {assignments,unseated};
}
export function validateSeating(input,guests) {
  const bad=message=>{throw Object.assign(new Error(message),{status:400})};
  if(!input||!Array.isArray(input.tables)||input.tables.length>60||!input.assignments||typeof input.assignments!=='object'||Array.isArray(input.assignments))bad('Please check your tables and seating assignments.');
  const seen=new Set();
  const tables=input.tables.map(t=>{
    if(!t||!uuid.test(t.id)||seen.has(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>60||!Number.isInteger(t.capacity)||t.capacity<1||t.capacity>50)bad('Every table needs a unique ID, a name, and 1–50 seats.');
    seen.add(t.id);return {id:t.id,name:t.name.trim(),capacity:t.capacity};
  });
  const allowed=new Map(guests.map(g=>[g.id,g])),totals=Object.fromEntries(tables.map(t=>[t.id,0])),assignments={};
  if(Object.keys(input.assignments).length>500)bad('Too many seating assignments.');
  for(const [guestId,tableId] of Object.entries(input.assignments)){
    const g=allowed.get(guestId);
    if(!g||!seen.has(tableId))bad('A guest or table no longer exists. Refresh the seating plan.');
    if(g.response!=='yes')continue;
    totals[tableId]+=g.party_size;assignments[guestId]=tableId;
  }
  for(const t of tables)if(totals[t.id]>t.capacity)bad(t.name+' has more guests than seats. Increase its capacity or move a party.');
  return {tables,assignments};
}
