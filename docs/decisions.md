# Decisions log

How each open issue in `CLAUDE.md` was resolved, and every new fact invented
to fill a gap. **Ross's answers** are marked as such. Everything else is a
**default**: chosen to fit both source docs without changing the solution, and
easy to overrule. Nothing here changes the culprit, motive, weapon, escape
route or the 9:38 timeline.

The canonical true timeline is `content/timeline.yaml`. Lore is in
`content/lore.yaml`.

## Ross's answers (October 1)

| Question | Answer |
|---|---|
| Are character cards / envelopes written anywhere? | No. Write and build anything not in the source docs. |
| JIMMY vs JIMMY FRIEDMAN | **Two different guests.** |
| Albie vs Aalvia | **Same person.** One character: Aalvia "Albie". |
| Savanah and Courtney | **Both theatrical.** |
| Spice level | **Saucy.** Bolder innuendo and scandalous entanglements, nothing explicit. |
| Public GitHub repo | Not a concern for now ("no one knows this site exists"). |
| Noor and Joji | **Married**, and **Noor is pregnant** (in real life and in character). Arthur was to be godfather; Annie pours Noor an alcohol-free Reckoning. Her role stays seated and spoken. |
| Lindsey and Malik | **Dating** (confirmed). |
| Savanah's real-life ties | Knows **Jimmy, Kim, Ross and Carley**. Her character: James was best man at her 3 a.m. Vegas wedding to Arthur, Reggie helped bury the annulment (she calls him "nephew"), Kim is her old friend, Carley is her horrified "stepdaughter." *Assumed "Jimmy" = James Calloway's player.* |
| Courtney's real-life ties | Knows **Ross, Carley, Morgan** and others. Her character: she crashed Carley's Berlin opening as a fake countess, Morgan has hired her for client dinners, Reggie is in on the act. |
| Morgan breadcrumb | **Keep, but super subtle and disguised:** the old floor-plan prop carries a faded filing stamp, "RECEIVED · B.L.C. · 14 AUG". Joji only remembers "somebody's office stamp." Only a guest who matches it to the ledger's "AUTHORIZED: BLC" will realize Morgan's office had the plans. |
| Deploy | **GitHub only, for now** (Ross). A **temporary landing page deployed from `main`** to GitHub Pages lists every branch and links to its static, read-only, spoiler-full preview, so he can watch progress. Pages Source: "GitHub Actions". Remove later by deleting `.github/workflows/pages.yml` and `.github/landing/`. The real party site (logins, rounds, texts) needs Cloudflare. That deploy job is already in the workflow and stays dormant until the secrets are added, before guests get links. |
| Floor plan | Coming from Ross; it will map the game areas and the hiding spots. |
| Website | **Per-player passphrase login**, with the site as a game companion: texts that arrive at set times or on cue, visible only to that player. Built as a server-rendered app (Cloudflare Workers + D1) instead of static pages. |

## Open issues from CLAUDE.md

1. **Character cards and envelopes**: written from scratch in
   `content/characters/*.yaml` (25 cast, 2 maybes, 8 spares).
2. **Name collisions**
   - James "Jimmy" Calloway (core: removed from will, sees Morgan at 9:40) and
     **Jimmy Friedman** (supporting: the fixer, "business deal" mission) are
     separate. Reggie calls the first one "James" in the script, which helps.
   - *Default:* **Dr. Noor Beaumont and Professor Joji Beaumont are married.**
     Both are Beaumonts and both appear in the script. If they aren't a
     couple in real life, make them siblings or rename one; only
     `noor.yaml`/`joji.yaml` mention it.
   - Head count: 25 guests (24 named in CLAUDE.md, plus Jimmy Friedman, with
     Albie = Aalvia), which matches "Twenty-five people came to Blackwood
     Manor tonight." The revised script computes this number from the roster,
     so it stays right when maybes and spares are added.
3. **Roster gaps**
   - Aalvia "Albie" is the medium Arthur hired to "channel" the founder at
     the Midnight Supper. She has both the "who benefits from the dark?" cue
     and the "secret allies" mission. Arthur really did confide in her.
   - *Default:* **Kim** secretly writes **The Keyhole**, the anonymous society
     gossip column. **Malik** is the investigative podcaster ("Old Money")
     whom Arthur was feeding information. **Lindsey is dating Malik.**
4. **Part One revised for Part Two**: `content/script/*.md` is the revised
   run of show. Part One itself is untouched in `docs/source/`. The change
   list is under "Script revisions" below.
