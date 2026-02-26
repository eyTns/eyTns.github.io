# Tiny Interactive — 전수 결정 감사 (Exhaustive Decision Audit)

모든 파일, 모든 모듈, 모든 컴포넌트, 모든 코드 라인에 존재하는 의도·맥락·가치 판단을 빠짐없이 열거한다.
각 항목에 대해 사용자에게 질문한다.

> **범례**: ✅ = 사용자 확인됨, ❓ = 미확인 (질문 필요), ⚠️ = 잠재적 문제

---

## 1차: 파일 구조·HTML·상수·피스 정의

---

### A. 파일 구조

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| A1 | 디렉토리명 | `tiny/` (소문자, 문제명 그대로) | ❓ |
| A2 | JSX 파일명 | `tiny_interactive.jsx` (mines 패턴: `{name}_interactive.jsx`) | ❓ |
| A3 | HTML 파일명 | `index.html` (디렉토리 기본 문서) | ❓ |
| A4 | 결정문서 파일명 | `DECISIONS.md` (대문자, 폴더 내) | ❓ |
| A5 | 파일 개수 | 3개 (html + jsx + md). CSS 파일 없음, JS 분할 없음 | ❓ |
| A6 | 단일 JSX에 모든 로직 | 순수 함수 + 컴포넌트 + 상수 모두 한 파일 (~774줄) | ❓ |
| A7 | 루트 index.html에 링크 | `<h3><a href="tiny/">Tiny</a></h3>` — h3 태그, 텍스트 "Tiny" | ❓ |
| A8 | 루트 링크의 순서 | mines 다음, 레포지토리 페이지 바로 앞 (마지막 프로젝트) | ❓ |
| A9 | README.md 미수정 | 루트 README에 Tiny 관련 내용 없음 | ❓ |
| A10 | favicon 없음 | tiny/index.html에 favicon 미설정 | ❓ |
| A11 | CSS 리셋 없음 | body margin/padding 브라우저 기본값 사용 | ❓ |

---

### B. index.html

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| B1 | HTML lang 속성 | `lang="ko"` (한국어) | ❓ |
| B2 | charset | `UTF-8` | ❓ |
| B3 | viewport meta | `width=device-width, initial-scale=1.0` — user-scalable 제한 없음 | ❓ |
| B4 | title 텍스트 | `Tiny` (Interactive 없음, 문제 번호 없음) | ❓ |
| B5 | React 버전 | `react@18` (메이저만 지정, 마이너 고정 없음) | ❓ |
| B6 | React 빌드 타입 | `react.production.min.js` (development 아닌 production) | ❓ |
| B7 | CDN 소스 | `unpkg.com` (jsdelivr, cdnjs 등 대신) | ❓ |
| B8 | Babel standalone 사용 | 클라이언트 사이드 JSX 컴파일 (빌드 시스템 없음) | ❓ |
| B9 | Babel 버전 | `@babel/standalone` (버전 미지정, latest) | ❓ |
| B10 | JSX 로딩 방식 | `<script type="text/babel" src="./tiny_interactive.jsx">` (외부 파일) | ❓ |
| B11 | 마운트 스크립트 분리 | JSX 파일과 별도 인라인 `<script>` 블록에서 `createRoot().render()` | ❓ |
| B12 | React 18 API | `createRoot` (React 17의 `ReactDOM.render` 대신) | ❓ |
| B13 | body 스타일 미지정 | `<body>`에 style, class 없음 | ❓ |
| B14 | 외부 CSS 미사용 | `<link rel="stylesheet">` 없음 | ❓ |
| B15 | 로딩 표시 없음 | `<div id="root">` 내용 비어있음 (Babel 파싱 중 빈 화면) | ❓ |

---

### C. 상수 — 그리드 및 공용 스타일

| # | 결정 사항 | 현재 값 (line) | 상태 |
|---|----------|---------------|------|
| C1 | 셀 크기 | `CS = 35` (L4). 원래 48에서 48×6.5/9≈35로 축소 | ❓ |
| C2 | 그리드 너비 상수명 | `GRID_W = 9` (L5). 매직넘버 9 대신 명명 상수 | ❓ |
| C3 | 그리드 높이 상수명 | `GRID_H = 9` (L6). W와 별도 상수 (정사각형이지만 분리) | ❓ |
| C4 | 그리드 픽셀 크기 | `GRID_PX = GRID_W * CS` = 315px (L7). 파생 상수 | ❓ |
| C5 | BTN padding | `'6px 14px'` (L8) | ❓ |
| C6 | BTN borderRadius | `6` (L8) | ❓ |
| C7 | BTN border 색상 | `#cbd5e1` — Tailwind slate-300 (L8) | ❓ |
| C8 | BTN background | `#f8fafc` — Tailwind slate-50 (L8) | ❓ |
| C9 | BTN fontSize | `13`px (L8) | ❓ |
| C10 | BTN fontFamily | `'system-ui,sans-serif'` (L8) | ❓ |
| C11 | BTN cursor | `'pointer'` (L8) | ❓ |
| C12 | React 훅 import 목록 | `useState, useRef, useEffect, useCallback, useMemo` (L1) | ❓ |
| C13 | useMemo import 미사용 | import 했으나 코드에서 사용 안 함 (L1) | ⚠️ |

---

### D. 피스 정의 (PIECES)

| # | 결정 사항 | 현재 값 (L18-28) | 상태 |
|---|----------|-----------------|------|
| D1 | 데이터 구조 | `{ cells, w, h, xRow, xCol }` — 5개 필드 | ❓ |
| D2 | 키 타입 | 숫자 키 (1-9) in plain object (`{}` not `[]`) | ❓ |
| D3 | cells 좌표계 | `[row_offset, col_offset]` — 행 우선, 바운딩 박스 좌상단 기준 | ❓ |
| D4 | w, h 필드 존재 이유 | cells에서 계산 가능하나 별도 저장 (중복) | ❓ |
| D5 | xRow, xCol 표현 방식 | × 마커의 바운딩 박스 내 위치를 별도 필드로 | ❓ |
| D6 | 피스 1 | 단일 셀 `[[0,0]]`, x=[0,0] | ❓ |
| D7 | 피스 2 | 세로 도미노 `[[0,0],[1,0]]`, x=아래(1,0) | ❓ |
| D8 | 피스 3 | 가로 도미노 `[[0,0],[0,1]]`, x=왼쪽(0,0) | ❓ |
| D9 | 피스 4 | 세로 트로미노 `[[0,0],[1,0],[2,0]]`, x=맨 아래(2,0) | ❓ |
| D10 | 피스 5 | 가로 트로미노 `[[0,0],[0,1],[0,2]]`, x=맨 왼쪽(0,0) | ❓ |
| D11 | 피스 6 | `[[0,0],[1,0],[1,1]]`, x=(1,0) | ❓ |
| D12 | 피스 7 | `[[0,1],[1,0],[1,1]]`, x=(1,0) | ❓ |
| D13 | 피스 8 | `[[0,0],[0,1],[1,0]]`, x=(1,0) | ❓ |
| D14 | 피스 9 | `[[0,0],[0,1],[1,1]]`, x=(0,0) | ❓ |
| D15 | 피스 정의 주석 | ASCII art로 9개 피스 시각화 (L14-17) | ❓ |
| D16 | 검증 출처 주석 | "Verified against BOI 2012 problem images" (L14) | ❓ |

