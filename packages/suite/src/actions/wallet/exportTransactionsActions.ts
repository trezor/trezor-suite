import { AccountLabels } from '@suite-common/metadata-types';
import { createThunk } from '@suite-common/redux-utils';
import { selectNetworkTokenDefinitions } from '@suite-common/token-definitions';
import {
    TRANSACTIONS_MODULE_PREFIX,
    selectHistoricFiatRates,
    selectTransactions,
} from '@suite-common/wallet-core';
import { Account, ExportFileType } from '@suite-common/wallet-types';
import { advancedSearchTransactions, getAccountTransactions } from '@suite-common/wallet-utils';
import { selectEncryptionVersion } from 'src/reducers/suite/metadataReducer';
import { formatData, getExportedFileName } from 'src/utils/wallet/exportTransactionsUtils';

export const exportTransactionsThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/exportTransactions`,
    async (
        {
            account,
            accountName,
            type,
            searchQuery,
            accountMetadata,
        }: {
            account: Account;
            accountName: string;
            type: ExportFileType;
            searchQuery: string;
            accountMetadata: AccountLabels;
        },
        { getState, extra },
    ) => {
        const { utils, selectors } = extra;
        // Get state of transactions
        const allTransactions = selectTransactions(getState());
        const historicFiatRates = selectHistoricFiatRates(getState());
        const localCurrency = selectors.selectLocalCurrency(getState());
        const tokenDefinitions = selectNetworkTokenDefinitions(getState(), account.symbol) || {};

        // TODO: this is not nice (copy-paste)
        // metadata reducer is still not part of trezor-common and I can not import it
        // here. so either followup, or maybe when I have a moment I'll refactor it  before merging this
        // eslint-disable-next-line no-restricted-syntax
        const provider = getState().metadata?.providers.find(
            // @ts-expect-error
            // eslint-disable-next-line no-restricted-syntax
            p => p.clientId === getState().metadata.selectedProvider.labels,
        );

        const encryptionVersion = selectEncryptionVersion(getState());
        const metadataKeys = account?.metadata[encryptionVersion];
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

        const filteredTransaction =
            searchQuery.trim() !== ''
                ? advancedSearchTransactions(transactions, accountMetadata, searchQuery)
                : transactions;

        // Prepare data in right format
        const data = await formatData(
            {
                coin: account.symbol,
                accountName,
                type,
                transactions: filteredTransaction,
                localCurrency,
            },
            tokenDefinitions,
            historicFiatRates,
        );

        // Save file
        const fileName = getExportedFileName(accountName, type);

        utils.saveAs(data, fileName);
    },
);
