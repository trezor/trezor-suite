import type { ElectrumTypes } from '@trezor/blockchain-link-types';
import {
    Transaction,
    address,
    createAddressCache,
    deriveAddresses,
    networks,
} from '@trezor/utxo-lib';

import getTransaction from './getTransaction';
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
// An address of the account beyond its gap limit, so not in the history the worker discovers.
const UNDISCOVERED_ADDRESS = getAddress('receive', 3000);
// Public test vector of BIP173.
const FOREIGN_ADDRESS = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';
const TIP_HEIGHT = 200;

type CreateTransactionParams = {
    inputs: { txid: string; vout: number }[];
    outputs: { value: number; address: string }[];
    // Tells apart coinbase transactions paying the same.
    coinbase?: string;
};

type MockTransaction = { tx: Transaction; txid: string; hex: string; height: number };

const createTransaction = (
    { inputs, outputs, coinbase = '00' }: CreateTransactionParams,
    height: number,
): MockTransaction => {
    const tx = new Transaction();
    tx.version = 2;
    const ins = inputs.length
        ? inputs.map(({ txid, vout }) => ({
              hash: Buffer.from(txid, 'hex').reverse(),
              index: vout,
              script: Buffer.alloc(0),
              sequence: 0xfffffffd,
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

    return { tx, txid: tx.getId(), hex: tx.toHex(), height };
};

// The time of each block is its height and its hash is its height repeated.
const createHeader = (height: number) => {
    const header = Buffer.alloc(80);
    header.writeUInt32LE(height, 68);

    return header.toString('hex');
};

// Like the node of the server gives a transaction with the block of its history.
const toVerbose = ({
    tx,
    txid,
    hex,
    height,
}: MockTransaction): ElectrumTypes.TransactionVerbose => ({
    txid,
    hash: tx.getHash(true).reverse().toString('hex'),
    hex,
    blockhash: 'ab'.repeat(32),
    version: tx.version,
    size: tx.byteLength(),
    vsize: tx.virtualSize(),
    weight: tx.weight(),
    locktime: tx.locktime,
    confirmations: TIP_HEIGHT - height + 1,
    time: height,
    blocktime: height,
    vin: tx.isCoinbase()
        ? tx.ins.map(({ script, sequence }) => ({ coinbase: script.toString('hex'), sequence }))
        : tx.ins.map(({ hash, index, sequence }) => ({
              txid: Buffer.from(hash).reverse().toString('hex'),
              vout: index,
              sequence,
              scriptSig: { asm: '', hex: '' },
              txinwitness: [],
          })),
    vout: tx.outs.map(({ script, value }, n) => ({
        value: Number(value) / 1e8,
        n,
        scriptPubKey: {
            asm: '',
            hex: script.toString('hex'),
            address: address.fromOutputScript(script, networks.bitcoin),
            type: 'witness_v0_keyhash',
        },
    })),
});

// A foreign transaction pays to the sender of INCOMING, which pays to the account. OUTGOING then
// spends the received output.
const FOREIGN_PARENT = createTransaction(
    { inputs: [], outputs: [{ value: 100000000, address: FOREIGN_ADDRESS }] },
    90,
);
const INCOMING = createTransaction(
    {
        inputs: [{ txid: FOREIGN_PARENT.txid, vout: 0 }],
        outputs: [
            { value: 50000000, address: RECEIVE_ADDRESS },
            { value: 49990000, address: FOREIGN_ADDRESS },
        ],
    },
    100,
);
const OUTGOING = createTransaction(
    {
        inputs: [{ txid: INCOMING.txid, vout: 0 }],
        outputs: [
            { value: 30000000, address: FOREIGN_ADDRESS },
            { value: 19990000, address: CHANGE_ADDRESS },
        ],
    },
    101,
);
const UNDISCOVERED_PARENT = createTransaction(
    { inputs: [], outputs: [{ value: 7000, address: FOREIGN_ADDRESS }], coinbase: '01' },
    95,
);
const UNDISCOVERED = createTransaction(
    {
        inputs: [{ txid: UNDISCOVERED_PARENT.txid, vout: 0 }],
        outputs: [{ value: 6000, address: UNDISCOVERED_ADDRESS }],
    },
    102,
);

const transactions = [FOREIGN_PARENT, INCOMING, OUTGOING, UNDISCOVERED_PARENT, UNDISCOVERED];

const histories: Record<string, { tx_hash: string; height: number }[]> = {
    [addressToScripthash(RECEIVE_ADDRESS, networks.bitcoin)]: [
        { tx_hash: INCOMING.txid, height: INCOMING.height },
        { tx_hash: OUTGOING.txid, height: OUTGOING.height },
    ],
    [addressToScripthash(CHANGE_ADDRESS, networks.bitcoin)]: [
        { tx_hash: OUTGOING.txid, height: OUTGOING.height },
    ],
    [addressToScripthash(UNDISCOVERED_ADDRESS, networks.bitcoin)]: [
        { tx_hash: UNDISCOVERED.txid, height: UNDISCOVERED.height },
    ],
};

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly rawTxids: string[] = [];
    readonly verboseTxids: string[] = [];
    readonly headers: number[] = [];

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
            case 'blockchain.transaction.get': {
                const tx = transactions.find(({ txid }) => txid === param);
                if (!tx) return null;
                if (!verbose) {
                    this.rawTxids.push(tx.txid);

                    return tx.hex;
                }
                this.verboseTxids.push(tx.txid);

                return toVerbose(tx);
            }
            case 'blockchain.block.header': {
                const height = Number(param);
                this.headers.push(height);

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

describe('getTransaction of the Electrum worker', () => {
    afterEach(() => {
        clients.splice(0).forEach(client => client.close());
    });

    it('fetches a transaction without a descriptor with all its previous transactions', async () => {
        const { socket, context } = await connectClient();

        const tx = await getTransaction(context, { txid: INCOMING.txid });

        expect(tx).toMatchObject({
            txid: INCOMING.txid,
            fee: '10000',
            blockHeight: INCOMING.height,
            details: {
                vin: [{ txid: FOREIGN_PARENT.txid, value: '100000000' }],
                totalInput: '100000000',
            },
        });
        expect(socket.verboseTxids).toEqual([INCOMING.txid]);
        expect(socket.rawTxids).toEqual([FOREIGN_PARENT.txid]);
    });

    it('fetches an incoming transaction of the account raw without its foreign previous transactions', async () => {
        const { socket, context } = await connectClient();

        const tx = await getTransaction(context, { txid: INCOMING.txid, descriptor: XPUB });

        expect(tx).toMatchObject({
            txid: INCOMING.txid,
            type: 'recv',
            amount: '50000000',
            fee: '0',
            blockHeight: INCOMING.height,
            blockTime: INCOMING.height,
        });
        expect(tx.details.vin[0]).not.toHaveProperty('value');
        expect(socket.verboseTxids).toEqual([]);
        expect(socket.rawTxids).toEqual([INCOMING.txid]);
        expect(socket.headers).toEqual([INCOMING.height]);
    });

    it('fetches a payment of the account with the previous transactions of its own inputs', async () => {
        const { socket, context } = await connectClient();

        const tx = await getTransaction(context, { txid: OUTGOING.txid, descriptor: XPUB });

        expect(tx).toMatchObject({
            txid: OUTGOING.txid,
            type: 'sent',
            amount: '30000000',
            fee: '10000',
            blockTime: OUTGOING.height,
        });
        expect(socket.verboseTxids).toEqual([]);
        expect([...socket.rawTxids].sort()).toEqual([INCOMING.txid, OUTGOING.txid].sort());
    });

    it('fetches a transaction which is not in the history with all its previous transactions', async () => {
        const { socket, context } = await connectClient();

        const tx = await getTransaction(context, { txid: UNDISCOVERED.txid, descriptor: XPUB });

        expect(tx).toMatchObject({
            txid: UNDISCOVERED.txid,
            fee: '1000',
            blockHeight: UNDISCOVERED.height,
        });
        expect(socket.verboseTxids).toEqual([UNDISCOVERED.txid]);
        expect(socket.rawTxids).toEqual([UNDISCOVERED_PARENT.txid]);
    });
});
