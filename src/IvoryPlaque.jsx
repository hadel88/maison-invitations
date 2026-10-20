import React,{useId} from 'react';
import {monogramLetters} from './ivoryDesigns';
import {plaqueShape} from './ivoryPlaqueShapes';
import './ivory.css';

const scroll='M73 39C57 31 38 47 48 59C57 69 65 52 54 50M46 69C27 75 42 89 39 101C34 112 29 116 39 124M39 156C29 164 34 168 39 179C42 191 27 205 46 211M54 230C65 228 57 211 48 221C38 233 57 249 73 241';

export default function IvoryPlaque({names,shape='ivory',className=''}) {
 const id=useId().replace(/:/g,''),letters=monogramLetters(names),definition=plaqueShape(shape),outline=definition.path,ornament=definition.ornament;
 return <span className={'ivory-plaque '+className} data-shape={shape} aria-hidden="true">{[0,2,4,6].map(depth=><svg key={depth} className="ivory-plaque-depth" viewBox="0 0 200 280" focusable="false" style={{transform:`translateZ(${depth}px)`}}><path d={outline} fill={depth===0?'#9f8c73':'#d4c4ac'}/></svg>)}<svg className="ivory-plaque-face" viewBox="0 0 200 280" focusable="false">
  <defs>
   <linearGradient id={id+'paper'} x2=".9" y2="1"><stop stopColor="#fffaf0"/><stop offset=".5" stopColor="#f8ece2"/><stop offset="1" stopColor="#eee0d0"/></linearGradient>
   <linearGradient id={id+'gold'} x2=".8" y2="1"><stop stopColor="#7b6233"/><stop offset=".3" stopColor="#d9c18b"/><stop offset=".52" stopColor="#9c7b3f"/><stop offset=".75" stopColor="#e2cfa0"/><stop offset="1" stopColor="#816333"/></linearGradient>
   <radialGradient id={id+'pearl'} cx=".3" cy=".25"><stop stopColor="#fffefb"/><stop offset=".55" stopColor="#f5eadf"/><stop offset="1" stopColor="#bfae9d"/></radialGradient>
   <filter id={id+'emboss'} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.2" stdDeviation=".55" floodColor="#65503b" floodOpacity=".4"/><feDropShadow dx="0" dy="-.5" stdDeviation=".25" floodColor="#fff" floodOpacity=".9"/></filter>
  </defs>
  <path d={outline} fill="#ae987d" transform="translate(1.8 5.5)"/>
  <path d={outline} fill="#d5c6b1" transform="translate(.8 3.2)"/>
  <path d={outline} fill={'url(#'+id+'paper)'} stroke="#fff9ef" strokeWidth="2"/>
  <path d={outline} transform="translate(7 9.8) scale(.93)" fill="none" stroke={'url(#'+id+'gold)'} strokeWidth="1.5"/>
  {ornament==='rococo'&&<g fill="none" stroke={'url(#'+id+'gold)'} strokeWidth="2" strokeLinecap="round" filter={'url(#'+id+'emboss)'}><path d={scroll}/><path d={scroll} transform="translate(200 0) scale(-1 1)"/><path d="M70 43Q85 48 100 35Q115 48 130 43M70 237Q85 232 100 245Q115 232 130 237"/></g>}
  {['rococo','pearls'].includes(ornament)&&<g fill={'url(#'+id+'pearl)'} stroke="#d8c9b7" strokeWidth=".4">{[0,1].map(i=><g key={i} transform={i?'translate(0 280) scale(1 -1)':undefined}><circle cx="100" cy="25" r="4.3"/><circle cx="94" cy="30" r="3.3"/><circle cx="106" cy="30" r="3.3"/></g>)}</g>}
  {ornament!=='rococo'&&<g stroke={'url(#'+id+'gold)'} fill="none" strokeWidth="1.6" strokeLinecap="round" filter={'url(#'+id+'emboss)'}>
   {ornament==='geometry'?<path d="M40 94V75H62M160 94V75H138M40 186V205H62M160 186V205H138M77 79L100 65L123 79"/>:
    ornament==='laurel'?<>{[-1,1].map(side=><g key={side} transform={side===1?'translate(200 0) scale(-1 1)':undefined}><path d="M53 195Q23 140 61 83"/>{[0,1,2,3,4].map(i=><ellipse key={i} cx={44-Math.sin(i/4*Math.PI)*9} cy={100+i*17} rx="4" ry="9" transform={`rotate(-35 ${44-Math.sin(i/4*Math.PI)*9} ${100+i*17})`}/>)}</g>)}</>:
    ornament==='moon'?<path d="M105 67C83 65 78 93 99 102C111 106 122 99 125 91C102 98 92 79 105 67Z"/>:
    ornament==='cloud'?<path d="M72 95C60 95 58 79 70 76C70 60 96 60 100 74C118 57 139 76 128 87C140 96 122 103 115 98H79Z"/>:
    ornament==='butterfly'?<path d="M100 98V75M100 85C74 57 73 96 95 92C75 98 91 110 100 98C109 110 125 98 105 92C127 96 126 57 100 85Z"/>:
    ornament==='stars'?<><path d="M100 62L105 76L120 76L108 85L113 100L100 91L87 100L92 85L80 76H95Z"/><path d="M49 101V111M44 106H54M150 181V191M145 186H155"/></>:
    ornament==='snowflake'?<path d="M100 63V99M84 72L116 90M84 90L116 72M95 65L100 70L105 65M87 73L92 74L91 69M87 89L92 87L91 94M105 97L100 92L95 97"/>:
    ornament==='dove'?<path d="M75 95Q88 84 90 72Q105 76 107 86Q119 77 129 80Q123 92 111 96Q102 109 89 98L75 95M91 93L85 84M111 86L119 87"/>:
    ornament==='blossom'?<><circle cx="100" cy="84" r="5"/>{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="100" cy="72" rx="5" ry="8" transform={`rotate(${angle} 100 84)`}/>)}</>:
    <><path d="M72 99Q100 88 126 68M77 97Q64 77 82 82Q90 86 90 91M93 88Q86 67 101 74Q109 78 107 81M109 78Q111 60 124 63"/><path d="M78 202Q100 193 122 202"/></>}
  </g>}

  <g fill={'url(#'+id+'gold)'} filter={'url(#'+id+'emboss)'} fontFamily="Georgia,serif" textAnchor="middle">
   {letters.length>1?<><text x="67" y="157" fontSize="48">{letters[0]}</text><text x="100" y="150" fontSize="27" fontStyle="italic">&amp;</text><text x="136" y="157" fontSize="48">{letters[1]}</text></>:<text x="100" y="157" fontSize="61">{letters[0]||'M'}</text>}
  </g>
 </svg></span>;
}
