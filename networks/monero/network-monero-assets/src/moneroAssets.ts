import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    xmr: () => ({
        coin: require('../assets/cryptoIcons/xmr.svg'),
        network: require('../assets/networkIcons/xmr.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type MoneroAssetSymbol = keyof typeof icons;

export const moneroAssets: NetworkAssetsModule<MoneroAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
