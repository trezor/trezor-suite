import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    dsol: () => ({
        coin: require('../assets/cryptoIcons/dsol.svg'),
        network: require('../assets/networkIcons/sol.svg'),
    }),
    sol: () => ({
        coin: require('../assets/cryptoIcons/sol.svg'),
        network: require('../assets/networkIcons/sol.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type SolanaAssetSymbol = keyof typeof icons;

export const solanaAssets: NetworkAssetsModule<SolanaAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
