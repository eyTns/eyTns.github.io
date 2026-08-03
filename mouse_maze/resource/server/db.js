'use strict';
/* Storage for the score server.
 *
 * Uses node:sqlite, which ships with Node itself, so there is nothing to
 * install and no dependency that can be abandoned later. The whole database is
 * one file on disk (scores.db); copy it to back it up, delete it to start over.
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

-- A score row points at a submitter instead of repeating the nickname. When
-- nicknames become editable, one UPDATE on submitters moves every leaderboard
-- row with it; copying the name into each score would mean rewriting millions.
CREATE TABLE IF NOT EXISTS scores (
  id           INTEGER PRIMARY KEY,
  game         INTEGER NOT NULL,
  submitter_id INTEGER NOT NULL REFERENCES submitters(id),
  turns        INTEGER NOT NULL,
  capped       INTEGER NOT NULL DEFAULT 0,   -- 1 means the run hit the step cap
  maze         TEXT    NOT NULL,             -- every record stays reproducible
  created_at   TEXT    NOT NULL,
  UNIQUE(game, submitter_id, turns)          -- same name, same score: keep the first
);
-- Ranks are row positions, and ties are broken by who submitted first, so the
-- board order (game, turns desc, created_at, id) is also the ranking order.
DROP INDEX IF EXISTS idx_scores_board;
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(game, turns DESC, created_at, id);

-- Counting how many scores beat yours by walking the scores table costs more the
-- further down you are. Turn values repeat heavily, so this rollup has far fewer
-- rows than scores and answers that part of a rank with one SUM. The remainder,
-- the tie-break inside one turn value, is a short scan of that group alone.
CREATE TABLE IF NOT EXISTS score_counts (
  game  INTEGER NOT NULL,
  turns INTEGER NOT NULL,
  n     INTEGER NOT NULL,
  PRIMARY KEY (game, turns)
);
`);

/* --------------------------------------------------------------- queries */

const q = {
  findSubmitter: db.prepare('SELECT * FROM submitters WHERE nickname = ?'),
  addSubmitter: db.prepare(
    'INSERT INTO submitters (nickname, token, created_at) VALUES (?, ?, ?)'),
  renameSubmitter: db.prepare('UPDATE submitters SET nickname = ? WHERE id = ?'),

  addScore: db.prepare(`INSERT OR IGNORE INTO scores
    (game, submitter_id, turns, capped, maze, created_at) VALUES (?, ?, ?, ?, ?, ?)`),
  findScore: db.prepare(
    'SELECT * FROM scores WHERE game = ? AND submitter_id = ? AND turns = ?'),
  bestOf: db.prepare(`SELECT id, turns, capped, created_at FROM scores
    WHERE game = ? AND submitter_id = ? ORDER BY turns DESC LIMIT 1`),

  bumpCount: db.prepare(`INSERT INTO score_counts (game, turns, n) VALUES (?, ?, 1)
    ON CONFLICT(game, turns) DO UPDATE SET n = n + 1`),
  better: db.prepare(
    'SELECT COALESCE(SUM(n), 0) AS c FROM score_counts WHERE game = ? AND turns > ?'),
  // SUM, not COALESCE(n,0): with no matching row a bare select returns no row at
  // all and there is nothing to coalesce.
  tiedTotal: db.prepare(
    'SELECT COALESCE(SUM(n), 0) AS c FROM score_counts WHERE game = ? AND turns = ?'),
  // How many holders of the same score got there first. Ordering by the stored
  // submission time rather than by id keeps the intent explicit and survives an
  // import of older records; id only settles identical timestamps.
  tiedEarlier: db.prepare(`SELECT COUNT(*) AS c FROM scores
    WHERE game = ? AND turns = ?
      AND (created_at < ? OR (created_at = ? AND id < ?))`),

  // Deliberately never selects `maze`: a player may not read another player's
  // layout, so the column simply does not leave the server here.
  board: db.prepare(`SELECT s.turns, s.capped, m.nickname
    FROM scores s JOIN submitters m ON m.id = s.submitter_id
    WHERE s.game = ? ORDER BY s.turns DESC, s.created_at ASC, s.id ASC
    LIMIT ? OFFSET ?`),

  allScores: db.prepare('SELECT id, game, turns, capped, maze FROM scores ORDER BY id'),
  totalFor: db.prepare('SELECT COUNT(*) AS c FROM scores WHERE game = ?'),
  rebuildClear: db.prepare('DELETE FROM score_counts'),
  rebuildFill: db.prepare(`INSERT INTO score_counts (game, turns, n)
    SELECT game, turns, COUNT(*) FROM scores GROUP BY game, turns`)
};

const now = () => new Date().toISOString();

/* Rank 1 is the highest score. Every row gets its own number: holders of the
 * same score are ordered by who submitted it first, so a later arrival sits
 * below an earlier one. This matches the original leaderboard.
 */
function rankOfScore(game, turns, createdAt, id) {
  return q.better.get(game, turns).c
       + q.tiedEarlier.get(game, turns, createdAt, createdAt, id).c
       + 1;
}

/* For a score that is not on the board: the place a submission made right now
 * would land, which is at the bottom of its tie group. */
function rankIfSubmittedNow(game, turns) {
  return q.better.get(game, turns).c + q.tiedTotal.get(game, turns).c + 1;
}

function findOrCreateSubmitter(nickname, token) {
  const found = q.findSubmitter.get(nickname);
  if (found) {
    if (!token || token !== found.token) return { error: 'nicknameTaken' };
    return { submitter: found, token: found.token, created: false };
  }
  const fresh = require('node:crypto').randomBytes(16).toString('hex');
  const info = q.addSubmitter.run(nickname, fresh, now());
  return {
    submitter: { id: Number(info.lastInsertRowid), nickname, token: fresh },
    token: fresh,
    created: true
  };
}

/* One transaction so a score row and its rollup count can never disagree. */
function recordScore(game, submitterId, turns, capped, maze) {
  db.exec('BEGIN');
  try {
    const info = q.addScore.run(game, submitterId, turns, capped ? 1 : 0, maze, now());
    const inserted = info.changes > 0;
    if (inserted) q.bumpCount.run(game, turns);
    db.exec('COMMIT');
    return { inserted, row: q.findScore.get(game, submitterId, turns) };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function rebuildCounts() {
  db.exec('BEGIN');
  try {
    q.rebuildClear.run();
    q.rebuildFill.run();
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = {
  DB_PATH, db, q,
  rankOfScore, rankIfSubmittedNow, findOrCreateSubmitter, recordScore, rebuildCounts,
  bestOf: (game, id) => q.bestOf.get(game, id),
  board: (game, limit, offset) => q.board.all(game, limit, offset),
  totalFor: game => q.totalFor.get(game).c
};
