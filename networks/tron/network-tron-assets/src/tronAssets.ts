import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { TronNetworkSymbol } from '@trezor/network-tron-types';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<TronNetworkSymbol, NetworkIconAsset> = {
    trx: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/trx.svg'),
            network: require('../assets/networkIcons/trx.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/trx.svg'),
            network: require.resolve('../assets/networkIcons/trx.svg'),
        }),
    },
    ttrx: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/ttrx.svg'),
            network: require('../assets/networkIcons/trx.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/ttrx.svg'),
            network: require.resolve('../assets/networkIcons/trx.svg'),
        }),
    },
};

export const tronAssets: NetworkAssetsModule<TronNetworkSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
