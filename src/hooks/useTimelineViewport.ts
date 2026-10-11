import { useEffect, useRef, useState } from 'react';

/** Visible portion of the timeline, accounting for both inner and page scrolling. */
export function useTimelineViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ top: 0, height: 560 });
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => {
      const bounds = element.getBoundingClientRect();
      const navigation = window.innerWidth < 1024 ? 88 : 0;
      const clippedTop = Math.max(0, -bounds.top);
      const visibleBottom = Math.min(
        element.clientHeight,
        window.innerHeight - navigation - bounds.top,
      );
      setViewport({
        top: element.scrollTop + clippedTop,
        height: Math.max(36, visibleBottom - clippedTop),
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return { ref, viewport };
}
