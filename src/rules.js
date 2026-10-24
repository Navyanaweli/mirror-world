// Rules (Person A). The game's brain: no graphics, just state in, state out.
// Follows the Shared contracts (Claude Playbook) with Design Update v3 on top.
// Step A2: mirror rule, walls, goals, UNDO, RESTART, carry.
// Step A3: plates, doors and spikes (v3: no boxes).
// Step A4: the glass (cracks, glassBreak), tile triggers, disobeys, Look, Mercy,
//          slip, lag and the Level 5 undo lock.
// Step A7: Act 3 (Sam's route, Follow/Resist/Break, Will, Sam's Look, footprints,
//          Theo's message) and the Level 8 smash and swap.
// Still to come: A10 Level 12 endings.
const Rules = (function () {

  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  // Team change after v3: the reflection does the full opposite (left/right and up/down swap).
  const MIRROR = { U: "D", D: "U", L: "R", R: "L" };
  const DEFAULT_CARRY = { cracks: 0, mercy: 0, undoLockUsed: false };
  // Door letter -> the plate that holds it open.
  const PLATES = { A: "a", B: "b" };

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // Split each map row at "|" into the real room (left) and the mirror room (right).
  function splitMap(map) {
    return {
      left: map.map(row => row.split("|")[0] || ""),
      right: map.map(row => row.split("|")[1] || "")
    };
  }

  function find(rows, ch) {
    for (let y = 0; y < rows.length; y++) {
      const x = rows[y].indexOf(ch);
      if (x !== -1) return { x, y };
    }
    return null;
  }

  // The start letters become plain floor once the bodies are placed.
  function clearStart(rows, ch) {
    return rows.map(row => row.split(ch).join("."));
  }

  // Anything outside the map counts as wall.
  function tileAt(rows, x, y) {
    if (y < 0 || y >= rows.length) return "#";
    const row = rows[y];
    if (x < 0 || x >= row.length) return "#";
    return row[x];
  }

  function isSolid(state, tile) {
    if (tile === "#") return true;
    // Doors block like walls while closed.
    if (PLATES[tile]) return state.openDoors.indexOf(tile) === -1;
    return false;
  }

  function onTile(rows, body, ch) {
    return tileAt(rows, body.x, body.y) === ch;
  }

  function onEither(state, ch) {
    return onTile(state._left, state.person, ch) || onTile(state._right, state.reflection, ch);
  }

  // Door A is open while anyone stands on plate a, on either side.
  // A door never closes on someone standing in it. Sends a door event for each change.
  function updateDoors(state, events) {
    const open = [];
    Object.keys(PLATES).forEach(letter => {
      const wasOpen = state.openDoors.indexOf(letter) !== -1;
      const held = onEither(state, PLATES[letter]);
      const someoneInDoorway = onEither(state, letter);
      const isOpen = held || (wasOpen && someoneInDoorway);
      if (isOpen) open.push(letter);
      if (events && isOpen !== wasOpen) events.push({ type: "door", letter: letter, open: isOpen });
    });
    state.openDoors = open;
  }

  // ---------- The glass ----------

  function addCrack(state, events) {
    state.cracks += 1;
    events.push({ type: "crack", cracks: state.cracks });
    if (state.cracks >= 5) breakGlass(state, events);
  }

  // The glass breaks and is whole again.
  function breakGlass(state, events) {
    state.cracks = 0;
    events.push({ type: "glassBreak" });
  }

  // ---------- Script events ----------

  function fire(state, ev, events) {
    switch (ev.do) {
      case "blink":
      case "wave":
      case "tilt":
      case "shimmer":
      case "strain":
        events.push({ type: "moment", kind: ev.do, who: "reflection" });
        break;
      case "text":
        events.push({
          type: "text",
          words: ev.words || "",
          side: ev.side === "left" ? "left" : "right",
          mirrored: ev.mirrored !== false
        });
        break;
      case "hint":
        events.push({ type: "hint", words: ev.words || "" });
        break;
      case "disobey":
        // v3: the warning comes now, the disobey on the next move. dir lets the
        // screen show which way the glitch will pull.
        if (ev.warn) events.push({ type: "moment", kind: "shimmer", who: "reflection", dir: ev.dir });
        state._pending = { dir: ev.dir, kind: ev.kind === "required" ? "required" : "stoppable" };
        break;
      case "slip":
        state.slipTurns = ev.turns || 1;
        events.push({ type: "moment", kind: "slip", who: "reflection" });
        break;
      case "undoLock":
        // Once per playthrough: from here, UNDO can't go back past this point.
        if (!state.carry.undoLockUsed) state._undoFloor = state._history.length;
        break;
    }
  }

  // Fire every event whose trigger matches and that hasn't fired yet this attempt.
  function fireMatching(state, events, matches) {
    state._events.forEach((ev, i) => {
      if (state._fired.indexOf(i) !== -1 || !matches(ev)) return;
      state._fired.push(i);
      fire(state, ev, events);
    });
  }

  // v3 tile trigger: at: { who, x, y }, in that character's half.
  function standsOn(state, at) {
    if (!at || typeof at !== "object") return false;
    const body = at.who === "reflection" ? state.reflection : state.person;
    return body.x === at.x && body.y === at.y;
  }

  // Glitch tiles B draws: every tile disobey still waiting to fire this attempt.
  function updateGlitches(state) {
    state.glitches = [];
    state._events.forEach((ev, i) => {
      if (ev.do !== "disobey" || !ev.at || typeof ev.at !== "object") return;
      if (state._fired.indexOf(i) !== -1) return;
      state.glitches.push({
        who: ev.at.who === "person" ? "person" : "reflection",
        x: ev.at.x, y: ev.at.y, dir: ev.dir,
        kind: ev.kind === "required" ? "required" : "stoppable"
      });
    });
  }

  // ---------- Act 3 helpers ----------

  // Where a body ends up after one step, or null if something blocks it.
  function stepTo(state, rows, body, dir) {
    if (!dir || !DIRS[dir]) return null;
    const to = { x: body.x + DIRS[dir][0], y: body.y + DIRS[dir][1] };
    return isSolid(state, tileAt(rows, to.x, to.y)) ? null : to;
  }

  // samLooking (the eye icon) and Sam's next 3 footprints, for B to draw.
  function updateSamView(state) {
    if (state.status !== "playing") {
      state.samLooking = false;
      state.footprints = [];
      return;
    }
    state.samLooking = state._samLooks.indexOf(state.turn + 1) !== -1;
    const steps = [];
    let pos = { x: state.person.x, y: state.person.y };
    for (let t = state.turn + 1; t <= state.turn + 3 && t <= state._route.length; t++) {
      pos = stepTo(state, state._left, pos, state._route[t - 1]) || pos;
      steps.push({ x: pos.x, y: pos.y, glow: t === state._frameTurn });
    }
    state.footprints = steps;
  }

  // ---------- State helpers ----------

  // A deep copy of the state for the history: everything except the history itself.
  function snapshot(state) {
    const s = {};
    Object.keys(state).forEach(k => {
      if (k !== "_history" && k !== "_start") s[k] = state[k];
    });
    return copy(s);
  }

  // Build a fresh state from a snapshot. Snapshots are shared, never changed.
  function restore(snap, start, history) {
    const s = copy(snap);
    s._start = start;
    s._history = history;
    s.startEvents = [];
    return s;
  }

  // A new state that matches the old one (step never changes the state it's given).
  function unchanged(old) {
    return { state: restore(snapshot(old), old._start, old._history), events: [] };
  }

  // ---------- Rules.load ----------

  function load(level, carry) {
    const halves = splitMap(level.map || []);
    const act = level.act || 1;
    const inCarry = Object.assign({}, DEFAULT_CARRY, carry ? copy(carry) : {});
    // Cracks carry across Act 2 (one night). Acts 1 and 3 start at 0.
    const cracks = act === 2 ? (inCarry.cracks || 0) : 0;

    const state = {
      act: act,
      person: find(halves.left, "T") || { x: 1, y: 1 },
      reflection: find(halves.right, "R") || { x: 1, y: 1 },
      boxes: [],                  // v3: boxes are cut, always empty
      openDoors: [],
      map: copy(level.map || []),
      turn: 0,
      cracks: cracks,
      will: act === 3 ? (level.will || 0) : null,
      look: level.look === true,
      samLooking: false,
      footprints: [],
      slipTurns: 0,
      status: "playing",
      ending: null,
      glitches: [],               // team change: [{who, x, y, dir, kind}] tiles that will glitch
      carry: {
        cracks: cracks,
        mercy: inCarry.mercy || 0,
        undoLockUsed: !!inCarry.undoLockUsed
      },
      startEvents: [],
      _left: clearStart(halves.left, "T"),
      _right: clearStart(halves.right, "R"),
      _events: copy(level.events || []),
      _fired: [],                 // indexes of events fired this attempt
      _pending: null,             // a disobey due on the next move: { dir, kind }
      _lag: level.lag || 0,
      _moves: [],                 // Theo's move each turn (null = stood still), for lag
      _undoFloor: null,           // UNDO can't go below this history length
      _lookedAtRequired: false,   // Look cancelled a required disobey: hint after RESTART
      _swap: level.swap === true, // Level 8: winning smashes the glass
      _final: level.final === true,
      _route: String(level.samRoute || "").trim().split(/\s+/).filter(Boolean),
      _samLooks: (level.samLooks || []).slice(),
      _frameTurn: level.frameTurn || null,
      _message: level.message || null
    };
    state._history = [];
    updateDoors(state, null);   // in case someone starts on a plate
    fireMatching(state, state.startEvents, ev => ev.at === "start");
    updateGlitches(state);
    if (act === 3) updateSamView(state);
    state._start = snapshot(state);
    return state;
  }

  // ---------- Rules.step ----------

  // One turn in Acts 1-2. input is "U"/"D"/"L"/"R", or "LOOK" (Theo stares, the reflection freezes).
  // Turn order: work out both moves, move both at once, plates and doors,
  // cracks, spikes, goals, then this turn's script events.
  function takeTurn(old, input) {
    const state = restore(snapshot(old), old._start, old._history.concat([snapshot(old)]));
    const events = [];
    const look = input === "LOOK";
    state.turn += 1;

    // Work out both moves.
    let personDir = null;
    let reflDir = null;
    const slipping = state.slipTurns > 0;
    if (slipping) {
      // Slip: the keys move the reflection, and Theo mirrors it.
      state.slipTurns -= 1;
      if (!look) {
        reflDir = input;
        personDir = MIRROR[input];
      }
    } else if (!look) {
      personDir = input;
      reflDir = MIRROR[input];
    }

    // Lag N: the reflection mirrors Theo's move from N turns ago, and stays still
    // for the first N turns. Looks and blocked moves still count as turns.
    state._moves.push(personDir);
    if (state._lag > 0 && !look && !slipping) {
      const past = state._moves[state._moves.length - 1 - state._lag];
      reflDir = past ? MIRROR[past] : null;
    }

    // A disobey due now: the reflection moves its own way, unless Theo looks.
    let disobeyed = false;
    if (state._pending) {
      const due = state._pending;
      state._pending = null;
      if (look) {
        if (due.kind === "required") state._lookedAtRequired = true;
      } else {
        reflDir = due.dir;
        disobeyed = true;
        if (due.kind === "stoppable") state.carry.mercy += 1;
      }
    }

    // Move both at once.
    const moves = [
      { who: "person", rows: state._left, dir: personDir },
      { who: "reflection", rows: state._right, dir: reflDir }
    ].filter(m => m.dir && DIRS[m.dir]);
    moves.forEach(m => {
      const body = state[m.who];
      const d = DIRS[m.dir];
      const to = { x: body.x + d[0], y: body.y + d[1] };
      m.to = isSolid(state, tileAt(m.rows, to.x, to.y)) ? null : to;
    });
    moves.forEach(m => {
      if (m.to) {
        state[m.who] = m.to;
        events.push({ type: "move", who: m.who, to: { x: m.to.x, y: m.to.y } });
      } else {
        events.push({ type: "blocked", who: m.who });
      }
    });

    updateDoors(state, events);

    if (disobeyed) addCrack(state, events);

    if (onEither(state, "^")) {
      state.status = "failed";
      events.push({ type: "fail", reason: "spikes" });
    } else if (onTile(state._left, state.person, "G") && onTile(state._right, state.reflection, "G")) {
      // Win: both stand on their goal at the same moment.
      state.status = "won";
      if (state._swap) {
        // Level 8: Theo smashes the mirror and they swap places.
        breakGlass(state, events);
        events.push({ type: "swap" });
      } else {
        events.push({ type: "win" });
      }
    }

    if (state.status !== "failed") {
      fireMatching(state, events, ev => standsOn(state, ev.at));
    }

    updateGlitches(state);
    state.carry.cracks = state.cracks;
    return { state, events };
  }

  // One turn in Act 3. Sam takes the next samRoute step whatever the input.
  // Theo: FOLLOW mirrors Sam's step, RESIST stays still, an arrow is Break (his own way).
  // Resist and Break cost 1 Will and add 1 crack; with 0 Will they act like Follow.
  function takeAct3Turn(old, input) {
    const state = restore(snapshot(old), old._start, old._history.concat([snapshot(old)]));
    const events = [];
    state.turn += 1;

    const samDir = state._route[state.turn - 1] || null;
    let choice = input === "RESIST" ? "resist" : (DIRS[input] ? "break" : "follow");
    if (choice !== "follow" && state.will <= 0) choice = "follow";
    const theoDir = choice === "follow" ? (samDir ? MIRROR[samDir] : null) : (choice === "break" ? input : null);

    // Move both at once.
    const moves = [
      { who: "person", rows: state._left, dir: samDir },
      { who: "reflection", rows: state._right, dir: theoDir }
    ].filter(m => m.dir && DIRS[m.dir]);
    moves.forEach(m => { m.to = stepTo(state, m.rows, state[m.who], m.dir); });
    moves.forEach(m => {
      if (m.to) {
        state[m.who] = m.to;
        events.push({ type: "move", who: m.who, to: { x: m.to.x, y: m.to.y } });
      } else {
        events.push({ type: "blocked", who: m.who });
      }
    });

    updateDoors(state, events);

    const disobeyed = choice !== "follow";
    if (disobeyed) {
      state.will -= 1;
      const shimmer = { type: "moment", kind: "shimmer", who: "reflection" };
      if (choice === "break") shimmer.dir = input;
      events.push(shimmer);
      addCrack(state, events);
    }

    if (onEither(state, "^")) {
      state.status = "failed";
      events.push({ type: "fail", reason: "spikes" });
    } else if (disobeyed && state._samLooks.indexOf(state.turn) !== -1) {
      // Sam saw Theo disobey.
      state.status = "failed";
      events.push({ type: "fail", reason: "seen" });
    } else if (state.turn >= state._route.length) {
      // Sam's route is over. (Level 12's endings replace this in A10.)
      if (onTile(state._right, state.reflection, "G")) {
        state.status = "won";
        if (state._message) {
          // Theo writes it, then how Sam sees it.
          events.push({ type: "text", words: state._message, side: "right", mirrored: false });
          events.push({ type: "text", words: state._message, side: "left", mirrored: true });
        }
        events.push({ type: "win" });
      } else {
        state.status = "failed";
        events.push({ type: "fail", reason: "route" });
      }
    }

    if (state.status !== "failed") {
      fireMatching(state, events, ev => ev.turn === state.turn || standsOn(state, ev.at));
    }

    updateSamView(state);
    state.carry.cracks = state.cracks;
    return { state, events };
  }

  function step(oldState, input) {
    // v3: after a win, ignore everything. After a fail, only RESTART works.
    if (oldState.status === "won") return unchanged(oldState);
    if (oldState.status === "failed" && input !== "RESTART") return unchanged(oldState);

    if (input === "RESTART") {
      const state = restore(oldState._start, oldState._start, []);
      // The undo lock happens once per playthrough, even across restarts.
      state.carry.undoLockUsed = state.carry.undoLockUsed || oldState.carry.undoLockUsed;
      // The level opens again, so its start events play again.
      const events = copy(oldState._start.startEvents || []);
      if (oldState._lookedAtRequired) events.push({ type: "hint", words: "Maybe let it." });
      return { state, events };
    }

    if (input === "UNDO") {
      const history = oldState._history;
      if (oldState._undoFloor !== null && history.length <= oldState._undoFloor) {
        // Refused. The first time ever, the glass remembers.
        const result = unchanged(oldState);
        if (!oldState.carry.undoLockUsed) {
          result.state.carry.undoLockUsed = true;
          result.events.push({ type: "text", words: "IT REMEMBERS", side: "right", mirrored: true });
        }
        return result;
      }
      if (history.length === 0) return unchanged(oldState);
      const state = restore(history[history.length - 1], oldState._start, history.slice(0, -1));
      state.carry.undoLockUsed = state.carry.undoLockUsed || oldState.carry.undoLockUsed;
      return { state, events: [] };
    }

    if (oldState.act === 3) {
      if (input === "FOLLOW" || input === "RESIST" || DIRS[input]) return takeAct3Turn(oldState, input);
      return unchanged(oldState);   // LOOK isn't used in Act 3
    }

    if (input === "LOOK") {
      if (!oldState.look) return unchanged(oldState);
      return takeTurn(oldState, "LOOK");
    }

    if (DIRS[input]) return takeTurn(oldState, input);

    return unchanged(oldState);
  }

  return { load, step };
})();
