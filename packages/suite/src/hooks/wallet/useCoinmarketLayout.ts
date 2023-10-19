import { ComponentType } from 'react';
import { useLayout } from 'src/hooks/suite';

export const useCoinmarketLayout = (topMenu?: ComponentType) => {
    useLayout('Trezor Suite | Trade', topMenu);
};
