// Mirror World (Aaina) — effects (Person C), design v4
// Phaser 3.90, plain JavaScript. Nothing here may crash if something is missing.

const Effects = {
  scene: null,
  _objs: [],
  _tweens: [],
  _updaters: [],
  _onUpdate: null,

  // ---------- Helpers ----------
  _keep(obj) { if (obj) this._objs.push(obj); return obj; },
  _keepTween(t) { if (t) this._tweens.push(t); return t; },

  _try(name, fn) {
    try { fn(); } catch (e) { console.warn('Effects ' + name + ' skipped:', e); }
  },

  _clear() {
    this._tweens.forEach(t => { try { t.stop(); } catch (e) {} });
    this._objs.forEach(o => { try { o.destroy(); } catch (e) {} });
    if (this.scene && this._onUpdate) this.scene.events.off('update', this._onUpdate);
    this._objs = []; this._tweens = []; this._updaters = []; this._onUpdate = null;
  },

  // Plays a sound only if it was loaded
  _play(key, config) {
    const s = this.scene;
    if (!s || !s.cache || !s.cache.audio.exists(key)) return;
    try { s.sound.play(key, config); } catch (e) {}
  },

  // Removes a temporary object later, quietly
  _later(ms, obj) {
    const s = this.scene;
    if (!s || !obj) return;
    s.time.delayedCall(ms, () => { try { obj.destroy(); } catch (e) {} });
  },

  _canvas(key, w, h, draw, smooth) {
    const s = this.scene;
    if (s.textures.exists(key)) return;
    const tex = s.textures.createCanvas(key, w, h);
    if (!tex) return;
    draw(tex.getContext(), w, h);
    tex.refresh();
    if (smooth) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  },

  _makeTextures() {
    this._canvas('fx-light', 320, 320, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(233,184,114,0.45)');
      g.addColorStop(0.35, 'rgba(233,184,114,0.16)');
      g.addColorStop(1, 'rgba(233,184,114,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, true);

    this._canvas('fx-vignette', 512, 512, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(17,20,28,0)');
      g.addColorStop(0.55, 'rgba(17,20,28,0)');
      g.addColorStop(1, 'rgba(17,20,28,0.75)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, true);

    this._canvas('fx-grain', 128, 128, (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }, false);

    this._canvas('fx-sheen', 32, 160, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(159,214,224,0)');
      g.addColorStop(0.5, 'rgba(159,214,224,0.35)');
      g.addColorStop(1, 'rgba(159,214,224,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, true);

    if (!this.scene.textures.exists('fx-dot')) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff); g.fillCircle(3, 3, 3);
      g.generateTexture('fx-dot', 6, 6);
      g.destroy();
    }
  },

  // ---------- C3: light and mood ----------
  setup(scene) {
    if (!scene) return;
    if (this.scene === scene) this._clear();
    else { this._objs = []; this._tweens = []; this._updaters = []; this._onUpdate = null; }
    this.scene = scene;

    const w = scene.scale.width, h = scene.scale.height;
    this._try('textures', () => this._makeTextures());
    this._try('light', () => this._setupLight());
    this._try('dust', () => this._setupDust(w, h));
    this._try('mirror', () => this._setupMirror());
    this._try('edges', () => this._setupVignette(w, h));
    this._try('grain', () => this._setupGrain(w, h));

    this._onUpdate = (time) => this._updaters.forEach(fn => { try { fn(time); } catch (e) {} });
    scene.events.on('update', this._onUpdate);
    scene.events.once('shutdown', () => this._clear());
  },

  _setupLight() {
    const s = this.scene, theo = s.theo;
    if (!theo) return;
    const glow = this._keep(s.add.image(theo.x, theo.y, 'fx-light')
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(5));
    let next = 0;
    this._updaters.push((time) => {
      if (!theo.active) return;
      glow.setPosition(theo.x, theo.y);
      if (time >= next) {           // steps about 12 times a second, like hand-animated film
        next = time + 83;
        glow.setScale(1 + Math.sin(time / 700) * 0.03 + (Math.random() - 0.5) * 0.04);
        glow.setAlpha(0.85 + (Math.random() - 0.5) * 0.08);
      }
    });
  },

  _setupDust(w, h) {
    const s = this.scene;
    const dust = this._keep(s.add.particles(0, 0, 'fx-dot', {
      x: { min: 0, max: w }, y: { min: 0, max: h },
      lifespan: { min: 6000, max: 10000 },
      speedX: { min: -5, max: 5 }, speedY: { min: -6, max: -1 },
      scale: { min: 0.3, max: 0.8 },
      alpha: { start: 0.35, end: 0 },
      tint: 0xEAE4D6, blendMode: 'ADD',
      frequency: 350, quantity: 1
    }));
    dust.setDepth(800);
    if (dust.fastForward) dust.fastForward(6000);
  },

  _setupMirror() {
    const s = this.scene, m = s.mirror;
    if (!m) return;
    const strip = 32, hgt = m.bottom - m.top, mid = (m.top + m.bottom) / 2;

    const glow = this._keep(s.add.rectangle(m.x, mid, strip, hgt, 0x9FD6E0, 1)
      .setAlpha(0.05).setDepth(6));
    this._keepTween(s.tweens.add({ targets: glow, alpha: 0.12, duration: 2600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));

    const sheen = this._keep(s.add.image(m.x, m.top - 80, 'fx-sheen')
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(7));
    const shape = this._keep(s.make.graphics({ x: 0, y: 0, add: false }));
    shape.fillStyle(0xffffff); shape.fillRect(m.x - strip / 2, m.top, strip, hgt);
    sheen.setMask(shape.createGeometryMask());
    this._keepTween(s.tweens.add({ targets: sheen, y: m.bottom + 80, duration: 4500,
      repeat: -1, repeatDelay: 3000, ease: 'Sine.easeInOut' }));
  },

  _setupVignette(w, h) {
    this._keep(this.scene.add.image(w / 2, h / 2, 'fx-vignette')
      .setDisplaySize(w, h).setDepth(900));
  },

  _setupGrain(w, h) {
    const grain = this._keep(this.scene.add.tileSprite(0, 0, w, h, 'fx-grain')
      .setOrigin(0, 0).setAlpha(0.035).setDepth(950));
    let next = 0;
    this._updaters.push((time) => {
      if (time >= next) {
        next = time + 80;
        grain.tilePositionX = Math.random() * 128;
        grain.tilePositionY = Math.random() * 128;
      }
    });
  },

  // ---------- v4: swapping through the glass ----------

  // A crack was stepped on and the two swapped places: sparkle, ripple along the mirror, sound
  onCrack(x, y) {
    const s = this.scene;
    if (!s) return;
    this._try('swap sparkle', () => {
      const sparkle = s.add.particles(x, y, 'fx-dot', {
        speed: { min: 20, max: 70 }, angle: { min: 0, max: 360 },
        lifespan: { min: 450, max: 850 }, scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 }, tint: [0xDDF3F7, 0x9FD6E0], blendMode: 'ADD', emitting: false
      }).setDepth(9);
      sparkle.explode(16);
      this._later(1100, sparkle);

      const ring = s.add.circle(x, y, 8, 0x9FD6E0, 0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      s.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 500, ease: 'Sine.easeOut',
                     onComplete: () => { try { ring.destroy(); } catch (e) {} } });
    });
    this._try('mirror ripple', () => {
      const m = s.mirror;
      if (!m) return;
      const hgt = m.bottom - m.top, mid = (m.top + m.bottom) / 2;
      // the whole strip brightens softly
      const glow = s.add.rectangle(m.x, mid, 32, hgt, 0x9FD6E0, 1).setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
      s.tweens.add({ targets: glow, alpha: 0.28, duration: 220, yoyo: true, hold: 120,
                     onComplete: () => { try { glow.destroy(); } catch (e) {} } });
      // two bands run up and down the mirror from the crack's height
      const fromY = Phaser.Math.Clamp(y, m.top, m.bottom);
      [m.top, m.bottom].forEach(toY => {
        const band = s.add.rectangle(m.x, fromY, 40, 46, 0xDDF3F7, 0.35)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
        s.tweens.add({ targets: band, y: toY, alpha: 0, scaleX: 0.6, duration: 550, ease: 'Sine.easeOut',
                       onComplete: () => { try { band.destroy(); } catch (e) {} } });
      });
    });
    this._play('crack', { volume: 0.4 });
  },

  // Take Their Place and Break It Together: the mirror bursts into soft light
  onGlassBreak() {
    const s = this.scene;
    if (!s) return;
    this._try('glass break', () => {
      const m = s.mirror;
      if (m) {
        for (let i = 0; i < 6; i++) {
          const y = m.top + (m.bottom - m.top) * (i + 0.5) / 6;
          const burst = s.add.particles(m.x, y, 'fx-dot', {
            speed: { min: 40, max: 140 }, angle: { min: 0, max: 360 },
            lifespan: { min: 900, max: 1400 }, scale: { start: 0.9, end: 0 },
            alpha: { start: 0.9, end: 0 }, tint: [0xDDF3F7, 0x9FD6E0, 0xEAE4D6],
            blendMode: 'ADD', emitting: false
          }).setDepth(9);
          burst.explode(14);
          this._later(1600, burst);
        }
      }
      const w = s.scale.width, h = s.scale.height;
      const flash = s.add.rectangle(w / 2, h / 2, w, h, 0xEAE4D6, 1).setAlpha(0).setDepth(960);
      s.tweens.add({ targets: flash, alpha: 0.35, duration: 180, yoyo: true, hold: 60,
                     ease: 'Sine.easeOut', onComplete: () => { try { flash.destroy(); } catch (e) {} } });
    });
    this._play('break', { volume: 0.4 });
  },

  // ---------- Moments, colour and sound ----------
  _music: null,

  // Briefly lowers the music, then brings it back
  _dip() {
    const s = this.scene, mu = this._music;
    if (!s || !mu || !mu.isPlaying) return;
    this._try('dip', () => {
      s.tweens.add({ targets: mu, volume: 0.05, duration: 250, yoyo: true, hold: 700 });
    });
  },

  // Remembers a sprite's normal size so moments always return to it
  _base(body) {
    if (body._mwBase === undefined) body._mwBase = { sx: body.scaleX, sy: body.scaleY, angle: body.angle };
    return body._mwBase;
  },

  // How grey Theo is on each level: full colour 1-3, fading 4-6, faded 7-8
  _greyFor(level) {
    if (level <= 3) return 0;
    if (level >= 7) return 0.6;
    return (level - 3) * 0.2;
  },

  _setColour(body, grey, bright) {
    if (!body || !body.preFX) return;               // only works in WebGL; skip quietly otherwise
    this._try('colour', () => {
      if (!body._mwFx) body._mwFx = body.preFX.addColorMatrix();
      const fx = body._mwFx;
      fx.reset();
      if (grey > 0) fx.saturate(-grey);
      if (bright > 0) fx.brightness(1 + bright, true);
    });
  },

  onLevelStart(level, act) {
    const s = this.scene;
    if (!s) return;
    this._try('fade in', () => s.cameras.main.fadeIn(700, 17, 20, 28));

    // Theo fades toward grey through Act 2 while the reflection brightens
    this._setColour(s.theo, this._greyFor(level), 0);
    if (level >= 4 && level <= 6) this._setColour(s.other, 0, (level - 3) * 0.08);

    // Music: Theo's theme in Acts 1-2, Sam's theme in Act 3 (silent if the file is missing)
    this._try('music', () => {
      const key = act === 3 ? 'theme-sam' : 'theme-theo';
      if (!s.cache.audio.exists(key)) {
        if (this._music) { try { this._music.stop(); } catch (e) {} this._music = null; }
        return;
      }
      if (!this._music || this._music.key !== key || !this._music.isPlaying) {
        if (this._music) { try { this._music.stop(); this._music.destroy(); } catch (e) {} }
        this._music = s.sound.add(key, { loop: true, volume: 0.25 });
        this._music.play();
      }
    });
  },

  onMove(body) {
    const s = this.scene;
    if (!s) return;
    this._play('step', { volume: 0.2, rate: 0.9 + Math.random() * 0.2 });
    if (!body) return;
    this._try('dust puff', () => {
      const puff = s.add.particles(body.x, body.y + body.displayHeight * 0.35, 'fx-dot', {
        speed: { min: 8, max: 22 }, angle: { min: 180, max: 360 },
        lifespan: { min: 300, max: 500 }, scale: { start: 0.6, end: 0 },
        alpha: { start: 0.4, end: 0 }, tint: 0xEAE4D6, emitting: false
      }).setDepth(9);
      puff.explode(5);
      this._later(700, puff);
    });
  },

  // Which voice line goes with which words (only if that sound was loaded)
  _voices: {
    "IM SORRY": 'voice-im-sorry',
    "LET ME OUT": 'voice-let-me-out',
    "IT HAS TO BE SOMEONE": 'voice-it-has-to-be-someone',
    "TOGETHER": 'voice-together',
    "IS SOMEONE THERE": 'voice-is-someone-there',
    "COME UPSTAIRS": 'voice-come-upstairs',
    "I CAN SEE YOU": 'voice-i-can-see-you'
  },

  _voiceFor(words) {
    if (typeof words !== 'string') return null;
    const k = words.toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim();
    const key = this._voices[k];
    const s = this.scene;
    return key && s && s.cache.audio.exists(key) ? key : null;
  },

  // Moments: blink, wave, tilt and text. For text, B may pass the words as a third argument
  onMoment(type, body, words) {
    const s = this.scene;
    if (!s) return;

    const voice = type === 'text' ? this._voiceFor(words) : null;
    const hasText = type === 'text' && s.cache.audio.exists('text');
    this._play(hasText ? 'text' : 'moment', { volume: voice ? 0.2 : (hasText ? 0.35 : 0.25) });
    if (voice) this._play(voice, { volume: 0.7 });
    this._dip();

    this._try('moment ' + type, () => {
      if (type === 'blink' && body) {                 // a quick squash
        const b = this._base(body);
        s.tweens.add({ targets: body, scaleY: b.sy * 0.85, duration: 90, yoyo: true,
                       onComplete: () => body.setScale(b.sx, b.sy) });
      }
      else if (type === 'wave' && body) {             // a small side-to-side sway
        const b = this._base(body);
        s.tweens.chain({ targets: body, tweens: [
          { angle: b.angle + 6, duration: 160 }, { angle: b.angle - 6, duration: 220 },
          { angle: b.angle + 4, duration: 200 }, { angle: b.angle, duration: 160 }
        ] });
      }
      else if (type === 'tilt' && body) {             // a slight head tilt
        const b = this._base(body);
        s.tweens.add({ targets: body, angle: b.angle + 10, duration: 260, yoyo: true, hold: 500,
                       ease: 'Sine.easeInOut' });
      }
      else if (type === 'text') {                     // a soft mist puff on the glass (B draws the words)
        const m = s.mirror;
        if (!m) return;
        const mist = s.add.particles(m.x, (m.top + m.bottom) / 2, 'fx-dot', {
          x: { min: -90, max: 90 }, y: { min: -60, max: 60 },
          speed: { min: 2, max: 10 }, lifespan: { min: 1200, max: 1800 },
          scale: { start: 3, end: 6 }, alpha: { start: 0.12, end: 0 },
          tint: 0xDDF3F7, blendMode: 'ADD', emitting: false
        }).setDepth(9);
        mist.explode(14);
        this._later(2000, mist);
      }
    });
  },

  onWin() {
    const s = this.scene;
    if (!s) return;
    this._play('win', { volume: 0.35 });
    this._try('win', () => {
      [s.theo, s.other].forEach(body => {
        if (!body) return;
        const glow = s.add.image(body.x, body.y, 'fx-light').setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(body.depth - 1).setScale(0.5).setAlpha(0);
        s.tweens.add({ targets: glow, alpha: 0.8, scale: 1, duration: 400, yoyo: true,
                       onComplete: () => { try { glow.destroy(); } catch (e) {} } });
      });
      s.cameras.main.fadeOut(750, 17, 20, 28);
    });
  }
};
