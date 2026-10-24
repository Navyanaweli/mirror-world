// Rules (Person A). The game's brain: no graphics, just state in, state out.
// Follows the Shared contracts (Claude Playbook) with Design Update v3 on top.
// Step A2: mirror rule, walls, goals, LOOK as a still turn, UNDO, RESTART, carry.
// Step A3: plates, doors and spikes (v3: no boxes).
// Still to come: A4 tile triggers/disobeys/lag/Mercy,
// A7 Act 3 (Follow/Resist/Break), A10 Level 12 endings.
const Rules = (function () {

  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  // The mirror swaps left and right only.
  const MIRROR = { U: "U", D: "D", L: "R", R: "L" };
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
      carry: {
        cracks: cracks,
        mercy: inCarry.mercy || 0,
        undoLockUsed: !!inCarry.undoLockUsed
      },
      startEvents: [],            // v3: at: "start" events arrive in A4
      _left: clearStart(halves.left, "T"),
      _right: clearStart(halves.right, "R")
    };
    updateDoors(state, null);   // in case someone starts on a plate
    state._start = snapshot(state);
    state._history = [];
    return state;
  }

  // One turn in Acts 1-2. dir is "U"/"D"/"L"/"R", or null for LOOK (both stay still).
  // Turn order: work out both moves, move both at once, plates and doors,
  // cracks (A4), spikes, goals, then this turn's script events (A4).
  function takeTurn(old, dir) {
    const state = restore(snapshot(old), old._start, old._history.concat([snapshot(old)]));
    const events = [];
    state.turn += 1;

    if (dir) {
      // Work out both moves first, then move both at once.
      const moves = [
        { who: "person", rows: state._left, dir: dir },
        { who: "reflection", rows: state._right, dir: MIRROR[dir] }
      ];
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
    }

    updateDoors(state, events);

    if (onEither(state, "^")) {
      state.status = "failed";
      events.push({ type: "fail", reason: "spikes" });
    } else if (onTile(state._left, state.person, "G") && onTile(state._right, state.reflection, "G")) {
      // Win: both stand on their goal at the same moment.
      state.status = "won";
      events.push({ type: "win" });
    }

    state.carry.cracks = state.cracks;
    return { state, events };
  }

  function step(oldState, input) {
    // v3: after a win, ignore everything. After a fail, only RESTART works.
    if (oldState.status === "won") return unchanged(oldState);
    if (oldState.status === "failed" && input !== "RESTART") return unchanged(oldState);

    if (input === "RESTART") {
      return { state: restore(oldState._start, oldState._start, []), events: [] };
    }

    if (input === "UNDO") {
      const history = oldState._history;
      if (history.length === 0) return unchanged(oldState);
      return {
        state: restore(history[history.length - 1], oldState._start, history.slice(0, -1)),
        events: []
      };
    }

    // Act 3 inputs (FOLLOW / RESIST / Break) arrive in A7.
    if (oldState.act === 3) return unchanged(oldState);

    if (input === "LOOK") {
      if (!oldState.look) return unchanged(oldState);
      return takeTurn(oldState, null);
    }

    if (DIRS[input]) return takeTurn(oldState, input);

    return unchanged(oldState);
  }

  return { load, step };
})();
