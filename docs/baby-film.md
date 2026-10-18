# A Little Wonder

Baby shower film design: `?cinema=little-wonder`. This is separate from Pearl & Promise and both Castle films.

The original 40-second forest film is preserved in Downloads. `public/baby-film.mp4` is the dedicated delivery copy: 720 × 1280, 24 fps, 960 frames. Its checksum is locked to `src/babyFilm.json`; do not replace, trim or re-encode it without tracking again.

The existing Studio Photos tool saves `photo`, `photo2`, `photo3` and `photo4`. They fill the forest frames, with four gently dissolving memories in the large moving foreground frame. Missing slots borrow another supplied photo. With no photos the original golden butterflies remain. The video characters themselves are part of the supplied film and are not replaced with uploaded faces.

`BabyInvitation.jsx` and `babyGL.js` composite the video, perspective-correct photos and personalised card on one video clock. Foreground gold and butterflies remain in front of the photo. The envelope pocket masks the emerging card. Names, date, time, venue, address and subtitle appear on the card; the final Yes/No/Details choices use the existing Guest RSVP form. The baby shower occasion uses the application's canonical `Baby shower` value.

Guest invitations retain the portrait viewport on desktop and phones. Reduced motion and playback/WebGL failures show the final invitation directly. English, German and French headings are included.

`baby-review.html` is a local Vite review page, excluded from the production entry. Numbered fictional test photos, seek controls and the Studio photo tool allow visual checking without saving an event or sending a reply. Browser checks covered moving photos, personalised card, final layout and RSVP selection. No RSVP was submitted.
