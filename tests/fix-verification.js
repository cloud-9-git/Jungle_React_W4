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
let passed = 0;
let failed = 0;

function log(line = "") {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function check(name, fn) {
  try {
    const result = fn();
    if (result.ok) {
      passed += 1;
      log(`PASS | ${name}`);
    } else {
      failed += 1;
      log(`FAIL | ${name}`);
      log(`  ${result.detail}`);
    }
  } catch (error) {
    failed += 1;
    log(`ERROR | ${name}`);
    log(`  ${error.message}`);
  }
}

function cleanup(node) {
  node?.remove?.();
}

check("root semantics stay aligned after bootstrap", () => {
  const host = document.createElement("div");
  host.id = "app";
  document.body.appendChild(host);

  try {
    bootstrapApp();
    const actualSurface = host.querySelector('[data-surface="actual"]');
    const nestedSurface = actualSurface?.firstElementChild?.getAttribute("data-surface") === "actual";
    return {
      ok: !nestedSurface,
      detail: actualSurface?.innerHTML ?? "missing actual surface",
    };
  } finally {
    cleanup(host);
  }
});

check("empty test markup clears content through diff", () => {
  const previousVNode = createElementVNode("div", {}, [createElementVNode("section", {}, [])]);
  const nextVNode = createElementVNode("div", {}, []);
  const patches = diffVNodes(previousVNode, nextVNode);
  return {
    ok: patches.some((patch) => patch.type === PATCH_TYPES.REMOVE_CHILD),
    detail: JSON.stringify(patches),
  };
});

check("root replacement without a parent returns the replacement node", () => {
  const root = document.createElement("div");
  const nextRoot = applyPatches(root, [{
    type: PATCH_TYPES.REPLACE_NODE,
    path: [],
    payload: { node: createElementVNode("section", {}, [createTextVNode("ok")]) },
  }]);
  return {
    ok: nextRoot?.tagName?.toLowerCase() === "section",
    detail: nextRoot?.tagName ?? "null",
  };
});

check("test input uses raw text instead of contenteditable DOM rewriting", () => {
  const host = document.createElement("div");
  host.id = "app";
  document.body.appendChild(host);

  try {
    bootstrapApp();
    const testSurface = host.querySelector('[data-surface="test"]');
    testSurface.value = "<div>first</div><div>second</div>";
    return {
      ok: readTestMarkup(testSurface) === "<div>first</div><div>second</div>",
      detail: readTestMarkup(testSurface),
    };
  } finally {
    cleanup(host);
  }
});

check("live checkbox state is captured into vnode attributes", () => {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  const vnode = domSubtreeToVNode(checkbox);
  return {
    ok: vnode.attributes.checked === "checked",
    detail: JSON.stringify(vnode.attributes),
  };
});

check("whitespace-only formatting text nodes are ignored", () => {
  const root = document.createElement("div");
  root.innerHTML = "<section>\n  <span>item</span>\n</section>";
  const vnode = domSubtreeToVNode(root);
  const section = vnode.children[0];
  return {
    ok: section.children.length === 1 && section.children[0].type === "element",
    detail: section.children.map((child) => `${child.type}:${child.textContent ?? child.tagName}`).join(", "),
  };
});

check("unsafe inline event handlers are stripped on render and round-trip", () => {
  const root = document.createElement("div");
  writeMarkup(root, '<button onclick="alert(1)">run</button>');
  const renderedHandler = root.querySelector("button")?.getAttribute("onclick");
  const roundTripHtml = vNodeToHtml(domSubtreeToVNode(root));
  return {
    ok: renderedHandler === null && !roundTripHtml.includes("onclick="),
    detail: `handler=${JSON.stringify(renderedHandler)}, html=${JSON.stringify(roundTripHtml)}`,
  };
});

log("");
log(`Summary: ${passed} passed, ${failed} failed`);
