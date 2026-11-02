import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';

export type CardanoAssetSymbol = CardanoNetworkSymbol | 'tada';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<CardanoAssetSymbol, NetworkIconAsset> = {
    ada: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/ada.svg');
            const network = require('../assets/networkIcons/ada.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/ada.svg'),
            network: require.resolve('../assets/networkIcons/ada.svg'),
        }),
    },
    tada: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/tada.svg');
            const network = require('../assets/networkIcons/ada.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/tada.svg'),
            network: require.resolve('../assets/networkIcons/ada.svg'),
        }),
    },
};

export const cardanoAssets: NetworkAssetsModule<CardanoAssetSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
