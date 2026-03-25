/**
 * Owner: Role 4 - History / App Controller
 * Editable only by the Role 4 branch.
 */

import { writeMarkup } from "../ui/editor-surface.js";

export function syncBothSurfaces(uiRefs, currentVNode, vNodeToHtml) {
  if (!uiRefs || typeof uiRefs !== "object") {
    throw new Error("syncBothSurfaces(uiRefs, currentVNode, vNodeToHtml) requires uiRefs");
  }

  const { actualSurface, testSurface } = uiRefs;

  if (!actualSurface || !testSurface) {
    throw new Error("syncBothSurfaces requires actualSurface and testSurface");
  }

  if (currentVNode == null) {
    throw new Error("syncBothSurfaces requires a currentVNode");
  }

  if (typeof vNodeToHtml !== "function") {
    throw new Error("syncBothSurfaces requires vNodeToHtml to be a function");
  }

  const markup = vNodeToHtml(currentVNode);

  if (typeof markup !== "string") {
    throw new Error("vNodeToHtml(currentVNode) must return a string");
  }

  writeMarkup(actualSurface, markup);
  writeMarkup(testSurface, markup);
}
