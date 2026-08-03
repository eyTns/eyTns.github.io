const S = require('./sim.js');
const cases = require('./ref_cases.json');
let fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { console.log('FAIL', name, 'got', got, 'want', want); fail++; }
  return ok;
};

// anchors
check('empty 1탄 = 14', S.score({game:1,cIn:0,cOut:0,tiles:[]}).turns, 14);
check('empty 1탄 c=6 = 14', S.score({game:1,cIn:6,cOut:6,tiles:[]}).turns, 14);
check('empty 2탄 = 10', S.score({game:2,cIn:0,cOut:0,v:[],h:[]}).turns, 10);
check('empty 2탄 c=4 = 10', S.score({game:2,cIn:4,cOut:4,v:[],h:[]}).turns, 10);

// the 443-turn board read out of the original screenshot
const w443 = [[1,1],[2,2],[3,1],[4,2],[5,1],[6,2],[7,1],[8,2],[8,3],[9,1],[10,2],[11,1],[12,2]];
const spec443 = {game:1, cIn:2, cOut:1, tiles:w443.map(([r,c])=>r*13+c)};
const r443 = S.score(spec443);
check('원작 스크린샷 = 443턴', r443.turns, 443);
check('원작 스크린샷 최다방문 = 6', r443.worst, 6);

// differential test against the Python reference
let diffTurns = 0, diffValid = 0, run = 0;
for (const c of cases) {
  const spec = c.game === 1
    ? {game:1, cIn:c.cIn, cOut:c.cOut, tiles:c.tiles}
    : {game:2, cIn:c.cIn, cOut:c.cOut, v:c.v, h:c.h};
  const v = S.validate(spec);
  if (v.ok !== c.valid) { diffValid++; if (diffValid < 4) console.log('validity diff', c); continue; }
  if (!c.valid) continue;
  run++;
  const got = S.score(spec).turns;
  if (got !== c.turns) { diffTurns++; if (diffTurns < 4) console.log('turn diff', got, c.turns, c); }
}
console.log('---');
console.log('BFS 판정 불일치 :', diffValid, '/', cases.length);
console.log('턴수 불일치     :', diffTurns, '/', run);

// round-trip the serialiser
let rt = 0;
for (const c of cases) {
  const spec = c.game === 1
    ? {game:1, cIn:c.cIn, cOut:c.cOut, tiles:c.tiles}
    : {game:2, cIn:c.cIn, cOut:c.cOut, v:c.v, h:c.h};
  const back = S.decode(S.encode(spec));
  if (JSON.stringify(back) !== JSON.stringify(spec)) { rt++; if (rt<3) console.log('roundtrip diff', S.encode(spec)); }
}
console.log('직렬화 왕복 실패 :', rt, '/', cases.length);
console.log('앵커 실패       :', fail);
console.log(fail + diffValid + diffTurns + rt === 0 ? '\nALL PASS' : '\nFAILURES PRESENT');
