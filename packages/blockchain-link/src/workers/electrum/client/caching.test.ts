import type {
    ElectrumBlockHeader as BlockHeader,
    ElectrumTypes,
} from '@trezor/blockchain-link-types';

import { CachingElectrumClient, createElectrumCache } from './caching';
import type { ISocket, SocketListener } from '../sockets/interface';
import { blockheaderToBlockhash } from '../utils/transform';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

const TXID = 'aa'.repeat(32);
const OTHER_TXID = 'dd'.repeat(32);
const SCRIPTHASH = 'cc'.repeat(32);
// Transactions fetched less than a minute before a block are not trusted to be cached.
const LATER_MS = 61 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const createBlock = (height: number, prevBlock?: BlockHeader): BlockHeader => {
    const prevHash = prevBlock
        ? Buffer.from(blockheaderToBlockhash(prevBlock.hex), 'hex').reverse()
        : Buffer.alloc(32);
    const merkleRoot = Buffer.alloc(32, height);
    const hex = Buffer.concat([Buffer.alloc(4), prevHash, merkleRoot, Buffer.alloc(12)]).toString(
        'hex',
    );

    return { height, hex };
};

const createTransaction = (confirmations: number): ElectrumTypes.TransactionVerbose => ({
    txid: TXID,
    hash: TXID,
    hex: '00',
    blockhash: confirmations ? 'bb'.repeat(32) : '',
    version: 2,
    size: 100,
    vsize: 100,
    weight: 400,
    locktime: 0,
    confirmations,
    time: 1,
    blocktime: 1,
    vin: [{ coinbase: '00', sequence: 0 }],
    vout: [],
});

const createStatusNotification = (status: string | null) => ({
    jsonrpc: '2.0',
    method: 'blockchain.scripthash.subscribe',
    params: [SCRIPTHASH, status],
});

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly requests: JsonRpcRequest[] = [];
    tip = createBlock(100);
    // Blocks of the chain below the tip.
    chain: BlockHeader[] = [];
    transaction = createTransaction(1);
    status: string | null = 'status-1';
    // Called when a request arrives, before it is answered.
    onRequest?: (method: string) => void;
    // Answered with an error, like ElectrumX does e.g. for a height out of range.
    failingMethod?: string;
    // Closes the connection instead of answering.
    closingMethod?: string;
    // Sent in the same chunk right after the next responses.
    private nextNotifications: unknown[] = [];

    connect(listener: SocketListener) {
        this.listener = listener;

        return Promise.resolve();
    }

    close() {}

    send(data: string) {
        const message = JSON.parse(data);
        const requests: JsonRpcRequest[] = Array.isArray(message) ? message : [message];
        this.requests.push(...requests);
        requests.forEach(({ method }) => this.onRequest?.(method));
        if (requests.some(({ method }) => method === this.closingMethod)) {
            this.listener?.onClose('closed by the server');

            return;
        }
        const responses = requests.map(request =>
            request.method === this.failingMethod
                ? { jsonrpc: '2.0', id: request.id, error: { code: 1, message: 'server error' } }
                : { jsonrpc: '2.0', id: request.id, result: this.getResult(request) },
        );
        const notifications = this.nextNotifications.splice(0);
        setImmediate(() => this.receive(responses, ...notifications));
    }

    private getResult({ method, params }: JsonRpcRequest) {
        switch (method) {
            case 'server.version':
                return ['MockElectrum 1.0', '1.4'];
            case 'blockchain.headers.subscribe':
                return this.tip;
            case 'blockchain.block.header':
                return [...this.chain, this.tip].find(({ height }) => height === params[0])?.hex;
            case 'blockchain.scripthash.subscribe':
                return this.status;
            case 'blockchain.scripthash.get_history':
                return [{ tx_hash: TXID, height: 100 }];
            case 'blockchain.transaction.get':
                return this.transaction;
            default:
                return null;
        }
    }

    private receive(...messages: unknown[]) {
        this.listener?.onReceive(messages.map(message => `${JSON.stringify(message)}\n`).join(''));
    }

    notifyBlock(block: BlockHeader) {
        this.tip = block;
        this.receive({ jsonrpc: '2.0', method: 'blockchain.headers.subscribe', params: [block] });
    }

    notifyStatus(status: string | null) {
        this.status = status;
        this.receive(createStatusNotification(status));
    }

    notifyStatusWithNextResponses(status: string | null) {
        this.nextNotifications.push(createStatusNotification(status));
    }

    getRequestCount(method: string) {
        return this.requests.filter(request => request.method === method).length;
    }
}

