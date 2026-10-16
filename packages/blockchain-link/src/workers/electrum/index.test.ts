import { type AddressInfo, type Server, type Socket, createServer } from 'net';

import { Transaction, address, networks } from '@trezor/utxo-lib';

import { addressToScripthash } from './utils/transform';
import { BlockchainLink } from '../../index';

import ElectrumWorker from './index';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

const ADDRESS = 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk';
const SCRIPTHASH = addressToScripthash(ADDRESS, networks.bitcoin);
const TX_COUNT = 100;
const RESPONSE_DELAY_MS = 5;
const BLOCK_TIME = 1;

type CreateTransactionParams = { prevTxid?: string; coinbase?: string };

// A transaction paying 100000 satoshi to ADDRESS, from the output of the previous one.
const createTransaction = ({ prevTxid, coinbase = '00' }: CreateTransactionParams) => {
    const tx = new Transaction();
    tx.ins.push({
        hash: prevTxid ? Buffer.from(prevTxid, 'hex').reverse() : Buffer.alloc(32),
        index: prevTxid ? 0 : 0xffffffff,
        script: prevTxid ? Buffer.alloc(0) : Buffer.from(coinbase, 'hex'),
        sequence: 0xffffffff,
        witness: prevTxid ? [Buffer.alloc(72)] : [],
    });
    tx.outs.push({ script: address.toOutputScript(ADDRESS, networks.bitcoin), value: '100000' });

    return { txid: tx.getId(), hex: tx.toHex() };
};

const prevTransactions = Array.from({ length: TX_COUNT }, (_, i) =>
    createTransaction({ coinbase: i.toString(16).padStart(4, '0') }),
);
const transactions = prevTransactions.map(({ txid }) => createTransaction({ prevTxid: txid }));
const getTxid = (index: number) => transactions[index]?.txid ?? '';
const rawTransactions = new Map(
    [...transactions, ...prevTransactions].map(({ txid, hex }) => [txid, hex]),
);

const createHeader = () => {
    const header = Buffer.alloc(80);
    header.writeUInt32LE(BLOCK_TIME, 68);

    return header.toString('hex');
};

const getResult = ({ method, params }: JsonRpcRequest) => {
    switch (method) {
        case 'server.version':
            return ['MockElectrum 1.0', '1.4'];
        case 'blockchain.headers.subscribe':
            return { height: 1000, hex: '00'.repeat(80) };
        case 'blockchain.block.header':
            return createHeader();
        case 'blockchain.scripthash.subscribe':
            return 'status';
        case 'blockchain.scripthash.get_balance':
            return { confirmed: TX_COUNT * 100000, unconfirmed: 0 };
        case 'blockchain.scripthash.get_history':
            return Array.from({ length: TX_COUNT }, (_, i) => ({
                tx_hash: getTxid(i),
                height: 990 - i,
            }));
        case 'blockchain.transaction.get':
            return rawTransactions.get(params[0] as string);
        default:
            return null;
    }
};

