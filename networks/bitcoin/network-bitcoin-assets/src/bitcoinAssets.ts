import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets';
import { typedObjectKeys } from '@trezor/utils';

// Keep SVG loading lazy so registering assets does not load their files.
const icons = {
    bch: () => ({
        coin: require('../assets/cryptoIcons/bch.svg'),
        network: require('../assets/networkIcons/bch.svg'),
    }),
    btc: () => ({
        coin: require('../assets/cryptoIcons/btc.svg'),
        network: require('../assets/networkIcons/btc.svg'),
    }),
    btg: () => ({
        coin: require('../assets/cryptoIcons/btg.svg'),
        network: require('../assets/networkIcons/btg.svg'),
    }),
    dash: () => ({
        coin: require('../assets/cryptoIcons/dash.svg'),
        network: require('../assets/networkIcons/dash.svg'),
    }),
    dgb: () => ({
        coin: require('../assets/cryptoIcons/dgb.svg'),
        network: require('../assets/networkIcons/dgb.svg'),
    }),
    doge: () => ({
        coin: require('../assets/cryptoIcons/doge.svg'),
        network: require('../assets/networkIcons/doge.svg'),
    }),
    ltc: () => ({
        coin: require('../assets/cryptoIcons/ltc.svg'),
        network: require('../assets/networkIcons/ltc.svg'),
    }),
    nmc: () => ({
        coin: require('../assets/cryptoIcons/nmc.svg'),
        network: require('../assets/networkIcons/nmc.svg'),
    }),
    regtest: () => ({
        coin: require('../assets/cryptoIcons/regtest.svg'),
        network: require('../assets/networkIcons/btc.svg'),
    }),
    test: () => ({
        coin: require('../assets/cryptoIcons/test.svg'),
        network: require('../assets/networkIcons/btc.svg'),
    }),
    vtc: () => ({
        coin: require('../assets/cryptoIcons/vtc.svg'),
        network: require('../assets/networkIcons/vtc.svg'),
    }),
    zec: () => ({
        coin: require('../assets/cryptoIcons/zec.svg'),
        network: require('../assets/networkIcons/zec.svg'),
    }),
} satisfies Record<string, () => NetworkIcons>;

export type BitcoinAssetSymbol = keyof typeof icons;

export const bitcoinAssets: NetworkAssetsModule<BitcoinAssetSymbol> = {
    getSupportedNetworks: () => typedObjectKeys(icons),
    getIcons: symbol => icons[symbol](),
};
