/**
 * Owner: Role 1 - Virtual DOM Core
 * Editable only by the Role 1 branch.
 */

import { createElementVNode, createTextVNode } from "./vdom-node.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export function domNodeToVNode(node) {
  if (!node) {
    throw new Error("domNodeToVNode requires a DOM node");
  }

  if (node.nodeType === TEXT_NODE) {
    return createTextVNode(node.textContent ?? "");
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return null;
  }

  const attributes = Array.from(node.attributes).reduce((result, attribute) => {
    result[attribute.name] = attribute.value;
    return result;
  }, {});

  const children = Array.from(node.childNodes)
    .map((childNode) => domNodeToVNode(childNode))
    .filter((childNode) => childNode !== null);

  return createElementVNode(node.tagName, attributes, children);
}

export function domSubtreeToVNode(rootElement) {
  const vnode = domNodeToVNode(rootElement);

  if (!vnode) {
    throw new Error("domSubtreeToVNode requires an element or text root");
  }

  return vnode;
}
