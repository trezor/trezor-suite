import { type SuiteSyncAccount, createSuiteSyncAccountId } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId, asWalletDescriptor } from '@trezor/device-utils';

import {
    type NativeAccountsRootState,
    selectFilteredDeviceAccountListRows,
    selectNetworkFilterOptions,
} from './selectors';

const SELECTED_WALLET_DESCRIPTOR = asWalletDescriptor('selectedWallet');
const SELECTED_DEVICE_STATIC_SESSION_ID: StaticSessionId = 'selectedWallet@deviceId:0';
const OTHER_WALLET_DESCRIPTOR = asWalletDescriptor('otherWallet');
const OTHER_DEVICE_STATIC_SESSION_ID: StaticSessionId = 'otherWallet@deviceId:0';

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: SELECTED_DEVICE_STATIC_SESSION_ID },
});

const btcDefaultAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcdefault'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '0',
});

const btcTaprootAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btctaproot'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'taproot',
    index: 1,
    availableBalance: '5',
});

const btcSecondDefaultAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcseconddefault'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 2,
    availableBalance: '3',
});

const ethAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethdefault'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '10',
});

const adaAccount = mockWalletAccount(
    {
        symbol: 'ada',
        descriptor: asAccountDescriptor('adadefault'),
        deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
        accountType: 'normal',
        index: 0,
        availableBalance: '25',
    },
    networkSpecificDefaultCardano,
);

const hiddenLtcAccount = mockWalletAccount({
    symbol: 'ltc',
    descriptor: asAccountDescriptor('ltchidden'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '15',
    visible: false,
});

const otherDeviceBtcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcotherdevice'),
    deviceState: OTHER_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '30',
});

const createSuiteSyncAccount = (account: Account, label: string): SuiteSyncAccount => ({
    id: createSuiteSyncAccountId(account.descriptor, account.symbol),
    accountDescriptor: account.descriptor,
    networkSymbol: account.symbol,
    label,
});

const createSuiteSyncAccountsRecord = (accounts: SuiteSyncAccount[]) =>
    accounts.reduce<Record<SuiteSyncAccount['id'], SuiteSyncAccount>>((acc, account) => {
        acc[account.id] = account;

        return acc;
    }, {});

const createState = (accounts: Account[]): NativeAccountsRootState => ({
    device: {
        devices: [selectedDevice],
        persistentDeviceData: [],
        buttonRequestsByPath: {},
        selectedDevice,
    },
    wallet: {
        accounts,
        settings: {
            ...initialWalletSettingsState,
            enabledNetworks: ['btc', 'eth', 'ada', 'ltc'],
        },
        fiat: {
            current: {},
            lastWeek: {},
            historic: {},
        },
        transactions: {
            transactions: {},
            phishing: {},
            fetchStatusDetail: {},
        },
    },
    suiteSyncData: {
        wallets: {
            [SELECTED_WALLET_DESCRIPTOR]: {
                wallet: {
                    walletDescriptor: SELECTED_WALLET_DESCRIPTOR,
                    label: null,
                },
                accounts: createSuiteSyncAccountsRecord([
                    createSuiteSyncAccount(btcDefaultAccount, 'Daily spending'),
                    createSuiteSyncAccount(ethAccount, 'Long-term ETH'),
                ]),
                addresses: {},
                outputs: {},
            },
            [OTHER_WALLET_DESCRIPTOR]: {
                wallet: {
                    walletDescriptor: OTHER_WALLET_DESCRIPTOR,
                    label: null,
                },
                accounts: createSuiteSyncAccountsRecord([
                    createSuiteSyncAccount(otherDeviceBtcAccount, 'Other device BTC'),
                ]),
                addresses: {},
                outputs: {},
            },
        },
    },
    tokenDefinitions: {},
});

const stateAccounts = [
    ethAccount,
    hiddenLtcAccount,
    otherDeviceBtcAccount,
    adaAccount,
    btcTaprootAccount,
    btcDefaultAccount,
];

const state = createState(stateAccounts);

