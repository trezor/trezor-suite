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

    it('memoizes the last disconnected timestamp for unchanged relay statuses', () => {
        const state = createState([]);
        selectLastSuiteSyncRelayDisconnectedTimestamp.resetRecomputations();

        selectLastSuiteSyncRelayDisconnectedTimestamp(state);
        selectLastSuiteSyncRelayDisconnectedTimestamp(state);

        expect(selectLastSuiteSyncRelayDisconnectedTimestamp.recomputations()).toBe(1);
    });
});

describe('selectIsSuiteSyncRelayConnected', () => {
    it('memoizes the connection status for unchanged relay statuses', () => {
        const state = createState([]);
        selectIsSuiteSyncRelayConnected.resetRecomputations();

        selectIsSuiteSyncRelayConnected(state);
        selectIsSuiteSyncRelayConnected(state);

        expect(selectIsSuiteSyncRelayConnected.recomputations()).toBe(1);
    });
});
