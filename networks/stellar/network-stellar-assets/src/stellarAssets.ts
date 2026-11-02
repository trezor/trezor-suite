import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar-types';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<StellarNetworkSymbol, NetworkIconAsset> = {
    txlm: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/txlm.svg');
            const network = require('../assets/networkIcons/xlm.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/txlm.svg'),
            network: require.resolve('../assets/networkIcons/xlm.svg'),
        }),
    },
    xlm: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/xlm.svg');
            const network = require('../assets/networkIcons/xlm.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xlm.svg'),
            network: require.resolve('../assets/networkIcons/xlm.svg'),
        }),
    },
};

export const stellarAssets: NetworkAssetsModule<StellarNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
