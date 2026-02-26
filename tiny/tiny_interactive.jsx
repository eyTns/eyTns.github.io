const { useState, useRef, useEffect, useCallback, useMemo } = React;

// ===== Constants =====
const CS = 35;
const GRID_W = 9;
const GRID_H = 9;
const GRID_PX = GRID_W * CS;
const BTN = { padding:'6px 14px', borderRadius:6, border:'1px solid #cbd5e1', background:'#f8fafc', cursor:'pointer', fontSize:13, fontFamily:'system-ui,sans-serif' };

// Piece definitions: cells as [row_offset, col_offset] from top-left of bounding box.
// xRow/xCol marks the position of the x marker (leftmost square chosen by player).
// The player picks the column where x lands; bounding box col = chosen_col - 1 - xCol.
//
// Verified against BOI 2012 problem images:
//   1: x         2: □    3: x□    4: □     5: x□□   6: □     7:  □    8: □□   9: x□
//                   x              □                  x□       x□       x        □
//                                  x
const PIECES = {
  1: { cells:[[0,0]],                     w:1, h:1, xRow:0, xCol:0 },
  2: { cells:[[0,0],[1,0]],               w:1, h:2, xRow:1, xCol:0 },
  3: { cells:[[0,0],[0,1]],               w:2, h:1, xRow:0, xCol:0 },
  4: { cells:[[0,0],[1,0],[2,0]],          w:1, h:3, xRow:2, xCol:0 },
  5: { cells:[[0,0],[0,1],[0,2]],          w:3, h:1, xRow:0, xCol:0 },
  6: { cells:[[0,0],[1,0],[1,1]],          w:2, h:2, xRow:1, xCol:0 },
  7: { cells:[[0,1],[1,0],[1,1]],          w:2, h:2, xRow:1, xCol:0 },
  8: { cells:[[0,0],[0,1],[1,0]],          w:2, h:2, xRow:1, xCol:0 },
  9: { cells:[[0,0],[0,1],[1,1]],          w:2, h:2, xRow:0, xCol:0 },
};

const PIECE_COLORS = {
  0:'#f1f5f9', 1:'#fbbf24', 2:'#fb923c', 3:'#f87171',
  4:'#f472b6', 5:'#c084fc', 6:'#818cf8', 7:'#60a5fa',
  8:'#22d3ee', 9:'#34d399',
};
const PIECE_BORDERS = {
  0:'#e2e8f0', 1:'#f59e0b', 2:'#f97316', 3:'#ef4444',
  4:'#ec4899', 5:'#a855f7', 6:'#6366f1', 7:'#3b82f6',
  8:'#06b6d4', 9:'#10b981',
};

const EXAMPLES = [
  { name:'Demo (20)', data:'20\n5\n4\n1\n6\n7\n6\n4\n4\n7\n9\n5\n5\n6\n8\n3\n4\n3\n7\n4\n2' },
  { name:'Line Clear', data:'12\n5\n5\n5\n3\n3\n3\n3\n1\n5\n5\n5\n1' },
];

// ===== Strategies =====
const Q1_PATTERN = [5,3,5,3,5,3,5,3,5,3,5,3,5,3,5,3,5,3];
const Q1_COLS    = [1,4,1,6,1,8,4,4,7,6,1,8,4,4,7,6,1,8];

function isGridEmpty(grid) {
  for (let r = 0; r < GRID_H; r++)
    for (let c = 0; c < GRID_W; c++)
      if (grid[r][c] !== 0) return false;
  return true;
}

function matchesPattern(seq, startIdx, pattern) {
  if (startIdx + pattern.length > seq.length) return false;
  for (let i = 0; i < pattern.length; i++)
    if (seq[startIdx + i] !== pattern[i]) return false;
  return true;
}