---

### E. 피스 색상

| # | 결정 사항 | 현재 값 (L30-39) | 상태 |
|---|----------|-----------------|------|
| E1 | 색상 체계 | Tailwind CSS 400/500 팔레트 기반 | ❓ |
| E2 | 빈 칸(0) 색상 | fill `#f1f5f9` (slate-50), border `#e2e8f0` (slate-200) | ❓ |
| E3 | 피스 1 색상 | amber-400 / amber-500 | ❓ |
| E4 | 피스 2 색상 | orange-400 / orange-500 | ❓ |
| E5 | 피스 3 색상 | red-400 / red-500 | ❓ |
| E6 | 피스 4 색상 | pink-400 / pink-500 | ❓ |
| E7 | 피스 5 색상 | purple-400 / purple-500 | ❓ |
| E8 | 피스 6 색상 | indigo-400 / indigo-500 | ❓ |
| E9 | 피스 7 색상 | blue-400 / blue-500 | ❓ |
| E10 | 피스 8 색상 | cyan-400 / cyan-500 | ❓ |
| E11 | 피스 9 색상 | emerald-400 / emerald-500 | ❓ |
| E12 | 색상 배정 순서 | 1→amber→...→9→emerald (무지개 스펙트럼순) | ❓ |
| E13 | fill/border 분리 | PIECE_COLORS와 PIECE_BORDERS 별도 객체 | ❓ |
| E14 | border 색상 관계 | fill보다 한 단계 진한 (400 → 500) | ❓ |

---

### F. 내장 예제

| # | 결정 사항 | 현재 값 (L41-44) | 상태 |
|---|----------|-----------------|------|
| F1 | 예제 개수 | 2개 | ❓ |
| F2 | 예제 데이터 구조 | `{ name, data }` — 이름 + 원시 텍스트 | ❓ |
| F3 | 예제 1 이름 | `'Demo (20)'` — 피스 수 포함 | ❓ |
| F4 | 예제 1 데이터 | 문제 본문의 20피스 예제 시퀀스 | ❓ |
| F5 | 예제 2 이름 | `'Line Clear'` — 영어 | ❓ |
| F6 | 예제 2 데이터 | 12피스 (5,5,5,3,3,3,3,1,5,5,5,1) — 수제 시퀀스 | ❓ |
| F7 | 예제 이름 언어 | 영어 (UI는 한국어인데 예제명은 영어) | ⚠️ |

---

### G. 전략 상수

| # | 결정 사항 | 현재 값 (L46-48) | 상태 |
|---|----------|-----------------|------|
| G1 | 변수명 접두사 | `Q1_` — "Q1" 접두사 | ❓ |
| G2 | 패턴 배열 내용 | `[5,3,5,3,...×9]` — 18개, 5와 3 교대 | ❓ |
| G3 | 열 배열 내용 | `[1,4,1,6,1,8,4,4,7,6,1,8,4,4,7,6,1,8]` — 18개 | ❓ |
| G4 | 사이클 길이 | 18 (Q1_COLS.length에서 암시적으로 도출, 별도 상수 없음) | ❓ |
| G5 | 상수의 스코프 | 컴포넌트 밖 최상위 | ❓ |
| G6 | 전략 버튼 라벨 | "Q1 전략1" | ❓ |

---

### H. 전략 유틸 함수

| # | 결정 사항 | 현재 값 (L50-62) | 상태 |
|---|----------|-----------------|------|
| H1 | isGridEmpty 구현 | 이중 for문으로 모든 셀 검사 (카운터 추적 대신) | ❓ |
| H2 | 빈 값 기준 | `!== 0` — 0이 빈 셀 | ❓ |
| H3 | matchesPattern 구현 | startIdx부터 순차 비교 | ❓ |
| H4 | 범위 초과 처리 | `startIdx + pattern.length > seq.length` → false | ❓ |
| H5 | 함수 위치 | 컴포넌트 밖 순수 함수 | ❓ |

---

## 2차: 게임 로직 함수·파싱·유틸리티

---

### I. createEmptyGrid (L65-67)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| I1 | 구현 방식 | `Array.from({length:GRID_H}, ()=>Array(GRID_W).fill(0))` | ❓ |
| I2 | 빈 셀 값 | `0` (숫자) — null, undefined, '' 등 대신 | ❓ |
| I3 | 함수 위치 | 컴포넌트 밖 순수 함수 | ❓ |
| I4 | 반환 값 | 매번 새 배열 생성 (공유 참조 없음) | ❓ |

---

### J. isValidColumn (L69-73)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| J1 | 열 번호 체계 | 입력: 1-indexed (col 파라미터) | ❓ |
| J2 | 열 변환 공식 | `c0 = col - 1 - p.xCol` (1→0 변환 + x오프셋 보정) | ❓ |
| J3 | 유효 범위 판정 | `c0 >= 0 && c0 + p.w <= GRID_W` | ❓ |
| J4 | 그리드 상태 불참조 | 열 자체의 유효성만 검사 (착지 가능 여부 별도) | ❓ |

---

### K. getValidColumns (L75-81)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| K1 | 반환 형식 | 유효 열 번호 배열 `[1,2,...,9]` 중 부분집합 | ❓ |
| K2 | 순회 범위 | 1~9 고정 루프 | ❓ |
| K3 | 매 호출 재계산 | 캐시 없이 매번 루프 (피스 9개×열 9개=최대 81회) | ❓ |

---

### L. findLandingRow (L83-109)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| L1 | 알고리즘 | 위→아래 순차 스캔 (이진탐색 대신) | ❓ |
| L2 | 시작 행 | `-(p.h - 1)` — 피스 일부가 그리드 위에 있을 수 있음 | ❓ |
| L3 | 종료 조건 | `startRow < GRID_H` | ❓ |
| L4 | 충돌 판정 순서 | 열 범위 → 행 하한(>=GRID_H) → 행 상한+셀 점유 | ❓ |
| L5 | `r >= 0` 가드 | 그리드 위 공간의 셀은 항상 빈 것으로 취급 | ❓ |
| L6 | 연속 낙하 시뮬레이션 | fits → landRow 갱신, !fits → 무조건 break | ❓ |
| L7 | 무조건 break의 의미 | 한번 막히면 더 아래로 탐색 안 함 (통과 불가) | ❓ |
| L8 | landRow 초기값 | `-1` (어디에도 못 착지 = 불가) | ❓ |
| L9 | 후검증 | 착지 후 모든 셀이 그리드 안에 있는지 재확인 | ❓ |
| L10 | 후검증에서 dc 무시 | `for (const [dr] of p.cells)` — dc 참조 안 함 (열은 이미 검증) | ❓ |
| L11 | 반환 값 | 착지 행 번호 or -1 (실패) | ❓ |

