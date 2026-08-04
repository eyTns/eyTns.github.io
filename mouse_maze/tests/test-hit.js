// Replays the game-2 edge hit-test over every pixel of the playfield to prove
// it can never produce an out-of-range wall index, and that the four gutters
// around a known tile map to the four expected walls.
const N=9, T=33, GAP=8, pitch=T+GAP, PW=N*T+(N-1)*GAP, TOL=13;
const vIdx=(r,c)=>r*8+c, hIdx=(r,c)=>r*9+c;

function hit(x, by){
  const fx = x % pitch, fy = by % pitch;
  const gi = Math.floor(x/pitch), gj = Math.floor(by/pitch);
  const dv = Math.min(Math.abs(fx-(T+GAP/2)), Math.abs(fx+GAP/2));
  const dh = Math.min(Math.abs(fy-(T+GAP/2)), Math.abs(fy+GAP/2));
  const vi = (fx > T/2) ? gi : gi-1, hj = (fy > T/2) ? gj : gj-1;
  const row = Math.max(0,Math.min(N-1,gj)), colc = Math.max(0,Math.min(N-1,gi));
  if (dv <= dh && dv <= TOL && vi>=0 && vi<=7) return {k:'v', i:vIdx(row,vi)};
  if (dh < dv && dh <= TOL && hj>=0 && hj<=7) return {k:'h', i:hIdx(hj,colc)};
  return null;
}

let bad=0, none=0, hits=0;
for (let x=0;x<PW;x++) for (let y=0;y<PW;y++){
  const r = hit(x+0.5, y+0.5);
  if (!r) { none++; continue; }
  hits++;
  if (r.k==='v' && (r.i<0 || r.i>=72)) bad++;
  if (r.k==='h' && (r.i<0 || r.i>=72)) bad++;
}
console.log('범위 밖 인덱스 :', bad);
console.log('벽 배치되는 픽셀:', hits, '/ 무반응:', none,
            '(' + (100*none/(hits+none)).toFixed(1) + '% 데드존)');

// the four gutters around tile (4,4)
const cx = 4*pitch + T/2, cy = 4*pitch + T/2;
const probes = {
  '오른쪽 틈': hit(4*pitch+T+3, cy),
  '왼쪽 틈'  : hit(4*pitch-3,   cy),
  '아래 틈'  : hit(cx, 4*pitch+T+3),
  '위쪽 틈'  : hit(cx, 4*pitch-3)
};
const want = { '오른쪽 틈':['v',vIdx(4,4)], '왼쪽 틈':['v',vIdx(4,3)],
               '아래 틈':['h',hIdx(4,4)],  '위쪽 틈':['h',hIdx(3,4)] };
let pf=0;
for (const k in probes){
  const g=probes[k], w=want[k];
  const ok = g && g.k===w[0] && g.i===w[1];
  if(!ok) pf++;
  console.log((ok?'ok  ':'FAIL'), k, '->', g ? g.k+g.i : 'null', '기대', w[0]+w[1]);
}
// board corners must never crash or wrap
for (const [x,y] of [[0,0],[PW-1,0],[0,PW-1],[PW-1,PW-1]]) hit(x+0.5,y+0.5);
console.log(bad+pf===0 ? '\nHIT TEST PASS' : '\nHIT TEST FAIL');
