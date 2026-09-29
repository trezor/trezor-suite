import { Millis, createId, createStore, testCreateDeps, testName } from '@evolu/common';
import {
    OwnerId,
    type SyncRoute,
    type SyncState,
    type SyncTenantOwner,
    type SyncTransport,
    testAppOwner,
} from '@evolu/common/local-first';

import {
    createEvoluSubscribeRelayConnections,
    getEvoluOwnerSyncStatus,
    getEvoluRelayConnections,
    subscribeEvoluOwnerSyncStatus,
} from './evoluSyncState';

const deps = testCreateDeps();
const otherOwnerId = OwnerId.orThrow('yg0UgROParTpm60ltI3hDw');

const createTransport = (transport: Partial<SyncTransport> = {}): SyncTransport => ({
    id: createId<'SyncTransport'>(deps),
    label: 'wss://relay.example',
    readyState: 'open',
    openedAt: Millis.orThrow(100),
    closedAt: null,
    error: null,
    ...transport,
});

const createRoute = (transport: SyncTransport, route: Partial<SyncRoute> = {}): SyncRoute => ({
    transportId: transport.id,
    complete: true,
    completeAt: Millis.orThrow(1000),
    lastSentAt: Millis.orThrow(900),
    lastReceivedAt: Millis.orThrow(1000),
    error: null,
    ...route,
});

const createOwner = (ownerId: OwnerId, routes: SyncRoute[]): SyncTenantOwner => ({
    ownerId,
    writable: true,
    transportIds: routes.map(route => route.transportId),
    routes,
});

const createSyncState = (transports: SyncTransport[], owners: SyncTenantOwner[]): SyncState => ({
    transports,
    tenants: [{ name: testName, refused: false, owners }],
});

describe(getEvoluOwnerSyncStatus.name, () => {
    it('is initial before the worker publishes a snapshot', () => {
        expect(getEvoluOwnerSyncStatus(null, testAppOwner.id)).toEqual({
            state: 'initial',
            syncedAt: null,
            errorType: null,
        });
    });

    it('is initial while the owner has no relay', () => {
        const syncState = createSyncState([], [createOwner(testAppOwner.id, [])]);

        expect(getEvoluOwnerSyncStatus(syncState, testAppOwner.id).state).toBe('initial');
    });

    it('is synced when the route of the owner is complete', () => {
        const transport = createTransport();
        const syncState = createSyncState(
            [transport],
            [createOwner(testAppOwner.id, [createRoute(transport)])],
        );

        expect(getEvoluOwnerSyncStatus(syncState, testAppOwner.id)).toEqual({
            state: 'synced',
            syncedAt: 1000,
            errorType: null,
        });
    });

    it('ignores other owners', () => {
        const transport = createTransport();
        const syncState = createSyncState(
            [transport],
            [
                createOwner(testAppOwner.id, [createRoute(transport)]),
                createOwner(otherOwnerId, [
                    createRoute(transport, { complete: false, completeAt: null }),
                ]),
            ],
        );

        expect(getEvoluOwnerSyncStatus(syncState, testAppOwner.id).state).toBe('synced');
        expect(getEvoluOwnerSyncStatus(syncState, otherOwnerId).state).toBe('syncing');
    });

    it('is not synced while any relay of the owner is offline', () => {
        const onlineTransport = createTransport();
        const offlineTransport = createTransport({
            label: 'wss://offline.example',
            readyState: 'closed',
        });
        const syncState = createSyncState(
            [onlineTransport, offlineTransport],
            [
                createOwner(testAppOwner.id, [
                    createRoute(onlineTransport),
                    createRoute(offlineTransport, { complete: false }),
                ]),
            ],
        );

        expect(getEvoluOwnerSyncStatus(syncState, testAppOwner.id).state).toBe('offline');
    });

    it('reports a failed route with its error type', () => {
        const transport = createTransport();
        const syncState = createSyncState(
            [transport],
            [
                createOwner(testAppOwner.id, [
                    createRoute(transport, {
                        complete: false,
                        error: { type: 'ProtocolQuotaError', at: Millis.orThrow(1200) },
                    }),
                ]),
            ],
        );

        expect(getEvoluOwnerSyncStatus(syncState, testAppOwner.id)).toEqual({
            state: 'error',
            syncedAt: 1000,
            errorType: 'ProtocolQuotaError',
        });
    });
});

describe(getEvoluRelayConnections.name, () => {
    it('maps every transport without owner data', () => {
        const transport = createTransport({
            readyState: 'closed',
            closedAt: Millis.orThrow(200),
            error: { type: 'WebSocketConnectError', at: Millis.orThrow(150) },
        });
        const syncState = createSyncState(
            [transport],
            [createOwner(testAppOwner.id, [createRoute(transport)])],
        );

        expect(getEvoluRelayConnections(syncState)).toEqual([
            {
                url: 'wss://relay.example',
                isOpen: false,
                openedAt: 100,
                closedAt: 200,
                error: { type: 'WebSocketConnectError', at: 150 },
            },
        ]);
    });

    it('is empty before the worker publishes a snapshot', () => {
        expect(getEvoluRelayConnections(null)).toEqual([]);
    });
});

describe(subscribeEvoluOwnerSyncStatus.name, () => {
    it('notifies the current status and then only its changes', () => {
        const transport = createTransport();
        const syncingRoute = createRoute(transport, { complete: false, completeAt: null });
        const syncState = createStore<SyncState | null>(null);
        const listener = jest.fn();

        const unsubscribe = subscribeEvoluOwnerSyncStatus({
            syncState,
            ownerId: testAppOwner.id,
            listener,
        });
        syncState.set(createSyncState([transport], [createOwner(testAppOwner.id, [syncingRoute])]));
        syncState.set(
            createSyncState(
                [transport],
                [
                    createOwner(testAppOwner.id, [
                        { ...syncingRoute, lastSentAt: Millis.orThrow(950) },
                    ]),
                ],
            ),
        );
        syncState.set(
            createSyncState([transport], [createOwner(testAppOwner.id, [createRoute(transport)])]),
        );
        unsubscribe();
        syncState.set(null);

        expect(listener.mock.calls.map(([status]) => status.state)).toEqual([
            'initial',
            'syncing',
            'synced',
        ]);
    });
});

describe(createEvoluSubscribeRelayConnections.name, () => {
    it('notifies the current connections and then only their changes', () => {
        const transport = createTransport();
        const syncState = createStore<SyncState | null>(null);
        const listener = jest.fn();

        createEvoluSubscribeRelayConnections({ syncState })(listener);
        syncState.set(createSyncState([transport], []));
        syncState.set(
            createSyncState([transport], [createOwner(testAppOwner.id, [createRoute(transport)])]),
        );
        syncState.set(createSyncState([{ ...transport, readyState: 'closed' }], []));

        expect(
            listener.mock.calls.map(([connections]) =>
                connections.map(({ isOpen }: { isOpen: boolean }) => isOpen),
            ),
        ).toEqual([[], [true], [false]]);
    });
});
