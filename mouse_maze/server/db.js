'use strict';
/* Storage for the score server.
 *
 * Uses node:sqlite, which ships with Node itself, so there is nothing to
 * install and no dependency that can be abandoned later. The whole database is
 * one file on disk (scores.db); copy it to back it up, delete it to start over.
 *
 * Each game keeps its own pair of tables (scores_mm1/scores_mm2 and their rank
 * rollups), so the boards cannot mix. The submitters table is shared: one
 * nickname and one token cover both games, which is also what the future
 * account system expects.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = process.env.MM_DB || path.join(__dirname, 'scores.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');    // survives an abrupt shutdown better
db.exec('PRAGMA foreign_keys = ON');

/* ----------------------------------------------------------------- schema */

db.exec(`
CREATE TABLE IF NOT EXISTS submitters (
  id         INTEGER PRIMARY KEY,
  nickname   TEXT    NOT NULL UNIQUE,
  token      TEXT    NOT NULL,          -- proves ownership before accounts exist
  user_id    INTEGER,                   -- stays NULL until logins are added
  created_at TEXT    NOT NULL
);
` + [1, 2].map(g => `
-- A score row points at a submitter instead of repeating the nickname. When
-- nicknames become editable, one UPDATE on submitters moves every leaderboard
-- row with it; copying the name into each score would mean rewriting millions.
CREATE TABLE IF NOT EXISTS scores_mm${g} (
  id           INTEGER PRIMARY KEY,
  submitter_id INTEGER NOT NULL REFERENCES submitters(id),
  turns        INTEGER NOT NULL,
  capped       INTEGER NOT NULL DEFAULT 0,   -- 1 means the run hit the step cap
  maze         TEXT    NOT NULL,             -- every record stays reproducible
  created_at   TEXT    NOT NULL,
  UNIQUE(submitter_id, turns)                -- same name, same score: keep the first
);
-- Ranks are row positions, and ties are broken by who submitted first, so the
-- board order (turns desc, created_at, id) is also the ranking order.
CREATE INDEX IF NOT EXISTS idx_scores_mm${g}_rank ON scores_mm${g}(turns DESC, created_at, id);

-- Counting how many scores beat yours by walking the scores table costs more the
-- further down you are. Turn values repeat heavily, so this rollup has far fewer
-- rows than scores and answers that part of a rank with one SUM. The remainder,
-- the tie-break inside one turn value, is a short scan of that group alone.
CREATE TABLE IF NOT EXISTS score_counts_mm${g} (
  turns INTEGER PRIMARY KEY,
  n     INTEGER NOT NULL
);`).join('\n'));

/* --------------------------------------------------------------- queries */

const shared = {
  findSubmitter: db.prepare('SELECT * FROM submitters WHERE nickname = ?'),
  addSubmitter: db.prepare(
    'INSERT INTO submitters (nickname, token, created_at) VALUES (?, ?, ?)'),
  renameSubmitter: db.prepare('UPDATE submitters SET nickname = ? WHERE id = ?')
};

/* SQLite cannot take a table name as a bound parameter, so each game gets its
 * own prepared set over its own tables. */
