import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type TabsSize } from './types';

export const TabsContext = createContext<{
    size: TabsSize;
    isDisabled: boolean;
    setTabRef?: (id: string) => (el: HTMLDivElement) => void;
    activeItemId?: string;
}>({ size: 'medium', isDisabled: false });

export const useTabsContext = () =>
    useContext(TabsContext) ?? throwError('useTabsContext must be used within a TabsContext');
