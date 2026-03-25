# Role 3 Worklog

## Goal
- Playground UI 범위를 맡아 실제 영역, 테스트 영역, 컨트롤 버튼, 샘플 마크업, 스타일과 UI helper를 구현했다.

## Files
- `src/ui/layout-template.js`
- `src/ui/editor-surface.js`
- `src/ui/sample-markup.js`
- `src/styles/ui.css`

## Codex Decisions
- UI 셸은 Role 4가 바로 붙일 수 있게 필수 data attribute를 중심으로 단순한 구조로 고정했다.
- 테스트 영역은 `contenteditable="true"`로 두고, 마크업 읽기/쓰기 helper는 `innerHTML` 기반으로 맞췄다.
- history 상태 표시는 `현재 인덱스 + 1 / 전체 개수` 형식으로 통일했다.
- 샘플 마크업은 텍스트, 속성, 리스트, 안내 블록을 포함해 Diff/Patch 시연이 쉬운 형태로 잡았다.

## Verification Points
- `createAppShell()`이 필수 버튼 3개와 두 surface, history 상태 영역을 모두 포함하는지 확인
- `getUiRefs()`가 계약된 참조를 모두 찾는지 확인
- `readTestMarkup()`과 `writeMarkup()`이 편집 영역 HTML을 읽고 다시 쓰는지 확인
- `setNavigationState()`가 undo/redo 비활성화와 history 문구를 갱신하는지 확인

## Integration Assumptions
- Role 4는 `createAppShell()` 반환값을 앱 루트에 주입한 뒤 `getUiRefs()`를 호출한다.
- Role 4는 실제 영역과 테스트 영역에 HTML을 쓰기 위해 `writeMarkup()`을 재사용할 수 있다.
- Role 4는 history 상태를 갱신할 때 `setNavigationState(refs, { canUndo, canRedo, index, size })` 형식으로 호출한다.
