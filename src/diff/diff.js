/**
 * Owner: Role 2 - Diff / Patch Engine
 * Editable only by the Role 2 branch.
 */

import { PATCH_TYPES } from "./change-types.js";

export function diffVNodes(previousNode, nextNode, path = []) {
  if (!previousNode && !nextNode) {
    return [];
  }

  if (!previousNode && nextNode) {
    return [
      {
        type: PATCH_TYPES.REPLACE_NODE,
        path: [...path],
        payload: { node: nextNode },
      },
    ];
  }

  if (previousNode && !nextNode) {
    return [
      {
        type: PATCH_TYPES.REMOVE_NODE,
        path: [...path],
        payload: {},
      },
    ];
  }

  if (
    previousNode.type !== nextNode.type ||
    (previousNode.type === "element" && previousNode.tagName !== nextNode.tagName)
  ) {
    return [
      {
        type: PATCH_TYPES.REPLACE_NODE,
        path: [...path],
        payload: { node: nextNode },
      },
    ];
  }

  if (previousNode.type === "text" && nextNode.type === "text") {
    if (previousNode.textContent === nextNode.textContent) {
      return [];
    }

    return [
      {
        type: PATCH_TYPES.UPDATE_TEXT,
        path: [...path],
        payload: { textContent: nextNode.textContent ?? "" },
      },
    ];
  }

  const patches = [];
  const previousAttributes = previousNode.attributes ?? {};
  const nextAttributes = nextNode.attributes ?? {};

  Object.entries(nextAttributes).forEach(([name, value]) => {
    if (previousAttributes[name] !== value) {
      patches.push({
        type: PATCH_TYPES.SET_ATTRIBUTE,
        path: [...path],
        payload: { name, value },
      });
    }
  });

  Object.keys(previousAttributes).forEach((name) => {
    if (!(name in nextAttributes)) {
      patches.push({
        type: PATCH_TYPES.REMOVE_ATTRIBUTE,
        path: [...path],
        payload: { name },
      });
    }
  });

  const previousChildren = previousNode.children ?? [];
  const nextChildren = nextNode.children ?? [];
  const sharedLength = Math.min(previousChildren.length, nextChildren.length);

  for (let index = 0; index < sharedLength; index += 1) {
    const childPath = [...path, index];
    const childPatches = diffVNodes(previousChildren[index], nextChildren[index], childPath);

    childPatches.forEach((patch) => {
      if (patch.type === PATCH_TYPES.REMOVE_NODE) {
        patches.push({
          type: PATCH_TYPES.REMOVE_CHILD,
          path: [...path],
          payload: { index },
        });
        return;
      }

      patches.push(patch);
    });
  }

  for (let index = previousChildren.length - 1; index >= nextChildren.length; index -= 1) {
    patches.push({
      type: PATCH_TYPES.REMOVE_CHILD,
      path: [...path],
      payload: { index },
    });
  }

  for (let index = previousChildren.length; index < nextChildren.length; index += 1) {
    patches.push({
      type: PATCH_TYPES.INSERT_CHILD,
      path: [...path],
      payload: { index, node: nextChildren[index] },
    });
  }

  return patches;
}
