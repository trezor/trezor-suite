import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { TronNetworkSymbol } from '@trezor/network-tron-types';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<TronNetworkSymbol, NetworkIconAsset> = {
    trx: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/trx.svg');
            const network = require('../assets/networkIcons/trx.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/trx.svg'),
            network: require.resolve('../assets/networkIcons/trx.svg'),
        }),
    },
    ttrx: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/ttrx.svg');
            const network = require('../assets/networkIcons/trx.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/ttrx.svg'),
            network: require.resolve('../assets/networkIcons/trx.svg'),
        }),
    },
};

export const tronAssets: NetworkAssetsModule<TronNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
