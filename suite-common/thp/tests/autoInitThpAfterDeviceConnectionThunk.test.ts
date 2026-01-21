import { combineReducers } from '@reduxjs/toolkit';

import { FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    testMocks,
} from '@suite-common/test-utils';
import { acquireDevice, prepareDeviceReducer } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { autoInitThpAfterDeviceConnectionThunk } from '../src/autoInitThpAfterDeviceConnectionThunk';
import { createDeviceThp } from '../src/support/mocks';
import { ThpState, prepareThpReducer } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesCommonMock);
const firmwareReduce = prepareFirmwareReducer(extraDependenciesCommonMock);
const deviceReduce = prepareDeviceReducer(extraDependenciesCommonMock);

const device = testMocks.getConnectDevice({
    thp: createDeviceThp(),
});
const initialThpState: ThpState = { step: null, lastThpCode: undefined, credentials: [] };
const initialFirmwareState: FirmwareUpdateState = {
    error: '',
    cachedDevice: undefined,
    status: 'initial',
    targetType: undefined,
    uiEvent: undefined,
    useDevkit: false,
    firmwareUpdateSource: 'production',
    switchFirmwareType: false,
};

const testCases: {
    description: string;
    deviceArg?: Device;
    isFirmwareInstallation?: boolean;
    isDeviceSelected?: boolean;
    shouldAcquireDevice: boolean;
}[] = [
    {
        description: 'acquires device if conditions are met',
        shouldAcquireDevice: true,
    },
    {
        description: 'does not acquire device if the device does not support THP',
        deviceArg: { ...device, thp: undefined },
        shouldAcquireDevice: false,
    },
    {
        description: 'does not acquire device if firmware installation is in progress',
        isFirmwareInstallation: true,
        shouldAcquireDevice: false,
    },
    // TODO: Revise tests in https://github.com/trezor/trezor-suite/issues/20930
];

type CreateStoreParams = {
    isFirmwareInstallation?: boolean;
    isDeviceSelected?: boolean;
};

const createStore = ({ isFirmwareInstallation, isDeviceSelected }: CreateStoreParams) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({
            thp: thpReduce,
            firmware: firmwareReduce,
            device: deviceReduce,
        }),
        preloadedState: {
            thp: initialThpState,
            firmware: isFirmwareInstallation
                ? { ...initialFirmwareState, status: 'started' }
                : initialFirmwareState,
            device: {
                devices: [device],
                selectedDevice: isDeviceSelected ? device : undefined,
            },
        },
    });

describe(autoInitThpAfterDeviceConnectionThunk.name, () => {
    testCases.forEach(
        ({
            description,
            deviceArg,
            isFirmwareInstallation,
            isDeviceSelected,
            shouldAcquireDevice,
        }) => {
            it(description, () => {
                const store = createStore({ isFirmwareInstallation, isDeviceSelected });
                store.dispatch(
                    autoInitThpAfterDeviceConnectionThunk({ device: deviceArg ?? device }),
                );
                expect(store.getActions().some(a => a.type === acquireDevice.pending.type)).toBe(
                    shouldAcquireDevice,
                );
            });
        },
    );
});
