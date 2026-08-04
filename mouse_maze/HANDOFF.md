# HANDOFF.md - Mouse Maze 프로젝트 인수인계

Claude.ai 대화에서 개발하던 것을 Claude Code로 옮기는 시점의 문서.
다음 에이전트는 이 문서와 `game-ui-taste.md`를 먼저 읽을 것.

## 프로젝트가 뭔가

죽은 Flash 게임 두 개(Mouse Maze 1, 2)의 브라우저 포팅 + 기록 검증 서버.
사용자는 두 게임의 세계기록 보유자이며, 점수 등록처가 사라져 직접 만드는 중.

게임 규칙: 격자 미로를 편집하면 결정론적 쥐가 걷는다. 쥐는 매 걸음
"도달 가능한 이웃 중 방문 횟수가 가장 낮은 칸"으로 가고, 동률이면
아래 > 오른쪽 > 왼쪽 > 위 우선순위. 점수는 총 걸음 수(입구 진입이 1st move,
출구 퇴장이 마지막 move; moves = turns). Maze 1은 13x13에 벽이 타일을
통째로 차지, Maze 2는 9x9에 벽이 타일 사이 경계선에 놓임.

## 프로젝트의 단 하나의 핵심 설계

**클라이언트는 점수가 아니라 미로를 제출하고, 서버가 자기 시뮬레이터로
재계산한 숫자만 저장한다.** 점수 위조가 원천 불가능하고, 모든 기록이
미로 파일에서 재현 가능하다.

이를 위해 `sim.js` 하나가 규칙의 유일한 원본이며, 브라우저와 Node 서버가
문자 그대로 같은 파일을 로드한다. **규칙 로직을 다른 곳에 복제하지 말 것.**

## 파일 목록

### 제품
| 파일 | 역할 |
|---|---|
| `sim.js` | 규칙 엔진. 시뮬레이터, BFS 검증, 미로 직렬화(encode/decode). 브라우저와 Node 공용. **규칙의 유일한 원본** |
| `index.html` | 게임 전체 (UI + 인라인 스크립트). `<script src="sim.js">`로 로드 |
| `server/server.js` | 점수 서버. 제출 접수, 재시뮬레이션, 순위. 게임 페이지도 같이 서빙 |
| `server/db.js` | SQLite 스키마와 질의 (node:sqlite, 의존성 0) |
| `server/verify-all.js` | 저장된 모든 기록을 미로에서 재계산해 대조하는 CLI |
| `server/README.md` | 서버 사용법, curl 예시, 스키마 설계 이유 |

### 테스트 (전부 통과 상태로 인계)
| 파일 | 검증 대상 |
|---|---|
| `tests/test-sim.js` | 앵커(빈판 14/10, 원작 스크린샷 443턴 + 히트맵 169칸), 무작위 2400판 파이썬 대조, 직렬화 왕복 |
| `tests/ref_cases.json`, `tests/gen_ref.py` | 위 대조용 레퍼런스 케이스와 생성기 (파이썬 구현이 ground truth) |
| `tests/test-hit.js` | Maze 2 모서리 클릭 판정을 전 픽셀 스윕 |
| `tests/test-ui.js` | index.html에서 실제 함수/CSS를 추출해 검증. 히트맵 색, 속도 사다리, 잠금 불변조건, 선언 안 된 상수 린트 등 |
| `tests/test-page.js` | 스텁 DOM으로 페이지 전체를 헤드리스 실행. "느림 버튼 자동 선택" 버그의 회귀 테스트 포함 |
| `server/test-server.js` | 실제 HTTP로 서버 검증. 점수 무시, 닉네임 토큰, 쿨다운 잠금 공격, 동점 순위, 미로 비노출 |

### 문서
- `game-ui-taste.md`: 사용자의 UI 취향 명세. **모든 UI 작업 전 필독.**
  수정 지시가 나올 때마다 이 문서에 한 줄씩 추가하는 습관을 들일 것.
  위치는 이 레포 밖: `/Users/violet/Documents/GitHub/Life-with-Claude-Code/claude-config/docs/game-ui-taste.md`

