import { createContext, ComponentType } from 'react';

export type SideMenuProps = {
    isMenuInline?: boolean;
};

export type LayoutContextPayload = {
    title?: string;
    TopMenu?: ComponentType;
};

export const LayoutContext = createContext<(payload: LayoutContextPayload) => void>(() => {});
