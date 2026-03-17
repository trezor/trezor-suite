import { AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { SuiteSyncAccount, createSuiteSyncAccountId } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { Account, asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import {
    NativeAccountsRootState,
    selectFilteredDeviceAccountsGroupedByNetworkAccountType,
} from '../selectors';

const SELECTED_WALLET_DESCRIPTOR = asWalletDescriptor('selected-wallet');
const SELECTED_DEVICE_STATIC_SESSION_ID = 'selected-wallet@device-id:0';
const OTHER_WALLET_DESCRIPTOR = asWalletDescriptor('other-wallet');
const OTHER_DEVICE_STATIC_SESSION_ID = 'other-wallet@device-id:0';

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: SELECTED_DEVICE_STATIC_SESSION_ID },
});

const btcDefaultAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btc-default'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '0',
});

const btcTaprootAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btc-taproot'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'taproot',
    index: 1,
    availableBalance: '5',
});

const ethAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('eth-default'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '10',
});

const adaAccount = mockWalletAccount(
    {
        symbol: 'ada',
        descriptor: asAccountDescriptor('ada-default'),
        deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
        accountType: 'normal',
        index: 0,
        availableBalance: '25',
    },
    networkSpecificDefaultCardano,
);

const hiddenLtcAccount = mockWalletAccount({
    symbol: 'ltc',
    descriptor: asAccountDescriptor('ltc-hidden'),
    deviceState: SELECTED_DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
    availableBalance: '15',
    visible: false,
});

const otherDeviceBtcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btc-other-device'),
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

describe('selectFilteredDeviceAccountsGroupedByNetworkAccountType', () => {
    const state = createState([
        ethAccount,
        hiddenLtcAccount,
        otherDeviceBtcAccount,
        adaAccount,
        btcTaprootAccount,
        btcDefaultAccount,
    ]);

    it('groups only visible accounts for the selected device and sorts them by network and account type', () => {
        expect(selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, '')).toEqual({
            'Bitcoin default accounts': [withLabel(btcDefaultAccount, 'Daily spending')],
            'Bitcoin Taproot accounts': [withLabel(btcTaprootAccount, null)],
            'Ethereum default accounts': [withLabel(ethAccount, 'Long-term ETH')],
            'Cardano default accounts': [withLabel(adaAccount, null)],
        });
    });

    it('filters using suite sync labels and network names', () => {
        expect(selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, 'daily')).toEqual({
            'Bitcoin default accounts': [withLabel(btcDefaultAccount, 'Daily spending')],
        });

        expect(selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, 'ETHEREUM')).toEqual({
            'Ethereum default accounts': [withLabel(ethAccount, 'Long-term ETH')],
        });
    });

    it('keeps only send-available accounts when the send filter is enabled', () => {
        expect(selectFilteredDeviceAccountsGroupedByNetworkAccountType(state, '', true)).toEqual({
            'Bitcoin Taproot accounts': [withLabel(btcTaprootAccount, null)],
            'Ethereum default accounts': [withLabel(ethAccount, 'Long-term ETH')],
        });
    });
});
