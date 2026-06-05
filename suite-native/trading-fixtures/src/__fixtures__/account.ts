import {
    type Account,
    type AccountDescriptor,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

const MOCK_DEVICE_STATIC_SESSION_ID: StaticSessionId =
    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0';

const buildAccount = <T extends Partial<Account>>(
    base: T & { symbol: Account['symbol']; descriptor: AccountDescriptor },
    overrides: Partial<Account>,
): Account => {
    const descriptor = (overrides.descriptor as AccountDescriptor | undefined) ?? base.descriptor;
    const symbol = overrides.symbol ?? base.symbol;
    const deviceState =
        (overrides.deviceState as StaticSessionId | undefined) ??
        (base.deviceState as StaticSessionId | undefined) ??
        MOCK_DEVICE_STATIC_SESSION_ID;

    return {
        ...base,
        ...overrides,
        descriptor,
        symbol,
        deviceState,
        key: createAccountKey({
            accountDescriptor: descriptor,
            networkSymbol: symbol,
            deviceStaticSessionId: deviceState,
        }),
    } as Account;
};

/**
 * @deprecated Prefer `mockWalletAccount` from `@suite-common/wallet-types/mocks`.
 * Kept for legacy call sites; `key` is derived from `descriptor`/`symbol`/`deviceState`
 * via `createAccountKey`, so the three stay in sync.
 */
export const getBtcAccount = (overrides: Partial<Account> = {}) =>
    buildAccount(
        {
            symbol: 'btc',
            accountType: 'normal',
            accountLabel: 'BTC Account #1',
            descriptor: asAccountDescriptor('btc1normal'),
            balance: '1000000',
            availableBalance: '1000000',
            formattedBalance: '0.01',
            networkType: 'bitcoin',
            visible: true,
            deviceState: MOCK_DEVICE_STATIC_SESSION_ID,
            addresses: {
                used: [
                    {
                        address: '1BTC',
                        path: 'm/84/0/0',
                        transfers: 0,
                        balance: '0',
                        sent: '0',
                        received: '0',
                    },
                ],
                change: [],
                unused: [],
            },
        },
        overrides,
    );

/**
 * @deprecated Prefer `mockWalletAccount` from `@suite-common/wallet-types/mocks`.
 * Kept for legacy call sites; `key` is derived from `descriptor`/`symbol`/`deviceState`
 * via `createAccountKey`, so the three stay in sync.
 */
export const getEthAccount = (overrides: Partial<Account> = {}) =>
    buildAccount(
        {
            symbol: 'eth',
            deviceState: MOCK_DEVICE_STATIC_SESSION_ID,
            accountLabel: 'Ethereum #1',
            index: 0,
            path: "m/44'/60'/0'/0/0",
            descriptor: asAccountDescriptor('eth1normal'),
            accountType: 'normal',
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
        },
        overrides,
    );

/**
 * @deprecated Prefer `mockWalletAccount` from `@suite-common/wallet-types/mocks`.
 * Kept for legacy call sites; `key` is derived from `descriptor`/`symbol`/`deviceState`
 * via `createAccountKey`, so the three stay in sync.
 */
export const getBaseAccount = (overrides: Partial<Account> = {}) =>
    buildAccount(
        {
            symbol: 'base',
            deviceState: MOCK_DEVICE_STATIC_SESSION_ID,
            accountLabel: 'Base #1',
            index: 0,
            path: "m/44'/60'/0'/0/0",
            descriptor: asAccountDescriptor('0x73d0385F4d8E00C5e6504C6030F47BF6212736A8'),
            accountType: 'normal',
            empty: false,
            backendType: 'blockbook',
            visible: true,
            balance: '1000000000000000000',
            availableBalance: '1000000000000000000',
            formattedBalance: '1',
            tokens: [],
            history: {
                total: 0,
                unconfirmed: 0,
                tokens: 0,
            },
            metadata: {
                key: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
            },
            ts: 1750315198255,
            networkType: 'ethereum',
            misc: {
                nonce: '0',
                addressAliases: {},
            },
            page: {
                index: 1,
                size: 1,
                total: 1,
            },
        },
        overrides,
    );

/**
 * @deprecated Prefer `mockWalletAccount` from `@suite-common/wallet-types/mocks`.
 * Kept for legacy call sites; `key` is derived from `descriptor`/`symbol`/`deviceState`
 * via `createAccountKey`, so the three stay in sync.
 */
export const getCardanoAccount = (overrides: Partial<Account> = {}) =>
    buildAccount(
        {
            symbol: 'ada',
            accountType: 'normal',
            accountLabel: 'Cardano Account #1',
            descriptor: asAccountDescriptor('ada1normal'),
            balance: '1000000',
            availableBalance: '1000000',
            formattedBalance: '1',
            networkType: 'cardano',
            visible: true,
            deviceState: MOCK_DEVICE_STATIC_SESSION_ID,
        },
        overrides,
    );

/**
 * @deprecated Prefer `mockWalletAccount` from `@suite-common/wallet-types/mocks`.
 * Kept for legacy call sites; `key` is derived from `descriptor`/`symbol`/`deviceState`
 * via `createAccountKey`, so the three stay in sync.
 */
export const getSolAccount = (overrides: Partial<Account> = {}) =>
    buildAccount(
        {
            symbol: 'sol',
            deviceState: MOCK_DEVICE_STATIC_SESSION_ID,
            accountLabel: 'Solana #1',
            index: 0,
            path: "m/44'/501'/0'/0'",
            descriptor: asAccountDescriptor('ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF'),
            accountType: 'normal',
            empty: false,
            visible: true,
            balance: '10000000000',
            availableBalance: '10000000000',
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
        },
        overrides,
    );
