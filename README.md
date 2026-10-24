# Aaina

*Aaina* (आईना) is Hindi and Urdu for **mirror**.

A short puzzle game about reversal. You control a body in a real room while its reflection moves in the room behind the glass, always the opposite way. Over 8 levels the roles slowly turn around, until you are the reflection.

> **Judges, in a hurry?** See [Quick look for judges](#quick-look-for-judges): every level has a **Skip level** button, and there's a [cheat sheet](#cheat-sheet-shortest-solutions) of the shortest solutions.

---

## Contents

- [Quick look for judges](#quick-look-for-judges)
- [How to run it](#how-to-run-it)
- [How to play](#how-to-play)
- [Reversal, everywhere](#reversal-everywhere)
- [The story](#the-story)
- [The 8 levels](#the-8-levels)
- [Cheat sheet (shortest solutions)](#cheat-sheet-shortest-solutions)
- [How it's built](#how-its-built)
- [Project layout](#project-layout)
- [Testing](#testing)
- [Team](#team)

---

## Quick look for judges

1. Start the game (see [How to run it](#how-to-run-it)) and choose **Start**.
2. Press **Enter** to move through the story cards.
3. On any level, skip ahead with either of these:
   - click **Skip level ▸** in the top-right corner, or press **N**
   - press **Esc**, then choose **Skip level**

   Skipping keeps the story in order: the act cards and the scene after Level 6 still play.
4. Level 8 has no skip, because its three endings are the point. The quickest is **Take Their Place**: `→ → → ↑ ↑ ↑`.
5. To see a level actually solved, type its moves from the [cheat sheet](#cheat-sheet-shortest-solutions).

From the title to Level 8 by skipping takes under a minute.

---

## How to run it

Aaina is plain HTML and JavaScript. There's nothing to install or build, but the browser has to load it from a local web server: opening `index.html` straight from the folder (`file://`) won't load the images and sounds.

**Option 1, VS Code:** install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

**Option 2, Python:** in the project folder, run

```bash
python -m http.server 8000
```

then open <http://localhost:8000> in Chrome, Edge or Firefox.

An internet connection is needed the first time, because the Phaser game engine is loaded from a CDN (jsDelivr).

---

## How to play

### Controls

| Key | What it does |
|---|---|
| Arrow keys or WASD | Move |
| Z | Undo one move |
| R | Restart the level |
| M | Mute or unmute |
| Esc or P | Pause menu: resume, restart, skip, volume, sound, quit to title |
| N | Skip to the next level (not on Level 8) |
| Enter | Continue on story cards and menus |

Undo and restart still work after you step on spikes, during the short pause before the level resets.

### The rules

The whole game is seven rules.

1. **Your keys move you. The other body moves the opposite way.** Press Right and it goes left; press Up and it goes down.
2. **Walls and closed doors block each body separately.** A blocked body stays put while the other still moves. This is how you line the two of you up.
3. **Plates open doors.** A door is open while anyone stands on its plate, even from across the glass, or while someone stands in the doorway. A door never closes on someone.
4. **Spikes:** if either body steps on spikes, the level resets.
5. **Cracks:** if either body steps on a crack, the two of you **swap places through the glass**. Each crack works once.
6. **Win:** you on your goal (warm) and the other body on theirs (silver), at the same time.
7. **The final room** has three endings: step on the crack, both stand on the mirror frames, or both reach your goals.

One rule of the world: each room only ever holds one body. A swap moves both, so you and your reflection are never in the same room.

---

## Reversal, everywhere

The theme isn't only the movement rule. We tried to put reversal into every layer of the game.

| Where | How it reverses |
|---|---|
| **Movement** | Every key moves the other body the opposite way, left–right *and* up–down. Each puzzle is about using that reversal, mostly by letting a wall stop one body while the other keeps going. |
| **Character names** | Each pair are mirror images of each other, spelled backwards: **Leon ↔ Noel** (L-e-o-n → n-o-e-L). In the next game, Ivan (who moved in years later) becomes the hero, and his mirror person is **Navi**: **Ivan ↔ Navi** (I-v-a-n → n-a-v-I). |
| **Who is the reflection** | Act 1: you're in the real room and the reflection copies you. Act 2: cracks pull you through the glass. Act 3: you start *behind* the glass, and now the real world (Ivan) is the one that copies you. |
| **Whose goal is where** | From Level 4, your goal is on the *other* side of the glass, so you have to cross to finish. |
| **Cracks** | Swap the two bodies through the mirror: the person becomes the reflection and the reflection becomes the person. |
| **Writing on the glass** | Messages appear mirrored (flipped left-to-right), like writing seen from the other side: *I'M SORRY*, *LET ME OUT*, *IT HAS TO BE SOMEONE*. In Act 3 the messages come from the real side and you read them backwards from behind the glass: *IS SOMEONE THERE?* |
| **Colour** | You start in full colour and fade toward grey through Act 2, while the reflection grows brighter. By Act 3 you are the faded one. |
| **The turning point** | After Level 6, *TOGETHER* fades onto the glass, Noel walks out into the real world, and Leon is left behind it. |
| **The endings** | The easy way out is the selfish one: *Take Their Place* swaps you out and traps Ivan, so the cycle repeats. The true ending takes the most care. |
| **The cycle** | After any ending the title offers **New Game — Ivan**. The newcomer from game 1 now lives the story himself, with his own mirror person, Navi, and years later it is Leon who moves in. The two games are mirror images of each other. |
| **Title** | The name *Aaina* is drawn with its own reflection beneath it, split down the middle by the mirror seam. |
| **The puzzles themselves** | Every level was checked by a solver: each one has a real solution, and mashing keys won't solve it. |

---

## The story

Mysterious and bittersweet, never scary.

Leon moves into a house that's cheap because no one ever stays. In the hallway hangs an old mirror no one ever took down. At first his reflection simply does what he does, only backwards. Then the glass begins to crack, and the cracks pull him through. Behind the glass is Noel, who has been waiting a very long time.

| Act | Levels | What happens |
|---|---|---|
| **One — Obey** | 1–3 | You're in the real room. The reflection does the opposite of you. *"I'm in control; it just follows."* |
| **Two — Slip** | 4–6 | Cracks pull you through the glass: across in Level 4, across and back in Level 5, and across for good in Level 6. *"The mirror is pulling me in."* |
| **The swap** | after 6 | *TOGETHER* fades on the glass. Noel walks free; Leon is trapped. |
| **Three — Behind the Glass** | 7–8 | Years later, Ivan lives here. You start in the mirror room, and Ivan does the opposite of you. *"Now I'm the reflection."* |

### The three endings (Level 8)

| Ending | How | Moves | What it means |
|---|---|---|---|
| **Take Their Place** | Step on the crack | 6 (easiest) | Leon escapes and Ivan is trapped. The mirror waits for the next one, and the cycle repeats. |
| **Stay Behind** | Leon and Ivan each on their own goal | 12 | Leon stays a reflection so Ivan can live a normal life. |
| **Break It Together** (true ending) | Both stand on the mirror frames at once | 18 (hardest) | The mirror shatters and no one is left behind the glass. |

---

## The 8 levels

| # | Room | What it teaches | Story moment |
|---|---|---|---|
| 1 | Hallway | The other body moves the opposite way; use a wall to stop one of you. | The reflection blinks |
| 2 | Bathroom | A plate opens its door while someone stands on it, even across the glass. | *I'M SORRY* |
| 3 | Bedroom | A safe step for you can be deadly for the other. Watch both rooms. | The reflection waves |
| 4 | Study | The first crack. Your goal is behind the glass, so you must cross. | *LET ME OUT* |
| 5 | Kitchen | Two cracks: through the glass, and back again. | *IT HAS TO BE SOMEONE* |
| 6 | Attic | Plate, door and crack together. This time you don't come back. | The reflection tilts its head |
| 7 | Cellar, years later | You start behind the glass; Ivan copies you the opposite way. | *IS SOMEONE THERE?* … *COME UPSTAIRS* |
| 8 | Attic, years later | The final choice. | *I CAN SEE YOU* |

---

## Cheat sheet (shortest solutions)

<details>
<summary>Spoilers: click to show the moves for every level</summary>

Start each level from its opening position (press **R** to restart if you've already moved). Press **Z** to undo a slip.

| Level | Moves |
|---|---|
| 1 Hallway | ← ← ↓ → ↓ → → ↑ → |
| 2 Bathroom | ↓ ↓ ← ← ↑ ↑ ↓ → → → → ↓ ← ↓ |
| 3 Bedroom | → → → → ← ↓ ↓ → ↓ ← ← ↑ ← ↑ ↑ |
| 4 Study | ↑ ↑ ← ↑ ↑ → ↑ ← ← ← ← → ↓ ↓ |
| 5 Kitchen | ↑ ↑ → → ↓ ↓ ↑ ← → → ↑ ← ← ↓ ↓ ↓ ← |
| 6 Attic | ↓ ← ↓ ↑ → → ↓ ↓ ↓ ← ← ← ↓ ← ↓ ↓ ← |
| 7 Cellar | ↓ ← ↑ ↑ → ↑ ← ← → → ↓ ← ← ← ↓ ↑ ↑ |

**Level 8: pick an ending**

| Ending | Moves |
|---|---|
| Take Their Place (quickest) | → → → ↑ ↑ ↑ |
| Stay Behind | ↓ → ↑ → → ↓ ← ← ← ← ↑ → |
| Break It Together (true ending) | ↓ → ↑ → → ↓ ← ← ← ↑ ← ← ↓ → → → ↑ → |

Every one of these is the shortest solution found by our solver, and each is tested in the game.

</details>

---

## How it's built

- **Phaser 3.90** and plain JavaScript: no frameworks, no build step.
- The code is split into three parts that only talk through small, fixed interfaces, so three people could work on them at the same time:

| Part | File | Job |
|---|---|---|
| **Rules** | `src/rules.js` | All game logic, with no graphics. `Rules.load(level)` gives a state; `Rules.step(state, input)` returns the next state and a list of events (`move`, `blocked`, `swap`, `door`, `fail`, `text`, `moment`, `win`, `ending`, `undo`, `restart`). `step` never changes the state it's given, which makes undo simple. |
| **Screens** | `src/game.js` | Title, story cards, level screen, pause menu and game flow. Draws the state and plays each event as an animation. |
| **Look & sound** | `src/effects.js` | Light, dust, film grain, the mirror's shimmer, swap and glass-break effects, the colour fade, music and voice lines. Everything is optional: a missing file never crashes the game. |

- **Levels** are small data files (`src/levels/level01.js` to `level08.js`). Each map is a text grid, real room on the left of `|` and mirror room on the right:

```
#######|#######      #  wall           a  plate      %  crack
#..T.H#|#.#...#      .  floor          A  its door   F  mirror frame
##....#|#.D...#      T  you            ^  spikes
#.....#|#.O...#      O  the other      H  your goal  D  their goal
##....#|##....#
#######|#######
```

- **Story text** lives in `src/story.js`. The character names are filled in as each card is shown, from the `NAMES` list at the top of that file, so each playthrough can use different names.

---

## Project layout

```
index.html            the game
rules-test.html       rules test page (no graphics): play any level as text, or check every solution
effects-test.html     effects test page: try each visual and sound effect on its own
src/
  rules.js            game rules
  game.js             screens and game flow
  effects.js          look and sound
  story.js            story cards and character names
  levels.js           the shared LEVELS list
  levels/level01–08   the 8 levels (level09–12 are empty placeholders)
assets/
  images/             characters, tiles, title art
  sounds/             effects, music and whispered voice lines
docs/                 design documents (PDF)
```

---

## Testing

- **`rules-test.html`** (open it through the local server): click **Check all levels**. Every line should say **PASS**: 7 levels plus 3 endings for Level 8. You can also play any level as text, or paste moves into **Replay**.
- **`effects-test.html`**: press **Setup**, then try each button (Swap, Glass break, moments, win) to check the effects on their own.
- We also played the full game start to finish in an automated browser: all 8 levels with their solutions, all three endings, undo and restart, spikes, the swap scene, skipping, and both sets of character names.

---

## Team

| Name | Person | Role |
|---|---|---|
| **Aryendra Pratap Singh** | A | Logic & levels: the rules, the solver-checked puzzles, story text |
| **Navya Naweli** | B | Screens & story: the title, story cards, level screen, menus and game flow |
| **Kamakshi Borgohain** | C | Look & sound: art, light, effects, music and voice lines |

Made with [Phaser](https://phaser.io).
