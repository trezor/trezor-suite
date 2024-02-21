import { blockbookUtils } from '@trezor/blockchain-link-utils';

import type { BroadcastedTransactionDetails } from '../types';
import type { Transaction, AccountAddresses } from '../types/backend';

// create pending transaction, the result of successfully broadcasted CoinjoinRound
export const createPendingTransaction = (
    { descriptor, addresses }: { descriptor: string; addresses?: AccountAddresses },
    txData: BroadcastedTransactionDetails,
): Transaction => {
    const valueIn = txData.inputs.reduce((sum, input) => sum + input.amount, 0);
    const value = txData.outputs.reduce((sum, outputs) => sum + outputs.amount, 0);
    const fees = valueIn - value;
    const blockbookTx = {
        txid: txData.txid,
        hex: txData.hex,
        blockHeight: -1,
        blockTime: Math.floor(Date.now() / 1000),
        confirmations: 0,
        vsize: txData.vsize,
        size: txData.size,
        value: value.toString(),
        valueIn: valueIn.toString(),
        fees: fees.toString(),
        vin: txData.inputs.map((input, n) => ({
            txid: input.hash,
            n,
            vout: input.index,
            isAddress: true,
            addresses: [input.address],
            value: input.amount.toString(),
        })),
        vout: txData.outputs.map((output, n) => ({
            n,
            isAddress: true,
            addresses: [output.address],
            value: output.amount.toString(),
        })),
    };

    return blockbookUtils.transformTransaction(blockbookTx, addresses ?? descriptor);
};
