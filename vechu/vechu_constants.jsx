// ===== 스타일 상수 =====
const COLOR = {
  bg: '#fafafa',
  text: '#1e293b',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  panel: '#f8fafc',
  green: '#16a34a',
  greenLight: '#dcfce7',
  greenBorder: '#86efac',
  greenDark: '#15803d',
  yellow: '#f59e0b',
  yellowLight: '#fef3c7',
  yellowBorder: '#fcd34d',
  red: '#dc2626',
  white: '#ffffff',
};

const BTN = {
  padding: '10px 20px',
  borderRadius: 8,
  border: `1px solid ${COLOR.borderDark}`,
  background: COLOR.panel,
  cursor: 'pointer',
  fontSize: 15,
  fontFamily: 'system-ui, sans-serif',
  color: COLOR.text,
  touchAction: 'manipulation',
};

const BTN_PRIMARY = {
  ...BTN,
  background: COLOR.green,
  color: COLOR.white,
  border: `1px solid ${COLOR.greenDark}`,
  fontWeight: 600,
};

const BTN_LARGE = {
  ...BTN_PRIMARY,
  padding: '14px 32px',
  fontSize: 18,
};

const BTN_DISABLED = {
  ...BTN,
  opacity: 0.4,
  cursor: 'not-allowed',
};

const PANEL = {
  padding: 16,
  background: COLOR.panel,
  borderRadius: 10,
  border: `1px solid ${COLOR.border}`,
};

// ===== 게임 상수 =====
const TARGET_NORMAL = 50;
const TARGET_DOUBLE = 75;
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;
const ROLL_DURATION_MS = 500;
const ROLL_INTERVAL_START = 40;

// ===== 게임 페이즈 =====
const PHASE = {
  SETUP: 'setup',
  WAITING: 'waiting',
  ROLLING: 'rolling',
  REROLL: 'reroll',
  REROLLING: 'rerolling',
  SCORE_SELECT: 'score_select',
  GAME_OVER: 'game_over',
};
