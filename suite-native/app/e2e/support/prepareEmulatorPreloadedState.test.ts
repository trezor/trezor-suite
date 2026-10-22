import { strict as assert } from 'node:assert';

import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { type Features } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { prepareEmulatorPreloadedState } from './prepareEmulatorPreloadedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { regtestDiscoveryFinishedStateT3W1 } from '../fixtures/regtestDiscoveryFinishedStateT3W1';

const t3t1EmulatorFeatures: Pick<Features, 'device_id' | 'internal_model'> = {
    device_id: 'current-emulator-id',
    internal_model:
        regtestDiscoveryFinishedStateT3T1!.device!.devices![0]!.features!.internal_model!,
};
const t3w1EmulatorFeatures: Pick<Features, 'device_id' | 'internal_model'> = {
    device_id: 'current-emulator-id',
    internal_model:
        regtestDiscoveryFinishedStateT3W1!.device!.devices![0]!.features!.internal_model!,
};

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

describe('prepareEmulatorPreloadedState', () => {
    it.each([
        ['T3T1', regtestDiscoveryFinishedStateT3T1],
        ['T3W1', regtestDiscoveryFinishedStateT3W1],
    ] as const)('keeps one wallet across emulator reconnects for %s', (_, fixture) => {
        assert(fixture);
        const originalState = JSON.stringify(fixture);
        const originalDevice = fixture.device!.devices![0] as AcquiredDevice;
        const emulatorFeatures: Pick<Features, 'device_id' | 'internal_model'> = {
            device_id: 'current-emulator-id',
            internal_model: originalDevice.features!.internal_model,
        };
        const state = JSON.parse(
            prepareEmulatorPreloadedState({ preloadedState: originalState, emulatorFeatures }),
        );
        const fixtureDevice: AcquiredDevice = state.device.devices[0];
        const account = state.wallet.accounts[0];

        expect(fixtureDevice.id === emulatorFeatures.device_id).toBe(true);
        expect(fixtureDevice.features!.device_id === emulatorFeatures.device_id).toBe(true);
        expect(fixtureDevice.connected).toBe(false);
        expect(fixtureDevice.available).toBe(false);
        expect(fixtureDevice.path).toBe('');
        expect(fixtureDevice.state?.sessionId).toBeUndefined();
        expect(fixtureDevice.thp).toBeUndefined();
        expect(account.deviceState === fixtureDevice.state?.staticSessionId).toBe(true);
        expect(account.key.includes(fixtureDevice.state!.staticSessionId)).toBe(true);
        expect(JSON.stringify(state).includes(originalDevice.id!)).toBe(false);

        const liveDevice: AcquiredDevice = {
            ...fixtureDevice,
            path: originalDevice.path,
            connected: true,
            features: { ...originalDevice.features!, ...emulatorFeatures },
        };
        let devices = deviceReducer(
            { ...deviceReducer(undefined, { type: 'init' }), devices: [fixtureDevice] },
            deviceActions.connectDevice({ device: liveDevice }),
        );
        expect(devices.devices).toHaveLength(1);
        expect(devices.devices[0]?.connected).toBe(true);

        devices = deviceReducer(devices, deviceActions.deviceDisconnect(liveDevice));
        expect(devices.devices).toHaveLength(1);
        expect(devices.devices[0]?.connected).toBe(false);
        expect(JSON.stringify(fixture)).toBe(originalState);
    });

    it('preserves state without a connected fixture device', () => {
        const preloadedState = JSON.stringify({ appSettings: { isOnboardingFinished: true } });

        expect(
            prepareEmulatorPreloadedState({
                preloadedState,
                emulatorFeatures: t3t1EmulatorFeatures,
            }),
        ).toBe(preloadedState);
    });

    it('preserves remembered devices from other emulators', () => {
        const fixture = structuredClone(regtestDiscoveryFinishedStateT3T1);
        assert(fixture);
        const originalDevice = fixture.device!.devices![0] as AcquiredDevice;
        const rememberedDevice = JSON.parse(
            JSON.stringify(originalDevice).replaceAll(originalDevice.id!, 'remembered-device-id'),
        );
        rememberedDevice.connected = false;
        fixture.device!.devices!.push(rememberedDevice);
        fixture.device!.selectedDevice = fixture.device!.devices![0];

        const state = JSON.parse(
            prepareEmulatorPreloadedState({
                preloadedState: JSON.stringify(fixture),
                emulatorFeatures: t3t1EmulatorFeatures,
            }),
        );

        expect(state.device.devices[1]).toEqual(rememberedDevice);
        expect(state.device.selectedDevice.id === 'current-emulator-id').toBe(true);
        expect(state.device.selectedDevice.connected).toBe(false);
        expect(state.device.selectedDevice.state.sessionId).toBeUndefined();
    });

    it('preserves fixture devices for a different model', () => {
        const preloadedState = JSON.stringify(regtestDiscoveryFinishedStateT3T1);

        expect(
            prepareEmulatorPreloadedState({
                preloadedState,
                emulatorFeatures: t3w1EmulatorFeatures,
            }),
        ).toBe(preloadedState);
    });

    it('fails when the emulator does not report its identity', () => {
        expect(() =>
            prepareEmulatorPreloadedState({
                preloadedState: JSON.stringify(regtestDiscoveryFinishedStateT3T1),
                emulatorFeatures: { ...t3t1EmulatorFeatures, device_id: null },
            }),
        ).toThrow('Emulator did not report a device ID');
    });
});
