// Level 8 — Attic, years later (owner: A). Design v4. Solver-checked.
// Final room. Crack = Take Their Place, goals = Stay Behind, both on frames = Break It Together.
LEVELS.push({
  number: 8, name: "Attic, years later", act: 3, final: true,
  map: [
    "#######|#######",
    "##.#..#|#..#%^#",
    "#D.FO.#|#.H^.F#",
    "#.^...#|#.....#",
    "#.....#|#.T..##",
    "#######|#######"
  ],
  events: [
    {at: "start", do: "text", words: "I CAN SEE YOU", side: "left", mirrored: true}
  ],
  solutions: {
    take: "R R R U U U",    // 6 moves
    stay: "D R U R R D L L L L U R",    // 12 moves
    break: "D R U R R D L L L U L L D R R R U R"    // 18 moves, the true ending
  }
});
