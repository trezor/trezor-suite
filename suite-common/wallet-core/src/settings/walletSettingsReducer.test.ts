import { deviceInitialState } from '@suite-common/device';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type SuspiciousTransactionsFilter } from '@suite-common/wallet-types';
import { FirmwareType } from '@trezor/device-utils';

import * as walletSettingsActions from './walletSettingsActions';
import {
    type WalletSettingsReducerDeps,
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
    selectIsHideSuspiciousTransactions,
    selectIsNetworkReserveSettingsVisible,
    selectIsSuspiciousTransactionsBlurringEnabled,
    selectSuspiciousTransactionsFilter,
} from './walletSettingsReducer';

const initialState = initialWalletSettingsState;
const opSymbol = asNetworkSymbol('op');
const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const walletSettingsReducerDeps: WalletSettingsReducerDeps = {
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
};
const reducer = prepareWalletSettingsReducer(walletSettingsReducerDeps);

describe('settings reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                type: 'none',
            }),
        ).toEqual(initialState);
    });

    it('STORAGE.LOAD', () => {
        expect(
            reducer(undefined, {
                type: walletSettingsReducerDeps.actionTypes.storageLoad,
                payload: {
                    walletSettings: initialState,
                },
            } as any),
        ).toEqual(initialState);
    });

    it('SET_LOCAL_CURRENCY', () => {
        expect(
            reducer(undefined, {
                type: walletSettingsActions.setBaseCurrency.type,
                payload: { localCurrency: 'czk' },
            }),
        ).toEqual({
            ...initialState,
            localCurrency: 'czk',
        });
    });

    it('CHANGE_NETWORKS', () => {
        expect(
            reducer(undefined, {
                type: walletSettingsActions.changeNetworks.type,
                payload: ['eth'],
            }),
        ).toEqual({
            ...initialState,
            enabledNetworks: ['eth'],
        });
    });

    it('SET_SUSPICIOUS_TRANSACTIONS_FILTER sets the filter only for the given network', () => {
        const hidden = reducer(
            undefined,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: opSymbol,
                filter: 'hideSuspicious',
            }),
        );

        expect(hidden).toEqual({
            ...initialState,
            suspiciousTransactionsFilter: { op: 'hideSuspicious' },
        });

        const unblurred = reducer(
            hidden,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: ethSymbol,
                filter: 'showUnblurred',
            }),
        );

        expect(unblurred).toEqual({
            ...initialState,
            suspiciousTransactionsFilter: { op: 'hideSuspicious', eth: 'showUnblurred' },
        });
    });

    it('SET_SUSPICIOUS_TRANSACTIONS_FILTER removes the entry when set back to the default', () => {
        const hidden = reducer(
            undefined,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: opSymbol,
                filter: 'hideSuspicious',
            }),
        );

        const reset = reducer(
            hidden,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: opSymbol,
                filter: 'showAll',
            }),
        );

        expect(reset).toEqual(initialState);
    });
});

describe('suspicious transactions filter selectors', () => {
    const buildState = (
        suspiciousTransactionsFilter: Partial<Record<NetworkSymbol, SuspiciousTransactionsFilter>>,
    ) => ({
        wallet: {
            settings: {
                ...initialState,
                suspiciousTransactionsFilter,
            },
        },
    });
    const state = buildState({ [opSymbol]: 'hideSuspicious', [ethSymbol]: 'showUnblurred' });

    it('selectSuspiciousTransactionsFilter falls back to showAll', () => {
        expect(selectSuspiciousTransactionsFilter(state, opSymbol)).toBe('hideSuspicious');
        expect(selectSuspiciousTransactionsFilter(state, ethSymbol)).toBe('showUnblurred');
        expect(selectSuspiciousTransactionsFilter(state, btcSymbol)).toBe('showAll');
    });

    it('selectIsHideSuspiciousTransactions returns true only for hiding networks', () => {
        expect(selectIsHideSuspiciousTransactions(state, opSymbol)).toBe(true);
        expect(selectIsHideSuspiciousTransactions(state, ethSymbol)).toBe(false);
        expect(selectIsHideSuspiciousTransactions(state, btcSymbol)).toBe(false);
    });

    it('selectIsSuspiciousTransactionsBlurringEnabled returns false only for unblurred networks', () => {
        expect(selectIsSuspiciousTransactionsBlurringEnabled(state, opSymbol)).toBe(true);
        expect(selectIsSuspiciousTransactionsBlurringEnabled(state, ethSymbol)).toBe(false);
        expect(selectIsSuspiciousTransactionsBlurringEnabled(state, btcSymbol)).toBe(true);
    });
});

describe('selectIsNetworkReserveSettingsVisible', () => {
    const getState = (firmwareType: FirmwareType) => ({
        device: {
            ...deviceInitialState,
            selectedDevice: mockSuiteDevice({ firmwareType }),
        },
    });

    it('returns true for a device with universal firmware', () => {
        expect(selectIsNetworkReserveSettingsVisible(getState(FirmwareType.Universal))).toBe(true);
    });

    it('returns false for a device with bitcoin-only firmware', () => {
        expect(selectIsNetworkReserveSettingsVisible(getState(FirmwareType.BitcoinOnly))).toBe(
            false,
        );
    });
});
