import { ComponentType } from 'react';
import { useLayout } from '@suite-hooks';

export const useCoinmarketLayout = (topMenu?: ComponentType) => {
    useLayout('Trezor Suite | Trade', topMenu);
};
