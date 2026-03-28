# 보물지도 앱 추가 작업 정리

## 1. JSX 파일 배치
- 사용자가 제공한 소스코드를 `treasure_map/treasure_map.jsx`에 생성

## 2. index 연결
- `treasure_map/index.html` 생성 (React 18 + Babel CDN, 단일 JSX 로드)
- 메인 `index.html`에 보물지도 링크 추가
- JSX의 `import`/`export`를 UMD 호환 방식으로 변경 (`const { useState } = React;`, `export default` 제거)
  - 아티팩트 환경과 독립 HTML 환경의 차이에서 발생

## 3. 모바일 대응
- `body` 기본 margin 제거 + 배경색 통일 (`index.html`에 style 추가)
- `box-sizing: border-box` 전역 적용 (`*, *::before, *::after`)
  - 아티팩트 환경에서는 기본 적용되어 있어서 코드에 빠져 있었음
  - Grid에 개별로 붙였다가 전역으로 변경

## 4. 그리드 수직 위치 고정
- 페이즈마다 하단 버튼 영역 높이가 달라서 그리드가 밀리는 문제
- 루트 `justifyContent`를 `flex-start`로 바꿨다가, 그리드 없는 화면까지 위로 붙는 문제 발생
- 루트는 `center` 유지, bot(하단 영역)의 `minHeight`를 `180px`로 통일하여 해결

## 5. README 업데이트
- 보물지도 항목 추가 (기존 패턴에 맞춤)
- trailing space는 Edit 도구로 안 되므로 sed 사용
- 빈 줄과 trailing space를 동시에 처리해야 했는데 분리해서 실수 발생
- 작성한 README 내용을 그대로 사용자에게 보여주어 사용자가 직접 수정할 수 있도록 한다

## 참고사항

### 아티팩트 코드를 독립 HTML로 옮길 때 확인할 것
- `import`/`export` → 전역 변수 방식으로 변환
- `box-sizing: border-box` 전역 설정
- `body { margin: 0; padding: 0; }` 리셋

### raw.githack.com으로 브랜치 미리보기
- URL 구조: `https://raw.githack.com/{user}/{repo}/{branch}/{path}`
- 작업을 마친 후 사용자에게 미리보기 링크를 제공한다
- 예시: [보물지도 미리보기](https://raw.githack.com/eyTns/eyTns.github.io/claude/add-treasure-map-app-LvbMz/treasure_map/index.html)
