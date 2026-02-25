import { createThunk } from '@suite-common/redux-utils';
import { selectNetworkTokenDefinitions } from '@suite-common/token-definitions';
import { advancedSearchTransactions } from '@suite-common/transaction-search';
import {
    TRANSACTIONS_MODULE_PREFIX,
    selectAccountTransactionsMarkedAsNotScam,
    selectBaseCurrency,
    selectHistoricFiatRates,
    selectTransactions,
} from '@suite-common/wallet-core';
import { Account, ExportFileType } from '@suite-common/wallet-types';
import { getAccountTransactions } from '@suite-common/wallet-utils';

import { selectAccountLabelsForSearch } from 'src/selectors/suite/selectAccountLabelsForSearch';
import { formatData, getExportedFileName } from 'src/utils/wallet/exportTransactionsUtils';

export const exportTransactionsThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/exportTransactions`,
    async (
        {
            account,
            accountName,
            type,
            searchQuery,
        }: {
            account: Account;
            accountName: string;
            type: ExportFileType;
            searchQuery: string;
        },
        { getState, extra },
    ) => {
        const { services } = extra;
        // Get state of transactions
        const allTransactions = selectTransactions(getState());
        const historicFiatRates = selectHistoricFiatRates(getState());
        const baseCurrencyCode = selectBaseCurrency(getState());
        const tokenDefinitions = selectNetworkTokenDefinitions(getState(), account.symbol) || {};
        const txsMarkedAsNotScam = selectAccountTransactionsMarkedAsNotScam(
            getState(),
            account.key,
        );

        // TODO: this is not nice (copy-paste)
        // metadata reducer is still not part of trezor-common and I can not import it
        // here. so either followup, or maybe when I have a moment I'll refactor it  before merging this
        const provider = getState().metadata?.providers.find(
            // @ts-expect-error
            p => p.clientId === getState().metadata.selectedProvider.labels,
        );
        const metadataKeys = account?.metadata[1];
        let labels = {};
        if (!metadataKeys || !metadataKeys?.fileName || !provider?.data[metadataKeys.fileName]) {
            labels = { outputLabels: {} };
        } else {
            labels = provider.data[metadataKeys.fileName];
        }

        const transactions = getAccountTransactions(account.key, allTransactions)
            .filter(transaction => transaction.blockHeight !== -1)
            .map(transaction => ({
                ...transaction,
                targets: transaction.targets.map(target => ({
                    ...target,
                    // @ts-expect-error
                    metadataLabel: labels.outputLabels?.[transaction.txid]?.[target.n],
                })),
            }));

        const searchLabels = selectAccountLabelsForSearch(getState(), account);

        const filteredTransaction =
            searchQuery.trim() !== ''
                ? advancedSearchTransactions(transactions, searchLabels, searchQuery)
                : transactions;

        // getAccountTransactions doesn't guarantee transactions will be sorted
        filteredTransaction.sort((t1, t2) => (t2.blockTime || 0) - (t1.blockTime || 0));

        // Prepare data in right format
        const data = await formatData(
            {
                symbol: account.symbol,
                accountName,
                type,
                transactions: filteredTransaction,
                baseCurrencyCode,
            },
            tokenDefinitions,
            txsMarkedAsNotScam,
            historicFiatRates,
        );

        // Save file
        const fileName = getExportedFileName(accountName, type);

        services.saveAs(data, fileName);
    },
);
