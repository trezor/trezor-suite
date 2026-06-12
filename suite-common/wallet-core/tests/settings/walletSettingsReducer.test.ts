import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { FirmwareType } from '@trezor/device-utils';

import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
    selectIsNetworkReserveSettingsVisible,
} from '../../src';
import * as walletSettingsActions from '../../src/settings/walletSettingsActions';

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
