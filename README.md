# Maison Invitations

## Fairytale edition — current scope

The whole website now uses three original luxury fairytale worlds: Midnight Royal, Enchanted Garden and Rose & Reverie. There are **24 designs across ten occasions**, with a living journey map, an occasion-specific six-step checklist, private EUR budget/city notes, real RSVP-driven constellation progress and saved expert shortlists. World preferences can also be selected per invitation.

The **Venues & Experts** tab reuses the existing Community project's server-side `GEOAPIFY_API_KEY` through the new, separately deployed `maison-discover` Edge Function. The existing Community importer was not changed, and no key was retrieved or copied into browser code. A real Frankfurt search returned **40 places** and was verified in the UI and cache. Signed-in users can search European cities for venues, flowers, cakes, beauty and dining. The fixed-city public preview allows a real demonstration before sign-in. Planners, photography, entertainment and other categories also have official directory links and a Maps discovery handoff.

Shortlists and private enquiry drafts persist in `maison_shortlist`; plans persist in `maison_planning`. Users copy briefs or open provider websites themselves. Nothing is automatically sent or booked. Place data is not a promise of event suitability or availability; directories are not represented as Maison partners.

The discovery function validates Supabase Auth for arbitrary searches. Its two intentional public GET operations reveal only provider readiness or fixed Frankfurt public place data. It caches searches for seven days and applies database-enforced caps of 20 uncached searches per identity/day and 100 in total/day. The public fixed-city demo has its own bounded quota identity. Server-only cache and usage tables have RLS and no client grants; the resulting advisor INFO notices are intentional. The service-only search-quota function is unavailable to public and authenticated clients.

Current verification: **15 automated tests pass**, a production build passes, invitation/guest/plan/shortlist RLS checks pass, a real RSVP was persisted, a real provider search was cached, and a discovered venue was passed into an editable invitation draft. The user confirmed signing in successfully. See the updated verification section below and `ASSETS.md` for original image prompts and asset paths.

Additional schema: `database/planning.sql`. Edge source: `supabase/functions/maison-discover/index.ts`. For another deployment, configure the provider secret directly in Supabase and deploy this function with its own authentication checks; do not expose the service-role key. The existing installation already uses its configured secret.

Working MVP preview: https://maison-invitations.vercel.app

Sample invitation: https://maison-invitations.vercel.app/?invite=36545f09-2f10-4de9-8cd9-0cc3b4590260

## Included

- 24 original illustrated designs across ten occasion types, including weddings, birthdays, engagements, baby showers, graduations, dinner parties, anniversaries, corporate events, christenings and seasonal celebrations.
- Mobile gallery, occasion filtering, search, sorting and favourites.
- Interactive hinged envelope, wax seal, original browser-generated piano/chime melodies and mute control.
- Live invitation studio with names, date, time, European timezone, venue, address, message, RSVP deadline, dress code and resized photo upload.
- English, German and French gallery and guest-interface translations and localised dates. Host studio, support copy and some secondary headings currently remain English.
- Supabase password authentication, HttpOnly session cookies, refresh, sign-out and password recovery.
- Saved drafts, published invitation links, individual guest links, host RSVP dashboard, 15-second reply refresh, CSV export, individual guest deletion, invitation deletion and account-data export/deletion.
- Calendar download retains the event timezone. Maps open separately.
- Server-only Stripe Checkout and signed, idempotent webhook architecture. Checkout is disabled unless all required credentials and the canonical app URL are configured.

## Hosting and database

Vercel project: `maison-invitations`, project ID `prj_pqQsz75jnDPabyfBqHV1I79TMAb0`, team `test11-06c6`, function region `fra1`.

Supabase: existing Community project `cqwqsqvhvpochvfahyyx`, Frankfurt. A new project could not be created because the account has reached the two-active-free-project limit. The user authorised isolated Maison tables inside Community.

Only `maison_invitations`, `maison_guests`, `maison_orders` and the `maison_private` schema/functions were added. Existing application tables were not altered. Maison and Community intentionally share the project's Auth user pool for this preview; PutzBot's separate project does not share it. Password changes affect both Maison and Community.