---

### M. placePiece (L111-119)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| M1 | 불변성 | 원본 grid 수정 안 함, 새 배열 반환 | ❓ |
| M2 | 복사 방식 | `grid.map(r=>[...r])` — 얕은 복사 (숫자 배열이므로 충분) | ❓ |
| M3 | 셀 값 기록 | `pieceType` 숫자 저장 (1-9) | ❓ |
| M4 | 배치 유효성 미검증 | 호출 전에 이미 검증했다고 가정 | ❓ |

---

### N. clearLines (L121-130)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| N1 | 꽉 찬 행 판정 | `row.every(c => c !== 0)` | ❓ |
| N2 | 제거 방식 | `grid.filter()` — 꽉 찬 행 필터링 | ❓ |
| N3 | 빈 행 보충 | `ng.unshift(Array(GRID_W).fill(0))` — 위에서 채움 | ❓ |
| N4 | 반환 형식 | `{ grid, cleared }` — 새 그리드 + 클리어 수 | ❓ |
| N5 | 동시 다중 줄 클리어 | 가능 (filter가 모든 꽉 찬 행 제거) | ❓ |
| N6 | 부분 클리어 없음 | 한 행이 전부 차야만 클리어 | ❓ |

---

### O. executeMove (L132-143)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| O1 | 함수 역할 | 검증 + 착지 + 배치 + 클리어를 한 번에 처리 | ❓ |
| O2 | 실패 시 반환 | `{ success:false, reason:문자열 }` | ❓ |
| O3 | 에러 메시지 언어 | 한국어 (`열 ${col}은(는) 조각 ${pieceType}에 유효하지 않음`) | ❓ |
| O4 | 에러 메시지 2 | `조각 ${pieceType}이(가) 열 ${col}에 들어가지 않음` | ❓ |
| O5 | 성공 시 반환 | `{ success:true, grid, cleared, landRow }` | ❓ |
| O6 | landRow 반환 이유 | 플래시 애니메이션에서 배치 위치 파악에 사용 | ❓ |
| O7 | 유효성 검사 순서 | isValidColumn → findLandingRow (열 유효성 먼저) | ❓ |

---

### P. parsePieceSequence (L145-163)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| P1 | 첫 번째 파싱 시도 | 줄 단위: trim→split(\n)→trim→filter empty | ❓ |
| P2 | N 감지 휴리스틱 1 | `lines.length > 1 && firstNum === lines.length - 1` | ❓ |
| P3 | N 감지 시 검증 | 각 줄 parseInt 후 1-9 범위 체크 | ❓ |
| P4 | 범위 외 값 에러 | `유효하지 않은 조각 번호: ${l}` (한국어) | ❓ |
| P5 | 폴백 파싱 | 공백/콤마 분리: `split(/[\s,]+/)` | ❓ |
| P6 | 폴백에서 필터링 | `.filter(n => n >= 1 && n <= 9)` — 범위 밖 숫자 무시 (에러 아님) | ⚠️ |
| P7 | N 감지 휴리스틱 2 | `nums[0] === nums.length - 1 && nums.length > 1` | ❓ |
| P8 | 빈 입력 에러 | `'빈 입력'` (한국어) | ❓ |
| P9 | 유효한 번호 없음 에러 | `'유효한 조각 번호 없음'` (한국어) | ❓ |
| P10 | parseInt vs Number | 줄 단위: parseInt, 폴백: Number (다른 함수 사용) | ⚠️ |

---

### Q. downloadBlob (L165-171)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| Q1 | 다운로드 방식 | programmatic: createObjectURL → <a> click → remove | ❓ |
| Q2 | URL 정리 | `URL.revokeObjectURL(u)` 즉시 호출 | ❓ |
| Q3 | DOM 조작 | body에 append → click → remove | ❓ |

---

