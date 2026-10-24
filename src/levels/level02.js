// Level 2 — Bathroom (Person B). Team change: full-opposite mirror.
// Teaches: a plate on one side opens a door on the other.
// The reflection now flips Up/Down too, so the mirror room is drawn upside-down.
// Theo's door (A) is shut. Only the reflection can reach plate a, and only by
// moving Down onto it (Theo presses Up and bumps the wall above him). Hold the
// plate, then press Down together: Theo slips through the door before it closes,
// and the reflection rises to its goal.
LEVELS.push({
  number: 2, name: "Bathroom", act: 1,
  map: [
    "#######|#######",
    "#######|#######",
    "#T....#|###G###",
    "###A###|#....R#",
    "###G###|###a###",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "hint", words: "Somewhere, a weight could open a door." },
    // Mara's first message, the moment the puzzle is cracked (reflection on the plate).
    { at: { who: "reflection", x: 3, y: 4 }, do: "text", words: "I'M SORRY", side: "right", mirrored: true }
  ],
  solution: "R R U D D"
});