function gameQueries(g) {
  const scores = 'scores_mm' + g, counts = 'score_counts_mm' + g;
  return {
    addScore: db.prepare(`INSERT OR IGNORE INTO ${scores}
      (submitter_id, turns, capped, maze, created_at) VALUES (?, ?, ?, ?, ?)`),
    findScore: db.prepare(
      `SELECT * FROM ${scores} WHERE submitter_id = ? AND turns = ?`),
    bestOf: db.prepare(`SELECT id, turns, capped, created_at FROM ${scores}
      WHERE submitter_id = ? ORDER BY turns DESC LIMIT 1`),

    bumpCount: db.prepare(`INSERT INTO ${counts} (turns, n) VALUES (?, 1)
      ON CONFLICT(turns) DO UPDATE SET n = n + 1`),
    better: db.prepare(
      `SELECT COALESCE(SUM(n), 0) AS c FROM ${counts} WHERE turns > ?`),
    // SUM, not COALESCE(n,0): with no matching row a bare select returns no row at
    // all and there is nothing to coalesce.
    tiedTotal: db.prepare(
      `SELECT COALESCE(SUM(n), 0) AS c FROM ${counts} WHERE turns = ?`),
    // How many holders of the same score got there first. Ordering by the stored
    // submission time rather than by id keeps the intent explicit and survives an
    // import of older records; id only settles identical timestamps.
    tiedEarlier: db.prepare(`SELECT COUNT(*) AS c FROM ${scores}
      WHERE turns = ?
        AND (created_at < ? OR (created_at = ? AND id < ?))`),

    // Deliberately never selects `maze`: a player may not read another player's
    // layout, so the column simply does not leave the server here.
    board: db.prepare(`SELECT s.turns, s.capped, m.nickname
      FROM ${scores} s JOIN submitters m ON m.id = s.submitter_id
      ORDER BY s.turns DESC, s.created_at ASC, s.id ASC
      LIMIT ? OFFSET ?`),

    allScores: db.prepare(`SELECT id, turns, capped, maze FROM ${scores} ORDER BY id`),
    totalFor: db.prepare(`SELECT COUNT(*) AS c FROM ${scores}`),
    rebuildClear: db.prepare(`DELETE FROM ${counts}`),
    rebuildFill: db.prepare(`INSERT INTO ${counts} (turns, n)
      SELECT turns, COUNT(*) FROM ${scores} GROUP BY turns`)
  };
}

const Q = { 1: gameQueries(1), 2: gameQueries(2) };

const now = () => new Date().toISOString();

/* Rank 1 is the highest score. Every row gets its own number: holders of the
 * same score are ordered by who submitted it first, so a later arrival sits
 * below an earlier one. This matches the original leaderboard.
 */
function rankOfScore(game, turns, createdAt, id) {
  const q = Q[game];
  return q.better.get(turns).c
       + q.tiedEarlier.get(turns, createdAt, createdAt, id).c
       + 1;
}

/* For a score that is not on the board: the place a submission made right now
 * would land, which is at the bottom of its tie group. */
function rankIfSubmittedNow(game, turns) {
  const q = Q[game];
  return q.better.get(turns).c + q.tiedTotal.get(turns).c + 1;
}

function findOrCreateSubmitter(nickname, token) {
  const found = shared.findSubmitter.get(nickname);
  if (found) {
    if (!token || token !== found.token) return { error: 'nicknameTaken' };
    return { submitter: found, token: found.token, created: false };
  }
  const fresh = require('node:crypto').randomBytes(16).toString('hex');
  const info = shared.addSubmitter.run(nickname, fresh, now());
  return {
    submitter: { id: Number(info.lastInsertRowid), nickname, token: fresh },
    token: fresh,
    created: true
  };
}

/* One transaction so a score row and its rollup count can never disagree. */
function recordScore(game, submitterId, turns, capped, maze) {
  const q = Q[game];
  db.exec('BEGIN');
  try {
    const info = q.addScore.run(submitterId, turns, capped ? 1 : 0, maze, now());
    const inserted = info.changes > 0;
    if (inserted) q.bumpCount.run(turns);
    db.exec('COMMIT');
    return { inserted, row: q.findScore.get(submitterId, turns) };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function rebuildCounts() {
  db.exec('BEGIN');
  try {
    for (const game of [1, 2]) {
      Q[game].rebuildClear.run();
      Q[game].rebuildFill.run();
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = {
  DB_PATH, db, shared, Q,
  rankOfScore, rankIfSubmittedNow, findOrCreateSubmitter, recordScore, rebuildCounts,
  bestOf: (game, id) => Q[game].bestOf.get(id),
  board: (game, limit, offset) => Q[game].board.all(limit, offset),
  allScores: game => Q[game].allScores.all(),
  totalFor: game => Q[game].totalFor.get().c
};
