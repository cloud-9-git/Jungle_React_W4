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
const BOOLEAN_ATTRIBUTES = new Set(["checked", "selected", "disabled", "readonly", "multiple"]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function serializeAttributes(tagName, attributes) {
  return Object.entries(attributes ?? {})
    .filter(([key]) => !(tagName === "textarea" && key === "value"))
    .filter(([key]) => !(tagName === "select" && key === "value"))
    .map(([key, value]) => {
      if (BOOLEAN_ATTRIBUTES.has(key)) {
        return value === false || value == null ? "" : ` ${key}=""`;
      }

      return ` ${key}="${escapeAttribute(value)}"`;
    })
    .join("");
}

export function vNodeToHtml(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return escapeHtml(node.textContent ?? "");
  }

  const tagName = String(node.tagName ?? "").toLowerCase();
  const attributes = serializeAttributes(tagName, node.attributes ?? {});

  if (VOID_ELEMENTS.has(tagName)) {
    return `<${tagName}${attributes}>`;
  }

  if (tagName === "textarea") {
    const textValue = node.attributes?.value ?? "";
    return `<${tagName}${attributes}>${escapeHtml(textValue)}</${tagName}>`;
  }

  const childrenHtml = (node.children ?? []).map((child) => vNodeToHtml(child)).join("");
  return `<${tagName}${attributes}>${childrenHtml}</${tagName}>`;
}
