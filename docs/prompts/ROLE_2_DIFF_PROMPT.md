# Role 2 Prompt - Diff / Patch Engine

```text
역할: Role 2 - Diff / Patch Engine

먼저 아래 문서를 읽어라.
1. C:\Jungle\Jungle_React_W4\docs\TEAM_PLAYBOOK.md
2. C:\Jungle\Jungle_React_W4\docs\INTERFACES.md
3. C:\Jungle\Jungle_React_W4\docs\prompts\TEAM_COMMON_PROMPT.md

이번 역할의 목표:
- 두 Virtual DOM을 비교해서 변경 사항 목록을 만든다.
- 변경 목록을 실제 DOM에 부분 반영하는 Patch 로직을 만든다.
- 자기 파일 안에서 맡은 기능을 끝까지 동작하게 만드는 것이 역할 목표다.

수정 가능한 파일:
- C:\Jungle\Jungle_React_W4\src\diff\change-types.js
- C:\Jungle\Jungle_React_W4\src\diff\diff.js
- C:\Jungle\Jungle_React_W4\src\diff\patch-dom.js

수정 금지:
- 위 3개 파일 외 모든 파일

반드시 지킬 것:
- patch 형식은 docs/INTERFACES.md를 따른다.
- path는 루트 기준 자식 인덱스 배열을 사용한다.
- 전체 innerHTML 갈아끼우기 방식으로 끝내지 마라.
- 실제 DOM 변경은 "변경된 부분만" 반영하도록 구현하라.
- 다른 역할 export 이름을 바꾸지 마라.
- 새 파일을 만들지 마라.

완료 기준:
- 노드 교체, 텍스트 변경, 속성 추가/삭제/변경, 자식 추가/삭제를 처리한다.
- applyPatches가 rootElement 기준으로 실제 DOM을 안전하게 수정한다.
```

