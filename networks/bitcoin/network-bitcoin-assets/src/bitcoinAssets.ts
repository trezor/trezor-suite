import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import { typedObjectKeys } from '@trezor/utils';

export type BitcoinAssetSymbol = BitcoinNetworkSymbol | 'btg' | 'dash' | 'dgb' | 'nmc' | 'vtc';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<BitcoinAssetSymbol, NetworkIconAsset> = {
    bch: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/bch.svg'),
            network: require('../assets/networkIcons/bch.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/bch.svg'),
            network: require.resolve('../assets/networkIcons/bch.svg'),
        }),
    },
    btc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/btc.svg'),
            network: require('../assets/networkIcons/btc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/btc.svg'),
            network: require.resolve('../assets/networkIcons/btc.svg'),
        }),
    },
    btg: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/btg.svg'),
            network: require('../assets/networkIcons/btg.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/btg.svg'),
            network: require.resolve('../assets/networkIcons/btg.svg'),
        }),
    },
    dash: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/dash.svg'),
            network: require('../assets/networkIcons/dash.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/dash.svg'),
            network: require.resolve('../assets/networkIcons/dash.svg'),
        }),
    },
    dgb: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/dgb.svg'),
            network: require('../assets/networkIcons/dgb.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/dgb.svg'),
            network: require.resolve('../assets/networkIcons/dgb.svg'),
        }),
    },
    doge: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/doge.svg'),
            network: require('../assets/networkIcons/doge.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/doge.svg'),
            network: require.resolve('../assets/networkIcons/doge.svg'),
        }),
    },
    ltc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/ltc.svg'),
            network: require('../assets/networkIcons/ltc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/ltc.svg'),
            network: require.resolve('../assets/networkIcons/ltc.svg'),
        }),
    },
    nmc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/nmc.svg'),
            network: require('../assets/networkIcons/nmc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/nmc.svg'),
            network: require.resolve('../assets/networkIcons/nmc.svg'),
        }),
    },
    regtest: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/regtest.svg'),
            network: require('../assets/networkIcons/btc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/regtest.svg'),
            network: require.resolve('../assets/networkIcons/btc.svg'),
        }),
    },
    test: {
        getIcons: () => ({
            testnet: true,
            coin: require('../assets/cryptoIcons/test.svg'),
            network: require('../assets/networkIcons/btc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/test.svg'),
            network: require.resolve('../assets/networkIcons/btc.svg'),
        }),
    },
    vtc: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/vtc.svg'),
            network: require('../assets/networkIcons/vtc.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/vtc.svg'),
            network: require.resolve('../assets/networkIcons/vtc.svg'),
        }),
    },
    zec: {
        getIcons: () => ({
            testnet: false,
            coin: require('../assets/cryptoIcons/zec.svg'),
            network: require('../assets/networkIcons/zec.svg'),
        }),
        getIconPaths: () => ({
            coin: require.resolve('../assets/cryptoIcons/zec.svg'),
            network: require.resolve('../assets/networkIcons/zec.svg'),
        }),
    },
};

export const bitcoinAssets: NetworkAssetsModule<BitcoinAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
