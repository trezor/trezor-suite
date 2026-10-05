import type { NetworkIcon } from '@trezor/network-assets-types';

export type ProductComponentsIconServices = Omit<NetworkIcon, 'getIcon' | 'getIconPaths'>;

export type ProductComponentsServices = {
    networks: {
        networkIcon: ProductComponentsIconServices;
    };
};
