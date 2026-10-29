import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const SIZE = 56;
const GAP = 12;
const KEY = "energy-chat-position";
function clamp(position: { x: number; y: number }) {
  return {
    x: Math.max(GAP, Math.min(position.x, window.innerWidth - SIZE - GAP)),
    y: Math.max(GAP, Math.min(position.y, window.innerHeight - SIZE - GAP)),
  };
}

export function useChatLauncher() {
  const [position, setPosition] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return clamp(saved);
    } catch { /* Storage is optional. */ }
    return clamp({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  });
  const drag = useRef<{ x: number; y: number; origin: typeof position } | null>(null);
  const moved = useRef(false);
  useEffect(() => {
    const resize = () => setPosition((current) => clamp(current));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(position)); } catch { /* Optional. */ }
  }, [position]);
  return {
    position,
    moved,
    move: (x: number, y: number) => setPosition((current) => clamp({ x: current.x + x, y: current.y + y })),
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      moved.current = false;
      drag.current = { x: event.clientX, y: event.clientY, origin: position };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!drag.current) return;
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      if (Math.hypot(dx, dy) > 6) moved.current = true;
      if (moved.current) setPosition(clamp({ x: drag.current.origin.x + dx, y: drag.current.origin.y + dy }));
    },
    onPointerUp: () => { drag.current = null; },
    onPointerCancel: () => { drag.current = null; moved.current = true; },
  };
}
