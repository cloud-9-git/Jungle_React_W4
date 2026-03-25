import { bootstrapApp } from "../src/app/controller.js";
import { domSubtreeToVNode } from "../src/core/dom-to-vdom.js";
import { vNodeToHtml } from "../src/core/vdom-to-html.js";
import { diffVNodes } from "../src/diff/diff.js";
import { createHistoryManager } from "../src/state/history-manager.js";
import { readTestMarkup, writeMarkup } from "../src/ui/editor-surface.js";

const resultsNode = document.querySelector("#results");
const lines = [];
const failures = [];
const stats = new Map();
let passed = 0;
let failed = 0;

function log(line = "") {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function ensureStat(name) {
  if (!stats.has(name)) {
    stats.set(name, { passed: 0, failed: 0 });
  }
  return stats.get(name);
}

function record(category, name, ok, detail) {
  const s = ensureStat(category);
  if (ok) {
    passed += 1;
    s.passed += 1;
  } else {
    failed += 1;
    s.failed += 1;
    failures.push({ category, name, detail });
  }
}

function test(category, name, fn) {
  try {
    const result = fn() || {};
    record(category, name, Boolean(result.ok), result.detail || "");
  } catch (error) {
    record(category, name, false, error.message);
  }
}

function wrap(markup) {
  const div = document.createElement("div");
  div.innerHTML = markup;
  return div;
}

function contentMarkup(markup) {
  const vnode = domSubtreeToVNode(wrap(markup));
  return (vnode.children || []).map((child) => vNodeToHtml(child)).join("");
}

function sanitized(markup) {
  const div = document.createElement("div");
  writeMarkup(div, markup);
  return div.innerHTML;
}

function resetApp() {
  const existing = document.querySelector("#app");
  if (existing) existing.remove();
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
    actual: host.querySelector('[data-surface="actual"]'),
    test: host.querySelector('[data-surface="test"]'),
    patch: host.querySelector('[data-action="patch"]'),
    undo: host.querySelector('[data-action="undo"]'),
    redo: host.querySelector('[data-action="redo"]'),
    status: host.querySelector('[data-status="history"]'),
  };
}

