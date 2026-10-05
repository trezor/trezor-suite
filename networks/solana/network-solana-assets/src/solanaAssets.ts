import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana-types';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<SolanaNetworkSymbol, NetworkIconAsset> = {
    dsol: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/dsol.svg'),
            network: require('../assets/networkIcons/sol.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/dsol.svg'),
            network: require.resolve('../assets/networkIcons/sol.svg'),
        }),
    },
    sol: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/sol.svg'),
            network: require('../assets/networkIcons/sol.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/sol.svg'),
            network: require.resolve('../assets/networkIcons/sol.svg'),
        }),
    },
};

export const solanaAssets: NetworkAssetsModule<SolanaNetworkSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