## 실행 방법

Node 22+ 필요. npm 설치 없음 (node:http, node:sqlite만 사용).

모든 커맨드는 `mouse_maze/`에서 실행한다.

```
node server/server.js        # http://localhost:8787 이 게임
node server/verify-all.js    # 전체 기록 재검증
```

테스트 일괄 실행:
```
node tests/test-sim.js && node tests/test-hit.js && node tests/test-ui.js && node tests/test-page.js && node server/test-server.js
```

이 폴더가 GitHub Pages 배포본이다. `index.html`+`sim.js`를 커밋하면 그대로
정적 배포된다. 단 Submit은 서버가 필요하며, 프론트와 API가 다른 origin이면
index.html 상단 `API_OVERRIDE`에 API 주소를 넣는다.

## 현재 상태

완료: 두 게임 포팅(원작과 스텝 단위 일치 검증됨), 편집기(벽/입출구/undo/
reset/save/load), 애니메이션(입구 밖에서 출구 밖까지 보간), 히트맵(로그
스케일, 초록→노랑→연보라→검정), 업적 12종 x 2게임, 속도 6단(2/4/7.5/20/
60/200, 해금제), 쉐어 해금, 미로 코드 직렬화, 제출 UI, 로컬 점수 서버
(닉네임+토큰, 동점은 제출시각 순, 페이지네이션, 레이트 리밋, 재검증 CLI).

## 서버 구축 진행 체크리스트

아래 "다음 작업"의 1~2번을 진행 단위로 쪼갠 것. 자세한 맥락은 그쪽을 볼 것.

### 사용자가 하는 일
- [x] Node 22+ 설치, 로컬 서버 실행, 브라우저에서 제출
- [x] `verify-all.js`로 전체 기록 재검증
- [x] `sqlite3`로 scores.db 열어보기, 지우기, 재생성 확인
- [x] curl로 엔드포인트 5종 호출 (health, submit, rank, me, board)
- [x] API/스키마에 대한 피드백 정리
- [ ] 배포처 결정 (https 필수, Cloudflare Workers 무료 등급 제외)

### 에이전트가 하는 일
- [x] 레포 구조 정리 (resource 해체, server/와 tests/ 배치, 문서 갱신)
- [ ] 배포처 결정 후 서버 이전 지원 (실행 환경 구성, 배포 절차 문서화)
- [ ] `API_OVERRIDE`에 API 주소 기입 후 Pages에서 제출 확인
- [ ] 리버스 프록시 뒤라면 레이트 리밋의 IP 판별을 X-Forwarded-For 기준으로 수정
- [ ] 배포 후 원격 서버에서 `verify-all.js` 실행 경로 확인

## 다음 작업 (사용자와 논의된 순서)

### 1. 로컬에서 서버 익히기 (사용자가 "배워가면서 하겠다"고 함)
- `node server/server.js` 켜고 localhost:8787에서 제출 몇 번
- `server/scores.db`를 열어보고, 지우고, `verify-all.js` 돌려보기
- `server/README.md`의 curl 예시 따라해보기
- 여기서 API/스키마에 대한 사용자 피드백이 나올 것

### 2. 배포처 결정 후 서버 이전
- 사용자는 호스팅 지식이 없어 배워가며 결정할 예정. 아직 미정
- 프론트는 GitHub Pages(eyTns.github.io) 예정. tuntu라는 선례 있음
- 프론트/API가 다른 origin이면 index.html 상단 `API_OVERRIDE`에 API 주소
- **주의**: Cloudflare Workers 무료 등급(CPU 10ms)은 부적합 판정 완료.
  기록급 미로 채점이 7ms라 여유가 없고 cap 도달 미로는 8.3초.
  측정치: 시뮬레이터 처리량 초당 약 1200만 수
- **주의**: 남의 리더보드 SaaS 금지 (SilentWolf 등 서비스 종료 선례.
  이 프로젝트 자체가 점수 서버 사망에서 시작됨)
