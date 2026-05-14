import { createContext, useContext } from 'react';

import { DEFAULT_INTENT } from './consts';
import { type BannerIntent } from './types';

export const BannerContext = createContext<{
    intent?: BannerIntent;
}>({ intent: DEFAULT_INTENT });

export const useBannerContext = () => {
    const context = useContext(BannerContext);
    if (!context) {
        throw new Error('useBannerContextContext must be used within a BannerContext');
    }

    return context;
};
