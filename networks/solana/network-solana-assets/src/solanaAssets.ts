import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana-types';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<SolanaNetworkSymbol, NetworkIconAsset> = {
    dsol: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/dsol.svg');
            const network = require('../assets/networkIcons/sol.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/dsol.svg'),
            network: require.resolve('../assets/networkIcons/sol.svg'),
        }),
    },
    sol: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/sol.svg');
            const network = require('../assets/networkIcons/sol.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/sol.svg'),
            network: require.resolve('../assets/networkIcons/sol.svg'),
        }),
    },
};

export const solanaAssets: NetworkAssetsModule<SolanaNetworkSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