function applyStrategy(grid, seq, startIdx, pattern, cols) {
  let g = grid;
  let idx = startIdx;
  let choices = [];
  let lines = 0;
  let rounds = 0;
  while (isGridEmpty(g) && matchesPattern(seq, idx, pattern)) {
    for (let i = 0; i < pattern.length; i++) {
      const result = executeMove(g, pattern[i], cols[i]);
      if (!result.success) return { g, idx, choices, lines, rounds, error: result.reason };
      g = result.grid;
      lines += result.cleared;
      choices.push(cols[i]);
    }
    idx += pattern.length;
    rounds++;
  }
  return { g, idx, choices, lines, rounds, error: null };
}

// ===== Pure Game Logic =====
function createEmptyGrid() {
  return Array.from({length:GRID_H}, ()=>Array(GRID_W).fill(0));
}

function isValidColumn(pieceType, col) {
  const p = PIECES[pieceType];
  const c0 = col - 1 - p.xCol;
  return c0 >= 0 && c0 + p.w <= GRID_W;
}

function getValidColumns(pieceType) {
  const cols = [];
  for (let c = 1; c <= 9; c++) {
    if (isValidColumn(pieceType, c)) cols.push(c);
  }
  return cols;
}

function findLandingRow(grid, pieceType, col) {
  const p = PIECES[pieceType];
  const c0 = col - 1 - p.xCol;
  let landRow = -1;
  for (let startRow = -(p.h - 1); startRow < GRID_H; startRow++) {
    let fits = true;
    for (const [dr, dc] of p.cells) {
      const r = startRow + dr;
      const c = c0 + dc;
      if (c < 0 || c >= GRID_W) { fits = false; break; }
      if (r >= GRID_H) { fits = false; break; }
      if (r >= 0 && grid[r][c] !== 0) { fits = false; break; }
    }
    if (fits) {
      landRow = startRow;
    } else {
      // Piece is blocked — can't fall further (continuous fall simulation)
      break;
    }
  }
  // Piece must fully fit inside the 9x9 grid
  if (landRow === -1) return -1;
  for (const [dr] of p.cells) {
    if (landRow + dr < 0 || landRow + dr >= GRID_H) return -1;
  }
  return landRow;
}

function placePiece(grid, pieceType, col, landRow) {
  const p = PIECES[pieceType];
  const c0 = col - 1 - p.xCol;
  const ng = grid.map(r=>[...r]);
  for (const [dr, dc] of p.cells) {
    ng[landRow + dr][c0 + dc] = pieceType;
  }
  return ng;
}

function clearLines(grid) {
  let cleared = 0;
  let ng = grid.filter(row => {
    const full = row.every(c => c !== 0);
    if (full) cleared++;
    return !full;
  });
  while (ng.length < GRID_H) ng.unshift(Array(GRID_W).fill(0));
  return { grid: ng, cleared };
}

function executeMove(grid, pieceType, col) {
  if (!isValidColumn(pieceType, col)) {
    return { success:false, reason:`열 ${col}은(는) 조각 ${pieceType}에 유효하지 않음` };
  }
  const landRow = findLandingRow(grid, pieceType, col);
  if (landRow < 0) {
    return { success:false, reason:`조각 ${pieceType}이(가) 열 ${col}에 들어가지 않음` };
  }
  let ng = placePiece(grid, pieceType, col, landRow);
  const { grid: cg, cleared } = clearLines(ng);
  return { success:true, grid:cg, cleared, landRow };
}

function parsePieceSequence(text) {
  const lines = text.trim().split(/\n/).map(l=>l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('빈 입력');
  const firstNum = parseInt(lines[0]);
  // If first line is a single number that matches remaining line count, treat as N
  if (lines.length > 1 && firstNum === lines.length - 1) {
    return lines.slice(1).map(l => {
      const n = parseInt(l);
      if (n < 1 || n > 9) throw new Error(`유효하지 않은 조각 번호: ${l}`);
      return n;
    });
  }
  // Otherwise parse all numbers
  const nums = text.trim().split(/[\s,]+/).map(Number).filter(n => n >= 1 && n <= 9);
  if (nums.length === 0) throw new Error('유효한 조각 번호 없음');
  // If first number equals count of rest, skip it
  if (nums[0] === nums.length - 1 && nums.length > 1) return nums.slice(1);
  return nums;
}

function downloadBlob(blob, filename) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(u);
}

