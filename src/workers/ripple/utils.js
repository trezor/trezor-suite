/* @flow */
import BigNumber from 'bignumber.js';
import { GetServerInfoResponse } from 'ripple-lib';

import type { Transaction } from '../../types/common';

export const transformServerInfo = (payload: GetServerInfoResponse) => {
    return {
        name: 'Ripple',
        shortcut: 'xrp',
        testnet: false,
        version: payload.buildVersion,
        decimals: 6,
        blockHeight: payload.validatedLedger.ledgerVersion,
        blockHash: payload.validatedLedger.hash,
    };
};

// export const concatTransactions = (
//     txs: Array<Transaction>,
//     newTxs: Array<Transaction>
// ): Array<Transaction> => {
//     if (newTxs.length < 1) return txs;
//     const unique = newTxs.filter(tx => txs.indexOf(tx) < 0);
//     return txs.concat(unique);
// };

export const transformTransaction = (descriptor: string, tx: any): Transaction => {
    if (tx.TransactionType !== 'Payment') {
        // TODO: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#transaction-types
        return {
            type: 'unknown',
            txid: tx.hash,
            amount: '0',
            fee: '0',
            blockTime: tx.date,
            blockHeight: tx.ledger_index,
            blockHash: tx.hash,
            targets: [],
            tokens: [],
        };
    }
    const type = tx.Account === descriptor ? 'sent' : 'recv';
    const addresses = type === 'sent' ? [tx.Destination] : [tx.Account];
    const amount = tx.Amount;
    const fee = tx.Fee;
    // const total = new BigNumber(amount).plus(fee).toString();

    return {
        type,

        txid: tx.hash,
        blockTime: tx.date,
        blockHeight: tx.ledger_index,
        blockHash: tx.hash,

        amount,
        fee,
        // total,
        targets: [
            {
                addresses,
                isAddress: true,
                amount,
            },
        ],
        tokens: [],
    };
};
