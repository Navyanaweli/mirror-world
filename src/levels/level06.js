// Level 6 — Cellar (Person B). Team change: full-opposite mirror.
// Teaches Look. The reflection now flips Up/Down too, so the mirror room is drawn
// upside-down. The reflection waves as the level opens. When it reaches the
// corner by its shaft (x 2, y 3), it shimmers: on the next move it will slip
// Down into the alcove instead of mirroring Theo. A glitch mark shows that tile.
//   With Look (Space): both freeze, no crack.             R R LOOK R D D
//   Letting it happen: +1 crack, +1 Mercy, one extra move. R R R D D D
LEVELS.push({
  number: 6, name: "Cellar", act: 2, look: true,
  map: [
    "#######|#######",
    "#######|##G####",
    "#T....#|##.####",
    "####.##|##..R.#",
    "####G##|##.####",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "wave" },
    { at: "start", do: "hint", words: "When the glass shimmers, hold its gaze. (Space)" },
    { at: { who: "reflection", x: 2, y: 3 }, do: "disobey", dir: "D", kind: "stoppable", warn: true }
  ],
  solution: "R R LOOK R D D",
  instructions: "Look unlocked. When the glass shimmers, the arrow shows where the reflection will glitch on your next move. Press Space to stare and stop it (no crack), or let it happen (1 crack, still solvable). Walk Right until you're above the gap, then go Down twice."
});