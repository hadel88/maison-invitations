# Maison memory album release — 19 October 2026

Restores the RoyalHero homepage, occasion arches and original theme controls. Retains selected-guest dashboard sharing and matching stationery.

## New features

- Photo album: ivory, rose and midnight covers; opening cover; two-page spreads; 24 independently transformed paper segments create a curved 1.25-second page turn; shadows, photo mounts, captions, swipe and arrow-key navigation. Reduced-motion preferences are respected. The gallery remains available beside the album. Host album design saves with the invitation.
- Guest memory book: selected guests can contribute resized JPG/PNG/WebP photos and wishes with an explicit sharing consent checkbox. Hosts can remove them through the existing wall/gallery controls. Access is rechecked at the database on every read and write. Revocation blocks album photo reads as well as contributions.
- Seating: host-defined table names/capacities, a best-fit suggestion algorithm that keeps each party together, manual assignment, capacity validation and a printable plan. Selected guests see only their own table. Plans persist privately under `seating:<invitation id>` in `maison_planning`.
- RSVP planning: optional meal preference and allergies are stored in the private response note. Before/day/after wording follows the event timezone. Parking and accommodation links search near the event venue.
- Public demonstration: `/?album=preview` uses clearly labelled sample artwork and no private celebration data.

## Data and access

Migration `database/memory-album.sql` was applied to the existing Community Supabase project. It changes Maison objects only. Existing owner RLS remains in place. Fixed-search-path capability RPCs require a published invitation and an explicitly selected guest's random token. New guest photo/wish contributions are limited to ten per minute and fifty per guest, with per-event limits. Full photos are loaded individually; the dashboard response includes metadata for up to 300 memories and at most 24 thumbnails to bound response size.

These are personal bearer links, consistent with the existing account-free invitations. A forwarded selected guest link grants the same access until revoked. Hosts are instructed to keep links private. Account login, a whole guest list, private RSVP notes and owner editing controls are not shared.

Security-advisor warnings for the intentionally guest-callable SECURITY DEFINER wrapper functions were reviewed. Their implementations remain private and access is guarded by the capability and explicit selection. Remediation reference: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable . Existing unrelated Community findings were left unchanged.

## Validation

- Production build passes with existing bundle-size warnings.
- 62 Node tests pass, including party-preserving seating, over-capacity rejection, invalid/cross-event guest rejection, consent and upload validation, capability revocation, RSVP note privacy and event-timezone date changes.
- Transactional database checks pass: selected guest photo/wish creation, own table lookup, unselected and cross-event read/write denial, ten-per-minute limit, private RSVP exclusion, revoked read/write denial. Transactional fixtures rolled back.
- A separate temporary verification event exercised a real JPEG upload through the local API and real Supabase, guest wish submission in the browser, album image rendering, and production dashboard/photo APIs. Live revocation returned 403 for dashboard reads, image reads and wish writes.
- Desktop and mobile album covers/opening/navigation were inspected. The original homepage was verified on the production domain.

Payments remain deferred. Hotel links are external map searches, rather than booking or availability integrations. The seating arrangement is a reviewable capacity-based suggestion, not an optimisation of personal relationships.

Production deployment: `dpl_Ga6S6FCZJ5SCrcsHjLAb11mMVczY`, READY, https://maison-invitations.vercel.app/ .

Cleanup: the connector's deletion-confirmation request expired twice, so the temporary verification event was left unpublished with guest access revoked. Its only sample photo and wish remain inside that disabled test event. No real user event was deleted.
