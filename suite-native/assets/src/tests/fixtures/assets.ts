import BigNumber from 'bignumber.js';

import { AssetType } from '../../assetsSelectors';

export const assetsFixtureZeroBalance: AssetType[] = [
    {
        symbol: 'btc',
        network: {
            symbol: 'btc',
            name: 'Bitcoin',
            networkType: 'bitcoin',
            bip43Path: "m/84'/0'/i'",
            decimals: 8,
            explorer: {
                tx: 'https://btc1.trezor.io/tx/',
                account: 'https://btc1.trezor.io/xpub/',
                address: 'https://btc1.trezor.io/address/',
            },
            features: ['rbf', 'sign-verify', 'amount-unit'],
            customBackends: ['blockbook', 'electrum'],
        },
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
    {
        symbol: 'eth',
        network: {
            symbol: 'eth',
            name: 'Ethereum',
            networkType: 'ethereum',
            chainId: 1,
            bip43Path: "m/44'/60'/0'/0/i",
            decimals: 18,
            explorer: {
                tx: 'https://eth1.trezor.io/tx/',
                account: 'https://eth1.trezor.io/address/',
                address: 'https://eth1.trezor.io/address/',
                nft: 'https://eth1.trezor.io/nft/',
            },
            features: ['rbf', 'sign-verify', 'tokens'],
            label: 'TR_NETWORK_ETHEREUM_LABEL',
            tooltip: 'TR_NETWORK_ETHEREUM_TOOLTIP',
            customBackends: ['blockbook'],
        },
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
    {
        symbol: 'ltc',
        network: {
            symbol: 'ltc',
            name: 'Litecoin',
            networkType: 'bitcoin',
            bip43Path: "m/84'/2'/i'",
            decimals: 8,
            explorer: {
                tx: 'https://ltc1.trezor.io/tx/',
                account: 'https://ltc1.trezor.io/xpub/',
                address: 'https://ltc1.trezor.io/address/',
            },
            features: ['sign-verify'],
            customBackends: ['blockbook'],
        },
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
];

export const assetsFixtureWithBalance: AssetType[] = [
    {
        symbol: 'btc',
        network: {
            symbol: 'btc',
            name: 'Bitcoin',
            networkType: 'bitcoin',
            bip43Path: "m/84'/0'/i'",
            decimals: 8,
            explorer: {
                tx: 'https://btc1.trezor.io/tx/',
                account: 'https://btc1.trezor.io/xpub/',
                address: 'https://btc1.trezor.io/address/',
            },
            features: ['rbf', 'sign-verify', 'amount-unit'],
            customBackends: ['blockbook', 'electrum'],
        },
        assetBalance: BigNumber(0.00569722),
        fiatBalance: '98.26',
    },
    {
        symbol: 'eth',
        network: {
            symbol: 'eth',
            name: 'Ethereum',
            networkType: 'ethereum',
            chainId: 1,
            bip43Path: "m/44'/60'/0'/0/i",
            decimals: 18,
            explorer: {
                tx: 'https://eth1.trezor.io/tx/',
                account: 'https://eth1.trezor.io/address/',
                address: 'https://eth1.trezor.io/address/',
                nft: 'https://eth1.trezor.io/nft/',
            },
            features: ['rbf', 'sign-verify', 'tokens'],
            label: 'TR_NETWORK_ETHEREUM_LABEL',
            tooltip: 'TR_NETWORK_ETHEREUM_TOOLTIP',
            customBackends: ['blockbook'],
        },
        assetBalance: BigNumber(0.02142776807619),
        fiatBalance: '28.25',
    },
    {
        symbol: 'ltc',
        network: {
            symbol: 'ltc',
            name: 'Litecoin',
            networkType: 'bitcoin',
            bip43Path: "m/84'/2'/i'",
            decimals: 8,
            explorer: {
                tx: 'https://ltc1.trezor.io/tx/',
                account: 'https://ltc1.trezor.io/xpub/',
                address: 'https://ltc1.trezor.io/address/',
            },
            features: ['sign-verify'],
            customBackends: ['blockbook'],
        },
        assetBalance: BigNumber(0),
        fiatBalance: '0.00',
    },
];

export const assetsFixtureSingleAsset: AssetType[] = [
    {
        symbol: 'btc',
        network: {
            symbol: 'btc',
            name: 'Bitcoin',
            networkType: 'bitcoin',
            bip43Path: "m/84'/0'/i'",
            decimals: 8,
            explorer: {
                tx: 'https://btc1.trezor.io/tx/',
                account: 'https://btc1.trezor.io/xpub/',
                address: 'https://btc1.trezor.io/address/',
            },
            features: ['rbf', 'sign-verify', 'amount-unit'],
            customBackends: ['blockbook', 'electrum'],
        },
        assetBalance: BigNumber(0.00569722),
        fiatBalance: '98.26',
    },
];
