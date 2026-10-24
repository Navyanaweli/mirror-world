// game.js (Person B) — step B2: the level screen.
// Talks to A only through Rules.load / Rules.step, and to C only through Effects.*
// Design v3: everything drawn at 2x (64 px tiles), 32 px mirror strip, centred.

(function () {
  const W = 960, H = 540;
  const TILE = 64;          // 32x32 files, drawn at 2x
  const STRIP = 32;         // mirror strip width on screen
  const BAR = 40;           // top and bottom bar height
  const SLIDE_MS = 120;

  const COLORS = {
    bg: 0x11141C, floor: 0x232A3A, wall: 0x4A5570,
    light: "#EAE4D6", silver: "#9FD6E0", warm: "#E9B872"
  };

  const IMAGES = ["theo", "reflection", "sam", "floor", "wall", "goal", "plate",
    "door-closed", "door-open", "spikes", "frame"];
  const SOUNDS = [["step", "wav"], ["crack", "wav"], ["break", "wav"], ["moment", "wav"],
    ["win", "wav"], ["theme-theo", "mp3"], ["theme-sam", "mp3"]];

  // Colour used when an image file is missing. Characters get two dots for eyes.
  const FALLBACK = {
    theo: [0xE9B872, true], reflection: [0x9FD6E0, true], sam: [0xEAE4D6, true],
    floor: [0x232A3A], wall: [0x4A5570], goal: [0x3E6670], plate: [0x7A6A4F],
    "door-closed": [0x5A4636], "door-open": [0x2A2420], spikes: [0x8A5A66], frame: [0xB89A6A]
  };

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
    }

    create() {
      IMAGES.forEach(key => {
        if (this.textures.exists(key)) return;
        const [color, eyes] = FALLBACK[key] || [0x888888];
        const g = this.make.graphics({ add: false });
        if (eyes) {
          g.fillStyle(color, 1).fillRoundedRect(4, 4, 24, 24, 6);
          g.fillStyle(0x11141C, 1).fillRect(10, 12, 3, 4).fillRect(19, 12, 3, 4);
        } else {
          g.fillStyle(color, 1).fillRect(0, 0, 32, 32);
          g.lineStyle(1, 0x000000, 0.15).strokeRect(0.5, 0.5, 31, 31);
        }
        g.generateTexture(key, 32, 32);
        g.destroy();
      });

      if (sortedLevels().length === 0) {
        this.add.text(W / 2, H / 2, "No levels found", { fontFamily: "monospace", fontSize: "20px", color: COLORS.light }).setOrigin(0.5);
        return;
      }
      this.scene.start("Level", { index: 0 });
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

      this.setupKeys();

      this.busy = true;
      this.playEvents(opening).then(() => this.afterEvents());
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

    image(side, x, y, key) {
      const p = this.tilePos(side, x, y);
      return this.add.image(p.x, p.y, key).setScale(TILE / 32);
    }

    drawMap() {
      [["left", this.leftRows], ["right", this.rightRows]].forEach(([side, rows]) => {
        rows.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === " ") continue;
            if (ch === "#") { this.image(side, x, y, "wall"); continue; }
            this.image(side, x, y, "floor");
            if (ch === "G") this.image(side, x, y, "goal");
            else if (ch === "^") this.image(side, x, y, "spikes");
            else if (ch === "a" || ch === "b") this.image(side, x, y, "plate");
            else if (ch === "F") this.image(side, x, y, "frame");
            else if (ch === "A" || ch === "B") {
              const s = this.image(side, x, y, "door-closed");
              this.doorSprites.push({ letter: ch, sprite: s });
            }
          }
        });
      });
      this.refreshDoors();

      // The mirror strip between the two rooms (C adds the shimmer).
      const h = this.rows * TILE;
      this.add.rectangle(this.mirrorX, this.top + h / 2, STRIP, h, 0x9FD6E0, 0.12);
      this.add.rectangle(this.mirrorX, this.top + h / 2, 2, h, 0x9FD6E0, 0.45);
    }

    drawCharacters() {
      const leftKey = this.act3 ? "sam" : "theo";
      const rightKey = this.act3 ? "theo" : "reflection";
      const p = this.state.person, r = this.state.reflection;
      this.leftBody = this.image("left", p.x, p.y, leftKey).setDepth(10);
      this.rightBody = this.image("right", r.x, r.y, rightKey).setDepth(10);
    }

    drawBars() {
      this.add.rectangle(W / 2, BAR / 2, W, BAR, 0x0B0D13, 1).setDepth(20);
      this.add.rectangle(W / 2, H - BAR / 2, W, BAR, 0x0B0D13, 1).setDepth(20);
      const style = { fontFamily: "monospace", fontSize: "16px", color: COLORS.light };
      this.add.text(16, BAR / 2, "Level " + this.level.number + " · " + (this.level.name || ""), style)
        .setOrigin(0, 0.5).setDepth(21);
      this.keysText = this.add.text(W / 2, H - BAR / 2, "", { ...style, color: "#B8BCC8" })
        .setOrigin(0.5).setDepth(21);
      this.hintText = this.add.text(W / 2, H - BAR - 18, "", { ...style, color: "#B8BCC8", fontSize: "14px" })
        .setOrigin(0.5).setAlpha(0).setDepth(21);
      this.updateBars();
    }

    updateBars() {
      let s;
      if (this.act3) {
        s = "Space follow · Shift resist · Arrows break · Z undo · R restart";
        if (this.state.will !== null && this.state.will !== undefined) s += "   Will: " + this.state.will;
      } else {
        s = "Arrows move · Z undo · R restart";
        if (this.state.look) s += " · Space look";
      }
      this.keysText.setText(s);
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
        let input = map[e.code];
        if (e.code === "Space") input = this.act3 ? "FOLLOW" : (this.state.look ? "LOOK" : null);
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") input = this.act3 ? "RESIST" : null;
        if (input) this.send(input);
      });
    }

    send(input) {
      if (this.busy || this.locked) return;
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
      this.scene.restart({ index: this.index, state: res.state, events: res.events || [] });
    }

    afterEvents() {
      this.busy = false;
      this.updateBars();
      // v3: lock keys once the level is won or failed.
      if (this.state.status === "won" || this.state.status === "failed") this.locked = true;
    }

    // ---- events
    async playEvents(events) {
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
          return this.tween({ targets: s, scaleX: 1.8, scaleY: 2.2, duration: 60, yoyo: true });
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
          return this.wait(400);
        case "moment":
          fx("onMoment", ev.kind, this.sprite(ev.who || "reflection"));
          return this.wait(250);
        case "text":
          return this.showText(ev.words, ev.side, ev.mirrored);
        case "hint":
          this.showHint(ev.words);
          return;
        case "fail":
          this.locked = true;
          return this.wait(600).then(() => {
            const res = Rules.step(this.state, "RESTART");
            if (res && res.state) this.restartWith(res);
          });
        case "win":
          this.locked = true;
          fx("onWin");
          return this.wait(800).then(() => this.nextLevel());
        case "swap":
          // B6 adds the full swap scene. For now, go straight on.
          this.locked = true;
          return this.wait(800).then(() => this.nextLevel());
        case "ending":
          // B7 adds the ending screens.
          this.locked = true;
          return this.wait(800).then(() => this.scene.start("End", { ending: ev.which, mercy: ev.mercy }));
        default:
          return;
      }
    }

    showText(words, side, mirrored) {
      const cx = side === "left"
        ? this.leftX + this.leftCols * TILE / 2
        : this.rightX + this.rightCols * TILE / 2;
      const t = this.add.text(cx, this.top + TILE * 0.6, words || "", {
        fontFamily: "Georgia, serif", fontSize: "26px", color: COLORS.silver, align: "center"
      }).setOrigin(0.5).setAlpha(0).setDepth(15);
      if (mirrored) t.setScale(-1, 1);
      fx("onMoment", "text", null);
      this.tweens.add({ targets: t, alpha: 0.9, duration: 600, hold: 2500, yoyo: true,
        onComplete: () => t.destroy() });
      return this.wait(600);
    }

    showHint(words) {
      this.tweens.killTweensOf(this.hintText);
      this.hintText.setText(words || "").setAlpha(0);
      this.tweens.add({ targets: this.hintText, alpha: 1, duration: 400, hold: 3000, yoyo: true });
    }

    nextLevel() {
      const carry = this.state.carry;
      if (this.index + 1 < this.levels.length) {
        this.scene.start("Level", { index: this.index + 1, carry });
      } else {
        this.scene.start("End", {});
      }
    }
  }

  // ---------------------------------------------------------------- End (placeholder until B3/B7)
  class EndScene extends Phaser.Scene {
    constructor() { super("End"); }
    create(data) {
      const msg = data.ending ? "Ending: " + data.ending : "No more levels yet";
      this.add.text(W / 2, H / 2 - 20, msg, { fontFamily: "monospace", fontSize: "24px", color: COLORS.light }).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 24, "Press Enter to play again", { fontFamily: "monospace", fontSize: "16px", color: "#B8BCC8" }).setOrigin(0.5);
      this.input.keyboard.once("keydown-ENTER", () => this.scene.start("Level", { index: 0 }));
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: W,
    height: H,
    backgroundColor: "#11141C",
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, LevelScene, EndScene]
  });
})();