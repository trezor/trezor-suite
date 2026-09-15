import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    trx: () => ({
        coin: require('../assets/cryptoIcons/trx.svg'),
        network: require('../assets/networkIcons/trx.svg'),
    }),
    ttrx: () => ({
        coin: require('../assets/cryptoIcons/ttrx.svg'),
        network: require('../assets/networkIcons/trx.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type TronAssetSymbol = keyof typeof icons;

export const tronAssets: NetworkAssetsModule<TronAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
