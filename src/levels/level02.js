// Level 2 — Bathroom (owner: B). Design v4. Solver-checked.
// Teaches: a plate on one side opens a door on the other, only while held.
LEVELS.push({
  number: 2, name: "Bathroom", act: 1,
  instructions: "A plate opens its door while someone stands on it, even across the glass.",
  map: [
    "#######|#######",
    "#..T..#|#...#O#",
    "#.#...#|##D..A#",
    "#a....#|#.....#",
    "#H....#|#.....#",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "text", words: "I'M SORRY", side: "right", mirrored: true}
  ],
  solution: "D D L L U U D R R R R D L D"   // 14 moves, shortest
});
