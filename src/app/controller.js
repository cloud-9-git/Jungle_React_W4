/**
 * Owner: Role 4 - History / App Controller
 * Editable only by the Role 4 branch.
 */

import { HISTORY_LIMIT, SELECTORS } from "../contracts.js";
import { domSubtreeToVNode } from "../core/dom-to-vdom.js";
import { createElementVNode } from "../core/vdom-node.js";
import { vNodeToHtml } from "../core/vdom-to-html.js";
import { diffVNodes } from "../diff/diff.js";
import { applyPatches } from "../diff/patch-dom.js";
import { createHistoryManager } from "../state/history-manager.js";
import { createAppShell } from "../ui/layout-template.js";
import {
  getUiRefs,
  readTestMarkup,
  setNavigationState,
  writeMarkup,
} from "../ui/editor-surface.js";
import { SAMPLE_MARKUP } from "../ui/sample-markup.js";

function assertUiRefs(uiRefs) {
  const requiredKeys = [
    "actualSurface",
    "testSurface",
    "patchButton",
    "undoButton",
    "redoButton",
    "historyStatus",
  ];

  for (const key of requiredKeys) {
    if (!uiRefs?.[key]) {
      throw new Error(`bootstrapApp() missing UI ref: ${key}`);
    }
  }
}

function createDetachedWrapper(markup) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = markup;
  return wrapper;
}

function createContentRootVNode(rootElement) {
  const wrapperVNode = domSubtreeToVNode(rootElement);
  return createElementVNode("div", {}, wrapperVNode.children ?? []);
}

function contentVNodeToMarkup(vNode) {
  return (vNode?.children ?? []).map((child) => vNodeToHtml(child)).join("");
}

function createHistoryState(history) {
  return {
    canUndo: history.canUndo(),
    canRedo: history.canRedo(),
    index: history.index(),
    size: history.size(),
    currentPosition: history.size() === 0 ? 0 : history.index() + 1,
  };
}

export function bootstrapApp() {
  try {
    const appRoot = document.querySelector(SELECTORS.appRoot);

    if (!appRoot) {
      throw new Error(`App root not found: ${SELECTORS.appRoot}`);
    }

    const appShell = createAppShell();
    appRoot.innerHTML = appShell;

    const uiRefs = getUiRefs(appRoot);
    assertUiRefs(uiRefs);

    const history = createHistoryManager(HISTORY_LIMIT);
    let actualSurfaceElement = uiRefs.actualSurface;

    writeMarkup(actualSurfaceElement, SAMPLE_MARKUP);

    const initialVNode = createContentRootVNode(actualSurfaceElement);
    history.push(initialVNode);

    writeMarkup(actualSurfaceElement, contentVNodeToMarkup(initialVNode));
    writeMarkup(uiRefs.testSurface, contentVNodeToMarkup(initialVNode));
    setNavigationState(uiRefs, createHistoryState(history));

    uiRefs.patchButton.addEventListener("click", () => {
      const testMarkup = readTestMarkup(uiRefs.testSurface);

      if (typeof testMarkup !== "string") {
        setNavigationState(uiRefs, createHistoryState(history));
        return;
      }

      const wrapper = createDetachedWrapper(testMarkup);
      const previousVNode = history.current();
      const nextVNode = createContentRootVNode(wrapper);
      const patches = diffVNodes(previousVNode, nextVNode);

      if (!Array.isArray(patches)) {
        throw new Error("diffVNodes(previousVNode, nextVNode) must return an array");
      }

      if (patches.length === 0) {
        writeMarkup(uiRefs.testSurface, contentVNodeToMarkup(previousVNode));
        setNavigationState(uiRefs, createHistoryState(history));
        return;
      }

      actualSurfaceElement = applyPatches(actualSurfaceElement, patches) ?? actualSurfaceElement;
      history.push(nextVNode);
      writeMarkup(actualSurfaceElement, contentVNodeToMarkup(history.current()));
      writeMarkup(uiRefs.testSurface, contentVNodeToMarkup(history.current()));
      setNavigationState(uiRefs, createHistoryState(history));
    });

    uiRefs.undoButton.addEventListener("click", () => {
      const previousState = history.undo();

      if (previousState) {
        writeMarkup(actualSurfaceElement, contentVNodeToMarkup(previousState));
        writeMarkup(uiRefs.testSurface, contentVNodeToMarkup(previousState));
      }

      setNavigationState(uiRefs, createHistoryState(history));
    });

    uiRefs.redoButton.addEventListener("click", () => {
      const nextState = history.redo();

      if (nextState) {
        writeMarkup(actualSurfaceElement, contentVNodeToMarkup(nextState));
        writeMarkup(uiRefs.testSurface, contentVNodeToMarkup(nextState));
      }

      setNavigationState(uiRefs, createHistoryState(history));
    });
  } catch (error) {
    console.error("bootstrapApp() failed", error);
    throw error;
  }
}
