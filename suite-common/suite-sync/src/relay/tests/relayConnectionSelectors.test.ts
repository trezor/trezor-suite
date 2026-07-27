import { type WithSuiteSyncState, initialSuiteSyncState } from '../../suiteSyncSlice';
import {
    selectIsSuiteSyncRelayConnected,
    selectLastSuiteSyncRelayDisconnectedTimestamp,
} from '../relayConnectionSelectors';
import { type SuiteSyncRelayConnection } from '../relayConnectionStatus';

const createState = (relayConnectionStatuses: SuiteSyncRelayConnection[]): WithSuiteSyncState => ({
    suiteSync: {
        ...initialSuiteSyncState,
        relayConnectionStatuses,
    },
});

describe('selectLastSuiteSyncRelayDisconnectedTimestamp', () => {
    it('selects the latest disconnected transition timestamp', () => {
        const state = createState([
            {
                state: 'disconnected',
                url: 'https://relay-a.example/evolu/',
                lastDisconnectedTimestamp: 10,
                log: [],
            },
            {
                state: 'disconnected',
                url: 'https://relay-b.example/evolu/',
                lastDisconnectedTimestamp: null,
                log: [],
            },
            {
                state: 'disconnected',
                url: 'https://relay-c.example/evolu/',
                lastDisconnectedTimestamp: 20,
                log: [],
            },
        ]);

        expect(selectLastSuiteSyncRelayDisconnectedTimestamp(state)).toBe(20);
    });

    it('returns null when no relay has disconnected after connecting', () => {
        const state = createState([
            {
                state: 'disconnected',
                url: 'https://relay.example/evolu/',
                lastDisconnectedTimestamp: null,
                log: [],
            },
        ]);

        expect(selectLastSuiteSyncRelayDisconnectedTimestamp(state)).toBeNull();
    });
});

describe('selectIsSuiteSyncRelayConnected', () => {
    it('returns true when a relay is connected', () => {
        const state = createState([
            {
                state: 'connected',
                url: 'https://relay.example/evolu/',
                lastDisconnectedTimestamp: null,
                log: [],
            },
        ]);

        expect(selectIsSuiteSyncRelayConnected(state)).toBe(true);
    });
});
