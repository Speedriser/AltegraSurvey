# Altegra Forms

Internal + public form management app for Altegra. Employees create forms, share
them either internally (auth required) or publicly (link-only), and view all
responses to forms they own.

Built with Next.js 14 (App Router), TypeScript (strict), Tailwind, shadcn/ui,
Supabase (Auth, Postgres, RLS), Cloudflare Turnstile, and Upstash Redis.

## Status

Phase 1 (foundation) is in place. Subsequent phases land database/auth, the form
builder, the renderers, the responses dashboard, and the GDPR/abuse tooling. See
the spec in `CLAUDE.md` for the full plan.

## Local development

```bash
cp .env.local.example .env.local
# fill in the values, then
npm install
npm run dev
```

## Required environment variables

See `.env.local.example`. Every var listed there must be set before deploying.

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server Supabase auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client; bypasses RLS for the public-submit route and cron |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile bot challenge on public forms |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting for the public-submit route |
| `ALLOWED_EMAIL_DOMAIN` | Magic-link signups outside this domain are rejected at the trigger |
| `APP_URL` | Used to build copy-able share links (e.g. `https://forms.altegra.com`) |
| `IP_HASH_SALT` | Seed combined with the UTC date to produce a daily-rotating salt for hashing IPs |
| `TIMETRAP_SECRET` | Signs the time-trap cookie set on the public form load |

## Supabase setup

1. Create a Supabase project. Copy URL, anon key, and service role key into
   `.env.local`.
2. Apply the migration once it lands in `/supabase/migrations/0001_init.sql`
   (Phase 2):
   ```bash
   supabase db push
   ```
   or paste the file into the SQL editor.
3. Set the `ALLOWED_EMAIL_DOMAIN` env var on the Supabase project (the trigger
   reads it via a `SECURITY DEFINER` helper). The README in Phase 2 will document
   the exact setup once the migration is written.
4. (Optional) Generate types:
   ```bash
   supabase gen types typescript --project-id <id> > src/lib/types.ts
   ```

## Cloudflare Turnstile

1. In the Turnstile dashboard, create a widget for the deployed app URL.
2. Copy the site key into `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the secret into
   `TURNSTILE_SECRET_KEY`.
3. Localhost is supported by Turnstile in test mode; use the documented testing
   site/secret keys during development.

## Upstash Redis

1. Create a Redis database in Upstash.
2. Copy the REST URL and token into the matching env vars.
3. The rate-limit wrapper in `src/lib/rate-limit.ts` (Phase 5) uses
   `@upstash/ratelimit` with sliding windows.

## Vercel cron

A daily retention job runs at `02:00 UTC` against `/api/cron/cleanup`. Configure
it in `vercel.json` (Phase 7) and set `CRON_SECRET` if you want signed
invocations.

## GDPR data flow (summary)

| Surface | What is stored | Where | How long |
| --- | --- | --- | --- |
| Internal submission | `respondent_id` (auth user), answers | `responses`, `answers` | Per form `retention_days` (or indefinite) |
| Public submission | self-reported name/email (optional), answers, `ip_hash`, truncated UA | `responses`, `answers` | Per form `retention_days` |
| IP / UA | hashed with daily-rotating salt; UA truncated to 200 chars | `responses` | Same as response |
| Audit log | actor, action, target | `audit_log` | Indefinite |

Right to erasure: respondents can delete their own internal responses from
`/me/responses`. Public respondents are given a response ID after submission and
asked to email the form owner; owners can delete responses from
`/forms/[id]/responses`. The daily cron deletes responses older than each form's
`retention_days`.

## Things to update before production

- Replace the `privacy@altegra.com` placeholder in `/privacy` with the real
  contact address.
- Confirm `ALLOWED_EMAIL_DOMAIN` matches Altegra's authoritative domain.
- Review default rate-limit thresholds in `src/lib/rate-limit.ts`.
- Rotate `IP_HASH_SALT` and `TIMETRAP_SECRET` before going live.
- Double-check Vercel cron auth (`CRON_SECRET`).