const clients: CachingElectrumClient[] = [];

const connectClient = async (cache = createElectrumCache(), socket = new MockSocket()) => {
    const client = new CachingElectrumClient(cache);
    clients.push(client);
    await client.connect(socket, {
        url: 'mock',
        coin: 'BTC',
        client: { name: 'test', protocolVersion: '1.4' },
    });

    return { socket, client };
};

const passTime = (ms = LATER_MS) => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + ms);
};

describe('CachingElectrumClient', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        clients.splice(0).forEach(client => client.close());
    });

    it('sends identical requests waiting for a response only once', async () => {
        const { socket, client } = await connectClient();

        const results = await Promise.all([
            client.request('blockchain.transaction.get', TXID, true),
            client.request('blockchain.transaction.get', TXID, true),
        ]);

        expect(results).toEqual([socket.transaction, socket.transaction]);
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(1);
    });

    it('sends the same request again when the status changed while it was waiting', async () => {
        const { socket, client } = await connectClient();
        let second: Promise<unknown> | undefined;
        socket.onRequest = method => {
            if (method === 'blockchain.scripthash.get_history') {
                socket.onRequest = undefined;
                socket.notifyStatus('status-2');
                second = client.request('blockchain.scripthash.get_history', SCRIPTHASH);
            }
        };

        await client.request('blockchain.scripthash.get_history', SCRIPTHASH);
        await second;

        expect(socket.getRequestCount('blockchain.scripthash.get_history')).toBe(2);
    });

    it('does not fetch a confirmed transaction again after a new block', async () => {
        const { socket, client } = await connectClient();

        await client.request('blockchain.transaction.get', TXID, true);
        passTime();
        socket.notifyBlock(createBlock(101, socket.tip));
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx).toEqual({ ...socket.transaction, confirmations: 2 });
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(1);
    });

    it('fetches a transaction again when its node was a block ahead', async () => {
        const { socket, client } = await connectClient();
        // The node of the server already has block 101, which is not announced yet.
        socket.transaction = createTransaction(2);

        await client.request('blockchain.transaction.get', TXID, true);
        socket.notifyBlock(createBlock(101, socket.tip));
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(2);
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(2);
    });

    it('fetches a transaction again when a block arrived while it was waiting', async () => {
        const { socket, client } = await connectClient();
        socket.onRequest = method => {
            if (method === 'blockchain.transaction.get') {
                socket.onRequest = undefined;
                socket.notifyBlock(createBlock(101, socket.tip));
            }
        };

        await client.request('blockchain.transaction.get', TXID, true);
        passTime();
        socket.transaction = createTransaction(2);
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(2);
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(2);
    });

    it('fetches an unconfirmed transaction again after a new block', async () => {
        const { socket, client } = await connectClient();
        socket.transaction = createTransaction(0);

        await client.request('blockchain.transaction.get', TXID, true);
        passTime();
        socket.notifyBlock(createBlock(101, socket.tip));
        await client.request('blockchain.transaction.get', TXID, true);

        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(2);
    });

    it('sends fee estimates and broadcasts before the subscriptions waiting in the queue', async () => {
        const { socket, client } = await connectClient();
        const subscriptions = Array.from({ length: 100 }, (_, i) =>
            client.request('blockchain.scripthash.subscribe', i.toString(16).padStart(64, '0')),
        );
        const urgent = [
            client.request('blockchain.estimatefee', 2),
            client.request('blockchain.transaction.broadcast', '00'),
        ];

        await Promise.all([...subscriptions, ...urgent]);

        const methods = socket.requests.map(({ method }) => method);
        const firstSubscription = methods.indexOf('blockchain.scripthash.subscribe');
        expect(methods.indexOf('blockchain.estimatefee')).toBeLessThan(firstSubscription);
        expect(methods.indexOf('blockchain.transaction.broadcast')).toBeLessThan(firstSubscription);
    });

    it('lets the client of the next connection reuse what the previous one fetched', async () => {
        const cache = createElectrumCache();
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        await previous.client.request('blockchain.scripthash.get_history', SCRIPTHASH);
        previous.client.close();

        const { socket, client } = await connectClient(cache);
        const tx = await client.request('blockchain.transaction.get', TXID, true);
        await client.request('blockchain.scripthash.get_history', SCRIPTHASH);

        expect(tx).toEqual(socket.transaction);
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(0);
        // The subscription belongs to the connection, the history of the same status doesn't.
        expect(socket.getRequestCount('blockchain.scripthash.subscribe')).toBe(1);
        expect(socket.getRequestCount('blockchain.scripthash.get_history')).toBe(0);
    });

    it('does not ask for the history, balance and unspent outputs of an unused address', async () => {
        const { socket, client } = await connectClient();
        socket.status = null;

        const results = await Promise.all([
            client.request('blockchain.scripthash.get_history', SCRIPTHASH),
            client.request('blockchain.scripthash.get_balance', SCRIPTHASH),
            client.request('blockchain.scripthash.listunspent', SCRIPTHASH),
        ]);

        expect(results).toEqual([[], { confirmed: 0, unconfirmed: 0 }, []]);
        expect(socket.requests.map(({ method }) => method)).toEqual([
            'server.version',
            'blockchain.headers.subscribe',
            'blockchain.scripthash.subscribe',
        ]);
    });

    it('keeps the status of a notification which came together with the subscription', async () => {
        const { socket, client } = await connectClient();
        socket.status = null;
        socket.onRequest = method => {
            if (method === 'blockchain.scripthash.subscribe') {
                socket.onRequest = undefined;
                socket.notifyStatusWithNextResponses('status-2');
            }
        };

        const history = await client.request('blockchain.scripthash.get_history', SCRIPTHASH);

        expect(history).toEqual([{ tx_hash: TXID, height: 100 }]);
        expect(socket.getRequestCount('blockchain.scripthash.get_history')).toBe(1);
    });

    it('keeps confirmed transactions when the chain only grew while disconnected', async () => {
        const cache = createElectrumCache();
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        passTime();
        await previous.client.request('blockchain.transaction.get', OTHER_TXID, true);
        previous.client.close();

        passTime(HOUR_MS);
        const socket = new MockSocket();
        socket.chain = [previous.socket.tip, createBlock(101, previous.socket.tip)];
        socket.tip = createBlock(102, socket.chain[1]);
        const { client } = await connectClient(cache, socket);
        const tx = await client.request('blockchain.transaction.get', TXID, true);
        await client.request('blockchain.transaction.get', OTHER_TXID, true);

        expect(tx.confirmations).toBe(3);
        expect(socket.getRequestCount('blockchain.block.header')).toBe(1);
        // The new blocks may have come right after the last transaction was fetched, so its
        // confirmations may have been counted from a block which was never announced.
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(1);
    });

    it('fetches confirmed transactions again when the chain changed while disconnected', async () => {
        const cache = createElectrumCache();
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        passTime();
        await previous.client.request('blockchain.transaction.get', OTHER_TXID, true);
        previous.client.close();

        // Block 100 was replaced and the transaction went back to the mempool.
        const socket = new MockSocket();
        socket.chain = [createBlock(100, createBlock(99))];
        socket.tip = createBlock(101, socket.chain[0]);
        socket.transaction = createTransaction(0);
        const { client } = await connectClient(cache, socket);
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(1);
    });

    it('fetches confirmed transactions again from a server which is behind', async () => {
        const cache = createElectrumCache();
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        passTime();
        await previous.client.request('blockchain.transaction.get', OTHER_TXID, true);
        previous.client.close();

        const socket = new MockSocket();
        socket.tip = createBlock(99);
        socket.transaction = createTransaction(0);
        const { client } = await connectClient(cache, socket);
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
        expect(socket.getRequestCount('blockchain.block.header')).toBe(0);
        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(1);
    });

    it('fetches confirmed transactions again when the server cannot tell the cached tip', async () => {
        const cache = createElectrumCache();
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        previous.client.close();

        const socket = new MockSocket();
        socket.failingMethod = 'blockchain.block.header';
        socket.tip = createBlock(102);
        socket.transaction = createTransaction(0);
        const { client } = await connectClient(cache, socket);
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
    });

    it('keeps the cache when the server closed the connection while connecting', async () => {
        const cache = createElectrumCache();
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        previous.client.close();

        const closing = new MockSocket();
        closing.closingMethod = 'blockchain.block.header';
        closing.tip = createBlock(102);
        await expect(connectClient(cache, closing)).rejects.toThrow();

        const { socket, client } = await connectClient(cache);
        await client.request('blockchain.transaction.get', TXID, true);

        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(0);
    });

    it('does not reuse transactions counted by the node of a previous connection', async () => {
        const cache = createElectrumCache();
        // The node of the previous server already had block 101, which it announced right after.
        const previous = await connectClient(cache);
        await previous.client.request('blockchain.transaction.get', TXID, true);
        previous.socket.notifyBlock(createBlock(101, previous.socket.tip));
        previous.client.close();

        // Another server is still at block 100 and its node doesn't have block 101 yet.
        const socket = new MockSocket();
        socket.transaction = createTransaction(0);
        const { client } = await connectClient(cache, socket);
        const tx = await client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
    });

    it('does not use transactions counted on the chain of another client', async () => {
        const cache = createElectrumCache();
        const first = await connectClient(cache);
        const socket = new MockSocket();
        socket.tip = createBlock(100, createBlock(99));
        const second = await connectClient(cache, socket);
        await second.client.request('blockchain.transaction.get', TXID, true);

        first.socket.transaction = createTransaction(0);
        const tx = await first.client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
    });

    it('does not store transactions counted on a chain which is not the tip of the cache', async () => {
        const cache = createElectrumCache();
        const first = await connectClient(cache);
        const socket = new MockSocket();
        socket.tip = createBlock(100, createBlock(99));
        const second = await connectClient(cache, socket);
        await first.client.request('blockchain.transaction.get', TXID, true);

        second.socket.transaction = createTransaction(0);
        const tx = await second.client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
    });

    it('does not keep transactions of another chain when the own chain grows', async () => {
        const cache = createElectrumCache();
        const first = await connectClient(cache);
        const socket = new MockSocket();
        socket.tip = createBlock(100, createBlock(99));
        const second = await connectClient(cache, socket);
        await second.client.request('blockchain.transaction.get', TXID, true);

        passTime();
        first.socket.notifyBlock(createBlock(101, first.socket.tip));
        first.socket.transaction = createTransaction(0);
        const tx = await first.client.request('blockchain.transaction.get', TXID, true);

        expect(tx.confirmations).toBe(0);
    });

    it('fetches a confirmed transaction again after a reorg', async () => {
        const { socket, client } = await connectClient();

        await client.request('blockchain.transaction.get', TXID, true);
        passTime();
        socket.notifyBlock(createBlock(101));
        await client.request('blockchain.transaction.get', TXID, true);

        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(2);
    });
});
