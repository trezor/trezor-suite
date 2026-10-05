import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import { typedObjectKeys } from '@trezor/utils';

export type EthereumAssetSymbol = EthereumNetworkSymbol | 'bnb' | 'teth';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<EthereumAssetSymbol, NetworkIconAsset> = {
    arb: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/arb.svg'),
            network: require('../assets/networkIcons/arb.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/arb.svg'),
            network: require.resolve('../assets/networkIcons/arb.svg'),
        }),
    },
    arc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/arc.svg'),
            network: require('../assets/networkIcons/arc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/arc.svg'),
            network: require.resolve('../assets/networkIcons/arc.svg'),
        }),
    },
    avax: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/avax.svg'),
            network: require('../assets/networkIcons/avax.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/avax.svg'),
            network: require.resolve('../assets/networkIcons/avax.svg'),
        }),
    },
    base: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/base.svg'),
            network: require('../assets/networkIcons/base.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/base.svg'),
            network: require.resolve('../assets/networkIcons/base.svg'),
        }),
    },
    bnb: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/bnb.svg'),
            network: require('../assets/networkIcons/bsc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/bnb.svg'),
            network: require.resolve('../assets/networkIcons/bsc.svg'),
        }),
    },
    bsc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/bsc.svg'),
            network: require('../assets/networkIcons/bsc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/bsc.svg'),
            network: require.resolve('../assets/networkIcons/bsc.svg'),
        }),
    },
    etc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/etc.svg'),
            network: require('../assets/networkIcons/etc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/etc.svg'),
            network: require.resolve('../assets/networkIcons/etc.svg'),
        }),
    },
    eth: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/eth.svg'),
            network: require('../assets/networkIcons/eth.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/eth.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    hype: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/hype.svg'),
            network: require('../assets/networkIcons/hype.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/hype.svg'),
            network: require.resolve('../assets/networkIcons/hype.svg'),
        }),
    },
    op: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/op.svg'),
            network: require('../assets/networkIcons/op.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/op.svg'),
            network: require.resolve('../assets/networkIcons/op.svg'),
        }),
    },
    pol: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/pol.svg'),
            network: require('../assets/networkIcons/pol.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/pol.svg'),
            network: require.resolve('../assets/networkIcons/pol.svg'),
        }),
    },
    rhc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/rhc.svg'),
            network: require('../assets/networkIcons/rhc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/rhc.svg'),
            network: require.resolve('../assets/networkIcons/rhc.svg'),
        }),
    },
    tarc: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/tarc.svg'),
            network: require('../assets/networkIcons/arc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/tarc.svg'),
            network: require.resolve('../assets/networkIcons/arc.svg'),
        }),
    },
    teth: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/teth.svg'),
            network: require('../assets/networkIcons/eth.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/teth.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    thod: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/thod.svg'),
            network: require('../assets/networkIcons/eth.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/thod.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    tsep: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/tsep.svg'),
            network: require('../assets/networkIcons/eth.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/tsep.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
};

export const ethereumAssets: NetworkAssetsModule<EthereumAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
