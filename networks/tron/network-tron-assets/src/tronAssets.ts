import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { TronNetworkSymbol } from '@trezor/network-tron-types';

import { tronCryptoIcons } from './cryptoIcons';
import { tronNetworkIcons } from './networkIcons';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<TronNetworkSymbol, NetworkIconAsset> = {
    trx: {
        getIcons: () => ({
            coin: tronCryptoIcons.trx.getIcon(),
            network: tronNetworkIcons.trx.getIcon(),
        }),
        getIconPaths: () => ({
            coin: tronCryptoIcons.trx.getIconPath(),
            network: tronNetworkIcons.trx.getIconPath(),
        }),
    },
    ttrx: {
        getIcons: () => ({
            coin: tronCryptoIcons.ttrx.getIcon(),
            network: tronNetworkIcons.trx.getIcon(),
        }),
        getIconPaths: () => ({
            coin: tronCryptoIcons.ttrx.getIconPath(),
            network: tronNetworkIcons.trx.getIconPath(),
        }),
    },
};

export const tronAssets: NetworkAssetsModule<TronNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
