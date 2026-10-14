import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type BitcoinNetworkSymbol,
    supportedBitcoinNetworks,
} from '@trezor/network-bitcoin-types';

import { bitcoinCryptoIcons } from './cryptoIcons';
import { bitcoinNetworkIcons } from './networkIcons';

export type BitcoinAssetSymbol = BitcoinNetworkSymbol | 'btg' | 'dash' | 'dgb' | 'nmc' | 'vtc';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<BitcoinAssetSymbol, NetworkIconAsset> = {
    bch: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.bch.getIcon(),
            network: bitcoinNetworkIcons.bch.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.bch.getIconPath(),
            network: bitcoinNetworkIcons.bch.getIconPath(),
        }),
    },
    btc: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.btc.getIcon(),
            network: bitcoinNetworkIcons.btc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.btc.getIconPath(),
            network: bitcoinNetworkIcons.btc.getIconPath(),
        }),
    },
    btg: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.btg.getIcon(),
            network: bitcoinNetworkIcons.btg.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.btg.getIconPath(),
            network: bitcoinNetworkIcons.btg.getIconPath(),
        }),
    },
    dash: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.dash.getIcon(),
            network: bitcoinNetworkIcons.dash.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.dash.getIconPath(),
            network: bitcoinNetworkIcons.dash.getIconPath(),
        }),
    },
    dgb: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.dgb.getIcon(),
            network: bitcoinNetworkIcons.dgb.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.dgb.getIconPath(),
            network: bitcoinNetworkIcons.dgb.getIconPath(),
        }),
    },
    doge: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.doge.getIcon(),
            network: bitcoinNetworkIcons.doge.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.doge.getIconPath(),
            network: bitcoinNetworkIcons.doge.getIconPath(),
        }),
    },
    ltc: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.ltc.getIcon(),
            network: bitcoinNetworkIcons.ltc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.ltc.getIconPath(),
            network: bitcoinNetworkIcons.ltc.getIconPath(),
        }),
    },
    nmc: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.nmc.getIcon(),
            network: bitcoinNetworkIcons.nmc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.nmc.getIconPath(),
            network: bitcoinNetworkIcons.nmc.getIconPath(),
        }),
    },
    regtest: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.regtest.getIcon(),
            network: bitcoinNetworkIcons.btc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.regtest.getIconPath(),
            network: bitcoinNetworkIcons.btc.getIconPath(),
        }),
    },
    test: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.test.getIcon(),
            network: bitcoinNetworkIcons.btc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.test.getIconPath(),
            network: bitcoinNetworkIcons.btc.getIconPath(),
        }),
    },
    vtc: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.vtc.getIcon(),
            network: bitcoinNetworkIcons.vtc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.vtc.getIconPath(),
            network: bitcoinNetworkIcons.vtc.getIconPath(),
        }),
    },
    zec: {
        getIcons: () => ({
            coin: bitcoinCryptoIcons.zec.getIcon(),
            network: bitcoinNetworkIcons.zec.getIcon(),
        }),
        getIconPaths: () => ({
            coin: bitcoinCryptoIcons.zec.getIconPath(),
            network: bitcoinNetworkIcons.zec.getIconPath(),
        }),
    },
};

export const bitcoinAssets: NetworkAssetsModule<BitcoinAssetSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'bitcoin',
            supportedNetworks: supportedBitcoinNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
