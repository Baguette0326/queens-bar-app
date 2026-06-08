# Ritual MVP

An Expo/React Native prototype for a Queen's campus traditions app.

## Current Prototype

This first slice uses local mock data so the core product loop can be tested before wiring Supabase:

- onboarding with username, role, and preset avatar
- Discover search for challenges and active/upcoming plans
- challenge info pages with XP, difficulty, labels, instructions, and upcoming plans
- plan creation from a catalog challenge
- instant join into a plan-scoped group chat
- plain text group chat with `@everyone` as ordinary text for now
- completion checklist prototype
- confirmed completion awarding XP and updating tier
- profile view with tier, XP, and completed bars grouped by collection

## Run

```bash
npm.cmd install --cache .\.npm-cache
npm.cmd run web -- --port 8081
```

For iOS later:

```bash
npm.cmd run ios
```

## Supabase Setup

1. In Supabase, open your project.
2. Go to `Project Settings` -> `API`.
3. Copy the `Project URL`.
4. Copy the `anon public` key. Do not use the `service_role` key in the app.
5. Create a local `.env` file from `.env.example`:

```bash
copy .env.example .env
```

6. Paste your values into `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

7. In Supabase, open `SQL Editor` and run:

```text
supabase/schema.sql
```

8. Then run:

```text
supabase/seed_catalog.sql
```

This creates the MVP tables and inserts the 41 approved catalog bars.

## Auth Test Flow

1. Open the prototype.
2. Enter your email on the login screen.
3. Click the magic link in your email.
4. The app returns to the prototype.
5. Fill onboarding and save your profile.
6. Returning sessions should skip onboarding and open Discover.

If the email link opens a different browser than the one running the prototype, copy the redirected `localhost:8081` URL into the prototype browser.

## MVP Build Order

1. Replace local mock state with Supabase tables and auth.
2. Add real email-code login.
3. Add persistent profiles, catalog items, plans, attendees, chat messages, completions, and confirmations.
4. Add collections, badges, friends, leaderboard, reports, and push notifications after the core loop works.
