export async function resizePhoto(file,width=1400,quality=.78,max=880000){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>20000000)throw new Error('Please choose a photo smaller than 20 MB.');
 const image=await createImageBitmap(file);
 try{
  const canvas=document.createElement('canvas');const scale=Math.min(1,width/image.width);
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  for(let q=quality;q>=.28;q-=.1){const out=canvas.toDataURL('image/jpeg',q);if(out.length<max)return out}
  throw new Error('This photo is too detailed. Choose a smaller image.');
 }finally{image.close()}
}
