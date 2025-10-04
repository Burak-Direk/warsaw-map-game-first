// components/SnakePolyline.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';

type SnakePolylineProps = {
  points: LatLngExpression[];
  animKey?: string | number;
  durationMs?: number;
  pane?: string;
};

const DEFAULT_DURATION = 1600;
const EASING = 'cubic-bezier(0.55, 0.055, 0.675, 0.19)';

const SnakePolyline = ({
  points,
  animKey,
  durationMs = DEFAULT_DURATION,
  pane,
}: SnakePolylineProps) => {
  const map = useMap();
  const animationFrame = useRef<number>();
  const cleanupHandlers = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!points || points.length < 2) {
      return;
    }

    const polyline = L.polyline(points, {
      className: 'snake-line',
      interactive: false,
      pane,
      color: '#7dd3fc',
      weight: 4.5,
      opacity: 1,
      lineCap: 'round',
    });

    polyline.addTo(map);

    let isComplete = false;

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'stroke-dashoffset') return;
      const element = polyline.getElement() as SVGPathElement | null;
      if (!element) return;
      element.style.transition = 'none';
      element.style.strokeDasharray = 'none';
      element.style.strokeDashoffset = '0';
      isComplete = true;
    };

    const syncDashForZoom = () => {
      const element = polyline.getElement() as SVGPathElement | null;
      if (!element) return;

      if (isComplete || element.style.strokeDashoffset === '0') {
        element.style.transition = 'none';
        element.style.strokeDasharray = 'none';
        element.style.strokeDashoffset = '0';
        return;
      }

      const pathLength = element.getTotalLength();
      const currentOffset = parseFloat(element.style.strokeDashoffset || '0');
      const ratio = pathLength === 0 ? 0 : currentOffset / pathLength;
      element.style.transition = 'none';
      element.style.strokeDasharray = `${pathLength}`;
      element.style.strokeDashoffset = `${pathLength * ratio}`;
    };

    const runAnimation = () => {
      const element = polyline.getElement() as SVGPathElement | null;

      if (!element) {
        animationFrame.current = requestAnimationFrame(runAnimation);
        return;
      }

      isComplete = false;

      const length = element.getTotalLength();

      element.style.transition = 'none';
      element.style.strokeDasharray = `${length}`;
      element.style.strokeDashoffset = `${length}`;
      element.style.willChange = 'stroke-dashoffset';

      element.getBoundingClientRect();

      animationFrame.current = requestAnimationFrame(() => {
        element.style.transition = `stroke-dashoffset ${durationMs}ms ${EASING}`;
        element.style.strokeDashoffset = '0';
      });

      element.addEventListener('transitionend', handleTransitionEnd);
      cleanupHandlers.current.push(() => element.removeEventListener('transitionend', handleTransitionEnd));
    };

    animationFrame.current = requestAnimationFrame(runAnimation);

    const zoomHandler = () => syncDashForZoom();
    map.on('zoomend', zoomHandler);
    cleanupHandlers.current.push(() => map.off('zoomend', zoomHandler));

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      cleanupHandlers.current.forEach((fn) => fn());
      cleanupHandlers.current = [];
      map.removeLayer(polyline);
    };
  }, [map, points, animKey, durationMs, pane]);

  return null;
};

export default SnakePolyline;
