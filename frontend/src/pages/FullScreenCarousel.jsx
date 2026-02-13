import React, { useEffect, useRef, useState } from "react";

export default function FullScreenCarousel({ images = [] }) {
  const hasLoop = images.length > 1;
  const slides = hasLoop ? [images[images.length - 1], ...images, images[0]] : images;

  const trackRef = useRef(null);
  const wrapRef = useRef(null);

  const [index, setIndex] = useState(hasLoop ? 1 : 0);
  const startX = useRef(0);
  const deltaX = useRef(0);
  const dragging = useRef(false);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const getWrapWidth = () => wrapRef.current?.getBoundingClientRect().width || window.innerWidth;

  const snapTo = (i, withTransition = true) => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = withTransition ? "transform .35s ease" : "none";
    trackRef.current.style.transform = `translateX(${-i * 100}%)`;
  };

  useEffect(() => { snapTo(index, true); }, [index]);

  const onTouchStart = (e) => {
    if (!hasLoop) return;
    dragging.current = true;
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
    if (trackRef.current) trackRef.current.style.transition = "none";
  };

  const onTouchMove = (e) => {
    if (!dragging.current || !hasLoop) return;
    const width = getWrapWidth();
    deltaX.current = e.touches[0].clientX - startX.current;
    const basePct = -index * 100;
    const dragPct = (deltaX.current / width) * 100;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${basePct + dragPct}%)`;
  };

  const onTouchEnd = () => {
    if (!dragging.current || !hasLoop) return;
    dragging.current = false;
    const width = getWrapWidth();
    const threshold = Math.max(40, width * 0.12);
    let next = index;
    if (deltaX.current > threshold) next = index - 1;
    if (deltaX.current < -threshold) next = index + 1;
    setIndex(clamp(next, 0, slides.length - 1));
  };

  const onTransitionEnd = () => {
    if (!hasLoop || !trackRef.current) return;
    if (index === 0) {
      const real = images.length;
      snapTo(real, false);
      setIndex(real);
    } else if (index === slides.length - 1) {
      const real = 1;
      snapTo(real, false);
      setIndex(real);
    }
  };

  return (
    <div className="fs-carousel" ref={wrapRef} aria-roledescription="carousel">
      <div
        className="fs-track"
        ref={trackRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={onTransitionEnd}
        style={{ transform: `translateX(${-index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <figure className="fs-slide" key={`${i}-${src}`}>
            <img src={src} alt="" />
          </figure>
        ))}
      </div>
    </div>
  );
}
