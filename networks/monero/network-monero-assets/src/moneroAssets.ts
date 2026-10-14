import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { MoneroNetworkSymbol } from '@trezor/network-monero-types';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<MoneroNetworkSymbol, NetworkIconAsset> = {
    xmr: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/xmr.svg');
            const network = require('../assets/networkIcons/xmr.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xmr.svg'),
            network: require.resolve('../assets/networkIcons/xmr.svg'),
        }),
    },
};

export const moneroAssets: NetworkAssetsModule<MoneroNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
