import { ExtendedMessageDescriptor } from '@suite-types';
import { ArrayElement } from '@suite/types/utils';

const networks = [
    // Bitcoin
    {
        name: 'Bitcoin',
        networkType: 'bitcoin',
        symbol: 'btc',
        bip43Path: "m/84'/0'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
        // todo: to be used with cardano. leaving it here temporarily for review purposes
        // support: {
        //     1: '1.9.9',
        //     2: '2.9.9',
        // },
    },
    {
        name: 'Bitcoin (Taproot)',
        networkType: 'bitcoin',
        accountType: 'taproot',
        symbol: 'btc',
        bip43Path: "m/86'/0'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf'],
    },
    {
        name: 'Bitcoin (Legacy Segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'btc',
        bip43Path: "m/49'/0'/i'",
        decimals: 8,
        explorer: {
            tx: 'https://btc1.trezor.io/tx/',
            account: 'https://btc1.trezor.io/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin (Legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'btc',
        bip43Path: "m/44'/0'/i'",
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
        bip43Path: "m/84'/2'/i'",
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
        bip43Path: "m/49'/2'/i'",
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
        bip43Path: "m/44'/2'/i'",
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
        bip43Path: "m/44'/60'/0'/0/i",
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
        bip43Path: "m/44'/61'/0'/0/i",
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
        bip43Path: "m/44'/144'/i'/0/0",
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
        bip43Path: "m/44'/145'/i'",
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
        bip43Path: "m/49'/156'/i'",
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
        bip43Path: "m/44'/156'/i'",
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
        bip43Path: "m/44'/5'/i'",
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
        bip43Path: "m/49'/20'/i'",
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
        bip43Path: "m/44'/20'/i'",
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
        bip43Path: "m/44'/3'/i'",
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
        bip43Path: "m/44'/7'/i'",
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
        bip43Path: "m/49'/28'/i'",
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
        bip43Path: "m/44'/28'/i'",
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
        bip43Path: "m/44'/133'/i'",
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
        bip43Path: "m/84'/1'/i'",
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
        name: 'Bitcoin Testnet (taproot)',
        networkType: 'bitcoin',
        accountType: 'taproot',
        symbol: 'test',
        bip43Path: "m/86'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://tbtc1.trezor.io/tx/',
            account: 'https://tbtc1.trezor.io/xpub/',
        },
        features: ['rbf'],
    },
    {
        name: 'Bitcoin Testnet (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'test',
        bip43Path: "m/49'/1'/i'",
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
        bip43Path: "m/44'/1'/i'",
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
        name: 'Bitcoin Regtest',
        networkType: 'bitcoin',
        symbol: 'regtest',
        bip43Path: "m/84'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'http://localhost:19121/tx/',
            account: 'http://localhost:19121/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin Regtest (taproot)',
        networkType: 'bitcoin',
        accountType: 'taproot',
        symbol: 'regtest',
        bip43Path: "m/86'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'http://localhost:19121/tx/',
            account: 'http://localhost:19121/xpub/',
        },
        features: ['rbf'],
    },
    {
        name: 'Bitcoin Regtest (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'regtest',
        bip43Path: "m/49'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'http://localhost:19121/tx/',
            account: 'http://localhost:19121/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Bitcoin Regtest (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'regtest',
        bip43Path: "m/44'/1'/i'",
        decimals: 8,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'http://localhost:19121/tx/',
            account: 'http://localhost:19121/xpub/',
        },
        features: ['rbf', 'sign-verify'],
    },
    {
        name: 'Ethereum Ropsten',
        networkType: 'ethereum',
        symbol: 'trop',
        bip43Path: "m/44'/1'/0'/0/i",
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
        bip43Path: "m/44'/144'/i'/0/0",
        decimals: 6,
        testnet: true,
        label: 'TR_TESTNET_COINS_LABEL',
        explorer: {
            tx: 'https://test.bithomp.com/explorer/',
            account: 'https://test.bithomp.com/explorer/',
        },
    },
    {
        name: 'Cardano',
        networkType: 'cardano',
        symbol: 'ada',
        bip43Path: "m/1852'/1815'/i'",
        decimals: 6,
        testnet: false,
        explorer: {
            tx: 'https://explorer.blockfrost.dev/transaction/',
            account: 'https://explorer.blockfrost.dev/account/',
            token: 'https://explorer.blockfrost.dev/token/',
        },
        support: {
            2: '2.4.3',
        },
    },
    // TODO:
    // Disabled until we have final decision about derivation path.
    // Don't forget to remove addition Network type below!
    // {
    //     name: 'Cardano Testnet',
    //     networkType: 'cardano',
    //     symbol: 'tada',
    //     bip43Path: "m/1852'/1'/i'",
    //     label: 'TR_TESTNET_COINS_LABEL',
    //     decimals: 6,
    //     testnet: true,
    //     explorer: {
    //         tx: 'https://testnet-explorer.blockfrost.dev/transaction/',
    //         account: 'https://testnet-explorer.blockfrost.dev/account/',
    //         token: 'https://testnet-explorer.blockfrost.dev/token/',
    //     },
    //     support: {
    //         2: '2.4.3', // if  bip43Path is "m/1852'/1'/i'" then we need to bump this requirement as 2.4.3 doesn't support 1852'/1'
    //     },
    // },
] as const;

type Network = {
    accountType?: 'normal' | 'legacy' | 'segwit' | 'taproot';
    testnet?: boolean;
    isHidden?: boolean;
    chainId?: number;
    features?: string[];
    label?: ExtendedMessageDescriptor['id'];
    tooltip?: ExtendedMessageDescriptor['id'];
    support?: {
        [key: number]: string;
    };
} & (
    | ArrayElement<typeof networks>
    // TODO: Additional type for disabled cardano testnet. Without this TS would complain about invalid "tada" symbol
    | {
          name: 'Cardano Testnet';
          networkType: 'cardano';
          symbol: 'tada';
          bip43Path: string;
          label: string;
          decimals: 6;
          testnet: true;
          explorer: {
              tx: string;
              account: string;
              token: string;
          };
      }
);

export default [...networks] as Network[];
