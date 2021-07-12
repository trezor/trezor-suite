import { ExtendedMessageDescriptor } from '@suite-types';
import { ArrayElement } from '@suite/types/utils';

const networks = [
    // Bitcoin
    {
        name: 'Bitcoin',
        networkType: 'bitcoin',
        symbol: 'btc',
        bip44: "m/84'/0'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'btc',
        bip44: "m/49'/0'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'btc',
        bip44: "m/44'/0'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    // Litecoin
    {
        name: 'Litecoin',
        networkType: 'bitcoin',
        symbol: 'ltc',
        bip44: "m/84'/2'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://ltc1.trezor.io/tx/',
            account: 'https://ltc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Litecoin (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'ltc',
        bip44: "m/49'/2'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://ltc1.trezor.io/tx/',
            account: 'https://ltc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Litecoin (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'ltc',
        bip44: "m/44'/2'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://ltc1.trezor.io/tx/',
            account: 'https://ltc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    // Ethereum
    {
        name: 'Ethereum',
        networkType: 'ethereum',
        symbol: 'eth',
        chainId: 1,
        bip44: "m/44'/60'/0'/0/i",
        hasSignVerify: true,
        decimals: 18,
        explorer: {
            tx: 'https://eth1.trezor.io/tx/',
            account: 'https://eth1.trezor.io/address/',
        },
        features: ['sign-verify'],
        label: 'TR_NETWORK_ETHEREUM_LABEL',
        tooltip: 'TR_NETWORK_ETHEREUM_TOOLTIP',
    },
    {
        name: 'Ethereum Classic',
        networkType: 'ethereum',
        symbol: 'etc',
        chainId: 61,
        bip44: "m/44'/61'/0'/0/i",
        hasSignVerify: true,
        decimals: 18,
        explorer: {
            tx: 'https://etc1.trezor.io/tx/',
            account: 'https://etc1.trezor.io/address/',
        },
        features: ['sign-verify'],
    },
    // Ripple
    {
        name: 'XRP',
        networkType: 'ripple',
        symbol: 'xrp',
        bip44: "m/44'/144'/i'/0/0",
        decimals: 6,
        explorer: {
            tx: 'https://xrpscan.com/tx/',
            account: 'https://xrpscan.com/account/',
        },
    },
    {
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        symbol: 'bch',
        bip44: "m/44'/145'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://bch1.trezor.io/tx/',
            account: 'https://bch1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Bitcoin Gold',
        networkType: 'bitcoin',
        symbol: 'btg',
        bip44: "m/49'/156'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://btg1.trezor.io/tx/',
            account: 'https://btg1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Bitcoin Gold (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'btg',
        bip44: "m/44'/156'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://btg1.trezor.io/tx/',
            account: 'https://btg1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Dash',
        networkType: 'bitcoin',
        symbol: 'dash',
        bip44: "m/44'/5'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://dash1.trezor.io/tx/',
            account: 'https://dash1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'DigiByte',
        networkType: 'bitcoin',
        symbol: 'dgb',
        bip44: "m/49'/20'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://dgb1.trezor.io/tx/',
            account: 'https://dgb1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'DigiByte (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'dgb',
        bip44: "m/44'/20'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://dgb1.trezor.io/tx/',
            account: 'https://dgb1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Dogecoin',
        networkType: 'bitcoin',
        symbol: 'doge',
        bip44: "m/44'/3'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://doge1.trezor.io/tx/',
            account: 'https://doge1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Namecoin',
        networkType: 'bitcoin',
        symbol: 'nmc',
        bip44: "m/44'/7'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://nmc1.trezor.io/tx/',
            account: 'https://nmc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Vertcoin',
        networkType: 'bitcoin',
        symbol: 'vtc',
        bip44: "m/49'/28'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://vtc1.trezor.io/tx/',
            account: 'https://vtc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Vertcoin (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'vtc',
        bip44: "m/44'/28'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://vtc1.trezor.io/tx/',
            account: 'https://vtc1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'Zcash',
        networkType: 'bitcoin',
        symbol: 'zec',
        bip44: "m/44'/133'/i'",
        hasSignVerify: true,
        decimals: 8,
        explorer: {
            tx: 'https://zec1.trezor.io/tx/',
            account: 'https://zec1.trezor.io/xpub/',
        },
        features: ['sign-verify'],
    },
    // Bitcoin testnet
    {
        name: 'Bitcoin Testnet',
        networkType: 'bitcoin',
        symbol: 'test',
        bip44: "m/84'/1'/i'",
        hasSignVerify: true,
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://tbtc1.trezor.io/tx/',
            account: 'https://tbtc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin Testnet (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'test',
        bip44: "m/49'/1'/i'",
        hasSignVerify: true,
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://tbtc1.trezor.io/tx/',
            account: 'https://tbtc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin Testnet (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'test',
        bip44: "m/44'/1'/i'",
        hasSignVerify: true,
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://tbtc1.trezor.io/tx/',
            account: 'https://tbtc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Ethereum Ropsten',
        networkType: 'ethereum',
        symbol: 'trop',
        bip44: "m/44'/1'/0'/0/i",
        hasSignVerify: true,
        chainId: 3,
        decimals: 18,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://ropsten1.trezor.io/tx/',
            account: 'https://ropsten1.trezor.io/address/',
        },
        features: ['sign-verify'],
    },
    {
        name: 'XRP Testnet',
        networkType: 'ripple',
        symbol: 'txrp',
        bip44: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://test.bithomp.com/explorer/',
            account: 'https://test.bithomp.com/explorer/',
        },
    },
] as const;

type Network = {
    accountType?: 'normal' | 'legacy' | 'segwit';
    testnet?: boolean;
    isHidden?: boolean;
    chainId?: number;
    hasSignVerify?: boolean;
    features?: string[];
    label?: ExtendedMessageDescriptor['id'];
    tooltip?: ExtendedMessageDescriptor['id'];
} & ArrayElement<typeof networks>;

export default [...networks] as Network[];
