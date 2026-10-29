import type {
    BlockbookTransaction,
    ElectrumAPI,
    ElectrumTypes,
    ElectrumHistoryTx as HistoryTx,
} from '@trezor/blockchain-link-types';
import { arrayDistinct, arrayToDictionary, bufferUtils } from '@trezor/utils';
import {
    type Network,
    Transaction,
    address as addressUtils,
    script as bscript,
    networks,
    payments,
} from '@trezor/utxo-lib';

import { blockheaderToBlockhash, btcToSat } from './transform';

type TransactionVerbose = ElectrumTypes.TransactionVerbose;
type TxCoinbase = ElectrumTypes.TxCoinbase;
type TxIn = ElectrumTypes.TxIn;
type TxOut = ElectrumTypes.TxOut;

type OutputAddresses = { addresses: string[]; isAddress: boolean };

type TransactionInput = { txid: string; vout: number; sequence: number };

type TransactionOutput = OutputAddresses & { value: string; hex: string };

// What a transaction is formatted from, parsed from its raw or verbose form.
type ParsedTransaction = {
    txid: string;
    hex: string;
    version: number;
    lockTime: number;
    size: number;
    vsize: number;
    // The inputs spending previous outputs, i.e. not the input of a coinbase transaction.
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
};

type TransactionBlock = Pick<
    BlockbookTransaction,
    'blockHeight' | 'blockHash' | 'confirmations'
> & {
    // Unknown for a pending transaction, like in a verbose transaction of the server.
    blockTime?: number;
};

const PENDING_BLOCK: TransactionBlock = {
    blockHeight: -1,
    blockTime: undefined,
    blockHash: undefined,
    confirmations: 0,
};

// Bytes 68 to 72 of a block header hold the time of the block.
const BLOCK_TIME_OFFSET = 68;

const transformOpReturn = (hex: string) => {
    const [, _len, data] = hex.match(/^6a(?:4c)?([0-9a-f]{2})([0-9a-f]*)$/i) ?? [];

    return data ? `OP_RETURN (${Buffer.from(data, 'hex').toString('ascii')})` : undefined;
};

const parseOpReturn = (hex: string): OutputAddresses => {
    const opReturn = transformOpReturn(hex);

    return {
        addresses: opReturn ? [opReturn] : [],
        isAddress: false,
    };
};

const parseAddresses = ({
    address,
    addresses,
    type,
    hex,
}: TxOut['scriptPubKey']): OutputAddresses => {
    if (type === 'nulldata') return parseOpReturn(hex);
    const addrs = !address ? addresses || [] : [address];

    return {
        addresses: addrs,
        isAddress: addrs.length === 1,
    };
};

const { OPS } = bscript;

// Like for Bitcoin Core, an output is null data only when OP_RETURN is followed by pushes of data.
const isNullData = (script: Buffer) => {
    const [opcode, ...chunks] = bscript.decompile(script);

    return (
        opcode === OPS.OP_RETURN &&
        chunks.every(chunk => typeof chunk !== 'number' || chunk <= OPS.OP_16)
    );
};

const isPayToPubkeyHash = (script: Buffer) =>
    script.length === 25 &&
    script.readUInt8(0) === OPS.OP_DUP &&
    script.readUInt8(1) === OPS.OP_HASH160 &&
    script.readUInt8(2) === 20 &&
    script.readUInt8(23) === OPS.OP_EQUALVERIFY &&
    script.readUInt8(24) === OPS.OP_CHECKSIG;

const isPayToScriptHash = (script: Buffer) =>
    script.length === 23 &&
    script.readUInt8(0) === OPS.OP_HASH160 &&
    script.readUInt8(1) === 20 &&
    script.readUInt8(22) === OPS.OP_EQUAL;

