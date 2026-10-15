import type { ElectrumTypes } from '@trezor/blockchain-link-types';
import { createAddressCache, deriveAddresses, networks } from '@trezor/utxo-lib';

import getAccountInfo from './getAccountInfo';
import { CachingElectrumClient } from '../client/caching';
import type { ISocket, SocketListener } from '../sockets/interface';
import { addressToScripthash } from '../utils/transform';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

// Public test vector, the "all all ... all" seed.
const XPUB =
    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT';
const getAddress = (type: 'receive' | 'change', index: number) => {
    const [derived] = deriveAddresses(XPUB, type, index, 1, networks.bitcoin);
    if (!derived) throw new Error(`Missing ${type} address ${index}`);

    return derived.address;
};
const RECEIVE_ADDRESS = getAddress('receive', 0);
const CHANGE_ADDRESS = getAddress('change', 0);
const FOREIGN_ADDRESS = 'bc1qforeign';

// A foreign transaction pays to the sender of INCOMING, which pays to the account. OUTGOING then
// spends the received output.
const FOREIGN_PARENT = 'aa'.repeat(32);
const INCOMING = 'bb'.repeat(32);
const OUTGOING = 'cc'.repeat(32);
const TIP_HEIGHT = 200;

// An address beyond the gap limit of the account, with a pending transaction and two transactions
// in the same block.
const PAGED_ADDRESS = getAddress('receive', 1000);
const PAGED_HISTORY = [
    { tx_hash: '11'.repeat(32), height: 130 },
    { tx_hash: '22'.repeat(32), height: 140 },
    { tx_hash: '33'.repeat(32), height: 150 },
    { tx_hash: '44'.repeat(32), height: 150 },
    { tx_hash: '55'.repeat(32), height: 0 },
];

type CreateTransactionParams = {
    txid: string;
    height: number;
    inputs: { txid: string; vout: number }[];
    outputs: { value: number; address: string }[];
};

const createTransaction = ({
    txid,
    height,
    inputs,
    outputs,
}: CreateTransactionParams): ElectrumTypes.TransactionVerbose => ({
    txid,
    hash: txid,
    hex: '00',
    blockhash: height.toString(16).padStart(64, '0'),
    version: 2,
    size: 200,
    vsize: 150,
    weight: 600,
    locktime: 0,
    confirmations: height > 0 ? TIP_HEIGHT - height + 1 : 0,
    time: height,
    blocktime: height,
    vin: inputs.length
        ? inputs.map(input => ({ ...input, sequence: 0xffffffff, scriptSig: {}, txinwitness: [] }))
        : [{ coinbase: '00', sequence: 0 }],
    vout: outputs.map(({ value, address }, n) => ({
        value,
        n,
        scriptPubKey: { asm: '', hex: '00', address, type: 'witness_v0_keyhash' },
    })),
});

const transactions = [
    createTransaction({
        txid: FOREIGN_PARENT,
        height: 99,
        inputs: [],
        outputs: [{ value: 1, address: FOREIGN_ADDRESS }],
    }),
    createTransaction({
        txid: INCOMING,
        height: 100,
        inputs: [{ txid: FOREIGN_PARENT, vout: 0 }],
        outputs: [
            { value: 0.5, address: RECEIVE_ADDRESS },
            { value: 0.4999, address: FOREIGN_ADDRESS },
        ],
    }),
    createTransaction({
        txid: OUTGOING,
        height: 101,
        inputs: [{ txid: INCOMING, vout: 0 }],
        outputs: [
            { value: 0.3, address: FOREIGN_ADDRESS },
            { value: 0.1999, address: CHANGE_ADDRESS },
        ],
    }),
    ...PAGED_HISTORY.map(({ tx_hash, height }) =>
        createTransaction({
            txid: tx_hash,
            height,
            inputs: [],
            outputs: [{ value: 0.1, address: PAGED_ADDRESS }],
        }),
    ),
];

