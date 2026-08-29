'use strict';
/* Mouse Maze score server.
 *
 * Run it:   node server/server.js
 * Then set  const API_BASE = 'http://localhost:8787';  in index.html.
 *
 * The one rule this server exists to enforce: a client sends a MAZE, never a
 * score. The server decodes the maze, runs the very same sim.js the browser
 * runs, and the number it computes is the only number that gets stored. A
 * forged score is therefore not possible, and every row on the board can be
 * re-derived from its maze at any time (see verify-all.js).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../sim.js');            // the exact file the browser loads
const store = require('./db.js');

const PORT = Number(process.env.PORT || 8787);
// Read per call, not once at load, so tests can turn the limits on and off.
const cooldownMs = () => Number(process.env.MM_COOLDOWN_MS ?? 10000);
const IP_WINDOW_MS = 60000, IP_MAX = 6;    // stops one address minting nicknames
const RANK_CEILING = 1000000;              // past this the client shows 1,000,000+
const NICK_MIN = 2, NICK_MAX = 64;

/* ------------------------------------------------------------ rate limits
 * In memory, so a restart forgets them. Good enough for a single process; a
 * real deployment would keep this in the database or in front of the server.
 *
 * The per-submitter cooldown is keyed on the submitter id and only ever touched
 * AFTER ownership of the nickname has been proven. Keying it on the nickname
 * itself would let anyone lock a player out of their own name by spamming
 * submissions under it.
 */
const lastSeen = new Map();
function tooSoon(id) {
  const window = cooldownMs();
  if (!window) return 0;
  const wait = window - (Date.now() - (lastSeen.get(id) || 0));
  return wait > 0 ? wait : 0;
}
function touch(id) { lastSeen.set(id, Date.now()); }

const ipHits = new Map();
function ipAllowed(addr) {
  if (!cooldownMs()) return true;
  const now = Date.now();
  const hits = (ipHits.get(addr) || []).filter(t => now - t < IP_WINDOW_MS);
  if (hits.length >= IP_MAX) { ipHits.set(addr, hits); return false; }
  hits.push(now);
  ipHits.set(addr, hits);
  return true;
}

/* ------------------------------------------------------------ static files
 * The server also hands out the game itself, so opening
 * http://localhost:8787 puts the page and the API on one origin. That removes
 * the whole question of cross-origin requests, and the page can find its own
 * API without being edited.
 *
 * Only these files are served. Serving the whole folder would hand out the
 * database as well.
 */
const ROOT = path.join(__dirname, '..');
const PUBLIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/sim.js': ['sim.js', 'text/javascript; charset=utf-8']
};

function serveStatic(res, pathname) {
  const entry = PUBLIC[pathname];
  if (!entry) return false;
  const file = path.join(ROOT, entry[0]);
  if (!fs.existsSync(file)) return false;
  const body = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': entry[1],
    'Content-Length': body.length,
    'Cache-Control': 'no-store'          // always the file on disk, never a stale copy
  });
  res.end(body);
  return true;
}

/* ---------------------------------------------------------------- helpers */

function send(res, code, body) {
  const text = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function readJson(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('body is not JSON')); }
    });
    req.on('error', reject);
  });
}

function cleanNick(raw) {
  const nick = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
  if (!nick) return { error: 'A nickname is required.' };
  if ([...nick].length < NICK_MIN) return { error: 'Nicknames are at least ' + NICK_MIN + ' characters.' };
  if ([...nick].length > NICK_MAX) return { error: 'Nicknames are at most ' + NICK_MAX + ' characters.' };
  if (/[\u0000-\u001f\u007f]/.test(nick)) return { error: 'That nickname has characters I cannot store.' };
  return { nick };
}

const REASONS = {
  entranceBlocked: 'The entrance tile is walled up, so the mouse cannot get in.',
  exitBlocked: 'The exit tile is walled up, so the mouse cannot get out.',
  exitUnreachable: 'There is no route from the entrance to the exit.'
};

/* ------------------------------------------------------------- scoring
 * This is the whole point of the server, and it is deliberately one small
 * function so it is easy to move later.
 *
 * Caution: it runs synchronously, so a maze that takes seconds to simulate
 * blocks every other request for that long. Measured throughput is about 12
 * million moves per second, so a record-scale maze costs a few milliseconds,
 * but a maze that reaches the 99,999,999 step cap costs roughly 8 seconds.
 * When that starts to matter, move this call into a worker thread or a separate
 * verifier process and answer the request with "pending" instead.
 */
function scoreMaze(spec) {
  return S.score(spec);
}

/* ---------------------------------------------------------------- routes */

