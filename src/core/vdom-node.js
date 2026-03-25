/**
 * Owner: Role 1 - Virtual DOM Core
 * Editable only by the Role 1 branch.
 */

function normalizeAttributes(attributes = {}) {
  return Object.entries(attributes).reduce((result, [key, value]) => {
    result[String(key)] = String(value);
    return result;
  }, {});
}

function normalizeChildren(children = []) {
  return children.filter((child) => child !== null && child !== undefined);
}

export function createElementVNode(tagName, attributes = {}, children = []) {
  return {
    type: "element",
    tagName: String(tagName).toLowerCase(),
    attributes: normalizeAttributes(attributes),
    children: normalizeChildren(children),
    textContent: null,
  };
}

export function createTextVNode(textContent = "") {
  return {
    type: "text",
    tagName: null,
    attributes: {},
    children: [],
    textContent: String(textContent),
  };
}

export function cloneVNode(node) {
  if (!node) {
    return null;
  }

  if (node.type === "text") {
    return createTextVNode(node.textContent ?? "");
  }

  return {
    type: "element",
    tagName: String(node.tagName ?? "").toLowerCase(),
    attributes: normalizeAttributes(node.attributes ?? {}),
    children: (node.children ?? []).map((child) => cloneVNode(child)),
    textContent: null,
  };
}
