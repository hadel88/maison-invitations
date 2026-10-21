# Original Sage envelope collection

Generated on 21 October 2026 with the built-in image generation tool. These are new material textures, not Ivory door covers. Optimized assets are saved in `public/sage-original-*.webp`; original PNGs remain in the Codex generated-images directory. WebP encoding preserves the compositions without creative alteration.

The shared construction constraint in the prompts was: portrait 2:3, a single flat paper sheet covering the canvas edge to edge, straight-on macro photography, realistic fibres and dimensional embossing under raking light, quiet central 55% for dynamic writing and wax. No pictured envelope, folds, doors, middle seam, wax seal, plaque, text or mockup surroundings. The application supplies the actual folds, flap geometry, gum strip, seal and animation.

## Prompt set and assets

- `sage-original-wedding.webp`: deep sage handmade cotton paper; embossed fern fronds and tiny ivory jasmine at lower-left and upper-right; champagne foil leaf edges; European atelier letterpress.
- `sage-original-birthday.webp`: pearlescent lilac paper; sculptural curling paper streamers, confetti and gilded stars at upper-left and bottom-right; joyful sophisticated birthday stationery.
- `sage-original-engagement.webp`: forest emerald velvet-touch paper; antique gold peacock-feather fans at the upper corners; jewellery guilloche engraving and white magnolia buds below; Art Nouveau elegance.
- `sage-original-baby.webp`: warm oat paper; bas-relief sleeping crescent, puffy clouds and pressed stars above; tiny sculptural ivory teddy bear below; soft nursery keepsake.
- `sage-original-graduation.webp`: midnight navy bonded paper; large sweeping gold-veined laurel branch at left; astronomical chart etching upper-right; archival university diploma elegance.
- `sage-original-dinner.webp`: terracotta handmade paper; pressed sculptural olive branch from bottom-left; copper-foil pear and linen weave upper-right; Mediterranean restaurant letterpress.
- `sage-original-anniversary.webp`: antique rose marbled paper; fine rococo guilloche oval medallion; burgundy rose petals along right edge; patinated champagne foil; heirloom French love letter.
- `sage-original-corporate.webp`: charcoal leather-grain paper; architectural folded-metal Art Deco fan relief at the lower edge; brushed brass stepped lines upper-left; restrained private gallery correspondence.
- `sage-original-christening.webp`: warm white rag paper with opalescent fibres; pearly dove wings upper-left; raised olive leaves lower-right; tiny antique gold cross at bottom corner.
- `sage-original-seasonal.webp`: dark evergreen hand-dyed paper; frosted fir boughs, dimensional pinecones, tarnished gold star anise and silver snow crystals; Alpine winter correspondence.
- `sage-original-birthday-boys.webp`: deep blue paper with sculpted silver/gold planets, crescents and constellation dots at upper-right and bottom-left; embossed space explorer stationery.
- `sage-original-birthday-girls.webp`: dusty raspberry paper; dimensional folded ivory/gold butterflies at upper-left and bottom-right; pressed wildflower vines; paper garden craftsmanship.
- `sage-original-baby-boys.webp`: pale misty blue paper; ivory crescent and clouds upper-left; silver stars and pressed vintage sailboat bottom-right; comforting nursery keepsake.
- `sage-original-baby-girls.webp`: warm blush paper; bas-relief cherry blossom branches upper-right; ivory cradle surrounded by rosebuds below-left; dreamy artisan keepsake.
- `sage-original-christening-boys.webp`: powder blue rag paper; pearly olive wreath, fine gold cross and white dove upper-left; sacred European stationery.
- `sage-original-christening-girls.webp`: porcelain pink rag paper; embossed lily of the valley left and pearl baby breath upper-right; antique gold sacred cross bottom-right.

## Implemented constructions and motion

The envelope silhouettes and gallery share `traceSageFlap` in `sageEnvelopeProfiles.js`. The established hinge, camera and card-rise timings remain unchanged. Each category has a different flap cut, first-sheet typography, interior markup and interior motion:

| Occasion | Envelope cut | Interior construction | Interior motion |
| --- | --- | --- | --- |
| Wedding | botanical petal | layered vow folio | letter folds out from its lining |
| Birthday | festival scallop | perforated admission ticket | ticket pitches down into view; confetti falls |
| Engagement | jeweller point | two overlapping paper leaves | opposing leaves unfold from their hinges |
| Baby shower | cloud edge | illustrated storybook | left page opens while right page settles |
| Graduation | archival shield | diploma scroll | parchment unrolls with its lower roller |
| Dinner | rounded bistro flap | standing menu with material spine | menu opens from its bound edge; warm light flickers |
| Anniversary | heirloom curve | photo keepsake and handwritten letter | two keepsakes spread into place |
| Corporate | architectural cut | numbered exhibition poster | poster tilts upright; light columns sweep |
| Christening | soft chapel curve | three-part blessing triptych | the two narrow wings open outwards |
| Seasonal | winter crest | hinged winter postcard | two shutters open onto the winter setting; snow falls |

Motion is suppressed under `prefers-reduced-motion`. RSVP controls retain their existing validation and persistence, while the paper construction, surrounding composition and response heading vary by suite.

## Verification scope

Automated checks cover distinct original assets for all 16 designs, ten different valid flap outlines, nine non-wedding first-sheet compositions, preservation of edited names/date/venue, existing invitation/audience filters and the wider application suite. A successful build does not constitute visual verification; inspect the deployed WebGL opening and scroll interiors before reporting those as visually checked.
