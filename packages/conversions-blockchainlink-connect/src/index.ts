import type { VinVout, Transaction } from '@trezor/blockchain-link-types/lib/blockbook';
import { PROTO, PrecomposedTransaction } from '@trezor/connect';

type TxInputType2VinVoutContext = {
    getAddresses: (input: PROTO.TxInputType) => string[];
};

export const TxInputType2VinVout = (
    input: PROTO.TxInputType,
    context: TxInputType2VinVoutContext,
): VinVout => ({
    isAddress: true,
    n: input.prev_index,
    addresses: context.getAddresses(input),
    value: input.amount.toString(),
    txid: input.prev_hash,
    sequence: input.sequence,
});

type TxOutputType2VinVoutContext = {
    getAddresses: (output: PROTO.TxOutputType) => string[];
} & Pick<VinVout, 'n'>;

export const TxOutputType2VinVout = (
    output: PROTO.TxOutputType,
    context: TxOutputType2VinVoutContext,
): VinVout => ({
    isAddress: true,
    n: context.n,
    addresses: context.getAddresses(output),
    value: output.amount.toString(),
});

type PrecomposedTransactionFinal2TransactionContext = Pick<
    Transaction,
    | 'blockHeight'
    | 'blockHash'
    | 'txid'
    | 'confirmations'
    | 'blockTime'
    | 'valueIn'
    | 'value'
    | 'fees'
    | 'hex'
    | 'vin'
    | 'vout'
>;

export const PrecomposedTransactionFinal2Transaction = (
    _input: Extract<PrecomposedTransaction, { type: 'final' }>,
    context: PrecomposedTransactionFinal2TransactionContext,
): Transaction => ({
    ...context,
});
