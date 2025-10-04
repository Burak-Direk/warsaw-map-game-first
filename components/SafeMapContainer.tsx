'use client';

import { LeafletProvider, createLeafletContext } from '@react-leaflet/core';
import type { MapContainerProps } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

type LeafletContext = ReturnType<typeof createLeafletContext> | null;

type LeafletContainerElement = HTMLDivElement & { _leaflet_id?: unknown };

type Props = MapContainerProps & {
  children?: ReactNode;
};

const SafeMapContainer = forwardRef<LeafletMap | null, Props>(
  (
    { bounds, boundsOptions, center, children, className, id, placeholder, style, whenReady, zoom, ...options },
    forwardedRef,
  ) => {
    const [context, setContext] = useState<LeafletContext>(null);
    const [staticProps] = useState(() => ({ className, id, style }));

    useImperativeHandle(forwardedRef, () => context?.map ?? null, [context]);

    const mapRef = useCallback(
      (node: LeafletContainerElement | null) => {
        if (node === null || context !== null) {
          return;
        }

        if (node._leaflet_id != null) {
          try {
            delete node._leaflet_id;
          } catch {
            node._leaflet_id = undefined;
          }

        }

        const map = new LeafletMap(node, options);

        if (center && zoom != null) {
          map.setView(center, zoom);
        } else if (bounds) {
          map.fitBounds(bounds, boundsOptions);
        }

        if (whenReady) {
          map.whenReady(whenReady);
        }

        setContext(createLeafletContext(map));
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [bounds, boundsOptions, center, context, whenReady, zoom],
    );

    useEffect(() => {
      return () => {
        if (!context?.map) {
          return;
        }

        const container = context.map.getContainer() as LeafletContainerElement;
        context.map.remove();
        if (container && container._leaflet_id != null) {
          delete container._leaflet_id;
        }
      };
    }, [context]);

    const contents = useMemo(() => {
      if (!context) {
        return placeholder ?? null;
      }
      return <LeafletProvider value={context}>{children}</LeafletProvider>;
    }, [children, context, placeholder]);

    return (
      <div {...staticProps} ref={mapRef}>
        {contents}
      </div>
    );
  },
);

SafeMapContainer.displayName = 'SafeMapContainer';

export default SafeMapContainer;

