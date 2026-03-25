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
const categoryStats = new Map();
let reproducedTotal = 0;
let notReproducedTotal = 0;

function log(line = "") {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function registerCategory(category, reproduced) {
  if (!categoryStats.has(category)) {
    categoryStats.set(category, { reproduced: 0, total: 0 });
  }

  const stats = categoryStats.get(category);
  stats.total += 1;

  if (reproduced) {
    stats.reproduced += 1;
  }
}

function reproduce(category, name, callback) {
  try {
    const outcome = callback();
    const reproduced = Boolean(outcome?.reproduced);
    const detail = outcome?.detail ? ` | ${outcome.detail}` : "";

    registerCategory(category, reproduced);

    if (reproduced) {
      reproducedTotal += 1;
      log(`[REPRODUCED] ${category} | ${name}${detail}`);
    } else {
      notReproducedTotal += 1;
      log(`[NOT REPRODUCED] ${category} | ${name}${detail}`);
    }
  } catch (error) {
    registerCategory(category, false);
    notReproducedTotal += 1;
    log(`[ERROR] ${category} | ${name} | ${error.message}`);
  }
}

function cleanupNode(node) {
  if (node?.remove) {
    node.remove();
  }
}

function createSurface(markup = "") {
  const element = document.createElement("div");
  element.setAttribute("contenteditable", "true");
  element.innerHTML = markup;
  document.body.appendChild(element);
  return element;
}

function createDetachedWrapper(markup) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = markup;
  return wrapper;
}

function createPlaygroundHost() {
  const host = document.createElement("div");
  host.id = "app";
  document.body.appendChild(host);
  return host;
}

reproduce("Root Semantics", "bootstrapApp nests the actual surface wrapper inside itself", () => {
  const host = createPlaygroundHost();

  try {
    bootstrapApp();
    const actualSurface = host.querySelector('[data-surface="actual"]');
    const nestedSurface = actualSurface?.firstElementChild;

    return {
      reproduced: nestedSurface?.getAttribute("data-surface") === "actual",
      detail: `actualSurface innerHTML starts with ${JSON.stringify(actualSurface?.innerHTML.slice(0, 40) ?? "")}`,
    };
  } finally {
    cleanupNode(host);
  }
});

reproduce("Root Semantics", "root tag changes are tracked at child path [0] instead of the content root", () => {
  const actualSurface = document.createElement("div");
  actualSurface.setAttribute("data-surface", "actual");
  actualSurface.innerHTML = "<section><p>before</p></section>";

  const previousVNode = domSubtreeToVNode(actualSurface);
  const nextVNode = domSubtreeToVNode(createDetachedWrapper("<article><p>after</p></article>"));
  const patches = diffVNodes(previousVNode, nextVNode);
  const replacePatch = patches.find((patch) => patch.type === PATCH_TYPES.REPLACE_NODE);

  return {
    reproduced: Array.isArray(replacePatch?.path) && replacePatch.path.join(",") === "0",
    detail: `replace path=${JSON.stringify(replacePatch?.path ?? null)}`,
  };
});

reproduce("Root Semantics", "multiple top-level nodes are diffed as children of a synthetic wrapper div", () => {
  const actualSurface = document.createElement("div");
  actualSurface.setAttribute("data-surface", "actual");
  actualSurface.innerHTML = "<section>one</section>";

  const previousVNode = domSubtreeToVNode(actualSurface);
  const nextVNode = domSubtreeToVNode(
    createDetachedWrapper("<section>one</section><section>two</section>")
  );
  const patches = diffVNodes(previousVNode, nextVNode);

  return {
    reproduced: patches.some(
      (patch) => patch.type === PATCH_TYPES.INSERT_CHILD && patch.path.length === 0
    ),
    detail: `patch types=${patches.map((patch) => patch.type).join(", ")}`,
  };
});

reproduce("Missing Deletion Patch", "deleting an element root returns no patch", () => {
  const previousVNode = createElementVNode("div", {}, [createTextVNode("x")]);
  const patches = diffVNodes(previousVNode, null);

  return {
    reproduced: patches.length === 0,
    detail: `patch count=${patches.length}`,
  };
});

