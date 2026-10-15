import type {
    ElectrumBlockHeader as BlockHeader,
    ElectrumTypes,
    ElectrumHistoryTx as HistoryTx,
} from '@trezor/blockchain-link-types';
import { Transaction, networks } from '@trezor/utxo-lib';

import {
    getTransactionByTxid,
    getTransactions,
    parseRawTransaction,
    parseVerboseTransaction,
} from './transaction';
import { mockElectrumRecording } from '../../../../mocks/mockElectrumRecording';
import { CachingElectrumClient } from '../client/caching';
import type { ISocket, SocketListener } from '../sockets/interface';

type JsonRpcRequest = { id: number; method: string; params: unknown[] };

type MockServer = {
    tip: BlockHeader;
    headers: Record<number, string>;
    rawTransactions: Record<string, string>;
    verboseTransactions: Record<string, ElectrumTypes.TransactionVerbose>;
};

const { tip, transactions, prevTransactions, headers } = mockElectrumRecording;
const recordedTransactions = [...transactions.map(({ tx }) => tx), ...prevTransactions];

const recordedServer: MockServer = {
    tip,
    headers,
    rawTransactions: Object.fromEntries(recordedTransactions.map(tx => [tx.txid, tx.hex])),
    verboseTransactions: Object.fromEntries(recordedTransactions.map(tx => [tx.txid, tx])),
};

class MockSocket implements ISocket {
    private listener?: SocketListener;
    readonly requests: JsonRpcRequest[] = [];

    constructor(private readonly server: MockServer) {}

    connect(listener: SocketListener) {
        this.listener = listener;

        return Promise.resolve();
    }

    close() {}

    send(data: string) {
        const message = JSON.parse(data);
        const requests: JsonRpcRequest[] = Array.isArray(message) ? message : [message];
        this.requests.push(...requests);
        const responses = requests.map(request => {
            const result = this.getResult(request);

            // Like ElectrumX answers e.g. an unknown transaction.
            return result === undefined
                ? { jsonrpc: '2.0', id: request.id, error: { code: 2, message: 'not found' } }
                : { jsonrpc: '2.0', id: request.id, result };
        });
        setImmediate(() => this.listener?.onReceive(`${JSON.stringify(responses)}\n`));
    }

    private getResult({ method, params }: JsonRpcRequest) {
        switch (method) {
            case 'server.version':
                return ['MockElectrum 1.0', '1.4'];
            case 'blockchain.headers.subscribe':
                return this.server.tip;
            case 'blockchain.block.header':
                return this.server.headers[params[0] as number];
            case 'blockchain.transaction.get': {
                const [txid, verbose] = params as [string, boolean];

                return verbose
                    ? this.server.verboseTransactions[txid]
                    : this.server.rawTransactions[txid];
            }
            default:
                return null;
        }
    }

    getRequests(method: string) {
        return this.requests.filter(request => request.method === method);
    }
}

const clients: CachingElectrumClient[] = [];

const connectClient = async (server: MockServer, coin = 'BTC') => {
    const socket = new MockSocket(server);
    const client = new CachingElectrumClient();
    clients.push(client);
    await client.connect(socket, {
        url: 'mock',
        coin,
        client: { name: 'test', protocolVersion: '1.4' },
    });

    return { socket, client };
};

type MockOutput = { script: string; value: number };

type MockInput = { txid: string; vout: number; scriptSig?: string; witness?: string[] };

type CreateRawTransactionParams = { inputs?: MockInput[]; outputs: MockOutput[] };

// A transaction without inputs would be taken for a segwit one, so it gets a coinbase input.
const COINBASE_INPUT: MockInput = { txid: '00'.repeat(32), vout: 0xffffffff, scriptSig: '0101' };

const createRawTransaction = ({
    inputs = [COINBASE_INPUT],
    outputs,
}: CreateRawTransactionParams) => {
    const tx = new Transaction();
    tx.version = 2;
    inputs.forEach(({ txid, vout, scriptSig = '', witness = [] }) =>
        tx.ins.push({
            hash: Buffer.from(txid, 'hex').reverse(),
            index: vout,
            script: Buffer.from(scriptSig, 'hex'),
            sequence: 0xfffffffd,
            witness: witness.map(item => Buffer.from(item, 'hex')),
        }),
    );
    outputs.forEach(({ script, value }) =>
        tx.outs.push({ script: Buffer.from(script, 'hex'), value: value.toString() }),
    );

    return { txid: tx.getId(), hex: tx.toHex() };
};

