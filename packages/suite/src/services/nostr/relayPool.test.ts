import { type RelayFilter } from './relayClient';
import {
    disposeAllRelayPools,
    disposeRelayPoolsExcept,
    publishDraftToPool,
    queryRelaysOnce,
    reconcileRelayPool,
} from './relayPool';

type MockRelayClient = {
    url: string;
    filters?: RelayFilter[];
    onEose?: () => void;
    onStatusChange?: (isConnected: boolean) => void;
    isDisposed: boolean;
    publishedDrafts: unknown[];
    rejectConnect: (error: Error) => void;
    deliver: (id: string) => void;
};

// Filled by the mocked RelayClient constructor, in creation order.
const mockClients: MockRelayClient[] = [];

// A RelayClient without sockets: tests drive delivery, EOSE, status and connect failures by hand.
jest.mock('./relayClient', () => ({
    RelayClient: class {
        filters?: RelayFilter[];
        onEose?: () => void;
        onStatusChange?: (isConnected: boolean) => void;
        isDisposed = false;
        publishedDrafts: unknown[] = [];
        rejectConnect: (error: Error) => void = () => {};
        private handler?: (event: { id: string }) => void;

        constructor(readonly url: string) {
            mockClients.push(this);
        }

        on(handler: (event: { id: string }) => void) {
            this.handler = handler;
        }

        connect(filters: RelayFilter[]) {
            this.filters = filters;

            return new Promise<void>((_resolve, reject) => {
                this.rejectConnect = reject;
            });
        }

        publish(draft: unknown) {
            this.publishedDrafts.push(draft);
        }

        dispose() {
            this.isDisposed = true;
        }

        deliver(id: string) {
            this.handler?.({ id });
        }
    },
}));

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const getClient = (index: number) => {
    const client = mockClients[index];
    if (!client) throw new Error(`no relay client at index ${index}`);

    return client;
};

const FILTERS: RelayFilter[] = [{ kinds: [7924, 7925], '#p': ['ab'.repeat(32)] }];

describe('queryRelaysOnce', () => {
    beforeEach(() => {
        mockClients.length = 0;
    });

    it('resolves with events deduplicated by id once every relay sent EOSE, then disposes all', async () => {
        const query = queryRelaysOnce(['wss://a', 'wss://b'], FILTERS);
        const relayA = getClient(0);
        const relayB = getClient(1);

        relayA.deliver('id1');
        relayB.deliver('id1');
        relayB.deliver('id2');
        relayA.onEose?.();
        relayB.onEose?.();

        const events = await query;

        expect(events.map(event => event.id).sort()).toEqual(['id1', 'id2']);
        expect(relayA.isDisposed).toBe(true);
        expect(relayB.isDisposed).toBe(true);
    });

    it('counts a relay once, so a second EOSE after a reconnect cannot end the query early', async () => {
        const query = queryRelaysOnce(['wss://a', 'wss://b'], FILTERS);
        const relayA = getClient(0);
        const relayB = getClient(1);

        relayA.onEose?.();
        relayA.onEose?.();

        expect(relayB.isDisposed).toBe(false);

        relayB.deliver('late');
        relayB.onEose?.();

        const events = await query;

        expect(events.map(event => event.id)).toEqual(['late']);
        expect(relayB.isDisposed).toBe(true);
    });

    it('counts a relay that failed to open and later sent EOSE once', async () => {
        const query = queryRelaysOnce(['wss://a', 'wss://b'], FILTERS);
        const relayA = getClient(0);
        const relayB = getClient(1);

        relayA.rejectConnect(new Error('relay down'));
        await flushPromises();
        relayA.onEose?.();

        expect(relayB.isDisposed).toBe(false);

        relayB.onEose?.();
        await query;

        expect(relayB.isDisposed).toBe(true);
    });

    it('caps the kept events, so a relay flooding forged events cannot grow the result without limit', async () => {
        const maxQueryEvents = 4096;
        const query = queryRelaysOnce(['wss://a'], FILTERS);
        const relay = getClient(0);

        for (let index = 0; index < maxQueryEvents + 500; index++) {
            relay.deliver(`flood-${index}`);
        }
        relay.onEose?.();

        const events = await query;

        expect(events).toHaveLength(maxQueryEvents);
        expect(events[0]?.id).toBe('flood-0');
        expect(events.some(event => event.id === `flood-${maxQueryEvents + 100}`)).toBe(false);
    });

    it('resolves at the timeout with what arrived so far', async () => {
        const query = queryRelaysOnce(['wss://a'], FILTERS, 10);
        getClient(0).deliver('id1');

        const events = await query;

        expect(events.map(event => event.id)).toEqual(['id1']);
        expect(getClient(0).isDisposed).toBe(true);
    });

    it('stops with what arrived so far when every pool is disposed', async () => {
        const query = queryRelaysOnce(['wss://a', 'wss://b'], FILTERS);
        getClient(0).deliver('id1');

        disposeAllRelayPools();
        const events = await query;

        expect(events.map(event => event.id)).toEqual(['id1']);
        expect(mockClients.every(client => client.isDisposed)).toBe(true);
    });

    it('resolves immediately for an empty relay or filter list', async () => {
        await expect(queryRelaysOnce([], FILTERS)).resolves.toEqual([]);
        await expect(queryRelaysOnce(['wss://a'], [])).resolves.toEqual([]);
        expect(mockClients).toHaveLength(0);
    });
});

