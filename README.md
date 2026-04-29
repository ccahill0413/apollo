# Apollo

**A music model builder for families — start with one song, get ten tracks everyone in the car can live with.**

Apollo is a portfolio prototype that explores what it would feel like if a music app understood *the moment you're in*, not just your listening history. You give it a seed song, tell it about the family situation (car ride, breakfast, wind-down), pick a few vibe filters, and choose your music service. Apollo returns a 10-song playlist with an **Apollo Match** score and a plain-language **"Why this song?"** for every pick.

This repository is a working product demo, not a production app. It is meant to show product judgment, end-to-end execution, and how an AI/recommendation surface might be designed for a real, messy use case (parents who keep losing the car-ride music battle).

---

## Why Apollo

Existing playlist generators optimize for one listener and one taste profile. Family listening doesn't work that way:

- The driver wants something they can actually tolerate.
- The toddler in the back wants the *Bluey* theme on loop.
- The pre-teen wants whatever's on TikTok this week.
- Everyone wants it to be *clean*.

Apollo treats the **family moment** — not the individual user — as the unit of personalization. Apollo v3 generalizes that idea further: rather than locking the experience to one streaming service, it acts as an **app-agnostic music model builder**. The user keeps their existing subscription (Spotify, Apple Music, or YouTube Music) and Apollo just builds the model and hands it off.

---

## What it does

1. **Seed**: pick a starting song (e.g. *Here Comes the Sun*, *Bluey Theme Tune*, or anything else).
2. **Context**: choose a playlist mode — *Breakfast boost*, *Car ride calm*, *Kitchen dance party*, *Wind-down*, *Parent nostalgia*, or *Silly sing-alongs*.
3. **Vibe filters**: layer on optional moods — *Mellow*, *Upbeat*, *Classic*, *Quirky*, *Clean*, *Dance*.
4. **Service**: pick Spotify, Apple Music, or YouTube Music.
5. **Generate**: Apollo returns 10 tracks, each with a match score, a short rationale, and a deep link into the chosen service.

Every track card shows:

- **Apollo Match %** — how well the song fits the requested moment.
- **Energy / Danceability / Valence** signals so the parent can sanity-check the vibe at a glance.
- **Why this song?** — 2–3 short reasons, written in human language ("clean lyrics", "parent nostalgia", "danceable beat").
- A **Clean** flag for family-safe listening.
- A one-tap link out to the user's chosen music service.

---

## Key features

- **Family-context modes** that map a real-life moment to recommendation parameters (target energy, danceability, valence, acousticness).
- **Vibe filters** that stack on top of the mode for finer control without exposing audio-feature sliders to the user.
- **Apollo Match score and reasons** — every song is explainable, not just ranked.
- **App-agnostic by design** — Spotify, Apple Music, and YouTube Music are first-class output targets.
- **Optional live Spotify seeding** — when Spotify API credentials are provided, Apollo seeds recommendations from the live Spotify catalog. Otherwise it falls back to a curated demo catalog.
- **Clean filter** for family listening, surfaced clearly in the UI.
- **Native share + copy** so a parent can paste the lineup into a group chat without leaving the app.
- **Light/dark theme** that follows system preference.

---

## Demo flow

A typical session looks like this:

> A parent opens Apollo on their phone in the school pickup line. They type *Yellow Submarine* as the seed, tap **Car ride calm**, leave **Clean** on, and pick **Apple Music**. Apollo returns ten tracks — a couple of Beatles deep cuts, a Jack Johnson, a Bill Withers, a Bluey-adjacent sing-along — each with a one-line reason. They tap **Share**, paste the list into the family chat, and pull into the carpool lane.

The **Why this song?** line is the core demo moment. It turns "trust the algorithm" into "here is the case for this song, in one sentence."

---

## Tech stack

The repo is a TypeScript monorepo with a Vite-built React client and an Express server, sharing a Zod schema layer.

**Frontend**
- React 18 + TypeScript
- Vite for dev/build
- Tailwind CSS + Radix UI primitives + shadcn-style components
- Framer Motion for transitions
- TanStack Query for server state
- `wouter` (with hash-based routing) for lightweight routing

**Backend**
- Node.js + Express 5
- Zod for runtime request/response validation
- Optional Spotify Web API integration (Client Credentials flow) for live seeding
- In-memory demo catalog as the fallback recommendation source

