import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum-types';

export type EthereumAssetSymbol = EthereumNetworkSymbol | 'bnb' | 'gnt' | 'teth';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<EthereumAssetSymbol, NetworkIconAsset> = {
    arb: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/arb.svg');
            const network = require('../assets/networkIcons/arb.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/arb.svg'),
            network: require.resolve('../assets/networkIcons/arb.svg'),
        }),
    },
    arc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/arc.svg');
            const network = require('../assets/networkIcons/arc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/arc.svg'),
            network: require.resolve('../assets/networkIcons/arc.svg'),
        }),
    },
    avax: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/avax.svg');
            const network = require('../assets/networkIcons/avax.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/avax.svg'),
            network: require.resolve('../assets/networkIcons/avax.svg'),
        }),
    },
    base: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/base.svg');
            const network = require('../assets/networkIcons/base.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/base.svg'),
            network: require.resolve('../assets/networkIcons/base.svg'),
        }),
    },
    bnb: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/bnb.svg');
            const network = require('../assets/networkIcons/bsc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/bnb.svg'),
            network: require.resolve('../assets/networkIcons/bsc.svg'),
        }),
    },
    bsc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/bsc.svg');
            const network = require('../assets/networkIcons/bsc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/bsc.svg'),
            network: require.resolve('../assets/networkIcons/bsc.svg'),
        }),
    },
    etc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/etc.svg');
            const network = require('../assets/networkIcons/etc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/etc.svg'),
            network: require.resolve('../assets/networkIcons/etc.svg'),
        }),
    },
    eth: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/eth.svg');
            const network = require('../assets/networkIcons/eth.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/eth.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    gnt: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/gnt.svg');
            const network = require('../assets/networkIcons/eth.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/gnt.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    hype: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/hype.svg');
            const network = require('../assets/networkIcons/hype.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/hype.svg'),
            network: require.resolve('../assets/networkIcons/hype.svg'),
        }),
    },
    op: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/op.svg');
            const network = require('../assets/networkIcons/op.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/op.svg'),
            network: require.resolve('../assets/networkIcons/op.svg'),
        }),
    },
    pol: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/pol.svg');
            const network = require('../assets/networkIcons/pol.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/pol.svg'),
            network: require.resolve('../assets/networkIcons/pol.svg'),
        }),
    },
    rhc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/rhc.svg');
            const network = require('../assets/networkIcons/rhc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/rhc.svg'),
            network: require.resolve('../assets/networkIcons/rhc.svg'),
        }),
    },
    tarc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/tarc.svg');
            const network = require('../assets/networkIcons/arc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/tarc.svg'),
            network: require.resolve('../assets/networkIcons/arc.svg'),
        }),
    },
    teth: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/teth.svg');
            const network = require('../assets/networkIcons/eth.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/teth.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    thod: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/thod.svg');
            const network = require('../assets/networkIcons/eth.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/thod.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
    tsep: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/tsep.svg');
            const network = require('../assets/networkIcons/eth.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/tsep.svg'),
            network: require.resolve('../assets/networkIcons/eth.svg'),
        }),
    },
};

export const ethereumAssets: NetworkAssetsModule<EthereumAssetSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
