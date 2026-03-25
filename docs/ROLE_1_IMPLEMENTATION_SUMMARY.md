# 역할 1 구현 정리

## 개요

이 문서는 Virtual DOM / Diff Playground 프로젝트에서 역할 1인 `Virtual DOM Core` 구현 내용을 정리한 문서다.
정리 범위는 현재 실제로 반영된 역할 1 코드에 한정하며, 공통 문서나 다른 역할 파일의 상태는 포함하지 않는다.

## 구현 내용

### 1. VNode 생성 및 복제

`src/core/vdom-node.js`에서 아래 기능을 구현했다.

- `createElementVNode(tagName, attributes = {}, children = [])`
  - `type`을 `"element"`로 고정한다.
  - `tagName`을 소문자 문자열로 정규화한다.
  - `attributes`의 키와 값을 모두 문자열로 정규화한다.
  - `children`에서 `null`, `undefined`를 제거한다.
  - `textContent`는 `null`로 유지한다.
- `createTextVNode(textContent = "")`
  - `type`을 `"text"`로 고정한다.
  - `tagName`은 `null`, `attributes`는 빈 객체, `children`은 빈 배열로 유지한다.
  - `textContent`를 문자열로 정규화한다.
- `cloneVNode(node)`
  - text node와 element node를 구분해서 깊은 복제를 수행한다.
  - history 저장에 사용할 수 있도록 자식 노드까지 재귀적으로 복제한다.

### 2. DOM을 VNode로 변환

`src/core/dom-to-vdom.js`에서 아래 기능을 구현했다.

- `domNodeToVNode(node)`
  - DOM Text Node는 `createTextVNode`로 변환한다.
  - DOM Element Node는 속성과 자식 노드를 읽어 `createElementVNode`로 변환한다.
  - Element/Text 외의 노드는 `null`을 반환해 변환 대상에서 제외한다.
  - 입력 노드가 없으면 명확한 에러를 던진다.
- `domSubtreeToVNode(rootElement)`
  - 루트 노드 하나를 기준으로 변환을 시작한다.
  - 변환 결과가 없으면 잘못된 입력으로 보고 에러를 던진다.

### 3. VNode를 HTML 문자열로 직렬화

`src/core/vdom-to-html.js`에서 아래 기능을 구현했다.

- `vNodeToHtml(node)`
  - text node는 HTML escape를 적용해 문자열로 변환한다.
  - element node는 속성을 직렬화한 뒤 자식 HTML을 재귀적으로 이어 붙인다.
  - `img`, `br`, `input` 같은 void element는 닫는 태그 없이 출력한다.
  - `null` 입력은 빈 문자열로 처리한다.

## 핵심 설계 포인트

- `tagName` 소문자 정규화
  - DOM의 대문자 태그명 입력이 들어와도 계약 문서의 소문자 규칙을 유지하도록 처리했다.
- `attributes` 문자열 정규화
  - Virtual DOM 데이터 모델의 계약에 맞춰 모든 속성 값을 문자열로 통일했다.
- text node / element node 구조 분리
  - 두 노드 타입이 서로 다른 필드 규칙을 유지하도록 생성 함수와 복제 함수를 분리했다.
- 비지원 DOM 노드 무시
  - Comment 같은 비지원 노드는 Virtual DOM 변환 대상에서 제외했다.
- HTML / attribute escape
  - text 내용과 속성 값 모두 escape 처리해서 직렬화 문자열이 깨지지 않도록 했다.
- void element 직렬화 처리
  - void element는 불필요한 닫는 태그 없이 출력되도록 별도 처리했다.

## 검증 내용

mock DOM 객체를 이용해 아래 항목을 검증했다.

- DOM subtree가 기대한 VNode 구조로 변환되는지 확인
- `cloneVNode`가 원본과 분리된 깊은 복제를 제공하는지 확인
- `vNodeToHtml`가 escape와 void element 처리를 포함해 올바른 HTML 문자열을 만드는지 확인
- 생성 함수가 `tagName`, `attributes`, `textContent`를 계약대로 정규화하는지 확인

검증 결과는 아래와 같다.

```text
core-vdom ok
```

## 제한 사항

이 문서는 역할 1 구현만 정리한다.
브라우저 전체 앱 흐름은 역할 2, 역할 3, 역할 4 구현이 추가로 완료되어야 최종적으로 연결된다.
