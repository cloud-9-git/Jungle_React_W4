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
const failures = [];
const categoryStats = new Map();
let passed = 0;
let failed = 0;

function log(line = "") {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function ensureCategory(category) {
  if (!categoryStats.has(category)) {
    categoryStats.set(category, { passed: 0, failed: 0 });
  }

  return categoryStats.get(category);
}

function test(category, name, callback) {
  try {
    const result = callback() ?? {};
    const ok = Boolean(result.ok);
    const stats = ensureCategory(category);

    if (ok) {
      passed += 1;
      stats.passed += 1;
      return;
    }

    failed += 1;
    stats.failed += 1;
    failures.push({ category, name, detail: result.detail ?? "" });
  } catch (error) {
    const stats = ensureCategory(category);
    failed += 1;
    stats.failed += 1;
    failures.push({ category, name, detail: error.message });
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
    undoButton: host.querySelector('[data-action="undo"]'),
    redoButton: host.querySelector('[data-action="redo"]'),
    historyStatus: host.querySelector('[data-status="history"]'),
  };
}

function clickPatch(ui, markup) {
  ui.testSurface.value = markup;
  ui.patchButton.click();
}

function wrapperFromMarkup(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return wrapper;
}

function normalizeHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return wrapper.innerHTML.trim();
}

function canonicalMarkup(html) {
  const vnode = domSubtreeToVNode(wrapperFromMarkup(html));
  return (vnode.children ?? []).map((child) => vNodeToHtml(child)).join("");
}

function renderSanitized(html) {
  const wrapper = document.createElement("div");
  writeMarkup(wrapper, html);
  return wrapper.innerHTML;
}

const rootTags = ["section", "article", "div", "aside", "nav", "main", "header", "footer", "ul", "ol"];
const inlineTags = ["span", "strong", "em", "b", "i"];
const dangerousAttrs = [
  'onerror="alert(1)"',
  'onclick="alert(1)"',
  'href="javascript:alert(1)"',
  'src="javascript:alert(1)"',
  'formaction="javascript:alert(1)"',
];

for (let index = 0; index < 50; index += 1) {
  test("1. Root Semantics", `root transition ${index + 1}`, () => {
    const ui = createPlayground();
    const fromTag = rootTags[index % rootTags.length];
    const toTag = rootTags[(index + 3) % rootTags.length];
    const payload = `<${toTag} data-case="${index}"><${inlineTags[index % inlineTags.length]}>case-${index}</${inlineTags[index % inlineTags.length]}></${toTag}>`;

    clickPatch(ui, `<${fromTag}>start-${index}</${fromTag}>`);
    clickPatch(ui, payload);

    return {
      ok:
        ui.actualSurface.innerHTML === normalizeHtml(payload) &&
        ui.testSurface.value === normalizeHtml(payload) &&
        ui.actualSurface.firstElementChild?.getAttribute("data-surface") !== "actual",
      detail: `actual=${ui.actualSurface.innerHTML} test=${ui.testSurface.value}`,
    };
  });
}

for (let index = 0; index < 50; index += 1) {
  test("2. Missing Deletion Patch", `deletion diff ${index + 1}`, () => {
    const mode = index % 5;
    let previous;
    let next;
    let expectedType;

    if (mode === 0) {
      previous = createElementVNode("div", {}, [createElementVNode("section", {}, [])]);
      next = createElementVNode("div", {}, []);
      expectedType = PATCH_TYPES.REMOVE_CHILD;
    } else if (mode === 1) {
      previous = createElementVNode("div", {}, [createElementVNode("section", {}, [createTextVNode(`x-${index}`)])]);
      next = createElementVNode("div", {}, [createElementVNode("section", {}, [])]);
      expectedType = PATCH_TYPES.REMOVE_CHILD;
    } else if (mode === 2) {
      previous = createTextVNode(`text-${index}`);
      next = null;
      expectedType = PATCH_TYPES.REMOVE_NODE;
    } else if (mode === 3) {
      previous = createElementVNode("article", { "data-case": String(index) }, [createTextVNode("gone")]);
      next = null;
      expectedType = PATCH_TYPES.REMOVE_NODE;
    } else {
      previous = createElementVNode("div", {}, [
        createElementVNode("section", {}, []),
        createElementVNode("article", {}, []),
      ]);
      next = createElementVNode("div", {}, [createElementVNode("section", {}, [])]);
      expectedType = PATCH_TYPES.REMOVE_CHILD;
    }

    const patches = diffVNodes(previous, next);

    return {
      ok: patches.some((patch) => patch.type === expectedType),
      detail: JSON.stringify(patches),
    };
  });
}

for (let index = 0; index < 50; index += 1) {
  test("3. Root Replace Apply", `root replace ${index + 1}`, () => {
    const detached = index % 2 === 0;
    const root = document.createElement("div");

    if (!detached) {
      const host = document.createElement("div");
      host.appendChild(root);
      document.body.appendChild(host);
    }

    const nextNode = index % 3 === 0
      ? createTextVNode(`text-${index}`)
      : createElementVNode(rootTags[index % rootTags.length], { "data-case": String(index) }, [createTextVNode(`node-${index}`)]);

    const replaced = applyPatches(root, [
      { type: PATCH_TYPES.REPLACE_NODE, path: [], payload: { node: nextNode } },
    ]);

    const ok = nextNode.type === "text"
      ? replaced?.nodeType === 3 && replaced.textContent === nextNode.textContent
      : replaced?.tagName?.toLowerCase() === nextNode.tagName;

    document.querySelector("#app")?.remove();
    document.body.querySelectorAll("div").forEach((node) => {
      if (node !== resultsNode && node.id !== "app" && node !== resultsNode.parentNode && !node.closest("pre")) {
        if (node.children.length === 0 && !node.textContent) {
          node.remove();
        }
      }
    });

    return {
      ok,
      detail: replaced?.outerHTML ?? replaced?.textContent ?? "null",
    };
  });
}

