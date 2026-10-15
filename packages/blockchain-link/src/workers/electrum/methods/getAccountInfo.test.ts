import type { VinVout } from '@trezor/blockchain-link-types';
import {
    Transaction,
    address,
    createAddressCache,
    deriveAddresses,
    networks,
} from '@trezor/utxo-lib';

import getAccountInfo, { sumAddressValues, sumValuesByAddress } from './getAccountInfo';
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
// Public test vector of BIP173.
const FOREIGN_ADDRESS = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';
const TIP_HEIGHT = 200;

type CreateTransactionParams = {
    inputs: { txid: string; vout: number }[];
    outputs: { value: number; address: string }[];
    // Tells apart coinbase transactions paying the same.
    coinbase?: string;
};

const createTransaction = ({ inputs, outputs, coinbase = '00' }: CreateTransactionParams) => {
    const tx = new Transaction();
    tx.version = 2;
    const ins = inputs.length
        ? inputs.map(({ txid, vout }) => ({
              hash: Buffer.from(txid, 'hex').reverse(),
              index: vout,
              script: Buffer.alloc(0),
              sequence: 0xffffffff,
              witness: [Buffer.alloc(72)],
          }))
        : [
              {
                  hash: Buffer.alloc(32),
                  index: 0xffffffff,
                  script: Buffer.from(coinbase, 'hex'),
                  sequence: 0,
                  witness: [],
              },
          ];
    tx.ins.push(...ins);
    tx.outs.push(
        ...outputs.map(output => ({
            script: address.toOutputScript(output.address, networks.bitcoin),
            value: output.value.toString(),
        })),
    );

    return { txid: tx.getId(), hex: tx.toHex() };
};

// The time of each block is its height.
const createHeader = (height: number) => {
    const header = Buffer.alloc(80);
    header.writeUInt32LE(height, 68);

    return header.toString('hex');
};

// A foreign transaction pays to the sender of INCOMING, which pays to the account. OUTGOING then
// spends the received output.
const FOREIGN_PARENT = createTransaction({
    inputs: [],
    outputs: [{ value: 100000000, address: FOREIGN_ADDRESS }],
});
const INCOMING = createTransaction({
    inputs: [{ txid: FOREIGN_PARENT.txid, vout: 0 }],
    outputs: [
        { value: 50000000, address: RECEIVE_ADDRESS },
        { value: 49990000, address: FOREIGN_ADDRESS },
    ],
});
const OUTGOING = createTransaction({
    inputs: [{ txid: INCOMING.txid, vout: 0 }],
    outputs: [
        { value: 30000000, address: FOREIGN_ADDRESS },
        { value: 19990000, address: CHANGE_ADDRESS },
    ],
});

// An address beyond the gap limit of the account, with a pending transaction and two transactions
// in the same block.
const PAGED_ADDRESS = getAddress('receive', 1000);
const PAGED_HEIGHTS = [130, 140, 150, 150, 0];
const PAGED_TRANSACTIONS = PAGED_HEIGHTS.map((_, index) =>
    createTransaction({
        inputs: [],
        outputs: [{ value: 10000000, address: PAGED_ADDRESS }],
        coinbase: `0${index}`,
    }),
);
const PAGED_HISTORY = PAGED_TRANSACTIONS.map(({ txid }, index) => ({
    tx_hash: txid,
    height: PAGED_HEIGHTS[index] ?? 0,
}));

