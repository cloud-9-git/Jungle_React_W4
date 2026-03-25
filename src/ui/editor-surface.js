/**
 * Owner: Role 3 - Playground UI
 * Editable only by the Role 3 branch.
 */

const URL_ATTRS = new Set(["href", "src", "xlink:href", "formaction"]);

function isEditableTextInput(element) {
  return element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement;
}

function isUnsafeAttribute(name, value) {
  if (!name) {
    return false;
  }

  const normalizedName = String(name).toLowerCase();
  const normalizedValue = String(value ?? "").trim().toLowerCase();

  if (normalizedName.startsWith("on")) {
    return true;
  }

  if (URL_ATTRS.has(normalizedName) && normalizedValue.startsWith("javascript:")) {
    return true;
  }

  return false;
}

function sanitizeNodeTree(rootNode) {
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT);
  const elements = [];

  while (walker.nextNode()) {
    elements.push(walker.currentNode);
  }

  elements.forEach((element) => {
    if (element.tagName === "SCRIPT") {
      element.remove();
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (isUnsafeAttribute(attribute.name, attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });
}

function sanitizeHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html ?? "");
  sanitizeNodeTree(template.content);
  return template.innerHTML;
}

export function getUiRefs(rootElement) {
  if (!(rootElement instanceof Element)) {
    throw new Error("getUiRefs(rootElement): rootElement must be a DOM Element");
  }

  const refs = {
    actualSurface: rootElement.querySelector('[data-surface="actual"]'),
    testSurface: rootElement.querySelector('[data-surface="test"]'),
    patchButton: rootElement.querySelector('[data-action="patch"]'),
    undoButton: rootElement.querySelector('[data-action="undo"]'),
    redoButton: rootElement.querySelector('[data-action="redo"]'),
    historyStatus: rootElement.querySelector('[data-status="history"]'),
  };

  for (const [key, value] of Object.entries(refs)) {
    if (!value) {
      throw new Error(`getUiRefs(rootElement): missing required UI element "${key}"`);
    }
  }

  return refs;
}

export function readTestMarkup(testSurfaceElement) {
  if (!(testSurfaceElement instanceof Element)) {
    throw new Error("readTestMarkup(testSurfaceElement): testSurfaceElement must be a DOM Element");
  }

  if (isEditableTextInput(testSurfaceElement)) {
    return testSurfaceElement.value.trim();
  }

  return testSurfaceElement.innerHTML.trim();
}

export function writeMarkup(targetElement, html) {
  if (!(targetElement instanceof Element)) {
    throw new Error("writeMarkup(targetElement, html): targetElement must be a DOM Element");
  }

  if (isEditableTextInput(targetElement)) {
    targetElement.value = String(html ?? "");
    return;
  }

  targetElement.innerHTML = sanitizeHtml(html);
}

export function setNavigationState(refs, state) {
  if (!refs || !refs.undoButton || !refs.redoButton || !refs.historyStatus) {
    throw new Error("setNavigationState(refs, state): refs must include undoButton, redoButton, historyStatus");
  }

  const canUndo = Boolean(state?.canUndo);
  const canRedo = Boolean(state?.canRedo);
  const index = Number.isFinite(state?.index) ? state.index : 0;
  const size = Number.isFinite(state?.size) ? state.size : 1;

  refs.undoButton.disabled = !canUndo;
  refs.redoButton.disabled = !canRedo;
  refs.historyStatus.textContent = `${Math.max(index + 1, 1)} / ${Math.max(size, 1)}`;
}
