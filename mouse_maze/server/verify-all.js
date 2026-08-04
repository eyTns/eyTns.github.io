'use strict';
/* Re-derive every score on the board from its stored maze.
 *
 *   node server/verify-all.js
 *
 * This is the payoff for storing mazes instead of numbers. If sim.js is ever
 * corrected, run this: it tells you exactly which rows the fix changed, and no
 * record has to be taken on trust. A leaderboard you can recompute from scratch
 * is a different kind of object from one you merely hope is right.
 */
const S = require('../sim.js');
const store = require('./db.js');

const rows = store.q.allScores.all();
if (!rows.length) {
  console.log('No scores stored yet.');
  process.exit(0);
}

let ok = 0;
const bad = [];
const t0 = Date.now();

for (const row of rows) {
  const spec = S.decode(row.maze);
  if (!spec) { bad.push({ id: row.id, why: 'maze code no longer parses' }); continue; }
  if (spec.game !== row.game) { bad.push({ id: row.id, why: 'game mismatch' }); continue; }

  const check = S.validate(spec);
  if (!check.ok) { bad.push({ id: row.id, why: 'maze is now illegal: ' + check.reason }); continue; }

  const got = S.score(spec);
  if (got.turns !== row.turns) {
    bad.push({ id: row.id, why: 'stored ' + row.turns + ', recomputed ' + got.turns });
    continue;
  }
  ok++;
}

const secs = ((Date.now() - t0) / 1000).toFixed(2);
console.log('checked   ', rows.length.toLocaleString(), 'scores in', secs + 's');
console.log('reproduced', ok.toLocaleString());
console.log('mismatched', bad.length.toLocaleString());
for (const b of bad.slice(0, 20)) console.log('  score', b.id + ':', b.why);
if (bad.length > 20) console.log('  ... and', bad.length - 20, 'more');

// The rank rollup is derived data, so it is safe and cheap to rebuild here.
store.rebuildCounts();
console.log('rank counts rebuilt from the scores table');

process.exit(bad.length ? 1 : 0);
