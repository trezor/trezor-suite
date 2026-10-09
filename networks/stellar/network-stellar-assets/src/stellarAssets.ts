import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar-types';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<StellarNetworkSymbol, NetworkIconAsset> = {
    txlm: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/txlm.svg'),
            network: require('../assets/networkIcons/xlm.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/txlm.svg'),
            network: require.resolve('../assets/networkIcons/xlm.svg'),
        }),
    },
    xlm: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/xlm.svg'),
            network: require('../assets/networkIcons/xlm.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xlm.svg'),
            network: require.resolve('../assets/networkIcons/xlm.svg'),
        }),
    },
};

export const stellarAssets: NetworkAssetsModule<StellarNetworkSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
