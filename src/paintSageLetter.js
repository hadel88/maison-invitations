// The first sheet coming out of each envelope has its own typographic composition.
export function paintSageLetter(g,w,h,card,design){
 const layout=design.pageLayout;if(!layout||layout==='arch')return false;
 const ink=design.ink||'#42513f',gold=design.color||'#b49561',paper=design.paper||'#f7f0df';
 const text=(value,x,y,size=42,colour=ink,align='center',italic=false,max=w-180)=>{
  g.fillStyle=colour;g.textAlign=align;g.textBaseline='middle';let s=size;
  do{g.font=`${italic?'italic ':''}400 ${s}px 'Cormorant Garamond',Georgia,serif`;s-=2}while(g.measureText(String(value)).width>max&&s>26);
  g.fillText(String(value||''),x,y,max);
 };
 const lines=(value,x,y,size=100,colour=ink,max=w-190)=>{
  g.font=`400 ${size}px 'Cormorant Garamond',Georgia,serif`;let line='',result=[];
  for(const word of String(value||'').split(' ')){if(g.measureText(line+' '+word).width>max&&line){result.push(line);line=word}else line+=(line?' ':'')+word}if(line)result.push(line);
  result.slice(0,4).forEach((v,i)=>text(v,x,y+i*size*1.04,size,colour,'center',false,max));return y+Math.min(4,result.length)*size*1.04;
 };
 const rule=(y,x=100,width=w-200)=>{g.fillStyle=gold;g.fillRect(x,y,width,2)};
 const border=(radius=0)=>{g.strokeStyle=gold;g.lineWidth=3;g.beginPath();g.roundRect(55,55,w-110,h-110,radius);g.stroke()};
 const footer=(y=1260,colour=ink)=>{text(card.date,w/2,y,35,colour);text(card.venue,w/2,y+100,54,colour,'center',true)};
 const kicker=(y=200,colour=gold)=>text(card.overline,w/2,y,29,colour);
 const subtitle=(y=1050,colour=ink)=>lines(card.subtitle,w/2,y,42,colour,w-240);
 switch(layout){
  case 'ticket':{
   g.fillStyle='#68416e';g.fillRect(0,0,175,h);g.save();g.translate(85,h/2);g.rotate(-Math.PI/2);text(card.date,0,0,42,'#fff0d5','center',false,h-220);g.restore();
   g.setLineDash([15,18]);g.strokeStyle=gold;g.lineWidth=4;g.beginPath();g.moveTo(190,0);g.lineTo(190,h);g.stroke();g.setLineDash([]);
   text('✦',600,200,90,gold);text(card.overline,600,345,28,ink,'center',false,650);lines(card.names,600,560,132,ink,650);
   lines(card.subtitle,600,1000,48,ink,600);text(card.venue,600,1270,50,ink,'center',true,600);
   g.fillStyle=ink;for(let i=0;i<42;i++)g.fillRect(300+i*14,1420,3+(i%3)*2,80);break;
  }
  case 'diamond':{
   g.fillStyle='#184d3d';g.beginPath();g.moveTo(0,0);g.lineTo(w,0);g.lineTo(w,h*.48);g.lineTo(0,h*.64);g.closePath();g.fill();
   text(card.overline,w/2,230,29,'#dfc88f');const names=card.names.split(/\s*&\s*/);
   text(names[0],w/2,545,155,'#fff3d8','center',true);text('&',w/2,850,125,gold);text(names[1]||card.names,w/2,1060,145,ink,'center',true);footer(1370);break;
  }
  case 'cloud':{
   g.fillStyle='#c8d8d5';g.fillRect(w*.48,0,w*.52,h*.35);g.fillStyle='#d0b57d';g.beginPath();g.arc(w*.72,260,110,0,Math.PI*2);g.fill();g.fillStyle=paper;g.beginPath();g.arc(w*.77,230,103,0,Math.PI*2);g.fill();
   text('✦',w*.6,450,58,gold);text('✦',w*.88,160,40,gold);text(card.overline,w/2,620,30,gold);lines(card.names,w/2,800,140);subtitle(1100);footer(1370);break;
  }
  case 'diploma':{
   border();g.strokeStyle=gold;g.lineWidth=8;g.strokeRect(85,85,w-170,h-170);kicker(260);text('❧',w/2,445,170,gold);rule(570,230,w-460);lines(card.names,w/2,745,140);rule(1080,230,w-460);footer(1220);text('❧',w/2,1460,80,gold);break;
  }
  case 'menu':{
   g.fillStyle=gold;g.fillRect(80,110,6,h-220);g.fillRect(w-86,110,6,h-220);text('À TABLE',w/2,260,38,gold);text('❦',w/2,400,85,gold);lines(card.names,w/2,600,132,ink,w-250);rule(930,330,w-660);subtitle(1040);footer(1320);break;
  }
  case 'cameo':{
   g.strokeStyle=gold;g.lineWidth=5;g.beginPath();g.ellipse(w/2,h/2,w*.43,h*.45,0,0,Math.PI*2);g.stroke();g.lineWidth=1.5;g.beginPath();g.ellipse(w/2,h/2,w*.41,h*.43,0,0,Math.PI*2);g.stroke();
   text('❦',w/2,300,90,gold);text(card.overline,w/2,460,28,gold);lines(card.names,w/2,670,130,ink,w-300);subtitle(1060);footer(1260);break;
  }
  case 'editorial':{
   g.fillStyle='#242e3b';g.fillRect(0,0,w,h);g.fillStyle='#bca170';g.fillRect(65,65,16,h-130);text('MAISON',145,180,35,'#d8c596','left');
   lines(card.names,w/2+35,450,150,'#f6edda',w-230);g.fillStyle=gold;g.fillRect(145,1000,w-250,3);text(card.overline,w/2+30,1110,29,'#d8c596');footer(1290,'#f6edda');break;
  }
  case 'chapel':{
   g.strokeStyle=gold;g.lineWidth=4;g.beginPath();g.moveTo(100,h-100);g.lineTo(100,400);g.quadraticCurveTo(100,230,w/2,80);g.quadraticCurveTo(w-100,230,w-100,400);g.lineTo(w-100,h-100);g.stroke();
   text('✝',w/2,390,110,gold);kicker(610);lines(card.names,w/2,820,145,ink,w-290);footer(1270);break;
  }
  case 'festive':{
   g.fillStyle='#31513b';g.fillRect(0,0,w,h*.36);text('❄',w/2,220,155,'#e9d5a3');text(card.overline,w/2,440,29,'#f8efd8');lines(card.names,w/2,760,140,ink,w-210);rule(1100);footer(1260);text('❄',w/2,1480,48,gold);break;
  }
  default:return false;
 }
 return true;
}
