// game.js (Person B) — level screen, title, story cards and game flow.
// Talks to A only through Rules.load / Rules.step, and to C only through Effects.*
// Design v3 + art change: images are 128x128 files drawn at 64 px with setDisplaySize,
// smooth (not pixel art). Each half is a rounded "screen" with a soft shadow,
// and a glowing seam runs down the 32 px mirror strip.

(function () {
  const W = 960, H = 540;
  const TILE = 64;          // every image is drawn 64x64 on screen, whatever its file size
  const TEX = 128;          // size of the fallback textures made in code
  const RADIUS = 18;        // corner radius of each room's "screen"
  const UI_FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
  const STORY_FONT = "Georgia, 'Times New Roman', serif";
  const STRIP = 32;         // mirror strip width on screen
  const BAR = 40;           // top and bottom bar height
  const SLIDE_MS = 120;

  // Art change palette. "silver" is the cool colour (shimmer, cracks, misty messages).
  const COLORS = {
    bg: 0x141526, bgCss: "#141526", floor: 0x3A2C3F, wall: 0x3B5560,
    light: "#F0E6D2", silver: "#A8E0D8", warm: "#F2A65A",
    cool: 0xA8E0D8, dim: "#9A97A8", faint: "#6A6880", bar: 0x0E0F1C
  };

  const IMAGES = ["theo", "reflection", "sam", "floor", "wall", "goal", "plate",
    "door-closed", "door-open", "spikes", "frame"];
  const SOUNDS = [["step", "wav"], ["crack", "wav"], ["break", "wav"], ["moment", "wav"],
    ["win", "wav"], ["theme-theo", "mp3"], ["theme-sam", "mp3"]];

  // Shapes drawn in code when an image file is missing (128x128, smooth).
  function makeFallback(scene, key) {
    const g = scene.make.graphics({ add: false });
    const S = TEX, c = S / 2;
    const body = (color) => {
      g.fillStyle(0x000000, 0.18).fillEllipse(c, S - 22, 70, 16);           // soft shadow
      g.fillStyle(color, 1).fillRoundedRect(28, 24, 72, 80, 30);
      g.fillStyle(0x141526, 1).fillCircle(50, 58, 6).fillCircle(78, 58, 6); // eyes
    };
    switch (key) {
      case "theo": body(0xF2A65A); break;
      case "reflection": body(0xA8E0D8); break;
      case "sam": body(0xF0E6D2); break;
      case "floor":
        g.fillStyle(0x3A2C3F, 1).fillRect(0, 0, S, S);
        g.lineStyle(2, 0xFFFFFF, 0.04).strokeRect(1, 1, S - 2, S - 2); break;
      case "wall":
        g.fillStyle(0x3B5560, 1).fillRect(0, 0, S, S);
        g.fillStyle(0xFFFFFF, 0.05).fillRect(0, 0, S, 10); break;
      case "goal":
        g.fillStyle(0xA8E0D8, 0.10).fillCircle(c, c, 52);
        g.fillStyle(0xA8E0D8, 0.18).fillCircle(c, c, 38);
        g.lineStyle(4, 0xA8E0D8, 0.7).strokeCircle(c, c, 30); break;
      case "plate":
        g.fillStyle(0x000000, 0.2).fillRoundedRect(22, 26, 84, 84, 18);
        g.fillStyle(0xC9A66B, 1).fillRoundedRect(22, 20, 84, 84, 18); break;
      case "door-closed":
        g.fillStyle(0x7A5236, 1).fillRoundedRect(10, 6, S - 20, S - 12, 14);
        g.fillStyle(0xF2A65A, 0.9).fillCircle(S - 34, c, 6); break;
      case "door-open":
        g.lineStyle(4, 0x7A5236, 0.6).strokeRoundedRect(10, 6, S - 20, S - 12, 14); break;
      case "spikes":
        g.fillStyle(0xC77B8A, 0.9);
        [[24, 104], [64, 104], [104, 104]].forEach(([x, y]) => g.fillTriangle(x - 18, y, x + 18, y, x, y - 52)); break;
      case "frame":
        g.lineStyle(8, 0xF2A65A, 0.85).strokeRoundedRect(14, 14, S - 28, S - 28, 16); break;
      default:
        g.fillStyle(0x888888, 1).fillRect(0, 0, S, S);
    }
    g.generateTexture(key, S, S);
    g.destroy();
  }

  // Call one of C's Effects functions without ever crashing the game.
  function fx(name, ...args) {
    try {
      if (typeof Effects !== "undefined" && typeof Effects[name] === "function") {
        Effects[name](...args);
      }
    } catch (e) {
      console.warn("Effects." + name + " failed:", e);
    }
  }

  function sortedLevels() {
    return (typeof LEVELS !== "undefined" ? LEVELS : [])
      .filter(l => l && l.map)
      .sort((a, b) => a.number - b.number);
  }

  // The rules' events have a name field; read it whichever way A wrote it.
  function eventName(ev) { return ev.type || ev.event || ev.name; }

  // ---------------------------------------------------------------- Boot
  class BootScene extends Phaser.Scene {
    constructor() { super("Boot"); }

    preload() {
      this.load.on("loaderror", file => console.info("Missing asset (using fallback):", file.key));
      IMAGES.forEach(k => this.load.image(k, "assets/images/" + k + ".png"));
      SOUNDS.forEach(([k, ext]) => this.load.audio(k, "assets/sounds/" + k + "." + ext));
      this.load.image("title", "assets/images/title.png"); // optional, 960x540
      this.load.image("glitch", "assets/images/glitch.png"); // optional; drawn in code if missing
      this.load.image("story-bg", "assets/images/story-bg.png"); // optional 960x540 swirl behind story cards
    }

    create() {
      IMAGES.forEach(key => { if (!this.textures.exists(key)) makeFallback(this, key); });

      if (sortedLevels().length === 0) {
        this.add.text(W / 2, H / 2, "No levels found", { fontFamily: UI_FONT, fontSize: "20px", color: COLORS.light }).setOrigin(0.5);
        return;
      }
      this.scene.start("Title");
    }
  }

  // Story text by field name, with a quiet fallback if story.js is missing a field.
  function storyText(key) {
    const s = (typeof STORY !== "undefined") ? STORY[key] : null;
    return (typeof s === "string" && s.length) ? s : "";
  }

  // Start the first level, with the intro and the first act's card in front of it.
  function startGame(scene) {
    const first = sortedLevels()[0];
    scene.scene.start("Story", {
      cards: ["intro", "act" + (first ? first.act : 1)],
      next: { scene: "Level", data: { index: 0 } }
    });
  }

  // ---------------------------------------------------------------- Title
  class TitleScene extends Phaser.Scene {
    constructor() { super("Title"); }

    create(data) {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const hasArt = this.textures.exists("title");
      // After Take Their Place the cycle repeats: Sam is the one behind the glass now.
      const afterTake = !!(data && data.after === "take");
      if (hasArt) {
        this.add.image(W / 2, H / 2, "title").setDisplaySize(W, H);
      } else {
        this.add.text(W / 2, H / 2 - 70, "MIRROR WORLD", {
          fontFamily: STORY_FONT, fontSize: "58px", color: COLORS.light
        }).setOrigin(0.5);
      }

      const prompt = this.add.text(W / 2, H - 150, afterTake ? "New Game — Sam" : "Press Enter", {
        fontFamily: UI_FONT, fontSize: "20px", color: COLORS.silver
      }).setOrigin(0.5);
      this.tweens.add({ targets: prompt, alpha: 0.35, duration: 1100, yoyo: true, repeat: -1 });

      this.add.text(W / 2, H - 70,
        "Arrows / WASD move · Space look · Z undo · R restart · M mute", {
          fontFamily: UI_FONT, fontSize: "15px", color: COLORS.dim,
          backgroundColor: hasArt ? "#141526AA" : null, padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

      this.input.keyboard.on("keydown", e => {
        if (e.code === "KeyM") this.sound.mute = !this.sound.mute;
      });
      this.input.keyboard.once("keydown-ENTER", () => startGame(this));
      this.cameras.main.fadeIn(600, 20, 21, 38);
    }
  }

  // ---------------------------------------------------------------- Story card
  // One reusable full-screen card. data.cards is a list of STORY field names;
  // Enter shows the next one, then data.next starts.
  class StoryScene extends Phaser.Scene {
    constructor() { super("Story"); }

    updateBg() {
      if (this.bg) this.bg.setAngle((this.game.loop.time / 120000 * 360) % 360);
    }

    update() { this.updateBg(); }

    create(data) {
      const cards = (data.cards || []).filter(k => storyText(k));
      const next = data.next || { scene: "Title", data: {} };
      if (cards.length === 0) { this.scene.start(next.scene, next.data); return; }

      this.cameras.main.setBackgroundColor(COLORS.bg);

      // C's swirl behind the story text, turning very slowly (one turn every 120 s).
      // Scaled so its short side covers the screen's diagonal: no corners at any angle.
      // The angle comes from the game clock, so it carries on smoothly from card to card.
      this.bg = null;
      if (this.textures.exists("story-bg")) {
        const cover = Math.hypot(W, H) / Math.min(W, H);
        this.bg = this.add.image(W / 2, H / 2, "story-bg").setDisplaySize(W * cover, H * cover);
        this.updateBg();
      }

      const t = this.add.text(W / 2, H / 2 - 10, storyText(cards[0]), {
        fontFamily: STORY_FONT, fontSize: "26px", color: COLORS.light,
        align: "center", lineSpacing: 12, wordWrap: { width: 760 }
      }).setOrigin(0.5).setAlpha(0);
      const hint = this.add.text(W / 2, H - 50, "Enter", {
        fontFamily: UI_FONT, fontSize: "14px", color: COLORS.faint
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: t, alpha: 1, duration: 900 });
      this.tweens.add({ targets: hint, alpha: 1, duration: 900, delay: 900 });

      let ready = false;
      this.time.delayedCall(400, () => { ready = true; });
      this.input.keyboard.on("keydown", e => {
        if (e.code === "KeyM") { this.sound.mute = !this.sound.mute; return; }
        if (e.code !== "Enter" || !ready) return;
        ready = false;
        const rest = cards.slice(1);
        this.cameras.main.fadeOut(300, 20, 21, 38);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          if (rest.length) this.scene.restart({ cards: rest, next });
          else this.scene.start(next.scene, next.data);
        });
      });
    }
  }

  // ---------------------------------------------------------------- Level
  class LevelScene extends Phaser.Scene {
    constructor() { super("Level"); }

    create(data) {
      this.levels = sortedLevels();
      this.index = data.index || 0;
      this.level = this.levels[this.index];
      this.busy = false;     // an animation is playing
      this.locked = false;   // v3: won or failed, waiting for the next load
      this.doorSprites = [];
      this.footprints = [];
      this.cardShown = !!data.cardShown;
      // Phaser reuses this scene object, so reset per-level flags every time.
      this.cardOpen = false;
      this.shimmerHinted = false;
      this.textSlots = {};
      this.glitchMarks = [];

      // A restart arrives with the state (and events) that RESTART returned.
      // Otherwise this is a fresh level.
      this.state = data.state || Rules.load(this.level, data.carry);
      let opening = (data.events && data.events.length) ? data.events : (this.state.startEvents || []);

      this.cameras.main.setBackgroundColor(COLORS.bg);
      this.layout();
      this.drawMap();
      this.drawCharacters();
      this.drawBars();

      this.theo = this.act3 ? this.rightBody : this.leftBody;
      this.other = this.act3 ? this.leftBody : this.rightBody;
      this.mirror = { x: this.mirrorX, top: this.top, bottom: this.top + this.rows * TILE };

      fx("setup", this);
      fx("onLevelStart", this.level.number, this.level.act);
      fx("setCracks", this.state.cracks || 0);

      this.drawHud();
      this.setupKeys();

      // Level 9: the new-controls card, once per visit (not again after a restart).
      if (this.level.controlCard && !this.cardShown) this.openControlCard();

      this.busy = true;
      this.playEvents(opening).then(() => this.afterEvents());
    }

    // Sam's eye follows Sam, even while he slides.
    update() {
      if (this.eye && this.leftBody) this.eye.setPosition(this.leftBody.x, this.leftBody.y - 46);
    }

    // ---- layout and drawing
    layout() {
      const halves = this.state.map.map(r => r.split("|"));
      this.leftRows = halves.map(h => h[0] || "");
      this.rightRows = halves.map(h => h[1] || "");
      this.rows = halves.length;
      this.leftCols = Math.max(...this.leftRows.map(r => r.length));
      this.rightCols = Math.max(...this.rightRows.map(r => r.length));
      this.act3 = this.state.act === 3;

      const total = this.leftCols * TILE + STRIP + this.rightCols * TILE;
      this.leftX = Math.round((W - total) / 2);
      this.mirrorX = this.leftX + this.leftCols * TILE + STRIP / 2;
      this.rightX = this.leftX + this.leftCols * TILE + STRIP;
      this.top = Math.round(BAR + (H - 2 * BAR - this.rows * TILE) / 2);
    }

    tilePos(side, x, y) {
      const x0 = side === "left" ? this.leftX : this.rightX;
      return { x: x0 + x * TILE + TILE / 2, y: this.top + y * TILE + TILE / 2 };
    }

    // Art change: setDisplaySize, so any file size (128x128, or a 32x32 leftover) shows at 64 px.
    image(side, x, y, key, layer) {
      const p = this.tilePos(side, x, y);
      const img = this.add.image(p.x, p.y, key).setDisplaySize(TILE, TILE);
      if (layer) layer.add(img);
      return img;
    }

    // Each half is its own rounded "screen" with a soft shadow; the tiles are clipped to it.
    drawMap() {
      const h = this.rows * TILE;
      [["left", this.leftRows, this.leftX, this.leftCols], ["right", this.rightRows, this.rightX, this.rightCols]]
        .forEach(([side, rows, x0, cols]) => {
          const w = cols * TILE;

          // Soft shadow: a few faint layers, each a little bigger and lower.
          const shadow = this.add.graphics().setDepth(-2);
          for (let i = 4; i >= 1; i--) {
            shadow.fillStyle(0x000000, 0.07)
              .fillRoundedRect(x0 - i * 3, this.top - i * 2 + 8, w + i * 6, h + i * 5, RADIUS + i * 3);
          }

          // The room's tiles live in a layer clipped to the rounded screen.
          const layer = this.add.container(0, 0).setDepth(0);
          const maskShape = this.make.graphics({ add: false });
          maskShape.fillStyle(0xFFFFFF, 1).fillRoundedRect(x0, this.top, w, h, RADIUS);
          layer.setMask(maskShape.createGeometryMask());

          rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
              const ch = row[x];
              if (ch === " ") continue;
              if (ch === "#") { this.image(side, x, y, "wall", layer); continue; }
              this.image(side, x, y, "floor", layer);
              if (ch === "G") this.image(side, x, y, "goal", layer);
              else if (ch === "^") this.image(side, x, y, "spikes", layer);
              else if (ch === "a" || ch === "b") this.image(side, x, y, "plate", layer);
              else if (ch === "F") this.image(side, x, y, "frame", layer);
              else if (ch === "A" || ch === "B") {
                const s = this.image(side, x, y, "door-closed", layer);
                this.doorSprites.push({ letter: ch, sprite: s });
              }
            }
          });

          // A faint rim of light around the screen.
          this.add.graphics().setDepth(5)
            .lineStyle(2, COLORS.cool, 0.16).strokeRoundedRect(x0 + 1, this.top + 1, w - 2, h - 2, RADIUS);
        });
      this.refreshDoors();
      this.drawSeam(h);
    }

    // The glowing seam down the middle of the 32 px mirror strip (C adds fog and shimmer on top).
    drawSeam(h) {
      const cy = this.top + h / 2;
      const glow = [
        this.add.rectangle(this.mirrorX, cy, 22, h - 8, COLORS.cool, 0.05),
        this.add.rectangle(this.mirrorX, cy, 12, h - 8, COLORS.cool, 0.10),
        this.add.rectangle(this.mirrorX, cy, 6, h - 8, COLORS.cool, 0.20)
      ];
      const core = this.add.rectangle(this.mirrorX, cy, 2, h - 8, 0xE8FFFB, 0.85);
      glow.concat(core).forEach(o => o.setDepth(4));
      this.tweens.add({ targets: glow, alpha: { from: 1, to: 0.55 }, duration: 2400,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    drawCharacters() {
      const leftKey = this.act3 ? "sam" : "theo";
      const rightKey = this.act3 ? "theo" : "reflection";
      const p = this.state.person, r = this.state.reflection;
      this.leftBody = this.image("left", p.x, p.y, leftKey).setDepth(10);
      this.rightBody = this.image("right", r.x, r.y, rightKey).setDepth(10);
    }

    drawBars() {
      this.add.rectangle(W / 2, BAR / 2, W, BAR, COLORS.bar, 0.85).setDepth(20);
      this.add.rectangle(W / 2, H - BAR / 2, W, BAR, COLORS.bar, 0.85).setDepth(20);
      const style = { fontFamily: UI_FONT, fontSize: "16px", color: COLORS.light };
      this.add.text(16, BAR / 2, "Level " + this.level.number + " · " + (this.level.name || ""), style)
        .setOrigin(0, 0.5).setDepth(21);
      this.keysText = this.add.text(W / 2, H - BAR / 2, "", { ...style, color: COLORS.dim })
        .setOrigin(0.5).setDepth(21);
      this.hintText = this.add.text(W / 2, H - BAR - 14, "", { ...style, color: COLORS.light, fontSize: "15px", fontStyle: "italic" })
        .setOrigin(0.5).setAlpha(0).setDepth(21);
      this.updateBars();
    }

    updateBars() {
      let s;
      if (this.act3) {
        s = "Space Follow · Shift Resist · Arrow Break · Z undo · R restart";
      } else {
        s = "Arrows move · Z undo · R restart";
        if (this.state.look) s += " · Space look";
      }
      this.keysText.setText(s);
    }

    // ---- Act 3 HUD: Will, Sam's footprints (the glowing one is the frame turn), Sam's eye
    drawHud() {
      this.willText = this.add.text(W - 16, BAR / 2, "", {
        fontFamily: UI_FONT, fontSize: "17px", color: COLORS.light, fontStyle: "bold"
      }).setOrigin(1, 0.5).setDepth(21);

      this.eye = this.add.container(0, 0).setDepth(12).setVisible(false);
      const g = this.add.graphics();
      g.fillStyle(COLORS.bar, 0.85).fillRoundedRect(-22, -14, 44, 28, 14);
      g.fillStyle(0xF0E6D2, 1).fillEllipse(0, 0, 30, 16);
      g.fillStyle(0x141526, 1).fillCircle(0, 0, 5);
      this.eye.add(g);
      this.tweens.add({ targets: g, y: -3, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

      this.updateHud();
    }

    hudValues() { return this.state; }

    // Team change: glitch tiles. Every disobey tile still waiting this attempt gets a faint
    // silver crack mark and a small arrow toward where the reflection will go.
    // Redrawn from the state after every step, undo and restart.
    drawGlitches() {
      (this.glitchMarks || []).forEach(o => o.destroy());
      this.glitchMarks = [];
      (this.state.glitches || []).forEach(gl => {
        const side = gl.who === "person" ? "left" : "right";
        const p = this.tilePos(side, gl.x, gl.y);
        if (this.textures.exists("glitch")) {
          this.glitchMarks.push(this.add.image(p.x, p.y, "glitch").setDisplaySize(TILE, TILE)
            .setAlpha(0.75).setDepth(3));
        } else {
          const g = this.add.graphics().setDepth(3);
          g.lineStyle(2, COLORS.cool, 0.5);
          g.beginPath();
          g.moveTo(p.x - 20, p.y - 14); g.lineTo(p.x - 6, p.y - 4); g.lineTo(p.x - 12, p.y + 6);
          g.lineTo(p.x + 4, p.y + 16); g.moveTo(p.x - 6, p.y - 4); g.lineTo(p.x + 10, p.y - 10);
          g.lineTo(p.x + 20, p.y - 2);
          g.strokePath();
          this.glitchMarks.push(g);
        }
        // A small arrow toward dir, near the tile's edge.
        const d = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[gl.dir];
        if (d) {
          const ax = p.x + d[0] * 20, ay = p.y + d[1] * 20;
          const angle = Math.atan2(d[1], d[0]);
          const tri = this.add.triangle(ax, ay, 0, -6, 10, 0, 0, 6, COLORS.cool, 0.8)
            .setRotation(angle).setDepth(3);
          this.glitchMarks.push(tri);
        }
      });
    }

    updateHud() {
      this.drawGlitches();
      const v = this.hudValues();
      const show = this.act3;

      const will = v.will;
      this.willText.setVisible(show && will !== null && will !== undefined);
      if (this.willText.visible) this.willText.setText("Will  " + will);

      // Footprints: faint pairs of marks on Sam's next steps.
      this.footprints.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); });
      this.footprints = [];
      if (show) {
        (v.footprints || []).forEach(f => {
          const p = this.tilePos("left", f.x, f.y);
          const color = f.glow ? 0xF2A65A : 0xF0E6D2;
          const alpha = f.glow ? 0.9 : 0.28;
          const a = this.add.ellipse(p.x - 9, p.y + 4, 11, 18, color, alpha).setDepth(6);
          const b = this.add.ellipse(p.x + 9, p.y - 6, 11, 18, color, alpha).setDepth(6);
          this.footprints.push(a, b);
          if (f.glow) {
            const halo = this.add.circle(p.x, p.y, 26, 0xF2A65A, 0.18).setDepth(5);
            this.footprints.push(halo);
            this.tweens.add({ targets: [a, b, halo], alpha: { from: alpha, to: 0.35 }, duration: 900,
              yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
        });
      }

      this.eye.setVisible(show && !!v.samLooking);
    }

    // Level 12 warning (moment "strain"): the Will counter turns warm and pulses gently.
    pulseWill() {
      if (!this.willText.visible) return;
      this.tweens.killTweensOf(this.willText);
      this.willText.setColor(COLORS.warm).setScale(1);
      this.tweens.add({ targets: this.willText, scale: 1.18, duration: 450, yoyo: true, repeat: 3,
        ease: "Sine.easeInOut", onComplete: () => this.willText.setScale(1) });
    }

    // ---- Level 9 control card: full screen, stays until Space.
    openControlCard() {
      this.cardOpen = true;
      const bg = this.add.rectangle(W / 2, H / 2, W, H, COLORS.bg, 0.97).setDepth(40);
      const t = this.add.text(W / 2, H / 2, storyText("controlCard"), {
        fontFamily: STORY_FONT, fontSize: "24px", color: COLORS.light, align: "center",
        lineSpacing: 10, wordWrap: { width: 780 }
      }).setOrigin(0.5).setDepth(41).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 800 });
      this.controlCardObjects = [bg, t];
    }

    closeControlCard() {
      this.cardOpen = false;
      this.cardShown = true;
      this.tweens.add({ targets: this.controlCardObjects, alpha: 0, duration: 400,
        onComplete: () => this.controlCardObjects.forEach(o => o.destroy()) });
      this.pulseKeys();   // the Space hint pulses for the first 3 turns
    }

    refreshDoors() {
      const open = this.state.openDoors || [];
      this.doorSprites.forEach(d => d.sprite.setTexture(open.includes(d.letter) ? "door-open" : "door-closed"));
    }

    // After UNDO: put everything straight where the state says (no slide).
    redraw() {
      const p = this.tilePos("left", this.state.person.x, this.state.person.y);
      const r = this.tilePos("right", this.state.reflection.x, this.state.reflection.y);
      this.leftBody.setPosition(p.x, p.y);
      this.rightBody.setPosition(r.x, r.y);
      this.refreshDoors();
      this.updateBars();
      this.updateHud();
      fx("setCracks", this.state.cracks || 0);
    }

    // ---- keys
    setupKeys() {
      this.input.keyboard.addCapture("UP,DOWN,LEFT,RIGHT,SPACE,SHIFT");
      const map = {
        ArrowUp: "U", KeyW: "U", ArrowDown: "D", KeyS: "D",
        ArrowLeft: "L", KeyA: "L", ArrowRight: "R", KeyD: "R",
        KeyZ: "UNDO", KeyR: "RESTART"
      };
      this.input.keyboard.on("keydown", e => {
        if (e.repeat) return;
        if (e.code === "KeyM") { this.sound.mute = !this.sound.mute; return; }
        if (this.cardOpen) { if (e.code === "Space") this.closeControlCard(); return; }
        let input = map[e.code];
        if (e.code === "Space") input = this.act3 ? "FOLLOW" : (this.state.look ? "LOOK" : null);
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") input = this.act3 ? "RESIST" : null;
        if (input) this.send(input);
      });
    }

    send(input) {
      if (this.busy || this.locked) return;
      this.textThisTurn = false;
      const res = Rules.step(this.state, input);
      if (!res || !res.state) return;

      if (input === "RESTART") return this.restartWith(res);

      this.state = res.state;
      if (input === "UNDO") {
        this.redraw();
        this.busy = true;
        this.playEvents(res.events || []).then(() => this.afterEvents());
        return;
      }

      this.busy = true;
      this.playEvents(res.events || []).then(() => this.afterEvents());
    }

    // A restart rebuilds the scene from the RESTART state, so Effects.setup runs again.
    restartWith(res) {
      this.locked = true;
      this.scene.restart({ index: this.index, state: res.state, events: res.events || [], cardShown: this.cardShown });
    }

    afterEvents() {
      this.busy = false;
      this.updateBars();
      this.updateHud();
      if (this.level.controlCard && this.cardShown && (this.state.turn || 0) < 3 && this.state.turn > 0) this.pulseKeys();
      // v3: lock keys once the level is won or failed.
      if (this.state.status === "won" || this.state.status === "failed") this.locked = true;
    }

    // ---- events
    async playEvents(events) {
      this.batchHasText = events.some(e => eventName(e) === "text");
      let i = 0;
      while (i < events.length) {
        // Moves and bumps that come together play at the same moment.
        if (["move", "blocked"].includes(eventName(events[i]))) {
          const group = [];
          while (i < events.length && ["move", "blocked"].includes(eventName(events[i]))) group.push(events[i++]);
          await Promise.all(group.map(ev => this.handleEvent(ev)));
        } else {
          await this.handleEvent(events[i++]);
        }
        if (!this.scene.isActive()) return;
      }
    }

    sprite(who) { return who === "reflection" ? this.rightBody : (who === "person" ? this.leftBody : null); }

    tween(cfg) { return new Promise(res => this.tweens.add({ ...cfg, onComplete: res })); }

    wait(ms) { return new Promise(res => this.time.delayedCall(ms, res)); }

    handleEvent(ev) {
      switch (eventName(ev)) {
        case "move": {
          const s = this.sprite(ev.who);
          if (!s) return;
          const p = this.tilePos(ev.who === "person" ? "left" : "right", ev.to.x, ev.to.y);
          fx("onMove", s);
          return this.tween({ targets: s, x: p.x, y: p.y, duration: SLIDE_MS });
        }
        case "blocked": {
          const s = this.sprite(ev.who);
          if (!s) return;
          const sx = s.scaleX, sy = s.scaleY;   // relative, so it works at any file size
          return this.tween({ targets: s, scaleX: sx * 0.9, scaleY: sy * 1.1, duration: 70, yoyo: true,
            ease: "Sine.easeOut" }).then(() => s.setScale(sx, sy));
        }
        case "door":
          this.doorSprites.filter(d => d.letter === ev.letter)
            .forEach(d => d.sprite.setTexture(ev.open ? "door-open" : "door-closed"));
          return;
        case "crack":
          fx("onCrack", this.mirrorX, this.rightBody.y);
          fx("setCracks", ev.cracks);
          return;
        case "glassBreak":
          fx("onGlassBreak");
          fx("setCracks", 0);
          // Level 8's smash: TOGETHER appears on the mirror side, when it's already too late.
          if (this.level.swap) return this.showTogether();
          return this.wait(400);
        case "moment":
          // Team change: pass the shimmer's direction on to C (undefined if there is none).
          fx("onMoment", ev.kind, this.sprite(ev.who || "reflection"), ev.dir);
          // A warned disobey is coming: draw the eye to the Look key.
          if (ev.kind === "shimmer" && this.state.look && !this.act3) this.pulseKeys();
          if (ev.kind === "strain") this.pulseWill();
          return this.wait(250);
        case "text":
          return this.showText(ev.words, ev.side, ev.mirrored);
        case "hint":
          // If glass text comes in the same batch, show the hint a little after it.
          if (this.batchHasText) this.time.delayedCall(1100, () => this.showHint(ev.words));
          else this.showHint(ev.words);
          return;
        case "fail":
          this.locked = true;
          // NOT TONIGHT comes as text just before the fail: give it time to be read.
          return this.wait(this.textThisTurn ? 2200 : 600).then(() => {
            const res = Rules.step(this.state, "RESTART");
            if (res && res.state) this.restartWith(res);
          });
        case "win":
          this.locked = true;
          fx("onWin");
          // Give a message that just appeared (like COME UPSTAIRS) time to be read.
          return this.wait(this.textThisTurn ? 2400 : 800).then(() => this.nextLevel());
        case "swap":
          // Level 8: the swap card, then Act 3's card, then Level 9. (B6 adds TOGETHER and the control card.)
          this.locked = true;
          return this.wait(800).then(() => this.nextLevel(["swap", "act3"]));
        case "ending":
          this.locked = true;
          return this.wait(1200).then(() => this.showEnding(ev.which, ev.mercy));
        default:
          return;
      }
    }

    // TOGETHER fades onto the mirror side for about 2 seconds.
    showTogether() {
      const cx = this.rightX + this.rightCols * TILE / 2;
      const cy = this.top + this.rows * TILE / 2;
      const t = this.add.text(cx, cy, storyText("together") || "TOGETHER", {
        fontFamily: STORY_FONT, fontSize: "44px", color: COLORS.silver
      }).setOrigin(0.5).setScale(-1, 1).setAlpha(0).setDepth(30);
      fx("onMoment", "text", null);
      return this.tween({ targets: t, alpha: 1, duration: 600, hold: 1200, yoyo: true })
        .then(() => t.destroy());
    }

    // Writing fades onto misty glass on that side. Mirrored text is flipped left-to-right.
    // Two messages on different sides can show at once (Act 3).
    showText(words, side, mirrored) {
      const left = side === "left";
      const cx = left ? this.leftX + this.leftCols * TILE / 2 : this.rightX + this.rightCols * TILE / 2;
      const cy = this.top + TILE * 0.55;
      this.textSlots = this.textSlots || {};
      if (this.textSlots[side]) this.textSlots[side].forEach(o => { this.tweens.killTweensOf(o); o.destroy(); });

      const t = this.add.text(cx, cy, words || "", {
        fontFamily: STORY_FONT, fontSize: "26px", color: COLORS.silver, align: "center",
        wordWrap: { width: (left ? this.leftCols : this.rightCols) * TILE - 24 }
      }).setOrigin(0.5).setAlpha(0).setDepth(16);
      if (mirrored) t.setScale(-1, 1);

      // A soft patch of mist behind the words.
      const mist = this.add.graphics().setAlpha(0).setDepth(15);
      mist.fillStyle(0xF0E6D2, 0.10).fillRoundedRect(cx - t.width / 2 - 20, cy - t.height / 2 - 10, t.width + 40, t.height + 20, 14);

      this.textSlots[side] = [t, mist];
      this.textThisTurn = true;
      fx("onMoment", "text", null);
      this.tweens.add({ targets: [t, mist], alpha: 1, duration: 700, hold: 3000, yoyo: true,
        onComplete: () => { t.destroy(); mist.destroy(); } });
      return this.wait(60);   // don't hold up the player's next key
    }

    // Soft text just above the bottom bar, like "Maybe let it."
    showHint(words) {
      this.tweens.killTweensOf(this.hintText);
      this.hintText.setText(words || "").setAlpha(0);
      this.tweens.add({ targets: this.hintText, alpha: 1, duration: 500, hold: 3500, yoyo: true });
    }

    // Gently brighten the bottom key hints twice (used when the shimmer warns of a disobey).
    pulseKeys() {
      this.tweens.killTweensOf(this.keysText);
      this.keysText.setColor(COLORS.silver).setAlpha(1);
      this.tweens.add({ targets: this.keysText, alpha: 0.4, duration: 350, yoyo: true, repeat: 1,
        onComplete: () => this.keysText.setColor(COLORS.dim).setAlpha(1) });
    }

    // An ending's screen, then (Break It Together with Mercy 2) Mara's nod, then the credits,
    // then the title. After Take Their Place the title says "New Game — Sam".
    showEnding(which, mercy) {
      this.locked = true;
      const card = { take: "endingTake", break: "endingBreak", stay: "endingStay" }[which];
      const cards = [];
      if (card) cards.push(card);
      if (which === "break" && mercy === 2) cards.push("maraNod");
      cards.push("credits");
      this.scene.start("Story", { cards, next: { scene: "Title", data: { after: which } } });
    }

    // Go to the next level with state.carry. When the act changes, its story card comes first.
    nextLevel(cardsOverride) {
      const carry = this.state.carry;
      const next = this.levels[this.index + 1];

      let cards = cardsOverride || [];
      if (!cardsOverride && next && next.act !== this.level.act) cards = ["act" + next.act];

      const target = next ? { scene: "Level", data: { index: this.index + 1, carry } } : { scene: "End", data: {} };
      if (cards.length) this.scene.start("Story", { cards, next: target });
      else this.scene.start(target.scene, target.data);
    }
  }

  // ---------------------------------------------------------------- End (placeholder until B3/B7)
  class EndScene extends Phaser.Scene {
    constructor() { super("End"); }
    create(data) {
      const msg = data.ending ? "Ending: " + data.ending : "No more levels yet";
      this.cameras.main.setBackgroundColor(COLORS.bg);
      this.add.text(W / 2, H / 2 - 20, msg, { fontFamily: STORY_FONT, fontSize: "28px", color: COLORS.light }).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 28, "Press Enter for the title", { fontFamily: UI_FONT, fontSize: "16px", color: COLORS.dim }).setOrigin(0.5);
      this.input.keyboard.once("keydown-ENTER", () => this.scene.start("Title"));
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: W,
    height: H,
    backgroundColor: "#141526",
    pixelArt: false,      // art change: smooth images
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TitleScene, StoryScene, LevelScene, EndScene]
  });
})();