5. **Folder conflict.** Morgan escaped through the passage carrying the
   red folder (Part One). In the library she tore out the CONFIDENTIAL LEGAL
   page and shoved the folder behind the books (Part Two). She still has the
   page on her. Optional prop: Morgan can carry it folded small for a final
   "empty your pockets" moment.
6. **Kevin's terrace-camera alibi**: new physical clue `terrace-camera`
   (late Round Two). Kevin grabbed the nearest coat from the hall at 9:22,
   which was Arthur's, and paced the terrace until 9:47 on camera. His Round
   Two envelope tells him to ask Reggie for the footage. Because he's been
   wearing Arthur's coat, Kevin is also the one who finds the folded bank
   statement in its pocket in Round Three, which explains Part One's "Kevin
   gives you Arthur's folded bank statement."
7. **Annie's 9:32 sighting stays in Round Three** (Part One). Part Two's
   suspicion curve needs Shea and Clara to remain possible as "the woman" at
   the end of Round Two, which an earlier Annie reveal would kill. The
   counterweight example in Part Two is a pattern, not a schedule. Annie's
   reason for keeping quiet: Morgan handled Annie's divorce for free and Annie
   is loyal. Besides, the meeting was on the calendar, so why would it matter?
8. **Shea and the clue mapping.** Shea is Arthur's private nurse (the
   medication, the ominous comment, the "why did we assume the blackout?"
   cue). Her secret mission is unchanged. Clue mapping:
   - Part Two **Clue 10 (final bank document)** and Part One's **folded bank
     statement** are the same prop. Page one shows the authorizations with
     BLC and ML-0427. Across the top, in Arthur's hand: **LEGAL. $2.4M.
     MIDNIGHT.** Kevin finds it in Arthur's coat.
   - **Arthur's phone** (end of Round One), **Carlotta's note** (Round Three)
     and **Malik's scheduled message** (Round Three) stay as Part One beats.
     None of the ten Part Two clues replaces them.
   - **Clue 9 (the draft letter)** is a separate unfinished letter from
     Malik's scheduled message. Truth: it's to Morgan ("you were supposed to
     protect this family", meaning the family's lawyer). It stays ambiguous.

## New issues found while reading, and how they were filled

- **Molly's clearing note** didn't exist. New prop `molly-cleared-note`,
  produced by **Martin in Round Three**: Arthur's note saying the forger
  Lucien Vasse fooled Molly too. Saucy reason Martin sat on it all night: he
  and Molly used to sleep together and he enjoyed watching her sweat. If
  Martin isn't cast, Reggie "finds" the note.
- **The black thread** is from **Arthur's own black velvet smoking jacket**.
  The cuff snagged on the raven's beak as he fell. Shea (who dressed him)
  confirms it in Round Three. It points at nobody's costume, so it can't
  accidentally accuse a guest. Part Two's "creates chaos without lying"
  still holds.
- **Blackmail Cash timing**: hand out the cash right after the murder
  announcement and the rules, before the Round One envelopes. Part Two's
  "at the beginning" means the beginning of the game.
- **Noor's time of death**: the Final Timeline now says "9:35 to 9:40"
  (Noor's range). "Approximately 9:38" survives only in the final reveal,
  where Reggie is telling the truth.
- **"The Wellington matter"** in Morgan's email: Hannah is Hannah
  **Wellington** of the **Wellington Foundation**, the planned charitable
  transfer. Monroe = Molly, Vale = Lindsey.
- **How Morgan knew about the passage**: Joji's survey of the house,
  including the 1891 plans, went through Blackwood Legal for a landmark
  application in August. It sits in Morgan's backstory. Per Ross, the only
  outward trace is the disguised "B.L.C." filing stamp on the floor-plan prop.

## Lore layer (spooky Saltburn), all additive

- **The raven curse**: every Blackwood who tried to give the fortune away
  died before signing (Edmund 1923, Cordelia 1979). Arthur announced he'd
  give it all away. Guests may blame the curse. It's mood, not evidence.
- **Midnight Supper rules** (seven, printed on every guest page), plus "the
  Reckoning", the 9:30 drink the house pours for the patriarch. Annie
  carries it.
- **Someone living in the walls**: it's Louis. He has been sneaking in
  through the ice-house tunnel for weeks hunting Silas's legendary "Raven
  Room". At 9:25 to 9:46 he was trapped in an east-wing passage, far from
  the study. Kim saw him crawl out at 9:46.
- **Portraits that watch**: Molly's forged "Lady Evangeline Blackwood".
- **Staff who see everything**: Annie (house manager, eleven years) and Shea
  (live-in nurse).
- **Outsiders angling in**: Morgan (the scholarship girl who became the
  family's lawyer), Alma (the archivist wearing Carlotta's old dresses),
  Maya (granddaughter of the cook), Jimmy Friedman, Molly, Courtney,
  Savanah, and most of the spares.

## Flex characters

- **Savanah**, theatrical: "the Widow Blackwood". She claims a 1999 Las Vegas
  wedding to Arthur makes her his heir. It was annulled in 2001. Kim or
  Morgan can resolve it.
- **Courtney**, theatrical: a "professional guest" hired to make parties look
  grander, posing as minor nobility. Her 8:40 selfie with the raven puts her
  fingerprints on the murder weapon. Resolved by Molly (raven on the desk,
  untouched, at 8:45) and by Courtney being at the piano 9:30 to 9:45.
- **Spares**: eight name- and gender-flexible roles from low to high effort.
  See `content/characters/spare-*.yaml`.
- Lines in other characters' envelopes that mention a flex character are
  wrapped in `[[if:courtney]] … [[/if]]` and disappear when that character
  isn't cast. The host planner's "Flex coverage" page shows what's live.

## Script revisions (Part One → `content/script/`)

- "MORGAN. MIDNIGHT. DONE." → **"LEGAL. $2.4M. MIDNIGHT."** (Final Physical
  Evidence and Final Reveal)
- Counterweight lines after each strong Morgan clue (Annie, Alma, Kush)
- Clara (9:33) and Shea (~9:40) hallway visits in Round Two
- Morgan's self-defense email in Round Two
- Kevin's "You're going to regret this." in Round One
- Blackmail Cash introduction after the murder; final Blackmail reveal
- Physical evidence hunt beats per round; red folder announcement and find
- Terrace camera (late Round Two) and Molly's clearing note (Round Three)
- Black thread resolution (Round Three)
- Final Timeline uses Noor's 9:35 to 9:40
- "Twenty-five people" is computed from the roster

## Website depth (October 2026)

- Every character has a `public_role`: what everyone at the party knows.
  The guest list shows it; the checker flags one that gives a secret away.
- Physical clues have a `room`, so they appear as numbered pins on the host
  map. `content/suspicion.yaml` turns Part Two's suspicion curve into a
  heat map, and `solution_window.killer` marks the killer on the map replay.
- Guest pages show the plan of Ross's flat (see below), not the story map,
  so the study and library are never drawn back to back for guests.

## The flat (Ross's floor plan, October 2026)

Mapped in `content/venue.yaml`; hiding spots in `content/clues/*.yaml`; set
dressing in `lore.yaml` → `venue_setup`. Host panel → Setup shows it all.

| Real room | Plays |
|---|---|
| Room (12'3" × 8'8", "Side Room" on the site) | Arthur's study |
| Family Room | The East Corridor: the only way to the study door |
| Landing (top of the front stairs) | Library; its movable bookshelf is the library bookcase |
| Living Room | Drawing Room (the party); the coat rack is the Front Hall; the front door is the Library Corridor |
| Dining Area | Dining Room, set for the Supper |
| Bedroom off the Dining Area (11'7" × 8'3") | Conservatory (unlocked; nothing hidden there) |
| Kitchen | Billiard Room (the card game at the island) |
| Laundry | The kitchens, where the blackout crash comes from |
| Hall (6'1" × 5'1") | Portrait Gallery |
| Balcony | Terrace |
| Small bedroom, Primary Bedroom, closets, back stairs | Shut. In the story the small bedroom is the East Wing (Louis) and the primary bedroom is "upstairs" (Shea) |

The case map (host → Map) draws the whole story on this plan, minute by
minute. Ross (October 2026): any bedroom can be unlocked; the case map must
match the flat. The Family Room has to be the East Corridor: the study's only
ordinary door opens into it, and in the story nobody but the five study
visitors is there between 9:31 and 9:41 (Carlotta's Conservatory and the card
game moved away from the study door for that reason).

Part Two says nothing is hidden in bedrooms: the Conservatory bedroom holds
no evidence, and the checker enforces it. Ross confirmed the Room can be the
study.

**The Raven's Walk is real.** Between the landing and the Room there's a door
hidden behind a movable bookshelf on the landing side (Ross, October 2026).
So the study and the library really are back to back with a hidden door,
while the normal way between them runs through the Family Room, the Living
Room and the front door, past the whole party. The door stays shut and the
shelf stays put until the reveal, when Reggie opens it (Ross: yes). The door
is recorded only in `lore.yaml` → `venue_passage` (host-only); the guest plan
draws a plain wall there, and a test keeps it that way. Guests can still see
on their plan that the library landing backs onto the study; that's a fair
clue, and Round Two points them at the passage anyway.

## Real couples (Ross, October 2026)

Noor & Joji (married, Noor pregnant), Lindsey & Malik, Maya & Kevin. Their
characters are only ever romantic with each other, and nothing suggests
they'd stray or knocks their partner. Listed in `content/party.yaml` →
`couples`; the checker errors on any romance linking one of them to anyone
else. Single players are fair game.

What changed to get there:
- **Maya & Kevin** are now a secret couple in the story: the cook's
  granddaughter and the heir who stayed, sweethearts from one summer at the
  lake, hiding it from a family with opinions about "the help". Kevin went
  to the study at 9:20 to tell Arthur; he has a ring in his pocket. They
  text each other through the night. (Replaces Maya dating Jimmy Friedman
  and Kevin's Cannes fling with Morgan; Morgan now simply handles Kevin's
  allowance.)
- **Jimmy Friedman** courts Lexi only. His mysterious second weekly bouquet
  goes to his mother.
- **Lindsey & Malik** are a united team. Their 9:15 conservatory meeting is a
  whispered plan for midnight, not a fight (still a "secret meeting" to
  everyone else, so the suspicion curve is unchanged).
- **Joji**: Alma no longer has a crush on him; they're fellow students of
  the house.

Romances still in the story, all between characters assumed single (tell us
if any of these players are partnered): Alma & James (secret affair), Louis
& Shea (secret affair), Kush & Hannah (fling), Blake (spare) & Hannah
(fling, past), Martin & Molly (exes), Jimmy Friedman courting Lexi, Clara &
Arthur (not played).

## Saltburn layers (October 2026)

- The Blackwoods **collect people**: wards, goddaughters, protégés, staff's
  children put through school. "Once you've slept at Blackwood, you never
  really leave." (public lore; Reggie's opening uses it)
- **Silas's guest book**: everyone signs on arrival, in character; family
  names recur, outsiders appear once. New Supper rule: every guest signs the
  book. Prop by the coat rack.
- The house texts everyone through the night (the east wing, Lady
  Evangeline's portrait, the empty chair's fresh glass).

## Checked against published murder mystery games (October 2026)

Commercial kits and hosting guides (Night of Mystery, Freeform Games,
Masters of Mystery, Red Herring Games) agree on: character booklets ahead of
time, name badges, a host who paces acts and rescues dead conversation,
clues released progressively, objectives beyond "solve it", bribery and
blackmail, pacing anchored to food courses, music and lighting, and awards
at the end. We had most of it. Added:

- **Lighting plan** (`content/lights.yaml`): Alexa groups per room and one
  routine per scene, cued in the run of show and on the dashboard. The
  blackout rolls room by room (dining room first, as Tim says) with thunder,
  then returns with the study glowing red. Fire routines from the app, not
  by voice. Stairs and bathroom stay on ordinary switches.
- **Now / Next** on the dashboard: one step of the run of show at a time.
- **Suggested schedule** by food course (`party.yaml` → `schedule`).
- **Name badges** and **award certificates** (`party.yaml` → `awards`).
- **The midnight photograph** and signing out of the guest book.

## The look (October 2026)

Saltburn-style theming, CSS only, on the existing night palette so every
diagram still matches: a faint gold damask wallpaper behind everything, a
candlelit vignette, gilt (gold-leaf) headings, an engraved inner frame on
every card, a slow candle glow on each guest's crest and on the login raven,
wax seals on sealed envelopes, and "Blackwood Manor · The Midnight Supper" /
"You are expected" lines like an invitation. Motion stops for anyone who
prefers reduced motion. The host dashboard opens with "Getting ready" (before
the party) and "Now / Next" (during it).

## Still worth confirming with Ross

- Savanah's "Jimmy": James Calloway's player (assumed) or Jimmy Friedman?
- Who else does Courtney know? Add ties to `content/characters/courtney.yaml`.
- Is the landing roomy enough to search? Only the red folder is found there.
- Any other real couples in the cast? Real couples make the best pairings.
