/* Mouse Maze - shared deterministic core.
 *
 * The same file runs in the browser and in Node, so the client and the future
 * submission server score a maze with identical code. Nothing here touches the
 * DOM or the network.
 *
 * Move counting convention (verified against the original game):
 *   move 1        = entering the board from the entrance onto (0, cIn)
 *   move k        = arriving on the k-th tile
 *   final move    = leaving (N-1, cOut) through the exit
 * so `moves` and `turns` are the same number. An empty 13x13 board with
 * cIn == cOut scores 14; an empty 9x9 board scores 10.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MazeSim = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STEP_CAP = 99999999;

  var GAMES = {
    1: { size: 13, wallStyle: 'tile' },
    2: { size: 9, wallStyle: 'edge' }
  };

  /* ---------------------------------------------------------------- specs */

  // A spec is a plain object so it serialises straight to JSON for a request
  // body:  { game, cIn, cOut, tiles:[i...] } or { game, cIn, cOut, v:[i...], h:[i...] }
  function emptySpec(game) {
    var s = { game: game, cIn: 0, cOut: 0 };
    if (game === 1) s.tiles = [];
    else { s.v = []; s.h = []; }
    return s;
  }

  function sizeOf(game) { return GAMES[game].size; }

  function cloneSpec(s) {
    var c = { game: s.game, cIn: s.cIn, cOut: s.cOut };
    if (s.game === 1) c.tiles = s.tiles.slice();
    else { c.v = s.v.slice(); c.h = s.h.slice(); }
    return c;
  }

  // Wall index helpers. Kept as functions so the packing is defined in one
  // place and the serialiser, the editor and the simulator cannot drift.
  function tileIdx(N, r, c) { return r * N + c; }              // game 1 walls
  function vIdx(r, c) { return r * 8 + c; }                     // game 2, blocks (r,c)|(r,c+1)
  function hIdx(r, c) { return r * 9 + c; }                     // game 2, blocks (r,c)|(r+1,c)

  /* ------------------------------------------------------- blocking tests */

  function makeBlocker(spec) {
    var N = sizeOf(spec.game);
    if (spec.game === 1) {
      var wall = new Uint8Array(N * N);
      for (var i = 0; i < spec.tiles.length; i++) wall[spec.tiles[i]] = 1;
      // A tile wall is a property of the destination only.
      return function (r, c, nr, nc) { return wall[nr * N + nc] === 1; };
    }
    var vw = new Uint8Array(9 * 8), hw = new Uint8Array(8 * 9);
    for (var a = 0; a < spec.v.length; a++) vw[spec.v[a]] = 1;
    for (var b = 0; b < spec.h.length; b++) hw[spec.h[b]] = 1;
    return function (r, c, nr, nc) {
      if (nr === r + 1) return hw[hIdx(r, c)] === 1;
      if (nr === r - 1) return hw[hIdx(r - 1, c)] === 1;
      if (nc === c + 1) return vw[vIdx(r, c)] === 1;
      return vw[vIdx(r, c - 1)] === 1;
    };
  }

  /* ------------------------------------------------------------ validity */

  // Breadth-first search from the entrance tile to the exit tile. Reaching the
  // exit is the whole legality requirement: if the exit is in the mouse's
  // component it can never be trapped, because the tile it just came from is
  // always a legal move back.
  function validate(spec) {
    var N = sizeOf(spec.game);
    var start = tileIdx(N, 0, spec.cIn), goal = tileIdx(N, N - 1, spec.cOut);
    var walled = null, i;
    if (spec.game === 1) {
      walled = new Uint8Array(N * N);
      for (i = 0; i < spec.tiles.length; i++) walled[spec.tiles[i]] = 1;
    }

    // The search always runs to exhaustion rather than stopping at the exit,
    // because the caller also paints the cells the mouse can never reach.
    var seen = new Uint8Array(N * N);
    var reason = null;
    if (walled && walled[start]) {
      reason = 'entranceBlocked';
    } else {
      var blocked = makeBlocker(spec);
      var queue = [start];
      seen[start] = 1;
      for (var q = 0; q < queue.length; q++) {
        var idx = queue[q], r = (idx / N) | 0, c = idx % N;
        var cand = [[r + 1, c], [r, c + 1], [r, c - 1], [r - 1, c]];
        for (var k = 0; k < 4; k++) {
          var nr = cand[k][0], nc = cand[k][1];
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          var ni = nr * N + nc;
          if (seen[ni]) continue;
          if (blocked(r, c, nr, nc)) continue;
          seen[ni] = 1;
          queue.push(ni);
        }
      }
      if (walled && walled[goal]) reason = 'exitBlocked';
      else if (!seen[goal]) reason = 'exitUnreachable';
    }
    return { ok: reason === null, reason: reason, reachable: seen };
  }

  /* ------------------------------------------------------------ stepping */

  // A run is advanced one move at a time so the animation never has to hold a
  // path of millions of entries in memory. Counting the score to completion is
  // the same object driven in a loop.
  function createRun(spec) {
    var N = sizeOf(spec.game);
    var blocked = makeBlocker(spec);
    var visits = new Int32Array(N * N);
    var r = 0, c = spec.cIn;
    var moves = 1;                       // entering the board is move 1
    var done = false, escaped = false, stuck = false;
    visits[tileIdx(N, r, c)] = 1;

    function step() {
      if (done) return false;
      if (r === N - 1 && c === spec.cOut) {   // step out through the exit
        moves++;
        done = true; escaped = true;
        return true;
      }
      var br = -1, bc = -1, bv = Infinity;
      // Fixed tie-break order: down, right, left, up. Strict `<` keeps the
      // first candidate seen, so the order alone resolves ties.
      var cand = [[r + 1, c], [r, c + 1], [r, c - 1], [r - 1, c]];
      for (var k = 0; k < 4; k++) {
        var nr = cand[k][0], nc = cand[k][1];
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        if (blocked(r, c, nr, nc)) continue;
        var v = visits[nr * N + nc];
        if (v < bv) { bv = v; br = nr; bc = nc; }
      }
      if (br < 0) { done = true; stuck = true; return false; }
      r = br; c = bc;
      moves++;
      visits[tileIdx(N, r, c)]++;
      return true;
    }

    return {
      size: N,
      visits: visits,
      step: step,
      row: function () { return r; },
      col: function () { return c; },
      moves: function () { return moves; },
      here: function () { return visits[tileIdx(N, r, c)]; },
      isDone: function () { return done; },
      isEscaped: function () { return escaped; },
      isStuck: function () { return stuck; }
    };
  }

  // Score a maze outright. This is the function the submission server calls.
  function score(spec, cap) {
    cap = cap || STEP_CAP;
    var check = validate(spec);
    if (!check.ok) return { ok: false, reason: check.reason, turns: 0 };
    var run = createRun(spec);
    while (!run.isDone() && run.moves() < cap) run.step();
    var worst = 0, v = run.visits;
    for (var i = 0; i < v.length; i++) if (v[i] > worst) worst = v[i];
    if (!run.isEscaped()) {
      // Termination is provable for a legal maze, so this branch means either a
      // bug or a maze beyond the cap. Report it, never silently score it.
      return { ok: true, capped: true, turns: cap, worst: worst, visits: v };
    }
    return { ok: true, capped: false, turns: run.moves(), worst: worst, visits: v };
  }

  /* ------------------------------------------------------- serialisation */

  function packBits(list, len) {
    var bytes = new Uint8Array((len + 7) >> 3);
    for (var i = 0; i < list.length; i++) bytes[list[i] >> 3] |= 1 << (list[i] & 7);
    var out = '';
    for (var b = 0; b < bytes.length; b++) out += (bytes[b] < 16 ? '0' : '') + bytes[b].toString(16);
    return out;
  }

  function unpackBits(hex, len) {
    var list = [];
    for (var i = 0; i < len; i++) {
      var byte = parseInt(hex.substr((i >> 3) * 2, 2), 16) || 0;
      if (byte & (1 << (i & 7))) list.push(i);
    }
    return list;
  }

  // Text form, safe to paste anywhere and stable enough to keep on a
  // leaderboard row: MM1-<cIn><cOut>-<hex>  /  MM2-<cIn><cOut>-<hex>-<hex>
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function encode(spec) {
    // Columns run to 12, so they are fixed-width two digits. A single-digit
    // field would make "1110" ambiguous between (11,10) and (1,1,10).
    var head = 'MM' + spec.game + '-' + pad2(spec.cIn) + '-' + pad2(spec.cOut) + '-';
    if (spec.game === 1) return head + packBits(spec.tiles, 169);
    return head + packBits(spec.v, 72) + '-' + packBits(spec.h, 72);
  }

  function decode(text) {
    var t = String(text).trim().toUpperCase().replace(/\s+/g, '');
    var m = t.match(/^MM([12])-(\d\d)-(\d\d)-([0-9A-F]+)(?:-([0-9A-F]+))?$/);
    if (!m) return null;
    var game = parseInt(m[1], 10), N = sizeOf(game);
    var cIn = parseInt(m[2], 10), cOut = parseInt(m[3], 10);
    if (cIn >= N || cOut >= N) return null;
    if (game === 1) {
      if (m[5]) return null;
      return { game: 1, cIn: cIn, cOut: cOut, tiles: unpackBits(m[4], 169) };
    }
    if (!m[5]) return null;
    return { game: 2, cIn: cIn, cOut: cOut, v: unpackBits(m[4], 72), h: unpackBits(m[5], 72) };
  }

  return {
    STEP_CAP: STEP_CAP,
    GAMES: GAMES,
    sizeOf: sizeOf,
    emptySpec: emptySpec,
    cloneSpec: cloneSpec,
    tileIdx: tileIdx,
    vIdx: vIdx,
    hIdx: hIdx,
    validate: validate,
    createRun: createRun,
    score: score,
    encode: encode,
    decode: decode
  };
});
