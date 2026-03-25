# Virtual DOM / Diff Playground Interface Contract

## 1. 공통 데이터 모델

모든 역할은 아래 Virtual DOM 구조를 기준으로 구현한다.

```js
{
  type: "element" | "text",
  tagName: string | null,
  attributes: { [key: string]: string },
  children: VNode[],
  textContent: string | null
}
```

규칙

- `element` 노드는 `tagName`이 반드시 소문자 문자열이다.
- `text` 노드는 `tagName`이 `null`이다.
- `text` 노드는 `children`가 빈 배열이다.
- `text` 노드는 `textContent`에 문자열을 가진다.
- `element` 노드는 `textContent`가 `null`이다.
- `attributes`는 문자열 키/값만 허용한다.

## 2. 역할 1 계약

파일

- `src/core/vdom-node.js`
- `src/core/dom-to-vdom.js`
- `src/core/vdom-to-html.js`

필수 export

```js
createElementVNode(tagName, attributes = {}, children = [])
createTextVNode(textContent = "")
cloneVNode(node)
domNodeToVNode(node)
domSubtreeToVNode(rootElement)
vNodeToHtml(node)
```

설명

- `createElementVNode`: element VNode 생성
- `createTextVNode`: text VNode 생성
- `cloneVNode`: history 저장용 깊은 복제
- `domNodeToVNode`: 단일 DOM 노드를 VNode로 변환
- `domSubtreeToVNode`: 루트 DOM 서브트리를 VNode로 변환
- `vNodeToHtml`: VNode를 HTML 문자열로 직렬화

## 3. 역할 2 계약

파일

- `src/diff/change-types.js`
- `src/diff/diff.js`
- `src/diff/patch-dom.js`

필수 export

```js
PATCH_TYPES
diffVNodes(previousNode, nextNode, path = [])
applyPatches(rootElement, patches)
```

`PATCH_TYPES` 예시 키

```js
{
  REPLACE_NODE: "REPLACE_NODE",
  UPDATE_TEXT: "UPDATE_TEXT",
  SET_ATTRIBUTE: "SET_ATTRIBUTE",
  REMOVE_ATTRIBUTE: "REMOVE_ATTRIBUTE",
  INSERT_CHILD: "INSERT_CHILD",
  REMOVE_CHILD: "REMOVE_CHILD"
}
```

Patch 객체 형식

```js
{
  type: string,
  path: number[],
  payload: object
}
```

`path` 규칙

- 루트에서 시작하는 자식 인덱스 배열이다.
- 예: `[1, 0]` 은 "루트의 두 번째 자식의 첫 번째 자식"이다.

## 4. 역할 3 계약

파일

- `src/ui/layout-template.js`
- `src/ui/editor-surface.js`
- `src/ui/sample-markup.js`
- `src/styles/ui.css`

필수 export

```js
createAppShell()
getUiRefs(rootElement)
readTestMarkup(testSurfaceElement)
writeMarkup(targetElement, html)
setNavigationState(refs, state)
SAMPLE_MARKUP
```

`createAppShell()`이 만들어야 하는 필수 DOM 요소

- 실제 영역
- 테스트 영역
- `Patch` 버튼
- `뒤로가기` 버튼
- `앞으로가기` 버튼

그리고 아래 data attribute를 반드시 사용한다.

```text
data-surface="actual"
data-surface="test"
data-action="patch"
data-action="undo"
data-action="redo"
data-status="history"
```

`getUiRefs(rootElement)`은 최소한 아래를 반환해야 한다.

```js
{
  actualSurface,
  testSurface,
  patchButton,
  undoButton,
  redoButton,
  historyStatus
}
```

## 5. 역할 4 계약

파일

- `src/state/history-manager.js`
- `src/app/controller.js`
- `src/app/view-sync.js`

필수 export

```js
createHistoryManager(limit = 20)
syncBothSurfaces(uiRefs, currentVNode, vNodeToHtml)
bootstrapApp()
```

`createHistoryManager(limit = 20)`이 제공해야 하는 메서드

```js
{
  push(vNode),
  undo(),
  redo(),
  current(),
  canUndo(),
  canRedo(),
  index(),
  size()
}
```

설명

- `push(vNode)`: 새 상태 추가
- `undo()`: 이전 상태 반환
- `redo()`: 다음 상태 반환
- `current()`: 현재 상태 반환
- `canUndo()`, `canRedo()`: 버튼 활성화 판단
- `index()`, `size()`: 상태 표시용

`syncBothSurfaces(uiRefs, currentVNode, vNodeToHtml)` 역할

- 현재 VNode를 기준으로
- 실제 영역과 테스트 영역을 같은 상태로 맞춘다.

`bootstrapApp()` 역할

- 앱 시작 시 초기 상태 구성
- 샘플 HTML -> 실제 DOM -> Virtual DOM 변환
- 테스트 영역 초기 렌더링
- Patch / Undo / Redo 이벤트 연결

## 6. 공통 고정 셀렉터

아래 셀렉터 이름은 `src/contracts.js`를 따른다.

```js
SELECTORS.appRoot
SELECTORS.actualSurface
SELECTORS.testSurface
SELECTORS.patchButton
SELECTORS.undoButton
SELECTORS.redoButton
SELECTORS.historyStatus
```

## 7. 절대 금지 사항

1. 다른 역할 export 이름 바꾸기
2. 다른 역할이 소비하는 함수 시그니처 바꾸기
3. data attribute 이름 바꾸기
4. 공통 고정 파일 수정
5. 새 파일 추가

계약이 부족하면 자기 파일을 멋대로 바꾸지 말고, 팀 합의 후 다음 작업 라운드에서 공통 문서를 갱신한다.

