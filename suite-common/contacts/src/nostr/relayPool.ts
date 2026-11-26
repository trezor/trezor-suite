import { type NostrEvent } from './nostrEvent';
import {
    type CreateRelaySocket,
    RelayClient,
    type RelayFilter,
    rememberEventId,
} from './relayClient';

type RelayPoolParams = {
    urls: string[];
    createSocket?: CreateRelaySocket;
};

type SubscribeParams = {
    filters: RelayFilter[];
    onEvent: (event: NostrEvent) => void;
};

type QueryParams = {
    filters: RelayFilter[];
};

/** The same subscriptions, queries and publishes on every relay, with their events merged. */
export class RelayPool {
    /** How many relays are connected, on every change. */
    onStatusChange?: (connectedCount: number) => void;

    private readonly clients: RelayClient[];
    private readonly connectedUrls = new Set<string>();
    private readonly seenEventIds = new Set<string>();

    constructor({ urls, createSocket }: RelayPoolParams) {
        this.clients = urls.map(url => {
            const client = new RelayClient({ url, createSocket });

            client.onStatusChange = isConnected => {
                if (isConnected) {
                    this.connectedUrls.add(url);
                } else {
                    this.connectedUrls.delete(url);
                }

                this.onStatusChange?.(this.connectedUrls.size);
            };

            return client;
        });
    }

    get relayCount() {
        return this.clients.length;
    }

    subscribe({ filters, onEvent }: SubscribeParams) {
        const unsubscribes = this.clients.map(client =>
            client.subscribe({
                filters,
                onEvent: event => {
                    if (rememberEventId(this.seenEventIds, event.id)) onEvent(event);
                },
            }),
        );

        return () => unsubscribes.forEach(unsubscribe => unsubscribe());
    }

    async query({ filters }: QueryParams) {
        const results = await Promise.all(this.clients.map(client => client.query({ filters })));
        const events = new Map<string, NostrEvent>();

        results.flat().forEach(event => events.set(event.id, event));

        return [...events.values()];
    }

    /** Whether at least one relay took the event; resolves as soon as one has. */
    publish(event: NostrEvent) {
        return new Promise<boolean>(resolve => {
            let pendingCount = this.clients.length;

            if (pendingCount === 0) {
                resolve(false);

                return;
            }

            this.clients.forEach(client =>
                client.publish(event).then(isAccepted => {
                    pendingCount -= 1;

                    if (isAccepted || pendingCount === 0) resolve(isAccepted);
                }),
            );
        });
    }

    close() {
        this.onStatusChange = undefined;
        this.clients.forEach(client => client.close());
        this.seenEventIds.clear();
    }
}