// A witness program pushes 2 to 40 bytes after OP_0 or one of OP_1 to OP_16 for its version.
const getWitnessVersion = (script: Buffer) => {
    if (script.length < 4 || script.length > 42 || script.readUInt8(1) !== script.length - 2) {
        return undefined;
    }
    const opcode = script.readUInt8(0);
    if (opcode === OPS.OP_0) return 0;
    if (opcode >= OPS.OP_1 && opcode <= OPS.OP_16) return opcode - OPS.OP_1 + 1;
};

// The templates of Bitcoin Core, which gives no address to pay-to-pubkey, bare multisig and
// non-standard outputs. They are checked here, as address.fromOutputScript of utxo-lib finds
// the type by trying the payments one by one until one doesn't throw, which is slow.
const getOutputAddress = (script: Buffer, network: Network) => {
    if (isPayToPubkeyHash(script)) return payments.p2pkh({ output: script, network }).address;
    if (isPayToScriptHash(script)) return payments.p2sh({ output: script, network }).address;
    const version = getWitnessVersion(script);
    // Only witness programs of 20 and 32 bytes are defined for version 0.
    if (version === undefined || (version === 0 && script.length !== 22 && script.length !== 34)) {
        return undefined;
    }

    return addressUtils.toBech32(script.subarray(2), version, network.bech32);
};

const parseOutputScript = (script: Buffer, network: Network): OutputAddresses => {
    if (isNullData(script)) return parseOpReturn(script.toString('hex'));
    const address = getOutputAddress(script, network);

    return address
        ? { addresses: [address], isAddress: true }
        : { addresses: [], isAddress: false };
};

const isNotCoinbase = (item: TxIn | TxCoinbase): item is TxIn =>
    'txid' in item && item.txid !== undefined;

export const parseVerboseTransaction = (tx: TransactionVerbose): ParsedTransaction => ({
    txid: tx.txid,
    hex: tx.hex,
    version: tx.version,
    lockTime: tx.locktime,
    size: tx.size,
    vsize: tx.vsize,
    inputs: tx.vin.filter(isNotCoinbase).map(({ txid, vout, sequence }) => ({
        txid,
        vout,
        sequence,
    })),
    outputs: tx.vout.map(({ value, scriptPubKey }) => ({
        value: btcToSat(value),
        hex: scriptPubKey.hex,
        ...parseAddresses(scriptPubKey),
    })),
});

export const parseRawTransaction = (hex: string, network: Network): ParsedTransaction => {
    const tx = Transaction.fromHex(hex, { network });

    return {
        txid: tx.getId(),
        hex,
        version: tx.version,
        lockTime: tx.locktime,
        size: tx.byteLength(),
        vsize: tx.virtualSize(),
        inputs: tx.isCoinbase()
            ? []
            : tx.ins.map(({ hash, index, sequence }) => ({
                  txid: bufferUtils.reverseBuffer(hash).toString('hex'),
                  vout: index,
                  sequence,
              })),
        outputs: tx.outs.map(({ value, script }) => ({
            value,
            hex: script.toString('hex'),
            ...parseOutputScript(script, network),
        })),
    };
};

const sumValues = (outputs: TransactionOutput[]) =>
    outputs.reduce((sum, { value }) => sum + Number(value), 0);

type GetOutput = (txid: string, vout: number) => TransactionOutput | undefined;
type GetSpent = (txid: string, n: number) => boolean;

type FormatTransactionParams = {
    tx: ParsedTransaction;
    block: TransactionBlock;
    getOutput: GetOutput;
    getSpent: GetSpent;
};

