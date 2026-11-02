import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';

export type BitcoinAssetSymbol = BitcoinNetworkSymbol | 'btg' | 'dash' | 'dgb' | 'nmc' | 'vtc';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<BitcoinAssetSymbol, NetworkIconAsset> = {
    bch: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/bch.svg');
            const network = require('../assets/networkIcons/bch.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/bch.svg'),
            network: require.resolve('../assets/networkIcons/bch.svg'),
        }),
    },
    btc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/btc.svg');
            const network = require('../assets/networkIcons/btc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/btc.svg'),
            network: require.resolve('../assets/networkIcons/btc.svg'),
        }),
    },
    btg: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/btg.svg');
            const network = require('../assets/networkIcons/btg.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/btg.svg'),
            network: require.resolve('../assets/networkIcons/btg.svg'),
        }),
    },
    dash: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/dash.svg');
            const network = require('../assets/networkIcons/dash.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/dash.svg'),
            network: require.resolve('../assets/networkIcons/dash.svg'),
        }),
    },
    dgb: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/dgb.svg');
            const network = require('../assets/networkIcons/dgb.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/dgb.svg'),
            network: require.resolve('../assets/networkIcons/dgb.svg'),
        }),
    },
    doge: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/doge.svg');
            const network = require('../assets/networkIcons/doge.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/doge.svg'),
            network: require.resolve('../assets/networkIcons/doge.svg'),
        }),
    },
    ltc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/ltc.svg');
            const network = require('../assets/networkIcons/ltc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/ltc.svg'),
            network: require.resolve('../assets/networkIcons/ltc.svg'),
        }),
    },
    nmc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/nmc.svg');
            const network = require('../assets/networkIcons/nmc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/nmc.svg'),
            network: require.resolve('../assets/networkIcons/nmc.svg'),
        }),
    },
    regtest: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/regtest.svg');
            const network = require('../assets/networkIcons/btc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/regtest.svg'),
            network: require.resolve('../assets/networkIcons/btc.svg'),
        }),
    },
    test: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/test.svg');
            const network = require('../assets/networkIcons/btc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/test.svg'),
            network: require.resolve('../assets/networkIcons/btc.svg'),
        }),
    },
    vtc: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/vtc.svg');
            const network = require('../assets/networkIcons/vtc.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/vtc.svg'),
            network: require.resolve('../assets/networkIcons/vtc.svg'),
        }),
    },
    zec: {
        getIcons: () => {
            const coin = require('../assets/cryptoIcons/zec.svg');
            const network = require('../assets/networkIcons/zec.svg');

            return {
                coin: coin.default ?? coin,
                network: network.default ?? network,
            };
        },
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/zec.svg'),
            network: require.resolve('../assets/networkIcons/zec.svg'),
        }),
    },
};

export const bitcoinAssets: NetworkAssetsModule<BitcoinAssetSymbol> = {
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