// Mimics ElectrumX 2.0 which closes connections not starting with server.version
// and counts requests the client lets wait for a response.
const createElectrumServer = async () => {
    const sockets: Socket[] = [];
    const stats = {
        firstMethods: [] as string[],
        waiting: 0,
        maxWaiting: 0,
        requestedTxids: [] as string[],
        verboseRequests: 0,
    };

    const server: Server = createServer(socket => {
        sockets.push(socket);
        let buffer = '';
        let isVersionSeen = false;

        socket.setEncoding('utf8');
        socket.on('data', chunk => {
            const lines = (buffer + chunk).split('\n');
            buffer = lines.pop() ?? '';
            lines.forEach(line => {
                const message = JSON.parse(line);
                const requests: JsonRpcRequest[] = Array.isArray(message) ? message : [message];
                if (!isVersionSeen) {
                    stats.firstMethods.push(requests[0]?.method ?? '');
                    isVersionSeen = requests[0]?.method === 'server.version';
                    if (!isVersionSeen) {
                        socket.destroy();

                        return;
                    }
                }
                requests
                    .filter(({ method }) => method === 'blockchain.transaction.get')
                    .forEach(({ params }) => {
                        stats.requestedTxids.push(params[0] as string);
                        if (params[1]) stats.verboseRequests++;
                    });
                stats.waiting += requests.length;
                stats.maxWaiting = Math.max(stats.maxWaiting, stats.waiting);
                setTimeout(() => {
                    stats.waiting -= requests.length;
                    const responses = requests.map(request => ({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: getResult(request),
                    }));
                    if (!socket.destroyed) socket.write(`${JSON.stringify(responses)}\n`);
                }, RESPONSE_DELAY_MS);
            });
        });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;

    const closeConnections = () => sockets.forEach(socket => socket.destroy());
    const notifyBlock = (block: { height: number; hex: string }) => {
        const notification = {
            jsonrpc: '2.0',
            method: 'blockchain.headers.subscribe',
            params: [block],
        };
        sockets.at(-1)?.write(`${JSON.stringify(notification)}\n`);
    };
    const notifyStatus = (scripthash: string, status: string) => {
        const notification = {
            jsonrpc: '2.0',
            method: 'blockchain.scripthash.subscribe',
            params: [scripthash, status],
        };
        sockets.at(-1)?.write(`${JSON.stringify(notification)}\n`);
    };
    const close = () => {
        closeConnections();

        return new Promise(resolve => server.close(resolve));
    };

    return {
        url: `127.0.0.1:${port}:t`,
        stats,
        closeConnections,
        notifyBlock,
        notifyStatus,
        close,
    };
};

const withTimeout = <T>(promise: Promise<T>, ms = 2000) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`No result in ${ms} ms`)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

describe('Electrum worker', () => {
    let server: Awaited<ReturnType<typeof createElectrumServer>>;
    let blockchain: BlockchainLink;

    beforeEach(async () => {
        server = await createElectrumServer();
        blockchain = new BlockchainLink({
            // The cache of a network outlives the worker, each test gets its own network name.
            name: `BTC ${expect.getState().currentTestName}`,
            worker: ElectrumWorker,
            server: [server.url],
            debug: false,
        });
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await blockchain.disconnect();
        blockchain.dispose();
        await server.close();
    });

    it('starts with server.version and does not flood the server with requests', async () => {
        const info = await blockchain.getAccountInfo({
            descriptor: ADDRESS,
            details: 'txs',
            pageSize: TX_COUNT,
        });

        expect(info.history.transactions).toHaveLength(TX_COUNT);
        // The height comes from the history, the time from the header of its block.
        expect(info.history.transactions?.[0]).toMatchObject({
            txid: getTxid(0),
            blockHeight: 990,
            blockTime: BLOCK_TIME,
        });
        expect(server.stats.verboseRequests).toBe(0);
        expect(server.stats.firstMethods).toEqual(['server.version']);
        // All the transactions of the history used to be requested at once.
        expect(server.stats.maxWaiting).toBeLessThan(TX_COUNT);
    });

    it('returns a page of the history without the previous transactions of foreign inputs', async () => {
        const info = await blockchain.getAccountInfo({
            descriptor: ADDRESS,
            details: 'txs',
            page: 2,
            pageSize: 10,
        });

        const pageIndexes = Array.from({ length: 10 }, (_, i) => i + 10);
        expect(info.history.transactions?.map(({ txid }) => txid)).toEqual(
            pageIndexes.map(getTxid),
        );
        expect(info.page).toEqual({ index: 2, size: 10, total: TX_COUNT / 10 });
        expect([...server.stats.requestedTxids].sort()).toEqual(pageIndexes.map(getTxid).sort());
    });

    it('computes the balance history without the previous transactions of foreign inputs', async () => {
        const history = await blockchain.getAccountBalanceHistory({ descriptor: ADDRESS });

        expect(history).toEqual([
            expect.objectContaining({ txs: TX_COUNT, received: `${TX_COUNT * 100000}`, sent: '0' }),
        ]);
        expect([...server.stats.requestedTxids].sort()).toEqual(
            Array.from({ length: TX_COUNT }, (_, i) => getTxid(i)).sort(),
        );
    });

    it('lets a new worker of the network reuse the transactions of the previous one', async () => {
        const params = { descriptor: ADDRESS, details: 'txs' as const, pageSize: TX_COUNT };
        await blockchain.getAccountInfo(params);
        const requestedTxids = server.stats.requestedTxids.length;
        const next = new BlockchainLink({ ...blockchain.settings, worker: ElectrumWorker });

        const info = await next.getAccountInfo(params);
        await next.disconnect();
        next.dispose();

        expect(info.history.transactions).toHaveLength(TX_COUNT);
        expect(server.stats.requestedTxids).toHaveLength(requestedTxids);
    });

    it('keeps the transactions of the network when the server closed the connection', async () => {
        const params = { descriptor: ADDRESS, details: 'txs' as const, pageSize: TX_COUNT };
        await blockchain.getAccountInfo(params);
        const requestedTxids = server.stats.requestedTxids.length;
        const disconnected = new Promise<void>(resolve =>
            blockchain.once('disconnected', () => resolve()),
        );

        server.closeConnections();
        await withTimeout(disconnected);
        // TrezorConnect replaces the link of a closed connection with a new one.
        blockchain.dispose();
        blockchain = new BlockchainLink({ ...blockchain.settings, worker: ElectrumWorker });
        const info = await blockchain.getAccountInfo(params);

        expect(info.history.transactions).toHaveLength(TX_COUNT);
        expect(server.stats.requestedTxids).toHaveLength(requestedTxids);
    });

    it('forgets the transactions of the network when disconnected on purpose', async () => {
        const params = { descriptor: ADDRESS, details: 'txs' as const, pageSize: TX_COUNT };
        await blockchain.getAccountInfo(params);
        const requestedTxids = server.stats.requestedTxids.length;

        await blockchain.disconnect();
        const parse = jest.spyOn(Transaction, 'fromHex');
        await blockchain.getAccountInfo(params);

        expect(server.stats.requestedTxids).toHaveLength(2 * requestedTxids);
        // The parsed transactions of the network are forgotten too.
        expect(parse).toHaveBeenCalledTimes(requestedTxids);
    });

    it('notifies a new transaction of a subscribed address with the block of its history', async () => {
        await blockchain.subscribe({ type: 'addresses', addresses: [ADDRESS] });
        const notification = new Promise(resolve => blockchain.once('notification', resolve));

        server.notifyStatus(SCRIPTHASH, 'new status');

        await expect(withTimeout(notification)).resolves.toMatchObject({
            descriptor: ADDRESS,
            tx: { txid: getTxid(0), blockHeight: 990, blockTime: BLOCK_TIME },
        });
        expect(server.stats.verboseRequests).toBe(0);
    });

    it('reports a connection closed by the server and connects again', async () => {
        await blockchain.connect();
        await blockchain.subscribe({ type: 'block' });
        const disconnected = new Promise<void>(resolve =>
            blockchain.once('disconnected', () => resolve()),
        );

        server.closeConnections();
        await withTimeout(disconnected);

        await expect(withTimeout(blockchain.getInfo())).resolves.toMatchObject({
            blockHeight: 1000,
        });
        expect(server.stats.firstMethods).toEqual(['server.version', 'server.version']);

        // The subscriptions ended with the closed connection, new ones must work again.
        await blockchain.subscribe({ type: 'block' });
        const block = new Promise(resolve => blockchain.once('block', resolve));
        server.notifyBlock({ height: 1001, hex: '01'.repeat(80) });
        await expect(withTimeout(block)).resolves.toMatchObject({ blockHeight: 1001 });
    });
});
