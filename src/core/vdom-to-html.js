/**
 * Owner: Role 1 - Virtual DOM Core
 * Editable only by the Role 1 branch.
 */

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

export function vNodeToHtml(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return escapeHtml(node.textContent ?? "");
  }

  const tagName = String(node.tagName ?? "").toLowerCase();
  const attributes = Object.entries(node.attributes ?? {})
    .map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
    .join("");

  if (VOID_ELEMENTS.has(tagName)) {
    return `<${tagName}${attributes}>`;
  }

  const childrenHtml = (node.children ?? []).map((child) => vNodeToHtml(child)).join("");
  return `<${tagName}${attributes}>${childrenHtml}</${tagName}>`;
}
