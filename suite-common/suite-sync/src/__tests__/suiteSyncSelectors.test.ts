import { deviceReducerInitialState } from '@suite-common/device';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import type { SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId, UnavailableCapabilities } from '@trezor/connect';

import { selectIsSuiteSyncInitPossible, selectSuiteSyncInteraction } from '../suiteSyncSelectors';
import type { WithSuiteSyncAndDeviceState } from '../suiteSyncSelectors';
import { type SuiteSyncState, initialSuiteSyncState } from '../suiteSyncSlice';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const createMockState = (
    deviceOverrides: Parameters<typeof mockSuiteDevice>[0] = {},
    suiteSyncOverrides: Partial<SuiteSyncState> = {},
): WithSuiteSyncAndDeviceState & MessageSystemRootState => ({
    device: {
        ...deviceReducerInitialState,
        devices: [
            mockSuiteDevice({
                ...deviceOverrides,
                state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
            }),
        ],
    },
    suiteSync: {
        ...initialSuiteSyncState,
        ...suiteSyncOverrides,
    },
    messageSystem: messageSystemInitialState,
});

describe(selectSuiteSyncInteraction.name, () => {
    it('no interaction needed if device is not found', () => {
        const state = createMockState();
        state.device.devices = [];

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBeNull();
    });

    it('interaction is "suite-sync-off" when Suite Sync is disabled', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: false,
                },
            },
        );

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe('suite-sync-off');
    });

    it('interaction is "unsupported" when device does not support Suite Sync (T1, TT)', () => {
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

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe('unsupported');
    });

    it('interaction is "firmware-upgrade-needed" when device needs firmware upgrade', () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'update-required' };
        const state = createMockState(
            { unavailableCapabilities },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe('firmware-upgrade-needed');
    });

    it('interaction is "keys-needed" when Suite Sync owner key is missing', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe('keys-needed');
    });

    it('no interaction needed', () => {
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

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBeNull();
    });
});

describe(selectIsSuiteSyncInitPossible.name, () => {
    it('returns false when device static session id is null', () => {
        const state = createMockState();

        const result = selectIsSuiteSyncInitPossible(state, null);

        expect(result).toBe(false);
    });

    it('returns true for a connected supported device', () => {
        const state = createMockState({
            connected: true,
        });

        const result = selectIsSuiteSyncInitPossible(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe(true);
    });

    it('returns false for a disconnected device', () => {
        const state = createMockState({
            connected: false,
        });

        const result = selectIsSuiteSyncInitPossible(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe(false);
    });

    it('returns false for an unsupported device', () => {
        const state = createMockState({
            unavailableCapabilities: { evolu: 'no-support' },
        });

        const result = selectIsSuiteSyncInitPossible(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe(false);
    });

    it('returns true for a connected device with older firmware', () => {
        const state = createMockState({
            unavailableCapabilities: { evolu: 'update-required' },
            connected: true,
        });

        const result = selectIsSuiteSyncInitPossible(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBe(true);
    });
});