const formatTransaction = ({
    tx,
    block,
    getOutput,
    getSpent,
}: FormatTransactionParams): BlockbookTransaction => {
    const { txid, hex, version, lockTime, size, vsize, inputs, outputs } = tx;
    const prevOuts = inputs.map(({ txid, vout }) => getOutput(txid, vout));
    const knownPrevOuts = prevOuts.filter(prevOut => prevOut !== undefined);
    const value = sumValues(outputs);
    const valueIn = sumValues(knownPrevOuts);
    // The fee is unknown when the previous transactions of some inputs were not fetched.
    const isValueInKnown = knownPrevOuts.length === prevOuts.length;

    return {
        txid,
        hex,
        version,
        confirmations: block.confirmations,
        lockTime,
        // A pending transaction has no block time, like the verbose transactions of the server.
        blockTime: block.blockTime as number,
        blockHash: block.blockHash,
        blockHeight: block.blockHeight,
        value: value.toString(),
        valueIn: valueIn.toString(),
        fees: isValueInKnown ? (valueIn - value).toString() : '0',
        vsize,
        size,
        vin: inputs.map(({ txid, vout, sequence }, index) => {
            const prevOut = prevOuts[index];

            return {
                txid,
                vout,
                sequence,
                n: index,
                ...(prevOut
                    ? {
                          value: prevOut.value,
                          addresses: [...prevOut.addresses],
                          isAddress: prevOut.isAddress,
                      }
                    : { addresses: [], isAddress: false }),
            };
        }),
        vout: outputs.map(({ value, hex, addresses, isAddress }, n) => ({
            value,
            n,
            spent: getSpent(txid, n),
            hex,
            // The parsed transactions are kept, so their arrays are not handed out.
            addresses: [...addresses],
            isAddress,
        })),
    };
};

/* TODO
 * listunspent is too long for some addresses, but it's probably not a problem
 * to ignore it as vout[n].spent is not used anywhere anyway
const unspentOutputs = await Promise.all(
    Object.values(origTxs)
        .flatMap(({ outputs }) => outputs.map(({ hex }) => hex))
        .filter(arrayDistinct)
        .map(scriptToScripthash)
        .map(scripthash => client.request('blockchain.scripthash.listunspent', scripthash))
)
    .then(utxos =>
        utxos
            .flat()
            .filter(({ tx_hash }) => origTxs[tx_hash])
            .reduce(
                (dic, { tx_hash, tx_pos }) => ({
                    ...dic,
                    [tx_hash]: [...(dic[tx_hash] || []), tx_pos],
                }),
                {} as { [txid: string]: number[] }
            )
    );

const getSpent = (txid: string, n: number) => !unspentOutputs[txid]?.includes(n);
*/
const getSpent: GetSpent = () => false;

const MAX_PARSED_TRANSACTIONS = 20000;

// A raw transaction always parses the same and parsing all the transactions of a big account
// again for each of its requests would take seconds, so they are kept by their hex per network,
// like the raw transactions in the cache of the network.
const parsedTransactions = new WeakMap<Network, Map<string, ParsedTransaction>>();

// When the cache of the network is dropped, e.g. no account of the network is left.
export const forgetParsedTransactions = (network: Network) => {
    parsedTransactions.delete(network);
};

const getParsedTransaction = (hex: string, network: Network) => {
    const parsed = parsedTransactions.get(network) ?? new Map<string, ParsedTransaction>();
    parsedTransactions.set(network, parsed);
    const known = parsed.get(hex);
    if (known) return known;

    const tx = parseRawTransaction(hex, network);
    parsed.set(hex, tx);
    if (parsed.size > MAX_PARSED_TRANSACTIONS) {
        const oldestHex = parsed.keys().next().value;
        if (oldestHex !== undefined) parsed.delete(oldestHex);
    }

    return tx;
};

// Raw transactions are smaller than verbose ones, which hold the raw transaction too, and don't
// change, so they are cached for good.
const getRawTransactions = (client: ElectrumAPI, txids: string[]) => {
    const network = client.getInfo()?.network ?? networks.bitcoin;

    return Promise.all(
        txids.map(txid =>
            client
                .request('blockchain.transaction.get', txid, false)
                .then(hex => getParsedTransaction(hex, network)),
        ),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));
};

const getBlockHeaders = (client: ElectrumAPI, heights: number[]) =>
    Promise.all(
        heights.map(height =>
            client.request('blockchain.block.header', height).then(header => ({
                height,
                time: Buffer.from(header, 'hex').readUInt32LE(BLOCK_TIME_OFFSET),
                hash: blockheaderToBlockhash(header),
            })),
        ),
    ).then(headers => new Map(headers.map(header => [header.height, header])));

