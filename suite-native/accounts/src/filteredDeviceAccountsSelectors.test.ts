import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type SuiteSyncAccount, createSuiteSyncAccountId } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId, asWalletDescriptor } from '@trezor/device-utils';

import {
    type NativeAccountsRootState,
    selectFilteredDeviceAccountTypesByNetworkSymbol,
    selectFilteredDeviceAccountsByNetworkSymbolAndAccountType,
    selectFilteredDeviceNetworkSymbols,
    selectNetworkFilterOptions,
} from './selectors';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const adaSymbol = asNetworkSymbol('ada');
const ltcSymbol = asNetworkSymbol('ltc');

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
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('btcdefault'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '0',
});

const btcTaprootAccount = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('btctaproot'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'taproot',
    index: 1,
    availableBalance: '5',
});

const ethAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('ethdefault'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '10',
});

const adaAccount = mockWalletAccount(
    {
        symbol: adaSymbol,
        descriptor: asAccountDescriptor('adadefault'),
        deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
        accountType: 'normal',
        index: 0,
        availableBalance: '25',
    },
    networkSpecificDefaultCardano,
);

const hiddenLtcAccount = mockWalletAccount({
    symbol: ltcSymbol,
    descriptor: asAccountDescriptor('ltchidden'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '15',
    visible: false,
});

const otherDeviceBtcAccount = mockWalletAccount({
    symbol: btcSymbol,
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

const withLabel = (account: Account, label: string | null): AccountWithSuiteSyncLabel => ({
    ...account,
    label,
});

const createState = (accounts: Account[]): NativeAccountsRootState => ({
    device: {
        devices: [selectedDevice],
        persistentDeviceData: [],
        selectedDevice,
    },
    wallet: {
        accounts,
        settings: {
            ...initialWalletSettingsState,
            enabledNetworks: [btcSymbol, ethSymbol, adaSymbol, ltcSymbol],
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

describe('selectFilteredDeviceNetworkSymbols', () => {
    it('returns network symbols of visible accounts for the selected device sorted by network order', () => {
        expect(selectFilteredDeviceNetworkSymbols(state, '', false, [])).toEqual([
            'btc',
            'eth',
            'ada',
        ]);
    });

    it('filters using suite sync labels and network names', () => {
        expect(selectFilteredDeviceNetworkSymbols(state, 'daily', false, [])).toEqual(['btc']);
        expect(selectFilteredDeviceNetworkSymbols(state, 'ETHEREUM', false, [])).toEqual(['eth']);
    });

    it('keeps only networks with send-available accounts when the send filter is enabled', () => {
        expect(selectFilteredDeviceNetworkSymbols(state, '', true, [])).toEqual(['btc', 'eth']);
    });

    it('filters by network symbols', () => {
        expect(selectFilteredDeviceNetworkSymbols(state, '', false, [btcSymbol])).toEqual(['btc']);
        expect(
            selectFilteredDeviceNetworkSymbols(state, '', false, [ethSymbol, adaSymbol]),
        ).toEqual(['eth', 'ada']);
    });

    it('combines network symbol filter with text search', () => {
        expect(selectFilteredDeviceNetworkSymbols(state, 'daily', false, [btcSymbol])).toEqual([
            'btc',
        ]);
        expect(selectFilteredDeviceNetworkSymbols(state, 'daily', false, [ethSymbol])).toEqual([]);
    });

    it('returns a referentially stable result when unrelated state changes', () => {
        const recreatedState = createState(stateAccounts);

        expect(selectFilteredDeviceNetworkSymbols(recreatedState, '', false, [])).toBe(
            selectFilteredDeviceNetworkSymbols(state, '', false, []),
        );
    });
});

describe('selectFilteredDeviceAccountTypesByNetworkSymbol', () => {
    it('returns account types of visible network accounts sorted by account type order', () => {
        expect(
            selectFilteredDeviceAccountTypesByNetworkSymbol(state, '', false, btcSymbol),
        ).toEqual(['normal', 'taproot']);
        expect(
            selectFilteredDeviceAccountTypesByNetworkSymbol(state, '', false, ethSymbol),
        ).toEqual(['normal']);
    });

    it('keeps only account types with send-available accounts when the send filter is enabled', () => {
        expect(selectFilteredDeviceAccountTypesByNetworkSymbol(state, '', true, btcSymbol)).toEqual(
            ['taproot'],
        );
    });

    it('returns an empty array for a network without visible accounts', () => {
        expect(
            selectFilteredDeviceAccountTypesByNetworkSymbol(state, '', false, ltcSymbol),
        ).toEqual([]);
    });

    it('returns a referentially stable result when unrelated state changes', () => {
        const recreatedState = createState(stateAccounts);

        expect(
            selectFilteredDeviceAccountTypesByNetworkSymbol(recreatedState, '', false, btcSymbol),
        ).toBe(selectFilteredDeviceAccountTypesByNetworkSymbol(state, '', false, btcSymbol));
    });
});

describe('selectFilteredDeviceAccountsByNetworkSymbolAndAccountType', () => {
    it('returns visible accounts of the selected device with suite sync labels', () => {
        expect(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                state,
                '',
                false,
                btcSymbol,
                'normal',
            ),
        ).toEqual([withLabel(btcDefaultAccount, 'Daily spending')]);

        expect(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                state,
                '',
                false,
                btcSymbol,
                'taproot',
            ),
        ).toEqual([withLabel(btcTaprootAccount, null)]);
    });

    it('filters using suite sync labels', () => {
        expect(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                state,
                'daily',
                false,
                btcSymbol,
                'normal',
            ),
        ).toEqual([withLabel(btcDefaultAccount, 'Daily spending')]);

        expect(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                state,
                'daily',
                false,
                btcSymbol,
                'taproot',
            ),
        ).toEqual([]);
    });

    it('excludes hidden accounts and accounts of other devices', () => {
        expect(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                state,
                '',
                false,
                ltcSymbol,
                'normal',
            ),
        ).toEqual([]);
    });

    it('returns a referentially stable result when unrelated state changes', () => {
        const recreatedState = createState(stateAccounts);

        expect(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                recreatedState,
                '',
                false,
                btcSymbol,
                'normal',
            ),
        ).toBe(
            selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
                state,
                '',
                false,
                btcSymbol,
                'normal',
            ),
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
