// Level 5 — Kitchen (Person A). Design v3 format + full-opposite mirror.
// The mirror room is drawn upside-down, because the reflection now flips Up/Down too.
// Teaches lag: the reflection copies Theo's moves 2 turns late.
// Theo's first step locks Undo (IT REMEMBERS the first time Undo is refused).
// Theo can never go Up (spikes), so only Mara's unwarned disobey (a glitch tile)
// drops the reflection to the bottom row: the first crack, and LET ME OUT on the glass.
//   R R L R R D D   (the step back lines the lag up; Down just waits on the goal)
LEVELS.push({
  number: 5, name: "Kitchen", act: 2, lag: 2,
  map: [
    "#######|#######",
    "#^^^^^#|#....R#",
    "#T..G.#|#G....#",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "hint", words: "The glass is slow tonight. It copies me two steps late." },
    { at: { who: "person", x: 2, y: 2 }, do: "undoLock" },
    { at: { who: "reflection", x: 3, y: 1 }, do: "disobey", dir: "D", kind: "required", warn: false },
    { at: { who: "reflection", x: 3, y: 2 }, do: "text", words: "LET ME OUT", side: "right", mirrored: true }
  ],
  solution: "R R L R R D D",
  instructions: "Your reflection now copies you 2 moves late. Never press Up: spikes. Walk right toward your glowing tile; if it arrives one step off, step back once (Left). Press Down to wait in place (you bump the wall) while it catches up. The crack tile in the glass pulls it down on its own: that's how it reaches its goal. Undo stops working after your first step."
});