// The only transaction of a history of one transaction.
const getHistoryTransaction = async (client: CachingElectrumClient, history: HistoryTx) => {
    const [tx] = await getTransactions(client, [history]);
    if (!tx) throw new Error(`Missing transaction ${history.tx_hash}`);

    return tx;
};

const createServer = (rawTransactions: { txid: string; hex: string }[]): MockServer => ({
    tip: { height: 1000, hex: '00'.repeat(80) },
    headers: { 999: '00'.repeat(80), 1001: '00'.repeat(80) },
    rawTransactions: Object.fromEntries(rawTransactions.map(({ txid, hex }) => [txid, hex])),
    verboseTransactions: {},
});

// Public test vectors of BIP173, BIP350 and of the addresses of utxo-lib.
const HASH = '751e76e8199196d454941c45d1b3a323f1433bd6';
const P2PKH_SCRIPT = '76a914751e76e8199196d454941c45d1b3a323f1433bd688ac';
const P2SH_SCRIPT = 'a914cd7b44d0b03f2d026d1e586d7ae18903b0d385f687';
const P2WPKH_SCRIPT = '0014751e76e8199196d454941c45d1b3a323f1433bd6';
const P2WSH_SCRIPT = '00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262';
const P2TR_SCRIPT = '5120000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433';
const WITNESS_V16_SCRIPT = '6002751e';
const WITNESS_V2_SCRIPT = '5210751e76e8199196d454941c45d1b3a323';
const WITNESS_V1_40_BYTES_SCRIPT =
    '5128751e76e8199196d454941c45d1b3a323f1433bd6751e76e8199196d454941c45d1b3a323f1433bd6';
const REGTEST_P2WSH_SCRIPT = '002095e2d98fa921d2a14057a41a09eb112613f95cb17905d2cd7e5322f6d9c7dfd9';
// The compressed public keys of the generator point G and of 2G.
const PUBKEY_G = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const PUBKEY_2G = '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5';
const FOREIGN_TXID = 'ee'.repeat(32);

