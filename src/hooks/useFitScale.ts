import { useEffect, useRef, useState } from 'react';

/** A4 width at 96dpi (210mm ≈ 793.7px) */
export const A4_WIDTH_PX = 794;

/**
 * Scale factor that makes content of `contentWidth` px fit the width of a container.
 * Attach the returned ref to the container.
 */
export default function useFitScale<T extends HTMLElement = HTMLDivElement>(
  contentWidth: number = A4_WIDTH_PX,
  { gutter = 0, maxScale = Infinity, initialScale = 1 } = {}
) {
  const containerRef = useRef<T>(null);
  const [scale, setScale] = useState(initialScale);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const available = entry.contentRect.width - gutter * 2;
        if (available > 0) setScale(Math.min(maxScale, available / contentWidth));
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [contentWidth, gutter, maxScale]);

  return { containerRef, scale };
}
