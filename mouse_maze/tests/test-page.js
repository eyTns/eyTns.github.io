'use strict';
/* Runs the actual page script against a stub DOM and reports which speed pad is
 * pressed. The earlier repro only exercised currentLevel() in isolation, which
 * is not enough to answer "what does the page do after a first escape".
 *
 *   node test-page.js            # fresh storage
 *   node test-page.js '{"ach":{},"best":0,"bestWorst":0,"lvl":0}'
 *                                # storage left behind by an older build
 */
const fs = require('fs');

/* ------------------------------------------------------------- stub DOM */
function makeNode(id) {
  const node = {
    id,
    children: [],
    dataset: {},
    style: {},
    attrs: {},
    _class: '',
    textContent: '',
    _html: '',
    value: '',
    disabled: false,
    tabIndex: 0,
    get className() { return this._class; },
    set className(v) { this._class = String(v); },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); if (v === '') this.children = []; },
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(type, fn) { (this._on = this._on || {})[type] = fn; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 480 }; },
    select() {},
    focus() {}
  };
  node.classList = Object.create(node.classList);
  node.classList._set = new Set();
  node.getContext = () => ctx2d;
  return node;
}

const ctx2d = new Proxy({}, {
  get(_, prop) {
    if (prop === 'canvas') return { width: 400, height: 480 };
    return () => {};
  },
  set() { return true; }
});

const nodes = new Map();
const el = id => {
  if (!nodes.has(id)) nodes.set(id, makeNode(id));
  return nodes.get(id);
};

const picks = [1, 2].map(g => { const n = makeNode('pick' + g); n.dataset.game = String(g); return n; });
const prevs = [1, 2].map(g => { const n = makeNode('prev' + g); n.dataset.prev = String(g); return n; });

global.document = {
  getElementById: el,
  createElement: tag => makeNode('new:' + tag),
  querySelectorAll: sel => (sel === '.pick' ? picks : sel === '[data-prev]' ? prevs : []),
  addEventListener() {},
  documentElement: makeNode('html'),
  execCommand() {},
  get body() { return el('body'); },
  set body(v) {}
};

const lsMap = new Map();
global.localStorage = {
  getItem: k => (lsMap.has(k) ? lsMap.get(k) : null),
  setItem: (k, v) => lsMap.set(k, String(v)),
  removeItem: k => lsMap.delete(k)
};

let clock = 0;
let pending = null;
global.performance = { now: () => clock };
global.requestAnimationFrame = fn => { pending = fn; return 1; };
global.cancelAnimationFrame = () => { pending = null; };
Object.defineProperty(global, 'navigator', {   // Node ships a read-only navigator
  value: { clipboard: { writeText: async () => {} } }, configurable: true, writable: true
});
global.location = { href: 'http://localhost/' };
global.window = global;
global.self = global;
global.addEventListener = () => {};
global.devicePixelRatio = 1;
global.getComputedStyle = () => ({ getPropertyValue: () => '' });

/* seed storage the way an older build would have left it */
const seed = process.argv[2];
if (seed) { lsMap.set('mm.progress.1', seed); lsMap.set('mm.progress.2', seed); }
// The turn counter is the only window onto the maze the page is holding, and it
// stays covered until the game has been shared. Uncover it so the phase checks
// below can tell a wall that was laid from one that was refused.
lsMap.set('mm.shared', '1');

/* --------------------------------------------------------- run the page */
global.MazeSim = require('../sim.js');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>\n([\s\S]*)\n<\/script>/)[1];
eval(script);

/* ------------------------------------------------------------ scenario */
function pads() {
  return el('speeds').children.map((b, i) => ({
    slot: i,
    on: b.className.includes('on'),
    hidden: b.style.visibility === 'hidden',
    label: b.getAttribute('aria-label') || null
  }));
}
// Release the mouse and hand the animation frames it asks for until it is done.
// dt is clamped inside the page, so a huge clock step is still one move.
function runToEnd() {
  el('go').onclick();
  for (let i = 0; i < 4000 && pending; i++) {
    clock += 1000;
    const fn = pending; pending = null; fn(clock);
  }
}
function report(label) {
  const p = pads();
  const shown = p.filter(x => !x.hidden);
  const on = p.find(x => x.on);
  console.log(label.padEnd(34),
    p.map(x => (x.hidden ? '·' : x.on ? '[' + x.slot + ']' : ' ' + x.slot + ' ')).join(''),
    ' 보이는칸=' + shown.length,
    ' 눌린칸=' + (on ? on.slot + ' (' + on.label + ')' : '없음'));
  return on ? on.slot : null;
}

