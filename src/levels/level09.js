// Level 9 — Kitchen, years later (Person A). Design v3 format.
// Level 5's room, aged. Sam (left) walks Level 5's solution. Theo (right) is the
// reflection now: Space Follow, Shift Resist, Arrow Break. 2 Will.
// Theo needs both Will: a Break Up at the spot where Mara disobeyed (x 3, y 2),
// then a Resist so he doesn't walk past the goal. Sam looks on turn 4, between them.
// Reaching the goal leaves COME UPSTAIRS for Sam.
//   FOLLOW FOLLOW U FOLLOW RESIST FOLLOW FOLLOW
LEVELS.push({
  number: 9, name: "Kitchen, years later", act: 3, will: 2, controlCard: true,
  map: [
    "#######|#######",
    "#^^^^^#|#.G...#",
    "#T....#|###..R#",
    "#######|#######"
  ],
  samRoute: "R R L R R D D",
  samLooks: [4],
  message: "COME UPSTAIRS",
  events: [],
  solution: "FOLLOW FOLLOW U FOLLOW RESIST FOLLOW FOLLOW"
});
