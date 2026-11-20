import { Feature, type MessageSystemRootState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    selectIsDiscoveryEntropyCheckEnabledAndFailed,
    selectIsFirmwareUpdateRequiredInApp,
} from './selectors';

const deviceId = 'device-id';

const createState = (
    flags: Record<string, boolean> = {},
): MessageSystemRootState & PersistentDeviceDataRootState => ({
    messageSystem: mockMessageSystemStateWithFeatureFlags(flags),
    persistentDeviceData: {
        devices: [
            {
                ...defaultDevicePersistentData,
                device_id: deviceId,
                lastEntropyCheckResult: {
                    success: true,
                    discoveryCheckFailedPaths: ["m/84'/0'/0'"],
                },
            },
        ],
    },
});

describe('selectIsDiscoveryEntropyCheckEnabledAndFailed', () => {
    it('returns true if discovery entropy check failed', () => {
        expect(selectIsDiscoveryEntropyCheckEnabledAndFailed(createState(), deviceId)).toBe(true);
    });

    it.each([Feature.entropyCheckDiscovery, Feature.entropyCheckMobile])(
        'returns false if discovery entropy check failed but %s is disabled by message system',
        feature => {
            const state = createState({ [feature]: false });

            expect(selectIsDiscoveryEntropyCheckEnabledAndFailed(state, deviceId)).toBe(false);
        },
    );
});

describe('selectIsFirmwareUpdateRequired', () => {
    const createDeviceState = ({
        firmware,
        version,
    }: {
        firmware: 'valid' | 'outdated' | 'required';
        version: [number, number, number];
    }) => {
        const [major_version, minor_version, patch_version] = version;
        const device = mockSuiteDevice(
            { firmware },
            {
                internal_model: DeviceModelInternal.T3T1,
                major_version,
                minor_version,
                patch_version,
            },
        );

        return {
            device: { devices: [device], buttonRequestsByPath: {}, selectedDevice: device },
        };
    };

    it.each([
        { firmware: 'valid', version: [2, 8, 0], expected: false },
        { firmware: 'outdated', version: [2, 8, 0], expected: false },
        { firmware: 'required', version: [2, 7, 0], expected: true },
        { firmware: 'valid', version: [2, 6, 2], expected: true },
    ] as const)(
        'returns $expected for firmware status $firmware and version $version',
        ({ firmware, version, expected }) => {
            const state = createDeviceState({ firmware, version: [...version] });

            expect(selectIsFirmwareUpdateRequiredInApp(state)).toBe(expected);
        },
    );

    it('returns false when no device is selected', () => {
        const state = { device: { devices: [], buttonRequestsByPath: {} } };

        expect(selectIsFirmwareUpdateRequiredInApp(state)).toBe(false);
    });
});
