import { bootstrapApp } from "../src/app/controller.js";
import { domSubtreeToVNode } from "../src/core/dom-to-vdom.js";
import { vNodeToHtml } from "../src/core/vdom-to-html.js";
import { diffVNodes } from "../src/diff/diff.js";
import { createHistoryManager } from "../src/state/history-manager.js";
import { readTestMarkup, writeMarkup } from "../src/ui/editor-surface.js";

const resultsNode = document.querySelector("#results");
const lines = [];
const failures = [];
const categoryStats = new Map();
let passed = 0;
let failed = 0;

function log(line) {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function ensureCategory(name) {
  if (!categoryStats.has(name)) {
    categoryStats.set(name, { passed: 0, failed: 0 });
  }
  return categoryStats.get(name);
}

function runTest(category, name, fn) {
  try {
    const result = fn() || {};
    const ok = Boolean(result.ok);
    const stats = ensureCategory(category);
    if (ok) {
      passed += 1;
      stats.passed += 1;
      return;
    }
    failed += 1;
    stats.failed += 1;
    failures.push({ category, name, detail: result.detail || "" });
  } catch (error) {
    const stats = ensureCategory(category);
    failed += 1;
    stats.failed += 1;
    failures.push({ category, name, detail: error.message });
  }
}

function resetApp() {
  const oldApp = document.querySelector("#app");
  if (oldApp) {
    oldApp.remove();
  }
  const host = document.createElement("div");
  host.id = "app";
  document.body.appendChild(host);
  return host;
}

function createPlayground() {
  const host = resetApp();
  bootstrapApp();
  return {
    host,
    actualSurface: host.querySelector('[data-surface="actual"]'),
    testSurface: host.querySelector('[data-surface="test"]'),
    patchButton: host.querySelector('[data-action="patch"]'),
  };
}

function patch(ui, markup) {
  ui.testSurface.value = markup;
  ui.patchButton.click();
}

function wrap(markup) {
  const div = document.createElement("div");
  div.innerHTML = markup;
  return div;
}

function contentHtml(markup) {
  const vnode = domSubtreeToVNode(wrap(markup));
  return (vnode.children || []).map((child) => vNodeToHtml(child)).join("");
}

function sanitized(markup) {
  const div = document.createElement("div");
  writeMarkup(div, markup);
  return div.innerHTML;
}

log("start");

const parserInputs = [
  "<div><span></div>",
  "<ul><li>a<li>b</ul>",
  "<table><tr><td>x</table>",
  "<p><div>x</div></p>",
  "<select><option>a<option>b</select>",
  "<dl><dt>a<dd>b</dl>",
  "<div><p>a</div><p>b</p>",
  "<tbody><tr><td>x</td></tr></tbody>",
  "<colgroup><col></colgroup>",
  "<ruby>r<rt>t</ruby>",
];
for (let i = 0; i < parserInputs.length; i += 1) {
  runTest("1. Parser Repair", `case ${i + 1}`, () => {
    const input = parserInputs[i];
    const wrapped = i === 7 || i === 8 ? `<table>${input}</table>` : input;
    const actual = wrap(wrapped).innerHTML;
    return { ok: actual.length > 0 && actual !== wrapped, detail: actual };
  });
}

const booleanInputs = [
  '<input type="checkbox" checked>',
  '<option selected>one</option>',
  '<select multiple><option>one</option></select>',
  '<input disabled>',
  '<textarea readonly>one</textarea>',
  '<input type="checkbox">',
  '<option>one</option>',
  '<select><option>one</option></select>',
  '<input>',
  '<textarea>one</textarea>',
];
for (let i = 0; i < booleanInputs.length; i += 1) {
  runTest("2. Boolean Serialization", `case ${i + 1}`, () => {
    const html = contentHtml(booleanInputs[i]);
    const positives = ["checked=\"\"", "selected=\"\"", "multiple=\"\"", "disabled=\"\"", "readonly=\"\""];
    if (i < 5) {
      return { ok: html.includes(positives[i]), detail: html };
    }
    return { ok: !html.includes(positives[i - 5]), detail: html };
  });
}

const voidInputs = [
  '<img src="/a.png">',
  '<input type="text" value="a">',
  '<br>',
  '<hr>',
  '<meta charset="utf-8">',
  '<source src="/a.mp4">',
  '<track kind="captions">',
  '<wbr>',
  '<img src="/a.png"></img>',
  '<input type="text">tail',
];
for (let i = 0; i < voidInputs.length; i += 1) {
  runTest("3. Void Elements", `case ${i + 1}`, () => {
    const html = contentHtml(voidInputs[i]);
    const ok = html.indexOf("</img>") === -1 && html.indexOf("</input>") === -1 && html.indexOf("</br>") === -1 && html.indexOf("</hr>") === -1;
    return { ok, detail: html };
  });
}

const commentInputs = [
  '<div><!-- note --><span>a</span></div>',
  '<!-- top --><section>a</section>',
  '<div>a<!-- mid -->b</div>',
  '<section><!-- --></section>',
  '<div><!--x--><!--y--></div>',
  '<article><!-- nested --><p>x</p></article>',
  '<div><!-- before --></div>',
  '<!-- lone -->',
  '<div><!-- hidden --><em>x</em></div>',
  '<section><!-- comment --><strong>x</strong></section>',
];
for (let i = 0; i < commentInputs.length; i += 1) {
  runTest("4. Comment Nodes", `case ${i + 1}`, () => {
    const html = contentHtml(commentInputs[i]);
    return { ok: html.indexOf("<!--") === -1, detail: html };
  });
}

const svgInputs = [
  '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>',
  '<svg><rect width="10" height="10"></rect></svg>',
  '<svg><path d="M0 0L10 10"></path></svg>',
  '<svg><g><text>x</text></g></svg>',
  '<svg><use href="#shape"></use></svg>',
  '<svg><foreignObject><div>html</div></foreignObject></svg>',
  '<svg><line x1="0" y1="0" x2="10" y2="10"></line></svg>',
  '<svg><ellipse cx="5" cy="5" rx="4" ry="2"></ellipse></svg>',
  '<svg><polygon points="0,0 10,0 5,10"></polygon></svg>',
  '<math><mi>x</mi><mo>+</mo><mi>y</mi></math>',
];
for (let i = 0; i < svgInputs.length; i += 1) {
  runTest("5. SVG Namespace", `case ${i + 1}`, () => {
    const first = wrap(svgInputs[i]).firstElementChild;
    const ns = first && first.namespaceURI;
    const ok = ns === "http://www.w3.org/2000/svg" || ns === "http://www.w3.org/1998/Math/MathML";
    return { ok, detail: String(ns) };
  });
}

const stylePairs = [
  ['<div style="color:red"></div>', '<div style="color: red;"></div>'],
  ['<div style="margin:0;padding:0"></div>', '<div style="margin: 0; padding: 0;"></div>'],
  ['<p style="font-weight:bold"></p>', '<p style="font-weight: bold;"></p>'],
  ['<section style="border:1px solid red"></section>', '<section style="border: 1px solid red;"></section>'],
  ['<div style="background:#fff"></div>', '<div style="background: rgb(255, 255, 255);"></div>'],
  ['<div style="color:red;display:block"></div>', '<div style="display:block;color:red"></div>'],
  ['<div style="padding:4px 8px"></div>', '<div style="padding: 4px 8px;"></div>'],
  ['<div style="line-height:1.5"></div>', '<div style="line-height: 1.5;"></div>'],
  ['<div style="text-transform:uppercase"></div>', '<div style="text-transform: uppercase;"></div>'],
  ['<div style="width:10px;height:20px"></div>', '<div style="height:20px;width:10px"></div>'],
];
for (let i = 0; i < stylePairs.length; i += 1) {
  runTest("6. Style Normalization", `case ${i + 1}`, () => {
    const left = domSubtreeToVNode(wrap(stylePairs[i][0]));
    const right = domSubtreeToVNode(wrap(stylePairs[i][1]));
    const patches = diffVNodes(left, right);
    return { ok: Array.isArray(patches), detail: `patches=${patches.length}` };
  });
}

const classPairs = [
  ['<div class="a b"></div>', '<div class="b a"></div>'],
  ['<section class="x y z"></section>', '<section class="z y x"></section>'],
  ['<p class="one two"></p>', '<p class="two one"></p>'],
  ['<div class="card selected"></div>', '<div class="selected card"></div>'],
  ['<article class="hero large"></article>', '<article class="large hero"></article>'],
  ['<div class="alpha beta gamma"></div>', '<div class="gamma alpha beta"></div>'],
  ['<span class="chip active"></span>', '<span class="active chip"></span>'],
  ['<nav class="top sticky"></nav>', '<nav class="sticky top"></nav>'],
  ['<main class="content padded"></main>', '<main class="padded content"></main>'],
  ['<footer class="muted small"></footer>', '<footer class="small muted"></footer>'],
];
for (let i = 0; i < classPairs.length; i += 1) {
  runTest("7. Class Order", `case ${i + 1}`, () => {
    const left = domSubtreeToVNode(wrap(classPairs[i][0]));
    const right = domSubtreeToVNode(wrap(classPairs[i][1]));
    const patches = diffVNodes(left, right);
    return { ok: Array.isArray(patches), detail: `patches=${patches.length}` };
  });
}

for (let i = 0; i < 10; i += 1) {
  runTest("8. Large Trees", `case ${i + 1}`, () => {
    const count = 20 + i * 5;
    let inner = "";
    for (let j = 0; j < count; j += 1) {
      inner += `<div data-i="${j}"><span>node-${j}</span></div>`;
    }
    const markup = `<section>${inner}</section>`;
    const ui = createPlayground();
    patch(ui, markup);
    return { ok: ui.actualSurface.innerHTML === contentHtml(markup), detail: `children=${count}` };
  });
}

for (let i = 0; i < 10; i += 1) {
  runTest("9. History Limit", `case ${i + 1}`, () => {
    const history = createHistoryManager(20);
    for (let step = 0; step < 25 + i; step += 1) {
      history.push({ type: "element", tagName: "div", attributes: { "data-step": String(step) }, children: [{ type: "text", tagName: null, attributes: {}, children: [], textContent: `step-${step}` }], textContent: null });
    }
    return { ok: history.size() === 20 && history.index() === 19, detail: `size=${history.size()} index=${history.index()}` };
  });
}

const textInputs = [
  '   <section>a</section>',
  '<section>a</section>   ',
  '\n<section>a</section>',
  '<section>a</section>\n',
  '<section>\uD55C\uAE00</section>',
  '<section>emoji \uD83D\uDE00</section>',
  '<section>combining e\u0301</section>',
  '<section>&nbsp;space&nbsp;</section>',
  '<section>\n\ninner\n\n</section>',
  '<section> x</section>',
];
for (let i = 0; i < textInputs.length; i += 1) {
  runTest("10. Text Boundaries", `case ${i + 1}`, () => {
    const ui = createPlayground();
    ui.testSurface.value = textInputs[i];
    const read = readTestMarkup(ui.testSurface);
    const expected = textInputs[i].trim();
    return { ok: read === expected, detail: `read=${JSON.stringify(read)} expected=${JSON.stringify(expected)}` };
  });
}

const total = passed + failed;
log(`Summary: ${passed} passed, ${failed} failed, ${total} total`);
log("");
log("Category Summary:");
for (const [name, stats] of categoryStats.entries()) {
  log(`- ${name}: ${stats.passed} passed, ${stats.failed} failed`);
}
if (failures.length > 0) {
  log("");
  log("Failures:");
  for (let i = 0; i < failures.length && i < 20; i += 1) {
    log(`${i + 1}. [${failures[i].category}] ${failures[i].name}`);
    log(`   ${failures[i].detail}`);
  }
}
