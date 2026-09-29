import { type ReadonlyStore, type SyncState } from '@evolu/common';
import {
    type OwnerId,
    type RelaySyncStatus,
    syncStateToOwnerSyncStates,
} from '@evolu/common/local-first';

import {
    type SuiteSyncStorageSyncStatus,
    type SuiteSyncStorageSyncStatusListener,
} from '@suite-common/suite-sync-storage';
import {
    type SubscribeSuiteSyncRelayConnections,
    type SuiteSyncRelayConnection,
} from '@suite-common/suite-sync-types';

export type EvoluSyncStateDep = {
    syncState: ReadonlyStore<SyncState | null>;
};

// Unlike Evolu's owner status, one synced relay must not hide another relay that is behind.
const relaySyncStatusPriority: RelaySyncStatus[] = ['error', 'syncing', 'offline', 'synced'];

export const getEvoluOwnerSyncStatus = (
    syncState: SyncState | null,
    ownerId: OwnerId,
): SuiteSyncStorageSyncStatus => {
    const ownerSyncStates =
        syncState === null
            ? []
            : syncStateToOwnerSyncStates(syncState).filter(
                  ownerSyncState => ownerSyncState.ownerId === ownerId,
              );
    const relayStatuses = ownerSyncStates.flatMap(ownerSyncState =>
        ownerSyncState.relays.map(relay => relay.status),
    );
    const syncedAts = ownerSyncStates.flatMap(ownerSyncState =>
        ownerSyncState.syncedAt === null ? [] : [ownerSyncState.syncedAt],
    );
    const newestError = ownerSyncStates
        .flatMap(ownerSyncState => (ownerSyncState.error === null ? [] : [ownerSyncState.error]))
        .toSorted((a, b) => b.at - a.at)[0];

    return {
        state: relaySyncStatusPriority.find(status => relayStatuses.includes(status)) ?? 'initial',
        syncedAt: syncedAts.length === 0 ? null : Math.max(...syncedAts),
        errorType: newestError?.type ?? null,
    };
};

export const getEvoluRelayConnections = (syncState: SyncState | null): SuiteSyncRelayConnection[] =>
    (syncState?.transports ?? []).map(transport => ({
        url: transport.label,
        isOpen: transport.readyState === 'open',
        openedAt: transport.openedAt,
        closedAt: transport.closedAt,
        error: transport.error === null ? null : { ...transport.error },
    }));

type SubscribeDerivedSyncStateParams<T> = EvoluSyncStateDep & {
    derive: (syncState: SyncState | null) => T;
    listener: (value: T) => void;
};

// The worker publishes a snapshot after every sent or received frame, so only changes of the
// derived value are passed on.
const subscribeDerivedSyncState = <T>({
    syncState,
    derive,
    listener,
}: SubscribeDerivedSyncStateParams<T>) => {
    const initialValue = derive(syncState.get());
    let lastSerializedValue = JSON.stringify(initialValue);

    listener(initialValue);

    return syncState.subscribe(() => {
        const value = derive(syncState.get());
        const serializedValue = JSON.stringify(value);

        if (serializedValue === lastSerializedValue) return;

        lastSerializedValue = serializedValue;
        listener(value);
    });
};

type SubscribeEvoluOwnerSyncStatusParams = EvoluSyncStateDep & {
    ownerId: OwnerId;
    listener: SuiteSyncStorageSyncStatusListener;
};

export const subscribeEvoluOwnerSyncStatus = ({
    syncState,
    ownerId,
    listener,
}: SubscribeEvoluOwnerSyncStatusParams) =>
    subscribeDerivedSyncState({
        syncState,
        derive: state => getEvoluOwnerSyncStatus(state, ownerId),
        listener,
    });

export type EvoluSubscribeRelayConnectionsDeps = EvoluSyncStateDep;

export const createEvoluSubscribeRelayConnections =
    (deps: EvoluSubscribeRelayConnectionsDeps): SubscribeSuiteSyncRelayConnections =>
    listener => {
        subscribeDerivedSyncState({
            syncState: deps.syncState,
            derive: getEvoluRelayConnections,
            listener,
        });
    };
