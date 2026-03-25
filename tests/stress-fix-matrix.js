import { bootstrapApp } from "../src/app/controller.js";
import { domSubtreeToVNode } from "../src/core/dom-to-vdom.js";
import { createElementVNode, createTextVNode } from "../src/core/vdom-node.js";
import { vNodeToHtml } from "../src/core/vdom-to-html.js";
import { diffVNodes } from "../src/diff/diff.js";
import { PATCH_TYPES } from "../src/diff/change-types.js";
import { applyPatches } from "../src/diff/patch-dom.js";
import { createHistoryManager } from "../src/state/history-manager.js";
import { readTestMarkup, writeMarkup } from "../src/ui/editor-surface.js";

const resultsNode = document.querySelector("#results");
const lines = [];
const categoryCounts = new Map();
const failures = [];
let passed = 0;
let failed = 0;

function log(line = "") {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function incrementCategory(category, ok) {
  if (!categoryCounts.has(category)) {
    categoryCounts.set(category, { passed: 0, failed: 0 });
  }

  const stats = categoryCounts.get(category);

  if (ok) {
    stats.passed += 1;
  } else {
    stats.failed += 1;
  }
}

function record(category, name, ok, detail = "") {
  incrementCategory(category, ok);

  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    failures.push({ category, name, detail });
  }
}

function test(category, name, callback) {
  try {
    const result = callback() ?? {};
    const ok = Boolean(result.ok);
    record(category, name, ok, result.detail ?? "");
  } catch (error) {
    record(category, name, false, error.message);
  }
}

function resetAppHost() {
  document.querySelector("#app")?.remove();
  const host = document.createElement("div");
  host.id = "app";
  document.body.appendChild(host);
  return host;
}

function createPlayground() {
  const host = resetAppHost();
  bootstrapApp();
  return {
    host,
    actualSurface: host.querySelector('[data-surface="actual"]'),
    testSurface: host.querySelector('[data-surface="test"]'),
    patchButton: host.querySelector('[data-action="patch"]'),
    historyStatus: host.querySelector('[data-status="history"]'),
  };
}

function clickPatch(ui, markup) {
  ui.testSurface.value = markup;
  ui.patchButton.click();
}

function normalizeHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return wrapper.innerHTML.trim();
}

function makeWrapper(innerHtml) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = innerHtml;
  return wrapper;
}

function makeAppRoot(innerHtml) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = innerHtml;
  return wrapper;
}

function sanitizeExpectation(html) {
  const wrapper = document.createElement("div");
  writeMarkup(wrapper, html);
  return wrapper.innerHTML;
}

function canonicalMarkup(html) {
  const vnode = domSubtreeToVNode(makeAppRoot(html));
  return (vnode.children ?? []).map((child) => vNodeToHtml(child)).join("");
}

function sectionMarkup(tag, text, attrs = "") {
  return `<${tag}${attrs}>${text}</${tag}>`;
}