reproduce("Missing Deletion Patch", "deleting a text root returns no patch", () => {
  const previousVNode = createTextVNode("text");
  const patches = diffVNodes(previousVNode, null);

  return {
    reproduced: patches.length === 0,
    detail: `patch count=${patches.length}`,
  };
});

reproduce("Missing Deletion Patch", "recursive child deletion path also returns no patch", () => {
  const patches = diffVNodes(createElementVNode("span", {}, []), null, [2, 1]);

  return {
    reproduced: patches.length === 0,
    detail: `patch count=${patches.length} at path [2,1]`,
  };
});

reproduce("Root Replace Apply", "root replace does nothing when the target root has no parent", () => {
  const root = document.createElement("div");
  root.innerHTML = "<p>before</p>";

  const result = applyPatches(root, [
    {
      type: PATCH_TYPES.REPLACE_NODE,
      path: [],
      payload: {
        node: createElementVNode("section", { id: "after" }, [createTextVNode("after")]),
      },
    },
  ]);

  return {
    reproduced: result === root && root.tagName.toLowerCase() === "div",
    detail: `returned tag=${result.tagName.toLowerCase()}`,
  };
});

reproduce("Root Replace Apply", "attached root replacement detaches the old reference", () => {
  const host = document.createElement("div");
  const root = document.createElement("div");
  host.appendChild(root);
  document.body.appendChild(host);

  try {
    const result = applyPatches(root, [
      {
        type: PATCH_TYPES.REPLACE_NODE,
        path: [],
        payload: {
          node: createElementVNode("section", { id: "after" }, [createTextVNode("after")]),
        },
      },
    ]);

    return {
      reproduced: result !== root && !root.isConnected && host.firstElementChild === result,
      detail: `old connected=${root.isConnected}, new tag=${result.tagName.toLowerCase()}`,
    };
  } finally {
    cleanupNode(host);
  }
});

reproduce("Root Replace Apply", "writing via the stale reference no longer updates the live DOM", () => {
  const host = document.createElement("div");
  const root = document.createElement("div");
  host.appendChild(root);
  document.body.appendChild(host);

  try {
    applyPatches(root, [
      {
        type: PATCH_TYPES.REPLACE_NODE,
        path: [],
        payload: {
          node: createElementVNode("section", { id: "after" }, [createTextVNode("after")]),
        },
      },
    ]);

    writeMarkup(root, "<p>stale write</p>");

    return {
      reproduced: !host.innerHTML.includes("stale write"),
      detail: `host HTML=${JSON.stringify(host.innerHTML)}`,
    };
  } finally {
    cleanupNode(host);
  }
});

reproduce("Contenteditable DOM", "a visually empty editor containing only <br> is treated as non-empty markup", () => {
  const surface = createSurface("<br>");

  try {
    const markup = readTestMarkup(surface);

    return {
      reproduced: markup === "<br>",
      detail: `read markup=${JSON.stringify(markup)}`,
    };
  } finally {
    cleanupNode(surface);
  }
});

reproduce("Contenteditable DOM", "browser-inserted block wrappers are preserved as structure", () => {
  const surface = createSurface("<div>first</div><div>second</div>");

  try {
    const markup = readTestMarkup(surface);

    return {
      reproduced: markup.includes("<div>first</div><div>second</div>"),
      detail: `read markup=${JSON.stringify(markup)}`,
    };
  } finally {
    cleanupNode(surface);
  }
});

reproduce("Contenteditable DOM", "pasted inline style markup survives the round-trip untouched", () => {
  const surface = createSurface('<span style="color:red">styled</span>');

  try {
    const markup = readTestMarkup(surface);

    return {
      reproduced: markup.includes('style="color:red"'),
      detail: `read markup=${JSON.stringify(markup)}`,
    };
  } finally {
    cleanupNode(surface);
  }
});

reproduce("Dynamic Property vs Attribute", "checkbox checked state changed via property is lost in dom-to-vdom", () => {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;

  const vnode = domSubtreeToVNode(checkbox);

  return {
    reproduced: !("checked" in vnode.attributes),
    detail: `attributes=${JSON.stringify(vnode.attributes)}`,
  };
});