for (let index = 0; index < 50; index += 1) {
  test("4. Editable Input Semantics", `textarea semantics ${index + 1}`, () => {
    const ui = createPlayground();
    const tag = rootTags[index % rootTags.length];
    const markup = index % 5 === 0
      ? `<${tag}></${tag}>`
      : index % 5 === 1
        ? `<${tag}> line ${index} </${tag}>`
        : index % 5 === 2
          ? `<${tag}><${inlineTags[index % inlineTags.length]}>nested-${index}</${inlineTags[index % inlineTags.length]}></${tag}>`
          : index % 5 === 3
            ? `<${tag} data-k="${index}">&lt;encoded-${index}&gt;</${tag}>`
            : `<${tag}></${tag}><${tag}>tail-${index}</${tag}>`;

    ui.testSurface.value = markup;
    const readBack = readTestMarkup(ui.testSurface);
    clickPatch(ui, markup);

    return {
      ok: readBack === markup.trim() && ui.actualSurface.innerHTML === canonicalMarkup(markup),
      detail: `read=${readBack} actual=${ui.actualSurface.innerHTML}`,
    };
  });
}

for (let index = 0; index < 50; index += 1) {
  test("5. Dynamic Property vs Attribute", `dynamic form state ${index + 1}`, () => {
    const mode = index % 5;

    if (mode === 0) {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      const vnode = domSubtreeToVNode(input);
      return { ok: vnode.attributes.checked === "checked", detail: JSON.stringify(vnode.attributes) };
    }

    if (mode === 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("value", "seed");
      input.value = `typed-${index}`;
      const vnode = domSubtreeToVNode(input);
      return { ok: vnode.attributes.value === `typed-${index}`, detail: JSON.stringify(vnode.attributes) };
    }

    if (mode === 2) {
      const textarea = document.createElement("textarea");
      textarea.value = `typed-${index}`;
      const vnode = domSubtreeToVNode(textarea);
      return { ok: vnode.attributes.value === `typed-${index}`, detail: JSON.stringify(vnode.attributes) };
    }

    if (mode === 3) {
      const select = document.createElement("select");
      select.innerHTML = "<option>one</option><option>two</option>";
      select.value = "two";
      const vnode = domSubtreeToVNode(select);
      return { ok: vnode.attributes.value === "two", detail: JSON.stringify(vnode.attributes) };
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    applyPatches(input, [{ type: PATCH_TYPES.SET_ATTRIBUTE, path: [], payload: { name: "checked", value: "checked" } }]);
    applyPatches(input, [{ type: PATCH_TYPES.REMOVE_ATTRIBUTE, path: [], payload: { name: "checked" } }]);
    return { ok: input.checked === false, detail: input.outerHTML };
  });
}

for (let index = 0; index < 50; index += 1) {
  test("6. Whitespace History", `whitespace normalization ${index + 1}`, () => {
    const compact = `<${rootTags[index % rootTags.length]}><span>item-${index}</span></${rootTags[index % rootTags.length]}>`;
    const spaced = `<${rootTags[index % rootTags.length]}>\n  <span>item-${index}</span>\n</${rootTags[index % rootTags.length]}>`;
    const left = index % 2 === 0 ? compact : spaced;
    const right = index % 2 === 0 ? spaced : compact;

    const patches = diffVNodes(domSubtreeToVNode(wrapperFromMarkup(left)), domSubtreeToVNode(wrapperFromMarkup(right)));
    const history = createHistoryManager(5);
    history.push(domSubtreeToVNode(wrapperFromMarkup(left)));
    history.push(domSubtreeToVNode(wrapperFromMarkup(right)));
    const section = domSubtreeToVNode(wrapperFromMarkup(spaced)).children[0];

    return {
      ok: patches.length === 0 && section.children.length === 1 && history.size() === 2,
      detail: `patches=${JSON.stringify(patches)} children=${section.children.length} size=${history.size()}`,
    };
  });
}

for (let index = 0; index < 50; index += 1) {
  test("7. XSS Surface", `sanitize dangerous markup ${index + 1}`, () => {
    const attr = dangerousAttrs[index % dangerousAttrs.length];
    const tag = index % 4 === 0 ? "img" : index % 4 === 1 ? "button" : index % 4 === 2 ? "a" : "form";
    const markup = tag === "img"
      ? `<img ${attr}>`
      : tag === "button"
        ? `<button ${attr}>run-${index}</button>`
        : tag === "a"
          ? `<a ${attr}>go-${index}</a>`
          : `<form><button ${attr}>submit-${index}</button></form>`;

    const sanitized = renderSanitized(markup);
    const roundTrip = vNodeToHtml(domSubtreeToVNode(wrapperFromMarkup(sanitized || "<div></div>")));

    return {
      ok:
        !sanitized.includes("onclick=") &&
        !sanitized.includes("onerror=") &&
        !sanitized.includes("javascript:") &&
        !roundTrip.includes("onclick=") &&
        !roundTrip.includes("onerror=") &&
        !roundTrip.includes("javascript:"),
      detail: `sanitized=${sanitized} roundTrip=${roundTrip}`,
    };
  });
}

const total = passed + failed;
log(`Summary: ${passed} passed, ${failed} failed, ${total} total`);
log("");
log("Category Summary:");
for (const [category, stats] of categoryStats.entries()) {
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
