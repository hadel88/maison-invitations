const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>x*x*(3-2*x);
export const PROPOSAL_RING_DURATION=6;
export function proposalRingPose(seconds,reduced=false){
 const open=reduced?1:smooth(clamp((seconds-.8)/3.4));
 const rise=reduced?1:smooth(clamp((seconds-3.1)/1.6));
 return {lidAngle:-open*Math.PI*.68,ringHeight:.065+rise*.17,ringVisible:open>.62,glint:Math.sin(clamp((seconds-4.4)/1.1)*Math.PI)};
}
