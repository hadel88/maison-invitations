import fs from 'node:fs';
for(const [file,name,offset] of [['src/worlds.js','eventWorlds',0],['src/catalog.js','occasions',1]]){
 const source=fs.readFileSync(file,'utf8'),re=new RegExp('(export const '+name+'\\s*=\\s*\\[\\r?\\n)([\\s\\S]*?)(\\r?\\n\\];)');
 const found=source.match(re),lines=found[2].split(/\r?\n/),moved=lines.splice(offset,4);lines.push(...moved);
 fs.writeFileSync(file,source.replace(re,(_,start,body,end)=>start+lines.join('\n')+end));
}
