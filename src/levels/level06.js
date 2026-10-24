// Level 6 — Attic (owner: B). Design v4. Solver-checked.
// Act 2 finale. Theo crosses and doesn't come back. After winning, B plays the swap scene.
LEVELS.push({
  number: 6, name: "Attic", act: 2,
  instructions: "Plate, door and crack together. This time you won't come back.",
  map: [
    "#######|#######",
    "#....D#|#^^..%#",
    "#...T.#|#.#..##",
    "#.....#|#...^O#",
    "#..a#.#|#.H..A#",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "tilt"}
  ],
  solution: "D L D U R R D D D L L L D L D D L"   // 17 moves, shortest
});