### R. PieceDisplay 컴포넌트 (L174-207)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| R1 | 컴포넌트 위치 | TinyGame 밖, 별도 함수 컴포넌트 | ❓ |
| R2 | props | `{ type, size=16, highlight=false }` | ❓ |
| R3 | 기본 size | 16px | ❓ |
| R4 | 셀 존재 판정 | `Set`에 `"r,c"` 문자열 키로 조회 | ❓ |
| R5 | 빈 셀 표현 | `background: 'transparent'`, `border: 'none'` | ❓ |
| R6 | 채워진 셀 border | `1.5px solid ${PIECE_BORDERS[type]}` | ❓ |
| R7 | 셀 borderRadius | `2`px | ❓ |
| R8 | × 마커 표현 | HTML entity `×`, absolute positioned, 중앙 정렬 | ❓ |
| R9 | × 마커 크기 | `size * 0.6` | ❓ |
| R10 | × 마커 색상 | 흰색 (#fff), fontWeight 700 | ❓ |
| R11 | × 마커 텍스트 섀도 | `0 0 2px rgba(0,0,0,0.4)` | ❓ |
| R12 | 행 간 gap | `1`px | ❓ |
| R13 | 열 간 gap | `1`px | ❓ |
| R14 | 전체 padding | `3`px | ❓ |
| R15 | highlight 배경 | `#e0e7ff` (indigo-100) | ❓ |
| R16 | highlight 테두리 | `2px solid #818cf8` (indigo-400) | ❓ |
| R17 | 비highlight 테두리 | `2px solid transparent` (레이아웃 시프트 방지) | ❓ |
| R18 | display 방식 | `inline-flex`, flexDirection column | ❓ |

---

## 3차: 상태 관리·히스토리·전략 시스템·입출력 동작

---

### S. TinyGame 상태 변수 (L210-230)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| S1 | 컴포넌트명 | `TinyGame` | ❓ |
| S2 | 컴포넌트 형태 | function 컴포넌트 (class 아님) | ❓ |
| S3 | pieceSeq 초기값 | `[]` (빈 배열) | ❓ |
| S4 | totalPieces 별도 관리 | `useState(0)` — pieceSeq.length로 대체 가능하나 별도 | ⚠️ |
| S5 | grid 초기값 | `createEmptyGrid()` (함수 호출) | ❓ |
| S6 | curIdx 초기값 | `0` | ❓ |
| S7 | colChoices 초기값 | `[]` (빈 배열) | ❓ |
| S8 | linesCleared 초기값 | `0` | ❓ |
| S9 | gameOver 초기값 | `false` | ❓ |
| S10 | gameOverReason 초기값 | `''` (빈 문자열) | ❓ |
| S11 | history 초기값 | `[]` (빈 배열) | ❓ |
| S12 | history를 useState로 관리 | useReducer 대신 useState | ❓ |
| S13 | showPaste 초기값 | `false` (텍스트 영역 숨김) | ❓ |
| S14 | paste 초기값 | `''` | ❓ |
| S15 | hoveredCol 초기값 | `null` | ❓ |
| S16 | ghostCells 초기값 | `[]` | ❓ |
| S17 | flashRows 초기값 | `[]` | ❓ |
| S18 | q1Pos 초기값 | `null` (사이클 밖) | ❓ |
| S19 | q1Pos 의미 체계 | null=사이클 밖, 0-17=사이클 내 위치 | ❓ |
| S20 | q1Running 초기값 | `false` | ❓ |
| S21 | 상태 변수 총 개수 | 16개 | ❓ |
| S22 | ref: cvRef | canvas DOM 참조 | ❓ |
| S23 | ref: fiRef | file input DOM 참조 | ❓ |
| S24 | ref: q1StopRef | 자동 플레이 중지 신호 (boolean ref) | ❓ |
| S25 | ref 총 개수 | 3개 | ❓ |

---

### T. startNewGame (L233-248)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| T1 | 파라미터 | `seq` (피스 시퀀스 배열) | ❓ |
| T2 | q1StopRef 즉시 설정 | `q1StopRef.current = true` — 진행 중 자동 플레이 중단 | ❓ |
| T3 | 14개 상태 일괄 리셋 | 모든 게임 상태를 초기값으로 | ❓ |
| T4 | history 초기화 | `setHistory([])` — 이전 게임 히스토리 삭제 | ❓ |
| T5 | dependency array | `[]` (빈 배열) — 외부 상태 의존 없음 | ❓ |

---

### U. resetGame (L250-252)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| U1 | 구현 | `startNewGame([...pieceSeq])` — 시퀀스 복사하여 재시작 | ❓ |
| U2 | guard | `pieceSeq.length > 0` — 시퀀스 없으면 무동작 | ❓ |
| U3 | 시퀀스 복사 이유 | `[...pieceSeq]` — 참조 공유 방지 | ❓ |

---

### V. pushHistory (L254-260)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| V1 | 업데이트 방식 | `setHistory(h => ...)` — 함수형 업데이트 | ❓ |
| V2 | 스냅샷 필드 | grid, curIdx, colChoices, linesCleared, gameOver, gameOverReason, q1Pos (7개) | ❓ |
| V3 | grid 복사 | `grid.map(r=>[...r])` — 깊은 복사 | ❓ |
| V4 | colChoices 복사 | `[...colChoices]` — 배열 복사 | ❓ |
| V5 | 최대 히스토리 크기 | 500 — `n.length > 500 ? n.slice(-500) : n` | ❓ |
| V6 | 오래된 항목 삭제 방식 | `slice(-500)` — 가장 오래된 것부터 제거 | ❓ |
| V7 | flashRows 미포함 | 히스토리에 flashRows 저장 안 함 | ❓ |
| V8 | hoveredCol/ghostCells 미포함 | UI 상태는 히스토리에 불포함 | ❓ |
| V9 | showPaste/paste 미포함 | 입력 UI 상태는 히스토리에 불포함 | ❓ |
| V10 | q1Running 미포함 | 자동 플레이 실행 상태는 히스토리에 불포함 | ❓ |

---

### W. undo (L262-279)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| W1 | 자동 플레이 중단 | `q1StopRef.current = true; setQ1Running(false)` | ❓ |
| W2 | 빈 히스토리 처리 | `if (!h.length) return h` — 무동작 | ❓ |
| W3 | 복원 방식 | 마지막 항목의 모든 필드를 개별 setState | ❓ |
| W4 | q1Pos 복원 | `prev.q1Pos ?? null` — nullish coalescing 폴백 | ❓ |
| W5 | UI 상태 리셋 | hoveredCol=null, ghostCells=[] | ❓ |
| W6 | 히스토리 축소 | `h.slice(0,-1)` — 마지막 항목 제거 | ❓ |
| W7 | dependency array | `[]` (빈) — setHistory 함수형 업데이트로 모든 상태 접근 | ❓ |
| W8 | redo 미지원 | undo만 있고 redo 기능 없음 | ❓ |

---

### X. handleColumnSelect (L281-308)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| X1 | guard 조건 | `gameOver \|\| curIdx >= pieceSeq.length` → return | ❓ |
| X2 | 히스토리 저장 시점 | 이동 실행 전 `pushHistory()` | ❓ |
| X3 | 실패 시 동작 | gameOver=true 설정 (되돌리기 가능) | ❓ |
| X4 | 실패 시 히스토리 | pushHistory 이후이므로 실패 상태도 되돌리기 가능 | ❓ |
| X5 | 플래시 애니메이션 | cleared > 0일 때만 동작 | ❓ |
| X6 | 플래시 계산 | `placePiece()`로 배치 후 grid 재구성하여 꽉 찬 행 탐색 | ❓ |
| X7 | 플래시 지속시간 | `setTimeout(() => setFlashRows([]), 200)` — 200ms | ❓ |
| X8 | 호버 리셋 | 이동 후 hoveredCol=null, ghostCells=[] | ❓ |
| X9 | q1Pos 미변경 | 수동 이동 시 q1Pos 건드리지 않음 | ⚠️ |

---

### Y. 입력 처리 동작 (L311-342)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| Y1 | parseInput 에러 표시 | `alert('파싱 오류: ' + e.message)` | ❓ |
| Y2 | alert 사용 | 모달 alert (toast/inline 에러 대신) | ❓ |
| Y3 | handleFile: 첫 파일만 | `e.target.files?.[0]` — 다중 파일 미지원 | ❓ |
| Y4 | JSON 우선 파싱 | `JSON.parse(txt)` 시도 → 실패 시 텍스트 파싱 | ❓ |
| Y5 | save 식별 | `obj._type === 'tiny_save'` | ❓ |
| Y6 | save 복원 시 히스토리 | `setHistory([])` — 히스토리 초기화 | ❓ |
| Y7 | save 복원 시 q1Pos | 미복원 (q1Pos 설정 없음) | ⚠️ |
| Y8 | JSON 실패 시 | 빈 catch로 무시하고 텍스트 파싱 폴백 | ❓ |
| Y9 | 파일 입력 리셋 | `fiRef.current.value = ''` — 같은 파일 재선택 허용 | ❓ |

---

### Z. 저장/내보내기 (L344-440)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| Z1 | saveProgress 저장 필드 | grid, curIdx, colChoices, pieceSeq, totalPieces, linesCleared, gameOver, gameOverReason | ❓ |
| Z2 | saveProgress에 history 미포함 | 히스토리는 저장 안 함 | ❓ |
| Z3 | saveProgress에 q1Pos 미포함 | 전략 위치도 저장 안 함 | ⚠️ |
| Z4 | saveProgress 파일명 | `'tiny_progress.json'` | ❓ |
| Z5 | saveProgress MIME 타입 | `'application/json'` | ❓ |
| Z6 | exportResult 형식 | `colChoices.join('\n') + '\n'` — 줄바꿈 구분, 마지막 줄바꿈 포함 | ❓ |
| Z7 | exportResult에 N 미포함 | BOI 출력은 열 번호만 (N줄 없음) | ❓ |
| Z8 | exportResult 파일명 | `'tiny_output.txt'` | ❓ |
| Z9 | exportResult MIME 타입 | `'text/plain'` | ❓ |

---

### AA. runQ1Strategy1 자동 플레이 (L349-435)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AA1 | 토글 동작 | 실행 중 클릭 → q1StopRef=true로 중지 | ❓ |
| AA2 | 시작 조건 | gameOver 아님 AND 피스 남음 | ❓ |
| AA3 | 사이클 시작 조건 | q1Pos !== null (기존 사이클 계속) OR (빈 보드 AND 패턴 매치) | ❓ |
| AA4 | mutable state 패턴 | `let mGrid, mIdx, mCols, mCleared, mPos` — 클로저 stale 회피 | ❓ |
| AA5 | finish 헬퍼 | 최종 상태 일괄 flush + q1Running=false | ❓ |
| AA6 | step 함수 재귀 | setTimeout(step, 10)으로 반복 | ❓ |
| AA7 | 딜레이 | 10ms | ❓ |
| AA8 | 중지 조건 1 | `q1StopRef.current` (외부 중지 신호) | ❓ |
| AA9 | 중지 조건 2 | `mIdx >= pieceSeq.length` (피스 소진) | ❓ |
| AA10 | 사이클 경계 처리 | `mPos >= Q1_COLS.length` → 조건 재확인 → mPos=0 | ❓ |
| AA11 | 사이클 경계 실패 시 | finish(null) — q1Pos를 null로 리셋 | ❓ |
| AA12 | 히스토리 저장 | `setHistory(h => ...)` 함수형 업데이트, 매 수마다 | ❓ |
| AA13 | 히스토리 항목 내 gameOver | 항상 `false` (자동 플레이 중에는 gameOver 전 상태) | ❓ |
| AA14 | 히스토리 항목 내 gameOverReason | 항상 `''` | ❓ |
| AA15 | executeMove 실패 시 | gameOver 설정 + finish(mPos) | ❓ |
| AA16 | 시각적 업데이트 | 매 수마다 setGrid, setCurIdx, setColChoices, setLinesCleared, setQ1Pos | ❓ |
| AA17 | grid 복사 시점 | `setGrid(mGrid.map(r=>[...r]))` — 시각 업데이트마다 새 참조 | ❓ |
| AA18 | colChoices 복사 | `setColChoices([...mCols])` — 매 수마다 새 배열 | ❓ |
| AA19 | setTimeout vs setInterval | setTimeout 재귀 (정확한 간격보다 완료 후 대기 우선) | ❓ |
| AA20 | dependency array | `[q1Running, gameOver, curIdx, pieceSeq, grid, colChoices, linesCleared, q1Pos]` | ❓ |
| AA21 | 플래시 애니메이션 없음 | 자동 플레이 중 줄 클리어 플래시 미지원 | ⚠️ |

---

## 4차: Ghost·Canvas 렌더링·마우스/키보드 이벤트

---

### AB. computeGhost (L443-453)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AB1 | 입력 | `col0` (0-indexed 열) | ❓ |
| AB2 | 0→1 변환 | `col = col0 + 1` 내부에서 1-indexed로 변환 | ❓ |
| AB3 | 비활성 조건 | `curIdx >= pieceSeq.length \|\| gameOver` → 빈 배열 | ❓ |
| AB4 | 유효성 검사 | isValidColumn 후 findLandingRow | ❓ |
| AB5 | 반환 형식 | `[[row, col], ...]` 절대 좌표 배열 | ❓ |
| AB6 | 착지 불가 시 | 빈 배열 (고스트 안 보임) | ❓ |

---

### AC. drawGrid — Canvas 렌더링 (L456-541)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AC1 | HiDPI 지원 | `devicePixelRatio` 기반 캔버스 크기 조정 | ❓ |
| AC2 | 캔버스 총 높이 | `GRID_PX + 24` — 열 번호용 24px 추가 공간 | ❓ |
| AC3 | 캔버스 크기 매 프레임 설정 | drawGrid 호출마다 width/height 재설정 | ❓ |
| AC4 | setTransform 사용 | `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` — 스케일 매트릭스 | ❓ |
| AC5 | clearRect 범위 | 전체 캔버스 `(0, 0, totalW, totalH)` | ❓ |
| AC6 | ghostSet 생성 미사용 | `ghostSet` 변수 생성하지만 렌더링에서 사용 안 함 (L471) | ⚠️ |
| AC7 | 플래시 효과 색상 | `#fef08a` (Tailwind yellow-200) | ❓ |
| AC8 | 빈 셀 border | `strokeStyle: #e2e8f0`, `lineWidth: 0.5` | ❓ |
| AC9 | 채워진 셀 border | `strokeStyle: PIECE_BORDERS[val]`, `lineWidth: 1.5` | ❓ |
| AC10 | strokeRect 오프셋 | `x + 0.5, y + 0.5, CS - 1, CS - 1` — 선명한 1px 선 | ❓ |
| AC11 | 셀 내 피스 번호 표시 | `val !== 0 && !flashSet.has(r)` 조건으로 표시 | ❓ |
| AC12 | 피스 번호 색상 | `#ffffffcc` — 흰색 80% 불투명도 | ❓ |
| AC13 | 피스 번호 폰트 크기 | `CS * 0.35` = 12.25px (반올림) | ❓ |
| AC14 | 피스 번호 폰트 | `bold sans-serif` | ❓ |
| AC15 | 피스 번호 정렬 | `textAlign: center`, `textBaseline: middle` | ❓ |
| AC16 | 고스트 피스 투명도 | `globalAlpha = 0.35` | ❓ |
| AC17 | 고스트 피스 인셋 | 2px (각 변) — `c*CS+2, r*CS+2, CS-4, CS-4` | ❓ |
| AC18 | 고스트 피스 border | `lineWidth: 2`, PIECE_BORDERS 색상 | ❓ |
| AC19 | 고스트 그리기 조건 | `ghostCells.length > 0 && curIdx < pieceSeq.length` | ❓ |
| AC20 | 고스트 범위 체크 | `r >= 0 && r < GRID_H && c >= 0 && c < GRID_W` | ❓ |
| AC21 | 열 하이라이트 색상 | `rgba(99, 102, 241, 0.06)` — 인디고 6% 불투명 | ❓ |
| AC22 | 열 하이라이트 범위 | 전체 열 높이 `(hoveredCol*CS, 0, CS, GRID_PX)` | ❓ |
| AC23 | 그리드 외곽선 색상 | `#94a3b8` (Tailwind slate-400) | ❓ |
| AC24 | 그리드 외곽선 두께 | `lineWidth: 2` | ❓ |
| AC25 | 열 번호 폰트 크기 | `CS * 0.32` = 11.2px (반올림) | ❓ |
| AC26 | 열 번호 기본 색상 | `#64748b` (Tailwind slate-500) | ❓ |
| AC27 | 열 번호 호버 색상 | `#4f46e5` (Tailwind indigo-600) | ❓ |
| AC28 | 열 번호 위치 | `GRID_PX + 5` — 그리드 아래 5px 여백 | ❓ |
| AC29 | 열 번호 정렬 | `textAlign: center`, `textBaseline: top` | ❓ |
| AC30 | 렌더링 순서 | 셀 → 고스트 → 열 하이라이트 → 외곽선 → 열 번호 | ❓ |
| AC31 | 열 하이라이트가 고스트 위에 | 고스트 다음에 하이라이트 그림 (겹침) | ⚠️ |
| AC32 | drawGrid dependency array | `[grid, ghostCells, hoveredCol, flashRows, curIdx, pieceSeq]` | ❓ |
| AC33 | useEffect drawGrid 호출 | `useEffect(() => { drawGrid(); }, [drawGrid])` | ❓ |

---

### AD. 마우스 이벤트 (L546-577)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AD1 | getCol 계산 | `Math.floor((e.clientX - rect.left) / CS)` | ❓ |
| AD2 | getCol 실패 반환 | `-1` (캔버스 없을 때) | ❓ |
| AD3 | onCanvasClick 변환 | `col0 + 1` — 0-indexed → 1-indexed | ❓ |
| AD4 | onCanvasClick guard | `curIdx >= pieceSeq.length \|\| gameOver` | ❓ |
| AD5 | onCanvasClick 범위 | `col0 >= 0 && col0 < GRID_W` | ❓ |
| AD6 | onCanvasMouseMove 비활성 | 게임 종료/완료 시 hoveredCol=null, ghostCells=[] | ❓ |
| AD7 | onCanvasMouseMove 활성 | 유효 범위: hoveredCol 설정 + computeGhost 호출 | ❓ |
| AD8 | onCanvasLeave 동작 | hoveredCol=null, ghostCells=[] | ❓ |
| AD9 | 열 번호 영역 클릭 | 클릭 시 y 좌표 무시하고 열만 판정 (열 번호도 클릭 가능) | ❓ |
| AD10 | 터치 이벤트 | 미지원 (onClick/onMouseMove만) | ⚠️ |

---

### AE. 키보드 이벤트 (L580-591)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AE1 | 리스너 등록 | `window.addEventListener('keydown', fn)` | ❓ |
| AE2 | Ctrl+Z 되돌리기 | `(e.ctrlKey \|\| e.metaKey) && e.key === 'z'` | ❓ |
| AE3 | Cmd+Z (Mac) 지원 | `e.metaKey` 포함 | ❓ |
| AE4 | Ctrl+Z preventDefault | `e.preventDefault()` — 브라우저 기본 undo 방지 | ❓ |
| AE5 | 숫자키 1-9 | `parseInt(e.key)` 후 1-9 범위 확인 | ❓ |
| AE6 | 수정키 필터 | `!e.ctrlKey && !e.metaKey && !e.altKey` — Ctrl/Cmd/Alt + 숫자 무시 | ❓ |
| AE7 | 숫자키 preventDefault | `e.preventDefault()` — 기본 동작 방지 | ❓ |
| AE8 | Shift+숫자 | 별도 필터 없음 (Shift+1 = "!" → parseInt("!") = NaN → 무시됨) | ❓ |
| AE9 | 방향키 미사용 | 열 이동에 방향키 사용 안 함 | ❓ |
| AE10 | 글로벌 리스너 | window에 등록 (입력 필드 포커스 시에도 동작) | ⚠️ |
| AE11 | 클린업 | `return () => window.removeEventListener(...)` | ❓ |
| AE12 | dependency array | `[undo, handleColumnSelect]` | ❓ |

---

### AF. 파생 상태 (L594-604)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AF1 | currentPiece | `curIdx < pieceSeq.length ? pieceSeq[curIdx] : null` | ❓ |
| AF2 | isComplete 조건 | `pieceSeq.length > 0 && curIdx >= pieceSeq.length && !gameOver` | ❓ |
| AF3 | validCols | `currentPiece ? getValidColumns(currentPiece) : []` — 매 렌더 재계산 | ❓ |
| AF4 | canQ1S1 조건 | `q1Running \|\| (시퀀스 있음 && !gameOver && !isComplete && (사이클 중 \|\| 새 사이클 가능))` | ❓ |
| AF5 | nextPieces 개수 | `pieceSeq.slice(curIdx+1, curIdx+6)` — 최대 5개 | ❓ |
| AF6 | useMemo 미사용 | 파생 상태를 useMemo 없이 매 렌더 계산 | ⚠️ |

---

## 5차: JSX/UI 레이아웃·스타일링·전체 아키텍처

---

### AG. 최상위 컨테이너 (L607-608)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AG1 | fontFamily | `'system-ui,sans-serif'` — BTN과 동일 | ❓ |
| AG2 | maxWidth | `1000`px | ❓ |
| AG3 | margin | `'0 auto'` — 수평 중앙 정렬 | ❓ |
| AG4 | padding | `16`px | ❓ |
| AG5 | color | `'#1e293b'` (Tailwind slate-800) — 기본 텍스트 색상 | ❓ |

---

### AH. 헤더 (L610-618)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AH1 | 이모지 아이콘 | 🧩 (`&#x1F9E9;`) — 퍼즐 조각 | ❓ |
| AH2 | 이모지 크기 | `fontSize: 26` | ❓ |
| AH3 | 헤더 텍스트 | `Tiny Interactive` | ❓ |
| AH4 | 헤더 태그 | `<h2>` — fontSize 19 | ❓ |
| AH5 | 단축키 힌트 | `1-9 키: 열 선택 · Ctrl+Z: 되돌리기 · 클릭으로 열 선택` | ❓ |
| AH6 | 힌트 색상 | `#94a3b8` (slate-400) | ❓ |
| AH7 | 힌트 폰트 크기 | `12`px | ❓ |
| AH8 | 헤더-본문 간격 | `marginBottom: 4` | ❓ |
| AH9 | 헤더 레이아웃 | flex, alignItems center, gap 10 | ❓ |

---

### AI. 툴바 (L620-633)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AI1 | 레이아웃 | `display: flex, gap: 8, flexWrap: wrap` | ❓ |
| AI2 | 상하 여백 | `margin: '10px 0'` | ❓ |
| AI3 | 파일 입력 숨김 | `display: 'none'` + label 클릭 대행 | ❓ |
| AI4 | 파일 accept 속성 | `'.in,.txt,.json,*/*'` | ❓ |
| AI5 | 열기 버튼 이모지 | 📂 (`&#x1F4C2;`) | ❓ |
| AI6 | 열기 구현 | `<label>` (button 아님) + onClick | ❓ |
| AI7 | 텍스트 버튼 이모지 | 📋 (`&#x1F4CB;`) | ❓ |
| AI8 | 텍스트 토글 동작 | `setShowPaste(!showPaste)` | ❓ |
| AI9 | 예제 버튼 이모지 | 📝 (`&#x1F4DD;`) | ❓ |
| AI10 | 예제 버튼 key | `index` (안정적 key 아닌 배열 인덱스) | ⚠️ |
| AI11 | 되돌리기 조건부 표시 | `pieceSeq.length > 0` 일 때만 | ❓ |
| AI12 | 되돌리기 비활성 | `disabled={!history.length}`, `opacity: 0.4` | ❓ |
| AI13 | 되돌리기 이모지 | ↩ (`&#x21A9;`) | ❓ |
| AI14 | 초기화 조건부 표시 | `pieceSeq.length > 0` | ❓ |
| AI15 | 초기화 이모지 | 🔄 (`&#x1F504;`) | ❓ |
| AI16 | Q1 전략1 조건부 표시 | `canQ1S1` | ❓ |
| AI17 | Q1 실행 중 스타일 | background `#fecaca` (red-200), border `#ef4444` (red-500) | ❓ |
| AI18 | Q1 비실행 스타일 | background `#fef3c7` (amber-100), border `#fbbf24` (amber-400) | ❓ |
| AI19 | Q1 실행 중 텍스트 | `'Q1 전략1 중지'` | ❓ |
| AI20 | Q1 진행 표시 | `(${q1Pos}/${Q1_COLS.length})` — 비실행 중 & q1Pos !== null | ❓ |
| AI21 | 진행 저장 이모지 | 📥 (`&#x1F4E5;`) | ❓ |
| AI22 | 결과 내보내기 이모지 | 💾 (`&#x1F4BE;`) | ❓ |
| AI23 | 내보내기 완료 시 색상 | background/border `#059669` (emerald-600), 흰색 텍스트 | ❓ |
| AI24 | 내보내기 미완료 색상 | background/border `#3b82f6` (blue-500), 흰색 텍스트 | ❓ |
| AI25 | 버튼 순서 | 열기 → 텍스트 → 예제들 → 되돌리기 → 초기화 → Q1전략 → 저장 → 내보내기 | ❓ |

---

### AJ. 텍스트 붙여넣기 영역 (L636-643)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AJ1 | 표시 조건 | `showPaste` 토글 | ❓ |
| AJ2 | textarea rows | `6` | ❓ |
| AJ3 | textarea placeholder | `'예:\n20\n5\n4\n1\n6\n7\n...'` | ❓ |
| AJ4 | textarea fontFamily | `monospace` | ❓ |
| AJ5 | textarea fontSize | `13`px | ❓ |
| AJ6 | textarea resize | `vertical` | ❓ |
| AJ7 | 적용 버튼 동작 | parseInput(paste) 후 showPaste=false | ❓ |
| AJ8 | 하단 여백 | `marginBottom: 12` | ❓ |

---

### AK. 통계 바 (L646-656)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AK1 | 표시 조건 | `pieceSeq.length > 0` | ❓ |
| AK2 | 레이아웃 | flex, gap 16, flexWrap | ❓ |
| AK3 | fontSize | `14`px | ❓ |
| AK4 | 피스 카운터 | 🧩 `{curIdx}/{totalPieces}` | ❓ |
| AK5 | 줄 카운터 | 📏 `{linesCleared}줄 클리어` | ❓ |
| AK6 | 게임 오버 표시 | ❌ 빨간색 `#dc2626`, fontWeight 600 | ❓ |
| AK7 | 완료 표시 | ✅ 녹색 `#059669`, fontWeight 600 | ❓ |
| AK8 | 진행 중 표시 | ⏳ 회색 `#64748b` | ❓ |
| AK9 | 하단 여백 | `marginBottom: 8` | ❓ |

---

### AL. 완료 배너 (L659-663)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AL1 | 표시 조건 | `isComplete` | ❓ |
| AL2 | 배경색 | `#d1fae5` (emerald-100) | ❓ |
| AL3 | border | `1px solid #6ee7b7` (emerald-300) | ❓ |
| AL4 | 텍스트 | 🎉 `모든 조각 배치 완료! "결과 내보내기"로 저장하세요.` | ❓ |
| AL5 | fontSize | `14`px | ❓ |
| AL6 | 하단 여백 | `marginBottom: 10` | ❓ |

---

### AM. 메인 게임 영역 레이아웃 (L666-751)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AM1 | 활성 레이아웃 | flex, gap 24, flexWrap, alignItems flex-start | ❓ |
| AM2 | 캔버스 cursor | 게임 오버/완료 시 default, 아니면 pointer | ❓ |
| AM3 | 캔버스 display | `'block'` | ❓ |
| AM4 | 캔버스 borderRadius | `8`px | ❓ |
| AM5 | 사이드패널 flex | `flex: 1` | ❓ |
| AM6 | 사이드패널 minWidth | `200`px | ❓ |
| AM7 | 사이드패널 카드 gap | `12`px | ❓ |
| AM8 | 카드 공통 스타일 | padding 12, bg #f8fafc, borderRadius 8, border 1px #e2e8f0 | ❓ |
| AM9 | 빈 상태 표시 | 퍼즐 이모지 52px + 안내 문구, 점선 테두리 2px dashed | ❓ |
| AM10 | 빈 상태 색상 | 텍스트 #94a3b8, 배경 #f8fafc, 테두리 #e2e8f0 | ❓ |
| AM11 | 빈 상태 padding | `'60px 20px'` | ❓ |

---

### AN. 현재 조각 패널 (L680-688)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AN1 | 표시 조건 | `currentPiece && !gameOver` | ❓ |
| AN2 | 제목 | `현재 조각 (#{curIdx+1})` — 1-indexed | ❓ |
| AN3 | PieceDisplay size | `24`px | ❓ |
| AN4 | 피스 번호 크기 | `fontSize: 24, fontWeight: 700` | ❓ |
| AN5 | 피스 번호 색상 | `PIECE_BORDERS[currentPiece]` — 테두리 색 사용 | ❓ |
| AN6 | 레이아웃 | flex, alignItems center, gap 12 | ❓ |

---

### AO. 열 선택 버튼 패널 (L691-713)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AO1 | 표시 조건 | `currentPiece && !gameOver` | ❓ |
| AO2 | 항상 9개 버튼 | 모든 열(1-9) 표시, 유효하지 않으면 비활성 | ❓ |
| AO3 | 버튼 크기 | `36×36`px | ❓ |
| AO4 | 3단계 색상 구분 | 비유효(회색) / 착지 가능(파랑) / 착지 불가(빨강) | ❓ |
| AO5 | 비유효 색상 | bg #f1f5f9, color #cbd5e1, border #e2e8f0 | ❓ |
| AO6 | 착지 가능 색상 | bg #dbeafe (blue-100), color #1e40af (blue-800), border #93c5fd (blue-300) | ❓ |
| AO7 | 착지 불가 색상 | bg #fee2e2 (red-100), color #991b1b (red-800), border #fca5a5 (red-300) | ❓ |
| AO8 | cursor | 유효면 pointer, 아니면 not-allowed | ❓ |
| AO9 | 착지 가능성 판정 | `findLandingRow(grid, currentPiece, c) >= 0` 매 렌더 호출 | ❓ |
| AO10 | 버튼 레이아웃 | flex, gap 4, flexWrap | ❓ |

---

### AP. 다음 조각 패널 (L716-728)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AP1 | 표시 조건 | `nextPieces.length > 0` | ❓ |
| AP2 | 최대 표시 수 | 5개 | ❓ |
| AP3 | PieceDisplay size | `14`px | ❓ |
| AP4 | 피스 번호 표시 | 각 피스 아래 `fontSize: 11, color: #64748b` | ❓ |
| AP5 | 레이아웃 | flex, gap 8, flexWrap | ❓ |
| AP6 | key | `index` (배열 인덱스) | ⚠️ |

---

### AQ. 선택 기록 패널 (L731-744)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AQ1 | 표시 조건 | `colChoices.length > 0` | ❓ |
| AQ2 | 제목 | `선택 기록` | ❓ |
| AQ3 | 스크롤 | `maxHeight: 120, overflowY: auto` | ❓ |
| AQ4 | fontFamily | `monospace` | ❓ |
| AQ5 | fontSize | `12`px | ❓ |
| AQ6 | 인덱스 접두사 | `#{i+1}:` — color #94a3b8, fontSize 10 | ❓ |
| AQ7 | 열 번호 색상 | `PIECE_BORDERS[pieceSeq[i]]` — 해당 피스의 테두리 색 | ❓ |
| AQ8 | 구분자 | 공백 (`' '`) | ❓ |
| AQ9 | wordBreak | `break-all` | ❓ |
| AQ10 | lineHeight | `1.6` | ❓ |

---

### AR. 조각 참조 차트 (L755-765)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AR1 | 위치 | 항상 표시 (게임 영역 아래) | ❓ |
| AR2 | 제목 | `조각 참조` | ❓ |
| AR3 | 상단 여백 | `marginTop: 16` | ❓ |
| AR4 | 9개 피스 모두 표시 | 1-9 순서 | ❓ |
| AR5 | PieceDisplay size | `16`px | ❓ |
| AR6 | 피스 번호 표시 | 위에 표시, fontSize 12, fontWeight 700, PIECE_BORDERS 색 | ❓ |
| AR7 | 현재 피스 하이라이트 | `highlight={currentPiece === t}` | ❓ |
| AR8 | 레이아웃 | flex, gap 16, flexWrap, alignItems flex-end | ❓ |

---

### AS. 푸터 네비게이션 (L768-770)

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AS1 | 위치 | 페이지 최하단 | ❓ |
| AS2 | 상단 여백 | `marginTop: 20` | ❓ |
| AS3 | fontSize | `14`px | ❓ |
| AS4 | 링크 텍스트 | `← 인덱스` | ❓ |
| AS5 | 링크 대상 | `"../"` (상위 디렉토리) | ❓ |
| AS6 | 링크 색상 | `#6366f1` (indigo-500) | ❓ |

---

### AT. 전체 아키텍처 결정

| # | 결정 사항 | 현재 값 | 상태 |
|---|----------|---------|------|
| AT1 | 렌더링 기술 | Canvas (그리드) + React DOM (UI) 혼합 | ❓ |
| AT2 | 스타일링 방식 | 전부 인라인 스타일 객체 | ❓ |
| AT3 | 상태 구조 | 플랫 (중첩 객체 없이 16개 독립 useState) | ❓ |
| AT4 | 순수 함수 분리 | 게임 로직은 컴포넌트 밖 순수 함수 | ❓ |
| AT5 | 컴포넌트 수 | 2개 (PieceDisplay + TinyGame) | ❓ |
| AT6 | 전역 상태 없음 | Context/Redux 없이 단일 컴포넌트 내 useState | ❓ |
| AT7 | 에러 바운더리 없음 | React Error Boundary 미사용 | ❓ |
| AT8 | 접근성 (a11y) | ARIA 속성 미사용, 키보드 지원만 | ⚠️ |
| AT9 | 국제화 | 하드코딩된 한국어 문자열 | ❓ |
| AT10 | 모바일 대응 | flexWrap으로 반응형, 터치 이벤트 미지원 | ⚠️ |
| AT11 | 성능 최적화 | useCallback 사용, useMemo 미사용, React.memo 미사용 | ❓ |
| AT12 | 테스트 없음 | 단위/통합 테스트 미작성 | ❓ |
| AT13 | 에러 처리 전략 | alert (파싱) + gameOver (게임 로직) + 빈 catch (JSON 파싱) | ❓ |

---

## 총계

| 차수 | 섹션 | 항목 수 |
|------|------|---------|
| 1차 | A~H | 82 |
| 2차 | I~R | 68 |
| 3차 | S~AA | 74 |
| 4차 | AB~AF | 53 |
| 5차 | AG~AT | 100 |
| **합계** | | **377** |

⚠️ 표시 항목 (잠재적 문제): C13, F7, P6, P10, S4, X9, Y7, Z3, AA21, AC6, AC31, AD10, AE10, AF6, AI10, AP6, AT8, AT10
