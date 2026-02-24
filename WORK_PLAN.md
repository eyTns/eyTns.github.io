# 작업계획: 앱별 폴더 구조 정리

## 목표
루트에 흩어진 HTML 앱들을 각각 독립 폴더로 이동하고, 루트 `index.html`을 앱 허브로 정비한다.

---

## 1. starjjikgi (별찍기)

**현재 파일:**
- `starjjikgi.html` → `css/style_star.css`, `js/starjjikgi.js` 참조

**작업:**
- [x]`starjjikgi/` 폴더 생성
- [x]`starjjikgi.html` → `starjjikgi/index.html` 이동
- [x]`css/style_star.css` → `starjjikgi/style.css` 이동
- [x]`js/starjjikgi.js` → `starjjikgi/starjjikgi.js` 이동
- [x]`starjjikgi/index.html` 내 경로 수정 (`css/style_star.css` → `style.css`, `js/starjjikgi.js` → `starjjikgi.js`)
- [x]내부 네비게이션 링크를 새 구조에 맞게 수정

---

## 2. tetris (테트리스)

**현재 파일:**
- `Tetris.html` → `css/style_tetris.css`, `js/tetris.js` 참조
- `js/tetris.js` → `js/blocks.js` 참조 (모듈 import)

**작업:**
- [x]`tetris/` 폴더 생성
- [x]`Tetris.html` → `tetris/index.html` 이동
- [x]`css/style_tetris.css` → `tetris/style.css` 이동
- [x]`js/tetris.js` → `tetris/tetris.js` 이동
- [x]`js/blocks.js` → `tetris/blocks.js` 이동
- [x]`tetris/index.html` 내 경로 수정 (`css/style_tetris.css` → `style.css`, `js/tetris.js` → `tetris.js`)
- [x]`tetris/tetris.js` 내 `blocks.js` import 경로 수정 (필요시)

---

## 3. mines (Mines Solver)

**현재 파일:**
- `mines_interactive.html` → `mines_interactive.jsx` 참조 (같은 디렉토리)
- 외부 CDN: React, ReactDOM, Babel (이동 불필요)

**작업:**
- [x]`mines/` 폴더 생성
- [x]`mines_interactive.html` → `mines/index.html` 이동
- [x]`mines_interactive.jsx` → `mines/mines.jsx` 이동
- [x]`mines/index.html` 내 경로 수정 (`./mines_interactive.jsx` → `./mines.jsx`)

---

## 4. sandbox (아무거나)

**현재 파일:**
- `sandbox.html` — 외부 의존 없음 (인라인 JS만 사용)

**작업:**
- [x]`sandbox/` 폴더 생성
- [x]`sandbox.html` → `sandbox/index.html` 이동
- [x]내부 네비게이션 링크를 새 구조에 맞게 수정

---

## 5. 루트 index.html 정비

**작업:**
- [x]링크를 새 폴더 경로로 업데이트 (`starjjikgi/`, `tetris/`, `mines/`, `sandbox/`)
- [x]앞으로 새 앱 추가 시 링크만 추가하면 되는 허브 형태로 정리

---

## 6. 정리

- [x]루트의 공용 `css/`, `js/` 폴더 삭제 (모든 파일 이동 완료 후)
- [x]루트의 이전 HTML 파일들 삭제 확인
- [x]모든 앱이 새 경로에서 정상 동작하는지 확인
