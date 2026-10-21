const fs=require('node:fs');const sharp=require('C:/Users/em/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{for(const {id,path} of JSON.parse(fs.readFileSync('.qa/inside-sources.json','utf8'))){await sharp(path).resize({width:960,withoutEnlargement:true}).webp({quality:88}).toFile('public/occasion-'+id+'-inside.webp');console.log(id)}})();
