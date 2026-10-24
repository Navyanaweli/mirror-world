// Level 9 — Kitchen, years later (Person A). Design v3 format + full-opposite mirror.
// Level 5's room, aged (the mirror room is drawn upside-down, as in Level 5).
// Sam (left) walks Level 5's solution. Theo (right) is the reflection now:
// Space Follow, Shift Resist, Arrow Break. 2 Will.
// Theo needs both Will: a Break Down at the spot where Mara disobeyed (x 3, y 1),
// then a Resist so he doesn't walk past the goal. Sam looks on turn 4, between them.
// Reaching the goal leaves COME UPSTAIRS for Sam.
//   FOLLOW FOLLOW D FOLLOW RESIST FOLLOW FOLLOW
LEVELS.push({
  number: 9, name: "Kitchen, years later", act: 3, will: 2, controlCard: true,
  map: [
    "#######|#######",
    "#^^^^^#|###..R#",
    "#T....#|#.G...#",
    "#######|#######"
  ],
  samRoute: "R R L R R D D",
  samLooks: [4],
  message: "COME UPSTAIRS",
  events: [
    { at: "start", do: "hint", words: "Where she once slipped free, I can too." }
  ],
  solution: "FOLLOW FOLLOW D FOLLOW RESIST FOLLOW FOLLOW",
  instructions: "You are Theo now, inside the mirror. Sam walks a set path. Space = Follow her, Shift = Resist (stay still), Arrow = Break (move your own way). Resist and Break cost 1 Will each: you have 2. Never disobey while the eye shows. Break Down at the spot where Mara once broke free (third move), then Resist once so you stop on your glowing tile."
});
