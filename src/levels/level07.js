// Level 7 — Cellar, years later (owner: A). Design v4. Solver-checked.
// Act 3. Theo starts behind the glass; Sam does the opposite of Theo now. Theo opens the door for Sam.
LEVELS.push({
  number: 7, name: "Cellar, years later", act: 3,
  instructions: "Now you're behind the glass, and {sam} copies you the opposite way.",
  map: [
    "#######|#######",
    "#D.^..#|#H..a.#",
    "#A#...#|#.....#",
    "#..O#.#|#...T##",
    "#...^.#|#.....#",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "text", words: "IS SOMEONE THERE?", side: "left", mirrored: true},
    {at: "win", do: "text", words: "COME UPSTAIRS", side: "right", mirrored: false}
  ],
  solution: "D L U U R U L L R R D L L L D U U"   // 17 moves, shortest
});