describe('selectFilteredDeviceAccountListRows', () => {
    it('returns visible account keys in network and account-type order with group boundaries', () => {
        expect(selectFilteredDeviceAccountListRows(state, '', false, [])).toEqual([
            { accountKey: btcDefaultAccount.key, isFirst: true, isLast: true },
            { accountKey: btcTaprootAccount.key, isFirst: true, isLast: true },
            { accountKey: ethAccount.key, isFirst: true, isLast: true },
            { accountKey: adaAccount.key, isFirst: true, isLast: true },
        ]);
    });

    it('marks the boundaries of an account-type group containing multiple accounts', () => {
        const stateWithSecondDefaultAccount = createState([
            ...stateAccounts,
            btcSecondDefaultAccount,
        ]);

        expect(
            selectFilteredDeviceAccountListRows(stateWithSecondDefaultAccount, '', false, []),
        ).toEqual([
            { accountKey: btcDefaultAccount.key, isFirst: true, isLast: false },
            { accountKey: btcSecondDefaultAccount.key, isFirst: false, isLast: true },
            { accountKey: btcTaprootAccount.key, isFirst: true, isLast: true },
            { accountKey: ethAccount.key, isFirst: true, isLast: true },
            { accountKey: adaAccount.key, isFirst: true, isLast: true },
        ]);
    });

    it('filters using suite sync labels and network names', () => {
        expect(selectFilteredDeviceAccountListRows(state, 'daily', false, [])).toEqual([
            { accountKey: btcDefaultAccount.key, isFirst: true, isLast: true },
        ]);
        expect(selectFilteredDeviceAccountListRows(state, 'ETHEREUM', false, [])).toEqual([
            { accountKey: ethAccount.key, isFirst: true, isLast: true },
        ]);
    });

    it('keeps only send-available accounts when the send filter is enabled', () => {
        expect(selectFilteredDeviceAccountListRows(state, '', true, [])).toEqual([
            { accountKey: btcTaprootAccount.key, isFirst: true, isLast: true },
            { accountKey: ethAccount.key, isFirst: true, isLast: true },
        ]);
    });

    it('combines network symbol filtering with text search', () => {
        expect(selectFilteredDeviceAccountListRows(state, 'daily', false, ['btc'])).toEqual([
            { accountKey: btcDefaultAccount.key, isFirst: true, isLast: true },
        ]);
        expect(selectFilteredDeviceAccountListRows(state, 'daily', false, ['eth'])).toEqual([]);
    });

    it('excludes hidden accounts and accounts of other devices', () => {
        expect(selectFilteredDeviceAccountListRows(state, '', false, ['ltc'])).toEqual([]);
    });

    it('keeps the complete data array stable when account content changes without structural changes', () => {
        const updatedState = createState(
            stateAccounts.map(account =>
                account.key === ethAccount.key ? { ...account, formattedBalance: '42' } : account,
            ),
        );

        expect(selectFilteredDeviceAccountListRows(updatedState, '', false, [])).toBe(
            selectFilteredDeviceAccountListRows(state, '', false, []),
        );
    });

    it('returns a stable empty array', () => {
        expect(selectFilteredDeviceAccountListRows(state, 'missing', false, [])).toBe(
            selectFilteredDeviceAccountListRows(state, 'still missing', false, []),
        );
    });
});

describe('selectNetworkFilterOptions', () => {
    it('returns one option per network with the account count', () => {
        expect(selectNetworkFilterOptions(state, false)).toEqual([
            { symbol: 'btc', accountCount: 2 },
            { symbol: 'eth', accountCount: 1 },
            { symbol: 'ada', accountCount: 1 },
        ]);
    });

    it('counts only send-available accounts when the send filter is enabled', () => {
        expect(selectNetworkFilterOptions(state, true)).toEqual([
            { symbol: 'btc', accountCount: 1 },
            { symbol: 'eth', accountCount: 1 },
        ]);
    });

    it('returns a referentially stable result when unrelated state changes', () => {
        const recreatedState = createState(stateAccounts);

        expect(selectNetworkFilterOptions(recreatedState, false)).toBe(
            selectNetworkFilterOptions(state, false),
        );
    });
});
