/**
 * Owner: Role 3 - Playground UI
 * Editable only by the Role 3 branch.
 */

export const SAMPLE_MARKUP = `
<section class="sample-card" data-sample="playground-card">
  <header class="sample-card__header">
    <p class="sample-card__eyebrow">Virtual DOM Demo</p>
    <h2>Playground Sample Markup</h2>
  </header>

  <p>
    이 블록은 <strong>테스트 영역</strong>에서 자유롭게 수정할 수 있습니다.
    Patch 버튼을 누르면 Diff 결과가 실제 영역에 반영됩니다.
  </p>

  <ul class="sample-card__topics">
    <li data-topic="vdom">Virtual DOM 구조 확인</li>
    <li data-topic="diff">Diff 결과 비교</li>
    <li data-topic="patch">Patch 반영 흐름 관찰</li>
  </ul>

  <div class="sample-card__note" title="editable-demo">
    속성 변경, 텍스트 변경, 자식 추가/삭제를 직접 실험해 보세요.
  </div>
</section>
`.trim();