const rootTags = ["section", "article", "div", "aside", "ul", "ol"];
const multiRootVariants = [
  "<section>A</section><section>B</section>",
  "<article><p>A</p></article><aside>B</aside>",
  "<div><span>A</span></div><div><span>B</span></div>",
  "<ul><li>A</li></ul><p>B</p>",
  "<header>A</header><main>B</main>",
  '<figure><img src="/x.png"></figure><figcaption>B</figcaption>',
];
const deletionCases = [
  {
    name: "remove sole child",
    previous: createElementVNode("div", {}, [createElementVNode("section", {}, [])]),
    next: createElementVNode("div", {}, []),
    expectedType: PATCH_TYPES.REMOVE_CHILD,
  },
  {
    name: "remove first of two",
    previous: createElementVNode("div", {}, [
      createElementVNode("section", {}, []),
      createElementVNode("article", {}, []),
    ]),
    next: createElementVNode("div", {}, [createElementVNode("article", {}, [])]),
    expectedType: PATCH_TYPES.REPLACE_NODE,
  },
  {
    name: "remove trailing of two",
    previous: createElementVNode("div", {}, [
      createElementVNode("section", {}, []),
      createElementVNode("article", {}, []),
    ]),
    next: createElementVNode("div", {}, [createElementVNode("section", {}, [])]),
    expectedType: PATCH_TYPES.REMOVE_CHILD,
  },
  {
    name: "remove nested text",
    previous: createElementVNode("div", {}, [
      createElementVNode("section", {}, [createTextVNode("A")]),
    ]),
    next: createElementVNode("div", {}, [createElementVNode("section", {}, [])]),
    expectedType: PATCH_TYPES.REMOVE_CHILD,
  },
  {
    name: "remove nested element",
    previous: createElementVNode("div", {}, [
      createElementVNode("section", {}, [createElementVNode("strong", {}, [])]),
    ]),
    next: createElementVNode("div", {}, [createElementVNode("section", {}, [])]),
    expectedType: PATCH_TYPES.REMOVE_CHILD,
  },
  {
    name: "remove text root",
    previous: createTextVNode("alpha"),
    next: null,
    expectedType: PATCH_TYPES.REMOVE_NODE,
  },
  {
    name: "remove element root",
    previous: createElementVNode("div", {}, [createTextVNode("alpha")]),
    next: null,
    expectedType: PATCH_TYPES.REMOVE_NODE,
  },
];
const dangerousMarkup = [
  '<img src="x" onerror="alert(1)">',
  '<button onclick="alert(1)">run</button>',
  '<a href="javascript:alert(1)">bad</a>',
  '<svg><a xlink:href="javascript:alert(1)">bad</a></svg>',
  '<script>alert(1)</script><p>safe</p>',
  '<form><button formaction="javascript:alert(1)">go</button></form>',
];
const whitespaceVariants = [
  "<section><span>item</span></section>",
  "<section>\n<span>item</span>\n</section>",
  "<section>\n  <span>item</span>\n</section>",
  "<section>\n\t<span>item</span>\n</section>",
];

rootTags.forEach((tag, index) => {
  test("Root Patch Integration", `single-root update ${index + 1}: ${tag}`, () => {
    const ui = createPlayground();
    const markup = sectionMarkup(tag, `text-${index}`);

    clickPatch(ui, markup);

    return {
      ok:
        ui.actualSurface.innerHTML === normalizeHtml(markup) &&
        ui.testSurface.value === normalizeHtml(markup) &&
        ui.actualSurface.firstElementChild?.getAttribute("data-surface") !== "actual",
      detail: `actual=${ui.actualSurface.innerHTML} | test=${ui.testSurface.value}`,
    };
  });
});

rootTags.forEach((fromTag, fromIndex) => {
  rootTags.forEach((toTag, toIndex) => {
    test("Root Patch Integration", `root tag transition ${fromTag}->${toTag}`, () => {
      const ui = createPlayground();
      const start = sectionMarkup(fromTag, `from-${fromIndex}`);
      const next = sectionMarkup(toTag, `to-${toIndex}`);

      clickPatch(ui, start);
      clickPatch(ui, next);

      return {
        ok: ui.actualSurface.innerHTML === normalizeHtml(next),
        detail: `actual=${ui.actualSurface.innerHTML} | expected=${normalizeHtml(next)}`,
      };
    });
  });
});

multiRootVariants.forEach((markup, index) => {
  test("Root Patch Integration", `multi-root markup ${index + 1}`, () => {
    const ui = createPlayground();
    clickPatch(ui, markup);

    return {
      ok:
        ui.actualSurface.innerHTML === normalizeHtml(markup) &&
        ui.testSurface.value === normalizeHtml(markup),
      detail: `actual=${ui.actualSurface.innerHTML}`,
    };
  });
});

[
  "",
  "   ",
  "\n",
  "<section></section>",
  "<section> </section>",
  "<section><span></span></section>",
].forEach((markup, index) => {
  test("Clear And Empty Input", `clear variant ${index + 1}`, () => {
    const ui = createPlayground();
    clickPatch(ui, "<section>seed</section>");
    clickPatch(ui, markup);
    const expected = canonicalMarkup(markup);

    return {
      ok:
        ui.actualSurface.innerHTML === expected &&
        ui.testSurface.value === expected,
      detail: `actual=${JSON.stringify(ui.actualSurface.innerHTML)} expected=${JSON.stringify(expected)}`,
    };
  });
});

deletionCases.forEach((testCase, index) => {
  test("Diff Deletion", `${index + 1}: ${testCase.name}`, () => {
    const patches = diffVNodes(testCase.previous, testCase.next);

    return {
      ok: patches.some((patch) => patch.type === testCase.expectedType),
      detail: JSON.stringify(patches),
    };
  });
});

