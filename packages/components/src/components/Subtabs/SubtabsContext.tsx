import { createContext, useContext } from 'react';

import { SubtabsSize } from './types';

export const SubtabsContext = createContext<{
    activeItemId?: string;
    size: SubtabsSize;
}>({ size: 'medium' });

export const useSubtabsContext = () => {
    const context = useContext(SubtabsContext);

    if (!context) {
        throw new Error('useSubtabsContext must be used within a SubtabsContext');
    }

    return context;
};
