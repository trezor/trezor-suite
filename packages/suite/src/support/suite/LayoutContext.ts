import type React from 'react';
import { createContext } from 'react';

export type LayoutContextPayload = {
    title?: string;
    layoutHeader?: React.ReactNode;
    layoutFooter?: React.ReactNode;
};

export const LayoutContext = createContext<(payload: LayoutContextPayload) => void>(() => {});
