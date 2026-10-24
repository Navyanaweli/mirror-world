// Level 1 — Hallway (Person B). Design v3 format.
LEVELS.push({
  number: 1, name: "Hallway", act: 1,
  map: [
    "#######|#######",
    "#T...G#|#G..R.#",
    "#######|#######"
  ],
  events: [ { at: "start", do: "blink" } ],
  solution: "R R R R",
  instructions: "Get both of you onto the glowing tiles at the same time. Right moves you right and your reflection left: the mirror does the opposite. Walls stop one of you while the other keeps going; use that to line you up."
});