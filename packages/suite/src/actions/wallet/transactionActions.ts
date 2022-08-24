import { saveAs } from 'file-saver';
import { getAccountTransactions, formatData } from '@suite-common/wallet-utils';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';

// Note: This was not moved to suite-common due browser API that wouldn't work on mobile right now
// (rest of the actions will be found in suite-common/wallet-transactions)
export const exportTransactions =
    (account: Account, accountName: string, type: 'csv' | 'pdf' | 'json') =>
    async (_: Dispatch, getState: GetState) => {
        // Get state of transactions
        const transactions = getAccountTransactions(
            account.key,
            getState().wallet.transactions.transactions,
            // add metadata directly to transactions
        ).map(transaction => ({
            ...transaction,
            targets: transaction.targets.map(target => ({
                ...target,
                metadataLabel: account.metadata?.outputLabels?.[transaction.txid]?.[target.n],
            })),
        }));

        // Prepare data in right format
        const data = await formatData({
            coin: account.symbol,
            accountName,
            type,
            transactions,
        });

        // Save file
        saveAs(data, `export-${account.symbol}-${+new Date()}.${type}`);
    };
