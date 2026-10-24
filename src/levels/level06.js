// Level 6 — Cellar (Person B). Design v3 format.
// Teaches Look. The reflection waves as the level opens. When it reaches the
// corner by its shaft (x 2, y 2), it shimmers: on the next move it will slip
// Up into the alcove instead of mirroring Theo.
//   With Look (Space): both freeze, no crack.            R R LOOK R D D
//   Letting it happen: +1 crack, +1 Mercy, one extra move. R R R D D D
LEVELS.push({
  number: 6, name: "Cellar", act: 2, look: true,
  map: [
    "#######|#######",
    "#######|##.####",
    "#T....#|##..R.#",
    "####.##|##.####",
    "####G##|##G####",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "wave" },
    { at: { who: "reflection", x: 2, y: 2 }, do: "disobey", dir: "U", kind: "stoppable", warn: true }
  ],
  solution: "R R LOOK R D D"
});