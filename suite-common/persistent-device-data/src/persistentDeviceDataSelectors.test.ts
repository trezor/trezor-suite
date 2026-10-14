import type { PersistentDeviceData } from '@suite-common/suite-types';
import { defaultDevicePersistentData } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import type { PersistentDeviceDataRootState } from './persistentDeviceDataReducer';
import { selectVerifiedModelByDeviceId } from './persistentDeviceDataSelectors';

const validAuthenticityResult: PersistentDeviceData['authenticityResult'] = {
    valid: true,
    optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
    tropicResult: null,
    mcuResult: null,
};

const createState = (
    persistentDeviceData: Partial<PersistentDeviceData>,
): PersistentDeviceDataRootState => ({
    persistentDeviceData: {
        devices: [
            {
                ...defaultDevicePersistentData,
                internal_model: DeviceModelInternal.T3T1,
                ...persistentDeviceData,
            },
        ],
    },
});

describe(selectVerifiedModelByDeviceId.name, () => {
    it('returns the model if the device authenticity check succeeded', () => {
        const state = createState({ authenticityResult: validAuthenticityResult });

        expect(selectVerifiedModelByDeviceId(state, 'device-id')).toBe(DeviceModelInternal.T3T1);
    });

    it('returns null if the device authenticity check failed', () => {
        const state = createState({
            authenticityResult: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
        });

        expect(selectVerifiedModelByDeviceId(state, 'device-id')).toBeNull();
    });

    it('returns null if the device authenticity check has no result', () => {
        const state = createState({ authenticityResult: undefined });

        expect(selectVerifiedModelByDeviceId(state, 'device-id')).toBeNull();
    });

    it('returns null for an unknown device', () => {
        const state = createState({ authenticityResult: validAuthenticityResult });

        expect(selectVerifiedModelByDeviceId(state, 'other-device-id')).toBeNull();
    });
});