type GetTransactionsOptions = {
    // The previous transactions of inputs which aren't in the history itself are needed only for
    // the fee and the sender addresses of transactions with foreign inputs (incoming payments).
    // Without them such inputs have no value and address and the fee of the transaction is 0, so
    // the result fits only computations of the account's own amounts.
    withForeignParents?: boolean;
    // The headers of the blocks are needed only for their time and hash. Without them a confirmed
    // transaction has its height and confirmations only.
    withBlocks?: boolean;
};

// The transactions of a history are fetched raw, with the time and hash of their blocks taken from
// the headers at the heights the history tells.
export const getTransactions = async (
    client: ElectrumAPI,
    history: HistoryTx[],
    { withForeignParents = true, withBlocks = true }: GetTransactionsOptions = {},
): Promise<BlockbookTransaction[]> => {
    const heights = new Map(history.map(({ tx_hash, height }) => [tx_hash, height]));
    const blockHeights = withBlocks
        ? [...heights.values()].filter(height => height > 0).filter(arrayDistinct)
        : [];

    const getTransactionsWithParents = async () => {
        const origTxs = await getRawTransactions(client, [...heights.keys()]);
        const prevTxids = withForeignParents
            ? Object.values(origTxs)
                  .flatMap(({ inputs }) => inputs.map(({ txid }) => txid))
                  .filter(arrayDistinct)
                  .filter(txid => !origTxs[txid])
            : [];
        const prevTxs = await getRawTransactions(client, prevTxids);

        return { origTxs, prevTxs };
    };
    const [{ origTxs, prevTxs }, headers] = await Promise.all([
        getTransactionsWithParents(),
        getBlockHeaders(client, blockHeights),
    ]);

    const getOutput: GetOutput = (txid, vout) => (origTxs[txid] ?? prevTxs[txid])?.outputs[vout];
    const currentHeight = client.getInfo()?.block?.height || 0;
    const getBlock = ({ txid }: ParsedTransaction): TransactionBlock => {
        const height = heights.get(txid) ?? 0;
        if (height <= 0) return PENDING_BLOCK;
        const header = headers.get(height);

        return {
            blockHeight: height,
            blockTime: header?.time,
            blockHash: header?.hash,
            // The history of the server may already have a block which it hasn't announced yet.
            confirmations: Math.max(1, currentHeight - height + 1),
        };
    };

    return Object.values(origTxs).map(tx =>
        formatTransaction({ tx, block: getBlock(tx), getOutput, getSpent }),
    );
};

const getVerboseBlock = (
    { confirmations, blocktime, blockhash }: TransactionVerbose,
    currentHeight: number,
): TransactionBlock => ({
    blockHeight: currentHeight && confirmations ? currentHeight - confirmations + 1 : -1,
    blockTime: blocktime,
    blockHash: blockhash,
    confirmations: confirmations ?? 0,
});

// Without a history the height of the transaction is unknown, so it is fetched verbose with
// the block and confirmations told by the server. Only the previous transactions are raw.
export const getTransactionByTxid = async (
    client: ElectrumAPI,
    txid: string,
): Promise<BlockbookTransaction> => {
    const verboseTx = await client.request('blockchain.transaction.get', txid, true);
    const tx = parseVerboseTransaction(verboseTx);
    const prevTxs = await getRawTransactions(
        client,
        tx.inputs.map(({ txid }) => txid).filter(arrayDistinct),
    );
    const getOutput: GetOutput = (txid, vout) => prevTxs[txid]?.outputs[vout];
    const currentHeight = client.getInfo()?.block?.height || 0;

    return formatTransaction({
        tx,
        block: getVerboseBlock(verboseTx, currentHeight),
        getOutput,
        getSpent,
    });
};
