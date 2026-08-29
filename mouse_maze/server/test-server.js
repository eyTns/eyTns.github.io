'use strict';
// End-to-end exercise of the server over real HTTP, on a throwaway database.
process.env.MM_DB = '/tmp/mm-test-' + Date.now() + '.db';
process.env.PORT = '8799';
process.env.MM_COOLDOWN_MS = '0';        // limits are exercised separately below
const S = require('../sim.js');
const { server } = require('./server.js');

const BASE = 'http://localhost:8799';
let fail = 0;
const t = (name, cond, extra) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : '  <- ' + JSON.stringify(extra)));
  if (!cond) fail++;
};
const post = (path, body) => fetch(BASE + path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
}).then(async r => ({ status: r.status, body: await r.json() }));
const get = path => fetch(BASE + path).then(async r => ({ status: r.status, body: await r.json() }));

// three known mazes, scored locally so the expectations are independent
const w443 = [[1,1],[2,2],[3,1],[4,2],[5,1],[6,2],[7,1],[8,2],[8,3],[9,1],[10,2],[11,1],[12,2]];
const M443 = S.encode({ game:1, cIn:2, cOut:1, tiles:w443.map(([r,c])=>r*13+c) });
const EMPTY1 = S.encode({ game:1, cIn:0, cOut:0, tiles:[] });
const EMPTY2 = S.encode({ game:2, cIn:0, cOut:0, v:[], h:[] });
// entrance sealed off from the exit: every neighbour of (0,0) bricked
const SEALED = S.encode({ game:1, cIn:0, cOut:5, tiles:[S.tileIdx(13,0,1), S.tileIdx(13,1,0)] });

