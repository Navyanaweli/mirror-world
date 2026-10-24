// Level 12 — Attic, years later (Person A). Design v3 format + full-opposite mirror.
// The final room. 5 Will, glass unbroken. Sam (left) crosses the attic and touches
// the frame on turn 7 (the glowing footprint). Theo (right) starts away from his frame.
// Just following never brings Theo to it; reaching it on turn 7 takes 3 or 4 Will:
// slip Down into the gap between the shelves, wait while Sam passes (Sam looks on
// turn 3), then Down and Right to the frame as Sam reaches hers.
//   break: D FOLLOW FOLLOW FOLLOW D R FOLLOW              (3 Will) Break It Together
//   take:  RESIST RESIST FOLLOW RESIST RESIST RESIST      (5 Will) Take Their Place
//   stay:  FOLLOW x9                                      (0 Will) Stay Behind
// Spending 1-4 Will without the frame: NOT TONIGHT and the room restarts.
// Rules add: ONE MORE + strain at 4 cracks, "Sam is about to leave..." on turn 8,
// and TOGETHER on turn 6 when Mercy is 1 or more.
LEVELS.push({
  number: 12, name: "Attic, years later", act: 3, will: 5, final: true,
  map: [
    "#######|#######",
    "#T....#|#..R..#",
    "#####.#|#.#.#.#",
    "#...F.#|#....F#",
    "#######|#######"
  ],
  samRoute: "R R R R D D L L L",
  samLooks: [3],
  frameTurn: 7,
  events: [
    { at: "start", do: "text", words: "IS SOMEONE THERE?", side: "left", mirrored: true },
    { at: "start", do: "hint", words: "The glowing footprint... the frame. If only I were there too." }
  ],
  solutions: {
    take: "RESIST RESIST FOLLOW RESIST RESIST RESIST",
    break: "D FOLLOW FOLLOW FOLLOW D R FOLLOW",
    stay: "FOLLOW FOLLOW FOLLOW FOLLOW FOLLOW FOLLOW FOLLOW FOLLOW FOLLOW"
  },
  instructions: "The final choice. 5 Will. The footprints show Sam's next steps; the glowing one is when Sam touches the frame. Follow every turn: you stay behind and Sam is safe. Spend all 5 Will: you take Sam's place. Or reach your own frame (bottom right) at the same moment Sam touches theirs: you break it together. Slip Down into the gap first, wait there while the eye shows, then go Down and Right."
});
