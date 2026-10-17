# Verification — 17 October 2026

## Fairytale edition update

- 15 automated tests pass, including all ten worlds having at least two designs, actual-data journey progress, no fabricated empty-world progress, legacy occasion mapping, safe provider links, authenticated arbitrary discovery and the read-only fixed-city preview.
- Three original generated scene assets load and can be selected as themes. Desktop and phone layouts checked; at a 390px phone viewport, content width is 375px including the vertical scrollbar space and does not overflow horizontally.
- User confirmed successful sign-in. No user password was requested or retrieved. Later source inspection confirmed Community uses Supabase `signInWithPassword` against the same project.
- Reused Geoapify connection readiness returned configured. A real Frankfurt venue search returned 40 business/place results; the rendered list and persisted seven-day cache were verified. No private provider key was exposed or copied.
- The live place UI displayed actual names, addresses, known website/phone links and source attribution. A real place's enquiry draft opened, and “Use this venue in my invitation” populated the editor with Hotel Miramar and its address.
- Transactional tests confirmed planning and shortlist inserts and that another owner cannot read them. They were rolled back without creating test planning data in the user's account.
- The new Edge Function intentionally handles a public readiness check and fixed-city demo, while arbitrary searches validate the visitor with Supabase Auth. Shared key usage is capped and cached. No automatic outreach, provider bookings or payments occurred.
- Existing public invitation capability warnings remain deliberate and reviewed. The two new backend-only tables' RLS-without-policy INFO notices are deliberate: they have no anonymous/authenticated grants.

The earlier checks below document the initial invitation MVP and remain relevant; the above counts/scope supersede the earlier design/test totals.

## Passed

- Production build with pinned dependencies.
- Eight automated tests: design coverage/unique IDs; English/German/French dates; timezone-aware calendar output and newline escaping; Stripe signature/tamper/staleness checks; sign-in email normalisation and existing short-password compatibility; HttpOnly/Secure/SameSite cookies with no returned access tokens; cross-origin mutation rejection; foreign recovery-link rejection; missing payment configuration remains disabled (some checks share a test).
- Hosted Vercel page renders and has no captured browser errors during the checked gallery/editor/guest paths.
- All 16 gallery designs render; the wedding filter displays four wedding designs. Search/sort are implemented; only category filtering was exercised in the live browser.
- Editor changes immediately update the rendered names. European timezone selection works. German invitation date appears as `19. Juni 2027`.
- Responsive phone layout checked at 390 × 844; content fits the available viewport. Mobile editor toggles between fields and live preview.
- Personal invitation link loads the intended fictional guest name. Wax-seal click opens the invitation. Music can be muted.
- A real Vercel RSVP for the labelled sample guests was submitted and the success message rendered. Supabase query confirmed `response=yes`, `party_size=2`, and a persisted response timestamp.
- Transactional database tests (rolled back) verified authenticated draft insertion, unpublished draft invisibility, publication, guest creation, RSVP insertion and repeat-response update without duplicates.
- Separate RLS tests verified the owner can read the sample invitation, a different account cannot read that invitation or its guest list, invalid named guest tokens are rejected, and the public published link works.
- Supabase security advisor run; deliberate public capability functions reviewed. Other apps' existing findings were not modified.

## Not claimed as tested

- The user's actual password, account sign-in or password recovery email delivery. No password was requested or retrieved; confirmed/password-enabled/unblocked account state was checked without reading password hashes.
- Live/test Stripe checkout or paid premium unlocks: credentials unavailable; all live checkout remains disabled.
- Final production SMTP, legal compliance, retention automation, abuse protection at scale or a separate Maison Auth tenant.
- GitHub repository/CI, since neither a connected GitHub tool nor an authenticated GitHub CLI was available.

## Demonstration URLs

- App: https://maison-invitations.vercel.app
- General invitation: https://maison-invitations.vercel.app/?invite=36545f09-2f10-4de9-8cd9-0cc3b4590260
- Sample named guests: https://maison-invitations.vercel.app/?invite=36545f09-2f10-4de9-8cd9-0cc3b4590260&guest=6a803fe7-33c3-4898-92e9-fb4431ee512c
