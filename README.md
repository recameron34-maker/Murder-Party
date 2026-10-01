# Murder at Blackwood Manor

![Test and deploy](https://github.com/recameron34-maker/Murder-Party/actions/workflows/deploy.yml/badge.svg)

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

## Preview on GitHub Pages (now)

Every push to GitHub runs the consistency checker and all the tests (the
**Actions** tab, plus a ✓ or ✗ next to each commit), then publishes a
**read-only preview** of the whole site to GitHub Pages:

**<https://recameron34-maker.github.io/Murder-Party/>**

It has the host planner (run of show, timeline, evidence, checker, print
views) and every guest's page at every round, so you can watch progress
from any branch. The last push wins.

- **One-time switch-on (only the repo owner can do this):** repo
  **Settings → Pages → Build and deployment → Source: "Deploy from a branch"
  → Branch: `gh-pages`, folder `/ (root)` → Save.** About a minute later the
  page at the top of Settings → Pages says "Your site is live at …".
- **Getting a 404?** Pages isn't switched on yet, or Source is set to "GitHub
  Actions" or to `main`. It must be **Deploy from a branch → `gh-pages`**.
  The workflow can't flip this switch itself; GitHub only lets the repo
  owner do it.
- **It's a preview, not the party site.** GitHub Pages only serves the same
  static files to everyone, so it can't check passphrases, unlock rounds or
  deliver texts (buttons are inert). Everything on it, including the
  solution, is readable by anyone with the link. Never send it to guests.
- Build it yourself with `npm run build:static` (output in `site/`).

## Deploy the party site (Cloudflare, before the party)

The real site, with passphrase logins, live rounds and phone texts, needs a
small server. The same workflow deploys it to **Cloudflare Workers** (free)
as soon as you add Cloudflare secrets. Until then that step does nothing.

| Branch | Site | Game state |
|---|---|---|
| `main` | `https://blackwood-manor.<your-subdomain>.workers.dev` | the real party |
| any other branch | `https://blackwood-manor-preview.<your-subdomain>.workers.dev` | separate, for trying things |

Game state (round, passphrases, sent texts) lives in a Cloudflare Durable
Object that's created automatically and survives redeploys.

### One-time setup (about 10 minutes)

1. **Cloudflare account.** Sign up free at <https://dash.cloudflare.com>. Open
   **Workers & Pages** once and pick your `workers.dev` subdomain when asked.
2. **Account ID.** On the Workers & Pages overview, copy the **Account ID**
   (right-hand side).
3. **API token.** Click your profile icon → **API Tokens** → **Create Token**
   → use the **Edit Cloudflare Workers** template → Account Resources: your
   account → Zone Resources: All zones → **Continue** → **Create Token**. Copy it.
4. **GitHub secrets.** In this repo: **Settings → Secrets and variables →
   Actions → New repository secret**, four times:

   | Name | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the token from step 3 |
   | `CLOUDFLARE_ACCOUNT_ID` | the ID from step 2 |
   | `HOST_PASSWORD` | the password you'll use for `/host` |
   | `SESSION_SECRET` | 40+ random characters (mash the keyboard) |

5. **Deploy.** Push any commit, or go to **Actions → Test and deploy → Run
   workflow**. When it finishes, the run shows "Live at …". Open
   `…/host`, log in, open **Roster**, and passphrases are generated.

Until the secrets exist, the deploy step is skipped with a note and the tests
still run.

**From your laptop instead:** `npx wrangler login`, then
`npx wrangler secret put HOST_PASSWORD`, `npx wrangler secret put SESSION_SECRET`,
then `npm run deploy` (or `npm run deploy:preview`).

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
| `npm run build:static` | Build the read-only GitHub Pages preview into `site/` |
| `npm run deploy` | Build and deploy to Cloudflare from your laptop (`deploy:preview` for the preview site) |
