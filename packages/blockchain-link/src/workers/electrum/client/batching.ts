import { type TimerId } from '@trezor/type-utils';

import { JsonRpcClient } from './json-rpc';

type Options = {
    timeoutMs?: number;
    maxQueueLength?: number;
};

type QueuedRequest = {
    id: number;
    message: string;
};

const TIMEOUT_MS = 50;
const MAX_QUEUE_LENGTH = 15;

// Servers process only a few requests of a client at once and let the rest wait, ElectrumX even
// throttles costly clients and fails requests waiting longer than 30 s. So the number of requests
// waiting for a response is limited and adjusted to the response time the same way aiorpcX
// (the RPC library of Electrum and ElectrumX) does it. The limit is kept low, as ElectrumX charges
// a request which timed out in its queue like a hundred regular ones.
const INITIAL_IN_FLIGHT = 10;
const MAX_IN_FLIGHT = 20;
const TARGET_RESPONSE_TIME_MS = 3000;
const RECALIBRATE_COUNT = 10;

// TODO batching should in theory improve performance
export class BatchingJsonRpcClient extends JsonRpcClient {
    private queue: QueuedRequest[] = [];
    // Requests of methods a user waits for, e.g. fee estimates of the send form, go before the
    // requests waiting in the queue, such as the subscriptions of all addresses after connecting.
    protected urgentMethods: string[] = [];
    private urgentQueue: QueuedRequest[] = [];
    private batchTimer?: TimerId;
    private inFlight = new Map<number, number>();
    private maxInFlight = INITIAL_IN_FLIGHT;
    private responseTimes: number[] = [];

    private timeoutMs: number;
    private maxQueueLength: number;

    protected batchingDisabled = false;

    constructor(options?: Options) {
        super();
        this.timeoutMs = options?.timeoutMs || TIMEOUT_MS;
        this.maxQueueLength = options?.maxQueueLength || MAX_QUEUE_LENGTH;
    }

    protected send(ids: number[], message: string) {
        const { method } = JSON.parse(message);
        const queue = this.urgentMethods.includes(method) ? this.urgentQueue : this.queue;
        ids.forEach(id => queue.push({ id, message }));
        if (this.batchingDisabled) {
            this.flush();

            return;
        }
        if (this.batchTimer) clearTimeout(this.batchTimer);
        this.batchTimer = setTimeout(() => {
            this.batchTimer = undefined;
            this.flush();
        }, this.timeoutMs);
    }

    private flush() {
        while (
            (this.urgentQueue.length || this.queue.length) &&
            this.inFlight.size < this.maxInFlight
        ) {
            const free = this.maxInFlight - this.inFlight.size;
            // Urgent requests go in a batch of their own, as a server may answer a batch only when
            // all of its requests are done.
            const queue = this.urgentQueue.length ? this.urgentQueue : this.queue;
            const batch = queue.splice(
                0,
                this.batchingDisabled ? 1 : Math.min(free, this.maxQueueLength),
            );
            const ids = batch.map(({ id }) => id);
            if (this.isConnected()) {
                const sentAt = Date.now();
                ids.forEach(id => this.inFlight.set(id, sentAt));
            }
            const content =
                batch.length > 1
                    ? `[${batch.map(({ message }) => message).join(',')}]`
                    : batch.map(({ message }) => message).join('');
            super.send(ids, content);
        }
    }

    private onResponseTime(id: unknown) {
        const sentAt = typeof id === 'number' ? this.inFlight.get(id) : undefined;
        if (sentAt === undefined) return;
        this.inFlight.delete(id as number);
        this.responseTimes.push(Date.now() - sentAt);
        if (this.responseTimes.length < RECALIBRATE_COUNT) return;

        const average = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
        this.responseTimes = [];
        const current = this.maxInFlight;
        const cap = Math.min(current + Math.max(3, current * 0.1), MAX_IN_FLIGHT);
        const floor = Math.max(1, Math.min(current * 0.8, current - 1));
        const target = average ? (current * TARGET_RESPONSE_TIME_MS) / average : cap;
        this.maxInFlight = Math.round(Math.max(floor, Math.min(cap, target)));
    }

    protected onMessage(body: string) {
        const msg = JSON.parse(body);
        this.log('RECEIVED:', msg);
        const responses = Array.isArray(msg) ? msg : [msg];
        responses.forEach(response => {
            this.onResponseTime(response?.id);
            this.response(response);
        });
        this.flush();
    }

    onClose() {
        super.onClose();
        if (this.batchTimer) clearTimeout(this.batchTimer);
        this.batchTimer = undefined;
        this.queue = [];
        this.urgentQueue = [];
        this.inFlight.clear();
    }
}
