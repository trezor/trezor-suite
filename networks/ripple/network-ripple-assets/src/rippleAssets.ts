import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { RippleNetworkSymbol } from '@trezor/network-ripple-types';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<RippleNetworkSymbol, NetworkIconAsset> = {
    txrp: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/txrp.svg');
            const network = require('../assets/networkIcons/xrp.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/txrp.svg'),
            network: require.resolve('../assets/networkIcons/xrp.svg'),
        }),
    },
    xrp: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/xrp.svg');
            const network = require('../assets/networkIcons/xrp.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xrp.svg'),
            network: require.resolve('../assets/networkIcons/xrp.svg'),
        }),
    },
};

export const rippleAssets: NetworkAssetsModule<RippleNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
