/**
 * Owner: Role 1 - Virtual DOM Core
 * Editable only by the Role 1 branch.
 */

export function createElementVNode(tagName, attributes = {}, children = []) {
  return {
    type: "element",
    tagName,
    attributes,
    children,
    textContent: null,
  };
}

export function createTextVNode(textContent = "") {
  return {
    type: "text",
    tagName: null,
    attributes: {},
    children: [],
    textContent,
  };
}

export function cloneVNode(node) {
  return node ? structuredClone(node) : null;
}

