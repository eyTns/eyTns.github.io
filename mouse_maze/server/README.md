# Mouse Maze score server

No dependencies. Nothing to install. It uses `node:http` and `node:sqlite`,
both of which ship inside Node itself, so there is no `npm install` step and no
third-party package that can be abandoned later.

Needs Node 22 or newer.

## Run it

```
node server/server.js
```

Run it from the `mouse_maze` folder. Then open **http://localhost:8787** in a
browser. That is the game.

The server hands out the page as well as the API, so both live on one origin and
there is nothing to configure. Opening `index.html` as a file instead also works
for playing, but Submit needs the server, so use the address above.

The database is a single file, `server/scores.db`. Copy it to back up. Delete it
to start over. `MM_DB=/somewhere/else.db node server/server.js` moves it.

Only `index.html` and `sim.js` are served. The database and the server's own
source are not reachable over HTTP.

If the game is ever hosted apart from its API, set `API_OVERRIDE` near the top of
the script in `index.html` to the API's address.

## The one rule

The client sends a **maze**. It never sends a score.

The server decodes the maze, runs the same `sim.js` the browser runs, and stores
the number it computed itself. Anything the client claims about a score is
ignored — there is no field in the request for it. A forged score is not
possible, only a real maze submitted under a different name.

## Endpoints

Check the server is alive:

```
curl http://localhost:8787/api/health
```

Submit a maze. The `maze` value is what **Save a maze** gives you:

```
curl -X POST http://localhost:8787/api/submit \
  -H 'Content-Type: application/json' \
  -d '{"nickname":"eyTns","maze":"MM1-02-01-0000200040000010002000400000100020004000001000200040000010000"}'
```

The reply includes `turns` (the server's own count), `rank`, `duplicate`, and a
`token`. **Keep the token.** It claims the nickname, and later submissions under
that name must present it. The browser stores it automatically.

Look up a rank without submitting:

```
curl 'http://localhost:8787/api/rank?game=1&turns=443'
```

Look up your own bests across both games:

```
curl 'http://localhost:8787/api/me?nickname=eyTns'
```

Top of the board. Never includes mazes, because one player may not read
another's layout:

```
curl 'http://localhost:8787/api/board?game=1&limit=20'
```

## Re-verify everything

```
node server/verify-all.js
```

Every stored score is recomputed from its stored maze and compared. This is the
reason mazes are stored rather than numbers: if `sim.js` is ever corrected, this
tells you exactly which rows the correction changed, and no record has to be
taken on trust. It also rebuilds the rank rollup from scratch.

It exits non-zero if anything disagrees, so it can run from a cron job.

## Why the tables look like this

**`submitters` holds the nickname, and `scores` points at it by id.** Copying
the nickname into every score row would mean rewriting millions of rows the
first time someone renames themselves. With the indirection, a rename is one
`UPDATE` and the whole board follows. When logins arrive, fill in
`submitters.user_id` and nothing else has to move.

**`UNIQUE(game, submitter_id, turns)`** is the "same nickname, same score" rule.
A repeat submission finds the original row and reports it instead of adding a
second one. Two different mazes with the same score from the same player collapse
into one row; that is intended.

## How ranking works

Ordering is score descending, then submission time ascending, then row id. A
later arrival always sits below an earlier one holding the same score, and every
row therefore gets its own number: ten players tied on 22,488 occupy #21 through
#30 rather than all showing #21.

A rank is computed as

```
(scores with more turns) + (same turns, submitted earlier) + 1
```

**`score_counts` answers the first term with one `SUM`.** Counting rows better
than yours gets slower the further down the board you are, and turn values repeat
heavily, so this rollup has far fewer rows than `scores`. It is written in the
same transaction as the score, so the two can never disagree, and `verify-all`
can rebuild it at any time because it is derived data. The second term is a short
count inside one turn value.

`GET /api/rank` is the one place that cannot give an exact number: a score that
is not on the board has no submission time yet. It reports `wouldRank`, the place
a submission made right now would take, which is the bottom of its tie group.

Boards paginate with `offset`, and ranks stay absolute across pages:

```
curl 'http://localhost:8787/api/board?game=1&limit=10&offset=20'
```

Period boards (today, this week, all time) are not built yet. `created_at` is
there for them, but `score_counts` is an all-time rollup and cannot serve a date
range, so those boards need their own counting strategy.

## Rate limits

Ten seconds per submitter, and six submissions per minute per IP address.

The per-submitter cooldown is keyed on the submitter id and is only consulted
*after* ownership of the nickname has been proven. Keying it on the nickname
would let anyone lock a player out of their own name by spamming submissions
under it. `MM_COOLDOWN_MS=0` turns both limits off, which is what the tests do.

## Known limitation

Scoring runs synchronously, so a slow maze blocks every other request while it
runs. Throughput is about 12 million moves per second, so:

| maze | scoring cost |
| --- | --- |
| 40,000 turns | 3ms |
| 82,254 turns | 7ms |
| 1,000,000 turns | 83ms |
| 99,999,999 turns (the cap) | 8.3s |

Real mazes are free. A maze built specifically to reach the cap is a way to
stall the server for eight seconds. When that matters, move the `scoreMaze` call
into a worker thread or a separate verifier process and answer the request with
"pending" — this is what AntGame.io does, and why its repository has a
`RunVerifier` service separate from its API.

A maze that hits the cap is stored with `capped = 1` and logged to the console,
because a legal maze provably escapes; hitting the cap means either a bug or
something worth looking at by hand.

## Tests

```
node server/test-server.js
```

Starts the server on a throwaway database and exercises it over real HTTP:
scoring, the ignored client-supplied score, nickname claiming, the lockout
attack on the cooldown, illegal mazes, tie-aware ranks, and the guarantee that
no maze ever appears in a board response.
