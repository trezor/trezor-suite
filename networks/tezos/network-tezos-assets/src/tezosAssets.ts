import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { TezosNetworkSymbol } from '@trezor/network-tezos-types';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<TezosNetworkSymbol, NetworkIconAsset> = {
    xtz: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/xtz.svg');
            const network = require('../assets/networkIcons/xtz.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/xtz.svg'),
            network: require.resolve('../assets/networkIcons/xtz.svg'),
        }),
    },
};

export const tezosAssets: NetworkAssetsModule<TezosNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
