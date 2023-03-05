import { transformTransaction } from '@trezor/blockchain-link-utils/lib/blockbook';

import type { BroadcastedTransactionDetails } from '../types';
import type { Transaction, AccountAddresses } from '../types/backend';

// create pending transaction, result of successful CoinjoinRound
export const createPendingTransaction = (
    { descriptor, addresses }: { descriptor: string; addresses?: AccountAddresses },
    txData: BroadcastedTransactionDetails,
): Transaction => {
    const valueIn = txData.inputs.reduce((sum, input) => sum + input.amount, 0);
    const valueOut = txData.outputs.reduce((sum, outputs) => sum + outputs.amount, 0);
    const fees = valueIn - valueOut;
    const blockbookTx = {
        txid: txData.txid,
        hex: txData.hex,
        blockHeight: -1,
        blockTime: Math.floor(Date.now() / 1000),
        confirmations: 0,
        vsize: txData.vsize,
        size: txData.size,
        value: valueOut.toString(), // TODO: not sure
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

    return transformTransaction(descriptor, addresses, blockbookTx);
};
