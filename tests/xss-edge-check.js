import { domSubtreeToVNode } from "../src/core/dom-to-vdom.js";
import { vNodeToHtml } from "../src/core/vdom-to-html.js";
import { readTestMarkup, writeMarkup } from "../src/ui/editor-surface.js";

const resultsNode = document.querySelector("#results");
const lines = [];

function log(line) {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function createSurface(markup = "") {
  const element = document.createElement("div");
  element.setAttribute("contenteditable", "true");
  element.innerHTML = markup;
  document.body.appendChild(element);
  return element;
}

function run(label, fn) {
  try {
    const { reproduced, detail } = fn();
    log(`${reproduced ? "REPRODUCED" : "NOT REPRODUCED"} | ${label}`);
    if (detail) {
      log(`  ${detail}`);
    }
  } catch (error) {
    log(`ERROR | ${label}`);
    log(`  ${error.message}`);
  }
}

run("writeMarkup preserves inline event handler attributes", () => {
  const root = document.createElement("div");
  writeMarkup(root, '<img src="x" onerror="window.__xss = 1">');
  const img = root.querySelector("img");
  return {
    reproduced: img?.getAttribute("onerror") === "window.__xss = 1",
    detail: `onerror=${JSON.stringify(img?.getAttribute("onerror") ?? null)}`,
  };
});

run("editable markup returns dangerous inline handlers unchanged", () => {
  const surface = createSurface('<button onclick="window.__xss = 1">run</button>');
  const markup = readTestMarkup(surface);
  surface.remove();
  return {
    reproduced: markup.includes('onclick="window.__xss = 1"'),
    detail: `markup=${JSON.stringify(markup)}`,
  };
});

run("dom-to-vdom to html round-trip keeps inline handler attributes", () => {
  const root = document.createElement("div");
  root.innerHTML = '<button onclick="alert(1)">run</button>';
  const roundTripHtml = vNodeToHtml(domSubtreeToVNode(root));
  return {
    reproduced: roundTripHtml.includes('onclick="alert(1)"'),
    detail: `html=${JSON.stringify(roundTripHtml)}`,
  };
});
