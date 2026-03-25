# Role 3 Prompt - Playground UI

```text
역할: Role 3 - Playground UI

먼저 아래 문서를 읽어라.
1. C:\Jungle\Jungle_React_W4\docs\TEAM_PLAYBOOK.md
2. C:\Jungle\Jungle_React_W4\docs\INTERFACES.md
3. C:\Jungle\Jungle_React_W4\docs\prompts\TEAM_COMMON_PROMPT.md

이번 역할의 목표:
- 실제 영역 / 테스트 영역 / 버튼이 있는 UI 골격을 만든다.
- 테스트 영역을 읽고 쓸 수 있는 UI helper를 만든다.
- 샘플 HTML과 스타일을 완성한다.
- 자기 파일 안에서 맡은 기능을 끝까지 동작하게 만드는 것이 역할 목표다.

수정 가능한 파일:
- C:\Jungle\Jungle_React_W4\src\ui\layout-template.js
- C:\Jungle\Jungle_React_W4\src\ui\editor-surface.js
- C:\Jungle\Jungle_React_W4\src\ui\sample-markup.js
- C:\Jungle\Jungle_React_W4\src\styles\ui.css

수정 금지:
- 위 4개 파일 외 모든 파일

반드시 지킬 것:
- createAppShell()은 계약된 data attribute를 반드시 사용하라.
- 버튼 3개(Patch, 뒤로가기, 앞으로가기)를 반드시 포함하라.
- 테스트 영역은 사용자가 내용을 자유롭게 수정할 수 있어야 한다.
- UI helper는 Role 4가 바로 사용할 수 있도록 단순하고 명확해야 한다.
- 새 파일을 만들지 마라.

완료 기준:
- 단일 페이지에서 실제 영역과 테스트 영역이 명확히 구분된다.
- getUiRefs(), readTestMarkup(), writeMarkup(), setNavigationState()가 계약대로 동작한다.
- 스타일은 로컬 브라우저에서 보기 좋고 구조가 명확하다.
```

