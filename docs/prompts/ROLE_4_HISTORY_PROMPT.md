# Role 4 Prompt - History / App Controller

```text
역할: Role 4 - History / App Controller

먼저 아래 문서를 읽어라.
1. C:\Jungle\Jungle_React_W4\docs\TEAM_PLAYBOOK.md
2. C:\Jungle\Jungle_React_W4\docs\INTERFACES.md
3. C:\Jungle\Jungle_React_W4\docs\prompts\TEAM_COMMON_PROMPT.md

이번 역할의 목표:
- 앱 전체 시작 흐름을 연결한다.
- History 저장/이동을 구현한다.
- Patch / Undo / Redo 버튼 동작을 연결한다.
- 실제 영역과 테스트 영역을 항상 같은 상태로 동기화한다.
- 자기 파일 안에서 맡은 기능을 끝까지 동작하게 만드는 것이 역할 목표다.
- 이 역할은 최종 통합 동작 완성 책임을 가진다.

수정 가능한 파일:
- C:\Jungle\Jungle_React_W4\src\state\history-manager.js
- C:\Jungle\Jungle_React_W4\src\app\controller.js
- C:\Jungle\Jungle_React_W4\src\app\view-sync.js

수정 금지:
- 위 3개 파일 외 모든 파일

반드시 지킬 것:
- bootstrapApp()이 앱 시작점이 된다.
- 초기 로드시 샘플 HTML을 실제 영역에 넣고, 그 DOM을 Virtual DOM으로 변환해 초기 상태를 만든다.
- Patch 클릭 시 새 테스트 상태를 읽고 diff -> patch -> history push 순서로 처리하라.
- Undo / Redo 시 실제 영역과 테스트 영역을 함께 바꿔라.
- 다른 역할 파일을 수정해서 연결하지 마라.
- 새 파일을 만들지 마라.

완료 기준:
- createHistoryManager()가 undo/redo 흐름을 안정적으로 제공한다.
- bootstrapApp() 하나로 초기화와 이벤트 바인딩이 끝난다.
- syncBothSurfaces()로 두 영역이 항상 같은 상태를 유지한다.
```

