import type React from 'react';
import { createContext } from 'react';

export type LayoutContextPayload = {
    title?: string;
    layoutHeader?: React.ReactNode;
    layoutFooter?: React.ReactNode;
    /**
     * Hands the whole content area to the page: no max width, no padding and no scrolling, so the
     * page owns a region whose size follows the window. Needed by anything painted outside the DOM
     * — the desktop `WebContentsView` embedding host has to be told where to sit, and it can only
     * follow a region that never scrolls out from under it.
     */
    isContentStatic?: boolean;
};

/**
 * Setter for the layout payload, used by the `useLayout` hook. It has to stay apart from the
 * payload itself: pages are the ones calling `useLayout`, so reading the payload from the same
 * context would re-render every page on every publish and feed the next element back into the
 * effect.
 */
export const LayoutSetterContext = createContext<(payload: LayoutContextPayload) => void>(() => {});

export const LayoutPayloadContext = createContext<LayoutContextPayload>({});