// ===== PieceDisplay =====
function PieceDisplay({ type, size=16, highlight=false }) {
  const p = PIECES[type];
  const cellSet = new Set(p.cells.map(([r,c])=>`${r},${c}`));
  const rows = [];
  for (let r = 0; r < p.h; r++) {
    const cols = [];
    for (let c = 0; c < p.w; c++) {
      const isCell = cellSet.has(`${r},${c}`);
      const isX = r === p.xRow && c === p.xCol;
      cols.push(
        <div key={c} style={{
          width:size, height:size,
          background: isCell ? PIECE_COLORS[type] : 'transparent',
          border: isCell ? `1.5px solid ${PIECE_BORDERS[type]}` : 'none',
          borderRadius: 2,
          position:'relative',
        }}>
          {isCell && isX && <span style={{
            position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            fontSize:size*0.6, fontWeight:700, color:'#fff', lineHeight:1, textShadow:'0 0 2px rgba(0,0,0,0.4)'
          }}>&times;</span>}
        </div>
      );
    }
    rows.push(<div key={r} style={{display:'flex', gap:1}}>{cols}</div>);
  }
  return (
    <div style={{
      display:'inline-flex', flexDirection:'column', gap:1, padding:3,
      borderRadius:4, background: highlight ? '#e0e7ff' : 'transparent',
      border: highlight ? '2px solid #818cf8' : '2px solid transparent',
    }}>{rows}</div>
  );
}

