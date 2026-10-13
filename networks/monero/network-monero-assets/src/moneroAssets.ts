import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { MoneroNetworkSymbol } from '@trezor/network-monero-types';

import { moneroCryptoIcons } from './cryptoIcons';
import { moneroNetworkIcons } from './networkIcons';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<MoneroNetworkSymbol, NetworkIconAsset> = {
    xmr: {
        getIcons: () => ({
            coin: moneroCryptoIcons.xmr.getIcon(),
            network: moneroNetworkIcons.xmr.getIcon(),
        }),
        getIconPaths: () => ({
            coin: moneroCryptoIcons.xmr.getIconPath(),
            network: moneroNetworkIcons.xmr.getIconPath(),
        }),
    },
};

export const moneroAssets: NetworkAssetsModule<MoneroNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
