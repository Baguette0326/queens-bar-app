# Queen's Bars MVP UI Prompt

## Product Summary

Build a mobile-first iOS app for Queen's students to discover, organize, join, chat about, and complete Queen's Engineering bar/challenge/tradition meetups.

The app is built around existing Queen's Engineering jacket/bar culture, but it should not feel like an official university app or a generic drinking app. It should feel social, playful, campus-native, and lightweight. The main goal is helping people gather around existing traditions.

The MVP should focus on one core loop:

1. A user browses or searches catalog-based bars/challenges/traditions.
2. They find an ongoing/upcoming plan or create one.
3. Other users instantly join the plan.
4. Joined users coordinate in a plan-scoped group chat.
5. After the plan ends, participants confirm who completed the challenge.
6. Confirmed completions award XP and update the user's tier.

## Target Users

- Queen's students, especially Queen's Engineering frosh, frecs, and upper-years.
- Non-Engineering Queen's students may participate too, but the culture and catalog are centered on Queen's Engineering traditions.
- The app uses honor-system identity, not hard verification.

## Tone

- Campus-native
- Playful but not childish
- Social and energetic
- Trustworthy without feeling corporate
- Not overly polished like a finance app
- Not like a dating app
- Not like an official university/residence compliance tool

## MVP Navigation

Use separate main areas:

- Discover
- Catalog / Challenges
- Create
- Chats
- Profile

Discover and Catalog are separate but connected.

Discover is action-oriented:

- Ongoing plans first
- Upcoming plans next
- Search across plans, challenges, and users
- Filters for time, difficulty, tags, and collection later
- Optional map view available by swipe/toggle

Catalog is reference-oriented:

- Browse all bars/challenges/traditions
- Challenge detail pages
- XP, difficulty, tags, instructions, wiki link
- Common locations
- Interested toggle
- Collections/badges later

## Key Product Rules

- Plans are catalog-based only for MVP.
- One plan equals one bar/challenge/tradition.
- Users choose the challenge first, then location.
- Joining is instant. No request-to-join in MVP.
- Full location is visible before joining.
- Truly private room/house/apartment locations are out of MVP.
- Locations can use suggested places plus a freeform detail.
- If using "Other," user chooses a nearby preset area plus detail.
- Starter is automatically the first attendee.
- "Started by" is attribution only, not an authority role.
- No host powers in MVP.
- Plan details are locked after creation.
- Starter can delete/cancel only while no one else has joined.
- Plans can be scheduled up to 7 days ahead.
- Default duration is 2 hours, customizable at creation.
- Duplicate plans are allowed, but warn if the exact challenge already has active/upcoming plans.

## Plans

A plan card should show:

- Challenge name
- Difficulty
- XP value
- Location and detail
- Start time
- Attendee count and optional cap
- Started by username/avatar
- Open join status
- Tags/vibe labels

Plan detail page should show:

- Challenge summary
- Full location
- Time window
- Attendee count/cap
- Started by attribution
- Note/details
- Join button

After tapping Join:

- User is added as attendee.
- User immediately enters the group chat.
- Chat is visible only after joining.

## Chat

MVP chat is plain text only.

Include:

- Plan-scoped group chat
- Joined users only
- Text messages
- Mentions
- `@everyone` announcements allowed for everyone

Exclude from MVP:

- Direct messages
- Media/photo uploads
- Message deletion
- Message editing
- Reactions
- Chat muting

Push notifications should be privacy-preserving:

- Mention: "Someone mentioned you in a plan chat."
- Everyone announcement: "New announcement in a plan chat."
- Interested challenge: "A new plan was created for a challenge you're interested in."
- Badge: "You earned a new badge."
- Tier up: include tier name, e.g. "You reached Silver."

## Challenges / Catalog

Challenge cards/pages should show:

- Name
- Brief admin-written description/instructions
- Difficulty
- Exact XP value
- Tags
- Common suggested meetup locations
- Default duration
- Interested count
- Interested toggle
- Ongoing and upcoming plans
- More info button linking to an external wiki/source page

Do not include structured alcohol quantity fields like drink amounts, shots, chug times, or alcohol type.

Instructions should be brief, admin-written, and should avoid pressure/coercion language. The app coordinates meetups; it should not intensify unsafe behavior.

## Tags And Labels

Use multiple tags plus a separate difficulty field.

Example tags:

- Starter
- Low-key
- Loud
- Team-based
- Late night
- Residence
- Campus
- Tradition-heavy
- Good for frosh
- Physical
- Messy
- Bring supplies
- Alcohol involved
- No drinking required

Difficulty:

- Easy
- Medium
- Hard
- Legendary later

Higher difficulty generally means higher XP, but XP is admin-set per catalog item.

## Completion, XP, And Tiers

- Users can complete each catalog challenge once.
- Users may join plans for challenges they already completed, but they do not get more XP.
- Completion is per person, not group-wide.
- Completion requires confirmation.
- Any joined plan participant can confirm another participant.
- Users cannot confirm themselves.
- Organizer/starter confirmation counts the same as anyone else's.
- Confirmed completion grants XP once.
- Tier updates immediately after XP is awarded.
- Tier thresholds are fixed admin settings.
- Tiers use the same names for everyone.
- Users start at the lowest tier, currently placeholder name: Iron.
- Exact XP is visible to the user privately.
- Public profile and leaderboard show tier/rank, not exact XP.

## Collections And Badges

Collections are themed groups of catalog challenges.

- Collections are admin-created only.
- Collections inherit tags/difficulty from included challenges.
- Completing every challenge in a collection awards a cosmetic badge.
- Badges are awarded automatically.
- Badges do not grant XP.
- Old completions can count toward collection badges.
- A challenge can belong to multiple collections.
- Completing a challenge counts toward all collections containing it.

