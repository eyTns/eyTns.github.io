// Pulls the real functions out of index.html and exercises them, so these
// checks cannot drift from the shipped code.
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'),'utf8');
const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error('missing '+name); return m[0]; };

var P;
// One eval so the snippets can see each other; top-level const becomes var so
// they reach this module's scope.
eval([
  grab('LADDER', /const LADDER = \[[\s\S]*?\n\];/),
  grab('CONFIG', /const CONFIG = \{[\s\S]*?\n\};/),
  grab('BASE', /const BASE_LEVEL = 1;\nconst BASE_SPEED = [^\n]*/),
  grab('HEAT+heatColor', /const HEAT = \[[\s\S]*?^\}$/m),
  grab('unlockedLevels', /function unlockedLevels\(g\)\{[\s\S]*?\n}/),
  grab('currentLevel', /function currentLevel\(g\)\{[\s\S]*?\n}/)
].join('\n').replace(/^const /gm, 'var '));

let fail = 0;
const t = (name, cond) => { console.log((cond?'ok  ':'FAIL') + ' ' + name); if(!cond) fail++; };

// --- heat ramp: log-spaced anchors, green through yellow to violet to black ---
console.log('방문 횟수 -> 색');
for (const v of [0,1,3,6,10,32,100,350,1000,2200,5000,36314])
  console.log('  v='+String(v).padStart(6), heatColor(v));
t('v=0 원작 초록', heatColor(0) === 'rgb(51,204,0)');
t('v=6 원작 마지막 단계', heatColor(6) === 'rgb(141,222,0)');
t('v=10 연두', heatColor(10) === 'rgb(176,227,0)');
t('v=100 노랑', heatColor(100) === 'rgb(250,240,0)');
t('v=1000 연보라', heatColor(1000) === 'rgb(196,162,232)');
t('v=5000 검정', heatColor(5000) === 'rgb(18,18,26)');
t('5000 초과는 검정 고정', heatColor(80000) === 'rgb(18,18,26)');
t('단조 증가: 밝기가 노랑까지 오르고 이후 내려감',
  (() => { const lum = v => { const c=heatColor(v).match(/\d+/g).map(Number);
             return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
           return lum(6) < lum(100) && lum(100) > lum(1000) && lum(1000) > lum(5000); })());

// --- speed ladder gating: fixed slots, slow rung at index 0 ---
P = { 1:{ach:{},spd:BASE_SPEED}, 2:{ach:{},spd:BASE_SPEED} };
t('사다리 6칸', LADDER.length === 6);
t('속도값 순서', JSON.stringify(LADDER.map(l=>l.v)) === '[2,4,7.5,20,60,200]');
t('느림은 first 업적으로 해금', LADDER[0].ach === 'first');
t('기본 속도 칸은 항상 열림', LADDER[BASE_LEVEL].ach === null);
t('기본 속도는 4', BASE_SPEED === 4);
t('시작 시 열린 칸은 기본 하나', JSON.stringify(unlockedLevels(1)) === '[1]');
t('시작 선택은 기본 속도', LADDER[currentLevel(1)].v === 4);

P[1].ach['first'] = 1;
t('첫 탈출로 느림 해금', JSON.stringify(unlockedLevels(1)) === '[0,1]');
t('느림 해금이 속도를 느림으로 바꾸지 않음', LADDER[currentLevel(1)].v === 4);
P[1].spd = 2;
t('직접 고른 느림은 유지', LADDER[currentLevel(1)].v === 2);

// the game must never press a pad on the player's behalf
P[1] = { ach:{ first:1 }, spd:BASE_SPEED };
P[1].ach['m400']=1; P[1].ach['m1136']=1; P[1].ach['m4000']=1; P[1].ach['m20000']=1;
t('전 단계 해금 후에도 기본 속도 유지', LADDER[currentLevel(1)].v === 4);
// Three writes, each of which either restores or pins the player's own choice,
// never invents a new one: (1) restore from storage, (2) load-time pinning of an
// off-ladder legacy value onto the rung it already resolves to, (3) a pad click.
const spdWrites = (html.match(/\.spd = /g) || []).length;
t('속도를 쓰는 지점은 복원, 로드시 고정, 클릭 셋뿐', spdWrites === 3);
t('로드시 고정은 loadProgress 안에만 있음',
  /unlockedLevels\(g\)/.test(html.match(/async function loadProgress\(\)\{[\s\S]*?\n\}/)[0]));
t('finishRun 은 속도를 건드리지 않음',
  !/spd/.test(html.match(/function finishRun\(\)\{[\s\S]*?\n\}/)[0]));

// a stored speed that cannot be honoured must land on the base rung, not slow
for (const bad of [undefined, null, NaN, 0, 'fast', 999, 3.7, 2.5, 30]) {
  P[1] = { ach:{ first:1, m400:1, m1136:1, m4000:1, m20000:1 }, spd:bad };
  t('저장값 ' + String(bad) + ' -> 느림으로 떨어지지 않음', LADDER[currentLevel(1)].v !== 2);
}
P[1] = { ach:{ first:1 }, spd:undefined };
t('저장값 없으면 기본 속도', LADDER[currentLevel(1)].v === 4);

P[1] = { ach:{ first:1, m400:1, m800:1 }, spd:BASE_SPEED };
t('800 은 칸을 늘리지 않음', unlockedLevels(1).length === 3);
P[1].ach['m1136']=1; P[1].ach['m4000']=1; P[1].ach['m20000']=1;
t('전부 해금 -> 6칸', unlockedLevels(1).length === 6);

// the choice is stored as a speed, so rebalancing cannot reassign it silently
P[1].spd = 20;
t('20 선택 유지', LADDER[currentLevel(1)].v === 20);
P[1].ach = { first:1, m400:1 };            // 커트라인 상향으로 상위가 다시 잠김
t('잠기면 아래 속도로만 내려감', LADDER[currentLevel(1)].v === 7.5);
P[1].ach = {};
t('전부 잠기면 기본 속도', LADDER[currentLevel(1)].v === 4);
t('2탄은 따로 잠겨 있음', JSON.stringify(unlockedLevels(2)) === '[1]');

// --- the locked counter must not react to a blocked maze ---
const block = html.match(/const pv = \$\('preview'\);[\s\S]*?renderSpeeds\(\);/)[0];
const iLocked = block.indexOf('!P.shared'), iNoExit = block.indexOf('!ok');
t('잠김 분기가 유효성 분기보다 먼저', iLocked >= 0 && iNoExit > iLocked);
t('유효성 분기는 else if 안에만 있음', /\}\s*else if \(!ok\)/.test(block));
t('잠김 분기는 ok 를 읽지 않음',
  !block.slice(iLocked, iNoExit).includes('ok)') );