[
  createElementVNode("section", {}, [createTextVNode("next")]),
  createElementVNode("article", { "data-id": "1" }, []),
  createTextVNode("text"),
  createElementVNode("div", {}, [createElementVNode("span", {}, []), createTextVNode("tail")]),
].forEach((node, index) => {
  test("Root Replace", `detached root replace ${index + 1}`, () => {
    const root = document.createElement("div");
    const nextRoot = applyPatches(root, [
      { type: PATCH_TYPES.REPLACE_NODE, path: [], payload: { node } },
    ]);

    const expectedTag = node.type === "text" ? undefined : node.tagName;

    return {
      ok:
        (node.type === "text" && nextRoot?.nodeType === 3 && nextRoot.textContent === node.textContent) ||
        (node.type === "element" && nextRoot?.tagName?.toLowerCase() === expectedTag),
      detail: `returned=${nextRoot?.outerHTML ?? nextRoot?.textContent ?? "null"}`,
    };
  });
});

[
  { html: '<input type="checkbox">', mutate: (el) => { el.checked = true; }, expect: (v) => v.attributes.checked === "checked" },
  { html: '<input type="checkbox" checked>', mutate: (el) => { el.checked = false; }, expect: (v) => !("checked" in v.attributes) },
  { html: '<input type="text" value="a">', mutate: (el) => { el.value = "typed"; }, expect: (v) => v.attributes.value === "typed" },
  { html: '<textarea>seed</textarea>', mutate: (el) => { el.value = "typed"; }, expect: (v) => v.attributes.value === "typed" },
  { html: '<select><option>one</option><option>two</option></select>', mutate: (el) => { el.value = "two"; }, expect: (v) => v.attributes.value === "two" },
  { html: '<select multiple><option selected>one</option><option>two</option></select>', mutate: (el) => { el.options[0].selected = false; el.options[1].selected = true; }, expect: (v) => v.children[0].attributes.selected === undefined && v.children[1].attributes.selected === "selected" },
  { html: '<option>one</option>', mutate: (el) => { el.selected = true; }, expect: (v) => v.attributes.selected === "selected" },
].forEach((fixture, index) => {
  test("Dynamic Form State", `capture live state ${index + 1}`, () => {
    const wrapper = makeWrapper(fixture.html);
    const element = wrapper.firstElementChild;
    fixture.mutate(element);
    const vnode = domSubtreeToVNode(element);

    return {
      ok: fixture.expect(vnode),
      detail: JSON.stringify(vnode),
    };
  });
});

[
  { nodeName: "input", patch: { name: "value", value: "typed" }, setup: (el) => { el.type = "text"; }, assert: (el) => el.value === "typed" },
  { nodeName: "input", patch: { name: "checked", value: "checked" }, setup: (el) => { el.type = "checkbox"; }, assert: (el) => el.checked === true },
  { nodeName: "input", patch: { name: "checked", value: null }, setup: (el) => { el.type = "checkbox"; el.checked = true; }, assert: (el) => el.checked === false, remove: true },
  { nodeName: "option", patch: { name: "selected", value: "selected" }, setup: () => {}, assert: (el) => el.selected === true },
  { nodeName: "textarea", patch: { name: "value", value: "typed" }, setup: () => {}, assert: (el) => el.value === "typed" },
].forEach((fixture, index) => {
  test("Dynamic Form State", `apply property patch ${index + 1}`, () => {
    const element = document.createElement(fixture.nodeName);
    fixture.setup(element);

    const patch = {
      type: fixture.remove ? PATCH_TYPES.REMOVE_ATTRIBUTE : PATCH_TYPES.SET_ATTRIBUTE,
      path: [],
      payload: fixture.patch,
    };

    applyPatches(element, [patch]);

    return {
      ok: fixture.assert(element),
      detail: element.outerHTML,
    };
  });
});

whitespaceVariants.forEach((left, leftIndex) => {
  whitespaceVariants.forEach((right, rightIndex) => {
    test("Whitespace Normalization", `diff whitespace variant ${leftIndex + 1}-${rightIndex + 1}`, () => {
      const patches = diffVNodes(domSubtreeToVNode(makeAppRoot(left)), domSubtreeToVNode(makeAppRoot(right)));
      return {
        ok: patches.length === 0,
        detail: JSON.stringify(patches),
      };
    });
  });
});