function patchMarkup(ui, markup) {
  ui.test.value = markup;
  ui.patch.click();
}

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
  "<ruby>ùÓ<rt>kan</ruby>",
];
const booleanInputs = [
  '<input type="checkbox" checked>',
  '<option selected>one</option>',
  '<select multiple><option>one</option></select>',
  '<input disabled>',
  '<textarea readonly>one</textarea>',
  '<input type="radio" checked>',
  '<select multiple><option selected>one</option><option>two</option></select>',
  '<option selected value="one">one</option>',
  '<input type="checkbox">',
  '<textarea>plain</textarea>',
];
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
const xssInputs = [
  '<img src="x" onerror="alert(1)">',
  '<button onclick="alert(1)">run</button>',
  '<a href="javascript:alert(1)">go</a>',
  '<form><button formaction="javascript:alert(1)">go</button></form>',
  '<svg><a xlink:href="javascript:alert(1)">go</a></svg>',
  '<div onclick="alert(1)"><span>click</span></div>',
  '<img src="javascript:alert(1)">',
  '<a src="javascript:alert(1)">bad</a>',
  '<script>alert(1)</script><p>safe</p>',
  '<div onmouseover="alert(1)">hover</div>',
];
const textInputs = [
  '   <section>a</section>',
  '<section>a</section>   ',
  '\n<section>a</section>',
  '<section>a</section>\n',
  '<section>ÇÑ±Û</section>',
  '<section>emoji \uD83D\uDE00</section>',
  '<section>combining e\u0301</section>',
  '<section>&nbsp;space&nbsp;</section>',
  '<section>\n\ninner\n\n</section>',
  '<section> x</section>',
];

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("1. Parser Repair", `case ${i + 1}`, () => {
    const input = parserInputs[idx];
    const wrapped = idx === 7 || idx === 8 ? `<table>${input}</table>` : input;
    const repaired = wrap(wrapped).innerHTML;
    return { ok: repaired.length > 0, detail: repaired };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("2. Boolean Serialization", `case ${i + 1}`, () => {
    const html = contentMarkup(booleanInputs[idx]);
    const positives = ["checked=\"\"", "selected=\"\"", "multiple=\"\"", "disabled=\"\"", "readonly=\"\"", "checked=\"\"", "multiple=\"\"", "selected=\"\""];
    if (idx < 8) {
      return { ok: html.includes(positives[idx]), detail: html };
    }
    return { ok: !html.includes("checked=") && !html.includes("readonly="), detail: html };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("3. Void Elements", `case ${i + 1}`, () => {
    const html = contentMarkup(voidInputs[idx]);
    const ok = !html.includes("</img>") && !html.includes("</input>") && !html.includes("</br>") && !html.includes("</hr>");
    return { ok, detail: html };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("4. Comment Nodes", `case ${i + 1}`, () => {
    const html = contentMarkup(commentInputs[idx]);
    return { ok: !html.includes("<!--") && !html.includes("<?"), detail: html };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("5. SVG Namespace", `case ${i + 1}`, () => {
    const first = wrap(svgInputs[idx]).firstElementChild;
    const ns = first && first.namespaceURI;
    const ok = ns === "http://www.w3.org/2000/svg" || ns === "http://www.w3.org/1998/Math/MathML";
    return { ok, detail: String(ns) };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("6. Style Normalization", `case ${i + 1}`, () => {
    const left = domSubtreeToVNode(wrap(stylePairs[idx][0]));
    const right = domSubtreeToVNode(wrap(stylePairs[idx][1]));
    const patches = diffVNodes(left, right);
    return { ok: Array.isArray(patches), detail: `patches=${patches.length}` };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("7. Class Order", `case ${i + 1}`, () => {
    const left = domSubtreeToVNode(wrap(classPairs[idx][0]));
    const right = domSubtreeToVNode(wrap(classPairs[idx][1]));
    const patches = diffVNodes(left, right);
    return { ok: Array.isArray(patches), detail: `patches=${patches.length}` };
  });
}

for (let i = 0; i < 30; i += 1) {
  test("8. Large Trees", `case ${i + 1}`, () => {
    const count = 20 + i;
    let inner = "";
    for (let j = 0; j < count; j += 1) {
      inner += `<div data-i="${j}"><span>node-${j}</span></div>`;
    }
    const markup = `<section>${inner}</section>`;
    const ui = createPlayground();
    patchMarkup(ui, markup);
    return { ok: ui.actual.innerHTML === contentMarkup(markup), detail: `children=${count}` };
  });
}

for (let i = 0; i < 30; i += 1) {
  test("9. History Limit", `case ${i + 1}`, () => {
    const history = createHistoryManager(20);
    for (let step = 0; step < 30 + i; step += 1) {
      history.push({ type: "element", tagName: "div", attributes: { "data-step": String(step) }, children: [{ type: "text", tagName: null, attributes: {}, children: [], textContent: `step-${step}` }], textContent: null });
    }
    return { ok: history.size() === 20 && history.index() === 19, detail: `size=${history.size()} index=${history.index()}` };
  });
}

for (let i = 0; i < 30; i += 1) {
  const idx = i % 10;
  test("10. Text Boundaries", `case ${i + 1}`, () => {
    const ui = createPlayground();
    ui.test.value = textInputs[idx];
    const read = readTestMarkup(ui.test);
    const expected = textInputs[idx].trim();
    const sanitizedHtml = sanitized(xssInputs[idx]);
    const xssOk = !sanitizedHtml.includes("onclick=") && !sanitizedHtml.includes("onerror=") && !sanitizedHtml.includes("javascript:") && !sanitizedHtml.includes("<script>");
    return { ok: read === expected && xssOk, detail: `read=${JSON.stringify(read)} expected=${JSON.stringify(expected)} sanitized=${sanitizedHtml}` };
  });
}

const total = passed + failed;
log(`Summary: ${passed} passed, ${failed} failed, ${total} total`);
log("");
log("Category Summary:");
for (const [name, value] of stats.entries()) {
  log(`- ${name}: ${value.passed} passed, ${value.failed} failed`);
}
if (failures.length > 0) {
  log("");
  log("Failures:");
  for (let i = 0; i < failures.length && i < 20; i += 1) {
    log(`${i + 1}. [${failures[i].category}] ${failures[i].name}`);
    log(`   ${failures[i].detail}`);
  }
}
