import { createContext, useContext } from 'react';
import { BannerVariant } from './types';

export const BannerContext = createContext<{
    variant?: BannerVariant;
}>({ variant: undefined });

export const useBannerContext = () => {
    const context = useContext(BannerContext);
    if (!context) {
        throw new Error('useBannerContextContext must be used within a BannerContext');
    }

    return context;
};