(async () => {
  await new Promise(r => server.listen(8799, r));

  let res = await get('/api/health');
  t('health 응답', res.status === 200 && res.body.ok === true, res.body);
  t('서버가 보고하는 cap', res.body.cap === 99999999, res.body);

  // the server must compute the score itself
  res = await post('/api/submit', { nickname: 'eyTns', maze: M443 });
  t('제출 성공', res.status === 200, res.body);
  t('서버가 443 을 직접 계산', res.body.turns === 443, res.body);
  t('첫 제출은 중복 아님', res.body.duplicate === false, res.body);
  t('1위', res.body.rank === 1, res.body);
  t('닉네임 토큰 발급', typeof res.body.token === 'string' && res.body.token.length === 32, res.body);
  const token = res.body.token;

  // a claimed score sent by a client is ignored: only the maze matters
  res = await post('/api/submit', { nickname: 'eyTns', maze: M443, token, turns: 999999 });
  t('클라이언트가 보낸 점수 무시', res.body.turns === 443, res.body);
  t('같은 닉네임 같은 점수는 중복 처리', res.body.duplicate === true, res.body);

  // nickname protection
  res = await post('/api/submit', { nickname: 'eyTns', maze: EMPTY1 });
  t('토큰 없이 남의 닉네임 사용 거부', res.status === 409, res.body);

  res = await post('/api/submit', { nickname: 'someone', maze: EMPTY1 });
  t('다른 사람은 자기 닉네임으로 제출 가능', res.status === 200 && res.body.turns === 14, res.body);
  t('낮은 점수는 2위', res.body.rank === 2, res.body);
  const someoneToken = res.body.token;

  // per-game boards live in separate databases
  res = await post('/api/submit', { nickname: 'someone', maze: EMPTY2, token: someoneToken });
  t('2탄은 별도 판이라 1위', res.status === 200 && res.body.game === 2 && res.body.rank === 1, res.body);
  t('토큰 하나가 두 게임에서 통함', res.body.token === someoneToken, res.body);

  // illegal maze is refused before anything is stored
  res = await post('/api/submit', { nickname: 'nope', maze: SEALED });
  t('출구 도달 불가 미로 거부', res.status === 400 && /no route/i.test(res.body.error), res.body);
  res = await post('/api/submit', { nickname: 'nope', maze: 'not-a-maze' });
  t('깨진 코드 거부', res.status === 400, res.body);
  res = await post('/api/submit', { nickname: '', maze: EMPTY1 });
  t('빈 닉네임 거부', res.status === 400, res.body);
  res = await post('/api/submit', { nickname: 'x', maze: EMPTY1 });
  t('1글자 닉네임 거부', res.status === 400, res.body);
  res = await post('/api/submit', { nickname: 'y'.repeat(65), maze: EMPTY1 });
  t('65글자 닉네임 거부', res.status === 400, res.body);

  // the cooldown, exercised on purpose rather than tripping over it
  // the cooldown, exercised on purpose rather than tripped over
  process.env.MM_COOLDOWN_MS = '10000';
  res = await post('/api/submit', { nickname: 'timed', maze: EMPTY1 });
  const timedToken = res.body.token;
  t('첫 제출은 통과', res.status === 200, res.body);
  res = await post('/api/submit', { nickname: 'timed', maze: M443, token: timedToken });
  t('10초 안의 재제출은 429', res.status === 429, res.body);
  res = await post('/api/submit', { nickname: 'intruder', maze: EMPTY1 });
  t('다른 사람은 영향 없음', res.status === 200, res.body);
  // an unauthorised attempt must not consume the owner's cooldown
  await post('/api/submit', { nickname: 'timed', maze: EMPTY1 });          // no token
  res = await post('/api/submit', { nickname: 'timed', maze: EMPTY1, token: timedToken });
  t('남이 시도해도 소유자 쿨다운이 늘지 않음', res.status === 429, res.body);
  process.env.MM_COOLDOWN_MS = '0';

  // rank and self lookup
  // A score not yet on the board has no rank of its own, because ranks are
  // settled by submission time. The endpoint answers where it would land now,
  // which is below anyone already holding that score.
  res = await get('/api/rank?game=1&turns=443');
  t('동점으로 지금 내면 기존 동점자 아래', res.body.wouldRank === 2, res.body);
  res = await get('/api/rank?game=1&turns=100000');
  t('아무도 못 넘는 점수면 1위', res.body.wouldRank === 1, res.body);
  res = await get('/api/rank?game=1&turns=1');
  t('아무도 못 넘는 낮은 점수는 마지막', res.body.wouldRank === res.body.total + 1, res.body);
  res = await get('/api/me?nickname=eyTns');
  t('내 기록 조회', res.body.games[0].best === 443 && res.body.games[0].rank === 1, res.body);

  // the board must never leak a maze
  res = await get('/api/board?game=1&limit=10');
  t('보드 응답', res.status === 200 && res.body.entries.length === res.body.total, res.body);
  t('보드는 점수 내림차순',
    res.body.entries.every((e,i,a) => i === 0 || a[i-1].turns >= e.turns), res.body);
  {
    const tied = res.body.entries.filter(e => e.turns === 14);
    t('동점자가 여러 명', tied.length >= 3, tied);
    t('동점자도 순위가 모두 다름', new Set(tied.map(e => e.rank)).size === tied.length, tied);
    t('순위가 1부터 빈틈없이 이어짐',
      res.body.entries.every((e, i) => e.rank === i + 1), res.body.entries);
    // 'someone' submitted 14 before 'timed' and 'intruder' did
    const order = tied.map(e => e.nickname);
    t('먼저 낸 사람이 위', order[0] === 'someone', order);
    const me = await get('/api/me?nickname=someone');
    t('보드 순위와 내 순위가 일치',
      tied[0].rank === me.body.games[0].rank, { tied: tied[0], me: me.body.games[0] });
    const later = await get('/api/me?nickname=intruder');
    t('늦게 낸 사람은 아래 순위',
      later.body.games[0].rank > me.body.games[0].rank,
      { early: me.body.games[0].rank, late: later.body.games[0].rank });
  }
  // pagination keeps the numbering absolute
  {
    const p1 = await get('/api/board?game=1&limit=2&offset=0');
    const p2 = await get('/api/board?game=1&limit=2&offset=2');
    t('페이지 넘겨도 순위가 이어짐',
      p1.body.entries[0].rank === 1 && p2.body.entries[0].rank === 3,
      [p1.body.entries.map(e=>e.rank), p2.body.entries.map(e=>e.rank)]);
  }
  t('보드에 미로가 포함되지 않음',
    !JSON.stringify(res.body).includes('MM1-'), res.body);

  // the window asks for a thousand rows at a time and pages through them offline
  {
    const big = await get('/api/board?game=1&limit=1000');
    t('한 번에 1000줄까지 요청 가능', big.body.limit === 1000, big.body);
    const over = await get('/api/board?game=1&limit=1001');
    t('1000줄을 넘기면 1000으로 잘림', over.body.limit === 1000, over.body);
  }

  await new Promise(r => server.close(r));
  console.log(fail ? '\n' + fail + ' FAILED' : '\nALL PASS');
  process.exitCode = fail ? 1 : 0;
})();
