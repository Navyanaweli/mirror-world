// game.js (Person B). Placeholder for step B1 — the real level screen comes in step B2.
// It only proves every file loads: it shows the title and how many levels exist.
(function () {
  class PlaceholderScene extends Phaser.Scene {
    constructor() { super("Placeholder"); }

    create() {
      const levels = (typeof LEVELS !== "undefined") ? LEVELS.length : 0;
      let rulesOk = false;
      try {
        if (levels > 0 && typeof Rules !== "undefined") {
          const first = LEVELS.slice().sort((a, b) => a.number - b.number)[0];
          rulesOk = !!Rules.load(first).person;
        }
      } catch (e) {
        console.warn("Rules check failed:", e);
      }

      this.add.text(480, 230, "MIRROR WORLD", {
        fontFamily: "monospace", fontSize: "40px", color: "#EAE4D6"
      }).setOrigin(0.5);

      this.add.text(480, 300,
        "Starter files loaded · levels: " + levels + " · rules: " + (rulesOk ? "ok" : "missing"),
        { fontFamily: "monospace", fontSize: "16px", color: "#9FD6E0" }
      ).setOrigin(0.5);
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 960,
    height: 540,
    backgroundColor: "#11141C",
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [PlaceholderScene]
  });
})();