// An address beyond the gap limit of the account, whose payment is on the second page of its
// history, after a newer transaction. The payment spends an output of an incoming transaction.
const LATER_PAGE_ADDRESS = getAddress('receive', 2000);
const LATER_PAGE_FOREIGN_PARENT = createTransaction({
    inputs: [],
    outputs: [{ value: 100000000, address: FOREIGN_ADDRESS }],
    coinbase: '10',
});
const LATER_PAGE_INCOMING = createTransaction({
    inputs: [{ txid: LATER_PAGE_FOREIGN_PARENT.txid, vout: 0 }],
    outputs: [
        { value: 60000000, address: LATER_PAGE_ADDRESS },
        { value: 39990000, address: FOREIGN_ADDRESS },
    ],
});
const LATER_PAGE_OUTGOING = createTransaction({
    inputs: [{ txid: LATER_PAGE_INCOMING.txid, vout: 0 }],
    outputs: [
        { value: 50000000, address: FOREIGN_ADDRESS },
        { value: 9990000, address: LATER_PAGE_ADDRESS },
    ],
});
const LATER_PAGE_NEWEST = createTransaction({
    inputs: [],
    outputs: [{ value: 10000000, address: LATER_PAGE_ADDRESS }],
    coinbase: '11',
});

const transactions = [
    FOREIGN_PARENT,
    INCOMING,
    OUTGOING,
    ...PAGED_TRANSACTIONS,
    LATER_PAGE_FOREIGN_PARENT,
    LATER_PAGE_INCOMING,
    LATER_PAGE_OUTGOING,
    LATER_PAGE_NEWEST,
];

const histories: Record<string, { tx_hash: string; height: number }[]> = {
    [addressToScripthash(RECEIVE_ADDRESS, networks.bitcoin)]: [
        { tx_hash: INCOMING.txid, height: 100 },
        { tx_hash: OUTGOING.txid, height: 101 },
    ],
    [addressToScripthash(CHANGE_ADDRESS, networks.bitcoin)]: [
        { tx_hash: OUTGOING.txid, height: 101 },
    ],
    [addressToScripthash(PAGED_ADDRESS, networks.bitcoin)]: PAGED_HISTORY,
    [addressToScripthash(LATER_PAGE_ADDRESS, networks.bitcoin)]: [
        { tx_hash: LATER_PAGE_INCOMING.txid, height: 110 },
        { tx_hash: LATER_PAGE_OUTGOING.txid, height: 111 },
        { tx_hash: LATER_PAGE_NEWEST.txid, height: 112 },
    ],
};

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly requestedTxids: string[] = [];
    readonly requestedVerboseTxids: string[] = [];
    readonly requestedHeaders: number[] = [];

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
        const [param, verbose] = params as [string, boolean | undefined];
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
                this.requestedTxids.push(param);
                if (verbose) this.requestedVerboseTxids.push(param);

                return transactions.find(({ txid }) => txid === param)?.hex;
            case 'blockchain.block.header': {
                const height = Number(param);
                this.requestedHeaders.push(height);

                return createHeader(height);
            }
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

    it('fetches no previous transactions of foreign inputs for the requested page', async () => {
        const { socket, context } = await connectClient();

        const firstPage = await getAccountInfo(context, {
            descriptor: XPUB,
            details: 'txs',
            page: 1,
            pageSize: 1,
        });

        expect(firstPage.page).toEqual({ index: 1, size: 1, total: 2 });
        expect(firstPage.history.transactions).toMatchObject([
            { txid: OUTGOING.txid, type: 'sent', amount: '30000000', fee: '10000', blockTime: 101 },
        ]);
        expect(firstPage.addresses?.used).toMatchObject([
            { address: RECEIVE_ADDRESS, received: '50000000', sent: '50000000' },
        ]);
        expect(firstPage.addresses?.change[0]).toMatchObject({
            address: CHANGE_ADDRESS,
            received: '19990000',
            sent: '0',
        });
        expect([...socket.requestedTxids].sort()).toEqual([INCOMING.txid, OUTGOING.txid].sort());
        // The transactions are fetched raw, only the block of the transaction of the page.
        expect(socket.requestedVerboseTxids).toEqual([]);
        expect(socket.requestedHeaders).toEqual([101]);

        const secondPage = await getAccountInfo(context, {
            descriptor: XPUB,
            details: 'txs',
            page: 2,
            pageSize: 1,
        });

        // The fee of an incoming payment is unknown without the previous transaction of its input.
        expect(secondPage.history.transactions).toMatchObject([
            { txid: INCOMING.txid, type: 'recv', amount: '50000000', fee: '0' },
        ]);
        expect(secondPage.history.transactions?.[0]?.details.vin[0]).not.toHaveProperty('value');
        expect([...socket.requestedTxids].sort()).toEqual([INCOMING.txid, OUTGOING.txid].sort());
        expect(socket.requestedHeaders).toEqual([101, 100]);
    });

    it('fetches only the transactions of a later page', async () => {
        const { socket, context } = await connectClient();

        const secondPage = await getAccountInfo(context, {
            descriptor: XPUB,
            details: 'txs',
            page: 2,
            pageSize: 1,
        });

        expect(secondPage.history.transactions).toMatchObject([
            { txid: INCOMING.txid, type: 'recv', amount: '50000000', fee: '0' },
        ]);
        // Suite takes the addresses of an account from the first page only.
        expect(secondPage.addresses?.used).toMatchObject([
            { address: RECEIVE_ADDRESS, transfers: 2, received: '0', sent: '0' },
        ]);
        expect(socket.requestedTxids).toEqual([INCOMING.txid]);
    });

    it('gives a payment of a later page with the values of the inputs of the account', async () => {
        const { socket, context } = await connectClient();

        const secondPage = await getAccountInfo(context, {
            descriptor: LATER_PAGE_ADDRESS,
            details: 'txs',
            page: 2,
            pageSize: 1,
        });

        expect(secondPage.history.transactions).toMatchObject([
            {
                txid: LATER_PAGE_OUTGOING.txid,
                type: 'sent',
                amount: '50000000',
                fee: '10000',
                blockTime: 111,
            },
        ]);
        // The previous transaction of the input is in the history, the one before it is not.
        expect([...socket.requestedTxids].sort()).toEqual(
            [LATER_PAGE_INCOMING.txid, LATER_PAGE_OUTGOING.txid].sort(),
        );
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
            PAGED_HISTORY.map(({ tx_hash }) => tx_hash).sort(),
        );
    });
});

