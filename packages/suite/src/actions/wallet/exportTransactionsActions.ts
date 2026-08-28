import { type MetadataRootState } from '@suite/metadata';
import { type AccountLabels } from '@suite-common/metadata-types';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import { advancedSearchTransactions } from '@suite-common/transaction-search';
import {
    type FiatRatesRootState,
    TRANSACTIONS_MODULE_PREFIX,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountTransactionsMarkedAsNotScam,
    selectBaseCurrency,
    selectHistoricFiatRates,
    selectTransactions,
} from '@suite-common/wallet-core';
import { type Account, type ExportFileType } from '@suite-common/wallet-types';
import { getAccountTransactions } from '@suite-common/wallet-utils';

import {
    type SelectAccountLabelsForSearchState,
    selectAccountLabelsForSearch,
} from 'src/selectors/suite/selectAccountLabelsForSearch';
import { formatData, getExportedFileName } from 'src/utils/wallet/exportTransactionsUtils';

type ExportTransactionsThunkParams = {
    account: Account;
    accountName: string;
    type: ExportFileType;
    searchQuery: string;
};

const selectMetadataState = (state: MetadataRootState) => state.metadata;

type ExportTransactionsThunkState = FiatRatesRootState &
    SelectAccountLabelsForSearchState &
    TokenDefinitionsRootState &
    TransactionsRootState &
    WalletSettingsRootState;

type ExportTransactionsThunkDeps = WithServices<{
    saveAs: (data: Blob, fileName: string) => void;
}>;

export const exportTransactionsThunk = createThunk<
    void,
    ExportTransactionsThunkParams,
    { state: ExportTransactionsThunkState; extra: ExportTransactionsThunkDeps }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/exportTransactions`,
    async ({ account, accountName, type, searchQuery }, { getState, extra }) => {
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
        const provider = selectMetadataState(getState())?.providers.find(
            p => p.clientId === selectMetadataState(getState()).selectedProvider.labels,
        );
        const metadataKeys = account?.metadata[1];
        let labels: Partial<AccountLabels> = {};
        if (!metadataKeys?.fileName || !provider?.data[metadataKeys.fileName]) {
            labels = { outputLabels: {} };
        } else {
            labels = provider.data[metadataKeys.fileName] as AccountLabels;
        }

        const transactions = getAccountTransactions(account.key, allTransactions)
            .filter(transaction => transaction.blockHeight !== -1)
            .map(transaction => ({
                ...transaction,
                targets: transaction.targets.map(target => ({
                    ...target,
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