(async () => {
  await new Promise(r => setTimeout(r, 20));         // let loadProgress settle

  picks[1]._on.click();                              // open Maze 2
  const before = report('2탄 진입 직후');

  runToEnd();
  const after = report('빈 판 완주 후 (first 획득)');

  let fail = 0;
  const t = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) fail++; };
  t('완주 전에는 기본 속도 칸이 눌림', before === 1);
  t('first 해금 후에도 기본 속도 칸이 눌림', after === 1);
  t('느림 칸이 자동으로 눌리지 않음', after !== 0);
  t('느림 칸이 보이게 됨', !pads()[0].hidden);
  // The invariant itself: whatever storage held at load, it must now hold a
  // value that is on an open rung, so future unlocks cannot re-project it.
  {
    const saved = JSON.parse(localStorage.getItem('mm.progress.2') || '{}');
    t('저장된 속도가 사다리 위의 값', [2,4,7.5,20,60,200].includes(saved.spd));
  }
  /* ---------------------------------------------------------------- phases
   * The board is open only while building. Once the mouse is released it stays
   * shut until Reset, and Submit opens only on a walk that reached the exit.
   * Before this, one click on a finished board both wiped the walk and laid a
   * brick, so an edited maze could be submitted without ever being run.
   */
  el('back').onclick();
  picks[0]._on.click();                              // Maze 1: any tile is a wall

  const turns = () => el('preview').innerHTML;
  // The canvas is 390x450 inside a rect the stub reports as 400x480.
  const at = (row, col) => ({
    clientX: (col * 30 + 15) * (400 / 390),
    clientY: (30 + row * 30 + 15) * (480 / 450)
  });
  const empty = turns();
  el('board')._on.click(at(6, 0));                   // straight into the walk
  const built = turns();
  t('편집 중에는 판 클릭이 벽을 놓음', built !== empty);

  runToEnd();
  t('완주하면 Save 가 잠김', el('save').disabled === true);
  t('완주하면 Load 가 잠김', el('load').disabled === true);
  const walked = el('status').textContent;
  el('board')._on.click(at(3, 0));
  t('완주 화면에서 판 클릭은 벽을 놓지 않음', turns() === built);
  t('판을 눌러도 편집이 열리지 않음', el('save').disabled === true);

  el('reset').onclick();
  t('리셋 한 번에 편집이 열림', el('save').disabled === false);
  t('리셋은 벽을 남김', turns() === built);
  t('결과만 지우는 리셋은 상태줄을 건드리지 않음', el('status').textContent === walked);
  el('reset').onclick();
  t('편집 중의 리셋은 벽을 전부 지움', turns() === empty);

  const sheetOpen = () => el('veil').classList.contains('on');
  el('submit').onclick();
  t('편집 중 Submit 은 아무 창도 열지 않음', !sheetOpen());
  runToEnd();
  el('submit').onclick();
  t('완주 뒤 Submit 은 창을 엶', sheetOpen());
  el('veil').classList.remove('on');

  el('reset').onclick();
  el('go').onclick();                                // release
  clock += 1000; { const fn = pending; pending = null; fn(clock); }   // one move
  el('go').onclick();                                // stop partway
  t('중간에 멈추면 Save 가 잠김', el('save').disabled === true);
  el('submit').onclick();
  t('중간에 멈춘 뒤 Submit 은 아무 창도 열지 않음', !sheetOpen());
  el('reset').onclick();
  t('중간 정지 뒤 리셋으로 편집이 열림', el('save').disabled === false);

  console.log(fail ? '\n' + fail + ' FAILED' : '\nALL PASS');
  process.exit(fail ? 1 : 0);
})();
