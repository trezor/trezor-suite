import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    txlm: () => ({
        coin: require('../assets/cryptoIcons/txlm.svg'),
        network: require('../assets/networkIcons/xlm.svg'),
    }),
    xlm: () => ({
        coin: require('../assets/cryptoIcons/xlm.svg'),
        network: require('../assets/networkIcons/xlm.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type StellarAssetSymbol = keyof typeof icons;

export const stellarAssets: NetworkAssetsModule<StellarAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
