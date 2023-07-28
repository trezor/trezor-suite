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
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import { Transaction } from '@trezor/blockchain-link-types/lib/blockbook';
import { createThunk } from '@suite-common/redux-utils';

import { accountsActions } from '../accounts/accountsActions';
import { selectTransactions } from './transactionsReducer';
import { transactionsActions, modulePrefix } from './transactionsActions';
import { selectAccountByKey, selectAccounts } from '../accounts/accountsReducer';
import { selectBlockchainHeightBySymbol } from '../blockchain/blockchainReducer';

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
    `${modulePrefix}/replaceTransactionThunk`,
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
                        affectedAccount.descriptor,
                        affectedAccount.addresses,
                        signedTransaction,
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

export const addFakePendingTxThunk = createThunk(
    `${modulePrefix}/addFakePendingTransaction`,
    (
        {
            transaction,
            precomposedTx,
            account,
        }: {
            transaction: Transaction;
            precomposedTx: PrecomposedTransactionFinal;
            account: Account;
        },
        { dispatch, getState },
    ) => {
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
            // profile pending transaction for this affected account
            const affectedAccountTransaction = blockbookUtils.transformTransaction(
                affectedAccount.descriptor,
                affectedAccount.addresses,
                transaction,
            );
            const prependingTx = { ...affectedAccountTransaction, deadline: blockHeight + 2 };
            dispatch(
                transactionsActions.addTransaction({
                    transactions: [prependingTx],
                    account: affectedAccount,
                }),
            );
            if (affectedAccount.backendType === 'coinjoin') {
                // updating of coinjoin accounts is solved in coinjoinAccoundActions and coinjoinMiddleware
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
    `${modulePrefix}/addFakePendingTransaction`,
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
            cardanoSpecific: {
                subtype: null,
            },
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
    `${modulePrefix}/exportTransactions`,
    async (
        {
            account,
            accountName,
            type,
        }: {
            account: Account;
            accountName: string;
            type: ExportFileType;
        },
        { getState, extra },
    ) => {
        const { utils, selectors } = extra;
        // Get state of transactions
        const allTransactions = selectTransactions(getState());
        const localCurrency = selectors.selectLocalCurrency(getState());
        const transactions = getAccountTransactions(
            account.key,
            allTransactions,
            // add metadata directly to transactions
        )
            .filter(transaction => transaction.blockHeight !== -1)
            .map(transaction => ({
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
            localCurrency,
        });

        // Save file
        const fileName = getExportedFileName(accountName, type);

        utils.saveAs(data, fileName);
    },
);

export const fetchTransactionsThunk = createThunk(
    `${modulePrefix}/fetchTransactionsThunk`,
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
