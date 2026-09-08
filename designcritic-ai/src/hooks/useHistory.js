import { useEffect, useRef, useState } from "react";
import { loadHistory, saveHistory } from "../history.js";

/**
 * Owns the analysis-history list: loads it from localStorage on mount,
 * persists it (with downscaled thumbnails, capped size) whenever it
 * changes, and exposes the same add/delete operations App.jsx used to
 * implement inline against useState. Kept as its own hook so the
 * persistence mechanism can be swapped out later (e.g. for a real backend)
 * without touching analysis/upload code.
 */
export function useHistory() {
  const [history, setHistory] = useState(() => loadHistory());
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first run — we just loaded this same data FROM
    // storage, no need to immediately re-thumbnail and write it back.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveHistory(history);
  }, [history]);

  function addToHistory(record) {
    setHistory((h) => [record, ...h]);
  }

  function deleteFromHistory(id) {
    setHistory((h) => h.filter((x) => x.id !== id));
  }

  return { history, addToHistory, deleteFromHistory };
}
