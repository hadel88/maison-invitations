# Maison concept direction — 19 October 2026

Implemented the ivory, sage and antique-gold visual direction with an animated garden hero, wax-sealed invitation preview, six occasion worlds, occasion filters and an expandable thirteen-design collection. Existing cinematic/film invitations remain intact. Added woodland birthday and rose engagement variants.

## Selective sharing

The host opens an Invitation & Journey celebration, selects RSVPs, and checks **Share dashboard** for an individual guest. The lock icon copies that guest's private dashboard link. Unchecking revokes access. All existing and new guests default to disabled.

The shared view is read-only: event programme, RSVP totals, completed-task count and host wall photos/notes. It excludes guest lists, private RSVP notes, account settings and edit operations. Each request checks the published invitation, the matching random guest token and the explicit sharing flag in the database. Existing invitation-owner RLS controls all grants/revocations. Shared pages recheck every 15 seconds and on focus; a failed check clears their content.

Access uses the personal guest link as a bearer capability, consistent with the existing account-free invitation experience. Anyone holding a forwarded authorised link can view it until revoked; this is not identity-verified guest login. The UI explains keeping these links private. Revocation cannot remove copies already saved by a recipient.

Migration: `database/dashboard-sharing.sql`, applied to Community project `cqwqsqvhvpochvfahyyx`. No Community application tables or existing ownership policies changed. Public RPC wraps a fixed-search-path private implementation; execution is explicitly granted only for the intended capability endpoint. Supabase advisor flags its intentional guest-callable SECURITY DEFINER wrapper; the allow/deny tests below verify its gate. See https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable . Existing unrelated project findings were not changed.

## Stationery

The Matching stationery dashboard tab generates welcome signs, menus, place cards and thank-you notes using the invitation palette. Menu text saves with the event. Downloads are standalone escaped HTML print pages, sized A5, with instructions to print/save as PDF. No printing purchase or checkout is enabled.

## Verification

- Production Vite build passes; existing large-bundle warnings remain.
- 52 Node tests pass, including missing/malformed guest token rejection, write rejection on shared endpoints, revoked access, unauthenticated grant rejection, no-store responses and stationery injection escaping.
- Transactional database tests pass: default deny; selected guest allow; unselected, wrong-event and missing-token deny; revoked and unpublished deny; private guest names and RSVP notes excluded. Fixtures rolled back.
- Authenticated-role database test passes: non-owner cannot update sharing, owner can; fixtures rolled back.
- Browser: desktop/mobile homepage renders; 390px layout has no horizontal overflow or broken loaded images; Birthday filter shows child/adult worlds; child invitation opens into scrollable programme and RSVP.

## Scope

Payments remain deferred. These changes apply the concept direction and core interactions; the concept board's automatic seating chart, guest-upload memory book, hotel integrations and video-teaser purchasing are not implemented by this release. Existing host photo uploads, event planning, real provider discovery and RSVP functionality remain available.