describe('transactions of the Electrum worker', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        clients.splice(0).forEach(client => client.close());
    });

    it.each(transactions)(
        'formats raw $label $tx.txid the same as the verbose one',
        async ({ tx, height }) => {
            const { client } = await connectClient(recordedServer);

            const raw = await getHistoryTransaction(client, { tx_hash: tx.txid, height });
            const verbose = await getTransactionByTxid(client, tx.txid);

            expect(raw).toStrictEqual(verbose);
            expect(raw).toMatchObject({
                blockHeight: height,
                blockHash: tx.blockhash,
                blockTime: tx.blocktime,
                confirmations: tx.confirmations,
            });
        },
    );

    it.each(recordedTransactions)('parses raw $txid the same as the verbose one', tx => {
        expect(parseRawTransaction(tx.hex, networks.bitcoin)).toStrictEqual(
            parseVerboseTransaction(tx),
        );
    });

    it('gives the amounts and addresses of a recorded transaction', async () => {
        const { client } = await connectClient(recordedServer);
        const txid = 'fa80a9949f1094119195064462f54d0e0eabd3139becd4514ae635b8c7fe3a46';

        const tx = await getHistoryTransaction(client, { tx_hash: txid, height: 590093 });

        expect(tx).toMatchObject({
            txid,
            blockHeight: 590093,
            blockTime: 1565797979,
            confirmations: tip.height - 590093 + 1,
            value: '319322',
            valueIn: '319488',
            fees: '166',
            size: 247,
            vsize: 165,
            vin: [
                {
                    n: 0,
                    value: '319488',
                    addresses: ['3Bvy87TmQhhSBqfiCBh8w5yPx6usiDM8SY'],
                    isAddress: true,
                },
            ],
            vout: [
                {
                    n: 0,
                    value: '9426',
                    addresses: ['bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk'],
                    isAddress: true,
                },
                {
                    n: 1,
                    value: '309896',
                    addresses: ['3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV'],
                    isAddress: true,
                },
            ],
        });
    });

    it('requests the transactions raw and the header of each block once', async () => {
        const { socket, client } = await connectClient(recordedServer);
        const history = transactions.map(({ tx, height }) => ({ tx_hash: tx.txid, height }));

        await getTransactions(client, history);
        await getTransactions(client, history, { withForeignParents: false });

        const transactionRequests = socket.getRequests('blockchain.transaction.get');
        expect(transactionRequests.map(({ params }) => params[1])).toEqual(
            recordedTransactions.map(() => false),
        );
        expect(transactionRequests.map(({ params }) => params[0]).sort()).toEqual(
            recordedTransactions.map(({ txid }) => txid).sort(),
        );
        const headerRequests = socket.getRequests('blockchain.block.header');
        expect(headerRequests.map(({ params }) => params[0]).sort()).toEqual(
            [...new Set(history.map(({ height }) => height))].sort(),
        );
    });

    it('leaves a pending transaction without a block', async () => {
        const { socket, client } = await connectClient(recordedServer);
        // Height 0 for a transaction with confirmed inputs, -1 for one with pending inputs.
        const history = transactions
            .slice(0, 2)
            .map(({ tx }, index) => ({ tx_hash: tx.txid, height: -index }));

        const txs = await getTransactions(client, history);

        txs.forEach(pending =>
            expect(pending).toMatchObject({
                blockHeight: -1,
                confirmations: 0,
                blockTime: undefined,
                blockHash: undefined,
            }),
        );
        expect(socket.getRequests('blockchain.block.header')).toEqual([]);
    });

    it('leaves out the blocks when they are not needed', async () => {
        const { socket, client } = await connectClient(recordedServer);
        const history = transactions.map(({ tx, height }) => ({ tx_hash: tx.txid, height }));

        const txs = await getTransactions(client, history, {
            withForeignParents: false,
            withBlocks: false,
        });

        expect(
            txs.map(({ blockHeight, blockTime, blockHash, confirmations }) => ({
                blockHeight,
                blockTime,
                blockHash,
                confirmations,
            })),
        ).toEqual(
            history.map(({ height }) => ({
                blockHeight: height,
                blockTime: undefined,
                blockHash: undefined,
                confirmations: tip.height - height + 1,
            })),
        );
        expect(socket.getRequests('blockchain.block.header')).toEqual([]);
    });

    it('parses each raw transaction once', async () => {
        const parse = jest.spyOn(Transaction, 'fromHex');
        const txs = [101, 102, 103].map(value =>
            createRawTransaction({ outputs: [{ script: P2WSH_SCRIPT, value }] }),
        );
        const history = txs.map(({ txid }) => ({ tx_hash: txid, height: 999 }));
        const { client } = await connectClient(createServer(txs));

        await getTransactions(client, history);
        await getTransactions(client, history, { withForeignParents: false });
        // A client of another connection to the network gets the same raw transactions.
        const { client: nextClient } = await connectClient(createServer(txs));
        await getTransactions(nextClient, history);

        expect(parse).toHaveBeenCalledTimes(txs.length);
    });

    it('does not let a caller change the parsed transactions which are kept', async () => {
        const parent = createRawTransaction({ outputs: [{ script: P2PKH_SCRIPT, value: 104 }] });
        const tx = createRawTransaction({
            inputs: [{ txid: parent.txid, vout: 0, scriptSig: '00' }],
            outputs: [{ script: P2SH_SCRIPT, value: 100 }],
        });
        const { client } = await connectClient(createServer([parent, tx]));
        const historyTx = { tx_hash: tx.txid, height: 999 };

        const changed = await getHistoryTransaction(client, historyTx);
        changed.vin[0]?.addresses?.push('changed');
        changed.vout[0]?.addresses.push('changed');
        const formatted = await getHistoryTransaction(client, historyTx);

        expect(formatted.vin[0]?.addresses).toEqual(['1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH']);
        expect(formatted.vout[0]?.addresses).toEqual(['3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr']);
    });

    it('leaves the fee unknown without the previous transactions of foreign inputs', async () => {
        const parent = createRawTransaction({ outputs: [{ script: P2WPKH_SCRIPT, value: 2000 }] });
        const tx = createRawTransaction({
            inputs: [{ txid: parent.txid, vout: 0, witness: ['00'] }],
            outputs: [{ script: P2TR_SCRIPT, value: 1500 }],
        });
        const { client } = await connectClient(createServer([parent, tx]));
        const historyTx = { tx_hash: tx.txid, height: 999 };

        const [withoutParents] = await getTransactions(client, [historyTx], {
            withForeignParents: false,
        });
        const withParents = await getHistoryTransaction(client, historyTx);

        expect(withoutParents).toMatchObject({
            valueIn: '0',
            fees: '0',
            vin: [{ txid: parent.txid, n: 0, addresses: [], isAddress: false }],
        });
        expect(withoutParents?.vin[0]).not.toHaveProperty('value');
        expect(withParents).toMatchObject({
            valueIn: '2000',
            fees: '500',
            vin: [{ txid: parent.txid, value: '2000', isAddress: true }],
        });
    });

    it('fetches the previous transactions in the history of the account without the foreign ones', async () => {
        const ownParent = createRawTransaction({
            outputs: [{ script: P2WPKH_SCRIPT, value: 3000 }],
        });
        const foreignParent = createRawTransaction({
            outputs: [{ script: P2PKH_SCRIPT, value: 2000 }],
        });
        const tx = createRawTransaction({
            inputs: [
                { txid: ownParent.txid, vout: 0, witness: ['00'] },
                { txid: foreignParent.txid, vout: 0, scriptSig: '00' },
            ],
            outputs: [{ script: P2TR_SCRIPT, value: 4500 }],
        });
        const { socket, client } = await connectClient(
            createServer([ownParent, foreignParent, tx]),
        );

        const [formatted] = await getTransactions(client, [{ tx_hash: tx.txid, height: 999 }], {
            withForeignParents: false,
            accountTxids: new Set([ownParent.txid, tx.txid]),
        });

        const requestedTxids = socket
            .getRequests('blockchain.transaction.get')
            .map(({ params }) => params[0]);
        expect(requestedTxids.sort()).toEqual([ownParent.txid, tx.txid].sort());
        expect(formatted).toMatchObject({
            valueIn: '3000',
            fees: '0',
            vin: [
                { txid: ownParent.txid, value: '3000', isAddress: true },
                { txid: foreignParent.txid, addresses: [], isAddress: false },
            ],
        });
        expect(formatted?.vin[1]).not.toHaveProperty('value');
    });

    it('counts a block the server has not announced yet as confirmed once', async () => {
        const output = { script: P2WPKH_SCRIPT, value: 1000 };
        const tx = createRawTransaction({ outputs: [output] });
        const { client } = await connectClient(createServer([tx]));

        const confirmed = await getHistoryTransaction(client, { tx_hash: tx.txid, height: 1001 });

        expect(confirmed).toMatchObject({ blockHeight: 1001, confirmations: 1 });
    });

    it('gives no address to outputs which the node gives none', async () => {
        const outputs = [
            // Bare multisig.
            `5121${PUBKEY_G}21${PUBKEY_2G}52ae`,
            // Pay to public key.
            `21${PUBKEY_G}ac`,
            // Anyone can spend.
            '51',
            // A witness program of version 0 is either 20 or 32 bytes long.
            `0010${'aa'.repeat(16)}`,
            // A witness program is at most 40 bytes long.
            `5129${'aa'.repeat(41)}`,
            // A push of another length than the rest of the script is no witness program.
            `5121${'aa'.repeat(20)}`,
            // OP_RESERVED is no witness version.
            `5014${HASH}`,
            // Near misses of pay-to-pubkey-hash and pay-to-script-hash.
            `76a914${HASH}88ab`,
            `76a913${HASH.slice(0, 38)}0088ac`,
            `a914${HASH}88`,
            // OP_RETURN followed by an opcode which is not a push.
            '6aac0102',
            // OP_RETURN pushing more data than there is.
            '6a05aabb',
        ].map(script => ({ script, value: 0 }));
        const tx = createRawTransaction({ outputs });
        const { client } = await connectClient(createServer([tx]));

        const formatted = await getHistoryTransaction(client, { tx_hash: tx.txid, height: 999 });

        expect(
            formatted.vout.map(({ addresses, isAddress }) => ({ addresses, isAddress })),
        ).toEqual(outputs.map(() => ({ addresses: [], isAddress: false })));
    });

    it('describes the data of an OP_RETURN output', async () => {
        const outputs = [
            { script: '6a0b68656c6c6f20776f726c64', value: 0 },
            { script: `6a4c50${Buffer.from('a'.repeat(80)).toString('hex')}`, value: 0 },
            // OP_RETURN followed by OP_13 and a push, like a runestone.
            { script: '6a5d0441424344', value: 0 },
        ];
        const tx = createRawTransaction({ outputs });
        const { client } = await connectClient(createServer([tx]));

        const formatted = await getHistoryTransaction(client, { tx_hash: tx.txid, height: 999 });

        expect(formatted.vout).toMatchObject([
            { addresses: ['OP_RETURN (hello world)'], isAddress: false },
            { addresses: [`OP_RETURN (${'a'.repeat(80)})`], isAddress: false },
            { addresses: [`OP_RETURN (${String.fromCharCode(4)}ABCD)`], isAddress: false },
        ]);
    });

    it.each([
        {
            coin: 'BTC',
            scripts: [WITNESS_V16_SCRIPT, WITNESS_V2_SCRIPT, WITNESS_V1_40_BYTES_SCRIPT],
            addresses: [
                'bc1sw50qgdz25j',
                'bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs',
                'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y',
            ],
        },
        {
            coin: 'TEST',
            scripts: [P2PKH_SCRIPT, P2SH_SCRIPT, P2WSH_SCRIPT, P2TR_SCRIPT],
            addresses: [
                'mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r',
                '2NByiBUaEXrhmqAsg7BbLpcQSAQs1EDwt5w',
                'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
                'tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c',
            ],
        },
        {
            coin: 'REGTEST',
            scripts: [REGTEST_P2WSH_SCRIPT],
            addresses: ['bcrt1qjh3dnrafy8f2zszh5sdqn6c3ycfljh930yza9nt72v30dkw8mlvscn82zx'],
        },
    ])('gives the addresses of the network $coin', async ({ coin, scripts, addresses }) => {
        const outputs = scripts.map(script => ({ script, value: 1000 }));
        const tx = createRawTransaction({ outputs });
        const { client } = await connectClient(createServer([tx]), coin);

        const formatted = await getHistoryTransaction(client, { tx_hash: tx.txid, height: 999 });

        expect(formatted.vout.map(({ addresses }) => addresses)).toEqual(
            addresses.map(address => [address]),
        );
        expect(formatted.vout.every(({ isAddress }) => isAddress)).toBe(true);
    });

    it('gives the same raw transaction the addresses of the network of each client', async () => {
        const tx = createRawTransaction({ outputs: [{ script: P2WPKH_SCRIPT, value: 105 }] });
        const historyTx = { tx_hash: tx.txid, height: 999 };
        const { client: bitcoinClient } = await connectClient(createServer([tx]));
        const { client: testnetClient } = await connectClient(createServer([tx]), 'TEST');

        const onBitcoin = await getHistoryTransaction(bitcoinClient, historyTx);
        const onTestnet = await getHistoryTransaction(testnetClient, historyTx);

        expect([onBitcoin.vout[0]?.addresses, onTestnet.vout[0]?.addresses]).toEqual([
            ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
            ['tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'],
        ]);
    });

    it('takes the values and addresses of segwit and legacy inputs from their outputs', async () => {
        const legacyParent = createRawTransaction({
            inputs: [{ txid: FOREIGN_TXID, vout: 0, scriptSig: '00' }],
            outputs: [{ script: P2PKH_SCRIPT, value: 2100000000000000 }],
        });
        const segwitParent = createRawTransaction({
            inputs: [{ txid: FOREIGN_TXID, vout: 1, witness: ['00'] }],
            outputs: [
                { script: P2SH_SCRIPT, value: 1 },
                { script: P2WPKH_SCRIPT, value: 30000 },
            ],
        });
        const tx = createRawTransaction({
            inputs: [
                { txid: legacyParent.txid, vout: 0, scriptSig: `47${'30'.repeat(71)}` },
                { txid: segwitParent.txid, vout: 1, witness: ['30'.repeat(71), PUBKEY_G] },
            ],
            outputs: [{ script: P2WSH_SCRIPT, value: 2100000000020000 }],
        });
        const withoutWitness = Transaction.fromHex(tx.hex);
        withoutWitness.ins.forEach(input => {
            input.witness = [];
        });
        const { client } = await connectClient(createServer([legacyParent, segwitParent, tx]));

        const formatted = await getHistoryTransaction(client, { tx_hash: tx.txid, height: 999 });

        expect(formatted).toMatchObject({
            txid: withoutWitness.getId(),
            hex: tx.hex,
            version: 2,
            size: tx.hex.length / 2,
            vsize: Math.ceil((3 * withoutWitness.byteLength() + tx.hex.length / 2) / 4),
            value: '2100000000020000',
            valueIn: '2100000000030000',
            fees: '10000',
            vin: [
                {
                    txid: legacyParent.txid,
                    vout: 0,
                    sequence: 0xfffffffd,
                    n: 0,
                    value: '2100000000000000',
                    addresses: ['1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH'],
                    isAddress: true,
                },
                {
                    txid: segwitParent.txid,
                    vout: 1,
                    sequence: 0xfffffffd,
                    n: 1,
                    value: '30000',
                    addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
                    isAddress: true,
                },
            ],
        });
        expect(formatted.vsize).toBeLessThan(formatted.size ?? 0);
    });
});
