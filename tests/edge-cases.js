import { diffVNodes } from "../src/diff/diff.js";
import { applyPatches } from "../src/diff/patch-dom.js";
import { PATCH_TYPES } from "../src/diff/change-types.js";
import { createElementVNode, createTextVNode } from "../src/core/vdom-node.js";
import { writeMarkup } from "../src/ui/editor-surface.js";

const resultsNode = document.querySelector("#results");
const lines = [];
let passedCount = 0;
let failedCount = 0;

function log(line) {
  lines.push(line);
  resultsNode.textContent = lines.join("\n");
}

function test(name, callback) {
  try {
    callback();
    passedCount += 1;
    log(`PASS | ${name}`);
  } catch (error) {
    failedCount += 1;
    log(`FAIL | ${name}`);
    log(`  ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} (expected: ${expected}, actual: ${actual})`);
  }
}

test("diffVNodes updates changed text nodes", () => {
  const previousNode = createTextVNode("before");
  const nextNode = createTextVNode("after");
  const patches = diffVNodes(previousNode, nextNode);

  assertEqual(patches.length, 1, "text change should create one patch");
  assertEqual(patches[0].type, PATCH_TYPES.UPDATE_TEXT, "patch type should be UPDATE_TEXT");
});

test("diffVNodes removes trailing children", () => {
  const previousNode = createElementVNode("div", {}, [
    createElementVNode("span", { id: "a" }, []),
    createElementVNode("span", { id: "b" }, []),
  ]);
  const nextNode = createElementVNode("div", {}, [
    createElementVNode("span", { id: "a" }, []),
  ]);
  const patches = diffVNodes(previousNode, nextNode);

  assert(
    patches.some(
      (patch) =>
        patch.type === PATCH_TYPES.REMOVE_CHILD &&
        Array.isArray(patch.path) &&
        patch.path.length === 0 &&
        patch.payload?.index === 1
    ),
    "removing the second child should emit REMOVE_CHILD"
  );
});

test("diffVNodes should handle node deletion when nextNode is null", () => {
  const previousNode = createElementVNode("div", {}, [createTextVNode("keep?")]);
  const patches = diffVNodes(previousNode, null);

  assert(
    patches.length > 0,
    "deleting a node currently returns no patch, so the DOM cannot reflect the removal"
  );
});

test("applyPatches updates attributes on a live element", () => {
  const root = document.createElement("div");
  root.setAttribute("data-state", "before");

  applyPatches(root, [
    {
      type: PATCH_TYPES.SET_ATTRIBUTE,
      path: [],
      payload: { name: "data-state", value: "after" },
    },
  ]);

  assertEqual(root.getAttribute("data-state"), "after", "attribute value should be updated");
});

test("root replacement detaches the old element reference used by the controller", () => {
  const host = document.createElement("section");
  const actualSurface = document.createElement("div");
  actualSurface.innerHTML = '<p id="before">before</p>';
  host.appendChild(actualSurface);
  document.body.appendChild(host);

  const nextVNode = createElementVNode("section", { "data-next": "yes" }, [
    createElementVNode("p", { id: "after" }, [createTextVNode("after")]),
  ]);

  const returnedRoot = applyPatches(actualSurface, [
    {
      type: PATCH_TYPES.REPLACE_NODE,
      path: [],
      payload: { node: nextVNode },
    },
  ]);

  assert(returnedRoot !== actualSurface, "root replacement should return the new root node");
  assert(!actualSurface.isConnected, "the old actualSurface reference should now be detached");

  writeMarkup(actualSurface, "<p>stale write</p>");

  assert(
    !host.innerHTML.includes("stale write"),
    "writing through the stale reference should not affect the live DOM"
  );

  host.remove();
});

log("");
log(`Summary: ${passedCount} passed, ${failedCount} failed`);
