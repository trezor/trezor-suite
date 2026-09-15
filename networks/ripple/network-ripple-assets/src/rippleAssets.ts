import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    txrp: () => ({
        coin: require('../assets/cryptoIcons/txrp.svg'),
        network: require('../assets/networkIcons/xrp.svg'),
    }),
    xrp: () => ({
        coin: require('../assets/cryptoIcons/xrp.svg'),
        network: require('../assets/networkIcons/xrp.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type RippleAssetSymbol = keyof typeof icons;

export const rippleAssets: NetworkAssetsModule<RippleAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
