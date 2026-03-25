/**
 * Owner: Role 3 - Playground UI
 * Editable only by the Role 3 branch.
 */

export function createAppShell() {
  return `
    <main class="playground-shell" aria-label="Virtual DOM Diff Playground">
      <header class="playground-hero">
        <p class="playground-kicker">Role 3 · Playground UI</p>
        <h1>Virtual DOM Diff Playground</h1>
        <p class="playground-description">
          테스트 영역에서 마크업을 수정한 뒤 Patch를 눌러 실제 영역에 변경분만 반영하는 흐름을 검증합니다.
        </p>
      </header>

      <section class="playground-controls" aria-label="Playground controls">
        <div class="playground-actions">
          <button type="button" class="action-button action-button--primary" data-action="patch">Patch</button>
          <button type="button" class="action-button" data-action="undo">뒤로가기</button>
          <button type="button" class="action-button" data-action="redo">앞으로가기</button>
        </div>
        <output class="history-status" data-status="history" aria-live="polite">1 / 1</output>
      </section>

      <section class="surface-grid" aria-label="Playground surfaces">
        <article class="surface-card surface-card--actual">
          <div class="surface-card__header">
            <p class="surface-card__eyebrow">Actual Surface</p>
            <h2>실제 영역</h2>
          </div>
          <div class="surface-card__body" data-surface="actual"></div>
        </article>

        <article class="surface-card surface-card--test">
          <div class="surface-card__header">
            <p class="surface-card__eyebrow">Test Surface</p>
            <h2>테스트 영역</h2>
            <p class="surface-card__hint">자유롭게 내용을 수정하고 Patch 흐름을 확인하세요.</p>
          </div>
          <div
            class="surface-card__body surface-card__body--editable"
            data-surface="test"
            contenteditable="true"
            spellcheck="false"
          ></div>
        </article>
      </section>
    </main>
  `.trim();
}
