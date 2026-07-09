import { deviceActions } from '@suite-common/device';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import {
    addSuiteSyncRelayConnection,
    initialSuiteSyncState,
    removeSuiteSyncRelayConnection,
    setSuiteSyncRelayConnection,
    suiteSyncReducer,
} from '../suiteSyncSlice';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

describe(suiteSyncReducer.name, () => {
    it('removes device-specific suite sync data on forgetDevice', () => {
        const nextState = suiteSyncReducer(
            {
                ...initialSuiteSyncState,
                suiteSyncOwners: {
                    [DEVICE_STATIC_SESSION_ID_123]:
                        asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key'),
                },
                suiteSyncErrors: {},
            },
            deviceActions.forgetDevice({
                device: mockSuiteDevice({
                    state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
                }),
            }),
        );

        expect(nextState.suiteSyncOwners[DEVICE_STATIC_SESSION_ID_123]).toBeUndefined();
        expect(nextState.suiteSyncErrors[DEVICE_STATIC_SESSION_ID_123]).toBeUndefined();
    });

    it('removes relay connection from the current list without adding a log entry', () => {
        const relayUrl = 'https://suite-sync.trezor.io/evolu/';

        const connectedState = suiteSyncReducer(
            suiteSyncReducer(
                initialSuiteSyncState,
                addSuiteSyncRelayConnection({
                    url: relayUrl,
                }),
            ),
            setSuiteSyncRelayConnection({
                state: 'connected',
                timestamp: 1,
                url: relayUrl,
            }),
        );

        const removedState = suiteSyncReducer(
            connectedState,
            removeSuiteSyncRelayConnection({
                url: relayUrl,
            }),
        );

        expect(removedState.relayConnections).toEqual([]);
        expect(removedState.relayConnectionLog).toEqual([
            {
                state: 'connected',
                timestamp: 1,
                url: relayUrl,
            },
        ]);
    });

    it('does not recreate removed relay connection from stale disconnected status', () => {
        const relayUrl = 'https://suite-sync.trezor.io/evolu/';

        const removedState = suiteSyncReducer(
            suiteSyncReducer(
                initialSuiteSyncState,
                addSuiteSyncRelayConnection({
                    url: relayUrl,
                }),
            ),
            removeSuiteSyncRelayConnection({
                url: relayUrl,
            }),
        );

        const disconnectedState = suiteSyncReducer(
            removedState,
            setSuiteSyncRelayConnection({
                state: 'disconnected',
                timestamp: 1,
                url: relayUrl,
            }),
        );

        expect(disconnectedState.relayConnections).toEqual([]);
        expect(disconnectedState.relayConnectionLog).toEqual([
            {
                state: 'disconnected',
                timestamp: 1,
                url: relayUrl,
            },
        ]);
    });
});
