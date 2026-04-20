import { type FiatRatesState } from '@suite-common/wallet-core';
import { type Account, type RatesByKey, type WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { createFeeLevels } from './feeLevels';

export const getEthAccount = () =>
    ({
        key: 'eth-account-1',
        deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
        accountLabel: 'Ethereum #1',
        index: 0,
        path: "m/44'/60'/0'/0/0",
        descriptor: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
        accountType: 'normal',
        symbol: 'eth',
        empty: false,
        backendType: 'blockbook',
        visible: true,
        balance: '810000000000',
        availableBalance: '810000000000',
        formattedBalance: '0.00000081',
        tokens: [
            {
                standard: 'ERC20',
                name: 'USDC',
                contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                transfers: 1,
                symbol: 'usdc',
                decimals: 6,
                balance: '1',
            },
        ],
        history: {
            total: 56,
            unconfirmed: 0,
            tokens: 7,
        },
        metadata: {
            key: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
        },
        ts: 1750315198255,
        networkType: 'ethereum',
        misc: {
            nonce: '34',
            addressAliases: {
                '0x08fc7400BA37FC4ee1BF73BeD5dDcb5db6A1036A': {
                    Type: 'ENS',
                    Alias: 'ethkeydotnet.eth',
                },
                '0x4d224452801ACEd8B2F0aebE155379bb5D594381': {
                    Type: 'Contract',
                    Alias: 'ApeCoin',
                },
                '0x62270860B9a5337e46bE8563c512c9137AFa0384': {
                    Type: 'ENS',
                    Alias: 'trezorproduct.eth',
                },
                '0xF1c7B271C649b3A5606E3C6f748EA7a8e4351D2B': {
                    Type: 'ENS',
                    Alias: 'donero.eth',
                },
                '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
                    Type: 'Contract',
                    Alias: 'Tether USD',
                },
            },
        },
        page: {
            index: 1,
            size: 7,
            total: 8,
        },
    }) as unknown as Account;

export const getBtcAccount = () =>
    ({
        key: 'btc-account-1',
        deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
        accountLabel: 'Bitcoin #1',
        index: 0,
        path: "m/84'/0'/0'",
        descriptor:
            'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
        accountType: 'normal',
        symbol: 'btc',
        empty: false,
        backendType: 'blockbook',
        visible: true,
        balance: '12340000',
        availableBalance: '12340000',
        formattedBalance: '0.12340000',
        tokens: [],
        addresses: {
            change: [
                {
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    path: "m/84'/0'/0'/1/0",
                    transfers: 2,
                    balance: '0',
                    sent: '225998',
                    received: '225998',
                },
                {
                    address: '139SnSTcoTF7jpkqh4wZFc7y6fQ1SLj4oR',
                    path: "m/84'/0'/0'/1/1",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            used: [
                {
                    address: '1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL',
                    path: "m/84'/0'/0'/0/0",
                    transfers: 2,
                    balance: '0',
                    sent: '100000',
                    received: '100000',
                },
                {
                    address: '1GWFxtwWmNVqotUPXLcKVL2mUKpshuJYo',
                    path: "m/84'/0'/0'/0/1",
                    transfers: 2,
                    balance: '0',
                    sent: '1552750',
                    received: '1552750',
                },
            ],
            unused: [
                {
                    address: '1Eni8JFS4yA2wJkicc3yx3QzCNzopLybCM',
                    path: "m/84'/0'/0'/0/2",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
                {
                    address: '124dT55Jqpj9AKTyJnTX6G8RkUs7ReTzun',
                    path: "m/84'/0'/0'/0/3",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
        },
        utxo: [],
        history: {
            total: 108,
            unconfirmed: 0,
            addrTxCount: 551,
        },
        metadata: {
            key: 'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
        },
        ts: 1750315199039,
        networkType: 'bitcoin',
        page: {
            index: 1,
            size: 25,
            total: 5,
        },
    }) as unknown as Account;

export const getSolAccount = () =>
    ({
        key: 'sol-account-1',
        deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0',
        accountLabel: 'Solana #1',
        index: 0,
        path: "m/44'/501'/0'/0'",
        descriptor: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
        accountType: 'normal',
        symbol: 'sol',
        empty: false,
        visible: true,
        balance: '10000000000', // 10 SOL
        availableBalance: '10000000000', // 10 SOL
        formattedBalance: '10.000000000',
        tokens: [],
        addresses: undefined,
        utxo: [],
        history: {
            total: 25,
            unconfirmed: 0,
        },
        metadata: {
            key: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
        },
        ts: 1750315199039,
        networkType: 'solana',
        misc: {
            rent: 10,
        },
        page: {
            index: 1,
            size: 25,
            total: 3,
        },
    }) as unknown as Account;

export const getWalletState = () => ({
    settings: {
        localCurrency: 'usd',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    } as WalletSettings,
    fiat: {
        current: {
            // ETH - USD
            'eth-usd': {
                rate: 1000,
            },
            // BTC - USD
            'btc-usd': {
                rate: 100000,
            },
            // SOL - USD
            'sol-usd': {
                rate: 150,
            },
            // USDC - USD
            'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-usd': {
                rate: 0.99,
            },
        } as RatesByKey,
        historic: {},
        lastWeek: {},
    } as FiatRatesState,
    accounts: [getEthAccount(), getBtcAccount(), getSolAccount()] as Account[],
    send: {
        feeLevels: createFeeLevels({
            normal: {
                fee: '433210428000',
                feePerByte: '1',
                feeLimit: '11000',
                estimatedFeeLimit: '11000',
            },
            high: {
                fee: '733210428000',
                feePerByte: '4',
                feeLimit: '21000',
                estimatedFeeLimit: '21000',
            },
            custom: {
                totalSpent: '1000426691398000',
                fee: '426691398000',
                feePerByte: '2',
                feeLimit: '31000',
                estimatedFeeLimit: '31000',
            },
        }),
    },
    fees: {},
});
