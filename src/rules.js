// STAND-IN rules (Person B). Person A replaces this whole file in step A2.
// Follows the Rules interface: mirror rule, walls, goals, UNDO, RESTART.
// Design v3: load returns startEvents: [] ; after "won" every input is ignored;
// after "failed" only RESTART works.
const Rules = (function () {

  function splitMap(map) {
    return {
      left: map.map(row => row.split("|")[0]),
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

  function tileAt(rows, x, y) {
    if (y < 0 || y >= rows.length) return "#";
    const row = rows[y];
    if (x < 0 || x >= row.length) return "#";
    return row[x];
  }

  function isBlocked(tile) {
    // Stand-in: walls and every door (A, B) block.
    return tile === "#" || tile === "A" || tile === "B";
  }

  // Remove private fields before saving a snapshot.
  function snapshot(state) {
    const copy = JSON.parse(JSON.stringify(state));
    delete copy._history;
    delete copy._start;
    return copy;
  }

  function fromSnapshot(snap, state) {
    const s = JSON.parse(JSON.stringify(snap));
    s._start = state._start;
    s._history = [];
    s.startEvents = [];
    return s;
  }

  function load(level, carry) {
    const halves = splitMap(level.map);
    const act = level.act || 1;
    const state = {
      act: act,
      person: find(halves.left, "T") || { x: 1, y: 1 },
      reflection: find(halves.right, "R") || { x: 1, y: 1 },
      boxes: [],
      openDoors: [],
      map: level.map,
      turn: 0,
      cracks: 0,
      will: act === 3 ? (level.will || 0) : null,
      look: false,
      samLooking: false,
      footprints: [],
      slipTurns: 0,
      status: "playing",
      ending: null,
      carry: carry || { cracks: 0, mercy: 0, undoLockUsed: false },
      startEvents: [],
      _left: halves.left,
      _right: halves.right
    };
    state._start = snapshot(state);
    state._history = [];
    return state;
  }

  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const MIRROR = { U: "U", D: "D", L: "R", R: "L" };

  function step(oldState, input) {
    // Never change the state we were given.
    const state = JSON.parse(JSON.stringify(oldState));
    state.startEvents = [];
    const events = [];

    // v3: after a win, ignore everything.
    if (state.status === "won") return { state: oldState, events: [] };
    // v3: after a fail, only RESTART works.
    if (state.status === "failed" && input !== "RESTART") return { state: oldState, events: [] };

    if (input === "RESTART") {
      return { state: fromSnapshot(state._start, state), events: [] };
    }

    if (input === "UNDO") {
      if (state._history.length === 0) return { state: oldState, events: [] };
      const prev = state._history.pop();
      const s = JSON.parse(JSON.stringify(prev));
      s._start = state._start;
      s._history = state._history;
      s.startEvents = [];
      return { state: s, events: [] };
    }

    if (!DIRS[input]) {
      // LOOK, FOLLOW, RESIST etc. do nothing in the stand-in.
      return { state: oldState, events: [] };
    }

    state._history.push(snapshot(oldState));
    state.turn += 1;

    const moves = [
      { who: "person", rows: state._left, dir: input },
      { who: "reflection", rows: state._right, dir: MIRROR[input] }
    ];

    moves.forEach(m => {
      const body = state[m.who];
      const d = DIRS[m.dir];
      const nx = body.x + d[0];
      const ny = body.y + d[1];
      if (isBlocked(tileAt(m.rows, nx, ny))) {
        events.push({ type: "blocked", who: m.who });
      } else {
        state[m.who] = { x: nx, y: ny };
        events.push({ type: "move", who: m.who, to: { x: nx, y: ny } });
      }
    });

    const personOnGoal = tileAt(state._left, state.person.x, state.person.y) === "G";
    const reflOnGoal = tileAt(state._right, state.reflection.x, state.reflection.y) === "G";
    if (personOnGoal && reflOnGoal) {
      state.status = "won";
      events.push({ type: "win" });
    }

    return { state, events };
  }

  return { load, step };
})();
