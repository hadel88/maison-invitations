// The rose bow has its own cloth surface; other occasion animations keep theirs.
import { ribbonPhases, smooth } from './ribbonGL.js';

function centre(u, side, type, time) {
  const { loosen, release, fall } = ribbonPhases(time);
  let x, y, z, width, twist;
  if (type === 'loop') {
    const angle = 2 * Math.PI * u;
    const lobe = Math.pow(Math.max(0, Math.sin(Math.PI * u)), .65);
    x = side * (.13 + 2.02 * Math.sin(Math.PI * u));
    y = .34 * Math.sin(angle) + .16 * Math.sin(Math.PI * u);
    z = .60 * Math.sin(angle) + .12;
    width = .19 + 1.02 * lobe;
    twist = .35 * Math.sin(angle) + side * .07;
    x = x * (1 - release) + side * (.13 + 3.3 * u) * release;
    y = y * (1 - release) + (-.35 * u + .25 * Math.sin(u * 7 - time * 2) * release) * release;
    z = z * (1 - release) + .35 * Math.sin(u * 5 - time) * u * release;
    width = width * (1 - release) + .58 * release;
    twist += release * Math.sin(u * 8 - time * 2) * .7;
    x += side * loosen * .12;
  } else if (type === 'tail') {
    x = side * (.20 + 1.12 * u + .28 * Math.sin(u * 2.6 * Math.PI) * u);
    y = -.12 - (2.48 + side * .11) * u;
    z = .19 + .40 * Math.sin(u * 2.25 * Math.PI + side * .12);
    width = .43 + .36 * smooth(u);
    twist = side * .18 + .58 * Math.sin(u * 2.1 * Math.PI + side * .45);
    x += side * release * (.2 + .65 * u);
    y += release * .45 * u;
    z += Math.sin(u * 8 - time * 2) * release * .3;
  } else if (type === 'band') {
    x = side * (.10 + 10 * u) + side * release * (.35 + .7 * u);
    y = .01 - release * .12 * u;
    z = -.24 + .025 * Math.sin(u * 5);
    width = .47;
    twist = .035 * Math.sin(u * 7);
  } else {
    const angle = 2 * Math.PI * u + Math.PI;
    const pull = smooth((time - 1.8) / .85);
    x = .29 * Math.sin(angle) * (1 + loosen * .30);
    y = .02;
    z = .35 * Math.cos(angle) + .43;
    width = .68;
    twist = pull * Math.sin(u * 5);
    x = x * (1 - pull) + (u - .5) * 1.7 * pull;
    y -= .15 * pull;
    z = z * (1 - pull) + .3 * pull;
  }
  const flutter = Math.sin(u * 9 - fall * 5 + side) * Math.min(fall, 1);
  x += side * fall * .42 + flutter * .23;
  y -= 2.6 * fall * fall;
  z += flutter * .25;
  twist += flutter * .65;
  return { x, y, z, width, twist };
}

export function ribbonRow(u, side, type, time) {
  const c = centre(u, side, type, time);
  const next = centre(u + .0001, side, type, time);
  let tx = next.x - c.x, ty = next.y - c.y, tz = next.z - c.z;
  const length = Math.hypot(tx, ty, tz) || 1;
  tx /= length; ty /= length; tz /= length;
  // Project a consistent transverse axis into the centreline's normal plane.
  const axis = type === 'tail' ? [1, 0, 0] : [0, 1, 0];
  const dot = axis[0] * tx + axis[1] * ty + axis[2] * tz;
  let bx = axis[0] - dot * tx, by = axis[1] - dot * ty, bz = axis[2] - dot * tz;
  const scale = Math.hypot(bx, by, bz) || 1;
  bx /= scale; by /= scale; bz /= scale;
  const nx = ty * bz - tz * by, ny = tz * bx - tx * bz, nz = tx * by - ty * bx;
  const cos = Math.cos(c.twist), sin = Math.sin(c.twist);
  const wx = bx * cos + nx * sin, wy = by * cos + ny * sin, wz = bz * cos + nz * sin;
  const crownAxis = [ty * wz - tz * wy, tz * wx - tx * wz, tx * wy - ty * wx];
  // A continuous gathered fold near the knot relaxes into a soft chiffon face.
  const gathering = type === 'knot' ? .30 : type === 'loop' ? Math.exp(-u * 8) + Math.exp(-(1 - u) * 8) : Math.exp(-u * 7);
  return v => {
    const q = (v - .5) * c.width;
    const billow = (type === 'loop' ? .15 : .075) * Math.sin(Math.PI * v);
    const pleats = .09 * Math.sin(v * Math.PI * 5 + Math.sin(u * Math.PI * 2) * .6) * gathering;
    const fold = .025 * Math.sin(v * Math.PI * 2 + u * Math.PI * 2);
    const seam = .005 * (Math.exp(-Math.pow((v - .018) / .008, 2)) + Math.exp(-Math.pow((v - .982) / .008, 2)));
    const wrinkles = .009 * Math.sin(u * Math.PI * 14 + v * 17) * Math.sin(v * Math.PI);
    const depth = billow + pleats + fold + seam + wrinkles;
    const cut = type === 'tail' ? smooth((u - .96) / .04) * (v - .5) * .21 : 0;
    return [c.x + wx * q + crownAxis[0] * depth, c.y + wy * q + crownAxis[1] * depth + .45 + cut, c.z + wz * q + crownAxis[2] * depth];
  };
}

export function roseRibbonPoint(u, v, side, type, time) {
  return ribbonRow(u, side, type, time)(v);
}
