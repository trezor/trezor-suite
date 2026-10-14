import type {
    BlockbookTransaction,
    ElectrumAPI,
    ElectrumTypes,
    ElectrumHistoryTx as HistoryTx,
} from '@trezor/blockchain-link-types';
import { arrayDistinct, arrayToDictionary } from '@trezor/utils';

import { btcToSat } from './transform';

type TransactionVerbose = ElectrumTypes.TransactionVerbose;
type TxCoinbase = ElectrumTypes.TxCoinbase;
type TxIn = ElectrumTypes.TxIn;
type TxOut = ElectrumTypes.TxOut;

const transformOpReturn = (hex: string) => {
    const [, _len, data] = hex.match(/^6a(?:4c)?([0-9a-f]{2})([0-9a-f]*)$/i) ?? [];

    return data ? `OP_RETURN (${Buffer.from(data, 'hex').toString('ascii')})` : undefined;
};

const parseAddresses = ({ address, addresses, type, hex }: TxOut['scriptPubKey']) => {
    if (type === 'nulldata') {
        const opReturn = transformOpReturn(hex);

        return {
            addresses: opReturn ? [opReturn] : [],
            isAddress: false,
        };
    }
    const addrs = !address ? addresses || [] : [address];

    return {
        addresses: addrs,
        isAddress: addrs.length === 1,
    };
};

type GetVout = (txid: string, vout: number) => TransactionVerbose['vout'][number] | undefined;
type GetSpent = (txid: string, n: number) => boolean;
type GetBlockHeight = (tx: TransactionVerbose) => number;

const isNotCoinbase = (item: TxIn | TxCoinbase): item is TxIn =>
    'txid' in item && item.txid !== undefined;

const formatTransaction =
    (getVout: GetVout, getSpent: GetSpent, getBlockHeight: GetBlockHeight) =>
    (tx: TransactionVerbose): BlockbookTransaction => {
        const {
            txid,
            version,
            vin,
            vout,
            hex,
            blockhash,
            confirmations,
            blocktime,
            locktime,
            vsize,
            size,
        } = tx;
        const vinRegular = vin.filter(isNotCoinbase);
        const prevOuts = vinRegular.map(({ txid, vout }) => getVout(txid, vout));
        const value = vout.map(({ value }) => value).reduce((a, b) => a + b, 0);
        const valueIn = prevOuts.reduce((sum, prevOut) => sum + (prevOut?.value ?? 0), 0);
        // The fee is unknown when the previous transactions of some inputs were not fetched.
        const isValueInKnown = prevOuts.every(prevOut => prevOut !== undefined);

        return {
            txid,
            hex,
            version,
            confirmations: confirmations ?? 0,
            lockTime: locktime,
            blockTime: blocktime,
            blockHash: blockhash,
            blockHeight: getBlockHeight(tx),
            value: btcToSat(value),
            valueIn: btcToSat(valueIn),
            fees: isValueInKnown ? btcToSat(valueIn - value) : '0',
            vsize,
            size,
            vin: vinRegular.map(({ txid, vout, sequence, n }, index) => {
                const prevOut = prevOuts[index];

                return {
                    txid,
                    vout,
                    sequence,
                    n: n || index,
                    ...(prevOut
                        ? {
                              value: btcToSat(prevOut.value),
                              ...parseAddresses(prevOut.scriptPubKey),
                          }
                        : { addresses: [], isAddress: false }),
                };
            }),
            vout: vout.map(({ value, n, scriptPubKey }) => ({
                value: btcToSat(value),
                n,
                spent: getSpent(txid, n),
                hex: scriptPubKey.hex,
                ...parseAddresses(scriptPubKey),
            })),
        };
    };

type GetTransactionsOptions = {
    // The previous transactions of inputs which aren't in the history itself are needed only for
    // the fee and the sender addresses of transactions with foreign inputs (incoming payments).
    // Without them such inputs have no value and address and the fee of the transaction is 0, so
    // the result fits only computations of the account's own amounts.
    withForeignParents?: boolean;
};

export const getTransactions = async (
    client: ElectrumAPI,
    history: HistoryTx[],
    { withForeignParents = true }: GetTransactionsOptions = {},
): Promise<BlockbookTransaction[]> => {
    const txids = history.map(({ tx_hash }) => tx_hash).filter(arrayDistinct);

    // TODO optimize blockchain.transaction.get to not use verbose mode but parse
    // binary data locally instead. Then the transaction could be cached indefinitely.

    const origTxs = await Promise.all(
        txids.map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));

    const prevTxids = withForeignParents
        ? Object.values(origTxs)
              .flatMap(({ vin }) => vin.filter(isNotCoinbase).map(({ txid }) => txid))
              .filter(arrayDistinct)
              .filter(txid => !origTxs[txid])
        : [];
    const prevTxs = await Promise.all(
        prevTxids.map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));

    /* TODO
     * listunspent is too long for some addresses, but it's probably not a problem
     * to ignore it as vout[n].spent is not used anywhere anyway
    const unspentOutputs = await Promise.all(
        Object.values(origTxs)
            .flatMap(({ vout }) => vout.map(({ scriptPubKey: { hex } }) => hex))
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
    const getSpent = () => false;
    const getVout: GetVout = (txid, vout) => (origTxs[txid] ?? prevTxs[txid])?.vout[vout];

    const currentHeight = client.getInfo()?.block?.height || 0;
    const historyHeights = new Map(history.map(({ tx_hash, height }) => [tx_hash, height]));
    // Height from the history is exact, confirmations of a verbose transaction are counted by
    // the node of the server from its own tip, which may differ from the one known here.
    const getBlockHeight = ({ txid, confirmations }: TransactionVerbose) => {
        if (!currentHeight || !confirmations) return -1;
        const historyHeight = historyHeights.get(txid);

        return historyHeight && historyHeight > 0
            ? historyHeight
            : currentHeight - confirmations + 1;
    };

    return Object.values(origTxs).map(formatTransaction(getVout, getSpent, getBlockHeight));
};
