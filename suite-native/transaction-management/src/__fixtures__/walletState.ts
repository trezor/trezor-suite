import { FiatRatesState } from '@suite-common/wallet-core';
import { Account, RatesByKey, type WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

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
                type: 'ERC20',
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

export const getWalletState = () => ({
    settings: {
        localCurrency: 'usd',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    } as WalletSettings,
    fiat: {
        current: {
            // BTC - USD
            'eth-usd': {
                rate: 1000,
            },
            // USDC - USD
            'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-usd': {
                rate: 0.99,
            },
        } as RatesByKey,
        historic: {},
        lastWeek: {},
    } as FiatRatesState,
    accounts: [getEthAccount()] as Account[],
});
