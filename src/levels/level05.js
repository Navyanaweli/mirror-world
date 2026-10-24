// Level 5 — Kitchen (owner: A). Design v4. Solver-checked.
// Two cracks: through the glass and back again.
LEVELS.push({
  number: 5, name: "Kitchen", act: 2,
  instructions: "Two cracks: through the glass, and back again.",
  map: [
    "#######|#######",
    "#.^#..#|#....D#",
    "#.%...#|#...%.#",
    "#.T^..#|#.....#",
    "#..H..#|#.^O.##",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "text", words: "IT HAS TO BE SOMEONE", side: "right", mirrored: true}
  ],
  solution: "U U R R D D U L R R U L L D D D L"   // 17 moves, shortest
});
