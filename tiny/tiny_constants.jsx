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
const SEQ_147    = [1, 4, 7];

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

// ===== Cycle Detection =====
// Segments the piece sequence into consecutive runs of repeating patterns.
// Each segment: { pattern: number[], start: number, end: number, reps: number, partial: number }
function detectCycles(seq) {
  const segments = [];
  let i = 0;

  while (i < seq.length) {
    let found = false;
    const remaining = seq.length - i;

    for (let L = 1; L <= Math.floor(remaining / 2); L++) {
      let reps = 1;
      let j = i + L;
      while (j + L <= seq.length) {
        let match = true;
        for (let k = 0; k < L; k++) {
          if (seq[j + k] !== seq[i + k]) { match = false; break; }
        }
        if (!match) break;
        reps++;
        j += L;
      }

      if (reps >= 2) {
        // Check for partial match only at the very end of the sequence
        let partial = 0;
        for (let k = 0; k < L && j + k < seq.length; k++) {
          if (seq[j + k] === seq[i + k]) partial++;
          else break;
        }
        // Only absorb partial if it reaches the end of the sequence
        if (j + partial < seq.length) partial = 0;

        segments.push({
          pattern: seq.slice(i, i + L),
          start: i,
          end: j + partial - 1,
          reps,
          partial,
        });
        i = j + partial;
        found = true;
        break;
      }
    }

    if (!found) {
      // Remaining elements don't form a repeating pattern
      segments.push({
        pattern: seq.slice(i),
        start: i,
        end: seq.length - 1,
        reps: 1,
        partial: 0,
      });
      break;
    }
  }

  return segments;
}