reproduce("Dynamic Property vs Attribute", "dirty input value is not captured from the live property", () => {
  const input = document.createElement("input");
  input.setAttribute("value", "initial");
  input.value = "typed";

  const vnode = domSubtreeToVNode(input);

  return {
    reproduced: vnode.attributes.value === "initial",
    detail: `captured value=${JSON.stringify(vnode.attributes.value)}`,
  };
});

reproduce("Dynamic Property vs Attribute", "setting the value attribute does not overwrite a dirty input value", () => {
  const input = document.createElement("input");
  input.value = "user-typed";
  document.body.appendChild(input);

  try {
    applyPatches(input, [
      {
        type: PATCH_TYPES.SET_ATTRIBUTE,
        path: [],
        payload: { name: "value", value: "patched-attr" },
      },
    ]);

    return {
      reproduced: input.value === "user-typed" && input.getAttribute("value") === "patched-attr",
      detail: `property=${JSON.stringify(input.value)}, attr=${JSON.stringify(input.getAttribute("value"))}`,
    };
  } finally {
    cleanupNode(input);
  }
});

reproduce("Whitespace History", "whitespace-only text nodes are preserved in the vnode tree", () => {
  const root = document.createElement("div");
  root.innerHTML = "<section>\n  <span>item</span>\n</section>";

  const vnode = domSubtreeToVNode(root);
  const sectionNode = vnode.children[0];
  const hasWhitespaceText = sectionNode.children.some(
    (child) => child.type === "text" && child.textContent.trim() === ""
  );

  return {
    reproduced: hasWhitespaceText,
    detail: `child types=${sectionNode.children.map((child) => child.type).join(", ")}`,
  };
});

reproduce("Whitespace History", "formatting-only differences generate diff patches", () => {
  const previousRoot = document.createElement("div");
  previousRoot.innerHTML = "<section><span>item</span></section>";

  const nextRoot = document.createElement("div");
  nextRoot.innerHTML = "<section>\n  <span>item</span>\n</section>";

  const patches = diffVNodes(domSubtreeToVNode(previousRoot), domSubtreeToVNode(nextRoot));

  return {
    reproduced: patches.length > 0,
    detail: `patch count=${patches.length}`,
  };
});

reproduce("Whitespace History", "history stores formatting-only snapshots as separate entries", () => {
  const history = createHistoryManager(5);
  const compactRoot = document.createElement("div");
  compactRoot.innerHTML = "<section><span>item</span></section>";

  const spacedRoot = document.createElement("div");
  spacedRoot.innerHTML = "<section>\n  <span>item</span>\n</section>";

  history.push(domSubtreeToVNode(compactRoot));
  history.push(domSubtreeToVNode(spacedRoot));

  return {
    reproduced: history.size() === 2,
    detail: `history size=${history.size()}`,
  };
});

reproduce("XSS Surface", "writeMarkup preserves inline event handler attributes", () => {
  const root = document.createElement("div");
  writeMarkup(root, '<img src="x" onerror="window.__xss = 1">');

  const img = root.querySelector("img");

  return {
    reproduced: img?.getAttribute("onerror") === "window.__xss = 1",
    detail: `onerror=${JSON.stringify(img?.getAttribute("onerror") ?? null)}`,
  };
});

reproduce("XSS Surface", "editable markup returns dangerous inline handlers unchanged", () => {
  const surface = createSurface('<button onclick="window.__xss = 1">run</button>');

  try {
    const markup = readTestMarkup(surface);

    return {
      reproduced: markup.includes('onclick="window.__xss = 1"'),
      detail: `read markup=${JSON.stringify(markup)}`,
    };
  } finally {
    cleanupNode(surface);
  }
});

reproduce("XSS Surface", "dom-to-vdom to html round-trip keeps inline handler attributes", () => {
  const root = document.createElement("div");
  root.innerHTML = '<button onclick="alert(1)">run</button>';

  const roundTripHtml = vNodeToHtml(domSubtreeToVNode(root));

  return {
    reproduced: roundTripHtml.includes('onclick="alert(1)"'),
    detail: `round-trip html=${JSON.stringify(roundTripHtml)}`,
  };
});

log("");
log("Category Summary");

for (const [category, stats] of categoryStats.entries()) {
  log(`- ${category}: ${stats.reproduced}/${stats.total} reproduced`);
}

log("");
log(`Overall: ${reproducedTotal} reproduced, ${notReproducedTotal} not reproduced`);