## Leaderboard

Include a global leaderboard later in MVP scope, but keep it simple:

- Global all-time leaderboard
- Based on confirmed XP
- Shows rank and tier only
- Does not show exact XP
- No weekly/monthly reset
- No streaks
- No fastest completion stats
- Suspended users hidden

## Profiles

Profiles are public, but sensitive sections have privacy controls.

Public profile should show:

- Unique username
- Preset avatar
- Faculty/program/year
- Role badge: Frosh, Frec, Upper Year, Other
- Tier
- Collection badges
- Completed bars by collection, depending on privacy

Private/self profile should show:

- Exact XP
- Progress to next tier
- Editable profile fields

Hidden/private:

- Email
- Default campus area/residence
- Friend list
- Upcoming joined plans by default

Usernames:

- One unique username field
- Changeable once every 30 days
- Basic uniqueness/length/character validation

Avatars:

- Users pick a preset avatar during onboarding.
- Use Queen's-inspired icon avatars, not just initials.
- Avoid official trademark-heavy logos.

## Friends

Friends are not part of the first core build, but planned later:

- Mutual friend requests
- Friends can invite each other to plans
- Friends can see friends-only completions
- No direct messages in MVP
- Friend lists hidden

## Auth And Onboarding

MVP auth:

- Email login
- Prefer magic code/link instead of password later
- Any email allowed
- Encourage Queen's email but do not require it
- Email is private

Onboarding should collect:

- Username
- Preset avatar
- Faculty
- Program/discipline if applicable
- Year
- Role: Frosh, Frec, Upper Year, Other
- Optional default campus area/residence for private discovery sorting
- Community guidelines acceptance

Guidelines should include:

- Respect others
- No harassment or threats
- No fake plans
- No pressure/coercion
- No unsafe drinking/substance pressure
- Follow campus/residence rules
- Reports can lead to suspension

Do not require legal drinking age confirmation in MVP.

## Moderation

MVP moderation is manual and lightweight:

- Users can report users/messages/plans.
- Reports are anonymous to reported users.
- Admins can see who submitted reports.
- Admins review reports later, not 24/7.
- Admins can suspend users globally.
- Suspended users are hidden from normal users.
- Existing chat messages can remain as "Suspended user" for context.

No blocking in MVP.

## Backend Preference

Recommended stack:

- Expo / React Native for iOS-first app
- Supabase backend
- Supabase dashboard for admin work instead of custom admin dashboard

Initial build milestone should ignore:

- Friends
- Collections/badges
- Leaderboard
- Reports/suspension
- Push notifications
- Full map polish

First real data milestone:

- Email login
- Onboarding profile
- Catalog challenge list/detail
- Create plan
- Discover/search plans
- Join plan
- Group chat
- End-time completion confirmation
- Confirmed completion grants XP
- Tier updates

## UI Generation Prompt

Use this prompt to ask GPT or a UI tool for potential app screens:

```text
Design multiple mobile iOS UI concepts for an app called Queens Bars.

The app helps Queen's students discover, organize, join, chat about, and complete Queen's Engineering bar/challenge/tradition meetups. It is not an official university app and should not feel like a dating app or generic drinking app. It should feel campus-native, playful, social, energetic, and trustworthy.

Core MVP loop:
1. Browse/search catalog challenges.
2. Find ongoing/upcoming plans or create one.
3. Join a plan instantly.
4. Enter a plan-scoped group chat.
5. Confirm completions after the plan ends.
6. Earn XP and progress through cosmetic tiers.

Main tabs:
- Discover
- Catalog
- Create
- Chats
- Profile

Design screens for:
- Onboarding with username, role, year/faculty/program, Queen's-inspired preset avatar picker, and guidelines acceptance.
- Discover page showing ongoing plans first, upcoming plans next, search, filters, and a map toggle.
- Catalog page showing challenge cards with XP, difficulty, tags, interested count, and upcoming plan count.
- Challenge detail page with brief instructions, XP, difficulty, tags, common locations, Interested button, More info button, and ongoing/upcoming plans.
- Create plan flow: choose challenge first, then time/duration, location from suggested places or Other nearby area plus detail, optional cap, note, publish.
- Plan detail page with full location, time, attendee count/cap, started-by attribution, note, and Join button.
- Plan group chat with plain text messages, mentions, @everyone, no DMs/media/reactions.
- Completion checklist page where participants confirm who completed the challenge.
- Profile page with username, avatar, role badge, tier, private XP progress, badges, and completed bars grouped by collection.
- Global leaderboard showing rank and tier only, not exact XP.

Important product constraints:
- One plan equals one catalog challenge.
- Joining is instant; no request-to-join in MVP.
- Full location is visible.
- No truly private house/apartment/dorm-room locations in MVP.
- "Started by" is only attribution, not host authority.
- No host powers.
- Plan details are locked after creation.
- Chat visible only after joining.
- Completion requires confirmation by other joined participants.
- No photo proof in MVP.
- Public profile shows tier but not exact XP.
- Push notification copy should be privacy-preserving.

Visual direction:
- iOS-first mobile app.
- Rich but not cluttered.
- Use Queen's-inspired colors and motifs without relying on official logos.
- Use icon avatars, badges, tier indicators, and compact plan cards.
- Avoid giant marketing hero sections.
- Prioritize actual usable app screens over landing pages.
- Make the UI feel like something students would actually open while planning a night or campus meetup.

Generate 3 distinct visual directions:
1. Clean campus utility.
2. Playful patch/jacket-inspired.
3. Dark social night-mode.

For each direction, provide screen descriptions, layout notes, color/style notes, and key components.
```
