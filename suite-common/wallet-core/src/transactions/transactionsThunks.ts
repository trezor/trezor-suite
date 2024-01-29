import {
    Account,
    ExportFileType,
    PrecomposedTransactionFinal,
    TxFinalCardano,
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
} from '@suite-common/wallet-utils';
import { AccountLabels } from '@suite-common/metadata-types';
import TrezorConnect from '@trezor/connect';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import { Transaction } from '@trezor/blockchain-link-types/lib/blockbook';
import { createThunk } from '@suite-common/redux-utils';

import { accountsActions } from '../accounts/accountsActions';
import { selectTransactions } from './transactionsReducer';
import { transactionsActionsPrefix, transactionsActions } from './transactionsActions';
import { selectAccountByKey, selectAccounts } from '../accounts/accountsReducer';
import { selectBlockchainHeightBySymbol } from '../blockchain/blockchainReducer';
import { selectTokenDefinitions } from '../token-definitions/tokenDefinitionsSelectors';

/**
 * Replace existing transaction in the reducer (RBF)
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 */
interface ReplaceTransactionThunkParams {
    precomposedTx: PrecomposedTransactionFinal; // tx params signed by @trezor/connect
    newTxid: string; // new txid
    signedTransaction?: Transaction; // tx returned from @trezor/connect (only in bitcoin-like)
}

export const replaceTransactionThunk = createThunk<ReplaceTransactionThunkParams>(
    `${transactionsActionsPrefix}/replaceTransactionThunk`,
    ({ precomposedTx, newTxid, signedTransaction }, { getState, dispatch }) => {
        if (!precomposedTx.prevTxid) return; // ignore if it's not a replacement tx

        const walletTransactions = selectTransactions(getState());

        // find all transactions to replace, they may be related to another account
        const origTransactions = findTransactions(precomposedTx.prevTxid, walletTransactions);

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
                    fee: precomposedTx.fee,
                    rbf: !!precomposedTx.rbf,
                    blockTime: Math.round(new Date().getTime() / 1000),
                    // TODO: details: {}, is it worth it?
                };

                // update ethereumSpecific values
                newTx.ethereumSpecific = replaceEthereumSpecific(newTx, precomposedTx);

                // finalized and recv tx shouldn't have rbfParams
                if (!precomposedTx.rbf || origTx.tx.type === 'recv') {
                    delete newTx.rbfParams;
                } else {
                    // update tx rbfParams
                    newTx.rbfParams = getRbfParams(newTx, affectedAccount);
                }
            }

            return transactionsActions.replaceTransaction({
                key: origTx.key,
                txid: precomposedTx.prevTxid,
                tx: newTx,
            });
        });

        // dispatch all replace actions
        actions.forEach(a => dispatch(a));
    },
);

interface AddFakePendingTransactionParams {
    transaction: Transaction;
    precomposedTx: PrecomposedTransactionFinal;
    account: Account;
}

export const addFakePendingTxThunk = createThunk<AddFakePendingTransactionParams>(
    `${transactionsActionsPrefix}/addFakePendingTransaction`,
    ({ transaction, precomposedTx, account }, { dispatch, getState }) => {
        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);
        const accounts = selectAccounts(getState());

        // decide affected accounts by tx.outputs
        // only 1 pending tx may be created per affected account,
        const affectedAccounts = transaction.vout.reduce<{
            [affectedAccountKey: string]: Account;
        }>(
            (result, output) => {
                if (output.addresses) {
                    findAccountsByAddress(output.addresses[0], accounts).forEach(
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
            if (!precomposedTx.prevTxid) {
                // create and profile pending transaction for affected account if it's not a replacement tx
                const affectedAccountTransaction = blockbookUtils.transformTransaction(
                    transaction,
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
                tx: precomposedTx,
                txid: transaction.txid,
                receivingAccount: account.key !== affectedAccount.key,
            });

            if (pendingAccount) {
                dispatch(accountsActions.updateAccount(pendingAccount));
            }
        });
    },
);

export const addFakePendingCardanoTxThunk = createThunk(
    `${transactionsActionsPrefix}/addFakePendingTransaction`,
    (
        {
            precomposedTx,
            txid,
            account,
        }: {
            precomposedTx: Pick<TxFinalCardano, 'totalSpent' | 'fee'>;
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
            amount: precomposedTx.totalSpent,
            fee: precomposedTx.fee,
            feeRate: '0',
            totalSpent: precomposedTx.totalSpent,
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
    `${transactionsActionsPrefix}/exportTransactions`,
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
        const localCurrency = selectors.selectLocalCurrency(getState());
        const tokenDefinitions = selectTokenDefinitions(getState(), account.symbol);

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
        );

        // Save file
        const fileName = getExportedFileName(accountName, type);

        utils.saveAs(data, fileName);
    },
);

export const fetchTransactionsThunk = createThunk(
    `${transactionsActionsPrefix}/fetchTransactionsThunk`,
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
            if (recursive && !signal.aborted) {
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
