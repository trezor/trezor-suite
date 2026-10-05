import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { RippleNetworkSymbol } from '@trezor/network-ripple-types';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<RippleNetworkSymbol, NetworkIconAsset> = {
    txrp: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/txrp.svg'),
            network: require('../assets/networkIcons/xrp.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/txrp.svg'),
            network: require.resolve('../assets/networkIcons/xrp.svg'),
        }),
    },
    xrp: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/xrp.svg'),
            network: require('../assets/networkIcons/xrp.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xrp.svg'),
            network: require.resolve('../assets/networkIcons/xrp.svg'),
        }),
    },
};

export const rippleAssets: NetworkAssetsModule<RippleNetworkSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
