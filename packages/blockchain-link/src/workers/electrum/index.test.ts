import { type AddressInfo, type Server, type Socket, createServer } from 'net';

import type { ElectrumTypes } from '@trezor/blockchain-link-types';

import { BlockchainLink } from '../../index';

import ElectrumWorker from './index';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

const ADDRESS = 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk';
const TX_COUNT = 100;
const RESPONSE_DELAY_MS = 5;

const getTxid = (index: number) => index.toString(16).padStart(64, '0');
const getPrevTxid = (index: number) => (index + TX_COUNT).toString(16).padStart(64, '0');

const createTransaction = (txid: string, prevTxid?: string): ElectrumTypes.TransactionVerbose => ({
    txid,
    hash: txid,
    hex: '00',
    blockhash: 'bb'.repeat(32),
    version: 2,
    size: 100,
    vsize: 100,
    weight: 400,
    locktime: 0,
    confirmations: 10,
    time: 1,
    blocktime: 1,
    vin: prevTxid
        ? [{ txid: prevTxid, vout: 0, sequence: 0xffffffff, scriptSig: {}, txinwitness: [] }]
        : [{ coinbase: '00', sequence: 0 }],
    vout: [
        {
            value: 0.001,
            n: 0,
            scriptPubKey: { asm: '', hex: '00', address: ADDRESS, type: 'witness_v0_keyhash' },
        },
    ],
});

const getResult = ({ method, params }: JsonRpcRequest) => {
    switch (method) {
        case 'server.version':
            return ['MockElectrum 1.0', '1.4'];
        case 'blockchain.headers.subscribe':
            return { height: 1000, hex: '00'.repeat(80) };
        case 'blockchain.scripthash.subscribe':
            return 'status';
        case 'blockchain.scripthash.get_balance':
            return { confirmed: TX_COUNT * 100000, unconfirmed: 0 };
        case 'blockchain.scripthash.get_history':
            return Array.from({ length: TX_COUNT }, (_, i) => ({
                tx_hash: getTxid(i),
                height: 990 - i,
            }));
        case 'blockchain.transaction.get': {
            const index = parseInt(params[0] as string, 16);

            return index < TX_COUNT
                ? createTransaction(getTxid(index), getPrevTxid(index))
                : createTransaction(getPrevTxid(index - TX_COUNT));
        }
        default:
            return null;
    }
};

// Mimics ElectrumX 2.0 which closes connections not starting with server.version
// and counts requests the client lets wait for a response.
const createElectrumServer = async () => {
    const sockets: Socket[] = [];
    const stats = { firstMethods: [] as string[], waiting: 0, maxWaiting: 0 };

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
    const close = () => {
        closeConnections();

        return new Promise(resolve => server.close(resolve));
    };

    return { url: `127.0.0.1:${port}:t`, stats, closeConnections, notifyBlock, close };
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
            name: 'BTC',
            worker: ElectrumWorker,
            server: [server.url],
            debug: false,
        });
    });

    afterEach(async () => {
        await blockchain.disconnect();
        blockchain.dispose();
        await server.close();
    });

    it('starts with server.version and does not flood the server with requests', async () => {
        const info = await blockchain.getAccountInfo({ descriptor: ADDRESS, details: 'txs' });

        expect(info.history.transactions).toHaveLength(TX_COUNT);
        expect(server.stats.firstMethods).toEqual(['server.version']);
        // All the transactions of the history used to be requested at once.
        expect(server.stats.maxWaiting).toBeLessThan(TX_COUNT);
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
