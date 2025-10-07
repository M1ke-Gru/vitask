import { useCallback, useMemo, useState } from "react";
import { nanoid } from "nanoid";

function sortTasks(ts) {
  return [...ts].sort((a, b) => {
    const aDone = a.isDone ? 1 : 0;
    const bDone = b.isDone ? 1 : 0;
    return (aDone - bDone) || a.name.localeCompare(b.name);
  });
}

export function useTasks(initial) {
  const [tasks, setTasks] = useState(
    initial ?? ["C", "E", "D", "A", "F", "B"].map(name => ({ id: nanoid(), name, isDone: false }))
  );
  const [showDone, setShowDone] = useState(true);
  const [draft, setDraft] = useState("");

  const toggleDone = useCallback((id) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, isDone: !t.isDone } : t)));
  }, []);

  const add = useCallback(() => {
    const name = draft.trim();
    if (!name) return;
    setTasks(prev => [...prev, { id: nanoid(), name, isDone: false }]);
    setDraft("");
  }, [draft]);

  const remove = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.isDone));
  }, []);

  const visible = useMemo(() => {
    const base = showDone ? tasks : tasks.filter(t => !t.isDone);
    return sortTasks(base);
  }, [tasks, showDone]);

  const stats = useMemo(() => {
    const done = tasks.reduce((acc, t) => acc + (t.isDone ? 1 : 0), 0);
    return { total: tasks.length, done, open: tasks.length - done };
  }, [tasks]);

  return {
    draft, setDraft,
    showDone, setShowDone,
    visible, stats,
    add, remove, toggleDone, clearFinished,
  };
}

