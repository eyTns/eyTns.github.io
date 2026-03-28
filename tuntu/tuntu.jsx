const { useState, useEffect, useCallback } = React;

/* ── 상수 ── */

const BG = "linear-gradient(145deg, #0f0c29 0%, #1a1333 40%, #24243e 100%)";
const FONT = "'Noto Sans KR', sans-serif";
const FONT_LINK = (
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet" />
);
const TARGET = 1;

const RESULT_BTN_STYLE = {
  padding: "16px 48px", fontSize: 20, fontWeight: 900, color: "white",
  background: "linear-gradient(135deg, #a29bfe, #6c5ce7)", border: "none",
  borderRadius: 16, cursor: "pointer", boxShadow: "0 8px 25px rgba(108, 92, 231, 0.35)",
  transition: "all 0.25s ease", fontFamily: FONT, letterSpacing: 2,
};

const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

/* ── 공용 컴포넌트 ── */

function ScreenContainer({ children, justify = "center", extra }) {
  return (
    <div style={{
      minHeight: "100vh", background: BG, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: justify,
      fontFamily: FONT, padding: 20, position: "relative", overflow: "hidden", ...extra,
    }}>
      {children}
    </div>
  );
}

function HomeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 10, padding: "10px 32px", fontSize: 15, fontWeight: 700,
        color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
        cursor: "pointer", transition: "all 0.25s ease", fontFamily: FONT, letterSpacing: 2,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
    >
      처음으로
    </button>
  );
}

function Dot({ row, col, visible, color }) {
  const pos = { 0: "15%", 1: "50%", 2: "85%" };
  return (
    <div style={{
      position: "absolute", left: pos[col], top: pos[row], transform: "translate(-50%, -50%)",
      width: "20%", height: "20%", borderRadius: "50%",
      background: visible ? color : "transparent", transition: "all 0.3s ease",
      boxShadow: visible ? "0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)" : "none",
    }} />
  );
}

function DiceView({ value, rolling, color, dotColor, shadowColor }) {
  const dots = DICE_FACES[value] || [];
  const allPositions = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) allPositions.push([r, c]);
  return (
    <div style={{
      width: 110, height: 110, borderRadius: 18, background: color, position: "relative",
      boxShadow: rolling ? `0 0 30px ${shadowColor}, 0 8px 25px rgba(0,0,0,0.4)` : `0 6px 20px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)`,
      animation: rolling ? "diceShake 0.12s infinite alternate" : "none",
      transition: "box-shadow 0.3s ease", border: "2px solid rgba(255,255,255,0.15)",
    }}>
      {allPositions.map(([r, c]) => (
        <Dot key={`${r}-${c}`} row={r} col={c} visible={dots.some(([dr, dc]) => dr === r && dc === c)} color={dotColor} />
      ))}
    </div>
  );
}

function ScoreBar({ playerScore, cpuScore, targetScore }) {
  const pPct = Math.min((playerScore / targetScore) * 100, 100);
  const cPct = Math.min((cpuScore / targetScore) * 100, 100);
  const barTrack = { height: 10, borderRadius: 5, background: "rgba(255,255,255,0.08)", overflow: "hidden" };
  const barFill = (pct, grad) => ({ height: "100%", width: `${pct}%`, background: grad, borderRadius: 5, transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)" });
  const scoreNum = (color) => ({ fontSize: 28, fontWeight: 400, color, marginTop: 2, fontFamily: FONT, fontVariantNumeric: "tabular-nums" });

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", maxWidth: 500 }}>
      <div style={{ flex: 1, textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffb347", letterSpacing: 1, marginBottom: 4 }}>나</div>
        <div style={{ ...barTrack, direction: "rtl" }}><div style={barFill(pPct, "linear-gradient(90deg, #ff6b6b, #ffb347)")} /></div>
        <div style={scoreNum("#ffb347")}>{playerScore}</div>
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 700, minWidth: 40, textAlign: "center" }}>{targetScore}점</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#74b9ff", letterSpacing: 1, marginBottom: 4 }}>CPU</div>
        <div style={barTrack}><div style={barFill(cPct, "linear-gradient(90deg, #74b9ff, #a29bfe)")} /></div>
        <div style={scoreNum("#74b9ff")}>{cpuScore}</div>
      </div>
    </div>
  );
}

