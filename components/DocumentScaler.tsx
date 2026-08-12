"use client";

import { useEffect, useRef, useState } from "react";

/** 210mm at 96dpi — the on-screen width of the A4 document. */
const A4_PX = 794;

/**
 * Fits the fixed-width A4 document into whatever room is available, so a phone
 * shows the whole page instead of a sideways-scrolling sliver. `zoom` is used
 * rather than `transform` because it reflows, leaving no leftover empty space
 * under the shrunken document.
 */
export default function DocumentScaler({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () =>
      setScale(el.clientWidth ? Math.min(1, el.clientWidth / A4_PX) : 1);

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <div className="doc-scale" style={{ zoom: scale }}>
        {children}
      </div>
    </div>
  );
}
