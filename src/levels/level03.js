// Level 3 — Bedroom (owner: A). Design v4. Solver-checked.
// Teaches: spikes. A safe step for Theo can be a deadly one for the reflection.
LEVELS.push({
  number: 3, name: "Bedroom", act: 1,
  instructions: "A safe step for you can be deadly for the other. Watch both rooms.",
  map: [
    "#######|#######",
    "#...H.#|#....##",
    "#.....#|#^....#",
    "#T....#|#O.^..#",
    "#...#.#|#...D.#",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "wave"}
  ],
  solution: "R R R R L D D R D L L U L U U"   // 15 moves, shortest
});