t('잠김 문구는 항상 동일', (block.match(/Share to unlock/g)||[]).length === 1);

// --- no wall is ever cleared by moving a marker ---
t('잠긴 칸은 제거가 아니라 숨김', /visibility = 'hidden'/.test(html));
t('업적창은 5열', /grid-template-columns:repeat\(5,1fr\)/.test(html));
t('모바일 속도칸은 6열', /\.side \.speeds\{grid-template-columns:repeat\(6,1fr\)\}/.test(html));
t('속도칸 간격이 side 간격과 동일',
  /\.side\{[^}]*gap:7px/.test(html) && /\.speeds\{display:grid;grid-template-columns:repeat\(3,1fr\);gap:7px\}/.test(html));
t('Save 가 Load 보다 앞', html.indexOf('id="save"') < html.indexOf('id="load"'));
t('Submit 은 Load 바로 아래', html.indexOf('id="load"') < html.indexOf('id="submit"'));
t('Leaderboard 는 Awards 아래', html.indexOf('id="awards"') < html.indexOf('id="leaderboard"'));
t('Leaderboard 는 속도칸 위', html.indexOf('id="leaderboard"') < html.indexOf('id="speeds"'));
{
  // The request body must carry the maze and nothing resembling a score, so the
  // server has no client-supplied number it could be tempted to trust.
  const body = html.match(/body: JSON\.stringify\(\{[^}]*\}\)/)[0];
  t('제출 본문에 미로가 있음', /maze: code/.test(body), body);
  t('제출 본문에 점수가 없음', !/turns|score|worst/i.test(body), body);
}
t('100만 초과는 1,000,000+ 표기', /1,000,000\+/.test(html));
t('제출 재시도 간격 10초', /SUBMIT_COOLDOWN = 10000/.test(html));
t('마커 이동 시 벽 삭제 코드 없음', !/spec\.tiles\.splice/.test(html.split('const by = y - oy;')[0]));
t('출구 보호 문구 제거됨', !html.includes('exit tile has to stay open'));
t('입구 보호 문구 제거됨', !html.includes('entrance tile has to stay open'));

// --- every upper-case constant used must actually be declared ---
// A block edit once deleted the API_BASE declarations while leaving their uses
// behind; that is a runtime ReferenceError no syntax check would catch.
{
  const script = html.match(/<script>\n([\s\S]*)\n<\/script>/)[1]
    .replace(/\/\*[\s\S]*?\*\//g, ' ')      // block comments
    .replace(/\/\/[^\n]*/g, ' ')             // line comments
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")     // string literals
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const known = new Set(['JSON','Math','Date','Infinity','NaN','P','S','Promise','Array','Object','Number','String','Boolean','R','G','B','T','N','W','H','L']);
  const used = new Set((script.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) || []));
  const missing = [];
  for (const id of used) {
    if (known.has(id)) continue;
    if (new RegExp('(?:const|let|var|function)\\s+' + id + '\\b').test(script)) continue;
    missing.push(id);
  }
  t('선언 없이 쓰이는 상수 없음' + (missing.length ? ' -> ' + missing.join(', ') : ''), missing.length === 0);
}

console.log(fail ? '\n'+fail+' FAILED' : '\nALL PASS');
process.exit(fail?1:0);