async function handleSubmit(req, res) {
  let body;
  try { body = await readJson(req); }
  catch (err) { return send(res, 400, { error: err.message }); }

  const { nick, error } = cleanNick(body.nickname);
  if (error) return send(res, 400, { error });

  const spec = S.decode(body.maze);
  if (!spec) return send(res, 400, { error: 'That maze code does not parse.' });

  const check = S.validate(spec);
  if (!check.ok) return send(res, 400, { error: REASONS[check.reason] || 'That maze is not legal.' });

  // Ownership is settled before any limit is consulted, so a rejected attempt
  // on someone else's nickname cannot disturb that player's cooldown.
  const who = store.findOrCreateSubmitter(nick, body.token);
  if (who.error === 'nicknameTaken') {
    return send(res, 409, { error: 'That nickname is already claimed on this server.' });
  }

  const wait = tooSoon(who.submitter.id);
  if (wait) return send(res, 429, { error: 'Wait ' + Math.ceil(wait / 1000) + 's before submitting again.' });

  if (!ipAllowed(req.socket.remoteAddress || '?')) {
    return send(res, 429, { error: 'Too many submissions from this address. Try again shortly.' });
  }

  const result = scoreMaze(spec);                  // the server's own number
  touch(who.submitter.id);

  const saved = store.recordScore(spec.game, who.submitter.id, result.turns, result.capped, S.encode(spec));
  const row = saved.row;
  const rank = store.rankOfScore(spec.game, row.turns, row.created_at, row.id);

  if (result.capped) {
    console.warn('[capped] %s submitted a maze that hit the step cap: %s', nick, S.encode(spec));
  }

  send(res, 200, {
    game: spec.game,
    nickname: nick,
    turns: result.turns,
    worst: result.worst,
    capped: !!result.capped,
    duplicate: !saved.inserted,               // same nickname, same score: kept the first
    rank,
    rankCapped: rank > RANK_CEILING,
    total: store.totalFor(spec.game),
    token: who.token,                         // client stores this to keep the nickname
    submittedAt: row.created_at
  });
}

function handleRank(res, url) {
  const game = Number(url.searchParams.get('game'));
  const turns = Number(url.searchParams.get('turns'));
  if (![1, 2].includes(game) || !Number.isInteger(turns) || turns < 0) {
    return send(res, 400, { error: 'Need game=1|2 and a whole turns value.' });
  }
  // Ranks are unique and settled by submission time, so a score that is not on
  // the board has no rank of its own yet. This reports where it would land if it
  // were submitted right now: the bottom of its tie group.
  const rank = store.rankIfSubmittedNow(game, turns);
  send(res, 200, {
    game, turns, wouldRank: rank, rankCapped: rank > RANK_CEILING,
    total: store.totalFor(game)
  });
}

function handleMe(res, url) {
  const { nick, error } = cleanNick(url.searchParams.get('nickname'));
  if (error) return send(res, 400, { error });
  const found = store.shared.findSubmitter.get(nick);
  if (!found) return send(res, 404, { error: 'No submissions under that nickname yet.' });

  const games = [1, 2].map(game => {
    const best = store.bestOf(game, found.id);
    if (!best) return { game, best: null };
    const rank = store.rankOfScore(game, best.turns, best.created_at, best.id);
    return {
      game, best: best.turns, capped: !!best.capped, submittedAt: best.created_at,
      rank, rankCapped: rank > RANK_CEILING, total: store.totalFor(game)
    };
  });
  send(res, 200, { nickname: nick, games });
}

function handleBoard(res, url) {
  const game = Number(url.searchParams.get('game'));
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit') || 20)));
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
  if (![1, 2].includes(game)) return send(res, 400, { error: 'Need game=1|2.' });
  // Mazes are never included: one player must not be able to read another's
  // layout. The query already sorts in ranking order, so a row's rank is simply
  // its position, which is why every entry shows a distinct number.
  const rows = store.board(game, limit, offset).map((r, i) => ({
    rank: offset + i + 1, nickname: r.nickname, turns: r.turns, capped: !!r.capped,
    submittedAt: r.created_at
  }));
  send(res, 200, { game, total: store.totalFor(game), offset, limit, entries: rows });
}

/* ----------------------------------------------------------------- server */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') return send(res, 204, {});

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true, db: store.DB_PATH, cap: S.STEP_CAP });
    }
    if (req.method === 'POST' && url.pathname === '/api/submit') return await handleSubmit(req, res);
    if (req.method === 'GET' && url.pathname === '/api/rank') return handleRank(res, url);
    if (req.method === 'GET' && url.pathname === '/api/me') return handleMe(res, url);
    if (req.method === 'GET' && url.pathname === '/api/board') return handleBoard(res, url);
    if (req.method === 'GET' && serveStatic(res, url.pathname)) return;
    send(res, 404, { error: 'No such endpoint.' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'Something broke on the server.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Mouse Maze score server on http://localhost:' + PORT);
    console.log('database:', store.DB_PATH);
    console.log('\nOpen the game at http://localhost:' + PORT);
  });
}

module.exports = { server, scoreMaze };
