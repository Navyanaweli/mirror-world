// Level 5 — Kitchen (Person A). Design v3 format.
// Teaches lag: the reflection copies Theo's moves 2 turns late.
// Theo's first step locks Undo (IT REMEMBERS the first time Undo is refused).
// Theo can never go Up (spikes), so only Mara's unwarned disobey gets the
// reflection to the top row: the first crack, and LET ME OUT on the glass.
//   R R L R R D D   (the step back lines the lag up; Down just waits on the goal)
LEVELS.push({
  number: 5, name: "Kitchen", act: 2, lag: 2,
  map: [
    "#######|#######",
    "#^^^^^#|#G....#",
    "#T..G.#|#....R#",
    "#######|#######"
  ],
  events: [
    { at: { who: "person", x: 2, y: 2 }, do: "undoLock" },
    { at: { who: "reflection", x: 3, y: 2 }, do: "disobey", dir: "U", kind: "required", warn: false },
    { at: { who: "reflection", x: 3, y: 1 }, do: "text", words: "LET ME OUT", side: "right", mirrored: true }
  ],
  solution: "R R L R R D D"
});
