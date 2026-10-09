import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { TezosNetworkSymbol } from '@trezor/network-tezos-types';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<TezosNetworkSymbol, NetworkIconAsset> = {
    xtz: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/xtz.svg'),
            network: require('../assets/networkIcons/xtz.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xtz.svg'),
            network: require.resolve('../assets/networkIcons/xtz.svg'),
        }),
    },
};

export const tezosAssets: NetworkAssetsModule<TezosNetworkSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
