import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { FirmwareType } from '@trezor/device-utils';

import * as walletSettingsActions from './walletSettingsActions';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
    selectIsHideSuspiciousTransactions,
    selectIsNetworkReserveSettingsVisible,
} from './walletSettingsReducer';

const initialState = initialWalletSettingsState;

const reducer = prepareWalletSettingsReducer(extraDependenciesCommonMock);

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
                type: extraDependenciesCommonMock.actionTypes.storageLoad,
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

    it('TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS toggles the setting only for the given network', () => {
        const toggledOn = reducer(
            undefined,
            walletSettingsActions.toggleHideSuspiciousTransactions('op'),
        );

        expect(toggledOn).toEqual({
            ...initialState,
            hideSuspiciousTransactions: { op: true },
        });

        const toggledOff = reducer(
            toggledOn,
            walletSettingsActions.toggleHideSuspiciousTransactions('op'),
        );

        expect(toggledOff).toEqual({
            ...initialState,
            hideSuspiciousTransactions: { op: false },
        });
    });
});

describe('selectIsHideSuspiciousTransactions', () => {
    const getState = (hideSuspiciousTransactions: Partial<Record<NetworkSymbol, boolean>>) => ({
        wallet: {
            settings: {
                ...initialState,
                hideSuspiciousTransactions,
            },
        },
    });

    it('returns true only for networks with the setting enabled', () => {
        expect(selectIsHideSuspiciousTransactions(getState({ op: true, eth: false }), 'op')).toBe(
            true,
        );
        expect(selectIsHideSuspiciousTransactions(getState({ op: true, eth: false }), 'eth')).toBe(
            false,
        );
        expect(selectIsHideSuspiciousTransactions(getState({ op: true, eth: false }), 'btc')).toBe(
            false,
        );
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
