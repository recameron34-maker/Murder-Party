# Murder at Blackwood Manor — Project Brief

A live-action murder mystery party for ~25 guests, hosted by Ross (in character as Reggie Blackwood). This repo holds the game design and a website for (1) the host to plan and run the party and (2) guests to view their own characters.

## Source material

- `docs/source/part-one-host-script.md` — Ross's full host script (timeline, rounds, cues, rescues, reveal).
- `docs/source/part-two-mystery-upgrades.md` — design upgrades: four false theories, Morgan evidence changes, Blackmail Cash, secret missions, physical evidence hunt, red folder, extra study visitors, suspicion curve.

**Part Two supersedes Part One wherever they conflict.** Part One has not yet been revised to incorporate Part Two. Do not edit files in `docs/source/`; treat them as the original record and write revised material elsewhere.

## The solution (spoiler — host only)

Morgan Leibold killed Arthur Blackwood at ~9:38 PM with the bronze raven, over $2.4M she stole through Blackwood Legal Counsel. She escaped via the hidden study-to-library passage. The 9:45 blackout was an unrelated tripped circuit; everyone wrongly assumes Arthur died in the dark.

## SPOILER SAFETY — the most important technical constraint

Guests will open this website. Nothing a guest can reach may reveal the solution or another guest's secrets.

