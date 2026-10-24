// Level 1 — Hallway (owner: B). Design v4. Solver-checked.
// Teaches: the reflection moves the opposite way; use a wall to stop one body.
LEVELS.push({
  number: 1, name: "Hallway", act: 1,
  map: [
    "#######|#######",
    "#..T.H#|#.#...#",
    "##....#|#.D...#",
    "#.....#|#.O...#",
    "##....#|##....#",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "blink"}
  ],
  solution: "L L D R D R R U R"   // 9 moves, shortest
});