function Fireworks() {
  const colors = ["#ff6b6b", "#ffb347", "#74b9ff", "#a29bfe", "#55efc4", "#fd79a8", "#ffeaa7"];
  const [particles] = useState(() => {
    const pts = [];
    [{ x: -3, y: 105 }, { x: 103, y: 105 }].forEach((origin, oi) => {
      for (let i = 0; i < 40; i++) {
        const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
        const speed = 320 + Math.random() * 400;
        pts.push({
          id: oi * 40 + i, ox: origin.x, oy: origin.y,
          tx: Math.cos(angle) * speed * (oi === 0 ? 1 : -1),
          ty: Math.sin(angle) * speed,
          size: 5 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.1,
          explodeDur: 1.0 + Math.random() * 0.5,
          fallDur: 4 + Math.random() * 2,
          spinSpeed: 0.4 + Math.random() * 0.6,
          flipSpeed: 0.3 + Math.random() * 0.5,
        });
      }
    });
    return pts;
  });

  return (
    <>
      <style>{`
        @keyframes fwExplode { 0% { transform: translate(0,0); } 100% { transform: translate(var(--tx), var(--ty)); } }
        @keyframes fwGravity { 0% { transform: translateY(0); opacity:1; } 80% { opacity:1; } 100% { transform: translateY(240vh); opacity:0; } }
        @keyframes fwRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fwFlip { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      `}</style>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", perspective: 800 }}>
        {particles.map((p) => (
          <div key={p.id} style={{ position: "absolute", left: `${p.ox}%`, top: `${p.oy}%`, animation: `fwGravity ${p.fallDur}s ease-in ${p.delay + p.explodeDur * 0.3}s forwards` }}>
            <div style={{ animation: `fwExplode ${p.explodeDur}s ease-out ${p.delay}s forwards`, "--tx": `${p.tx}px`, "--ty": `${p.ty}px` }}>
              <div style={{ animation: `fwRotate ${p.spinSpeed}s linear ${p.delay}s infinite` }}>
                <div style={{ width: p.size, height: p.size * 1.5, borderRadius: 2, background: p.color, animation: `fwFlip ${p.flipSpeed}s linear ${p.delay}s infinite` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 화면 컴포넌트 ── */

function TitleScreen({ onPlay, helpStage, onHelpSeen }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const isHighlighted = helpStage === "highlighted";
  const hasLongText = helpStage !== "unseen";

  const handleInteract = () => {
    setHelpOpen((v) => !v);
    if (isHighlighted) onHelpSeen();
  };
  const handleHover = (enter) => {
    setHelpOpen(enter);
    if (enter && isHighlighted) onHelpSeen();
  };

  const circleColor = isHighlighted ? "#ffb347" : "rgba(255,255,255,0.5)";
  const circleBorder = isHighlighted
    ? "2px solid #ffb347"
    : `2px solid ${helpOpen ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}`;

  const helpText = hasLongText
    ? "퉁추는 주사위 0개로 하는 게임입니다. 주사위 0개는 주사위가 없는 것이지만 이런 게임이 있다고 퉁치기로 했습니다."
    : "퉁추는 주사위 0개로 하는 게임입니다.";

  return (
    <ScreenContainer justify="flex-start" extra={{ padding: "40px 20px 20px" }}>
      {FONT_LINK}
      <div
        style={{ position: "absolute", top: 20, right: 20 }}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        onClick={handleInteract}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%", border: circleBorder,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: circleColor, fontSize: 18, fontWeight: 700,
          cursor: "pointer", transition: "all 0.3s ease", userSelect: "none",
          boxShadow: isHighlighted ? "0 0 12px rgba(255,179,71,0.4)" : "none",
        }}>?</div>
        {helpOpen && (
          <div style={{
            position: "absolute", top: 44, right: 0, background: "#1e1a3a",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
            padding: "16px 20px", width: 240, boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 8 }}>퉁추란?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{helpText}</div>
          </div>
        )}
      </div>
      <h1 style={{
        fontFamily: FONT, fontSize: 36, fontWeight: 900, color: "transparent",
        backgroundImage: "linear-gradient(135deg, #ff6b6b, #ffb347, #ff6b6b)",
        backgroundClip: "text", WebkitBackgroundClip: "text", marginBottom: 6, letterSpacing: 6, textAlign: "center",
      }}>퉁추</h1>
      <div style={{ flex: 1 }} />
      <button
        onClick={onPlay}
        style={{
          padding: "14px 40px", fontSize: 18, fontWeight: 700, color: "white",
          background: "linear-gradient(135deg, #ff6b6b, #ee5a24)", border: "none", borderRadius: 14,
          cursor: "pointer", boxShadow: "0 8px 25px rgba(255, 107, 107, 0.35)",
          transition: "all 0.25s ease", fontFamily: FONT, letterSpacing: 3,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 35px rgba(255, 107, 107, 0.5)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(255, 107, 107, 0.35)"; }}
      >게임하기</button>
      <div style={{ flex: 1 }} />
    </ScreenContainer>
  );
}

function LoadingScreen({ onReady }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count++;
      if (count > 11) { clearInterval(timer); return; }
      setDots(count);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const done = dots >= 11;
  return (
    <ScreenContainer>
      <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 30, minWidth: 160, textAlign: "center" }}>
        {done ? "로딩 완료" : "로딩중" + ".".repeat(dots)}
      </div>
      <button
        disabled={!done}
        onClick={done ? onReady : undefined}
        style={done ? {
          padding: "14px 40px", fontSize: 18, fontWeight: 700, color: "white",
          background: "linear-gradient(135deg, #ff6b6b, #ee5a24)", border: "none", borderRadius: 14,
          cursor: "pointer", boxShadow: "0 8px 25px rgba(255, 107, 107, 0.35)",
          transition: "all 0.25s ease", fontFamily: FONT, letterSpacing: 3,
        } : {
          padding: "14px 40px", fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.5)",
          background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14, cursor: "not-allowed", fontFamily: FONT, letterSpacing: 3,
        }}
      >게임 시작</button>
    </ScreenContainer>
  );
}

function WinResultScreen({ onHome, onLose }) {
  const [btnReady, setBtnReady] = useState(false);
  const [popup, setPopup] = useState(null);
  const [extraFireworks, setExtraFireworks] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setBtnReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const celebrateAndClose = () => {
    setPopup(null);
    setExtraFireworks((n) => n + 1);
  };

  return (
    <ScreenContainer>
      <Fireworks />
      {Array.from({ length: extraFireworks }).map((_, i) => <Fireworks key={`extra-${i}`} />)}
      <style>{`
        @keyframes mysteryFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 40, textAlign: "center", position: "relative", zIndex: 1 }}>
        당신이 이겼습니다!
      </div>
      <div style={{ flex: 1 }} />
      <button
        disabled={!btnReady}
        onClick={() => btnReady && setPopup("ask1")}
        style={{
          ...RESULT_BTN_STYLE, marginBottom: 14, position: "relative", zIndex: 1,
          opacity: 0, animation: "mysteryFadeIn 5s ease 2s forwards",
          cursor: btnReady ? "pointer" : "default",
        }}
      >???</button>
      <div style={{ marginBottom: 40 }}><HomeButton onClick={onHome} /></div>

      {popup && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", zIndex: 10,
        }}>
          <div style={{
            background: "#1e1a3a", borderRadius: 16, padding: "32px 32px 32px", width: 400,
            border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 52,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "white", textAlign: "center", lineHeight: 1.6 }}>
              {popup === "ask1" ? "뭔가 마음에 안 드는 점이 있으신가요?" : "그러면 혹시 지고 싶으신가요?"}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  if (popup === "ask1") setPopup("ask2");
                  else { setPopup(null); onLose(); }
                }}
                style={{
                  padding: "10px 0", width: 100, fontSize: 15, fontWeight: 700, color: "white",
                  background: "linear-gradient(135deg, #a29bfe, #6c5ce7)", border: "none",
                  borderRadius: 10, cursor: "pointer", fontFamily: FONT,
                }}
              >예</button>
              <button
                onClick={celebrateAndClose}
                style={{
                  padding: "10px 0", width: 100, fontSize: 15, fontWeight: 700, color: "white",
                  background: "linear-gradient(135deg, #ff6b6b, #ee5a24)", border: "none",
                  borderRadius: 10, cursor: "pointer", fontFamily: FONT,
                }}
              >아니오</button>
            </div>
          </div>
        </div>
      )}
    </ScreenContainer>
  );
}

function LoseResultScreen({ onHome }) {
  return (
    <ScreenContainer>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 40, textAlign: "center" }}>
        당신은 졌습니다ㅠㅠ
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ marginBottom: 40 }}><HomeButton onClick={onHome} /></div>
    </ScreenContainer>
  );
}

function GameScreen({ onResult, onHome }) {
  const [playerDice, setPlayerDice] = useState([1, 1]);
  const [cpuDice, setCpuDice] = useState([1, 1]);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastDelta, setLastDelta] = useState({ player: 0, cpu: 0 });
  const [playerWon, setPlayerWon] = useState(null);

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  const handleRoll = useCallback(() => {
    if (rolling || gameOver) return;
    setRolling(true);
    setShowResult(false);
    let ticks = 0;
    const interval = setInterval(() => {
      setPlayerDice([rollDice(), rollDice()]);
      setCpuDice([rollDice(), rollDice()]);
      ticks++;
      if (ticks >= 12) {
        clearInterval(interval);
        const p = [rollDice(), rollDice()];
        const c = [rollDice(), rollDice()];
        const pSum = p[0] + p[1], cSum = c[0] + c[1];
        setPlayerDice(p);
        setCpuDice(c);
        setLastDelta({ player: pSum, cpu: cSum });
        setPlayerScore((prev) => prev + pSum);
        setCpuScore((prev) => prev + cSum);
        setRound((r) => r + 1);
        setRolling(false);
        setShowResult(true);
      }
    }, 70);
  }, [rolling, gameOver]);

  useEffect(() => {
    if (playerScore >= TARGET || cpuScore >= TARGET) {
      setGameOver(true);
      setPlayerWon(playerScore >= cpuScore);
    }
  }, [playerScore, cpuScore]);

  const resetGame = () => {
    setPlayerDice([1, 1]); setCpuDice([1, 1]);
    setPlayerScore(0); setCpuScore(0);
    setRound(0); setGameOver(false);
    setShowResult(false); setLastDelta({ player: 0, cpu: 0 });
    setPlayerWon(null);
  };

  return (
    <ScreenContainer justify="flex-start" extra={{ padding: "40px 20px 20px", fontFamily: "'Noto Sans KR', 'Bebas Neue', sans-serif" }}>
      {FONT_LINK}
      <style>{`
        @keyframes diceShake { 0% { transform: rotate(-8deg) scale(1.05); } 100% { transform: rotate(8deg) scale(1.08); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .roll-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.03) !important; box-shadow: 0 12px 35px rgba(255,107,107,0.5) !important; }
        .roll-btn:active:not(:disabled) { transform: translateY(0) scale(0.98) !important; }
      `}</style>

      <h1 style={{
        fontFamily: FONT, fontSize: 36, fontWeight: 900, color: "transparent",
        backgroundImage: "linear-gradient(135deg, #ff6b6b, #ffb347, #ff6b6b)",
        backgroundClip: "text", WebkitBackgroundClip: "text",
        marginBottom: 6, letterSpacing: 6, textAlign: "center", whiteSpace: "nowrap",
      }}>퉁추</h1>

      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24, fontWeight: 700, letterSpacing: 3 }}>ROUND {round}</div>

      <ScoreBar playerScore={playerScore} cpuScore={cpuScore} targetScore={TARGET} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, margin: "32px 0" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ffb347", letterSpacing: 2, marginBottom: 12 }}>나의 주사위</div>
          <div style={{ display: "flex", gap: 14 }}>
            {playerDice.map((d, i) => <DiceView key={`p${i}`} value={d} rolling={rolling} color="linear-gradient(145deg, #2d1b69, #44318d)" dotColor="#ffb347" shadowColor="rgba(255,179,71,0.4)" />)}
          </div>
          {showResult && <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: "#ffb347", animation: "fadeInUp 0.4s ease", fontFamily: FONT }}>+{lastDelta.player}</div>}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.15)", fontFamily: "'Bebas Neue', cursive", animation: rolling ? "pulse 0.3s infinite" : "none" }}>VS</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#74b9ff", letterSpacing: 2, marginBottom: 12 }}>CPU 주사위</div>
          <div style={{ display: "flex", gap: 14 }}>
            {cpuDice.map((d, i) => <DiceView key={`c${i}`} value={d} rolling={rolling} color="linear-gradient(145deg, #1b3a5c, #2d5a87)" dotColor="#74b9ff" shadowColor="rgba(116,185,255,0.4)" />)}
          </div>
          {showResult && <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: "#74b9ff", animation: "fadeInUp 0.4s ease", fontFamily: FONT }}>+{lastDelta.cpu}</div>}
        </div>
      </div>

      {gameOver && (
        <div style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 24, animation: "fadeInUp 0.5s ease", textAlign: "center", fontFamily: FONT }}>
          {playerWon ? "당신이 이겼습니다!" : "당신은 졌습니다ㅠㅠ"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {!gameOver ? (
          <button className="roll-btn" onClick={handleRoll} disabled={rolling} style={{
            padding: "16px 48px", fontSize: 20, fontWeight: 900, color: "white",
            background: rolling ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #ff6b6b, #ee5a24)",
            border: "none", borderRadius: 16, cursor: rolling ? "not-allowed" : "pointer",
            boxShadow: rolling ? "none" : "0 8px 25px rgba(255,107,107,0.35)",
            transition: "all 0.25s ease", fontFamily: FONT, letterSpacing: 2,
          }}>
            {rolling ? "굴리는 중..." : "굴리기!"}
          </button>
        ) : (
          <>
            <button className="roll-btn" onClick={() => onResult(playerWon ? "win" : "lose")} style={RESULT_BTN_STYLE}>
              {playerWon ? "이겼다!" : "졌다ㅠㅠ"}
            </button>
            <button className="roll-btn" onClick={resetGame} style={RESULT_BTN_STYLE}>다시 하기</button>
            <HomeButton onClick={onHome} />
          </>
        )}
      </div>
    </ScreenContainer>
  );
}

/* ── 라우터 ── */

function DiceGame() {
  const [screen, setScreen] = useState("title");
  const [helpStage, setHelpStage] = useState("unseen");

  const goToScreen = (s) => {
    if (s === "win_result" && helpStage === "unseen") setHelpStage("highlighted");
    setScreen(s);
  };

  if (screen === "win_result") return <WinResultScreen onHome={() => goToScreen("title")} onLose={() => goToScreen("lose_result")} />;
  if (screen === "lose_result") return <LoseResultScreen onHome={() => goToScreen("title")} />;
  if (screen === "loading") return <LoadingScreen onReady={() => goToScreen("win_result")} />;
  if (screen === "title") return <TitleScreen onPlay={() => goToScreen("loading")} helpStage={helpStage} onHelpSeen={() => setHelpStage("seen")} />;
  return <GameScreen onResult={(r) => goToScreen(r === "win" ? "win_result" : "lose_result")} onHome={() => goToScreen("title")} />;
}
