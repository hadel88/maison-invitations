import fs from 'node:fs';
for(const [file,name] of [['src/occasionScenes.js','export const occasionScenes'],['src/sageDesigns.js','const palettes'],['src/ivoryDesigns.js','const rows'],['src/worlds.js','export const eventWorlds'],['src/catalog.js','export const occasions']]){
 const source=fs.readFileSync(file,'utf8');
 const expression=new RegExp('('+name+' = ?\\[\\r?\\n)([\\s\\S]*?)(\\r?\\n\\];)');
 const match=source.match(expression);if(!match)throw new Error(file);
 const rows=match[2].split(/\r?\n/);const updated=rows.slice(4).concat(rows.slice(0,4));
 fs.writeFileSync(file,source.replace(expression,(_,start,body,end)=>start+updated.join('\n')+end));
}
