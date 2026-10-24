// Level 1 — Hallway (Person B). Design v3 format.
LEVELS.push({
  number: 1, name: "Hallway", act: 1,
  map: [
    "#######|#######",
    "#T...G#|#G..R.#",
    "#######|#######"
  ],
  events: [ { at: "start", do: "blink" } ],
  solution: "R R R R"
});