// ===== Main Component =====
function TinyGame() {
  const [pieceSeq, setPieceSeq] = useState([]);
  const [totalPieces, setTotalPieces] = useState(0);
  const [grid, setGrid] = useState(createEmptyGrid());
  const [curIdx, setCurIdx] = useState(0);
  const [colChoices, setColChoices] = useState([]);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [history, setHistory] = useState([]);
  const [showPaste, setShowPaste] = useState(false);
  const [paste, setPaste] = useState('');
  const [hoveredCol, setHoveredCol] = useState(null);
  const [ghostCells, setGhostCells] = useState([]);
  const [flashRows, setFlashRows] = useState([]);

  const cvRef = useRef(null);
  const fiRef = useRef(null);

  // ===== Game Actions =====
  const startNewGame = useCallback((seq) => {
    setPieceSeq(seq);
    setTotalPieces(seq.length);
    setGrid(createEmptyGrid());
    setCurIdx(0);
    setColChoices([]);
    setLinesCleared(0);
    setGameOver(false);
    setGameOverReason('');
    setHistory([]);
    setHoveredCol(null);
    setGhostCells([]);
  }, []);

  const resetGame = useCallback(() => {
    if (pieceSeq.length > 0) startNewGame([...pieceSeq]);
  }, [pieceSeq, startNewGame]);

  const pushHistory = useCallback(() => {
    setHistory(h => {
      const entry = { grid:grid.map(r=>[...r]), curIdx, colChoices:[...colChoices], linesCleared, gameOver, gameOverReason };
      const n = [...h, entry];
      return n.length > 500 ? n.slice(-500) : n;
    });
  }, [grid, curIdx, colChoices, linesCleared, gameOver, gameOverReason]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length-1];
      setGrid(prev.grid);
      setCurIdx(prev.curIdx);
      setColChoices(prev.colChoices);
      setLinesCleared(prev.linesCleared);
      setGameOver(prev.gameOver);
      setGameOverReason(prev.gameOverReason);
      setHoveredCol(null);
      setGhostCells([]);
      return h.slice(0,-1);
    });
  }, []);

  const handleColumnSelect = useCallback((col) => {
    if (gameOver || curIdx >= pieceSeq.length) return;
    const pieceType = pieceSeq[curIdx];
    pushHistory();
    const result = executeMove(grid, pieceType, col);
    if (!result.success) {
      setGameOver(true);
      setGameOverReason(result.reason);
      return;
    }
    // Flash cleared rows briefly
    if (result.cleared > 0) {
      // Find which rows were full before clearing
      const placed = placePiece(grid, pieceType, col, result.landRow);
      const fullRows = [];
      placed.forEach((row, i) => { if (row.every(c=>c!==0)) fullRows.push(i); });
      if (fullRows.length > 0) {
        setFlashRows(fullRows);
        setTimeout(() => setFlashRows([]), 200);
      }
    }
    setGrid(result.grid);
    setCurIdx(curIdx + 1);
    setColChoices([...colChoices, col]);
    setLinesCleared(linesCleared + result.cleared);
    setHoveredCol(null);
    setGhostCells([]);
  }, [gameOver, curIdx, pieceSeq, grid, colChoices, linesCleared, pushHistory]);

  // ===== Input Handling =====
  const parseInput = useCallback((txt) => {
    try {
      const seq = parsePieceSequence(txt);
      startNewGame(seq);
    } catch(e) { alert('파싱 오류: ' + e.message); }
  }, [startNewGame]);

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const txt = ev.target.result;
      try {
        const obj = JSON.parse(txt);
        if (obj._type === 'tiny_save') {
          setGrid(obj.grid);
          setCurIdx(obj.curIdx);
          setColChoices(obj.colChoices);
          setPieceSeq(obj.pieceSeq);
          setTotalPieces(obj.totalPieces);
          setLinesCleared(obj.linesCleared);
          setGameOver(obj.gameOver || false);
          setGameOverReason(obj.gameOverReason || '');
          setHistory([]);
          return;
        }
      } catch(_) {}
      parseInput(txt);
    };
    reader.readAsText(f);
    if (fiRef.current) fiRef.current.value = '';
  }, [parseInput]);

  const saveProgress = useCallback(() => {
    const obj = { _type:'tiny_save', grid, curIdx, colChoices, pieceSeq, totalPieces, linesCleared, gameOver, gameOverReason };
    downloadBlob(new Blob([JSON.stringify(obj)], {type:'application/json'}), 'tiny_progress.json');
  }, [grid, curIdx, colChoices, pieceSeq, totalPieces, linesCleared, gameOver, gameOverReason]);

  const runQ1Strategy1 = useCallback(() => {
    if (gameOver || curIdx >= pieceSeq.length) return;
    if (!isGridEmpty(grid)) return;
    if (!matchesPattern(pieceSeq, curIdx, Q1_PATTERN)) return;
    pushHistory();
    const result = applyStrategy(grid, pieceSeq, curIdx, Q1_PATTERN, Q1_COLS);
    if (result.error) {
      setGameOver(true);
      setGameOverReason(result.error);
      return;
    }
    setGrid(result.g);
    setCurIdx(curIdx + result.choices.length);
    setColChoices([...colChoices, ...result.choices]);
    setLinesCleared(linesCleared + result.lines);
    setHoveredCol(null);
    setGhostCells([]);
  }, [gameOver, curIdx, pieceSeq, grid, colChoices, linesCleared, pushHistory]);

  const exportResult = useCallback(() => {
    const output = colChoices.join('\n') + '\n';
    downloadBlob(new Blob([output], {type:'text/plain'}), 'tiny_output.txt');
  }, [colChoices]);

  // ===== Ghost Piece Calculation =====
  const computeGhost = useCallback((col0) => {
    if (curIdx >= pieceSeq.length || gameOver) return [];
    const col = col0 + 1;
    const pieceType = pieceSeq[curIdx];
    if (!isValidColumn(pieceType, col)) return [];
    const landRow = findLandingRow(grid, pieceType, col);
    if (landRow < 0) return [];
    const p = PIECES[pieceType];
    const cOff = col - 1 - p.xCol;
    return p.cells.map(([dr, dc]) => [landRow + dr, cOff + dc]);
  }, [curIdx, pieceSeq, grid, gameOver]);

  // ===== Canvas Rendering =====
  const drawGrid = useCallback(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const totalW = GRID_PX;
    const totalH = GRID_PX + 24; // extra space for column numbers
    cv.width = totalW * dpr;
    cv.height = totalH * dpr;
    cv.style.width = totalW + 'px';
    cv.style.height = totalH + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, totalW, totalH);

    const flashSet = new Set(flashRows);
    const ghostSet = new Set(ghostCells.map(([r,c])=>`${r},${c}`));

    // Draw cells
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < GRID_W; c++) {
        const x = c * CS, y = r * CS;
        const val = grid[r][c];

        // Flash effect for cleared rows
        if (flashSet.has(r)) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x, y, CS, CS);
        } else {
          ctx.fillStyle = PIECE_COLORS[val];
          ctx.fillRect(x, y, CS, CS);
        }

        // Border
        ctx.strokeStyle = val === 0 ? '#e2e8f0' : PIECE_BORDERS[val];
        ctx.lineWidth = val === 0 ? 0.5 : 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, CS - 1, CS - 1);

        // Piece number in occupied cells
        if (val !== 0 && !flashSet.has(r)) {
          ctx.fillStyle = '#ffffffcc';
          ctx.font = `bold ${Math.round(CS * 0.35)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), x + CS/2, y + CS/2);
        }
      }
    }

    // Draw ghost piece
    if (ghostCells.length > 0 && curIdx < pieceSeq.length) {
      const pt = pieceSeq[curIdx];
      ctx.globalAlpha = 0.35;
      for (const [r, c] of ghostCells) {
        if (r >= 0 && r < GRID_H && c >= 0 && c < GRID_W) {
          ctx.fillStyle = PIECE_COLORS[pt];
          ctx.fillRect(c * CS + 2, r * CS + 2, CS - 4, CS - 4);
          ctx.strokeStyle = PIECE_BORDERS[pt];
          ctx.lineWidth = 2;
          ctx.strokeRect(c * CS + 2, r * CS + 2, CS - 4, CS - 4);
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // Column highlight
    if (hoveredCol !== null) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
      ctx.fillRect(hoveredCol * CS, 0, CS, GRID_PX);
    }

    // Grid outer border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, GRID_PX, GRID_PX);

    // Column numbers
    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${Math.round(CS * 0.32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let c = 0; c < GRID_W; c++) {
      const isHovered = hoveredCol === c;
      ctx.fillStyle = isHovered ? '#4f46e5' : '#64748b';
      ctx.fillText(String(c + 1), c * CS + CS/2, GRID_PX + 5);
    }
  }, [grid, ghostCells, hoveredCol, flashRows, curIdx, pieceSeq]);

  useEffect(() => { drawGrid(); }, [drawGrid]);

  // ===== Mouse Events on Canvas =====
  const getCol = useCallback((e) => {
    const cv = cvRef.current;
    if (!cv) return -1;
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.floor(x / CS);
  }, []);

  const onCanvasClick = useCallback((e) => {
    if (curIdx >= pieceSeq.length || gameOver) return;
    const col0 = getCol(e);
    if (col0 >= 0 && col0 < GRID_W) {
      handleColumnSelect(col0 + 1);
    }
  }, [curIdx, pieceSeq, gameOver, getCol, handleColumnSelect]);

  const onCanvasMouseMove = useCallback((e) => {
    if (curIdx >= pieceSeq.length || gameOver) { setHoveredCol(null); setGhostCells([]); return; }
    const col0 = getCol(e);
    if (col0 >= 0 && col0 < GRID_W) {
      setHoveredCol(col0);
      setGhostCells(computeGhost(col0));
    } else {
      setHoveredCol(null);
      setGhostCells([]);
    }
  }, [curIdx, pieceSeq, gameOver, getCol, computeGhost]);

  const onCanvasLeave = useCallback(() => {
    setHoveredCol(null);
    setGhostCells([]);
  }, []);

  // ===== Keyboard Events =====
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleColumnSelect(num);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [undo, handleColumnSelect]);

  // ===== Derived State =====
  const currentPiece = curIdx < pieceSeq.length ? pieceSeq[curIdx] : null;
  const isComplete = pieceSeq.length > 0 && curIdx >= pieceSeq.length && !gameOver;
  const validCols = currentPiece ? getValidColumns(currentPiece) : [];

  const canQ1S1 = pieceSeq.length > 0 && !gameOver && !isComplete
    && isGridEmpty(grid) && matchesPattern(pieceSeq, curIdx, Q1_PATTERN);

  // Next pieces (up to 5)
  const nextPieces = pieceSeq.slice(curIdx + 1, curIdx + 6);

  // ===== JSX =====
  return (
    <div style={{fontFamily:'system-ui,sans-serif', maxWidth:1000, margin:'0 auto', padding:16, color:'#1e293b'}}>
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
        <span style={{fontSize:26}}>&#x1F9E9;</span>
        <div>
          <h2 style={{margin:0, fontSize:19}}>Tiny Interactive</h2>
          <p style={{margin:0, fontSize:12, color:'#94a3b8'}}>
            1-9 키: 열 선택 &middot; Ctrl+Z: 되돌리기 &middot; 클릭으로 열 선택
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'10px 0'}}>
        <input ref={fiRef} type="file" accept=".in,.txt,.json,*/*" onChange={handleFile} style={{display:'none'}} />
        <label onClick={()=>fiRef.current?.click()} style={{...BTN, display:'inline-block'}}>&#x1F4C2; 열기</label>
        <button onClick={()=>setShowPaste(!showPaste)} style={BTN}>&#x1F4CB; 텍스트</button>
        {EXAMPLES.map((ex,i) => (
          <button key={i} onClick={()=>parseInput(ex.data)} style={BTN}>&#x1F4DD; {ex.name}</button>
        ))}
        {pieceSeq.length > 0 && <button onClick={undo} disabled={!history.length} style={{...BTN, opacity:history.length?1:.4}}>&#x21A9; 되돌리기</button>}
        {pieceSeq.length > 0 && <button onClick={resetGame} style={BTN}>&#x1F504; 초기화</button>}
        {canQ1S1 && <button onClick={runQ1Strategy1} style={{...BTN, background:'#fef3c7', borderColor:'#fbbf24', fontWeight:600}}>Q1 전략1</button>}
        {pieceSeq.length > 0 && <button onClick={saveProgress} style={BTN}>&#x1F4E5; 진행 저장</button>}
        {pieceSeq.length > 0 && <button onClick={exportResult} style={{...BTN, background: isComplete?'#059669':'#3b82f6', color:'#fff', borderColor: isComplete?'#059669':'#3b82f6'}}>&#x1F4BE; 결과 내보내기</button>}
      </div>

      {/* Paste area */}
      {showPaste && (
        <div style={{marginBottom:12}}>
          <textarea value={paste} onChange={e=>setPaste(e.target.value)}
            placeholder={'예:\n20\n5\n4\n1\n6\n7\n...'}
            rows={6} style={{width:'100%', boxSizing:'border-box', fontFamily:'monospace', fontSize:13, padding:8, borderRadius:6, border:'1px solid #cbd5e1', resize:'vertical'}} />
          <button onClick={()=>{parseInput(paste);setShowPaste(false);}} style={{...BTN, marginTop:4}}>적용</button>
        </div>
      )}

      {/* Stats bar */}
      {pieceSeq.length > 0 && (
        <div style={{display:'flex', gap:16, alignItems:'center', marginBottom:8, fontSize:14, flexWrap:'wrap'}}>
          <span>&#x1F9E9; <b>{curIdx}</b>/{totalPieces}</span>
          <span>&#x1F4CF; <b>{linesCleared}</b>줄 클리어</span>
          {gameOver
            ? <span style={{color:'#dc2626', fontWeight:600}}>&#x274C; 게임 오버: {gameOverReason}</span>
            : isComplete
              ? <span style={{color:'#059669', fontWeight:600}}>&#x2705; 완료!</span>
              : <span style={{color:'#64748b'}}>&#x23F3; 진행 중</span>}
        </div>
      )}

      {/* Complete banner */}
      {isComplete && (
        <div style={{background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:8, padding:'10px 14px', marginBottom:10, fontSize:14}}>
          &#x1F389; 모든 조각 배치 완료! <b>"결과 내보내기"</b>로 저장하세요.
        </div>
      )}

      {/* Main game area */}
      {pieceSeq.length > 0 ? (
        <div style={{display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start'}}>
          {/* Left: Canvas */}
          <div>
            <canvas ref={cvRef}
              onClick={onCanvasClick}
              onMouseMove={onCanvasMouseMove}
              onMouseLeave={onCanvasLeave}
              style={{cursor: (gameOver || isComplete) ? 'default' : 'pointer', display:'block', borderRadius:8}} />
          </div>

          {/* Right: Side panel */}
          <div style={{flex:1, minWidth:200, display:'flex', flexDirection:'column', gap:12}}>
            {/* Current piece */}
            {currentPiece && !gameOver && (
              <div style={{padding:12, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:8}}>현재 조각 (#{curIdx+1})</div>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <PieceDisplay type={currentPiece} size={24} highlight />
                  <span style={{fontSize:24, fontWeight:700, color:PIECE_BORDERS[currentPiece]}}>{currentPiece}</span>
                </div>
              </div>
            )}

            {/* Column buttons */}
            {currentPiece && !gameOver && (
              <div style={{padding:12, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:8}}>열 선택</div>
                <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  {Array.from({length:9}, (_,i) => i+1).map(c => {
                    const valid = validCols.includes(c);
                    const canLand = valid && findLandingRow(grid, currentPiece, c) >= 0;
                    return (
                      <button key={c} onClick={() => handleColumnSelect(c)}
                        disabled={!valid}
                        style={{
                          ...BTN, width:36, height:36, padding:0, textAlign:'center',
                          fontWeight:700, fontSize:15,
                          background: !valid ? '#f1f5f9' : canLand ? '#dbeafe' : '#fee2e2',
                          color: !valid ? '#cbd5e1' : canLand ? '#1e40af' : '#991b1b',
                          borderColor: !valid ? '#e2e8f0' : canLand ? '#93c5fd' : '#fca5a5',
                          cursor: valid ? 'pointer' : 'not-allowed',
                        }}>{c}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next pieces */}
            {nextPieces.length > 0 && (
              <div style={{padding:12, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:8}}>다음 조각</div>
                <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                  {nextPieces.map((pt, i) => (
                    <div key={i} style={{textAlign:'center'}}>
                      <PieceDisplay type={pt} size={14} />
                      <div style={{fontSize:11, color:'#64748b', marginTop:2}}>{pt}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Column choices history */}
            {colChoices.length > 0 && (
              <div style={{padding:12, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:8}}>선택 기록</div>
                <div style={{fontSize:12, fontFamily:'monospace', color:'#475569', maxHeight:120, overflowY:'auto', lineHeight:1.6, wordBreak:'break-all'}}>
                  {colChoices.map((c, i) => (
                    <span key={i}>
                      <span style={{color:'#94a3b8', fontSize:10}}>#{i+1}:</span>
                      <span style={{color:PIECE_BORDERS[pieceSeq[i]], fontWeight:600}}>{c}</span>
                      {i < colChoices.length-1 ? ' ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{textAlign:'center', padding:'60px 20px', color:'#94a3b8', background:'#f8fafc', borderRadius:12, border:'2px dashed #e2e8f0'}}>
          <p style={{fontSize:52, margin:'0 0 8px'}}>&#x1F9E9;</p>
          <p style={{margin:0, fontSize:15}}>파일을 열거나 예제를 로드하여 시작하세요</p>
        </div>
      )}

      {/* Piece reference chart */}
      <div style={{marginTop:16, padding:12, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:13, fontWeight:600, marginBottom:8}}>조각 참조</div>
        <div style={{display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end'}}>
          {[1,2,3,4,5,6,7,8,9].map(t => (
            <div key={t} style={{textAlign:'center'}}>
              <div style={{fontSize:12, fontWeight:700, color:PIECE_BORDERS[t], marginBottom:4}}>{t}</div>
              <PieceDisplay type={t} size={16} highlight={currentPiece === t} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <div style={{marginTop:20, fontSize:14}}>
        <a href="../" style={{color:'#6366f1'}}>&#x2190; 인덱스</a>
      </div>
    </div>
  );
}
