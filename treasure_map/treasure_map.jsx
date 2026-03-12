const { useState, useCallback } = React;

// --- Constants ---
const P = {
  LANDING: 0, L_NO: 1, L_YES: 2,
  A_SEL: 3, A_FLIP: 4, A_WHO: 5, A_COMPING: 6, A_ASK_NF: 7, A_HUMAN: 8, A_DONE: 9,
  B_INPUT: 10, B_WHO: 11, B_HUMAN: 12, B_DONE: 13,
  C_INTRO: 14, C_SEL: 15, C_FLIP: 16, C_COMPING: 17, C_ASK_NF: 18, C_DONE: 19,
  D_INTRO: 20, D_INPUT: 21, D_RESULT: 22, D_YES: 23, D_NO: 24, D_HOWTO: 25,
};

// --- Inject keyframes ---
const s = document.createElement("style");
s.textContent = `
  @keyframes treasureBounce {
    0% { transform: scale(0) translateY(20px); opacity: 0; }
    50% { transform: scale(1.3) translateY(-5px); opacity: 1; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(s);

// --- Logic ---
function calcMapValue(grid) {
  let bit8 = 0;
  for (let j = 0; j < 4; j++) { bit8 ^= grid[0][j]; bit8 ^= grid[1][j]; }
  let bit4 = 0;
  for (let j = 0; j < 4; j++) { bit4 ^= grid[1][j]; bit4 ^= grid[2][j]; }
  let bit2 = 0;
  for (let i = 0; i < 4; i++) { bit2 ^= grid[i][0]; bit2 ^= grid[i][1]; }
  let bit1 = 0;
  for (let i = 0; i < 4; i++) { bit1 ^= grid[i][1]; bit1 ^= grid[i][2]; }
  return bit8 * 8 + bit4 * 4 + bit2 * 2 + bit1;
}

function findFlipCard(treasurePos, mapValue) {
  const diff = treasurePos ^ mapValue;
  if (diff === 0) return null;
  const need8 = !!((diff >> 3) & 1);
  const need4 = !!((diff >> 2) & 1);
  const need2 = !!((diff >> 1) & 1);
  const need1 = !!(diff & 1);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const m8 = i === 0 || i === 1;
      const m4 = i === 1 || i === 2;
      const m2 = j === 0 || j === 1;
      const m1 = j === 1 || j === 2;
      if (m8 === need8 && m4 === need4 && m2 === need2 && m1 === need1) {
        return i * 4 + j;
      }
    }
  }
  return null;
}

// --- Card ---
function Card({ value, onClick, highlighted, highlightColor, selectable, showTreasure, treasureFading }) {
  const isFront = value === 1;
  return (
    <div
      onClick={onClick}
      style={{
        width: "100%", aspectRatio: "2.5 / 3.5", perspective: "600px",
        cursor: selectable ? "pointer" : "default", position: "relative",
      }}
    >
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s ease-in-out",
        transform: isFront ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Back */}
        <div style={{
          position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden",
          borderRadius: "8px", background: "linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)",
          border: "2px solid #2a5a8c", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          boxShadow: highlighted ? `0 0 0 3px ${highlightColor || "#ffd700"}, 0 0 12px ${highlightColor || "#ffd700"}88` : "none",
        }}>
          <div style={{
            position: "absolute", inset: "6px", borderRadius: "4px",
            border: "1.5px solid rgba(100,160,220,0.3)",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(60,120,180,0.12) 6px, rgba(60,120,180,0.12) 7px), repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(60,120,180,0.12) 6px, rgba(60,120,180,0.12) 7px)",
            }} />
          </div>
        </div>
        {/* Front */}
        <div style={{
          position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: "8px",
          background: "linear-gradient(135deg, #faf8f0 0%, #f0ece0 100%)",
          border: "2px solid #c8b888", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          boxShadow: highlighted ? `0 0 0 3px ${highlightColor || "#ffd700"}, 0 0 12px ${highlightColor || "#ffd700"}88` : "none",
        }}>
          <div style={{
            position: "absolute", inset: "5px", borderRadius: "3px",
            border: "1px solid rgba(180,160,120,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: "clamp(20px, 5vw, 40px)", color: "#8b0000", fontFamily: "serif" }}>♦</div>
          </div>
        </div>
      </div>
      {/* Treasure overlay */}
      {showTreasure && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", opacity: treasureFading ? 0 : 1, transition: "opacity 0.8s ease-out",
        }}>
          <div style={{
            fontSize: "clamp(24px, 6vw, 44px)",
            filter: "drop-shadow(0 2px 8px rgba(255,215,0,0.8))",
            animation: treasureFading ? "none" : "treasureBounce 0.5s ease-out",
          }}>💎</div>
        </div>
      )}
    </div>
  );
}

// --- Grid ---
function Grid({ grid, onCellClick, highlightedCell, highlightColor, selectable, showTreasureOn, treasureFading }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(6px, 1.5vw, 12px)",
      width: "100%", maxWidth: "380px", margin: "0 auto", padding: "20px",
      background: "radial-gradient(ellipse at center, #1a472a 0%, #0f2d1a 70%, #091a0f 100%)",
      borderRadius: "16px", border: "3px solid #2a5a3a",
      boxShadow: "inset 0 2px 20px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5)",
    }}>
      {grid.flat().map((val, idx) => (
        <Card
          key={idx} value={val}
          onClick={() => selectable && onCellClick(Math.floor(idx / 4), idx % 4)}
          highlighted={highlightedCell === idx} highlightColor={highlightColor} selectable={selectable}
          showTreasure={showTreasureOn === idx} treasureFading={treasureFading}
        />
      ))}
    </div>
  );
}

// --- Button ---
function Btn({ children, onClick, variant = "primary", deactivated, style: extra }) {
  const variants = {
    primary: { background: "linear-gradient(135deg, #c8a44e, #a8843e)", color: "#1a1000", boxShadow: "0 2px 8px rgba(200,164,78,0.3)" },
    secondary: { background: "rgba(200,164,78,0.15)", color: "#e0d4c0", border: "1px solid rgba(200,184,136,0.3)" },
    subtle: { background: "transparent", color: "#e0d4c0", textDecoration: "underline", textUnderlineOffset: "3px", padding: "8px 16px" },
  };
  const deactivatedStyle = deactivated ? { background: "rgba(255,255,255,0.03)", color: "#8a7a58", boxShadow: "none", border: "1px solid rgba(140,120,80,0.2)", cursor: "default" } : {};
  return (
    <button onClick={deactivated ? undefined : onClick} style={{
      padding: "12px 28px", borderRadius: "8px", border: "none", cursor: "pointer",
      fontFamily: "'Noto Serif KR', 'Batang', serif", fontSize: "15px", fontWeight: "500",
      letterSpacing: "0.5px", transition: "all 0.2s ease",
      ...(variants[variant] || variants.primary), ...extra, ...deactivatedStyle,
    }}>
      {children}
    </button>
  );
}

function Message({ text }) {
  return (
    <div style={{
      color: "#e0d4c0", fontFamily: "'Noto Serif KR', 'Batang', serif",
      fontSize: "14px", textAlign: "center", padding: "10px 0", lineHeight: "1.7", minHeight: "68px", whiteSpace: "pre-line",
    }}>{text}</div>
  );
}

// --- App ---
function App() {
  const empty = () => Array.from({ length: 4 }, () => Array(4).fill(0));
  const [phase, setPhase] = useState(P.LANDING);
  const [grid, setGrid] = useState(empty);
  const [treasure, setTreasure] = useState(null);
  const [hlCell, setHlCell] = useState(null);
  const [showTreasure, setShowTreasure] = useState(null);
  const [fading, setFading] = useState(false);
  const [findWho, setFindWho] = useState(null);
  const [secTest, setSecTest] = useState(false);
  const [unlockD, setUnlockD] = useState(false);

  const flip = useCallback((i, j) => {
    setGrid(g => { const n = g.map(r => [...r]); n[i][j] = 1 - n[i][j]; return n; });
  }, []);

  const click = (i, j) => {
    const pos = i * 4 + j;
    if (phase === P.A_SEL || phase === P.C_SEL) { setTreasure(pos); setShowTreasure(pos); }
    else if (phase === P.A_FLIP || phase === P.C_FLIP) { flip(i, j); }
    else if (phase === P.A_HUMAN) { flip(i, j); setPhase(P.A_DONE); }
    else if (phase === P.B_INPUT || phase === P.D_INPUT) { flip(i, j); }
    else if (phase === P.B_HUMAN) { setHlCell(pos); setFindWho("human"); setPhase(P.B_DONE); }
  };

  const goToFlip = () => {
    setFading(true);
    setTimeout(() => { setShowTreasure(null); setFading(false); setPhase(P.A_FLIP); }, 800);
  };

  const randomize = () => {
    setGrid(g => g.map(row => row.map(v => Math.random() < 0.5 ? 1 - v : v)));
  };

  const compComplete = () => {
    const mv = calcMapValue(grid);
    const fp = findFlipCard(treasure, mv);
    if (fp === null) { setPhase(P.A_ASK_NF); return; }
    setHlCell(fp); setPhase(P.A_COMPING);
    setTimeout(() => {
      flip(Math.floor(fp / 4), fp % 4);
      setTimeout(() => { setHlCell(null); setPhase(P.A_DONE); }, 800);
    }, 600);
  };

  const noFlipYes = () => setPhase(P.A_DONE);
  const noFlipNo = () => {
    setHlCell(15); setPhase(P.A_COMPING);
    setTimeout(() => { flip(3, 3); setTimeout(() => { setHlCell(null); setPhase(P.A_DONE); }, 800); }, 600);
  };

  const compFind = () => { setHlCell(calcMapValue(grid)); setFindWho("computer"); setPhase(P.B_DONE); };

  const goFind = () => { setTreasure(null); setHlCell(null); setPhase(P.B_WHO); };

  // --- C_ handlers ---
  const cGoToFlip = () => {
    setFading(true);
    setTimeout(() => { setShowTreasure(null); setFading(false); setPhase(P.C_FLIP); }, 800);
  };

  const cCompComplete = () => {
    const mv = calcMapValue(grid);
    const fp = findFlipCard(treasure, mv);
    if (fp === null) { setPhase(P.C_ASK_NF); return; }
    setHlCell(fp); setPhase(P.C_COMPING);
    setTimeout(() => {
      flip(Math.floor(fp / 4), fp % 4);
      setTimeout(() => { setHlCell(null); setHlCell(treasure); setPhase(P.C_DONE); }, 800);
    }, 600);
  };

  const cNoFlipYes = () => { setHlCell(treasure); setPhase(P.C_DONE); };
  const cNoFlipNo = () => {
    setHlCell(15); setPhase(P.C_COMPING);
    setTimeout(() => { flip(3, 3); setTimeout(() => { setHlCell(null); setHlCell(treasure); setPhase(P.C_DONE); }, 800); }, 600);
  };

  const [showTrToggle, setShowTrToggle] = useState(true);

  const dSubmit = () => { setHlCell(calcMapValue(grid)); setPhase(P.D_RESULT); };

  const reset = () => { setGrid(empty()); setTreasure(null); setHlCell(null); setShowTreasure(null); setFading(false); setFindWho(null); setShowTrToggle(true); setPhase(P.L_YES); };
  const goBack = () => { setGrid(empty()); setTreasure(null); setHlCell(null); setShowTreasure(null); setFading(false); setFindWho(null); setShowTrToggle(true); setPhase(P.LANDING); };

  const sel = [P.A_SEL, P.A_FLIP, P.A_HUMAN, P.B_INPUT, P.B_HUMAN, P.C_SEL, P.C_FLIP, P.D_INPUT].includes(phase);

  const hlColor = [P.A_COMPING, P.A_ASK_NF, P.A_DONE, P.C_COMPING, P.C_ASK_NF].includes(phase) ? "#7eb8e0" : "#ffd700";

  const g = (props) => <Grid grid={grid} onCellClick={click} selectable={sel} showTreasureOn={showTreasure} treasureFading={fading} highlightedCell={hlCell} highlightColor={hlColor} {...props} />;

  const bot = { minHeight: "180px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "12px" };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(180deg, #201812 0%, #281e16 50%, #201812 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'Noto Serif KR', 'Batang', serif", wordBreak: "keep-all",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>

        {phase === P.LANDING && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", paddingTop: "40px" }}>
            <div style={{ color: "#e0d4c0", fontSize: "14px", textAlign: "center", paddingBottom: "8px" }}>간단한 마술 하나 보여드릴까요?</div>
            <Btn onClick={() => setPhase(P.L_YES)}>네</Btn>
            <Btn onClick={() => setPhase(P.L_NO)}>아니오</Btn>
          </div>
        )}

        {phase === P.L_NO && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80vh" }}>
            <div style={{ flex: 1 }} />
            <div style={{ color: "#e0d4c0", fontSize: "14px", textAlign: "center" }}>이 페이지에서는 마술 말고 보여드릴 게 없어요... 죄송...</div>
            <div style={{ flex: 1 }} />
            <Btn variant="subtle" onClick={goBack}>뒤로</Btn>
            <div style={{ height: "40px" }} />
          </div>
        )}

        {phase === P.L_YES && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80vh" }}>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
              {/* <Btn deactivated style={{ width: "180px" }}>지도 만들기</Btn> */}
              {/* <Btn deactivated style={{ width: "180px" }}>보물 찾기</Btn> */}
              <Btn onClick={() => setPhase(P.C_INTRO)} style={{ whiteSpace: "nowrap" }}>컴퓨터가 만들고 사람이 찾기</Btn>
              <Btn deactivated={!unlockD} onClick={unlockD ? () => setPhase(P.D_INTRO) : undefined} style={{ whiteSpace: "nowrap" }}>사람이 만들고 컴퓨터가 찾기</Btn>
              {/* <Btn variant="secondary" onClick={() => setSecTest(t => !t)}>{secTest ? "세컨더리 버튼 2" : "세컨더리 버튼 1"}</Btn> */}
            </div>
            <div style={{ flex: 1 }} />
            <Btn variant="subtle" onClick={goBack}>뒤로</Btn>
            <div style={{ height: "40px" }} />
          </div>
        )}

        {phase === P.A_SEL && (<>
          <Message text="보물을 숨길 카드를 선택하세요" />{g()}
          <div style={bot}>{treasure !== null && !fading && <Btn onClick={goToFlip}>완료</Btn>}</div>
        </>)}

        {phase === P.A_FLIP && (<>
          <Message text="카드를 자유롭게 뒤집으세요" />{g()}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn variant="secondary" onClick={randomize}>랜덤</Btn>
            <Btn onClick={() => setPhase(P.A_WHO)}>완료</Btn>
          </div></div>
        </>)}

        {phase === P.A_WHO && (
          <><Message text="누가 지도를 완성할까요?" />{g({ selectable: false })}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn onClick={compComplete}>컴퓨터가 완성</Btn>
            <Btn onClick={() => setPhase(P.A_HUMAN)}>내가 완성</Btn>
          </div></div></>
        )}

        {phase === P.A_COMPING && <><Message text="지도를 완성하는 중..." />{g({ selectable: false })}<div style={bot} /></>}

        {phase === P.A_ASK_NF && (
          <><Message text={"이미 완성된 지도입니다!\n그대로 진행할까요?"} />{g({ selectable: false })}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn onClick={noFlipYes}>네</Btn><Btn onClick={noFlipNo}>아니오</Btn>
          </div></div></>
        )}

        {phase === P.A_HUMAN && <><Message text="카드 하나를 뒤집어 지도를 완성하세요" />{g()}<div style={bot} /></>}

        {phase === P.A_DONE && (
          <><Message text="지도가 완성되었습니다" />{g({ selectable: false })}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn onClick={goFind}>이 지도에서 찾기</Btn><Btn variant="subtle" onClick={reset}>처음으로</Btn>
          </div></div></>
        )}

        {phase === P.B_INPUT && <><Message text="지도를 입력하세요" />{g()}<div style={bot}><Btn onClick={() => setPhase(P.B_WHO)}>완료</Btn></div></>}

        {phase === P.B_WHO && (
          <><Message text="누가 보물을 찾을까요?" />{g({ selectable: false })}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn onClick={() => setPhase(P.B_HUMAN)}>내가 찾기</Btn>
            <Btn onClick={compFind}>컴퓨터가 찾기</Btn>
          </div></div></>
        )}

        {phase === P.B_HUMAN && <><Message text="보물이 있는 카드를 선택하세요" />{g()}<div style={bot} /></>}

        {phase === P.B_DONE && (
          <><Message text={findWho === "computer" ? "보물은 여기에 있습니다" : ""} />{g({ selectable: false })}<div style={bot}><Btn variant="subtle" onClick={reset}>처음으로</Btn></div></>
        )}

        {phase === P.C_INTRO && (
          <div style={{ color: "#e0d4c0", fontFamily: "'Noto Serif KR', 'Batang', serif", fontSize: "14px", textAlign: "center", padding: "24px 12px", lineHeight: "2" }}>
            <p>보물지도를 만들어봅시다!</p>
            <p>당신은 16개의 칸 중에서 원하는 곳 아무데나 보물을 숨길 수 있고, 지도를 만들 때에도 원하는 카드를 원하는 만큼 뒤집어서 만들 수 있어요.</p>
            <p>그 다음 제가 장인의 손길로 딱 한칸만 건드려주면 지도가 완성됩니다.</p>
            <p>직접 해볼까요?</p>
            <div style={{ paddingTop: "12px" }}><Btn onClick={() => { setGrid(empty()); setUnlockD(true); setPhase(P.C_SEL); }}>시작하기</Btn></div>
          </div>
        )}

        {phase === P.C_SEL && (<>
          <Message text="보물을 숨길 칸을 골라주세요." />{g()}
          <div style={bot}>{treasure !== null && !fading && <Btn onClick={cGoToFlip}>완료</Btn>}</div>
        </>)}

        {phase === P.C_FLIP && (<>
          <Message text="카드를 원하는만큼 뒤집어주세요." />{g()}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn variant="secondary" onClick={randomize}>랜덤</Btn>
            <Btn onClick={cCompComplete}>완료</Btn>
          </div></div>
        </>)}

        {phase === P.C_COMPING && <><Message text="지도를 완성하는 중..." />{g({ selectable: false })}<div style={bot} /></>}

        {phase === P.C_ASK_NF && (
          <><Message text={"이미 완성된 지도입니다!\n그대로 진행할까요?"} />{g({ selectable: false })}
          <div style={bot}><div style={{ display: "flex", gap: "12px" }}>
            <Btn onClick={cNoFlipYes}>네</Btn><Btn onClick={cNoFlipNo}>아니오</Btn>
          </div></div></>
        )}

        {phase === P.C_DONE && (<>
          <Message text="지도가 완성되었습니다!" />
          {g({ selectable: false, highlightedCell: showTrToggle ? treasure : null, highlightColor: "#ffd700" })}
          <div style={bot}>
            <Btn variant="secondary" onClick={() => setShowTrToggle(t => !t)} style={{ width: "140px" }}>{showTrToggle ? "보물 감추기" : "보물 표시"}</Btn>
            <div style={{ color: "#e0d4c0", fontSize: "12px", textAlign: "center", lineHeight: "1.6", padding: "0 12px" }}>
              보물을 감춘 상태로 캡쳐한 후에 지도를 읽을 수 있는 사람에게 보내보세요.
            </div>
            <Btn variant="subtle" onClick={reset}>처음으로</Btn>
          </div>
        </>)}

        {phase === P.D_INTRO && (
          <div style={{ color: "#e0d4c0", fontFamily: "'Noto Serif KR', 'Batang', serif", fontSize: "14px", textAlign: "center", padding: "24px 12px", lineHeight: "2" }}>
            <p>이번에는 역할을 바꿔서 해볼게요.</p>
            <p>지도를 만들 수 있는 사람과 같이 진행하고, 다음 화면에 완성된 지도를 입력해주세요.</p>
            <p>방법을 까먹었다면 지도를 만들 수 있는 사람에게 물어보세요.</p>
            <div style={{ paddingTop: "12px" }}><Btn onClick={() => { setGrid(empty()); setPhase(P.D_INPUT); }}>시작하기</Btn></div>
          </div>
        )}

        {phase === P.D_INPUT && (<>
          <Message text="완성된 지도를 입력해주세요." />{g()}
          <div style={bot}><Btn onClick={dSubmit}>제출</Btn></div>
        </>)}

        {phase === P.D_RESULT && (<>
          <Message text="보물은 여기에 있습니다" />{g({ selectable: false })}
          <div style={bot}>
            <div style={{ color: "#e0d4c0", fontSize: "14px" }}>맞았나요?</div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Btn onClick={() => setPhase(P.D_YES)}>네</Btn>
              <Btn onClick={() => setPhase(P.D_NO)}>아니오</Btn>
            </div>
          </div>
        </>)}

        {phase === P.D_YES && (<>
          <Message text="" />{g({ selectable: false })}
          <div style={bot}>
            <div style={{ color: "#e0d4c0", fontSize: "14px", textAlign: "center" }}>지도 읽기 성공!</div>
            <Btn onClick={() => setPhase(P.D_HOWTO)}>어케함?</Btn>
          </div>
        </>)}

        {phase === P.D_NO && (<>
          <Message text="" />{g({ selectable: false })}
          <div style={bot}>
            <div style={{ color: "#e0d4c0", fontSize: "14px", textAlign: "center", whiteSpace: "pre-line" }}>{"중간에 뭔가 안맞았던것 같네요.\n아쉽..."}</div>
            <Btn onClick={() => setPhase(P.D_HOWTO)}>어케함?</Btn>
          </div>
        </>)}

        {phase === P.D_HOWTO && (
          <div style={{ color: "#e0d4c0", fontFamily: "'Noto Serif KR', 'Batang', serif", fontSize: "14px", textAlign: "center", padding: "24px 12px", lineHeight: "2", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <p>이 마술은 부호이론쪽 지식을 사용하여 만들었어요. 정확한 계산식까지 알려드릴수는 없지만, 해법은 아래 동영상을 참고하세요.</p>
            <iframe
              width="100%" height="220" style={{ maxWidth: "380px", borderRadius: "12px", border: "none" }}
              src="https://www.youtube.com/embed/as7Gkm7Y7h4?si=pew4J43AHQ6DSvpq"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <p>감사합니다!</p>
            <Btn variant="subtle" onClick={reset}>처음으로</Btn>
          </div>
        )}

      </div>
    </div>
  );
}
