/**
 * Owner: Role 4 - History / App Controller
 * Editable only by the Role 4 branch.
 */

export function createHistoryManager(limit = 20) {
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  const entries = [];
  let currentIndex = -1;

  function cloneSnapshot(vNode) {
    return vNode == null ? null : structuredClone(vNode);
  }

  function current() {
    if (currentIndex < 0 || currentIndex >= entries.length) {
      return null;
    }

    return cloneSnapshot(entries[currentIndex]);
  }

  function push(vNode) {
    const snapshot = cloneSnapshot(vNode);

    if (snapshot == null) {
      throw new Error("createHistoryManager.push(vNode) requires a VNode");
    }

    if (currentIndex < entries.length - 1) {
      entries.splice(currentIndex + 1);
    }

    entries.push(snapshot);

    if (entries.length > normalizedLimit) {
      const overflowCount = entries.length - normalizedLimit;
      entries.splice(0, overflowCount);
      currentIndex = Math.max(-1, currentIndex - overflowCount);
    }

    currentIndex = entries.length - 1;

    return current();
  }

  function undo() {
    if (!canUndo()) {
      return current();
    }

    currentIndex -= 1;
    return current();
  }

  function redo() {
    if (!canRedo()) {
      return current();
    }

    currentIndex += 1;
    return current();
  }

  function canUndo() {
    return currentIndex > 0;
  }

  function canRedo() {
    return currentIndex >= 0 && currentIndex < entries.length - 1;
  }

  function index() {
    return currentIndex;
  }

  function size() {
    return entries.length;
  }

  return {
    push,
    undo,
    redo,
    current,
    canUndo,
    canRedo,
    index,
    size,
  };
}
