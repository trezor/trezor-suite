import type { DBMigration } from './types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { updateAll } from './utils';

const VERSION = 20;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    // enhance tx.details
    await updateAll(transaction, 'txs', tx => {
        if (tx.tx.details) {
            tx.tx.details = {
                ...tx.tx.details,
                vin: tx.tx.details.vin.map(v => ({
                    ...v,
                    value: v.value ? formatNetworkAmount(v.value, tx.tx.symbol) : v.value,
                })),
                vout: tx.tx.details.vout.map(v => ({
                    ...v,
                    value: v.value ? formatNetworkAmount(v.value, tx.tx.symbol) : v.value,
                })),
                totalInput: formatNetworkAmount(tx.tx.details.totalInput, tx.tx.symbol),
                totalOutput: formatNetworkAmount(tx.tx.details.totalOutput, tx.tx.symbol),
            };
        }
        return tx;
    });
};

export default migrate;
