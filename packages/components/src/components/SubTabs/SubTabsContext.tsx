import { createContext, useContext } from 'react';

import { SubTabsSize } from './types';

export const SubTabsContext = createContext<{
    activeItemId?: string;
    size: SubTabsSize;
}>({ size: 'medium' });

export const useSubTabsContext = () => {
    const context = useContext(SubTabsContext);

    if (!context) {
        throw new Error('useSubTabsContext must be used within a SubTabsContext');
    }

    return context;
};
