# Pearl & Promise

Separate film design: `?cinema=pearl-promise`. It does not modify the Castle Gates or Once Upon a Castle files.

## Personalisation

The Studio Photos tool uses the existing saved invitation fields:

| Field | Film surfaces |
| --- | --- |
| `photo` | Right book page, second book illustration, floating frame 1 |
| `photo2` | Left book page, floating frame 2 |
| `photo3` | Floating frame 3 |
| `photo4` | Floating frame 4 |

A missing photo borrows another supplied photo. With no photos the film keeps its sample pictures. Photos are composited in the guest's browser; a new video render is not needed for each invitation. Names, date, time, venue and address are printed into the shell card. The final card uses `CardFace`; its Yes/No/Details buttons call `onAnswer`, which opens the existing Guest RSVP form. RSVP persistence uses the existing application flow, not a separate demo endpoint.

## Keep video and tracking together

`public/pearl-film.mp4` is a dedicated delivery copy of the supplied video. The input in Downloads and all other films remain unchanged. This copy was prepared before tracking: **720 × 1280, 24 fps, 960 frames, 40 seconds**, without a matte band. `src/pearlFilm.json` contains its exact SHA-256 checksum and per-frame surfaces, including opening-page occlusion. Do not trim, replace or re-encode this delivery file without re-tracking it. `tests/pearl.test.mjs` checks the checksum and coverage.

`pearlGL.js` composites video, perspective-correct photos and transparent ink into the same canvas. Foreground frames occlude photos on frames passing behind. It is independent of `storyGL.js` and the Castle tracking files.

The separate `pearlFilm.css` contains only this design's framing overrides. The invitation keeps the existing portrait guest viewport on desktop and phones. Reduced-motion mode and film/graphics failures lead directly to the personalised final card.

## Local review

`pearl-review.html` is a Vite-only review entry, not a production build input. Its four numbered test pictures make drift visible. The time buttons pause/seek the film for inspection. It also opens the existing Studio's photo tool for local review. No account or database write is needed. Use the real `?cinema=pearl-promise` route for normal playback and RSVP navigation checks.
