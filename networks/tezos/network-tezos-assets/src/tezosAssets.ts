import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    xtz: () => ({
        coin: require('../assets/cryptoIcons/xtz.svg'),
        network: require('../assets/networkIcons/xtz.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type TezosAssetSymbol = keyof typeof icons;

export const tezosAssets: NetworkAssetsModule<TezosAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
