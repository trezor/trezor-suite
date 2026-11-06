import { type UnknownAction } from '@reduxjs/toolkit';

import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import type { PersistentDeviceData } from '@suite-common/suite-types';
import {
    defaultDevicePersistentData,
    mockStoredAuthenticateDeviceResult,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import * as walletCore from '@suite-common/wallet-core';
import type { DiscoveryTrigger } from '@suite-common/wallet-types';
import type { NativeDeviceRootState } from '@suite-native/device';
import { DEVICE } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    startOrRestartDiscoveryThunk: jest.fn(() => ({ type: 'just-something-to-dispatch' })),
    selectShouldRediscover: () => true,
}));

// Conditions unrelated to the interactive device checks are fulfilled.
jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    selectCompromisedDeviceFailedCheck: () => null,
    selectIsDeviceFirmwareSupported: () => true,
}));

const mockedStartOrRestartDiscoveryThunk = jest.mocked(walletCore.startOrRestartDiscoveryThunk);

const DEVICE_ID = 'device-id';

type Fixture = {
    description: string;
    internalModel: DeviceModelInternal;
    persistentDeviceData?: Partial<PersistentDeviceData>;
    action: UnknownAction;
    expectedTrigger: DiscoveryTrigger | undefined;
};

const fixtures: Fixture[] = [
    {
        description: 'does not start discovery when the manual check is pending',
        internalModel: DeviceModelInternal.T3T1,
        persistentDeviceData: {
            manualCheckResult: undefined,
            authenticityResult: mockStoredAuthenticateDeviceResult(),
        },
        action: { type: DEVICE.CONNECT },
        expectedTrigger: undefined,
    },
    {
        description: 'does not start discovery when the authenticity check is pending',
        internalModel: DeviceModelInternal.T3T1,
        action: { type: DEVICE.CONNECT },
        expectedTrigger: undefined,
    },
    {
        description: 'starts discovery when both checks have succeeded',
        internalModel: DeviceModelInternal.T3T1,
        persistentDeviceData: { authenticityResult: mockStoredAuthenticateDeviceResult() },
        action: { type: DEVICE.CONNECT },
        expectedTrigger: 'device-connect',
    },
    {
        description: 'starts discovery once the checks have finished',
        internalModel: DeviceModelInternal.T3T1,
        persistentDeviceData: { authenticityResult: mockStoredAuthenticateDeviceResult() },
        action: persistentDeviceDataActions.setDeviceAuthenticityResult({
            deviceId: DEVICE_ID,
            result: mockStoredAuthenticateDeviceResult(),
        }),
        expectedTrigger: 'device-check',
    },
];

describe('discoveryMiddleware: interactive device checks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(fixtures)(
        '$description',
        ({ internalModel, persistentDeviceData, action, expectedTrigger }) => {
            const device = mockSuiteDevice(
                { id: DEVICE_ID, connected: true, available: true },
                { internal_model: internalModel, bootloader_locked: true },
            );
            const { store } = createTestCompositionRoot<void, NativeDeviceRootState>({
                middleware: [prepareDiscoveryMiddleware(() => ({}))],
                preloadedState: {
                    device: { selectedDevice: device, devices: [device] },
                    persistentDeviceData: {
                        devices: [
                            {
                                ...defaultDevicePersistentData,
                                device_id: DEVICE_ID,
                                internal_model: internalModel,
                                ...persistentDeviceData,
                            },
                        ],
                    },
                    appSettings: { isDeviceAuthenticityCheckEnabled: true },
                    wallet: { settings: { enabledNetworks: ['btc'] }, discovery: [] },
                },
            }).services;

            store.dispatch(action);

            if (expectedTrigger === undefined) {
                expect(mockedStartOrRestartDiscoveryThunk).not.toHaveBeenCalled();
            } else {
                expect(mockedStartOrRestartDiscoveryThunk).toHaveBeenCalledWith({
                    trigger: expectedTrigger,
                });
            }
        },
    );
});
