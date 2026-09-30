import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { portfolioTrackerDevice } from './deviceConstants';
import { deviceReducerInitialState } from './deviceReducer';
import {
    selectDeviceInstanceForConnectDevice,
    selectDeviceModelWithFlagshipFallback,
    selectIsDeviceAuthenticityCheckSupported,
} from './deviceSelectors';

describe(selectIsDeviceAuthenticityCheckSupported.name, () => {
    it('returns true for supported Trezor Safe devices', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3B1 }),
            },
        };

        expect(selectIsDeviceAuthenticityCheckSupported(state)).toBe(true);
    });

    it('returns false for devices without authenticity-check support', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T2T1 }),
            },
        };

        expect(selectIsDeviceAuthenticityCheckSupported(state)).toBe(false);
    });

    it('returns true for portfolio tracker device', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: portfolioTrackerDevice,
            },
        };

        expect(selectIsDeviceAuthenticityCheckSupported(state)).toBe(true);
    });
});

describe(selectDeviceModelWithFlagshipFallback.name, () => {
    it('returns the model of the selected device', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3T1 }),
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DeviceModelInternal.T3T1);
    });

    it('returns the flagship model when the model of the selected device cannot be read', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice(
                    {},
                    { internal_model: DeviceModelInternal.UNKNOWN },
                ),
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });

    it('returns the flagship model when no device is selected', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: undefined,
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });
});

describe(selectDeviceInstanceForConnectDevice.name, () => {
    const standardWallet = mockSuiteDevice({ id: 'device-a', path: 'path-a', instance: 0 });
    const hiddenWallet = mockSuiteDevice({
        id: 'device-a',
        path: 'path-a',
        instance: 1,
        state: { staticSessionId: 'hidden@device-a:1' },
    });
    const otherDevice = mockSuiteDevice({ id: 'device-b', path: 'path-b', instance: 0 });
    const devices = [standardWallet, hiddenWallet, otherDevice];

    const createState = (selectedDevice = standardWallet) => ({
        device: { ...deviceReducerInitialState, devices, selectedDevice },
    });

    it('resolves the instance authorized with the connect device static session id', () => {
        const connectDevice = mockConnectDevice({
            id: 'device-a',
            path: 'path-a',
            state: { staticSessionId: 'hidden@device-a:1' },
        });

        expect(selectDeviceInstanceForConnectDevice(createState(), connectDevice)).toBe(
            hiddenWallet,
        );
    });

    it('returns undefined when no instance is authorized with the static session id', () => {
        const connectDevice = mockConnectDevice({
            id: 'device-a',
            path: 'path-a',
            state: { staticSessionId: 'unknown@device-a:2' },
        });

        expect(selectDeviceInstanceForConnectDevice(createState(), connectDevice)).toBeUndefined();
    });

    it('prefers the selected instance of the physical device when the session is unknown', () => {
        const connectDevice = mockConnectDevice({ id: 'device-a', path: 'path-a' });

        expect(selectDeviceInstanceForConnectDevice(createState(hiddenWallet), connectDevice)).toBe(
            hiddenWallet,
        );
    });

    it('resolves the first instance of the physical device when another device is selected', () => {
        const connectDevice = mockConnectDevice({ id: 'device-a', path: 'path-a' });

        expect(selectDeviceInstanceForConnectDevice(createState(otherDevice), connectDevice)).toBe(
            standardWallet,
        );
    });

    it('matches a device without id by path and mode', () => {
        const bootloaderDevice = mockSuiteDevice({ id: null, path: 'path-c', mode: 'bootloader' });
        const state = {
            device: {
                ...deviceReducerInitialState,
                devices: [standardWallet, bootloaderDevice],
                selectedDevice: standardWallet,
            },
        };
        const connectDevice = mockConnectDevice({ id: null, path: 'path-c', mode: 'bootloader' });

        expect(selectDeviceInstanceForConnectDevice(state, connectDevice)).toBe(bootloaderDevice);
    });

    it('returns undefined for an unknown physical device', () => {
        const connectDevice = mockConnectDevice({ id: 'device-c', path: 'path-c' });

        expect(selectDeviceInstanceForConnectDevice(createState(), connectDevice)).toBeUndefined();
    });

    it('returns undefined for an unacquired connect device', () => {
        const unacquiredDevice = mockSuiteDevice({ type: 'unacquired', path: 'path-c' });
        const state = {
            device: {
                ...deviceReducerInitialState,
                devices: [standardWallet, unacquiredDevice],
                selectedDevice: standardWallet,
            },
        };
        const connectDevice = mockConnectDevice({ type: 'unacquired', path: 'path-c' });

        expect(selectDeviceInstanceForConnectDevice(state, connectDevice)).toBeUndefined();
    });
});
