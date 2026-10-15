import type {
    ElectrumBlockHeader as BlockHeader,
    ElectrumTypes,
} from '@trezor/blockchain-link-types';

import { CachingElectrumClient } from './caching';
import type { ISocket, SocketListener } from '../sockets/interface';
import { blockheaderToBlockhash } from '../utils/transform';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

const TXID = 'aa'.repeat(32);
const SCRIPTHASH = 'cc'.repeat(32);
// Transactions fetched less than a minute before a block are not trusted to be cached.
const LATER_MS = 61 * 1000;

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

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly requests: JsonRpcRequest[] = [];
    tip = createBlock(100);
    transaction = createTransaction(1);
    status = 'status-1';
    // Called when a request arrives, before it is answered.
    onRequest?: (method: string) => void;

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
        const responses = requests.map(({ id, method }) => ({
            jsonrpc: '2.0',
            id,
            result: this.getResult(method),
        }));
        setImmediate(() => this.receive(responses));
    }

    private getResult(method: string) {
        switch (method) {
            case 'server.version':
                return ['MockElectrum 1.0', '1.4'];
            case 'blockchain.headers.subscribe':
                return this.tip;
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

    private receive(message: unknown) {
        this.listener?.onReceive(`${JSON.stringify(message)}\n`);
    }

    notifyBlock(block: BlockHeader) {
        this.tip = block;
        this.receive({ jsonrpc: '2.0', method: 'blockchain.headers.subscribe', params: [block] });
    }

    notifyStatus(status: string) {
        this.status = status;
        this.receive({
            jsonrpc: '2.0',
            method: 'blockchain.scripthash.subscribe',
            params: [SCRIPTHASH, status],
        });
    }

    getRequestCount(method: string) {
        return this.requests.filter(request => request.method === method).length;
    }
}

const clients: CachingElectrumClient[] = [];

const connectClient = async () => {
    const socket = new MockSocket();
    const client = new CachingElectrumClient();
    clients.push(client);
    await client.connect(socket, {
        url: 'mock',
        coin: 'BTC',
        client: { name: 'test', protocolVersion: '1.4' },
    });

    return { socket, client };
};

const passTime = () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + LATER_MS);
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

    it('fetches a confirmed transaction again after a reorg', async () => {
        const { socket, client } = await connectClient();

        await client.request('blockchain.transaction.get', TXID, true);
        passTime();
        socket.notifyBlock(createBlock(101));
        await client.request('blockchain.transaction.get', TXID, true);

        expect(socket.getRequestCount('blockchain.transaction.get')).toBe(2);
    });
});