describe(sumValuesByAddress.name, () => {
    const vinVout = (n: number, value: string | undefined, addresses: string[]): VinVout => ({
        n,
        value,
        addresses,
        isAddress: addresses.length === 1,
    });

    it('gives the same sums as sumAddressValues for every address', () => {
        const transactions = [
            {
                details: {
                    vin: [vinVout(0, '0.1', ['a']), vinVout(1, '0.2', ['b'])],
                    // A bare multisig output listing the same address twice counts once.
                    vout: [vinVout(0, '0.15', ['a', 'c', 'a']), vinVout(1, undefined, ['b'])],
                },
            },
            {
                details: {
                    vin: [vinVout(0, '0.3', ['a', 'b'])],
                    vout: [vinVout(0, '0.7', ['c']), vinVout(1, '0.05', ['a'])],
                },
            },
        ];

        const sums = sumValuesByAddress(transactions);

        ['a', 'b', 'c', 'd'].forEach(address => {
            expect(sums.get(address) ?? { sent: 0, received: 0 }).toEqual({
                sent: sumAddressValues(transactions, address, tx => tx.details.vin),
                received: sumAddressValues(transactions, address, tx => tx.details.vout),
            });
        });
        expect(sums.get('a')).toEqual({ sent: 0.4, received: 0.2 });
    });

    it('adds the values in the order of the transactions', () => {
        const transactions = ['0.1', '0.2', '0.3'].map(value => ({
            details: { vin: [], vout: [vinVout(0, value, ['a'])] },
        }));

        expect(sumValuesByAddress(transactions).get('a')?.received).toBe(
            sumAddressValues(transactions, 'a', tx => tx.details.vout),
        );
        expect(sumValuesByAddress(transactions).get('a')?.received).toBe(0.1 + 0.2 + 0.3);
    });
});
