/**
 * Owner: Role 2 - Diff / Patch Engine
 * Editable only by the Role 2 branch.
 */

import { PATCH_TYPES } from "./change-types.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function syncDomProperty(targetNode, name, value) {
  if (!(targetNode instanceof Element) || !name) {
    return;
  }

  if (name === "value" && "value" in targetNode) {
    targetNode.value = value ?? "";
    return;
  }

  if (name === "checked" && "checked" in targetNode) {
    targetNode.checked = value !== null && value !== "false";
    return;
  }

  if (name === "selected" && "selected" in targetNode) {
    targetNode.selected = value !== null && value !== "false";
  }
}

function clearDomProperty(targetNode, name) {
  if (!(targetNode instanceof Element) || !name) {
    return;
  }

  if (name === "value" && "value" in targetNode) {
    targetNode.value = "";
    return;
  }

  if (name === "checked" && "checked" in targetNode) {
    targetNode.checked = false;
    return;
  }

  if (name === "selected" && "selected" in targetNode) {
    targetNode.selected = false;
  }
}

function createDomNodeFromVNode(node) {
  if (!node) {
    return null;
  }

  if (node.type === "text") {
    return document.createTextNode(node.textContent ?? "");
  }

  if (node.type !== "element" || !node.tagName) {
    return null;
  }

  const element = document.createElement(node.tagName);
  const attributes = node.attributes ?? {};
  const children = node.children ?? [];

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
    syncDomProperty(element, name, value);
  });

  children.forEach((childNode) => {
    const childDomNode = createDomNodeFromVNode(childNode);

    if (childDomNode) {
      element.appendChild(childDomNode);
    }
  });

  return element;
}

function getNodeAtPath(rootNode, path) {
  let currentNode = rootNode;

  for (const index of path) {
    if (!currentNode || !currentNode.childNodes || index < 0 || index >= currentNode.childNodes.length) {
      return null;
    }

    currentNode = currentNode.childNodes[index];
  }

  return currentNode;
}

function comparePaths(leftPath, rightPath) {
  const length = Math.min(leftPath.length, rightPath.length);

  for (let index = 0; index < length; index += 1) {
    if (leftPath[index] !== rightPath[index]) {
      return leftPath[index] - rightPath[index];
    }
  }

  return leftPath.length - rightPath.length;
}

function patchPriority(patch) {
  if (patch.type === PATCH_TYPES.REMOVE_CHILD || patch.type === PATCH_TYPES.REMOVE_NODE) {
    return 0;
  }

  if (patch.type === PATCH_TYPES.INSERT_CHILD) {
    return 2;
  }

  return 1;
}

function sortPatches(patches) {
  return [...patches].sort((leftPatch, rightPatch) => {
    if (leftPatch.path.length !== rightPatch.path.length) {
      return rightPatch.path.length - leftPatch.path.length;
    }

    const pathComparison = comparePaths(leftPatch.path, rightPatch.path);

    if (pathComparison !== 0) {
      return pathComparison;
    }

    if (
      leftPatch.type === PATCH_TYPES.REMOVE_CHILD &&
      rightPatch.type === PATCH_TYPES.REMOVE_CHILD
    ) {
      return rightPatch.payload.index - leftPatch.payload.index;
    }

    if (
      leftPatch.type === PATCH_TYPES.INSERT_CHILD &&
      rightPatch.type === PATCH_TYPES.INSERT_CHILD
    ) {
      return leftPatch.payload.index - rightPatch.payload.index;
    }

    return patchPriority(leftPatch) - patchPriority(rightPatch);
  });
}

export function applyPatches(rootElement, patches) {
  if (!rootElement || !Array.isArray(patches) || patches.length === 0) {
    return rootElement;
  }

  let currentRoot = rootElement;
  const sortedPatches = sortPatches(patches);

  sortedPatches.forEach((patch) => {
    const { type, path = [], payload = {} } = patch;

    if (type === PATCH_TYPES.REPLACE_NODE) {
      const nextNode = createDomNodeFromVNode(payload.node);

      if (!nextNode) {
        return;
      }

      const targetNode = getNodeAtPath(currentRoot, path);

      if (!targetNode) {
        return;
      }

      const parentNode = targetNode.parentNode;

      if (!parentNode) {
        if (targetNode === currentRoot && path.length === 0) {
          currentRoot = nextNode;
        }
        return;
      }

      parentNode.replaceChild(nextNode, targetNode);

      if (targetNode === currentRoot) {
        currentRoot = nextNode;
      }

      return;
    }

    if (type === PATCH_TYPES.REMOVE_NODE) {
      const targetNode = getNodeAtPath(currentRoot, path);

      if (!targetNode) {
        return;
      }

      if (targetNode === currentRoot && path.length === 0) {
        currentRoot = null;
        return;
      }

      targetNode.parentNode?.removeChild(targetNode);
      return;
    }

    if (type === PATCH_TYPES.UPDATE_TEXT) {
      const targetNode = getNodeAtPath(currentRoot, path);

      if (!targetNode || targetNode.nodeType !== TEXT_NODE) {
        return;
      }

      targetNode.textContent = payload.textContent ?? "";
      return;
    }

    if (type === PATCH_TYPES.SET_ATTRIBUTE) {
      const targetNode = getNodeAtPath(currentRoot, path);

      if (!targetNode || targetNode.nodeType !== ELEMENT_NODE || !payload.name) {
        return;
      }

      targetNode.setAttribute(payload.name, payload.value ?? "");
      syncDomProperty(targetNode, payload.name, payload.value ?? "");
      return;
    }

    if (type === PATCH_TYPES.REMOVE_ATTRIBUTE) {
      const targetNode = getNodeAtPath(currentRoot, path);

      if (!targetNode || targetNode.nodeType !== ELEMENT_NODE || !payload.name) {
        return;
      }

      targetNode.removeAttribute(payload.name);
      clearDomProperty(targetNode, payload.name);
      return;
    }

    if (type === PATCH_TYPES.INSERT_CHILD) {
      const parentNode = getNodeAtPath(currentRoot, path);
      const nextNode = createDomNodeFromVNode(payload.node);

      if (!parentNode || parentNode.nodeType === TEXT_NODE || !nextNode) {
        return;
      }

      const referenceNode = parentNode.childNodes[payload.index] ?? null;
      parentNode.insertBefore(nextNode, referenceNode);
      return;
    }

    if (type === PATCH_TYPES.REMOVE_CHILD) {
      const parentNode = getNodeAtPath(currentRoot, path);

      if (!parentNode || parentNode.nodeType === TEXT_NODE) {
        return;
      }

      const childNode = parentNode.childNodes[payload.index];

      if (!childNode) {
        return;
      }

      parentNode.removeChild(childNode);
    }
  });

  return currentRoot;
}
