// ===== 주사위 =====
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollTwoDice() {
  return [rollDie(), rollDie()];
}

function isDouble(dice) {
  return dice[0] === dice[1];
}

function diceProduct(dice) {
  return dice[0] * dice[1];
}

// ===== 다시 굴리기 가능 개수 =====
// rolledCount: 이번에 굴린 주사위 개수 (2 또는 1)
// dice: 현재 주사위 [a, b]
// 반환: 다시 굴릴 수 있는 최대 개수
function maxRerollCount(rolledCount, dice) {
  const double = isDouble(dice);
  if (rolledCount === 2 && double) return 2;
  if (rolledCount === 2 && !double) return 1;
  if (rolledCount === 1 && double) return 1;
  // rolledCount === 1 && !double
  return 0;
}

// ===== 다시 굴리기 수행 =====
// dice: 현재 [a, b]
// selected: 선택된 주사위 인덱스 배열 (예: [0], [1], [0, 1])
// 반환: { newDice, rolledCount }
function performReroll(dice, selected) {
  const newDice = [...dice];
  for (const idx of selected) {
    newDice[idx] = rollDie();
  }
  return { newDice, rolledCount: selected.length };
}

// ===== 점수 계산 =====
function applyScore(currentScore, dice, isAdd) {
  const product = diceProduct(dice);
  return isAdd ? currentScore + product : currentScore - product;
}

// ===== 추가 턴 순서 계산 =====
// achieverIndex: 달성자의 플레이어 인덱스
// playerCount: 총 플레이어 수
// 반환: 추가 턴을 수행할 플레이어 인덱스 배열 (달성자 제외)
function getExtraTurnOrder(achieverIndex, playerCount) {
  const order = [];
  for (let i = 1; i < playerCount; i++) {
    order.push((achieverIndex + i) % playerCount);
  }
  return order;
}

// ===== 턴 기록 엔트리 생성 =====
function createTurnRecord(turnNumber, playerName, dice, isAdd, scoreBefore, scoreAfter) {
  return { turnNumber, playerName, dice: [...dice], isAdd, scoreBefore, scoreAfter };
}
