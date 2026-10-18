import React from 'react';
import { ArrowRight } from 'lucide-react';

export function BeachDemoCard({ onPlay }) {
  return <article className="beach-collection-card">
    <button className="atelier-poster poster-beach-demo" onClick={onPlay} aria-label="Play Beach Sunset Romance interactive demo">
      <img src="/beach-sunset-environment-sm.webp" width="600" height="300" alt="A rose-gold sunset over a tropical beach" loading="lazy" decoding="async"/>
      <span className="beach-poster-badge">3D · INTERACTIVE DEMO</span>
      <span className="beach-poster-names"><small>A LOVE STORY BY THE SEA</small>Maya<em>&</em>Arjun</span>
      <span className="poster-open">Play the love story<ArrowRight size={14}/></span>
    </button>
    <div className="atelier-caption"><span>FIVE MOMENTS · ONE LOVE STORY</span><h2>Beach Sunset Romance</h2><div><button onClick={onPlay}>Play the 3D demo<ArrowRight size={14}/></button></div><small className="beach-collection-note">Fictional couple · A sample interactive invitation</small></div>
  </article>;
}
