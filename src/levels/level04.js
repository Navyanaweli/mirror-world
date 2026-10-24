// Level 4 — Study (owner: B). Design v4. Solver-checked.
// Teaches: cracks. Theo's goal is behind the glass, so he has to swap through.
LEVELS.push({
  number: 4, name: "Study", act: 2,
  map: [
    "#######|#######",
    "#D....#|#.....#",
    "#..%..#|#...^O#",
    "#..#..#|##H...#",
    "#...T.#|#.....#",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "text", words: "LET ME OUT", side: "right", mirrored: true}
  ],
  solution: "U U L U U R U L L L L R D D"   // 14 moves, shortest
});
