import type React from 'react';
import { createContext } from 'react';

export type LayoutContextPayload = {
    title?: string;
    layoutHeader?: React.ReactNode;
    layoutFooter?: React.ReactNode;
};

/**
 * Setter for the layout payload, used by the `useLayout` hook. It has to stay apart from the
 * payload itself: pages are the ones calling `useLayout`, so reading the payload from the same
 * context would re-render every page on every publish and feed the next element back into the
 * effect.
 */
export const LayoutSetterContext = createContext<(payload: LayoutContextPayload) => void>(() => {});

export const LayoutPayloadContext = createContext<LayoutContextPayload>({});
