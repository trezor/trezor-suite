import { asEncryptedHex } from '@suite-common/platform-encryption';
import type { SuiteSyncOwnerSerialized, TrezorDevice } from '@suite-common/suite-types';
import { getSuiteDevice } from '@suite-common/test-utils';
import { deviceReducerInitialState } from '@suite-common/wallet-core';
import type { UnavailableCapabilities } from '@trezor/connect';
import { StaticSessionId } from '@trezor/connect';

import { initialSuiteSyncState } from '../suiteSyncReducer';
import { selectIsTurnOnSuiteSyncInteractionNeeded } from '../suiteSyncSelectors';
import type { WithSuiteSyncAndDeviceState } from '../suiteSyncSelectors';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

const createDevice = (overrides: Partial<TrezorDevice> = {}): TrezorDevice =>
    ({
        ...getSuiteDevice(),
        id: 'device-id',
        state: {
            staticSessionId: deviceStaticSessionId,
        },
        unavailableCapabilities: {},
        ...overrides,
    }) as unknown as TrezorDevice;

const createMockState = (
    deviceOverrides: Partial<TrezorDevice> = {},
    suiteSyncOverrides: Partial<WithSuiteSyncAndDeviceState['suiteSync']> = {},
): WithSuiteSyncAndDeviceState => ({
    device: {
        ...deviceReducerInitialState,
        devices: [createDevice(deviceOverrides)],
    },
    suiteSync: {
        ...initialSuiteSyncState,
        ...suiteSyncOverrides,
    },
});

describe(selectIsTurnOnSuiteSyncInteractionNeeded.name, () => {
    it('no interaction needed if device is not found', () => {
        const state = createMockState();
        state.device.devices = [];

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBeNull();
    });

    it('no interaction, if suite-sync it not enabled in debug/experimental features', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isFeatureSuiteSyncAvailable: false,
                },
            },
        );

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBeNull();
    });

    it('interaction is "suite-sync-off" when Suite Sync is disabled', () => {
        const state = createMockState(
            {},
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isFeatureSuiteSyncAvailable: true,
                    isSuiteSyncEnabled: false,
                },
            },
        );

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBe('suite-sync-off');
    });

    it('interaction is "unsupported" when device does not support Suite Sync (T1, TT)', () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'no-support' };
        const state = createMockState(
            { unavailableCapabilities },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isFeatureSuiteSyncAvailable: true,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBe('unsupported');
    });

    it('interaction is "firmware-upgrade-needed" when device needs firmware upgrade', () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'update-required' };
        const state = createMockState(
            { unavailableCapabilities },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isFeatureSuiteSyncAvailable: true,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBe('firmware-upgrade-needed');
    });

    it('interaction is "keys-needed" when device has suiteSyncOwner set', () => {
        const state = createMockState(
            { suiteSyncOwner: null },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isFeatureSuiteSyncAvailable: true,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBe('keys-needed');
    });

    it('no interaction needed', () => {
        const state = createMockState(
            { suiteSyncOwner: asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key') },
            {
                settings: {
                    ...initialSuiteSyncState.settings,
                    isFeatureSuiteSyncAvailable: true,
                    isSuiteSyncEnabled: true,
                },
            },
        );

        const result = selectIsTurnOnSuiteSyncInteractionNeeded(state, deviceStaticSessionId);

        expect(result).toBeNull();
    });
});