**Shared**
- `shared/schema.ts` — Zod schemas and TypeScript types shared between client and server (single source of truth for moods, modes, providers, request/response shapes).

**Build / tooling**
- `tsx` for dev execution and the build script
- `esbuild` for the production server bundle
- `tsc` for type checking

---

## Local setup

You need Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server (client + API on the same port, Vite middleware mode)
npm run dev

# 3. Open the app
# http://127.0.0.1:5000
```

Other scripts:

```bash
npm run check     # TypeScript type-check
npm run build     # Production build (client + server bundle)
npm run start     # Run the production build
npm run preview   # Build then start
```

### Optional: live Spotify seeding

Apollo runs out of the box against its built-in demo catalog. To enable live Spotify-seeded recommendations, create a `.env` file in the repo root with credentials from the [Spotify developer dashboard](https://developer.spotify.com/dashboard):

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

When credentials are present, Apollo authenticates via Client Credentials, searches for the seed track, and pulls recommendations using the Spotify API. If credentials are missing or the request fails, it transparently falls back to the demo catalog so the demo never breaks.

---

## Product thinking notes

A few decisions worth calling out, since this prototype is meant to communicate product judgment:

- **One model, three exits.** Apollo treats the recommendation model as the product and the streaming service as a distribution channel. Locking to one service was the v1 mistake; v3 corrects it.
- **Modes over sliders.** The audio-feature dials (energy, danceability, valence, acousticness) are real, but exposing them to a parent during pickup is the wrong UX. Modes are how a person actually thinks: *we are about to be in the car for 12 minutes and I cannot handle chaos*.
- **Explanations as trust UI.** "Why this song?" is the difference between a magic box and a tool a parent will actually use a second time. Even when the model is simple, surfacing the reasoning in plain words is what makes it feel intentional.
- **Clean as a first-class filter, not a content warning.** Family-safe listening is the whole point of the use case, so it lives in the primary control set, not buried in settings.
- **Graceful fallback over feature gating.** When the live API isn't available, the app still works. The user never hits a dead end; they just get the demo catalog with the same UX.

---

## Roadmap / future ideas

- **Real model behind the scores.** Replace the heuristic Apollo Match function with a learned ranker trained on family-moment labels.
- **Per-kid profiles.** Light-touch profiles ("toddler in the back", "8-year-old", "teen") that adjust the candidate pool without requiring per-listener accounts.
- **Save and remix.** Persist generated playlists, let users edit the lineup, and regenerate around the edits.
- **True provider write-back.** Today Apollo links into each provider via search/deep links. The next step is OAuth + native playlist creation in Spotify, Apple Music, and YouTube Music.
- **Feedback loop.** A simple thumbs-up/down on each track that feeds back into the next generation in the same session.
- **Server-side persistence.** Move from the in-memory storage stub to a real database (the repo already includes `drizzle.config.ts` and Supabase deps as a starting point).
- **Shareable playlist URLs.** Permalinks so a generated mix can be opened by anyone, not just shared as text.

---

## Caveats

This is a prototype built to demonstrate product thinking and end-to-end execution. A few things to be honest about:

- **Apollo Match is a heuristic, not a trained model.** Scores are computed from target audio features and tag overlap, not learned from data.
- **The demo catalog is curated and small.** When Spotify credentials aren't configured, recommendations are drawn from a hand-built list of family-friendly tracks in `server/routes.ts`.
- **No real Apple Music or YouTube Music integration.** Those providers are wired up via search/deep links only — Apollo does not authenticate against them or write playlists into them.
- **No persistence yet.** Playlists are generated on demand and not saved between sessions.
- **No accounts.** There is no login, no per-user history, and no per-kid profile.

These are deliberate scoping choices for a portfolio prototype — the goal was to make the *product idea* legible, not to ship a production music service.

---

## Repository layout

```
client/         React + Vite frontend
  src/
    App.tsx     Main Apollo experience (form, generation, track cards)
    components/ shadcn-style UI primitives
server/         Express API
  index.ts      Server entry, logging, dev/prod wiring
  routes.ts     /api/playlist endpoint, Spotify integration, demo catalog
shared/
  schema.ts     Zod schemas and TS types shared by client and server
script/
  build.ts      Production build script (client + server bundle)
```

---

## About

Built by **Caroline Cahill** as a product/PM portfolio piece exploring builder-style product work: real code, real UX, and a clear point of view on what the product is for and who it's for.
