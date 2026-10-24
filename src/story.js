// All story text (design v4). Mysterious and bittersweet, never scary.
// Use \n for new lines. Every field from the contract (plus "together").
// {theo}, {mara} and {sam} are filled in by game.js with the names for this playthrough.
//   theo: you        mara: your mirror person        sam: who moves in years later (Act 3)

// The first game is Leon and Noel, and Ivan moves in years later. After any ending the
// cycle repeats: the new game ("New Game — Ivan" on the title) is Ivan and Navi,
// and years later Leon moves in. Each pair is the other's name spelled backwards.
const NAMES = [
  { theo: "Leon", mara: "Noel", sam: "Ivan" },
  { theo: "Ivan", mara: "Navi", sam: "Leon" }
];

const STORY = {
  intro:
    "The house was cheap because no one ever stayed.\n" +
    "{theo} stayed.\n" +
    "In the hallway hangs an old mirror\n" +
    "that no one ever took down.",

  act1:
    "ACT ONE — OBEY\n\n" +
    "Your reflection does what you do.\n" +
    "Only backwards.",

  act2:
    "ACT TWO — SLIP\n\n" +
    "The glass has started to crack.\n" +
    "Step on a crack, and it pulls you through.",

  swap:
    "In the morning, someone wakes in {theo}'s bed.\n" +
    "{mara} touches her face. It is warm.\n" +
    "She walks out into the light.\n" +
    "Behind the glass, {theo} cannot follow.",

  together: "TOGETHER",

  act3:
    "ACT THREE — BEHIND THE GLASS\n\n" +
    "Years later, someone new lives here.\n" +
    "From behind the glass,\n" +
    "the real world is the one that copies you.",

  endingTake:
    "TAKE THEIR PLACE\n\n" +
    "The glass gives way, and {theo} steps out into the morning.\n" +
    "Behind him, {sam}'s reflection stops moving on its own.\n" +
    "The mirror waits for the next one.",

  endingStay:
    "STAY BEHIND\n\n" +
    "{theo} lets the night pass.\n" +
    "{sam} sleeps safely, and never knows.\n" +
    "In the glass, someone keeps watch.",

  endingBreak:
    "BREAK IT TOGETHER\n\n" +
    "Two hands meet the frame from either side.\n" +
    "The mirror comes apart into soft light.\n" +
    "No one is left behind the glass.",

  credits:
    "AAINA\n" +
    "a game about reversal\n\n" +
    "Aryendra Pratap Singh — logic & levels\n" +
    "Navya Naweli — screens & story\n" +
    "Kamakshi Borgohain — look & sound\n\n" +
    "Thank you for playing."
};
