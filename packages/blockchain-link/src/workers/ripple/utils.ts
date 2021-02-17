// import BigNumber from 'bignumber.js';
// import { GetServerInfoResponse } from 'ripple-lib';
import { RippleError } from 'ripple-lib/dist/npm/common/errors';
import { Transaction } from '../../types/common';
import { CustomError } from '../../constants/errors';
import BigNumber from 'bignumber.js';

// export const transformServerInfo = (payload: GetServerInfoResponse) => {
export const transformServerInfo = (payload: any) => {
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

export const transformError = (error: any) => {
    if (error instanceof RippleError) {
        const code =
            error.name === 'TimeoutError' ? 'websocket_timeout' : 'websocket_error_message';
        if (error.data) {
            return new CustomError(code, `${error.name} ${error.data.error_message}`);
        }
        return new CustomError(code, error.toString());
    }
    return error;
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
            totalSpent: '0',
            blockTime: tx.date,
            blockHeight: tx.ledger_index,
            blockHash: tx.hash,
            targets: [],
            tokens: [],
            details: {
                vin: [],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        };
    }
    const type = tx.Account === descriptor ? 'sent' : 'recv';
    const addresses = [tx.Destination];
    const amount = tx.Amount;
    const fee = tx.Fee;
    const amountBn = new BigNumber(amount);
    // TODO: proper types for tx would prevent this mess
    const totalSpent = amountBn.isNaN() ? '0' : amountBn.plus(tx.Fee ?? 0).toString();

    return {
        type,

        txid: tx.hash,
        blockTime: tx.date,
        blockHeight: tx.ledger_index,
        blockHash: tx.hash,

        amount,
        fee,
        totalSpent,
        targets: [
            {
                addresses,
                isAddress: true,
                amount,
                n: 0, // no multi-targets in ripple
            },
        ],
        tokens: [],
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    };
};
