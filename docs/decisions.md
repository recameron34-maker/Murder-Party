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
| Deploy | **GitHub only, for now** (Ross). Every push publishes a static, read-only, spoiler-full preview to GitHub Pages so he can watch progress. The real party site (logins, rounds, texts) needs Cloudflare. That deploy job is already in the workflow and stays dormant until the secrets are added, before guests get links. |
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

## Still worth confirming with Ross

- Savanah's "Jimmy": James Calloway's player (assumed) or Jimmy Friedman?
- Who else does Courtney know? Add ties to `content/characters/courtney.yaml`.
- The floor plan: map Ross's rooms to the game areas in `content/lore.yaml`
  and set real hiding spots in `content/clues/*.yaml`.
- Any other real couples in the cast? Real couples make the best pairings.
