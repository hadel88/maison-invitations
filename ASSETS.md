# Original fairytale scenery

Created using the built-in image-generation tool, then encoded as WebP for website delivery without cropping or changing the artwork. Source PNGs remain in the generated-images library. Project copies:

- `public/world-midnight.webp` — Midnight Royal
- `public/world-garden.webp` — Enchanted Garden
- `public/world-rose.webp` — Rose & Reverie

These are original imaginary celebration environments, not photographs of available or bookable venues. No branded characters, familiar branded castles or provider imagery was requested.

## Midnight Royal prompt

Use case: stylized-concept. Asset type: luxurious European fairytale celebration website background, original environment artwork, wide cinematic landscape panorama. A dreamlike elegant moonlit French chateau on the RIGHT half, slender spires, warm tiny golden lit windows, graceful curved stone bridge crossing reflective midnight-blue lake from lower center toward palace, misty blue mountains, white roses in foreground, delicate fireflies and tiny stars, crescent moon. LEFT half contains calm low-contrast deep navy sky and atmospheric forest as negative space for website headline, no buildings on left. Detailed high-end painterly matte painting meets luxury adult storybook art, soft cinematic lighting, rich navy and antique gold, restrained silver-blue. No people, no copyrighted characters, no Disney landmarks, no text, no logos, no watermark, no UI.

## Enchanted Garden prompt

Use case: stylized-concept. Asset type: original luxurious European fairytale celebration website background, wide landscape. An exquisite enchanted garden at blue-green twilight, small elegant original French conservatory palace on RIGHT with warm golden lit windows and slender rooftops, curving pale stone pathway across a lily pond and white roses, lanterns among sage emerald foliage, distant misty forest, fireflies and a delicate archway. LEFT half quiet low-contrast dark emerald foliage and atmosphere for a website headline, no buildings on left. Fine-art adult luxury storybook matte painting, highly detailed botanical foreground, emerald sage champagne gold, soft dreamy editorial lighting. No people, no copyrighted characters, no familiar branded castles, no text, no logos, no UI, no watermark.

## Rose & Reverie prompt

Use case: stylized-concept. Asset type: original luxurious European fairytale celebration website background, wide landscape. Elegant rose-gold sunset over small original European fairytale chateau on RIGHT, pearl stone slender towers, windows glowing warm candlelight, balustraded bridge over reflective lake, pink roses and ivory peonies in foreground, rolling lavender hills, peach sky with first delicate stars, dreamlike mist. LEFT half simple muted dusky mauve blush sky and subtle dark plum foliage for website headline, keep left low-contrast no buildings on left. Fine-art sophisticated adult luxury storybook matte painting, cinematic immersive exquisite detail, champagne gold rose-gold highlights. No people, no recognizable Disney architecture, no copyrighted characters, no text, no logos, no watermark, no UI.

## City list for "Use my location"

`src/europeCities.json` lists European cities with at least 40,000 inhabitants (name, country code, latitude, longitude). Source: GeoNames (geonames.org, licensed CC BY 4.0), taken from the `all-the-cities` npm package 3.1.0. The nearest city is computed in the browser; the visitor's position is never sent to a server.
