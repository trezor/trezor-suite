import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    arb: () => ({
        coin: require('../assets/cryptoIcons/arb.svg'),
        network: require('../assets/networkIcons/arb.svg'),
    }),
    avax: () => ({
        coin: require('../assets/cryptoIcons/avax.svg'),
        network: require('../assets/networkIcons/avax.svg'),
    }),
    base: () => ({
        coin: require('../assets/cryptoIcons/base.svg'),
        network: require('../assets/networkIcons/base.svg'),
    }),
    bsc: () => ({
        coin: require('../assets/cryptoIcons/bsc.svg'),
        network: require('../assets/networkIcons/bsc.svg'),
    }),
    etc: () => ({
        coin: require('../assets/cryptoIcons/etc.svg'),
        network: require('../assets/networkIcons/etc.svg'),
    }),
    eth: () => ({
        coin: require('../assets/cryptoIcons/eth.svg'),
        network: require('../assets/networkIcons/eth.svg'),
    }),
    hype: () => ({
        coin: require('../assets/cryptoIcons/hype.svg'),
        network: require('../assets/networkIcons/hype.svg'),
    }),
    op: () => ({
        coin: require('../assets/cryptoIcons/op.svg'),
        network: require('../assets/networkIcons/op.svg'),
    }),
    pol: () => ({
        coin: require('../assets/cryptoIcons/pol.svg'),
        network: require('../assets/networkIcons/pol.svg'),
    }),
    rhc: () => ({
        coin: require('../assets/cryptoIcons/rhc.svg'),
        network: require('../assets/networkIcons/rhc.svg'),
    }),
    teth: () => ({
        coin: require('../assets/cryptoIcons/teth.svg'),
        network: require('../assets/networkIcons/eth.svg'),
    }),
    thod: () => ({
        coin: require('../assets/cryptoIcons/thod.svg'),
        network: require('../assets/networkIcons/eth.svg'),
    }),
    tsep: () => ({
        coin: require('../assets/cryptoIcons/tsep.svg'),
        network: require('../assets/networkIcons/eth.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type EthereumAssetSymbol = keyof typeof icons;

export const ethereumAssets: NetworkAssetsModule<EthereumAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
