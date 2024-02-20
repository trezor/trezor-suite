import { arrayToDictionary, arrayDistinct } from '@trezor/utils';
import { btcToSat } from './transform';
import type { Transaction as BlockbookTransaction } from '@trezor/blockchain-link-types/lib/blockbook';
import type {
    ElectrumAPI,
    TransactionVerbose,
    TxIn,
    TxCoinbase,
    TxOut,
    HistoryTx,
} from '@trezor/blockchain-link-types/lib/electrum';

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

type GetVout = (txid: string, vout: number) => TransactionVerbose['vout'][number];
type GetSpent = (txid: string, n: number) => boolean;

const isNotCoinbase = (item: TxIn | TxCoinbase): item is TxIn => (item as any).txid !== undefined;

const formatTransaction =
    (getVout: GetVout, getSpent: GetSpent, currentHeight: number) =>
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
        const value = vout.map(({ value }) => value).reduce((a, b) => a + b, 0);
        const valueIn = vinRegular
            .map(({ txid, vout }) => getVout(txid, vout).value)
            .reduce((a, b) => a + b, 0);

        return {
            txid,
            hex,
            version,
            confirmations: confirmations ?? 0,
            lockTime: locktime,
            blockTime: blocktime,
            blockHash: blockhash,
            blockHeight: currentHeight && confirmations ? currentHeight - confirmations + 1 : -1,
            value: btcToSat(value),
            valueIn: btcToSat(valueIn),
            fees: btcToSat(valueIn - value),
            vsize,
            size,
            vin: vinRegular.map(({ txid, vout, sequence, n }, index) => ({
                txid,
                vout,
                sequence,
                n: n || index,
                value: btcToSat(getVout(txid, vout).value),
                ...parseAddresses(getVout(txid, vout).scriptPubKey),
            })),
            vout: vout.map(({ value, n, scriptPubKey }) => ({
                value: btcToSat(value),
                n,
                spent: getSpent(txid, n),
                hex: scriptPubKey.hex,
                ...parseAddresses(scriptPubKey),
            })),
        };
    };

export const getTransactions = async (
    client: ElectrumAPI,
    history: HistoryTx[],
): Promise<BlockbookTransaction[]> => {
    const txids = history.map(({ tx_hash }) => tx_hash).filter(arrayDistinct);

    // TODO optimize blockchain.transaction.get to not use verbose mode but parse
    // binary data locally instead. Then the transaction could be cached indefinitely.

    const origTxs = await Promise.all(
        txids.map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));

    const prevTxs = await Promise.all(
        Object.values(origTxs)
            .flatMap(({ vin }) => vin.filter(isNotCoinbase).map(({ txid }) => txid))
            .filter(arrayDistinct)
            .filter(txid => !origTxs[txid])
            .map(txid => client.request('blockchain.transaction.get', txid, true)),
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
    const getTx = (txid: string) => origTxs[txid] || prevTxs[txid];
    const getVout = (txid: string, vout: number) => getTx(txid).vout[vout];

    const currentHeight = client.getInfo()?.block?.height || 0;

    return Object.values(origTxs).map(formatTransaction(getVout, getSpent, currentHeight));
};
