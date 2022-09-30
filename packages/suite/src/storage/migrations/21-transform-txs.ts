import type { DBMigration, DBWalletAccountTransactionCompatible } from './types';
import BigNumber from 'bignumber.js';
import { updateAll } from './utils';

const VERSION = 21;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    // do the same thing as in blockchain-link's transformTransaction
    const symbolsToExclude = ['eth', 'etc', 'xrp', 'trop', 'txrp'];
    await updateAll<'txs', DBWalletAccountTransactionCompatible>(transaction, 'txs', tx => {
        if (!tx.tx.totalSpent) {
            if (!symbolsToExclude.includes(tx.tx.symbol)) {
                // btc-like txs
                if (tx.tx.type === 'sent') {
                    // fix tx.amount = tx.amount - tx.fee for btc-like sent txs
                    tx.tx.totalSpent = tx.tx.amount;
                    tx.tx.amount = new BigNumber(tx.tx.amount).minus(tx.tx.fee).toString();
                } else {
                    tx.tx.totalSpent = tx.tx.amount;
                }
            } else if (tx.tx.type === 'sent') {
                // eth, xrp like sent txs
                if (tx.tx.ethereumSpecific) {
                    if (tx.tx.tokens.length > 0 || tx.tx.ethereumSpecific.status === 0) {
                        // eth with tokens (amount === fee == totalSpent)
                        tx.tx.totalSpent = tx.tx.amount;
                    } else {
                        tx.tx.totalSpent = new BigNumber(tx.tx.amount).plus(tx.tx.fee).toString();
                    }
                } else {
                    tx.tx.totalSpent = new BigNumber(tx.tx.amount).plus(tx.tx.fee).toString();
                }
            } else {
                // self, recv txs
                tx.tx.totalSpent = tx.tx.amount;
            }
            return tx;
        }
    });
};

export default migrate;