- Never ship all character data in one client-side bundle, JSON file, or JS object. Anyone can open dev tools or view source. Each guest's page must contain only that guest's content.
- Guest pages live at unguessable URLs (random slug per guest). No index page lists them.
- Host-only material (solution, host script, all envelopes, evidence, cue sheets) must never be deployed to a publicly reachable location. Either keep the host dashboard local-only (`npm run dev` on Ross's laptop) or put it behind real authentication — not a client-side password check.
- If the GitHub repo is public, the solution is public. Recommend the repo be private. Note that GitHub Pages serves sites publicly even from private repos; prefer Netlify / Vercel / Cloudflare Pages deploying only the guest build.
- Round envelopes are released progressively during the party. Guest pages should support showing only the content unlocked so far (e.g. host toggles which round is live), and locked rounds must not be present in the page payload before they unlock.
- Morgan's page must not look different from anyone else's in structure, length, or metadata. Her murderer instructions (including "you may accept Blackmail Cash and lie") must be indistinguishable in shape from other secret instructions.

## Cast (as best reconstructed from the docs — needs confirmation from Ross)

Host: Ross as Reginald "Reggie" Blackwood, Arthur's nephew. Victim: Arthur Blackwood (not played).

Carlotta "Carley" Blackwood (estranged daughter), Clara (Arthur's former fiancée), Lexi / Alexandra St. Clair (birthday), Maya Rose (birthday), Kush / "Kushington" (forensic accountant), Kevin Blackwood (disinherited relative), Jimmy / James (removed from will), Molly Monroe (sold fake painting), Martin (art expert), Hannah (charity), Annie / Antoinette (delivered Arthur's drink), Shea (medical/medication role), Noor / Dr. Beaumont (doctor), Joji / "the Professor" (architectural historian), Tim / Timothy, Malik (journalist / scheduled message), Morgan Leibold (Arthur's attorney — the killer), Alma, Maddie / Madeleine (necklace), Daniel, Kim (The Keyhole), Louis (snooping in walls), Lindsey Vale (private banker), Albie, Aalvia.

## Known open issues to resolve with Ross before building content

1. **Character cards don't exist in the repo yet.** The docs reference character cards and Round 1/2/3 envelopes but don't contain their text. These need to be supplied or written.
2. **Name collisions:** Part Two's secret missions list both "JIMMY" and "JIMMY FRIEDMAN" — one character or two? Part One calls both Noor ("Dr. Beaumont") and Joji ("Professor Beaumont") Beaumont. "Twenty-five people" in the reveal should match the final roster.
3. **Roster gaps:** Aalvia has a mission but no script role; Albie has a script cue but no mission; Kim and Malik's roles (journalist? podcaster? The Keyhole?) and who Lindsey is dating are unclear.
4. **Part One needs revising for Part Two:** replace "MORGAN. MIDNIGHT. DONE." with "LEGAL. $2.4M. MIDNIGHT." (Final Physical Evidence and Final Reveal); add counterweight lines; add Clara (9:33) and Shea (~9:40) hallway visits; add Morgan's self-defense email; add Kevin's "You're going to regret this."
5. **Folder conflict:** Part One says Morgan escaped with Arthur's financial folder; Part Two's red folder is found later with only the legal page torn out. Reconcile (e.g. she took only the page).
6. **Kevin's terrace-camera alibi** is referenced but no clue or envelope delivers it.
7. **Timing of Annie's 9:32 sighting:** Part One puts it in Round 3; Part Two's counterweight example treats it earlier. Pick one.
8. **"Shea" mission vs. role**, and whether the Part Two clue list (10 physical clues) maps cleanly onto the Part One end-of-round evidence beats (phone, Carlotta's note, Malik's draft, bank statement).

## Tone: spooky Saltburn

The whole game should feel like *Saltburn* crossed with a gothic ghost story. Think old-money decadence going quietly rotten, beautiful people behaving badly at a candlelit party, and outsiders who desperately want in while insiders pretend they don't care. Obsession, envy, and class tension should show up everywhere. The house is a character in its own right: portraits that watch, rooms nobody uses, servants' passages, family legends. Add a thread of dread and dark comedy rather than gore. Keep it sensual and suggestive, not explicit; check with Ross on how racy to go.

Apply this by layering, not rewriting. Possible threads to weave in:
- A Blackwood family legend or curse attached to the bronze raven.
- The Midnight Supper as a strange family ritual with rules of its own.
- Guests who are outsiders angling for a place in the family or its money.
- Staff who see everything.
- Rumors that someone has been living in the walls.

Each new layer must stay consistent with the true timeline and must not change the solution.

## Preserve existing work

**Additive only.** Do not delete or replace existing characters, envelopes, clues, cues, or script lines. Enhance them with added backstory, atmosphere, secrets, relationships, and Saltburn-flavored detail. Where Part Two explicitly supersedes Part One, keep the Part One version in history (git or an archive note) rather than erasing it. If an enhancement would require changing an existing fact, ask Ross first.

## Cast expansion: maybe guests and spare characters

Two guests are RSVP'd as maybe: **Savanah** and **Courtney**. Each needs a full character. Also write **5–10 spare characters** that can be handed to late additions.

Ask Ross about Savanah and Courtney before writing for them: how outgoing they are, any costume or theme preferences, and who they know at the party. The answers decide how central and how performative their characters should be.

### Design rule: the game must work whether or not flex characters show up

Give every character a tier:
- **Core:** carries solution-critical evidence. These are Annie, Noor, Joji, Tim, Alma, Jimmy/James, Kush, Lindsey, Maya, Malik, Morgan, and Carlotta. Core characters must be cast.
- **Supporting:** red herrings and scandals that enrich the game but aren't needed to solve it.
- **Flex:** Savanah, Courtney, and all spares.

Rules for Flex characters:
- They carry **zero solution-critical clues.** They may carry corroborating duplicates of existing clues, new red herrings that another character can resolve, or flavor and scandal.
- Each one needs a **fallback**: what happens to their content if nobody plays them. For example, their clue becomes a physical evidence envelope Ross plants, or the line simply drops.
- Each one gets a secret, a secret mission (worth $1,000 Blackmail Cash), Blackmail-able facts, and at least two ties to existing characters, so they're drawn into play immediately.
- Their whereabouts must fit the true timeline. None may be near the study between 9:32 and 9:41 unless that is deliberately designed and checked against the solution.
- Spares should be **gender- and name-flexible** where possible, so they fit whoever RSVPs late.
- Spares should vary in how much they ask of the player. Include some low-effort roles for quieter guests and some big theatrical ones.

### Website implications

The roster tracks each character's status: confirmed, maybe, spare-unassigned, or spare-assigned. Unassigned characters never get a published guest page. The host planner shows, for each round, which Flex content is live versus falling back, given the current roster.

## Website goals

**Host planner (private):** cast roster with player-name assignments; per-character envelope editor for Rounds 1–3 plus secret mission; evidence/prop checklist by round with where-it's-hidden; timeline view (true timeline vs. what players learn when); run-of-show with cues and rescue lines; consistency checker that flags clues referencing undefined characters or times that contradict the true timeline; print views for envelopes, evidence, ballots, Blackmail Cash, hint cards.

**Guest pages (public, per guest):** costume/character intro, backstory, relationships, what they know, Round envelopes as unlocked, secret mission, Blackmail Cash rules. Mobile-first — guests will read on phones at the party.

## Working conventions

- Store game content as structured data (Markdown with frontmatter or YAML/JSON per character and per clue), not hard-coded in components, so the story can be edited without touching code.
- Keep the canonical true timeline in one file and have other views reference it.
- Ask Ross before changing anything about the solution, the culprit, or core clue logic.
- Tone: theatrical, dry, funny, as in Reggie's voice in the host script, set inside the spooky Saltburn atmosphere described above. Evoke the vibe; don't copy the film's characters or plot.

## Build status and conventions (added October 2026)

**Ross's decisions so far** (full log in `docs/decisions.md`): cards and
envelopes are written from scratch; JIMMY and JIMMY FRIEDMAN are two guests;
Albie and Aalvia are one guest; Savanah and Courtney are both theatrical;
spice level is **saucy**. Every other open issue above has a documented
default in `docs/decisions.md`. Treat those as resolved unless Ross says
otherwise, and keep that file updated when he does.

**Website design change (Ross's request):** instead of unguessable static
URLs, guests **log in with a per-player passphrase** and the site acts as a
game companion, including timed and cue-triggered phone texts visible only to
that player. The spoiler rules above still apply and are enforced server-side
(see README → Spoiler safety).

**Layout**
- `content/`: all story data (YAML/Markdown). `content/timeline.yaml` is the
  canonical true timeline. `content/script/` is the revised run of show.
- `src/app.mjs`: the whole app as one fetch handler (Node for dev/tests,
  Cloudflare Worker + Durable Object in production, deployed by
  `.github/workflows/deploy.yml`: `main` → production, other branches →
  preview; dormant until Ross adds Cloudflare secrets). For now Ross
  deploys **only to GitHub Pages**: `scripts/build-static.mjs` builds a
  read-only, spoiler-full preview that the workflow pushes to `gh-pages`.
  It must never contain passphrases.. `src/lib/check.mjs` is the
  consistency checker. `src/views/` holds the guest, host and print pages.
- `test/`: spoiler-leak, Morgan-parity, auth and content tests.

**Before committing:** run `npm run check` (zero errors) and `npm test` (all
pass). Morgan's page must not be the longest; if you lengthen her file,
lengthen others or trim hers. Flex characters' content in other people's
envelopes goes inside `[[if:<id>]] … [[/if]]` blocks.
