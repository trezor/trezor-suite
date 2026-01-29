import { asEncryptedHex } from '@suite-common/platform-encryption';
import type { SuiteSyncOwnerSerialized } from '@suite-common/suite-types';
import { getSuiteDevice } from '@suite-common/test-utils';
import { deviceReducerInitialState } from '@suite-common/wallet-core';
import type { UnavailableCapabilities } from '@trezor/connect';
import { StaticSessionId } from '@trezor/connect';

import { selectSuiteSyncInteraction } from '../suiteSyncSelectors';
import type { WithSuiteSyncAndDeviceState } from '../suiteSyncSelectors';
import { initialSuiteSyncState } from '../suiteSyncSlice';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const createMockState = (
    deviceOverrides: Parameters<typeof getSuiteDevice>[0] = {},
    suiteSyncOverrides: Partial<WithSuiteSyncAndDeviceState['suiteSync']> = {},
): WithSuiteSyncAndDeviceState => ({
    device: {
        ...deviceReducerInitialState,
        devices: [getSuiteDevice({ ...deviceOverrides, state: DEVICE_STATIC_SESSION_ID_123 })],
    },
    suiteSync: {
        ...initialSuiteSyncState,
        ...suiteSyncOverrides,
    },
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

    it('interaction is "keys-needed" when device has suiteSyncOwner set', () => {
        const state = createMockState(
            { suiteSyncOwner: null },
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
            { suiteSyncOwner: asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key') },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectSuiteSyncInteraction(state, DEVICE_STATIC_SESSION_ID_123);

        expect(result).toBeNull();
    });
});
