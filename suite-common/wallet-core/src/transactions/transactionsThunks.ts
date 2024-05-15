import {
    Account,
    ExportFileType,
    PrecomposedTransactionFinal,
    PrecomposedTransactionCardanoFinal,
    WalletAccountTransaction,
    AccountKey,
} from '@suite-common/wallet-types';
import {
    findTransactions,
    formatData,
    getAccountTransactions,
    getExportedFileName,
    isTrezorConnectBackendType,
    getPendingAccount,
    findAccountsByAddress,
    enhanceTransaction,
    getRbfParams,
    replaceEthereumSpecific,
    advancedSearchTransactions,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { AccountLabels } from '@suite-common/metadata-types';
import TrezorConnect from '@trezor/connect';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import { createThunk } from '@suite-common/redux-utils';
import { selectNetworkTokenDefinitions } from '@suite-common/token-definitions/src/tokenDefinitionsSelectors';

import { accountsActions } from '../accounts/accountsActions';
import { selectTransactions } from './transactionsReducer';
import { TRANSACTIONS_MODULE_PREFIX, transactionsActions } from './transactionsActions';
import { selectAccountByKey, selectAccounts } from '../accounts/accountsReducer';
import { selectBlockchainHeightBySymbol } from '../blockchain/blockchainReducer';
import { selectHistoricFiatRates } from '../fiat-rates/fiatRatesSelectors';
import { selectSendSignedTx } from '../send/sendFormReducer';

/**
 * Replace existing transaction in the reducer (RBF)
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 */
interface ReplaceTransactionThunkParams {
    // transaction input parameters. It has to be passed as argument rather than obtained form send-form state, because this thunk is used also by eth-staking module that uses different redux state.
    precomposedTransaction: PrecomposedTransactionFinal;
    newTxid: string;
}

export const replaceTransactionThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/replaceTransactionThunk`,
    (
        { precomposedTransaction, newTxid }: ReplaceTransactionThunkParams,
        { getState, dispatch },
    ) => {
        if (!precomposedTransaction.prevTxid) return; // ignore if it's not a replacement tx

        const walletTransactions = selectTransactions(getState());
        const signedTransaction = selectSendSignedTx(getState());

        // find all transactions to replace, they may be related to another account
        const origTransactions = findTransactions(
            precomposedTransaction.prevTxid,
            walletTransactions,
        );

        // prepare replace actions for txs
        const actions = origTransactions.flatMap(origTx => {
            let newTx: WalletAccountTransaction;
            const affectedAccount = selectAccountByKey(getState(), origTx.key);
            if (!affectedAccount) return []; // skip, highly unlikely

            if (signedTransaction) {
                // bitcoin-like: profile transaction for affected account
                newTx = enhanceTransaction(
                    blockbookUtils.transformTransaction(
                        signedTransaction,
                        affectedAccount.addresses,
                    ),
                    affectedAccount,
                );
            } else {
                // ethereum-like: update transaction manually
                newTx = {
                    ...origTx.tx,
                    txid: newTxid,
                    fee: precomposedTransaction.fee,
                    rbf: !!precomposedTransaction.rbf,
                    blockTime: Math.round(new Date().getTime() / 1000),
                    // TODO: details: {}, is it worth it?
                };

                // update ethereumSpecific values
                newTx.ethereumSpecific = replaceEthereumSpecific(newTx, precomposedTransaction);

                // finalized and recv tx shouldn't have rbfParams
                if (!precomposedTransaction.rbf || origTx.tx.type === 'recv') {
                    delete newTx.rbfParams;
                } else {
                    // update tx rbfParams
                    newTx.rbfParams = getRbfParams(newTx, affectedAccount);
                }
            }

            return transactionsActions.replaceTransaction({
                key: origTx.key,
                txid: precomposedTransaction.prevTxid,
                tx: newTx,
            });
        });

        // dispatch all replace actions
        actions.forEach(a => dispatch(a));
    },
);

interface AddFakePendingTransactionParams {
    precomposedTransaction: PrecomposedTransactionFinal;
    account: Account;
}

export const addFakePendingTxThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/addFakePendingTransaction`,
    (
        { precomposedTransaction, account }: AddFakePendingTransactionParams,
        { dispatch, getState, rejectWithValue },
    ) => {
        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);
        const accounts = selectAccounts(getState());
        const signedTransaction = selectSendSignedTx(getState());

        if (!signedTransaction) return rejectWithValue('No signed transaction found');

        // decide affected accounts by tx.outputs
        // only 1 pending tx may be created per affected account,
        const affectedAccounts = signedTransaction.vout.reduce<{
            [affectedAccountKey: string]: Account;
        }>(
            (result, output) => {
                if (output.addresses) {
                    findAccountsByAddress(account.symbol, output.addresses[0], accounts).forEach(
                        affectedAccount => {
                            if (affectedAccount.key === account.key) return accounts;
                            if (!result[affectedAccount.key]) {
                                result[affectedAccount.key] = affectedAccount;
                            }
                        },
                    );
                }

                return result;
            },
            // sending account is always affected
            { [account.key]: account },
        );

        Object.keys(affectedAccounts).forEach(key => {
            const affectedAccount = affectedAccounts[key];
            if (!precomposedTransaction.prevTxid) {
                // create and profile pending transaction for affected account if it's not a replacement tx
                const affectedAccountTransaction = blockbookUtils.transformTransaction(
                    signedTransaction,
                    affectedAccount.addresses ?? affectedAccount.descriptor,
                );
                const prependingTx = { ...affectedAccountTransaction, deadline: blockHeight + 2 };
                dispatch(
                    transactionsActions.addTransaction({
                        transactions: [prependingTx],
                        account: affectedAccount,
                    }),
                );
            }

            if (affectedAccount.backendType === 'coinjoin') {
                // updating of coinjoin accounts is solved in coinjoinAccountActions and coinjoinMiddleware
                return;
            }

            const pendingAccount = getPendingAccount({
                account: affectedAccount,
                tx: precomposedTransaction,
                txid: signedTransaction.txid,
                receivingAccount: account.key !== affectedAccount.key,
            });

            if (pendingAccount) {
                dispatch(accountsActions.updateAccount(pendingAccount));
            }
        });
    },
);

export const addFakePendingCardanoTxThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/addFakePendingTransaction`,
    (
        {
            precomposedTransaction,
            txid,
            account,
        }: {
            precomposedTransaction: Pick<PrecomposedTransactionCardanoFinal, 'totalSpent' | 'fee'>;
            txid: string;
            account: Account;
        },
        { dispatch, getState },
    ) => {
        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);

        // Used in cardano send form and staking tab until Blockfrost supports pending txs on its backend
        // https://github.com/trezor/trezor-suite/issues/4932
        const fakeTx = {
            type: 'sent' as const,
            txid,
            blockTime: Math.floor(new Date().getTime() / 1000),
            blockHash: undefined,
            // amounts (as most of props below) don't matter much since it is temp fake anyway
            amount: precomposedTransaction.totalSpent,
            fee: precomposedTransaction.fee,
            feeRate: '0',
            totalSpent: precomposedTransaction.totalSpent,
            targets: [],
            tokens: [],
            internalTransfers: [],
            cardanoSpecific: {},
            details: {
                vin: [],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
            deadline: blockHeight + 2,
        };
        dispatch(transactionsActions.addTransaction({ transactions: [fakeTx], account }));
    },
);

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

export const fetchTransactionsThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchTransactionsThunk`,
    async (
        {
            accountKey,
            page,
            perPage,
            noLoading = false,
            recursive = false,
        }: {
            accountKey: AccountKey;
            page: number;
            perPage: number;
            noLoading?: boolean;
            recursive?: boolean;
        },
        { dispatch, getState, signal },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) return;
        if (!isTrezorConnectBackendType(account.backendType)) return; // skip unsupported backend type
        const transactions = selectTransactions(getState());
        const reducerTxs = getAccountTransactions(account.key, transactions);

        const startIndex = (page - 1) * perPage;
        const stopIndex = startIndex + perPage;
        const txsForPage = reducerTxs.slice(startIndex, stopIndex).filter(tx => !!tx.txid); // filter out "empty" values

        // we already got txs for the page in reducer
        if (
            (page > 1 && txsForPage.length === perPage) ||
            txsForPage.length === account.history.total
        ) {
            if (recursive && !signal.aborted && account.history.total) {
                const promise = dispatch(
                    fetchTransactionsThunk({
                        accountKey,
                        page: page + 1,
                        perPage,
                        noLoading,
                        recursive: true,
                    }),
                );
                signal.addEventListener('abort', () => {
                    promise.abort();
                });
                await promise;
            }

            return;
        }

        if (!noLoading && !signal.aborted) {
            dispatch(transactionsActions.fetchInit);
        }

        const { marker } = account;
        const result = await TrezorConnect.getAccountInfo({
            coin: account.symbol,
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: 'txs',
            page, // useful for every network except ripple
            pageSize: perPage,
            ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
            suppressBackupWarning: true,
        });

        if (signal.aborted) return;

        if (result && result.success) {
            // TODO why is this only accepting account now?
            const updateAction = accountsActions.updateAccount(account, result.payload);
            const updatedAccount = updateAction.payload as Account;
            const updatedTransactions = result.payload.history.transactions || [];
            const totalPages = result.payload.page?.total || 0;

            dispatch(transactionsActions.fetchSuccess);
            dispatch(
                transactionsActions.addTransaction({
                    transactions: updatedTransactions,
                    account: updatedAccount,
                    page,
                    perPage,
                }),
            );
            // updates the marker/page object for the account
            dispatch(updateAction);

            // totalPages (blockbook + blockfrost), marker (ripple) if is undefined, no more pages are available
            if (
                recursive &&
                (page < totalPages || (marker && updatedAccount.marker)) &&
                !signal.aborted
            ) {
                const promise = dispatch(
                    fetchTransactionsThunk({
                        accountKey: updatedAccount.key,
                        page: page + 1,
                        perPage,
                        noLoading,
                        recursive: true,
                    }),
                );
                signal.addEventListener('abort', () => {
                    promise.abort();
                });
                await promise;
            }
        } else {
            dispatch(
                transactionsActions.fetchError({
                    error: result ? result.payload.error : 'unknown error',
                }),
            );
        }
    },
);
