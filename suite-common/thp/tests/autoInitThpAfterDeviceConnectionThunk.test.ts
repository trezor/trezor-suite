import { combineReducers } from '@reduxjs/toolkit';

import { FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { configureMockStore, extraDependenciesMock, testMocks } from '@suite-common/test-utils';
import { acquireDevice, prepareDeviceReducer } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { autoInitThpAfterDeviceConnectionThunk } from '../src/autoInitThpAfterDeviceConnectionThunk';
import { ThpState, prepareThpReducer } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesMock);
const firmwareReduce = prepareFirmwareReducer(extraDependenciesMock);
const deviceReduce = prepareDeviceReducer(extraDependenciesMock);

const device = testMocks.getSuiteDevice({
    thp: {
        credentials: [],
        channel: '',
        sendBit: 0,
        recvBit: 0,
        sendNonce: 0,
        recvNonce: 0,
        expectedResponses: [],
    },
    path: 'a',
}) as Device;
const initialThpState: ThpState = { step: null, lastThpCode: undefined, credentials: [] };
const initialFirmwareState: FirmwareUpdateState = {
    error: '',
    cachedDevice: undefined,
    status: 'initial',
    targetType: undefined,
    uiEvent: undefined,
    useDevkit: false,
    firmwareUpdateSource: 'production',
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
    {
        description: 'does not acquire device if a device is selected',
        isDeviceSelected: true,
        shouldAcquireDevice: false,
    },
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
                ? { ...initialFirmwareState, status: 'installing' }
                : initialFirmwareState,
            device: {
                devices: [device],
                selectedDevice: isDeviceSelected ? device.path! : undefined,
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
