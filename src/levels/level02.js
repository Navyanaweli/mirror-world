// Level 2 — Bathroom (Person B). Design v3 format.
// Teaches: a plate on one side opens a door on the other.
// Theo's door (A) is shut. Only the reflection can reach plate a, and only by
// moving Up while Theo bumps the wall above him. Hold the plate, then go Down
// together: Theo slips through the door before it closes.
LEVELS.push({
  number: 2, name: "Bathroom", act: 1,
  map: [
    "#######|#######",
    "#######|###a###",
    "#T....#|#....R#",
    "###A###|###G###",
    "###G###|#######",
    "#######|#######"
  ],
  events: [
    // Mara's first message, the moment the puzzle is cracked (reflection on the plate).
    { at: { who: "reflection", x: 3, y: 1 }, do: "text", words: "I'M SORRY", side: "right", mirrored: true }
  ],
  solution: "R R U D D"
});