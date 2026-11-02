import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    DeviceAuthorizationStep,
    deviceAuthorizationInitialState,
} from '@suite-native/device-authorization';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useEarnDeviceStatus } from './useEarnDeviceStatus';

const device = mockSuiteDevice({ connected: true, available: true, path: 'selected-device' });

describe('useEarnDeviceStatus', () => {
    it.each([
        [DeviceAuthorizationStep.Idle, 'connected'],
        [DeviceAuthorizationStep.PinRequested, 'pin'],
        [DeviceAuthorizationStep.PassphraseRequested, 'passphrase'],
        [DeviceAuthorizationStep.ContinueOnTrezorRequested, 'connected'],
    ] as const)('maps authorization step %s to %s', async (step, expected) => {
        const { result } = await renderHookWithStoreProvider(useEarnDeviceStatus, {
            preloadedState: {
                device: { ...deviceInitialState, selectedDevice: device },
                deviceAuthorization: { deviceAuthorizationStep: step },
            },
        });

        expect(result.current).toBe(expected);
    });

    it('ignores pending authorization after disconnection', async () => {
        const { result } = await renderHookWithStoreProvider(useEarnDeviceStatus, {
            preloadedState: {
                device: { ...deviceInitialState, selectedDevice: { ...device, connected: false } },
                deviceAuthorization: {
                    deviceAuthorizationStep: DeviceAuthorizationStep.PinRequested,
                },
            },
        });

        expect(result.current).toBe('disconnected');
    });

    it('recognizes the latest on-device passphrase request', async () => {
        const { result } = await renderHookWithStoreProvider(useEarnDeviceStatus, {
            preloadedState: {
                deviceAuthorization: deviceAuthorizationInitialState,
                device: {
                    ...deviceInitialState,
                    selectedDevice: device,
                    buttonRequestsByPath: {
                        [device.path]: [{ code: 'ButtonRequest_PassphraseEntry' }],
                    },
                },
            },
        });

        expect(result.current).toBe('passphrase');
    });

    it('does not reuse an earlier PIN request during transaction confirmation', async () => {
        const { result } = await renderHookWithStoreProvider(useEarnDeviceStatus, {
            preloadedState: {
                deviceAuthorization: deviceAuthorizationInitialState,
                device: {
                    ...deviceInitialState,
                    selectedDevice: device,
                    buttonRequestsByPath: {
                        [device.path]: [
                            { code: 'ButtonRequest_PinEntry' },
                            { code: 'ButtonRequest_ConfirmOutput' },
                        ],
                    },
                },
            },
        });

        expect(result.current).toBe('connected');
    });

    it("does not use another device's authorization request", async () => {
        const { result } = await renderHookWithStoreProvider(useEarnDeviceStatus, {
            preloadedState: {
                deviceAuthorization: deviceAuthorizationInitialState,
                device: {
                    ...deviceInitialState,
                    selectedDevice: device,
                    buttonRequestsByPath: { other: [{ code: 'ButtonRequest_PinEntry' }] },
                },
            },
        });

        expect(result.current).toBe('connected');
    });
});
