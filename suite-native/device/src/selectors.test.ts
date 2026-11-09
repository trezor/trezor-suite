import { Feature, type MessageSystemRootState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import { defaultDevicePersistentData } from '@suite-common/suite-types/mocks';

import { selectIsDiscoveryEntropyCheckEnabledAndFailed } from './selectors';

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
