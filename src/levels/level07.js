// Level 7 — Library (Person A). Design v3 format.
// Two warned disobeys: stop the first, let the second happen.
// 1st (stoppable): the reflection steps back Right. Look stops it; letting it
//    happen also works (+1 crack, +1 Mercy) because Theo just waits at the door.
// 2nd (required): the reflection tilts toward plate a, then drops onto it.
//    Theo can never go Down (spikes), so this is the only way to open door A.
//    Looking at it makes the level unfinishable; RESTART then hints "Maybe let it."
// A short slip as Theo reaches his goal: for 2 turns the keys move Mara.
//   With Look:      R LOOK R R R R U L R   (1 crack)
//   Letting it go:  R R R R R R R U L R    (2 cracks, 1 Mercy)
LEVELS.push({
  number: 7, name: "Library", act: 2, look: true,
  map: [
    "#######|#######",
    "#T..AG#|#G...R#",
    "#^^^^^#|###a###",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "text", words: "IT HAS TO BE SOMEONE", side: "right", mirrored: true },
    { at: { who: "reflection", x: 4, y: 1 }, do: "disobey", dir: "R", kind: "stoppable", warn: true },
    { at: { who: "reflection", x: 3, y: 1 }, do: "tilt" },
    { at: { who: "reflection", x: 3, y: 1 }, do: "disobey", dir: "D", kind: "required", warn: true },
    { at: { who: "person", x: 5, y: 1 }, do: "slip", turns: 2 }
  ],
  solution: "R LOOK R R R R U L R"
});
