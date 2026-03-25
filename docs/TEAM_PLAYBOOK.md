# Virtual DOM / Diff Playground Team Playbook

## 1. 프로젝트 목표

이 프로젝트는 **Vanilla JavaScript만 사용해서**

- 브라우저 DOM -> Virtual DOM 변환
- 두 Virtual DOM 비교(Diff)
- 변경분만 실제 DOM에 반영(Patch)
- History(Undo / Redo) 이동

을 구현하고, 이를 검증할 수 있는 **단일 웹 페이지**를 만드는 것이 목적이다.

이번 작업의 범위는 아래로 고정한다.

- 클라이언트 사이드만 구현
- 서버 개발 없음
- 배포 작업 없음
- 로컬 브라우저 실행만 보장
- 기술 스택: `HTML`, `CSS`, `JavaScript (Vanilla)`

## 2. 반드시 지켜야 하는 공통 원칙

1. 각자 **자기 소유 파일만 수정**한다.
2. 다른 사람 파일은 **읽을 수는 있지만 수정하면 안 된다.**
3. 공통 계약 파일과 문서는 **승인 없이 수정 금지**다.
4. 파일 이동, 파일명 변경, 폴더 구조 변경을 하지 않는다.
5. 새로운 파일을 추가하지 않는다.
6. 라이브러리, 프레임워크, 빌드 도구를 추가하지 않는다.
7. 구현 중 계약이 안 맞거나 인터페이스 충돌이 보이면, 자기 파일에서 우회 수정하지 말고 팀에 알린다.
8. "일단 내가 고쳐서 맞춘다" 식으로 남의 경계를 넘지 않는다.

이 원칙의 목적은 **기능을 완성하는 것**이고, 파일 경계 규칙은 머지 충돌을 줄이기 위한 안전장치다.

## 3. 작업 구조

아래 구조를 기준으로 작업한다.

```text
C:\Jungle\Jungle_React_W4
|-- index.html                         # 공통 고정 파일
|-- docs
|   |-- TEAM_PLAYBOOK.md               # 팀 전체 기준 문서
|   |-- INTERFACES.md                  # 공통 인터페이스 계약
|   `-- prompts
|       |-- TEAM_COMMON_PROMPT.md
|       |-- ROLE_1_VDOM_PROMPT.md
|       |-- ROLE_2_DIFF_PROMPT.md
|       |-- ROLE_3_UI_PROMPT.md
|       `-- ROLE_4_HISTORY_PROMPT.md
`-- src
    |-- main.js                        # 공통 고정 파일
    |-- contracts.js                   # 공통 고정 파일
    |-- core
    |   |-- vdom-node.js               # 역할 1 전용
    |   |-- dom-to-vdom.js             # 역할 1 전용
    |   `-- vdom-to-html.js            # 역할 1 전용
    |-- diff
    |   |-- change-types.js            # 역할 2 전용
    |   |-- diff.js                    # 역할 2 전용
    |   `-- patch-dom.js               # 역할 2 전용
    |-- ui
    |   |-- layout-template.js         # 역할 3 전용
    |   |-- editor-surface.js          # 역할 3 전용
    |   `-- sample-markup.js           # 역할 3 전용
    |-- styles
    |   `-- ui.css                     # 역할 3 전용
    |-- state
    |   `-- history-manager.js         # 역할 4 전용
    `-- app
        |-- controller.js              # 역할 4 전용
        `-- view-sync.js               # 역할 4 전용
```

## 4. 공통 고정 파일(수정 금지)

아래 파일은 이번 분업 단계에서 **수정 금지**다.

- `index.html`
- `src/main.js`
- `src/contracts.js`
- `docs/TEAM_PLAYBOOK.md`
- `docs/INTERFACES.md`
- `docs/prompts/TEAM_COMMON_PROMPT.md`
- `docs/prompts/ROLE_1_VDOM_PROMPT.md`
- `docs/prompts/ROLE_2_DIFF_PROMPT.md`
- `docs/prompts/ROLE_3_UI_PROMPT.md`
- `docs/prompts/ROLE_4_HISTORY_PROMPT.md`

이 파일들은 팀의 공통 기준선이다.

## 5. 역할 분담

### 역할 1. Virtual DOM Core

담당 범위

- Virtual DOM 노드 구조 정의
- 실제 DOM을 읽어서 Virtual DOM으로 변환
- Virtual DOM을 HTML 문자열로 직렬화

허용 파일

