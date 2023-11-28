import type { Transaction } from '@trezor/blockchain-link-types';

// export const transformServerInfo = (payload: GetServerInfoResponse) => {
export const transformServerInfo = (payload: any) => ({
    name: 'Ripple',
    shortcut: 'xrp',
    testnet: false,
    version: payload.buildVersion,
    decimals: 6,
    blockHeight: payload.validatedLedger.ledgerVersion,
    blockHash: payload.validatedLedger.hash,
});

// export const concatTransactions = (
//     txs: Array<Transaction>,
//     newTxs: Array<Transaction>
// ): Array<Transaction> => {
//     if (newTxs.length < 1) return txs;
//     const unique = newTxs.filter(tx => txs.indexOf(tx) < 0);
//     return txs.concat(unique);
// };

// https://bitcoin.stackexchange.com/questions/23061/ripple-ledger-time-format/23065#23065
const BLOCKTIME_OFFSET = 946684800;

export const transformTransaction = (tx: any, descriptor?: string): Transaction => {
    const blockTime =
        typeof tx.date === 'number' && tx.date > 0 ? tx.date + BLOCKTIME_OFFSET : tx.date;

    if (tx.TransactionType !== 'Payment') {
        // TODO: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#transaction-types
        return {
            type: 'unknown',
            txid: tx.hash,
            amount: '0',
            fee: '0',
            blockTime,
            blockHeight: tx.ledger_index,
            blockHash: tx.hash,
            targets: [],
            tokens: [],
            internalTransfers: [],
            feeRate: undefined,
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

    return {
        type,

        txid: tx.hash,
        blockTime,
        blockHeight: tx.ledger_index,
        blockHash: tx.hash,

        amount,
        fee,
        targets: [
            {
                addresses,
                isAddress: true,
                amount,
                n: 0, // no multi-targets in ripple
            },
        ],
        tokens: [],
        internalTransfers: [],
        feeRate: undefined,
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    };
};
