import { createSingleInstanceThunk, createThunk } from '@suite-common/redux-utils';
import {
    Account,
    AccountKey,
    PrecomposedTransactionCardanoFinal,
    PrecomposedTransactionFinal,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    enhanceTransaction,
    findAccountsByAddress,
    findTransactions,
    getPendingAccount,
    getRbfParams,
    isTrezorConnectBackendType,
    replaceEthereumSpecific,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { getTxsPerPage } from '@suite-common/suite-utils';

import { accountsActions } from '../accounts/accountsActions';
import { selectAccountByKey, selectAccounts } from '../accounts/accountsReducer';
import { selectBlockchainHeightBySymbol } from '../blockchain/blockchainReducer';
import { selectSendSignedTx } from '../send/sendFormReducer';
import { TRANSACTIONS_MODULE_PREFIX, transactionsActions } from './transactionsActions';
import {
    selectAccountTransactionsWithNulls,
    selectAreAllAccountTransactionsLoaded,
    selectTransactions,
} from './transactionsReducer';

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

/**
 * @param noLoading - disable loading indicator
 * @param forceRefetch - force refetch of transactions even if this page is already fetched
 */
type FetchTransactionsPageThunkParams = {
    accountKey: AccountKey;
    page: number;
    perPage: number;
    noLoading?: boolean;
    forceRefetch?: boolean;
};

export const fetchTransactionsPageThunk = createThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchTransactionsPageThunk`,
    async (
        { accountKey, page, perPage, forceRefetch }: FetchTransactionsPageThunkParams,
        { dispatch, getState },
    ) => {
        // console.log('fetchTransactionsPageThunk', accountKey, page, perPage, forceRefetch);
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            throw new Error(`Account not found: ${accountKey}`);
        }
        if (!isTrezorConnectBackendType(account.backendType)) {
            throw new Error(`Unsupported backend type: ${account.backendType}`);
        }

        const transactions = selectAccountTransactionsWithNulls(getState(), account.key); // get all transactions including "null" values because of pagination
        const startIndex = (page - 1) * perPage;
        const stopIndex = startIndex + perPage;
        const txsForPage = transactions.slice(startIndex, stopIndex).filter(tx => !!tx.txid); // filter out "empty" values
        // always fetch first page because there might be new transactions
        const isFirstPage = page === 1;
        const isPageAlreadyFetched = txsForPage.length === perPage;

        if (isPageAlreadyFetched && !isFirstPage && !forceRefetch) {
            return 'ALREADY_FETCHED' as const;
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

        if (result && result.success) {
            const updateAction = accountsActions.updateAccount(account, result.payload);
            const updatedAccount = updateAction.payload;
            const updatedTransactions = result.payload.history.transactions || [];

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

            return result.payload;
        } else {
            const error = result ? result.payload.error : 'unknown error';

            throw new Error(error);
        }
    },
);

/**
 * @param noLoading - disable loading indicator, it's not used directly in this thunk, but it's used in reducer
 */
type FetchAllTransactionsForAccountThunkParams = {
    accountKey: AccountKey;
    noLoading?: boolean;
};
export const fetchAllTransactionsForAccountThunk = createSingleInstanceThunk(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchAllTransactionsForAccount`,
    async (
        { accountKey }: FetchAllTransactionsForAccountThunkParams,
        { dispatch, getState, signal },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            throw new Error(`Account not found: ${accountKey}`);
        }

        // If all transactions are already loaded, it means we can do some optimization (fetch only first few pages, less transactions per page etc.)
        // to just check for that few new transactions.
        const areAllTransactionsAlreadyFetched = selectAreAllAccountTransactionsLoaded(
            getState(),
            accountKey,
        );

        let page = 1;
        // marker is used instead of page for ripple (cursor based pagination)
        let marker: AccountInfo['marker'] | undefined;
        let totalPages = 0;
        let forceRefetch = false;
        const perPage = areAllTransactionsAlreadyFetched ? 5 : getTxsPerPage(account.networkType);

        while (true) {
            const result = await dispatch(
                fetchTransactionsPageThunk({
                    accountKey,
                    page,
                    perPage,
                    // Loading here MUST be always disabled, because loading is handled by this thunk a not by fetchTransactionsPageThunk
                    noLoading: true,
                    forceRefetch,
                    ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
                }),
            ).unwrap();

            if (signal.aborted) {
                throw new Error('Aborted');
            }

            if (result === 'ALREADY_FETCHED') {
                if (areAllTransactionsAlreadyFetched) {
                    // If we previously fetched all transactions, we are now quite sure that we have all new transactions fetched.
                    break;
                } else if (account.backendType === 'ripple') {
                    // This is special edge case for ripple that could only happen when there was some random interruption during fetching of XRP transactions
                    // In that we need to fetch all transactions again, because we don't know if we fetched all transactions and can't skip to the next page because of the marker.
                    forceRefetch = true;
                    continue;
                } else {
                    // We still need to check remaining pages because we never fetched all transactions before,
                    // so it is possible that someone fetched just some random pages before.
                    page += 1;
                    continue;
                }
            }

            totalPages = result.page?.total || totalPages;
            const areThereMorePages = page < totalPages || !!result.marker;

            if (!areThereMorePages) {
                break;
            }

            marker = result.marker;
            page += 1;
        }
    },
);