- `src/core/vdom-node.js`
- `src/core/dom-to-vdom.js`
- `src/core/vdom-to-html.js`

### 역할 2. Diff / Patch Engine

담당 범위

- 변경 타입 정의
- 이전 Virtual DOM / 다음 Virtual DOM 비교
- Diff 결과를 실제 DOM에 부분 반영

허용 파일

- `src/diff/change-types.js`
- `src/diff/diff.js`
- `src/diff/patch-dom.js`

### 역할 3. Playground UI

담당 범위

- 페이지 레이아웃
- 실제 영역 / 테스트 영역 / 버튼 UI
- 샘플 HTML 준비
- 테스트 영역 읽기/쓰기 보조 함수
- 전체 스타일링

허용 파일

- `src/ui/layout-template.js`
- `src/ui/editor-surface.js`
- `src/ui/sample-markup.js`
- `src/styles/ui.css`

### 역할 4. History / App Controller

담당 범위

- 앱 초기화
- Patch 버튼 동작 연결
- Undo / Redo 상태 이동
- 실제 영역 / 테스트 영역 동기화
- State History 관리

허용 파일

- `src/state/history-manager.js`
- `src/app/controller.js`
- `src/app/view-sync.js`

## 6. 균형 있게 나눈 이유

4명 모두 비슷한 수준의 작업량을 가지도록 아래처럼 분배했다.

- 역할 1: 자료구조 + 변환 로직
- 역할 2: 알고리즘 + 실제 DOM 반영
- 역할 3: UI 구조 + 편집 영역 + 스타일
- 역할 4: 상태 관리 + 이벤트 흐름 + 화면 동기화

누구도 배포/운영/서버만 담당하지 않는다.

## 7. 브랜치 전략

문서 기준선이 `main`에 반영된 뒤, 각자 아래 브랜치에서만 작업한다.

- 역할 1: `feature/vdom-core`
- 역할 2: `feature/diff-patch`
- 역할 3: `feature/ui-playground`
- 역할 4: `feature/history-controller`

브랜치 생성 기준

1. `main` 최신 기준에서 브랜치 생성
2. 자기 브랜치에서 자기 파일만 수정
3. PR 또는 머지 전에 자기 파일 외 변경이 없는지 확인

## 8. 기능 완성과 충돌 방지 규칙

아래 규칙은 기능 완성에 필요한 계약을 지키면서, 머지 충돌 가능성을 낮추기 위한 기준이다.

1. 공통 고정 파일은 건드리지 않는다.
2. 자기 소유 파일만 수정한다.
3. import 경로는 이미 정해진 파일만 사용한다.
4. 함수 시그니처는 `docs/INTERFACES.md`를 기준으로 맞춘다.
5. 새 파일 생성이나 구조 변경을 하지 않는다.
6. 자기 범위 안에서는 맡은 기능이 실제로 동작할 때까지 구현 책임을 진다.

## 9. 추천 머지 순서

기술적으로는 파일이 안 겹치므로 어느 정도 자유롭지만, 안정적으로는 아래 순서를 추천한다.
기능 검증이 끝난 브랜치만 머지한다.

1. 역할 1 머지
2. 역할 3 머지
3. 역할 2 머지
4. 역할 4 머지

이 순서가 좋은 이유

- 역할 1이 Virtual DOM 기반을 제공
- 역할 3이 UI 골격을 제공
- 역할 2가 알고리즘을 채움
- 역할 4가 전체 흐름을 마지막에 연결

## 10. 각 역할 공통 완료 조건

각자 아래를 만족해야 완료다.

1. 자기 파일 외 수정 없음
2. export 이름이 `docs/INTERFACES.md`와 일치
3. 하드코딩된 타 역할 내부 구현 의존 없음
4. 로컬 브라우저에서 기본 동작 확인 가능
5. 최종 통합 시 요구된 흐름이 실제로 연결되어야 한다
6. 주석은 최소화하되, 복잡한 부분은 짧게 설명

## 11. Codex 사용 규칙

각자 자기 Codex에게 아래 순서로 읽힌다.

1. `docs/TEAM_PLAYBOOK.md`
2. `docs/INTERFACES.md`
3. 자기 역할 프롬프트 파일

그리고 아래를 반드시 지시한다.

- "내가 허용한 파일만 수정해라"
- "공통 고정 파일은 수정하지 마라"
- "새 파일을 만들지 마라"
- "계약이 안 맞으면 멈추고 보고해라"

