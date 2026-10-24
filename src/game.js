// game.js (Person B) — level screen, title, story cards and game flow.
// Talks to A only through Rules.load / Rules.step, and to C only through Effects.*
// Design v4 (simple rules) + art change: images are drawn at 64 px with setDisplaySize,
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

  // C's room tiles (optional): floor-<room>.png and wall-<room>.png, picked by level number.
  // v4 levels: 1 Hallway, 2 Bathroom, 3 Bedroom, 4 Study (library tiles), 5 Kitchen,
  // 6 Attic, 7 Cellar, 8 Attic. Levels 1 and 3 keep the plain tiles.
  const ROOMS = { 2: "bathroom", 4: "library", 5: "kitchen", 6: "attic", 7: "cellar", 8: "attic" };
  const ROOM_NAMES = ["bathroom", "library", "kitchen", "cellar", "attic"];

  const IMAGES = ["theo", "reflection", "sam", "floor", "wall", "goal", "plate",
    "door-closed", "door-open", "spikes", "frame", "crack"];
  const SOUNDS = [["step", "wav"], ["crack", "wav"], ["break", "wav"], ["moment", "wav"],
    ["win", "wav"], ["theme-theo", "mp3"], ["theme-sam", "mp3"],
    // C's whispered voice lines (optional; effects.js stays quiet if one is missing)
    ["voice-im-sorry", "mp3"], ["voice-let-me-out", "mp3"], ["voice-it-has-to-be-someone", "mp3"],
    ["voice-together", "mp3"], ["voice-is-someone-there", "mp3"]];

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
      case "goal":   // drawn light so B's warm/silver tint (H / D) shows through
        g.fillStyle(0xFFFFFF, 0.12).fillCircle(c, c, 52);
        g.fillStyle(0xFFFFFF, 0.22).fillCircle(c, c, 38);
        g.lineStyle(4, 0xFFFFFF, 0.85).strokeCircle(c, c, 30); break;
      case "crack":  // v4: a hairline crack in silver on a transparent tile
        g.lineStyle(3, 0x9FD6E0, 0.9);
        g.beginPath();
        g.moveTo(28, 30); g.lineTo(54, 52); g.lineTo(46, 70); g.lineTo(72, 92); g.lineTo(98, 100);
        g.moveTo(54, 52); g.lineTo(80, 44); g.lineTo(102, 30);
        g.moveTo(46, 70); g.lineTo(30, 96);
        g.strokePath(); break;
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

  // Make a copy of a texture recoloured by brightness: each pixel keeps its light and alpha
  // but takes the new colour. (setTint multiplies, so silver on an orange goal came out olive.)
  function makeRecoloured(scene, srcKey, newKey, rgb) {
    try {
      const src = scene.textures.get(srcKey).getSourceImage();
      const w = src.width, h = src.height;
      const tex = scene.textures.createCanvas(newKey, w, h);
      const ctx = tex.getContext();
      ctx.drawImage(src, 0, 0);
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = Math.pow((0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255, 0.8);
        d[i] = rgb[0] * lum; d[i + 1] = rgb[1] * lum; d[i + 2] = rgb[2] * lum;
      }
      ctx.putImageData(img, 0, 0);
      tex.refresh();
      return true;
    } catch (e) {
      console.warn("Could not recolour " + srcKey + ":", e);
      return false;
    }
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

  // ---- Sound settings (volume and mute), remembered in this browser if storage allows.
  const SETTINGS_KEY = "mirrorworld.settings";
  function loadSettings() {
    try {
      const v = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return { volume: typeof v.volume === "number" ? v.volume : 0.8, mute: !!v.mute };
    } catch (e) { return { volume: 0.8, mute: false }; }
  }
  // The game's own copy is the source of truth (the audio engine reports changes late).
  const SETTINGS = loadSettings();
  function applySettings(scene) {
    scene.sound.volume = SETTINGS.volume;
    scene.sound.mute = SETTINGS.mute;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) {}
  }
  function toggleMute(scene) { SETTINGS.mute = !SETTINGS.mute; applySettings(scene); }

  function sortedLevels() {
    return (typeof LEVELS !== "undefined" ? LEVELS : [])
      .filter(l => l && l.map)
      .sort((a, b) => a.number - b.number);
  }

  // Phaser 3.90 bug: if two keys land in the same frame, the scene's "keydown" listener can be
  // handed the earlier event again (one R ran RESTART three times). Every key handler goes
  // through this wrapper, which ignores an event it has already seen.
  const seenKeys = new WeakSet();
  function onKey(scene, fn) {
    scene.input.keyboard.on("keydown", e => {
      if (seenKeys.has(e)) return;
      seenKeys.add(e);
      fn(e);
    });
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
      this.load.image("title-glow", "assets/images/title-glow.png"); // optional, 960x540 transparent glow layer
      this.load.image("story-bg", "assets/images/story-bg.png"); // optional 960x540 swirl behind story cards
      ROOM_NAMES.forEach(r => {   // optional; plain floor/wall is used if missing
        this.load.image("floor-" + r, "assets/images/floor-" + r + ".png");
        this.load.image("wall-" + r, "assets/images/wall-" + r + ".png");
      });
    }

    create() {
      IMAGES.forEach(key => { if (!this.textures.exists(key)) makeFallback(this, key); });
      // v4 goals: H is Theo's (warm #E9B872), D is the other's (silver #9FD6E0).
      makeRecoloured(this, "goal", "goal-theo", [0xE9, 0xB8, 0x72]);
      makeRecoloured(this, "goal", "goal-other", [0x9F, 0xD6, 0xE0]);
      applySettings(this);

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

  // ---------------------------------------------------------------- Title (front page)
  // C's title.png full screen (or a drawn title if it's missing), a gentle arrival,
  // a living mirror glow, dust, and a menu: Start · Settings · Controls · Credits.
  class TitleScene extends Phaser.Scene {
    constructor() { super("Title"); }

    create(data) {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      this.hasArt = this.textures.exists("title");
      // After Take Their Place the cycle repeats: Sam is the one behind the glass now.
      this.afterTake = !!(data && data.after === "take");
      this.leaving = false;
      this.panel = null;        // null, "settings", "controls" or "credits"
      this.panelObjects = [];
      this.index = 0;

      this.drawBackdrop();
      this.drawDust();
      this.drawMenu();

      onKey(this, e => this.onKey(e));
      this.cameras.main.fadeIn(900, 20, 21, 38);
    }

    // ---- art, logo and the living mirror
    drawBackdrop() {
      if (this.hasArt) {
        const art = this.add.image(W / 2, H / 2, "title").setDisplaySize(W, H);
        if (this.textures.exists("title-glow")) {
          // C's glow layer on top of the art, pulsing gently (fades in after the art).
          const glow = this.add.image(W / 2, H / 2, "title-glow").setDisplaySize(W, H).setAlpha(0);
          this.tweens.add({ targets: glow, alpha: 0.35, duration: 1200, onComplete: () =>
            this.tweens.add({ targets: glow, alpha: { from: 0.35, to: 1 }, duration: 2500,
              yoyo: true, repeat: -1, ease: "Sine.easeInOut" }) });
        } else {
          // No glow layer: a slow breath of light over the art, so the screen is never quite still.
          const breath = this.add.ellipse(W / 2, H * 0.42, 520, 360, COLORS.cool, 0.05);
          this.tweens.add({ targets: breath, alpha: { from: 0.4, to: 1 }, scaleX: 1.06, scaleY: 1.06,
            duration: 3600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
        // A soft dark band so the menu is always readable on top of the picture.
        this.add.rectangle(W / 2, 420, W, 190, COLORS.bg, 0.45);
        art.setAlpha(0);
        this.tweens.add({ targets: art, alpha: 1, duration: 1200 });
        return;
      }

      // No art yet: draw a quiet title with a mirror seam and a flipped echo of the name.
      const seamH = 230, seamY = 150;
      [[22, 0.05], [12, 0.10], [6, 0.18]].forEach(([w, a]) => {
        const g = this.add.rectangle(W / 2, seamY, w, seamH, COLORS.cool, a);
        this.tweens.add({ targets: g, alpha: { from: 1, to: 0.5 }, duration: 2600, yoyo: true,
          repeat: -1, ease: "Sine.easeInOut" });
      });
      this.add.rectangle(W / 2, seamY, 2, seamH, 0xE8FFFB, 0.8);

      const logo = this.add.text(W / 2, 140, "MIRROR WORLD", {
        fontFamily: STORY_FONT, fontSize: "62px", color: COLORS.light
      }).setOrigin(0.5).setAlpha(0);
      const echo = this.add.text(W / 2, 200, "MIRROR WORLD", {
        fontFamily: STORY_FONT, fontSize: "62px", color: COLORS.silver
      }).setOrigin(0.5).setScale(1, -0.55).setAlpha(0);
      this.tweens.add({ targets: logo, alpha: 1, duration: 1400, delay: 300 });
      this.tweens.add({ targets: echo, alpha: 0.14, duration: 1800, delay: 700 });
    }

    // Slow floating dust over everything.
    drawDust() {
      for (let i = 0; i < 26; i++) {
        const d = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
          Phaser.Math.FloatBetween(1, 2.4), 0xF0E6D2, Phaser.Math.FloatBetween(0.08, 0.3)).setDepth(5);
        this.tweens.add({ targets: d, y: d.y - Phaser.Math.Between(40, 120), x: d.x + Phaser.Math.Between(-30, 30),
          alpha: 0, duration: Phaser.Math.Between(6000, 12000), delay: Phaser.Math.Between(0, 4000),
          repeat: -1, onRepeat: () => { d.x = Phaser.Math.Between(0, W); d.y = Phaser.Math.Between(H * 0.3, H); } });
      }
    }

    // ---- the menu
    items() {
      return [
        { label: this.afterTake ? "New Game — Sam" : "Start", act: () => this.start() },
        { label: "Settings", act: () => this.openPanel("settings") },
        { label: "Controls", act: () => this.openPanel("controls") },
        { label: "Credits", act: () => this.openPanel("credits") }
      ];
    }

    drawMenu() {
      const top = this.hasArt ? 352 : 318, gap = 38;
      this.rows = this.items().map((it, i) => {
        const t = this.add.text(W / 2, top + i * gap, it.label, {
          fontFamily: UI_FONT, fontSize: i === 0 ? "22px" : "18px", color: COLORS.light
        }).setOrigin(0.5).setDepth(10).setAlpha(0).setInteractive({ useHandCursor: true });
        t.on("pointerover", () => { if (!this.panel) { this.index = i; this.styleMenu(); } });
        t.on("pointerdown", () => { if (!this.panel) it.act(); });
        this.tweens.add({ targets: t, alpha: 1, duration: 700, delay: 900 + i * 120 });
        return t;
      });
      this.marker = this.add.text(0, 0, "◆", { fontFamily: UI_FONT, fontSize: "11px", color: COLORS.warm })
        .setOrigin(0.5).setDepth(10).setAlpha(0);
      this.tweens.add({ targets: this.marker, alpha: 1, duration: 700, delay: 900 });

      this.add.text(W / 2, H - 22, "↑ ↓ choose · Enter select · M mute", {
        fontFamily: UI_FONT, fontSize: "13px", color: COLORS.dim
      }).setOrigin(0.5).setDepth(10);
      this.styleMenu();
    }

    styleMenu() {
      this.rows.forEach((t, i) => t.setColor(i === this.index ? COLORS.silver : COLORS.light));
      const r = this.rows[this.index];
      this.marker.setPosition(r.x - r.width / 2 - 18, r.y);
    }

    start() {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(500, 20, 21, 38);
      this.cameras.main.once("camerafadeoutcomplete", () => startGame(this));
    }

    // ---- panels: Settings, Controls, Credits (Esc or Back to close)
    openPanel(kind) {
      this.closePanel();
      this.panel = kind;
      this.panelIndex = 0;
      this.drawPanel();
    }

    closePanel() {
      this.panelObjects.forEach(o => o.destroy());
      this.panelObjects = [];
      this.panel = null;
    }

    panelItems() {
      if (this.panel !== "settings") return [{ label: "Back", act: () => this.closePanel() }];
      const vol = Math.round(SETTINGS.volume * 100);
      return [
        { label: "Volume   " + vol + "%", adjust: d => this.setVolume(SETTINGS.volume + d * 0.1),
          act: () => this.setVolume(SETTINGS.volume >= 0.99 ? 0 : SETTINGS.volume + 0.1) },
        { label: "Sound   " + (SETTINGS.mute ? "Off" : "On"), act: () => { toggleMute(this); this.drawPanel(); } },
        { label: "Back", act: () => this.closePanel() }
      ];
    }

    setVolume(v) {
      SETTINGS.volume = Math.round(Math.max(0, Math.min(1, v)) * 10) / 10;
      if (SETTINGS.volume > 0) SETTINGS.mute = false;
      applySettings(this);
      this.drawPanel();
    }

    drawPanel() {
      this.panelObjects.forEach(o => o.destroy());
      const objs = this.panelObjects = [];
      const kind = this.panel;
      const titles = { settings: "Settings", controls: "Controls", credits: "Credits" };
      const bodies = {
        controls:
          "Arrows / WASD   move\n" +
          "(the other body moves the opposite way)\n" +
          "Z   undo        R   restart\n" +
          "Esc or P   pause menu        M   mute\n" +
          "Enter   continue",
        credits: storyText("credits")
      };
      const items = this.panelItems();
      const body = bodies[kind] || "";
      const bodyLines = body ? body.split("\n").length : 0;
      const pw = 520, ph = 120 + bodyLines * 26 + items.length * 44, px = W / 2 - pw / 2, py = H / 2 - ph / 2;

      objs.push(this.add.rectangle(W / 2, H / 2, W, H, 0x0B0C18, 0.7).setDepth(60).setInteractive());
      const g = this.add.graphics().setDepth(61);
      g.fillStyle(0x000000, 0.25).fillRoundedRect(px - 4, py + 6, pw + 8, ph + 4, 22);
      g.fillStyle(0x1C1D33, 0.98).fillRoundedRect(px, py, pw, ph, 20);
      g.lineStyle(2, COLORS.cool, 0.25).strokeRoundedRect(px, py, pw, ph, 20);
      objs.push(g);
      objs.push(this.add.text(W / 2, py + 40, titles[kind], {
        fontFamily: STORY_FONT, fontSize: "28px", color: COLORS.light
      }).setOrigin(0.5).setDepth(62));

      let y = py + 84;
      if (body) {
        objs.push(this.add.text(W / 2, y, body, {
          fontFamily: kind === "credits" ? STORY_FONT : UI_FONT, fontSize: "16px", color: COLORS.light,
          align: "center", lineSpacing: 8
        }).setOrigin(0.5, 0).setDepth(62));
        y += bodyLines * 26 + 14;
      }

      this.panelRows = items.map((it, i) => {
        const ry = y + 18 + i * 44;
        const hover = () => { this.panelIndex = i; this.stylePanel(); };
        const t = this.add.text(W / 2, ry, it.label, { fontFamily: UI_FONT, fontSize: "19px", color: COLORS.light })
          .setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });
        t.on("pointerover", hover);
        t.on("pointerdown", () => it.act());
        const parts = [t];
        if (it.adjust) {
          [[-1, "◀", W / 2 - 120], [1, "▶", W / 2 + 120]].forEach(([d, glyph, x]) => {
            const b = this.add.text(x, ry, glyph, { fontFamily: UI_FONT, fontSize: "20px", color: COLORS.light })
              .setOrigin(0.5).setDepth(62).setPadding(14, 6, 14, 6).setInteractive({ useHandCursor: true });
            b.on("pointerover", hover);
            b.on("pointerdown", () => it.adjust(d));
            parts.push(b);
          });
        }
        objs.push(...parts);
        return parts;
      });
      this.stylePanel();
    }

    stylePanel() {
      (this.panelRows || []).forEach((parts, i) =>
        parts.forEach(t => t.setColor(i === this.panelIndex ? COLORS.silver : COLORS.light)));
    }

    // ---- keys
    onKey(e) {
      if (e.repeat || this.leaving) return;
      const c = e.code;
      if (c === "KeyM") { toggleMute(this); if (this.panel === "settings") this.drawPanel(); return; }
      const up = c === "ArrowUp" || c === "KeyW", down = c === "ArrowDown" || c === "KeyS";
      const left = c === "ArrowLeft" || c === "KeyA", right = c === "ArrowRight" || c === "KeyD";
      const ok = c === "Enter" || c === "Space";

      if (this.panel) {
        const items = this.panelItems(), it = items[this.panelIndex];
        if (c === "Escape") return this.closePanel();
        if (up) this.panelIndex = (this.panelIndex + items.length - 1) % items.length;
        else if (down) this.panelIndex = (this.panelIndex + 1) % items.length;
        else if ((left || right) && it.adjust) return it.adjust(left ? -1 : 1);
        else if (ok) return it.act();
        else return;
        return this.stylePanel();
      }

      const items = this.items();
      if (up) this.index = (this.index + items.length - 1) % items.length;
      else if (down) this.index = (this.index + 1) % items.length;
      else if (ok) return items[this.index].act();
      else return;
      this.styleMenu();
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
      onKey(this, e => {
        if (e.code === "KeyM") { toggleMute(this); return; }
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

  // ---------------------------------------------------------------- Level (design v4)
  // v4: each body can be in either room (state.theo / state.other carry their side).
  // Cracks (%) swap the two bodies through the glass. Goals: H is Theo's (warm), D is the
  // other's (silver). Level 8 (final) ends the game: take, stay or break.
  class LevelScene extends Phaser.Scene {
    constructor() { super("Level"); }

    create(data) {
      this.levels = sortedLevels();
      this.index = data.index || 0;
      this.level = this.levels[this.index];
      this.busy = false;     // an animation is playing
      this.locked = false;   // won, failed or ended: waiting for the next load
      // Phaser reuses this scene object, so reset per-level things every time.
      this.doorSprites = [];
      this.crackSprites = {};
      this.textSlots = {};
      this.menuOpen = false;
      this.menuObjects = [];
      this.textThisTurn = false;
      this.failTimer = null;
      this.queued = null;

      // A restart arrives with the state that RESTART returned; otherwise a fresh level.
      this.state = data.state || Rules.load(this.level);
      const opening = (data.events && data.events.length) ? data.events : (this.state.startEvents || []);

      this.cameras.main.setBackgroundColor(COLORS.bg);
      this.layout();
      this.drawMap();
      this.drawCharacters();
      this.drawBars();

      this.mirror = { x: this.mirrorX, top: this.top, bottom: this.top + this.rows * TILE };
      fx("setup", this);
      fx("onLevelStart", this.level.number, this.level.act);

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

      const total = this.leftCols * TILE + STRIP + this.rightCols * TILE;
      this.leftX = Math.round((W - total) / 2);
      this.mirrorX = this.leftX + this.leftCols * TILE + STRIP / 2;
      this.rightX = this.leftX + this.leftCols * TILE + STRIP;

      // Optional level.instructions: small wrapped text just above the key bar, for the whole
      // level. Room is kept for it (and for hints) so it never covers the board.
      const GAP = 6, HINT_H = 20, boardH = this.rows * TILE;
      let reserve = 0;
      this.instrText = null;
      const words = this.level.instructions;
      if (typeof words === "string" && words.length) {
        for (const size of [15, 14, 13, 12]) {
          if (this.instrText) this.instrText.destroy();
          this.instrText = this.add.text(W / 2, H - BAR - GAP, words, {
            fontFamily: UI_FONT, fontSize: size + "px", color: COLORS.light,
            align: "center", lineSpacing: 2, wordWrap: { width: 900, useAdvancedWrap: true }
          }).setOrigin(0.5, 1).setAlpha(0.7).setDepth(21);
          reserve = this.instrText.height + GAP * 2 + HINT_H;
          if (boardH <= H - 2 * BAR - reserve - 4) break;
        }
      }
      const free = H - 2 * BAR - reserve - boardH;
      this.top = Math.round(BAR + Math.max(4, free / 2));
      this.hintY = this.instrText
        ? H - BAR - GAP - this.instrText.height - 4 - HINT_H / 2
        : H - BAR - 14;
    }

    tilePos(side, x, y) {
      const x0 = side === "left" ? this.leftX : this.rightX;
      return { x: x0 + x * TILE + TILE / 2, y: this.top + y * TILE + TILE / 2 };
    }

    // setDisplaySize, so any file size (128x128 or 32x32) shows at 64 px.
    image(side, x, y, key, layer) {
      const p = this.tilePos(side, x, y);
      const img = this.add.image(p.x, p.y, key).setDisplaySize(TILE, TILE);
      if (layer) layer.add(img);
      return img;
    }

    // A goal in its owner's colour (falls back to a tint if recolouring wasn't possible).
    goalImage(side, x, y, key, tint, layer) {
      if (this.textures.exists(key)) return this.image(side, x, y, key, layer);
      return this.image(side, x, y, "goal", layer).setTint(tint);
    }

    // Each half is its own rounded "screen" with a soft shadow; the tiles are clipped to it.
    drawMap() {
      const h = this.rows * TILE;
      const room = ROOMS[this.level.number];
      const floorKey = room && this.textures.exists("floor-" + room) ? "floor-" + room : "floor";
      const wallKey = room && this.textures.exists("wall-" + room) ? "wall-" + room : "wall";
      [["left", this.leftRows, this.leftX, this.leftCols], ["right", this.rightRows, this.rightX, this.rightCols]]
        .forEach(([side, rows, x0, cols]) => {
          const w = cols * TILE;

          const shadow = this.add.graphics().setDepth(-2);
          for (let i = 4; i >= 1; i--) {
            shadow.fillStyle(0x000000, 0.07)
              .fillRoundedRect(x0 - i * 3, this.top - i * 2 + 8, w + i * 6, h + i * 5, RADIUS + i * 3);
          }

          const layer = this.add.container(0, 0).setDepth(0);
          const maskShape = this.make.graphics({ add: false });
          maskShape.fillStyle(0xFFFFFF, 1).fillRoundedRect(x0, this.top, w, h, RADIUS);
          layer.setMask(maskShape.createGeometryMask());

          rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
              const ch = row[x];
              if (ch === " ") continue;
              if (ch === "#") { this.image(side, x, y, wallKey, layer); continue; }
              this.image(side, x, y, floorKey, layer);
              if (ch === "H") this.goalImage(side, x, y, "goal-theo", 0xE9B872, layer);        // Theo's goal
              else if (ch === "D") this.goalImage(side, x, y, "goal-other", 0x9FD6E0, layer);  // the other's goal
              else if (ch === "^") this.image(side, x, y, "spikes", layer);
              else if (ch === "a" || ch === "b") this.image(side, x, y, "plate", layer);
              else if (ch === "F") this.image(side, x, y, "frame", layer);
              else if (ch === "%") this.crackSprites[side + ":" + x + ":" + y] = this.image(side, x, y, "crack", layer);
              else if (ch === "A" || ch === "B") {
                this.doorSprites.push({ letter: ch, sprite: this.image(side, x, y, "door-closed", layer) });
              }
            }
          });

          this.add.graphics().setDepth(5)
            .lineStyle(2, COLORS.cool, 0.16).strokeRoundedRect(x0 + 1, this.top + 1, w - 2, h - 2, RADIUS);
        });
      this.refreshDoors();
      this.refreshCracks();
      this.drawSeam(h);
    }

    // The glowing seam down the middle of the 32 px mirror strip.
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

    // Theo is always theo.png. The other is the reflection in Acts 1–2 and Sam in Act 3.
    // Each is drawn in whichever room the state says, never assumed to be left or right.
    drawCharacters() {
      const t = this.state.theo, o = this.state.other;
      this.theo = this.image(t.side, t.x, t.y, "theo").setDepth(10);
      this.other = this.image(o.side, o.x, o.y, this.level.act === 3 ? "sam" : "reflection").setDepth(10);
    }

    drawBars() {
      this.add.rectangle(W / 2, BAR / 2, W, BAR, COLORS.bar, 0.85).setDepth(20);
      this.add.rectangle(W / 2, H - BAR / 2, W, BAR, COLORS.bar, 0.85).setDepth(20);
      const style = { fontFamily: UI_FONT, fontSize: "16px", color: COLORS.light };
      this.add.text(16, BAR / 2, "Level " + this.level.number + " · " + (this.level.name || ""), style)
        .setOrigin(0, 0.5).setDepth(21);
      // v4 bottom bar, plus the pause menu key.
      this.add.text(W / 2, H - BAR / 2, "Arrows move · Z undo · R restart · Esc menu", { ...style, color: COLORS.dim })
        .setOrigin(0.5).setDepth(21);
      this.hintText = this.add.text(W / 2, this.hintY, "", { ...style, color: COLORS.light, fontSize: "15px", fontStyle: "italic" })
        .setOrigin(0.5).setAlpha(0).setDepth(21);
    }

    refreshDoors() {
      const open = this.state.openDoors || [];
      this.doorSprites.forEach(d => d.sprite.setTexture(open.includes(d.letter) ? "door-open" : "door-closed"));
    }

    // A used crack is plain floor: hide its crack mark (it comes back after undo/restart).
    refreshCracks() {
      const used = this.state.usedCracks || [];
      Object.entries(this.crackSprites).forEach(([key, s]) => { s.setAlpha(1).setVisible(!used.includes(key)); });
    }

    // After UNDO: put everything straight where the state says (no slide).
    redraw() {
      const t = this.state.theo, o = this.state.other;
      const pt = this.tilePos(t.side, t.x, t.y), po = this.tilePos(o.side, o.x, o.y);
      this.theo.setPosition(pt.x, pt.y).setAlpha(1);
      this.other.setPosition(po.x, po.y).setAlpha(1);
      this.refreshDoors();
      this.refreshCracks();
    }

    // ---- keys (v4: arrows/WASD, Z, R, M; Esc or P opens the pause menu)
    setupKeys() {
      this.input.keyboard.addCapture("UP,DOWN,LEFT,RIGHT,SPACE");
      const map = {
        ArrowUp: "U", KeyW: "U", ArrowDown: "D", KeyS: "D",
        ArrowLeft: "L", KeyA: "L", ArrowRight: "R", KeyD: "R",
        KeyZ: "UNDO", KeyR: "RESTART"
      };
      onKey(this, e => {
        if (e.repeat) return;
        if (e.code === "Escape" || e.code === "KeyP") { this.menuOpen ? this.closeMenu() : this.openMenu(); return; }
        if (this.menuOpen) { this.menuKey(e.code); return; }
        if (e.code === "KeyM") { toggleMute(this); return; }
        const input = map[e.code];
        if (input) this.send(input);
      });
    }

    // ---- Pause menu (Esc or P): Resume, Restart level, Volume, Sound, Quit to title.
    menuItems() {
      const vol = Math.round(SETTINGS.volume * 100);
      return [
        { label: "Resume", act: () => this.closeMenu() },
        { label: "Restart level", act: () => { this.closeMenu(); this.send("RESTART"); } },
        { label: "Volume   ◀  " + vol + "%  ▶", value: "Volume   " + vol + "%",
          adjust: d => this.setVolume(SETTINGS.volume + d * 0.1),
          act: () => this.setVolume(SETTINGS.volume >= 0.99 ? 0 : SETTINGS.volume + 0.1) },
        { label: "Sound   " + (SETTINGS.mute ? "Off" : "On"), act: () => { toggleMute(this); this.drawMenu(); } },
        { label: "Quit to title", act: () => { this.closeMenu(); this.locked = true; this.scene.start("Title"); } }
      ];
    }

    setVolume(v) {
      SETTINGS.volume = Math.round(Math.max(0, Math.min(1, v)) * 10) / 10;
      if (SETTINGS.volume > 0) SETTINGS.mute = false;   // turning it up un-mutes
      applySettings(this);
      this.drawMenu();
    }

    openMenu() {
      this.menuOpen = true;
      this.menuIndex = 0;
      this.drawMenu();
    }

    closeMenu() {
      this.menuOpen = false;
      (this.menuObjects || []).forEach(o => o.destroy());
      this.menuObjects = [];
    }

    drawMenu() {
      (this.menuObjects || []).forEach(o => o.destroy());
      const objs = this.menuObjects = [];
      const items = this.menuItems();
      const pw = 380, ph = 120 + items.length * 46, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
      this.menuGeom = { px, pw, rowY: i => py + 100 + i * 46 };

      const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0B0C18, 0.72).setDepth(60).setInteractive();
      const panel = this.add.graphics().setDepth(61);
      panel.fillStyle(0x000000, 0.25).fillRoundedRect(px - 4, py + 6, pw + 8, ph + 4, 22);
      panel.fillStyle(0x1C1D33, 0.98).fillRoundedRect(px, py, pw, ph, 20);
      panel.lineStyle(2, COLORS.cool, 0.25).strokeRoundedRect(px, py, pw, ph, 20);
      this.menuHL = this.add.graphics().setDepth(61);
      objs.push(dim, panel, this.menuHL);

      objs.push(this.add.text(W / 2, py + 44, "Paused", {
        fontFamily: STORY_FONT, fontSize: "30px", color: COLORS.light
      }).setOrigin(0.5).setDepth(62));

      const style = { fontFamily: UI_FONT, fontSize: "19px", color: COLORS.light };
      this.menuRows = [];
      items.forEach((it, i) => {
        const y = this.menuGeom.rowY(i);
        // Hovering only moves the highlight (no redraw), so the next click always lands.
        const hover = () => { this.menuIndex = i; this.styleMenu(); };
        const row = this.add.text(W / 2, y, it.label, style).setOrigin(0.5).setDepth(62)
          .setInteractive({ useHandCursor: true });
        row.on("pointerover", hover);
        row.on("pointerdown", () => it.act());
        const parts = [row];
        if (it.adjust) {
          row.setText(it.value);
          [[-1, "◀", W / 2 - 120], [1, "▶", W / 2 + 120]].forEach(([d, glyph, x]) => {
            const b = this.add.text(x, y, glyph, { ...style, fontSize: "20px" }).setOrigin(0.5).setDepth(62)
              .setPadding(14, 6, 14, 6).setInteractive({ useHandCursor: true });
            b.on("pointerover", hover);
            b.on("pointerdown", () => it.adjust(d));
            parts.push(b);
          });
        }
        this.menuRows.push(parts);
        objs.push(...parts);
      });

      objs.push(this.add.text(W / 2, py + ph - 22, "↑ ↓ choose · Enter select · ← → volume · Esc close", {
        fontFamily: UI_FONT, fontSize: "12px", color: COLORS.dim
      }).setOrigin(0.5).setDepth(62));
      this.styleMenu();
    }

    styleMenu() {
      const g = this.menuGeom;
      this.menuHL.clear().fillStyle(COLORS.cool, 0.12)
        .fillRoundedRect(g.px + 24, g.rowY(this.menuIndex) - 19, g.pw - 48, 38, 12);
      this.menuRows.forEach((parts, i) =>
        parts.forEach(t => t.setColor(i === this.menuIndex ? COLORS.silver : COLORS.light)));
    }

    menuKey(code) {
      const items = this.menuItems();
      const it = items[this.menuIndex];
      if (code === "ArrowUp" || code === "KeyW") this.menuIndex = (this.menuIndex + items.length - 1) % items.length;
      else if (code === "ArrowDown" || code === "KeyS") this.menuIndex = (this.menuIndex + 1) % items.length;
      else if ((code === "ArrowLeft" || code === "KeyA") && it.adjust) return it.adjust(-1);
      else if ((code === "ArrowRight" || code === "KeyD") && it.adjust) return it.adjust(1);
      else if (code === "Enter" || code === "Space") return it.act();
      else if (code === "KeyM") { toggleMute(this); return this.drawMenu(); }
      else return;
      this.styleMenu();
    }

    // ---- sending input to the rules
    send(input) {
      if (this.locked) return;
      // A key pressed while a move is still sliding is remembered (one at most) and played next.
      if (this.busy) { this.queued = input; return; }
      this.queued = null;
      // After a fail, Z and R still work during the short pause: cancel the automatic restart.
      if (this.failTimer && (input === "UNDO" || input === "RESTART")) {
        this.failTimer.remove(false);
        this.failTimer = null;
      }
      this.textThisTurn = false;
      const res = Rules.step(this.state, input);
      if (!res || !res.state) return;
      // An input that does nothing comes back as the same state with no events: ignore it.
      if (res.state === this.state && !(res.events || []).length) return;

      if (input === "RESTART") return this.restartWith(res);

      this.state = res.state;
      this.busy = true;
      if (input === "UNDO") this.redraw();
      this.playEvents(res.events || []).then(() => this.afterEvents());
    }

    // A restart rebuilds the scene from the RESTART state, so Effects.setup runs again.
    restartWith(res) {
      this.locked = true;
      this.scene.restart({ index: this.index, state: res.state, events: res.events || [] });
    }

    afterEvents() {
      this.busy = false;
      // After a win or an ending, keys are ignored until the next level loads.
      // After a fail, Z and R still work until the automatic restart.
      if (["won", "ended"].includes(this.state.status)) this.locked = true;
      // Play a key that was pressed during the slide.
      const q = this.queued;
      this.queued = null;
      if (q && !this.locked && !this.menuOpen) this.send(q);
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

    sprite(who) { return who === "theo" ? this.theo : (who === "other" ? this.other : null); }

    tween(cfg) { return new Promise(res => this.tweens.add({ ...cfg, onComplete: res })); }

    wait(ms) { return new Promise(res => this.time.delayedCall(ms, res)); }

    handleEvent(ev) {
      switch (eventName(ev)) {
        case "move": {
          const s = this.sprite(ev.who);
          if (!s || !ev.to) return;
          const p = this.tilePos(ev.to.side, ev.to.x, ev.to.y);
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
        case "swap":
          return this.playSwap(ev);
        case "door":
          this.doorSprites.filter(d => d.letter === ev.letter)
            .forEach(d => d.sprite.setTexture(ev.open ? "door-open" : "door-closed"));
          return;
        case "moment":
          // blink / wave / tilt: always on the other body.
          fx("onMoment", ev.kind, this.other);
          return this.wait(250);
        case "text":
          return this.showText(ev.words, ev.side, ev.mirrored);
        case "hint":
          if (this.batchHasText) this.time.delayedCall(1100, () => this.showHint(ev.words));
          else this.showHint(ev.words);
          return;
        case "fail":
          // Pause 600 ms, then restart, unless the player presses Z or R first.
          this.failTimer = this.time.delayedCall(600, () => {
            this.failTimer = null;
            const res = Rules.step(this.state, "RESTART");
            if (res && res.state) this.restartWith(res);
          });
          return;
        case "win": {
          this.locked = true;
          fx("onWin");
          const next = this.levels[this.index + 1];
          // After Level 6 (end of Act 2): the swap scene first.
          const swapScene = next && this.level.act === 2 && next.act === 3;
          // Give a message that just appeared (like COME UPSTAIRS) time to be read.
          return this.wait(this.textThisTurn ? 2400 : 800).then(() => {
            if (!swapScene) return this.nextLevel();
            // Effects.onWin() fades the camera out, so bring the room back before TOGETHER.
            const cam = this.cameras.main;
            cam.resetFX();
            cam.fadeIn(400, 20, 21, 38);
            return this.wait(400)
              .then(() => Promise.all([this.showTogether(), this.walkFree()]))
              .then(() => this.nextLevel(["swap", "act3"]));
          });
        }
        case "ending":
          this.locked = true;
          if (ev.which === "take" || ev.which === "break") fx("onGlassBreak");
          return this.wait(this.textThisTurn ? 2400 : 1200).then(() => this.showEnding(ev.which));
        default:
          return;
      }
    }

    // A crack swaps the two bodies through the glass: a quick fade out and in at their new
    // places, the crack becomes floor, and C's onCrack plays at the crack's screen position.
    playSwap(ev) {
      const at = ev.at ? this.tilePos(ev.at.side, ev.at.x, ev.at.y) : { x: this.mirrorX, y: this.theo.y };
      fx("onCrack", at.x, at.y);
      return this.tween({ targets: [this.theo, this.other], alpha: 0, duration: 160 }).then(() => {
        if (ev.theo) { const p = this.tilePos(ev.theo.side, ev.theo.x, ev.theo.y); this.theo.setPosition(p.x, p.y); }
        if (ev.other) { const p = this.tilePos(ev.other.side, ev.other.x, ev.other.y); this.other.setPosition(p.x, p.y); }
        if (ev.at) { const c = this.crackSprites[ev.at.side + ":" + ev.at.x + ":" + ev.at.y]; if (c) c.setVisible(false); }
        return this.tween({ targets: [this.theo, this.other], alpha: 1, duration: 220 });
      });
    }

    // Swap scene: Mara walks free out of the real room while Theo is left, dimmed, behind the glass.
    walkFree() {
      const mara = this.other, theo = this.theo;
      const away = this.state.other && this.state.other.side === "left" ? -1 : 1;
      this.tweens.add({ targets: theo, alpha: 0.45, duration: 1400, ease: "Sine.easeInOut" });
      return this.tween({ targets: mara, x: mara.x + away * TILE * 1.5, alpha: 0, duration: 2000,
        delay: 500, ease: "Sine.easeIn" });
    }

    // After Level 6: TOGETHER fades onto the glass, then the swap card.
    showTogether() {
      const t = this.add.text(this.mirrorX, this.top + this.rows * TILE / 2, storyText("together") || "TOGETHER", {
        fontFamily: STORY_FONT, fontSize: "44px", color: COLORS.silver
      }).setOrigin(0.5).setAlpha(0).setDepth(30);
      fx("onMoment", "text", null, "TOGETHER");
      return this.tween({ targets: t, alpha: 1, duration: 700, hold: 1300, yoyo: true })
        .then(() => t.destroy());
    }

    // Writing fades onto misty glass on that side. Mirrored text is flipped left-to-right.
    showText(words, side, mirrored) {
      const left = side === "left";
      const cx = left ? this.leftX + this.leftCols * TILE / 2 : this.rightX + this.rightCols * TILE / 2;
      const cy = this.top + TILE * 0.55;
      if (this.textSlots[side]) this.textSlots[side].forEach(o => { this.tweens.killTweensOf(o); o.destroy(); });

      const t = this.add.text(cx, cy, words || "", {
        fontFamily: STORY_FONT, fontSize: "26px", color: COLORS.silver, align: "center",
        wordWrap: { width: (left ? this.leftCols : this.rightCols) * TILE - 24 }
      }).setOrigin(0.5).setAlpha(0).setDepth(16);
      if (mirrored) t.setScale(-1, 1);

      const mist = this.add.graphics().setAlpha(0).setDepth(15);
      mist.fillStyle(0xF0E6D2, 0.10).fillRoundedRect(cx - t.width / 2 - 20, cy - t.height / 2 - 10, t.width + 40, t.height + 20, 14);

      this.textSlots[side] = [t, mist];
      this.textThisTurn = true;
      fx("onMoment", "text", null, words);   // C picks the voice line from the words
      this.tweens.add({ targets: [t, mist], alpha: 1, duration: 700, hold: 3000, yoyo: true,
        onComplete: () => { t.destroy(); mist.destroy(); } });
      return this.wait(60);   // don't hold up the player's next key
    }

    showHint(words) {
      this.tweens.killTweensOf(this.hintText);
      this.hintText.setText(words || "").setAlpha(0);
      this.tweens.add({ targets: this.hintText, alpha: 1, duration: 500, hold: 3500, yoyo: true });
    }

    // An ending's screen, then the credits, then the title.
    // After Take Their Place the title says "New Game — Sam".
    showEnding(which) {
      this.locked = true;
      const card = { take: "endingTake", break: "endingBreak", stay: "endingStay" }[which];
      const cards = card ? [card, "credits"] : ["credits"];
      this.scene.start("Story", { cards, next: { scene: "Title", data: { after: which } } });
    }

    // Go to the next level. When the act changes, its story card comes first.
    nextLevel(cardsOverride) {
      const next = this.levels[this.index + 1];
      let cards = cardsOverride || [];
      if (!cardsOverride && next && next.act !== this.level.act) cards = ["act" + next.act];

      const target = next ? { scene: "Level", data: { index: this.index + 1 } } : { scene: "End", data: {} };
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
      let gone = false;
      onKey(this, e => { if (e.code === "Enter" && !gone) { gone = true; this.scene.start("Title"); } });
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