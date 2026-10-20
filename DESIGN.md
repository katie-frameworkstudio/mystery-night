# Mystery Night: design notes

**Last updated:** 2026-10-20: first pass for the Build, Ship, Shape hackathon entry.

The master rules live in `~/Developer/katieOpsDaily/rules/DESIGN-RULES.md` and GBR PART 0 (see `GLOBAL-BUILD-RULES.md` here). This file holds only this project's own values and its logged exceptions.

## What the screen is for
A party game shown on one shared screen (a TV, a laptop on the counter, a phone passed around for secret roles). Everything is read from across a room, one screen at a time, and the Inspector speaks.

## Values
| Token | Value | Use |
|---|---|---|
| `--bg` | `#1b1410` | the ground (a dark living-room canvas; see exception 1) |
| `--panel` | `#27201a` | cards, one tone up from the ground (B-2) |
| `--panel-2` | `#332a22` | a box inside a card, one more tone up (B-2) |
| `--ink` | `#f3e9da` | all reading text, full strength (C-6) |
| `--label` | `#d4c4ab` | kicker labels only, 8.6:1 on the ground |
| `--accent` | `#c8502e` | the one action on the screen, picked states |
| `--gold` | `#e0ad45` | the Inspector's name, evidence, the clock, the wordmark |
| Display | Alfa Slab One | headings, the clock, suspect names (see exception 2) |
| Body | Source Serif 4 | everything else, 17px phone, 18px tablet, 20px from 1280px, 23px from 1800px (TV) |
| Spacing | 8px unit | every gap and padding is a multiple |
| Radius | 10px cards and controls, 6px for an inner box | |
| Shadow | none on surfaces; one soft shadow on the Alexa+ dropdown (an overlay) | L-5 |
| Motion | 180ms ease-out on the switch; the thinking dots; both off under reduced motion | AN-1, AN-2 |

## Motif
The dashed gold "evidence" box is the one repeated motif: it carries every clue on every screen, and nothing else uses a dashed border.

## Exceptions logged for Katie's ruling (not yet approved)
1. **Dark ground (C-1, C-9).** The taste-test artifact Katie staged Oct 3 ran dark ("county fair at night") and the game is played on a TV in a dim room. Kept as the established ground of an existing app. Flip to light would be a one-token change.
2. **Fonts (T-1).** Alfa Slab One and Source Serif 4 came from the staged artifact and are not on the pre-approved list. Kept so the entry matches what Katie saw; swap needs her pick.
3. **No photograph (I-1, GBR PART 0 #16).** The game has no real people or work to photograph yet; there is no empty image slot (I-2). A photo of a table mid-game would belong on a future landing page, not inside the play screens.

## Width sweep
Checked at 375, 600, 768, 900, 1024 and 1440 on Oct 20, 2026 (lobby goes two-column at 768; the round screen at 900; name inputs pair up at 420 and again at 1024).
