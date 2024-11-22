import { createContext, useContext } from 'react';

import { TabsSize } from './types';

export const TabsContext = createContext<{
    size: TabsSize;
    isDisabled: boolean;
    setTabRef?: (id: string) => (el: HTMLDivElement) => void;
    activeItemId?: string;
}>({ size: 'medium', isDisabled: false });

export const useTabsContext = () => {
    const context = useContext(TabsContext);

    if (!context) {
        throw new Error('useTabsContext must be used within a TabsContext');
    }

    return context;
};
