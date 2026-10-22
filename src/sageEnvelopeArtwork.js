import {ornamentGlyph} from './invitationMaterials';

// Shared printed artwork. Geometry, camera and opening movement are deliberately separate.
export function paintEnvelopeArtwork(target,stock,design={},inviteLine='You are invited',guestLine=''){
 const g=target.getContext('2d');
 g.drawImage(stock,0,0,target.width,target.height);
 g.save();g.scale(target.width/600,target.height/1066);
 g.fillStyle=design.ink||'#46513e';g.textAlign='center';
 g.font='52px "Great Vibes", cursive';g.fillText(inviteLine,300,735,500);
 g.font=guestLine?'italic 38px "Cormorant Garamond", Georgia':'30px Georgia';
 g.fillText(guestLine||ornamentGlyph(design.ornament),300,guestLine?842:855,500);
 g.restore();
}