- 참고 오픈소스: AntGame.io (github.com/Cuzzo01/antgame.io).
  구조가 거의 동일하며 RunVerifier를 API에서 분리한 이유를 볼 것

### 3. 서버 고도화 (필요해지면)
- 채점을 워커/별도 프로세스로 분리 (cap 도달 미로가 8.3초 블로킹하는 문제)
- 오늘/이번주/이번달/역대 기간별 리더보드. created_at은 이미 저장 중이나
  score_counts 집계가 역대 전용이라 기간별 셈 전략이 따로 필요
- capped=1 기록 알림 (현재는 콘솔 로그만)

### 4. 계정 시스템 (2차 목표, 사용자 구상)
- 구글 로그인 등. 닉네임은 가입 시 설정, 변경 시 리더보드 자동 반영
  (scores가 nickname을 복사하지 않고 submitters.id를 참조하는 이유),
  중복 닉네임 불가, 유저별 완주 미로 목록, 유저별 업적 서버 저장
- `submitters.user_id`가 NULL로 준비되어 있음. 로그인 붙이면 채우기
- 현재 닉네임 소유권은 로컬 저장 토큰. 기기 바꾸면 잃는 한계가 있고
  계정이 그걸 대체
- 업적/진행은 현재 localStorage. kordle식 전적 코드 내보내기/불러오기를
  중간 단계로 제안했었음 (미구현)

### 5. 미구현 잡무
- 원작의 음악 버튼
- Web Worker 편집 중 턴 계산 (현재 메인 스레드. 실제 미로에선 1ms라
  문제없으나 극단적 미로에서 탭이 잠깐 멈출 수 있음)
- UI 언어는 영어 (한국어 전환은 지시가 있을 때만)

## 함정과 교훈 (겪은 것들)

- **미로 직렬화 포맷 변경 금지에 가깝게 신중할 것.** MM{1,2}-{cIn 2자리}-
  {cOut 2자리}-{hex}(-{hex}). 열 번호를 한 자리로 붙였다가 모호성 버그가
  났었음. 저장 미로와 서버 기록이 이 포맷에 묶여 있음
- **점수 규약: 빈 13x13(입출구 같은 열)이 14.** 하나라도 어긋나면
  fencepost 버그. test-sim.js의 앵커들이 지킴
- **사다리(속도/커트라인)를 바꿀 때 초기 spd와 저장 대체값이 자동으로
  따라오는지 확인.** BASE_SPEED가 사다리에서 파생되도록 해뒀지만, 이걸
  우회하는 수정을 하면 "느림 버튼이 자동으로 눌리는" 버그가 재발함.
  loadProgress의 정규화와 test-page.js가 방어 중
- **블록 단위 텍스트 치환으로 코드 수정할 때 사이에 낀 선언을 지우기
  쉬움.** API_BASE 선언을 통째로 날린 사고가 있었음. test-ui.js에
  선언 안 된 대문자 상수 린트가 들어있는 이유
- **사용자의 버그 보고를 오조작으로 추정하지 말 것.** 코드에서 원인을
  찾고, 못 찾으면 "재현 실패"까지만. (실제로 사용자가 맞았음: 사다리
  교체 때 초기값 미갱신이 원인이었음)
- 대화는 한국어, 코드/주석/UI는 영어. em/en dash 금지, "박다" 금지,
  게임 구분은 "1탄/2탄" (단 UI 문자열에는 Maze 1/Maze 2)
- 세계기록 미로 파일을 요구하지 말 것 (명시적 금지). 테스트는 작은
  픽스처와 무작위 대조로 충분함이 증명됨

## 검증 이력 (신뢰 근거)

- 파이썬 레퍼런스가 원작과 일치: 원작 스크린샷의 443턴 미로에서 턴수,
  최다 방문(6), 169칸 히트맵 전부 재현
- JS(sim.js)가 파이썬과 일치: 무작위 2400판에서 턴수/유효성/직렬화 왕복
  불일치 0
- 서버가 sim.js를 그대로 사용: 클라이언트가 turns:99999999를 보내도
  서버는 443을 저장 (test-server.js에 고정)
