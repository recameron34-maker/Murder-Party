# Murder at Blackwood Manor

A live-action murder mystery for ~25 guests, plus the website that runs it:

- **Guest companion app.** Each guest logs in with their own passphrase and
  sees only their character: story, connections, evening, secret, mission,
  round envelopes as you unlock them, and an in-page phone that receives
  texts during the night.
- **Host panel** (`/host`, password-protected). Unlock rounds, fire cue texts,
  text anyone, assign spares to late arrivals, plus the run of show, true
  timeline, evidence checklist, consistency checker, flex coverage and print
  views (envelopes, evidence, ballots, Blackmail Cash, hint cards, login
  cards).

> **Spoiler warning:** everything in this repo (`content/`, `docs/`, the
> tests) reveals the solution. Guests should only ever see the website.

## Quick start (your laptop)

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install
npm run dev
```

- Guests: <http://localhost:8787/>
- Host: <http://localhost:8787/host>, password `blackwood` (set your own in a
  `.dev.vars` file: `HOST_PASSWORD=...`)

Open **Roster** once: it generates a passphrase for every cast guest. Use
**Characters → Preview** to see any guest's page at any round.

## Editing the story

Everything is plain text in `content/`. Change a file and refresh the page.

| Path | What it is |
|---|---|
| `content/timeline.yaml` | **The canonical true timeline**, plus the murder-window rules the checker enforces |
| `content/characters/*.yaml` | One file per character: costume, story, connections, evening, secret, blackmail facts, instructions, mission, Round 1–3 envelopes, phone texts |
| `content/clues/*.yaml` | Physical evidence and props (what's printed, where it's hidden, the truth); `spoken.yaml` lists the facts players must reveal |
| `content/script/*.md` | The revised run of show (Part One + Part Two upgrades; 🆕 marks new material) |
| `content/roster.yaml` | Who plays whom and their status (confirmed / maybe / declined / spare) |
| `content/texts.yaml` | Texts sent to everyone |
| `content/guest-common.yaml` | Rules and lore shown on every guest page |
| `content/lore.yaml` | Host-only world: rooms, the raven curse, the man in the walls, NPCs |
| `content/hints.yaml` | Hint cards |
| `docs/decisions.md` | How every open question was resolved, and what's still worth confirming |
| `docs/source/` | Your original Part One and Part Two (never edited) |

Run the checker after edits. It catches undefined characters, times that
contradict the true timeline, flex characters near the study during the
murder, Morgan's page standing out, and more:

```sh
npm run check
```

When running locally, the host panel also has an **Edit YAML** link on each
character.

### Phone texts

Each character has `texts:` with one trigger each:

```yaml
- id: maya-jimmyf-r1
  from: Jimmy F. 🌹
  trigger: { round: 1, after: 3 }     # 3 minutes after you unlock Round One
  body: "Whatever happens tonight, birthday girl, you're safe with me."
```

Triggers: `{ history: true }` (already on their phone when they log in),
`{ round: N, after: M }`, `{ cue: "description" }` (you press Send in the
host panel; cue texts are also linked from the run of show), and
`{ day: -1, time: "18:00" }` (relative to the party date, for pre-party
teasers). `stamp: "9:29 PM"` shows an in-world time instead of the real one.
You can also text anyone, as anyone, from **Texts** during the party.

### Flex characters

Savanah, Courtney and the eight spares are optional. A line in someone else's
envelope that depends on them is wrapped like this, and only appears while
that character is cast:

```
[[if:courtney]]
If Courtney's raven selfie comes out, you saw the raven back on the desk at 8:45.
[[/if]]
```

The **Flex** page shows what's live versus falling back for the current roster.

## Party night

1. **Before:** set the party date (Dashboard), check the Roster, print login
   cards or text each guest their link (the link pre-fills their passphrase),
   print envelopes and evidence, hide Round One evidence.
2. **Arrivals and mingle:** guests read their character pages and their
   phones already show some "history" texts.
3. **Each round:** press **Round One / Two / Three** on the Dashboard. Every
   phone shows the new envelope within ~15 seconds and that round's timed
   texts start dripping in. Fire cue texts from the run of show.
4. **Late guest?** Roster → pick a spare → type their name → `spare-assigned`
   → Save. A passphrase appears; give it to them.
5. The host panel works on your phone, so keep it in a pocket.

## Deploy (so guests can use it on their phones)

The site runs free on **Cloudflare Workers**, with a small Cloudflare D1
database for the live game state.

One-time setup:

```sh
npx wrangler login                          # opens a browser; free account is fine
npx wrangler d1 create blackwood-manor      # prints a database_id
#   → paste that id into wrangler.toml (database_id = "...")
npx wrangler secret put HOST_PASSWORD       # choose a strong host password
npx wrangler secret put SESSION_SECRET      # paste 40+ random characters
npm run deploy
```

`npm run deploy` runs the checker (deploy is refused if there are errors),
bundles the content into the Worker, and prints your site address
(`https://blackwood-manor.<you>.workers.dev`). Re-run `npm run deploy` after
editing content. Game state (round, passphrases, sent texts) lives in D1 and
survives redeploys.

**No-internet fallback:** run it on your laptop and have guests join your
Wi-Fi: `npm run dev -- --lan` (requires `HOST_PASSWORD` in `.dev.vars`). The
terminal prints the address to give out.

## Spoiler safety

- Character content is compiled into the server, never shipped to browsers.
  Each page is rendered for the logged-in guest only: their character, the
  rounds you've unlocked, the texts they've received. Locked rounds and
  unsent texts never leave the server.
- Logins are server-checked passphrases with signed, HttpOnly cookies and
  rate limiting. The host panel is behind its own password. No client-side
  password checks.
- Passphrases are generated by the host panel and stored only in the live
  game state, never in this repo.
- Morgan's page has the same sections, shape and approximate length as
  everyone else's, and "you may accept Blackmail Cash and lie" sits among
  everyone's private instructions.
- `npm test` proves it: it logs in as every guest at every round and checks
  for leaks of other characters' secrets, locked rounds and host notes. It
  also checks Morgan's page parity, auth and cookie tampering, rate limits
  and text delivery.

The repo is public, so anyone who finds it can read the solution. Make it
private before guests learn the site exists (GitHub → Settings → Danger Zone
→ Change visibility).

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Local server with live content reload and the YAML editor |
| `npm run check` | Consistency checker (`--all` to include notes) |
| `npm test` | Spoiler-safety, auth and content tests |
| `npm run build` | Compile content for the Worker (`dist/content.json`) |
| `npm run deploy` | Build and deploy to Cloudflare |
