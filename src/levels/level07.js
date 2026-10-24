// Level 7 — Library (Person A). Design v3 format + full-opposite mirror.
// The mirror room is drawn upside-down, because the reflection now flips Up/Down too.
// Two warned disobeys on glitch tiles: stop the first, let the second happen.
// 1st (stoppable): the reflection steps back Right. Look stops it; letting it
//    happen also works (+1 crack, +1 Mercy) because Theo just waits at the door.
// 2nd (required): the reflection tilts toward plate a, then rises onto it.
//    Theo can never go Down (spikes), so this is the only way to open door A.
//    Looking at it makes the level unfinishable; RESTART then hints "Maybe let it."
// A short slip as Theo reaches his goal: for 2 turns the keys move Mara
// (Down off the plate, Left toward her goal).
//   With Look:      R LOOK R R R R D L R   (1 crack)
//   Letting it go:  R R R R R R R D L R    (2 cracks, 1 Mercy)
LEVELS.push({
  number: 7, name: "Library", act: 2, look: true,
  map: [
    "#######|#######",
    "#T..AG#|###a###",
    "#^^^^^#|#G...R#",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "text", words: "IT HAS TO BE SOMEONE", side: "right", mirrored: true },
    { at: "start", do: "hint", words: "Not every crack is a mistake." },
    { at: { who: "reflection", x: 4, y: 2 }, do: "disobey", dir: "R", kind: "stoppable", warn: true },
    { at: { who: "reflection", x: 3, y: 2 }, do: "tilt" },
    { at: { who: "reflection", x: 3, y: 2 }, do: "disobey", dir: "U", kind: "required", warn: true },
    { at: { who: "person", x: 5, y: 1 }, do: "slip", turns: 2 },
    { at: { who: "person", x: 5, y: 1 }, do: "hint", words: "Mara leads now. Guide Mara home." }
  ],
  solution: "R LOOK R R R R D L R",
  instructions: "Two crack tiles. When the glass shimmers, the arrow shows where the reflection will glitch next move. Stop the first with Space (or let it happen: it costs a crack). Do NOT stop the second: it pulls the reflection up onto the plate that opens your door. Never press Down: spikes. Push Right into the closed door until it opens, then walk through. When the slip starts, your keys move the reflection for 2 turns: press Down, then Left, then Right to finish."
});