whitespaceVariants.forEach((markup, index) => {
  test("Whitespace Normalization", `history normalization ${index + 1}`, () => {
    const history = createHistoryManager(10);
    history.push(domSubtreeToVNode(makeAppRoot(whitespaceVariants[0])));
    history.push(domSubtreeToVNode(makeAppRoot(markup)));

    const currentHtml = vNodeToHtml(history.current());

    return {
      ok: currentHtml.includes("<span>item</span>"),
      detail: `size=${history.size()} html=${currentHtml}`,
    };
  });
});

dangerousMarkup.forEach((markup, index) => {
  test("Sanitization", `sanitize dangerous markup ${index + 1}`, () => {
    const sanitized = sanitizeExpectation(markup);
    return {
      ok:
        !sanitized.includes("onerror=") &&
        !sanitized.includes("onclick=") &&
        !sanitized.includes("javascript:") &&
        !sanitized.includes("<script>"),
      detail: sanitized,
    };
  });
});

dangerousMarkup.forEach((markup, index) => {
  test("Sanitization", `round-trip dangerous markup ${index + 1}`, () => {
    const wrapper = document.createElement("div");
    writeMarkup(wrapper, markup);
    const html = vNodeToHtml(domSubtreeToVNode(wrapper));
    return {
      ok:
        !html.includes("onerror=") &&
        !html.includes("onclick=") &&
        !html.includes("javascript:") &&
        !html.includes("<script>"),
      detail: html,
    };
  });
});

[
  "<section>&lt;encoded&gt;</section>",
  "<section> leading</section>",
  "<section>trailing </section>",
  '<section data-test="1">attrs</section>',
  "<section><strong>bold</strong><em>em</em></section>",
  '<input type="text" value="hello">',
  "<textarea>hello</textarea>",
].forEach((markup, index) => {
  test("Textarea Input Semantics", `raw markup preservation ${index + 1}`, () => {
    const ui = createPlayground();
    ui.testSurface.value = markup;

    return {
      ok: readTestMarkup(ui.testSurface) === markup.trim(),
      detail: readTestMarkup(ui.testSurface),
    };
  });
});

[
  '<select><option>one</option><option selected>two</option></select>',
  '<input type="checkbox" checked>',
  '<textarea>typed</textarea>',
  '<section data-x="1">A</section><section data-y="2">B</section>',
  '<section><span>A</span><span>B</span><span>C</span></section>',
  '<section><span>A</span></section>',
  '<article><h2>Title</h2><p>Body</p></article>',
].forEach((markup, index) => {
  test("Controller Regression", `patch round-trip ${index + 1}`, () => {
    const ui = createPlayground();
    clickPatch(ui, markup);
    clickPatch(ui, markup);

    return {
      ok:
        ui.actualSurface.innerHTML === normalizeHtml(markup) &&
        ui.testSurface.value === normalizeHtml(markup),
      detail: `actual=${ui.actualSurface.innerHTML} history=${ui.historyStatus.textContent}`,
    };
  });
});

[
  '<section>seed</section>',
  '<article><p>A</p></article>',
  '<div><span>A</span><span>B</span></div>',
  '<section data-k="1">A</section>',
  '<ul><li>A</li><li>B</li></ul>',
  '',
  '<section><strong>A</strong></section>',
].forEach((markup, index) => {
  test("Controller Undo/Redo", `undo-redo cycle ${index + 1}`, () => {
    const ui = createPlayground();
    const undoButton = ui.host.querySelector('[data-action="undo"]');
    const redoButton = ui.host.querySelector('[data-action="redo"]');

    clickPatch(ui, markup);
    const afterPatch = ui.actualSurface.innerHTML;
    undoButton.click();
    const afterUndo = ui.actualSurface.innerHTML;
    redoButton.click();
    const afterRedo = ui.actualSurface.innerHTML;

    return {
      ok: afterRedo === afterPatch && afterUndo !== undefined,
      detail: `patch=${afterPatch} undo=${afterUndo} redo=${afterRedo}`,
    };
  });
});

const total = passed + failed;

log(`Summary: ${passed} passed, ${failed} failed, ${total} total`);
log("");
log("Category Summary:");

for (const [category, stats] of categoryCounts.entries()) {
  log(`- ${category}: ${stats.passed} passed, ${stats.failed} failed`);
}

if (failures.length > 0) {
  log("");
  log("Failures:");
  failures.slice(0, 20).forEach((failure, index) => {
    log(`${index + 1}. [${failure.category}] ${failure.name}`);
    log(`   ${failure.detail}`);
  });
}



