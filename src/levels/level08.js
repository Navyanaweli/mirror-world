// Level 8 — Attic (Person A). Design v3 format + full-opposite mirror.
// The mirror room is drawn upside-down, because the reflection now flips Up/Down too.
// Everything at once, no disobeys: Mara has stopped fighting.
// Both goals sit beside the mirror. Each side holds the other's door open:
//   1. Theo bumps the wall at the end of the corridor so the reflection
//      reaches plate a, which opens Theo's door A.
//   2. Theo walks through onto plate b, which opens the reflection's door B.
//   3. The reflection climbs to its goal while Theo waits on b, then Theo
//      steps onto his goal.
// Spikes under the corridor punish stepping Down too early.
// Winning smashes the glass: glassBreak, then swap. (v3: B shows TOGETHER in the
// swap scene, so there's no text event here.)
//   U R R R R D D D D R
LEVELS.push({
  number: 8, name: "Attic", act: 2, look: true, swap: true,
  map: [
    "#######|#######",
    "#....##|#G#####",
    "#T^^A##|#B###R#",
    "####bG#|#a....#",
    "#######|#######"
  ],
  events: [
    { at: "start", do: "hint", words: "One of us holds the door. The other walks through." }
  ],
  solution: "U R R R R D D D D R"
});
