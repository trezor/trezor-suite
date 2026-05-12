import { deviceReducerInitialState } from '@suite-common/device';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import {
    type SuiteSyncState,
    type WithSuiteSyncAndDeviceState,
    initialSuiteSyncState,
} from '@suite-common/suite-sync';
import type { SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId, UnavailableCapabilities } from '@trezor/connect';

import { selectIsLabellingAllowed } from '../selectors';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const createMockState = (
    deviceOverrides: Parameters<typeof mockSuiteDevice>[0] = {},
    suiteSyncOverrides: Partial<SuiteSyncState> = {},
): WithSuiteSyncAndDeviceState & MessageSystemRootState => {
    const device = mockSuiteDevice({
        ...deviceOverrides,
        state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
    });

    return {
        device: {
            ...deviceReducerInitialState,
            devices: [device],
            selectedDevice: device,
        },
        suiteSync: {
            ...initialSuiteSyncState,
            ...suiteSyncOverrides,
        },
        messageSystem: messageSystemInitialState,
    };
};

describe('selectIsLabellingAllowed', () => {
    it('returns true when feature is available and interaction is null (sync owner present)', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
                suiteSyncOwners: {
                    [DEVICE_STATIC_SESSION_ID_123]:
                        asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key'),
                },
            },
        );

        expect(selectIsLabellingAllowed(state)).toBe(true);
    });

    it('returns true when Suite Sync is disabled (interaction is "suite-sync-off")', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: false,
                },
            },
        );

        expect(selectIsLabellingAllowed(state)).toBe(true);
    });

    it('returns false when device does not support Suite Sync ("unsupported")', () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'no-support' };
        const state = createMockState(
            { unavailableCapabilities },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        expect(selectIsLabellingAllowed(state)).toBe(false);
    });

    it('returns the same primitive across repeated calls when state is unchanged', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const first = selectIsLabellingAllowed(state);
        const second = selectIsLabellingAllowed(state);

        expect(first).toBe(second);
    });

    it('invalidates cache when suiteSyncOwners reference changes', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const before = selectIsLabellingAllowed(state);

        const nextState: typeof state = {
            ...state,
            suiteSync: {
                ...state.suiteSync,
                suiteSyncOwners: {
                    [DEVICE_STATIC_SESSION_ID_123]:
                        asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key'),
                },
            },
        };

        const after = selectIsLabellingAllowed(nextState);

        expect(before).toBe(true);
        expect(after).toBe(true);
    });
});
