/**
 * Owner: Role 1 - Virtual DOM Core
 * Editable only by the Role 1 branch.
 */

import { createElementVNode, createTextVNode } from "./vdom-node.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const URL_ATTRS = new Set(["href", "src", "xlink:href", "formaction"]);

function isWhitespaceOnlyText(node) {
  return node?.nodeType === TEXT_NODE && (node.textContent ?? "").trim() === "";
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

function readLiveAttributes(node) {
  const attributes = Array.from(node.attributes).reduce((result, attribute) => {
    if (!isUnsafeAttribute(attribute.name, attribute.value)) {
      result[attribute.name] = attribute.value;
    }

    return result;
  }, {});

  if (node instanceof HTMLInputElement) {
    if (node.type === "checkbox" || node.type === "radio") {
      if (node.checked) {
        attributes.checked = "checked";
      } else {
        delete attributes.checked;
      }
    }

    if (!["checkbox", "radio", "file"].includes(node.type)) {
      attributes.value = node.value ?? "";
    }
  }

  if (node instanceof HTMLTextAreaElement) {
    attributes.value = node.value ?? "";
  }

  if (node instanceof HTMLOptionElement) {
    if (node.selected) {
      attributes.selected = "selected";
    } else {
      delete attributes.selected;
    }
  }

  if (node instanceof HTMLSelectElement && !node.multiple) {
    attributes.value = node.value ?? "";
  }

  return attributes;
}

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

  const attributes = readLiveAttributes(node);
  const children = Array.from(node.childNodes)
    .filter((childNode) => !isWhitespaceOnlyText(childNode))
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
