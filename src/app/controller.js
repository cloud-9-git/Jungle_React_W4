/**
 * Owner: Role 4 - History / App Controller
 * Editable only by the Role 4 branch.
 */

import { SELECTORS } from "../contracts.js";

export function bootstrapApp() {
  const appRoot = document.querySelector(SELECTORS.appRoot);

  if (!appRoot) {
    throw new Error("App root not found");
  }

  appRoot.innerHTML = `
    <main style="padding: 32px; font-family: 'Segoe UI', sans-serif;">
      <h1>Virtual DOM Diff Playground</h1>
      <p>팀 스캐폴드가 준비되었습니다. 각 역할은 자기 소유 파일만 구현하세요.</p>
    </main>
  `;
}

