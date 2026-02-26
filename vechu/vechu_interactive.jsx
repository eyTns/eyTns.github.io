const { useState, useRef, useEffect, useCallback } = React;

// ===== 설정 화면 =====
function SetupScreen({ onStart }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(['', '']);
  const [isLarge, setIsLarge] = useState(false);

  const updateCount = (n) => {
    const count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, n));
    setPlayerCount(count);
    setNames(prev => {
      const next = [];
      for (let i = 0; i < count; i++) {
        next.push(i < prev.length ? prev[i] : '');
      }
      return next;
    });
  };

  const updateName = (i, val) => {
    setNames(prev => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const handleStart = () => {
    const finalNames = names.map((n, i) => n.trim() || `플레이어 ${i + 1}`);
    onStart(finalNames, isLarge ? TARGET_DOUBLE : TARGET_NORMAL);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: 20, color: COLOR.text }}>
      <h1 style={{ fontSize: 28, margin: '0 0 4px', color: COLOR.green }}>{isLarge ? '배추 곱빼기' : '배추'}</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: COLOR.textMuted }}>{isLarge ? 'Vechu Large Size' : 'Vechu'}</p>

      <div style={PANEL}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>플레이어 수</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => updateCount(playerCount - 1)} disabled={playerCount <= MIN_PLAYERS}
              style={{ ...BTN, width: 40, height: 40, padding: 0, fontSize: 20, fontWeight: 700, opacity: playerCount <= MIN_PLAYERS ? 0.3 : 1 }}>-</button>
            <span style={{ fontSize: 24, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{playerCount}</span>
            <button onClick={() => updateCount(playerCount + 1)} disabled={playerCount >= MAX_PLAYERS}
              style={{ ...BTN, width: 40, height: 40, padding: 0, fontSize: 20, fontWeight: 700, opacity: playerCount >= MAX_PLAYERS ? 0.3 : 1 }}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>플레이어 이름</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {names.map((name, i) => (
              <input key={i} value={name} onChange={e => updateName(i, e.target.value)}
                placeholder={`플레이어 ${i + 1}`}
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${COLOR.border}`, fontSize: 14, fontFamily: 'system-ui, sans-serif', outline: 'none' }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => setIsLarge(prev => !prev)}
              style={{
                width: 48, height: 28, borderRadius: 14, cursor: 'pointer',
                background: isLarge ? COLOR.green : COLOR.borderDark,
                position: 'relative', transition: 'background 0.2s', touchAction: 'manipulation',
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, background: COLOR.white,
                position: 'absolute', top: 3,
                left: isLarge ? 23 : 3, transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{isLarge ? '곱빼기' : '일반'}</span>
            <span style={{ fontSize: 13, color: COLOR.textMuted }}>목표 {isLarge ? '75' : '50'}점</span>
          </div>
        </div>

        <button onClick={handleStart} style={BTN_LARGE}>게임 시작</button>
      </div>

    </div>
  );
}

// ===== 주사위 표시 컴포넌트 =====
function DiceDisplay({ value, selected, selectable, onTap }) {
  const baseStyle = {
    width: 72, height: 72,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 36, fontWeight: 700,
    borderRadius: 12,
    border: `3px solid ${selected ? COLOR.green : COLOR.borderDark}`,
    background: selected ? COLOR.greenLight : COLOR.white,
    color: COLOR.text,
    cursor: selectable ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    touchAction: 'manipulation',
  };

  return (
    <div onClick={selectable ? onTap : undefined} style={baseStyle}>
      {value}
    </div>
  );
}

// ===== 점수 기록 컴포넌트 =====
function ScoreHistory({ records, expanded, onToggle }) {
  return (
    <div style={{ ...PANEL, marginTop: 12 }}>
      <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>점수 기록</span>
        <span style={{ fontSize: 12, color: COLOR.textMuted }}>{expanded ? '▲ 접기' : '▼ 펼치기'}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, maxHeight: 240, overflowY: 'auto', fontSize: 13 }}>
          {records.length === 0 ? (
            <div style={{ color: COLOR.textLight, textAlign: 'center', padding: 12 }}>아직 기록이 없습니다</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {records.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${COLOR.border}` }}>
                  <span style={{ color: COLOR.textLight, minWidth: 28 }}>#{r.turnNumber}</span>
                  <span style={{ fontWeight: 600, minWidth: 64 }}>{r.playerName}</span>
                  <span style={{ color: COLOR.textMuted }}>[{r.dice[0]},{r.dice[1]}]</span>
                  <span style={{ color: r.isAdd ? COLOR.green : COLOR.red, fontWeight: 600 }}>
                    {r.isAdd ? '+' : '-'}{diceProduct(r.dice)}
                  </span>
                  <span style={{ color: COLOR.textMuted }}>{r.scoreBefore} → {r.scoreAfter}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== 메인 게임 컴포넌트 =====
function VechuGame() {
  // 게임 상태
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [players, setPlayers] = useState([]);
  const [target, setTarget] = useState(TARGET_NORMAL);
  const [scores, setScores] = useState([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);
  const [records, setRecords] = useState([]);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // 주사위 상태
  const [dice, setDice] = useState([1, 1]);
  const [displayDice, setDisplayDice] = useState([1, 1]);
  const [rolledCount, setRolledCount] = useState(2);
  const [selectedDice, setSelectedDice] = useState([]);
  const [scoreChoice, setScoreChoice] = useState(null); // 'add' | 'sub' | null

  // 게임 종료 상태
  const [achieverIdx, setAchieverIdx] = useState(null);
  const [extraTurnOrder, setExtraTurnOrder] = useState([]);
  const [extraTurnPos, setExtraTurnPos] = useState(0);
  const [isExtraTurn, setIsExtraTurn] = useState(false);
  const [winners, setWinners] = useState([]);

  // 롤링 애니메이션
  const rollTimerRef = useRef(null);

  // ===== 게임 시작 =====
  const handleStart = useCallback((names, targetScore) => {
    setPlayers(names);
    setTarget(targetScore);
    setScores(names.map(() => 0));
    setCurrentPlayerIdx(0);
    setTurnNumber(1);
    setRecords([]);
    setAchieverIdx(null);
    setExtraTurnOrder([]);
    setExtraTurnPos(0);
    setIsExtraTurn(false);
    setWinners([]);
    setPhase(PHASE.WAITING);
  }, []);

  // ===== 롤링 애니메이션 =====
  // rerollIndices: 애니메이션할 주사위 인덱스 배열. 생략하면 둘 다.
  const startRollAnimation = useCallback((rerollIndices, callback) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < ROLL_DURATION_MS) {
        setDisplayDice(prev => {
          const next = [...prev];
          for (const idx of rerollIndices) next[idx] = rollDie();
          return next;
        });
        rollTimerRef.current = setTimeout(animate, ROLL_INTERVAL_START);
      } else {
        callback();
      }
    };
    animate();
  }, []);

  // ===== 주사위 굴리기 =====
  const handleRoll = useCallback(() => {
    setPhase(PHASE.ROLLING);
    setSelectedDice([]);
    setScoreChoice(null);

    startRollAnimation([0, 1], () => {
      const newDice = rollTwoDice();
      setDice(newDice);
      setDisplayDice(newDice);
      setRolledCount(2);

      const maxReroll = maxRerollCount(2, newDice);
      if (maxReroll > 0) {
        setPhase(PHASE.REROLL);
      } else {
        // 1×1 비더블 등: 바로 점수 선택으로 (실제로 2개 굴린 비더블은 1개 가능이므로 여기 올 일은 없음)
        setPhase(PHASE.SCORE_SELECT);
      }
    });
  }, [startRollAnimation]);

  // ===== 다시 굴리기 =====
  const handleReroll = useCallback(() => {
    if (selectedDice.length === 0) return;

    setPhase(PHASE.REROLLING);

    startRollAnimation(selectedDice, () => {
      const { newDice, rolledCount: rc } = performReroll(dice, selectedDice);
      setDice(newDice);
      setDisplayDice(newDice);
      setRolledCount(rc);
      setSelectedDice([]);

      const maxReroll = maxRerollCount(rc, newDice);
      if (maxReroll > 0) {
        setPhase(PHASE.REROLL);
      } else {
        setPhase(PHASE.SCORE_SELECT);
      }
    });
  }, [dice, selectedDice, startRollAnimation]);

  // ===== 넘어가기 =====
  const handleSkipReroll = useCallback(() => {
    setSelectedDice([]);
    setPhase(PHASE.SCORE_SELECT);
  }, []);

  // ===== 주사위 선택 토글 =====
  const toggleDieSelection = useCallback((idx) => {
    const maxSel = maxRerollCount(rolledCount, dice);
    setSelectedDice(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      }
      if (prev.length < maxSel) {
        return [...prev, idx];
      }
      // 최대 개수 초과: 기존 해제, 새로 선택
      if (maxSel === 1) {
        return [idx];
      }
      // maxSel === 2이고 이미 2개 선택: 가장 오래된 것 해제
      return [prev[prev.length - 1], idx];
    });
  }, [rolledCount, dice]);

  // ===== 점수 확인 =====
  const handleConfirmScore = useCallback(() => {
    if (scoreChoice === null) return;

    const isAdd = scoreChoice === 'add';
    const playerIdx = currentPlayerIdx;
    const scoreBefore = scores[playerIdx];
    const scoreAfter = applyScore(scoreBefore, dice, isAdd);

    // 점수 갱신
    const newScores = [...scores];
    newScores[playerIdx] = scoreAfter;
    setScores(newScores);

    // 기록 추가
    const record = createTurnRecord(turnNumber, players[playerIdx], dice, isAdd, scoreBefore, scoreAfter);
    setRecords(prev => [...prev, record]);

    // 목표 달성 체크
    const justAchieved = scoreAfter === target;

    if (isExtraTurn) {
      // 추가 턴 진행 중
      if (justAchieved) {
        setWinners(prev => prev.includes(playerIdx) ? prev : [...prev, playerIdx]);
      }
      const nextPos = extraTurnPos + 1;
      if (nextPos >= extraTurnOrder.length) {
        // 추가 턴 끝
        const finalWinners = justAchieved && !winners.includes(playerIdx)
          ? [...winners, playerIdx]
          : [...winners];
        // achieverIdx도 승리자에 포함
        if (!finalWinners.includes(achieverIdx)) {
          finalWinners.unshift(achieverIdx);
        }
        setWinners(finalWinners);
        setPhase(PHASE.GAME_OVER);
      } else {
        setExtraTurnPos(nextPos);
        setCurrentPlayerIdx(extraTurnOrder[nextPos]);
        setTurnNumber(prev => prev + 1);
        setPhase(PHASE.WAITING);
      }
    } else if (justAchieved) {
      // 첫 달성자 발생
      if (players.length === 1) {
        // 1인 플레이: 즉시 종료
        setWinners([playerIdx]);
        setPhase(PHASE.GAME_OVER);
      } else {
        setAchieverIdx(playerIdx);
        const order = getExtraTurnOrder(playerIdx, players.length);
        setExtraTurnOrder(order);
        setExtraTurnPos(0);
        setIsExtraTurn(true);
        setCurrentPlayerIdx(order[0]);
        setTurnNumber(prev => prev + 1);
        setWinners([playerIdx]);
        setPhase(PHASE.WAITING);
      }
    } else {
      // 일반 턴 진행
      const nextIdx = (playerIdx + 1) % players.length;
      const nextTurn = nextIdx === 0 ? turnNumber + 1 : turnNumber;
      setCurrentPlayerIdx(nextIdx);
      setTurnNumber(nextTurn);
      setPhase(PHASE.WAITING);
    }

    setScoreChoice(null);
  }, [scoreChoice, currentPlayerIdx, scores, dice, turnNumber, players, target, isExtraTurn, extraTurnPos, extraTurnOrder, winners, achieverIdx]);

  // ===== 클린업 =====
  useEffect(() => {
    return () => { if (rollTimerRef.current) clearTimeout(rollTimerRef.current); };
  }, []);

  // ===== 설정 화면 =====
  if (phase === PHASE.SETUP) {
    return <SetupScreen onStart={handleStart} />;
  }

  // ===== 파생 상태 =====
  const currentPlayer = players[currentPlayerIdx];
  const currentScore = scores[currentPlayerIdx];
  const isRolling = phase === PHASE.ROLLING || phase === PHASE.REROLLING;
  const maxReroll = phase === PHASE.REROLL ? maxRerollCount(rolledCount, dice) : 0;
  const gameTitle = target === TARGET_DOUBLE ? '배추 곱빼기' : '배추';

  // ===== 게임 종료 화면 =====
  if (phase === PHASE.GAME_OVER) {
    const isSolo = players.length === 1;
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: 20, color: COLOR.text }}>
        <h1 style={{ fontSize: 24, margin: '0 0 16px', color: COLOR.green }}>{gameTitle}</h1>

        <div style={{ ...PANEL, textAlign: 'center', padding: 24 }}>
          {isSolo ? (
            <div>
              <div style={{ fontSize: 48, marginBottom: 8 }}>&#127942;</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{turnNumber}턴 승리!</div>
              <div style={{ color: COLOR.textMuted }}>목표 {target}점 달성</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 8 }}>&#127942;</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                {winners.length === 1 ? '승리자' : '공동 승리'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                {winners.map((wi, i) => (
                  <div key={i} style={{ fontSize: 20, fontWeight: 700, color: COLOR.green }}>{players[wi]}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>최종 점수</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {players.map((name, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 700, color: scores[i] === target ? COLOR.green : COLOR.text }}>{scores[i]}점</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => location.reload()} style={{ ...BTN_LARGE, marginTop: 20 }}>처음으로</button>
        </div>

        <ScoreHistory records={records} expanded={historyExpanded} onToggle={() => setHistoryExpanded(p => !p)} />
      </div>
    );
  }

  // ===== 게임 진행 화면 =====
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: 20, color: COLOR.text }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0, color: COLOR.green }}>{gameTitle}</h1>
        <span style={{ fontSize: 13, color: COLOR.textMuted }}>턴 {turnNumber} · 목표 {target}점</span>
      </div>

      {/* 마지막 턴 표시 */}
      {isExtraTurn && (
        <div style={{ background: COLOR.yellowLight, border: `1px solid ${COLOR.yellowBorder}`, borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#92400e' }}>
          마지막 턴
        </div>
      )}

      {/* 점수판 */}
      <div style={{ ...PANEL, marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {players.map((name, i) => {
            const isCurrent = i === currentPlayerIdx && phase !== PHASE.GAME_OVER;
            const achieved = scores[i] === target;
            return (
              <div key={i} style={{
                flex: '1 1 auto', minWidth: 80, padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                background: isCurrent ? COLOR.greenLight : COLOR.white,
                border: `2px solid ${isCurrent ? COLOR.green : achieved ? COLOR.greenBorder : COLOR.border}`,
              }}>
                <div style={{ fontSize: 12, color: COLOR.textMuted, marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: achieved ? COLOR.green : COLOR.text }}>{scores[i]}</div>
                {achieved && <div style={{ fontSize: 11, color: COLOR.green, fontWeight: 600 }}>달성</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 주사위 + 액션 영역 */}
      <div style={{ ...PANEL, textAlign: 'center' }}>
        {/* 현재 플레이어 */}
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{currentPlayer}의 차례</div>

        {/* 대기 상태: 굴리기 버튼 */}
        {phase === PHASE.WAITING && (
          <button onClick={handleRoll} style={BTN_LARGE}>굴리기</button>
        )}

        {/* 주사위 표시 (대기 아닐 때) */}
        {phase !== PHASE.WAITING && (
          <div>
            {/* 주사위 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
              <DiceDisplay
                value={isRolling ? displayDice[0] : dice[0]}
                selected={selectedDice.includes(0)}
                selectable={phase === PHASE.REROLL}
                onTap={() => toggleDieSelection(0)}

              />
              <DiceDisplay
                value={isRolling ? displayDice[1] : dice[1]}
                selected={selectedDice.includes(1)}
                selectable={phase === PHASE.REROLL}
                onTap={() => toggleDieSelection(1)}

              />
            </div>

            {/* 더블 표시 */}
            {phase === PHASE.REROLL && isDouble(dice) && (
              <div style={{ fontSize: 18, fontWeight: 700, color: COLOR.yellow, marginBottom: 8 }}>더블!</div>
            )}

            {/* 다시 굴리기 안내 + 버튼 */}
            {phase === PHASE.REROLL && (
              <div>
                <div style={{ fontSize: 13, color: COLOR.textMuted, marginBottom: 10 }}>
                  {maxReroll}개 다시굴리기 가능
                </div>
                {selectedDice.length > 0 ? (
                  <button onClick={handleReroll} style={BTN_LARGE}>굴리기</button>
                ) : (
                  <button onClick={handleSkipReroll} style={{ ...BTN, fontSize: 16, padding: '12px 28px' }}>넘어가기</button>
                )}
              </div>
            )}

            {/* 점수 선택 */}
            {phase === PHASE.SCORE_SELECT && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                  <button onClick={() => setScoreChoice('add')}
                    style={{
                      ...BTN, fontSize: 16, padding: '12px 24px', fontWeight: 600, minWidth: 100,
                      background: scoreChoice === 'add' ? COLOR.greenLight : COLOR.white,
                      border: `2px solid ${scoreChoice === 'add' ? COLOR.green : COLOR.borderDark}`,
                    }}>더하기</button>
                  <button onClick={() => setScoreChoice('sub')}
                    style={{
                      ...BTN, fontSize: 16, padding: '12px 24px', fontWeight: 600, minWidth: 100,
                      background: scoreChoice === 'sub' ? '#fee2e2' : COLOR.white,
                      border: `2px solid ${scoreChoice === 'sub' ? COLOR.red : COLOR.borderDark}`,
                    }}>빼기</button>
                </div>
                <button onClick={handleConfirmScore} disabled={scoreChoice === null}
                  style={scoreChoice === null ? { ...BTN_DISABLED, fontSize: 16, padding: '12px 28px' } : { ...BTN_PRIMARY, fontSize: 16, padding: '12px 28px' }}>
                  확인
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 점수 기록 */}
      <ScoreHistory records={records} expanded={historyExpanded} onToggle={() => setHistoryExpanded(p => !p)} />

    </div>
  );
}