An illustrative Sofia & Alexander invitation was added to the existing account for `hala2101988@gmail.com`. It contains fictional event details and clearly labelled sample guests. A sample RSVP for two guests was verified from the deployed website.

## Local development

Use Node.js 22 or 24. Run `npm ci`, copy `.env.example` to `.env.local`, and configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Run `npm run dev` for the local UI and API adapter. Run `npm test` and `npm run build` before deployment. Never commit `.env.local`.

The checked-in `database/schema.sql` documents the applied schema. Do not reapply it to the existing Community project. Use reviewed migrations for future schema changes. The hosted migration is named `maison_invitations_isolated_mvp`.

## Authentication and recovery

The app authenticates against Supabase Auth, not Google, Vercel or the Supabase administration dashboard. Emails are trimmed and lowercased. Existing sign-in passwords can be shorter than eight characters; new passwords require eight or more.

The preview does not change Community's global email templates or redirect allowlist. Password recovery therefore supports copying the complete recovery link from the email into Maison, without opening or consuming it first. Maison validates the exact Supabase origin and recovery path before exchanging its one-time token. New passwords and recovery links are never stored in browser storage or application files. Delivery depends on the shared project's SMTP settings and limits. Actual recovery email delivery and password changes have not been performed on the user's behalf.

For commercial launch, move to a dedicated Supabase project, configure a dedicated SMTP provider, add the canonical callback URL to its redirect allowlist and use a normal redirect-based recovery flow. Test signup, email confirmation, sign-in, refresh and recovery end to end with a designated test account.

## Security and privacy

All Maison tables have RLS. Host queries use the visitor's access token; no service-role credential is exposed to the browser. Public functions deliberately allow unauthenticated access only to a published invitation identified by its random UUID capability link. Named guest links require a valid invitation-scoped random guest token. Guest lists and notes are not included in public invitation responses.

The Supabase advisor flags the two deliberately public `SECURITY DEFINER` functions. Their fixed empty search paths, random capability checks, scoped returns, RSVP field bounds and 500-guest cap are intentional. Their grants do not provide table-list access. See the [Supabase advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

The shared project also has pre-existing advisor findings, including disabled leaked-password protection. Those global settings and other apps' functions were not changed. Review [password security settings](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) before commercial launch.

Use private invitation links only for intended guests. Anyone who possesses a general invitation link can view it and RSVP. There is a honeypot, validated field limits and an invitation guest cap; add distributed abuse throttling or a CAPTCHA before broad public marketing. No analytics or advertising cookies are used. Google Fonts is a third-party font request; self-host fonts before launch if desired. Automatic retention cleanup, processor agreements, operator identity, VAT/withdrawal terms and privacy contact details remain launch work. The site accurately identifies itself as a preview.

Photos are resized in-browser to JPEG and stored in invitation content, with server/database size limits. This works for the MVP; move production media to access-controlled object storage for larger libraries.

## Payments

Required server environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` and `APP_URL`, in addition to the public Supabase configuration. None of the Stripe or service-role secrets was supplied. Live checkout is therefore disabled, and no payment was simulated or taken.

Server-set plan amounts are EUR 19/29/49. Checkout authenticates the host and verifies invitation ownership; clients cannot choose an arbitrary amount. The webhook verifies the raw-body signature, a five-minute timestamp tolerance, paid status, currency, expected amount and invitation ownership. `stripe_session_id` is unique and duplicate webhook deliveries are ignored. Fulfillment is never inferred from the browser success URL.

Before enabling paid launch: complete tax/consumer terms, configure Stripe test keys, test real Stripe sandbox checkout/webhooks, implement and verify premium entitlement gating and refunds, then explicitly enable live payment UI. Premium pricing buttons currently open the free design studio and accurately state that checkout is coming soon.

## Source and deployment

Deployment was made directly through the connected Vercel API. There was no GitHub connector or authenticated GitHub CLI available, so no GitHub repository or CI integration was created. This source and its lockfile are provided for a subsequent repository push. Vercel's production alias hosts the working MVP preview; this is not a declaration that the service is ready for commercial operation.

See `VERIFICATION.md` for tested paths and limits.
