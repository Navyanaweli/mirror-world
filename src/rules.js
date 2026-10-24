// Mirror World — game rules (design v4). Owner: Person A.
// No graphics here. B's game.js talks to this only through Rules.load and Rules.step.
//
// THE RULES, in one place:
// 1. Your keys move Theo. The other body (the reflection, later Sam) moves the
//    OPPOSITE way: left <-> right AND up <-> down.
// 2. Walls (#) and closed doors (A, B) block each body separately. A blocked body
//    stays put while the other one still moves. This is the main puzzle tool.
// 3. Door A is open while any body stands on plate a, or while a body stands in
//    the doorway (a door never closes on someone).
// 4. Spikes (^): if either body lands on spikes, the level fails.
// 5. Cracks (%): if either body lands on an unused crack, the two bodies swap
//    places through the glass. That crack is then used up (plain floor).
// 6. Win: Theo on H and the other body on D at the same time.
// 7. Final level: a swap ends the game ("take"); both on F at once ("break");
//    Theo on H and Sam on D ("stay").

const Rules = (function () {
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const OPP = { U: "D", D: "U", L: "R", R: "L" };

  function parse(level) {
    const left = [], right = [];
    level.map.forEach(function (row) {
      const parts = row.split("|");
      left.push(parts[0]);
      right.push(parts[1]);
    });
    const tiles = { left: [], right: [] };
    let theo = null, other = null;
    const plates = {};
    [["left", left], ["right", right]].forEach(function (pair) {
      const side = pair[0], grid = pair[1];
      grid.forEach(function (line, y) {
        const row = [];
        for (let x = 0; x < line.length; x++) {
          let c = line[x];
          if (c === "T") { theo = { side: side, x: x, y: y }; c = "."; }
          else if (c === "O") { other = { side: side, x: x, y: y }; c = "."; }
          if (c === "a" || c === "b") {
            const L = c.toUpperCase();
            (plates[L] = plates[L] || []).push({ side: side, x: x, y: y });
          }
          row.push(c);
        }
        tiles[side].push(row);
      });
    });
    if (!theo || !other) throw new Error("Level " + level.number + " needs a T and an O");
    return { tiles: tiles, theo: theo, other: other, plates: plates };
  }

  function key(p) { return p.side + ":" + p.x + ":" + p.y; }
  function same(a, b) { return a.side === b.side && a.x === b.x && a.y === b.y; }

  function tileAt(st, p) {
    const row = st._grid.tiles[p.side][p.y];
    const c = row ? row[p.x] : undefined;
    if (c === undefined) return "#";
    if (c === "%" && st.usedCracks.indexOf(key(p)) !== -1) return ".";
    return c;
  }

  function doorsOpen(st, theo, other) {
    const open = [];
    Object.keys(st._grid.plates).forEach(function (L) {
      const on = st._grid.plates[L].some(function (p) { return same(p, theo) || same(p, other); });
      if (on) open.push(L);
    });
    [theo, other].forEach(function (b) {
      const c = tileAt(st, b);
      if ((c === "A" || c === "B") && open.indexOf(c) === -1) open.push(c);
    });
    return open.sort();
  }

  function snapshot(st) {
    return {
      theo: Object.assign({}, st.theo),
      other: Object.assign({}, st.other),
      usedCracks: st.usedCracks.slice(),
      turn: st.turn,
      status: st.status
    };
  }

  function levelEvents(level, when) {
    return (level.events || [])
      .filter(function (e) { return e.at === when; })
      .map(function (e) {
        if (e.do === "text") return { type: "text", words: e.words, side: e.side || "right", mirrored: !!e.mirrored };
        return { type: "moment", kind: e.do };
      });
  }

  function load(level) {
    const grid = parse(level);
    const st = {
      level: level.number,
      name: level.name,
      act: level.act,
      final: !!level.final,
      map: level.map,
      theo: grid.theo,
      other: grid.other,
      usedCracks: [],
      openDoors: [],
      turn: 0,
      status: "playing",   // "playing" | "won" | "failed" | "ended"
      ending: null,        // null | "take" | "break" | "stay"
      startEvents: levelEvents(level, "start"),
      _level: level,
      _grid: grid,
      _history: []
    };
    st.openDoors = doorsOpen(st, st.theo, st.other);
    return st;
  }

  function copyState(st) {
    const n = Object.assign({}, st);
    n.theo = Object.assign({}, st.theo);
    n.other = Object.assign({}, st.other);
    n.usedCracks = st.usedCracks.slice();
    n.openDoors = st.openDoors.slice();
    n._history = st._history.slice();
    n.startEvents = [];
    return n;
  }

  function restore(n, snap) {
    n.theo = Object.assign({}, snap.theo);
    n.other = Object.assign({}, snap.other);
    n.usedCracks = snap.usedCracks.slice();
    n.turn = snap.turn;
    n.status = snap.status;
    n.ending = null;
    n.openDoors = doorsOpen(n, n.theo, n.other);
  }

  function step(st, input) {
    // After a win or an ending, nothing works.
    if (st.status === "won" || st.status === "ended") return { state: st, events: [] };

    const n = copyState(st);
    const events = [];

    if (input === "RESTART") {
      const fresh = load(st._level);
      fresh.startEvents = [];
      return { state: fresh, events: [{ type: "restart" }] };
    }
    if (input === "UNDO") {
      if (n._history.length === 0) return { state: st, events: [] };
      restore(n, n._history.pop());
      return { state: n, events: [{ type: "undo" }] };
    }
    if (st.status === "failed") return { state: st, events: [] };   // only UNDO / RESTART after a fail
    if (!DIRS[input]) return { state: st, events: [] };

    n._history.push(snapshot(st));
    n.turn = st.turn + 1;

    // 1. Doors that are open right now (before anyone moves).
    const open = doorsOpen(st, st.theo, st.other);

    // 2. Both bodies try to move: Theo with the key, the other the opposite way.
    function tryMove(p, d) {
      const q = { side: p.side, x: p.x + DIRS[d][0], y: p.y + DIRS[d][1] };
      const c = tileAt(st, q);
      if (c === "#") return null;
      if ((c === "A" || c === "B") && open.indexOf(c) === -1) return null;
      return q;
    }
    const tq = tryMove(st.theo, input);
    const oq = tryMove(st.other, OPP[input]);
    if (tq) { n.theo = tq; events.push({ type: "move", who: "theo", to: Object.assign({}, tq) }); }
    else events.push({ type: "blocked", who: "theo" });
    if (oq) { n.other = oq; events.push({ type: "move", who: "other", to: Object.assign({}, oq) }); }
    else events.push({ type: "blocked", who: "other" });

    // 3. Spikes.
    if (tileAt(n, n.theo) === "^" || tileAt(n, n.other) === "^") {
      n.status = "failed";
      n.openDoors = doorsOpen(n, n.theo, n.other);
      events.push({ type: "fail", reason: "spikes" });
      return { state: n, events: events };
    }

    // 4. Cracks: swap through the glass.
    let swapped = false;
    const onCrack = [n.theo, n.other].filter(function (b) { return tileAt(n, b) === "%"; });
    if (onCrack.length) {
      onCrack.forEach(function (b) { n.usedCracks.push(key(b)); });
      const at = Object.assign({}, onCrack[0]);
      const t = n.theo; n.theo = n.other; n.other = t;
      swapped = true;
      events.push({ type: "swap", at: at, theo: Object.assign({}, n.theo), other: Object.assign({}, n.other) });
    }

    // 5. Doors after the move.
    const nowOpen = doorsOpen(n, n.theo, n.other);
    ["A", "B"].forEach(function (L) {
      const was = st.openDoors.indexOf(L) !== -1, is = nowOpen.indexOf(L) !== -1;
      if (was !== is) events.push({ type: "door", letter: L, open: is });
    });
    n.openDoors = nowOpen;

    // 6. Goals and endings.
    const tt = tileAt(n, n.theo), ot = tileAt(n, n.other);
    if (n.final) {
      let which = null;
      if (swapped) which = "take";
      else if (tt === "F" && ot === "F") which = "break";
      else if (tt === "H" && ot === "D") which = "stay";
      if (which) {
        n.status = "ended";
        n.ending = which;
        events.push({ type: "ending", which: which });
      }
    } else if (tt === "H" && ot === "D") {
      n.status = "won";
      levelEvents(st._level, "win").forEach(function (e) { events.push(e); });
      events.push({ type: "win" });
    }
    return { state: n, events: events };
  }

  return { load: load, step: step };
})();

if (typeof module !== "undefined") module.exports = Rules;