describe('reconcileRelayPool', () => {
    const WALLET = 'wallet-a';
    const subscription = { urls: ['wss://a', 'wss://b'], filters: FILTERS };

    const reconcile = (nextSubscription: typeof subscription | undefined, deviceState = WALLET) => {
        const onEvent = jest.fn();
        const onConnectedChange = jest.fn();
        reconcileRelayPool({
            deviceState,
            subscription: nextSubscription,
            onEvent,
            onConnectedChange,
        });

        return { onEvent, onConnectedChange };
    };

    beforeEach(() => {
        disposeAllRelayPools();
        mockClients.length = 0;
    });

    it('opens one client per relay and reports which relays are connected', () => {
        const { onEvent, onConnectedChange } = reconcile(subscription);
        const relayA = getClient(0);
        const relayB = getClient(1);

        expect(mockClients.map(client => client.url)).toEqual(['wss://a', 'wss://b']);
        expect(relayA.filters).toEqual(FILTERS);

        relayB.onStatusChange?.(true);
        relayA.onStatusChange?.(true);
        relayB.onStatusChange?.(false);

        expect(onConnectedChange.mock.calls).toEqual([
            [false, []],
            [true, ['wss://b']],
            [true, ['wss://b', 'wss://a']],
            [true, ['wss://a']],
        ]);

        relayA.deliver('id1');

        expect(onEvent).toHaveBeenCalledWith({ id: 'id1' });
    });

    it('keeps the pool for an unchanged subscription', () => {
        reconcile(subscription);
        reconcile({ urls: [...subscription.urls], filters: [...FILTERS] });

        expect(mockClients).toHaveLength(2);
        expect(mockClients.some(client => client.isDisposed)).toBe(false);
    });

    it('rebuilds the pool when the subscription changes and ignores the replaced clients', () => {
        const replacedPool = reconcile(subscription);
        const replacedClient = getClient(0);

        const { onConnectedChange } = reconcile({ ...subscription, urls: ['wss://c'] });
        replacedClient.onStatusChange?.(true);

        expect(replacedClient.isDisposed).toBe(true);
        expect(getClient(1).isDisposed).toBe(true);
        expect(getClient(2).url).toBe('wss://c');
        expect(replacedPool.onConnectedChange.mock.calls).toEqual([[false, []]]);
        expect(onConnectedChange.mock.calls).toEqual([[false, []]]);
    });

    it('tears the pool down when there is no subscription or no relay', () => {
        reconcile(subscription);
        reconcile(undefined);

        expect(mockClients.every(client => client.isDisposed)).toBe(true);

        reconcile(subscription);
        reconcile({ ...subscription, urls: [] });

        expect(mockClients.every(client => client.isDisposed)).toBe(true);
    });

    it('publishes only to the pool of the given wallet', () => {
        reconcile(subscription, 'wallet-a');
        reconcile({ ...subscription, urls: ['wss://c'] }, 'wallet-b');
        const draft = { kind: 7925, tags: [], content: 'reply' };

        publishDraftToPool('wallet-b', draft);

        expect(mockClients.map(client => client.publishedDrafts)).toEqual([[], [], [draft]]);
    });

    it('disposes the pools of wallets that are no longer kept', () => {
        reconcile(subscription, 'wallet-a');
        reconcile({ ...subscription, urls: ['wss://c'] }, 'wallet-b');

        disposeRelayPoolsExcept(new Set(['wallet-b']));

        expect(mockClients.map(client => client.isDisposed)).toEqual([true, true, false]);
    });
});
