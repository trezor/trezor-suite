import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type WithSuiteSyncState } from '../suiteSyncSlice';

const createMemoizedSelector = createWeakMapSelector.withTypes<WithSuiteSyncState>();

export const selectSuiteSyncRelayConnectionStatuses = (state: WithSuiteSyncState) =>
    state.suiteSync.relayConnectionStatuses;

export const selectIsSuiteSyncRelayConnected = createMemoizedSelector(
    [selectSuiteSyncRelayConnectionStatuses],
    relayConnectionStatuses =>
        relayConnectionStatuses.some(connection => connection.state === 'connected'),
);

export const selectLastSuiteSyncRelayDisconnectedTimestamp = createMemoizedSelector(
    [selectSuiteSyncRelayConnectionStatuses],
    relayConnectionStatuses => {
        const disconnectedTimestamps = relayConnectionStatuses.flatMap(connection =>
            connection.lastDisconnectedTimestamp === null
                ? []
                : [connection.lastDisconnectedTimestamp],
        );

        return disconnectedTimestamps.length === 0 ? null : Math.max(...disconnectedTimestamps);
    },
);
