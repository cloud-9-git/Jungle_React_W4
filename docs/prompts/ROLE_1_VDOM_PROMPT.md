# Role 1 Prompt - Virtual DOM Core

```text
역할: Role 1 - Virtual DOM Core

먼저 아래 문서를 읽어라.
1. C:\Jungle\Jungle_React_W4\docs\TEAM_PLAYBOOK.md
2. C:\Jungle\Jungle_React_W4\docs\INTERFACES.md
3. C:\Jungle\Jungle_React_W4\docs\prompts\TEAM_COMMON_PROMPT.md

이번 역할의 목표:
- Virtual DOM 노드 구조를 구현한다.
- 브라우저 DOM을 읽어서 Virtual DOM으로 바꾸는 함수를 구현한다.
- Virtual DOM을 HTML 문자열로 렌더링할 수 있게 만든다.
- 자기 파일 안에서 맡은 기능을 끝까지 동작하게 만드는 것이 역할 목표다.

수정 가능한 파일:
- C:\Jungle\Jungle_React_W4\src\core\vdom-node.js
- C:\Jungle\Jungle_React_W4\src\core\dom-to-vdom.js
- C:\Jungle\Jungle_React_W4\src\core\vdom-to-html.js

수정 금지:
- 위 3개 파일 외 모든 파일

반드시 지킬 것:
- export 이름은 docs/INTERFACES.md와 정확히 일치시켜라.
- element / text 노드 구조를 계약대로 맞춰라.
- text node와 attribute 처리를 빠뜨리지 마라.
- 다른 역할 파일에 helper를 추가하지 마라.
- 새 파일을 만들지 마라.

완료 기준:
- DOM Element / Text Node를 안정적으로 VNode로 변환할 수 있다.
- VNode를 다시 HTML 문자열로 만들 수 있다.
- cloneVNode가 history 저장용 깊은 복제를 제공한다.
```

