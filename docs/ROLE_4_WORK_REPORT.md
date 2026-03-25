# Role 4 작업 보고서

## 수정한 파일
- `src/state/history-manager.js`
- `src/app/controller.js`
- `src/app/view-sync.js`

## 구현한 작업
- `createHistoryManager(limit = 20)`를 구현했다.
  - 상태 스냅샷을 clone해서 저장하도록 처리했다.
  - Undo / Redo 이동을 구현했다.
  - Undo 이후 새 `push()`가 들어오면 기존 Redo 히스토리를 잘라내도록 구현했다.
  - 히스토리 개수가 limit를 넘기면 가장 오래된 상태부터 제거하도록 구현했다.
- `syncBothSurfaces(uiRefs, currentVNode, vNodeToHtml)`를 구현했다.
  - 현재 VNode를 HTML 문자열로 직렬화한다.
  - 실제 영역과 테스트 영역에 동일한 마크업을 쓰도록 연결했다.
- `bootstrapApp()`를 구현했다.
  - 앱 루트를 찾는다.
  - 앱 셸을 마운트한다.
  - UI 참조를 수집한다.
  - `SAMPLE_MARKUP`을 실제 영역에 먼저 렌더링한다.
  - 실제 영역 기준 초기 VNode를 만든다.
  - 초기 상태를 history에 저장한다.
  - 실제 영역과 테스트 영역을 동기화한다.
  - Patch / Undo / Redo 버튼 이벤트를 연결한다.
  - 초기화 이후와 상태 변경 이후 navigation 상태를 갱신한다.

## 현재 의존성 / 막힌 점
Role 4 구현이 실제 브라우저에서 끝까지 동작하려면 아래 export들이 다른 역할에서 계약대로 구현되어 있어야 한다.
- `createAppShell`
- `getUiRefs`
- `readTestMarkup`
- `writeMarkup`
- `setNavigationState`
- `domSubtreeToVNode`
- `vNodeToHtml`
- `diffVNodes`
- `applyPatches`

위 항목들이 아직 `TODO` 상태면, Role 4 연결 코드가 있어도 전체 브라우저 흐름은 끝까지 검증할 수 없다.

## 검증 상태
- 구현 과정에서 실제 수정은 Role 4 파일만 수행했다.
- 현재 환경에서는 신뢰 가능한 자동 실행 검증을 끝까지 완료하지 못했다.
- 이유는 아래와 같다.
  - 이 셸 환경에는 `node`가 설치되어 있지 않다.
  - 저장소 스냅샷 기준으로 다른 역할의 핵심 export 일부가 아직 구현되지 않았다.

## 비고
- 이 문서는 작업 내용 정리 요청에 따라 `docs` 아래에 추가했다.
