import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type EthereumNetworkSymbol,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum-types';

import { ethereumCryptoIcons } from './cryptoIcons';
import { ethereumNetworkIcons } from './networkIcons';

export type EthereumAssetSymbol = EthereumNetworkSymbol | 'bnb' | 'teth';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<EthereumAssetSymbol, NetworkIconAsset> = {
    arb: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.arb.getIcon(),
            network: ethereumNetworkIcons.arb.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.arb.getIconPath(),
            network: ethereumNetworkIcons.arb.getIconPath(),
        }),
    },
    arc: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.arc.getIcon(),
            network: ethereumNetworkIcons.arc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.arc.getIconPath(),
            network: ethereumNetworkIcons.arc.getIconPath(),
        }),
    },
    avax: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.avax.getIcon(),
            network: ethereumNetworkIcons.avax.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.avax.getIconPath(),
            network: ethereumNetworkIcons.avax.getIconPath(),
        }),
    },
    base: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.base.getIcon(),
            network: ethereumNetworkIcons.base.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.base.getIconPath(),
            network: ethereumNetworkIcons.base.getIconPath(),
        }),
    },
    bnb: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.bnb.getIcon(),
            network: ethereumNetworkIcons.bsc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.bnb.getIconPath(),
            network: ethereumNetworkIcons.bsc.getIconPath(),
        }),
    },
    bsc: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.bsc.getIcon(),
            network: ethereumNetworkIcons.bsc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.bsc.getIconPath(),
            network: ethereumNetworkIcons.bsc.getIconPath(),
        }),
    },
    etc: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.etc.getIcon(),
            network: ethereumNetworkIcons.etc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.etc.getIconPath(),
            network: ethereumNetworkIcons.etc.getIconPath(),
        }),
    },
    eth: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.eth.getIcon(),
            network: ethereumNetworkIcons.eth.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.eth.getIconPath(),
            network: ethereumNetworkIcons.eth.getIconPath(),
        }),
    },
    hype: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.hype.getIcon(),
            network: ethereumNetworkIcons.hype.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.hype.getIconPath(),
            network: ethereumNetworkIcons.hype.getIconPath(),
        }),
    },
    op: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.op.getIcon(),
            network: ethereumNetworkIcons.op.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.op.getIconPath(),
            network: ethereumNetworkIcons.op.getIconPath(),
        }),
    },
    pol: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.pol.getIcon(),
            network: ethereumNetworkIcons.pol.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.pol.getIconPath(),
            network: ethereumNetworkIcons.pol.getIconPath(),
        }),
    },
    rhc: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.rhc.getIcon(),
            network: ethereumNetworkIcons.rhc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.rhc.getIconPath(),
            network: ethereumNetworkIcons.rhc.getIconPath(),
        }),
    },
    tarc: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.tarc.getIcon(),
            network: ethereumNetworkIcons.arc.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.tarc.getIconPath(),
            network: ethereumNetworkIcons.arc.getIconPath(),
        }),
    },
    teth: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.teth.getIcon(),
            network: ethereumNetworkIcons.eth.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.teth.getIconPath(),
            network: ethereumNetworkIcons.eth.getIconPath(),
        }),
    },
    thod: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.thod.getIcon(),
            network: ethereumNetworkIcons.eth.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.thod.getIconPath(),
            network: ethereumNetworkIcons.eth.getIconPath(),
        }),
    },
    tsep: {
        getIcons: () => ({
            coin: ethereumCryptoIcons.tsep.getIcon(),
            network: ethereumNetworkIcons.eth.getIcon(),
        }),
        getIconPaths: () => ({
            coin: ethereumCryptoIcons.tsep.getIconPath(),
            network: ethereumNetworkIcons.eth.getIconPath(),
        }),
    },
};

export const ethereumAssets: NetworkAssetsModule<EthereumAssetSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'ethereum',
            supportedNetworks: supportedEthereumNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
