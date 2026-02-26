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
