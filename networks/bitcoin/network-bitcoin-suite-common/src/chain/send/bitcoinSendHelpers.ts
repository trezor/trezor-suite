import type { AccountUtxo, ComposeOutput, PROTO } from '@trezor/connect-common';
import {
    type ChainSendDraft,
    type RbfTransactionParams,
    coinAmountToSmallestUnit,
} from '@trezor/network-module-suite-common-types';
import { bufferUtils } from '@trezor/utils';

/**
 * The send form's outputs as Bitcoin coin selection takes them, in satoshis.
 *
 * @param decimals The coin's decimals, to convert amounts entered in units.
 * @param isSatoshis Amounts are entered in satoshis already.
 */
export const getBitcoinComposeOutputs = (
    values: Partial<ChainSendDraft>,
    decimals: number,
    isSatoshis?: boolean,
) => {
    const result: ComposeOutput[] = [];
    if (!values || !Array.isArray(values.outputs) || values.transactionData) return result;

    const { setMaxOutputId } = values;

    values.outputs.forEach((output, index) => {
        if (!output || typeof output !== 'object') return; // skip invalid object

        if (output.type === 'opreturn' && output.dataHex) {
            result.push({
                type: 'opreturn',
                dataHex: output.dataHex,
            });
        }

        const { address } = output;
        const isMaxActive = setMaxOutputId === index;
        if (isMaxActive) {
            if (address) {
                result.push({
                    type: 'send-max',
                    address,
                });
            } else {
                result.push({ type: 'send-max-noaddress' });
            }
        } else if (output.amount) {
            const amount = isSatoshis
                ? output.amount
                : coinAmountToSmallestUnit(output.amount, decimals);

            if (address) {
                result.push({
                    type: 'payment',
                    address,
                    amount,
                });
            } else {
                result.push({
                    type: 'payment-noaddress',
                    amount,
                });
            }
        }
    });

    // corner case for multiple outputs
    // one Output is valid and "final" but other has only address
    // to prevent composing "final" transaction switch it to not-final (noaddress)
    const hasIncompleteOutput = values.outputs.find(
        (o, i) => setMaxOutputId !== i && o?.address && !o.amount,
    );
    if (hasIncompleteOutput) {
        const finalOutput = result.find(o => o.type === 'send-max' || o.type === 'payment');
        if (finalOutput) {
            // replace to *-noaddress
            finalOutput.type =
                finalOutput.type === 'payment' ? 'payment-noaddress' : 'send-max-noaddress';
        }
    }

    return result;
};

/** The original transaction's output order, which a replacement must keep. */
export const restoreOrigOutputsOrder = (
    outputs: PROTO.TxOutputType[],
    origOutputs: RbfTransactionParams['outputs'],
    origTxid: string,
): PROTO.TxOutputType[] => {
    const usedIndex: number[] = []; // collect used indexes to avoid duplicates

    return outputs
        .map(output => {
            const index = origOutputs.findIndex((prevOutput, i) => {
                if (usedIndex.includes(i)) return false;
                if (prevOutput.type === 'opreturn' && output.script_type === 'PAYTOOPRETURN')
                    return true;
                if (prevOutput.type === 'change' && output.address_n) return true;
                if (prevOutput.type === 'payment' && output.address === prevOutput.address)
                    return true;

                return false;
            });
            if (index >= 0) {
                usedIndex.push(index);

                return { ...output, orig_index: index, orig_hash: origTxid };
            }

            return output;
        })
        .sort((a, b) => {
            if (typeof a.orig_index === 'undefined' && typeof b.orig_index === 'undefined')
                return 0;
            if (typeof b.orig_index === 'undefined') return -1;
            if (typeof a.orig_index === 'undefined') return 1;

            return a.orig_index - b.orig_index;
        });
};

/** The outpoint (txid and output index, as the protocol serializes it) a UTXO is spent by. */
export const getUtxoOutpoint = (utxo: Pick<AccountUtxo, 'txid' | 'vout'>) => {
    if (utxo.txid.length !== 64) {
        throw new Error('Invalid length of txid');
    }
    const hash = bufferUtils.reverseBuffer(Buffer.from(utxo.txid, 'hex'));
    const buffer = Buffer.allocUnsafe(36);
    hash.copy(buffer);
    buffer.writeUInt32LE(utxo.vout, hash.length);

    return buffer.toString('hex');
};