const histories: Record<string, { tx_hash: string; height: number }[]> = {
    [addressToScripthash(RECEIVE_ADDRESS, networks.bitcoin)]: [
        { tx_hash: INCOMING, height: 100 },
        { tx_hash: OUTGOING, height: 101 },
    ],
    [addressToScripthash(CHANGE_ADDRESS, networks.bitcoin)]: [{ tx_hash: OUTGOING, height: 101 }],
    [addressToScripthash(PAGED_ADDRESS, networks.bitcoin)]: PAGED_HISTORY,
};

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly requestedTxids: string[] = [];

    connect(listener: SocketListener) {
        this.listener = listener;

        return Promise.resolve();
    }

    close() {}

    send(data: string) {
        const message = JSON.parse(data);
        const requests: JsonRpcRequest[] = Array.isArray(message) ? message : [message];
        const responses = requests.map(request => ({
            jsonrpc: '2.0',
            id: request.id,
            result: this.getResult(request),
        }));
        setImmediate(() => this.listener?.onReceive(`${JSON.stringify(responses)}\n`));
    }

    private getResult({ method, params }: JsonRpcRequest) {
        const [param] = params as string[];
        switch (method) {
            case 'server.version':
                return ['MockElectrum 1.0', '1.4'];
            case 'blockchain.headers.subscribe':
                return { height: TIP_HEIGHT, hex: '00'.repeat(80) };
            case 'blockchain.scripthash.subscribe':
                return param && histories[param] ? `status-${param}` : null;
            case 'blockchain.scripthash.get_history':
                return (param && histories[param]) ?? [];
            case 'blockchain.scripthash.get_balance':
                return { confirmed: 0, unconfirmed: 0 };
            case 'blockchain.transaction.get':
                this.requestedTxids.push(param ?? '');

                return transactions.find(({ txid }) => txid === param);
            default:
                return null;
        }
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

    return { socket, context: { client, addressCache: createAddressCache(networks.bitcoin) } };
};

describe('getAccountInfo of the Electrum worker', () => {
    afterEach(() => {
        clients.splice(0).forEach(client => client.close());
    });

    it('fetches the previous transactions of foreign inputs only for the requested page', async () => {
        const { socket, context } = await connectClient();

        const firstPage = await getAccountInfo(context, {
            descriptor: XPUB,
            details: 'txs',
            page: 1,
            pageSize: 1,
        });

        expect(firstPage.page).toEqual({ index: 1, size: 1, total: 2 });
        expect(firstPage.history.transactions).toMatchObject([
            { txid: OUTGOING, type: 'sent', amount: '30000000', fee: '10000' },
        ]);
        expect(firstPage.addresses?.used).toMatchObject([
            { address: RECEIVE_ADDRESS, received: '50000000', sent: '50000000' },
        ]);
        expect(firstPage.addresses?.change[0]).toMatchObject({
            address: CHANGE_ADDRESS,
            received: '19990000',
            sent: '0',
        });
        expect([...socket.requestedTxids].sort()).toEqual([INCOMING, OUTGOING]);

        const secondPage = await getAccountInfo(context, {
            descriptor: XPUB,
            details: 'txs',
            page: 2,
            pageSize: 1,
        });

        expect(secondPage.history.transactions).toMatchObject([
            { txid: INCOMING, type: 'recv', amount: '50000000', fee: '10000' },
        ]);
        expect([...socket.requestedTxids].sort()).toEqual([FOREIGN_PARENT, INCOMING, OUTGOING]);
    });

    it('fetches only the transactions of a later page with their previous transactions', async () => {
        const { socket, context } = await connectClient();

        const secondPage = await getAccountInfo(context, {
            descriptor: XPUB,
            details: 'txs',
            page: 2,
            pageSize: 1,
        });

        expect(secondPage.history.transactions).toMatchObject([
            { txid: INCOMING, type: 'recv', amount: '50000000', fee: '10000' },
        ]);
        // Suite takes the addresses of an account from the first page only.
        expect(secondPage.addresses?.used).toMatchObject([
            { address: RECEIVE_ADDRESS, transfers: 2, received: '0', sent: '0' },
        ]);
        expect([...socket.requestedTxids].sort()).toEqual([FOREIGN_PARENT, INCOMING]);
    });

    it('puts pending transactions first and splits the history into pages without gaps', async () => {
        const { context } = await connectClient();
        const getPage = (page: number) =>
            getAccountInfo(context, {
                descriptor: PAGED_ADDRESS,
                details: 'txs',
                page,
                pageSize: 2,
            });

        const pages = [await getPage(1), await getPage(2), await getPage(3)];
        const transactions = pages.flatMap(({ history }) => history.transactions ?? []);

        expect(pages.map(({ page }) => page)).toEqual([
            { index: 1, size: 2, total: 3 },
            { index: 2, size: 2, total: 3 },
            { index: 3, size: 2, total: 3 },
        ]);
        expect(transactions.map(({ blockHeight }) => blockHeight)).toEqual([
            -1, 150, 150, 140, 130,
        ]);
        expect(transactions.map(({ txid }) => txid).sort()).toEqual(
            PAGED_HISTORY.map(({ tx_hash }) => tx_hash),
        );
    });
});
