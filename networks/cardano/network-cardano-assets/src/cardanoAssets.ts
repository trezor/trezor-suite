import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    ada: () => ({
        coin: require('../assets/cryptoIcons/ada.svg'),
        network: require('../assets/networkIcons/ada.svg'),
    }),
    tada: () => ({
        coin: require('../assets/cryptoIcons/tada.svg'),
        network: require('../assets/networkIcons/ada.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type CardanoAssetSymbol = keyof typeof icons;

export const cardanoAssets: NetworkAssetsModule<CardanoAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
