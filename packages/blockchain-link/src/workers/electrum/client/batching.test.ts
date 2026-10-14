import { BatchingJsonRpcClient } from './batching';
import type { ISocket, SocketListener } from '../sockets/interface';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly requests: JsonRpcRequest[] = [];
    readonly writes: unknown[] = [];
    private answered = 0;

    connect(listener: SocketListener) {
        this.listener = listener;

        return Promise.resolve();
    }

    close() {}

    send(data: string) {
        const message = JSON.parse(data);
        this.writes.push(message);
        this.requests.push(...(Array.isArray(message) ? message : [message]));
    }

    getWaitingCount() {
        return this.requests.length - this.answered;
    }

    respondToWaiting(error?: { code: number; message: string }) {
        const waiting = this.requests.slice(this.answered);
        this.answered = this.requests.length;
        const responses = waiting.map(({ id }) =>
            error ? { jsonrpc: '2.0', id, error } : { jsonrpc: '2.0', id, result: id },
        );
        this.listener?.onReceive(`${JSON.stringify(responses)}\n`);
    }

    closeByServer() {
        this.listener?.onClose(undefined);
    }
}

class UnbatchedClient extends BatchingJsonRpcClient {
    protected batchingDisabled = true;
}

const REQUEST_COUNT = 100;
const BATCH_TIMEOUT_MS = 50;
// Error of ElectrumX for a request which waited too long in its queue.
const SERVER_BUSY = { code: -102, message: 'server busy - request timed out' };

const connectClient = async (client = new BatchingJsonRpcClient()) => {
    const socket = new MockSocket();
    await client.connect(socket);

    return { socket, client };
};

const sendRequests = (client: BatchingJsonRpcClient, count = REQUEST_COUNT) =>
    Array.from({ length: count }, (_, i) => client.request('method', i));

// Answers everything waiting until nothing is left and returns how many requests were waiting
// before each answer.
const respondUntilDone = (socket: MockSocket, beforeRespond = () => {}) => {
    const waitingCounts: number[] = [];
    while (socket.getWaitingCount()) {
        waitingCounts.push(socket.getWaitingCount());
        beforeRespond();
        socket.respondToWaiting();
    }

    return waitingCounts;
};

describe('BatchingJsonRpcClient', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('limits requests waiting for a response and raises the limit when the server is fast', async () => {
        const { socket, client } = await connectClient();
        const results = Promise.all(sendRequests(client));
        jest.advanceTimersByTime(BATCH_TIMEOUT_MS);

        const waitingCounts = respondUntilDone(socket);

        await expect(results).resolves.toHaveLength(REQUEST_COUNT);
        expect(waitingCounts[0]).toBe(10);
        expect(Math.max(...waitingCounts)).toBeLessThan(REQUEST_COUNT / 2);
        expect(waitingCounts.at(-2)).toBeGreaterThan(10);
        client.close();
    });

    it('never lets more than 20 requests wait', async () => {
        const { socket, client } = await connectClient();
        const results = Promise.all(sendRequests(client, 2000));
        jest.advanceTimersByTime(BATCH_TIMEOUT_MS);

        const waitingCounts = respondUntilDone(socket);

        await expect(results).resolves.toHaveLength(2000);
        expect(Math.max(...waitingCounts)).toBe(20);
        client.close();
    });

    it('lowers the limit when the server responds slowly', async () => {
        const { socket, client } = await connectClient();
        const results = Promise.all(sendRequests(client));
        jest.advanceTimersByTime(BATCH_TIMEOUT_MS);

        const waitingCounts = respondUntilDone(socket, () => jest.advanceTimersByTime(6000));

        await expect(results).resolves.toHaveLength(REQUEST_COUNT);
        expect(waitingCounts[0]).toBe(10);
        expect(waitingCounts.at(-2)).toBe(1);
        client.close();
    });

    it('counts error responses as answered', async () => {
        const { socket, client } = await connectClient();
        const results = Promise.allSettled(sendRequests(client));
        jest.advanceTimersByTime(BATCH_TIMEOUT_MS);

        while (socket.getWaitingCount()) socket.respondToWaiting(SERVER_BUSY);

        const settled = await results;
        expect(settled.every(({ status }) => status === 'rejected')).toBe(true);
        expect(socket.requests).toHaveLength(REQUEST_COUNT);
        client.close();
    });

    it('sends requests one by one when batching is disabled', async () => {
        const { socket, client } = await connectClient(new UnbatchedClient());
        const results = Promise.all(sendRequests(client));

        const waitingCounts = respondUntilDone(socket);

        await expect(results).resolves.toHaveLength(REQUEST_COUNT);
        expect(waitingCounts[0]).toBe(10);
        expect(socket.writes.some(message => Array.isArray(message))).toBe(false);
        client.close();
    });

    it('fails all requests when the server closes the connection', async () => {
        const { socket, client } = await connectClient();
        const results = Promise.allSettled(sendRequests(client));
        jest.advanceTimersByTime(BATCH_TIMEOUT_MS);

        socket.closeByServer();

        const settled = await results;
        expect(settled).toEqual(
            Array(REQUEST_COUNT).fill({
                status: 'rejected',
                reason: new Error('Connection closed'),
            }),
        );
        expect(client.isConnected()).toBe(false);

        const lateResults = Promise.allSettled(sendRequests(client, 3));
        jest.advanceTimersByTime(BATCH_TIMEOUT_MS);
        expect(await lateResults).toEqual(
            Array(3).fill({
                status: 'rejected',
                reason: new Error('Connection not established'),
            }),
        );
        expect(socket.requests).toHaveLength(10);
    });
});
