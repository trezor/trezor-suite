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
    getPendingReceivingAccount,
    getUtxoOutpoint,
    getAccountAddresses,
    findAccountsByAddress,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import type { Address } from '@trezor/blockchain-link-types';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import { createThunk } from '@suite-common/redux-utils';
import {
    TxInputType2VinVout,
    TxOutputType2VinVout,
    PrecomposedTransactionFinal2Transaction,
} from '@trezor/conversions-blockchainlink-connect';
import { getSerializedPath } from '@trezor/crypto-utils';

import { accountsActions } from '../accounts/accountsActions';
import { selectTransactions } from './transactionsReducer';
import { transactionsActions, modulePrefix } from './transactionsActions';
import { selectAccountByKey, selectAccounts } from '../accounts/accountsReducer';
import { selectBlockchainHeightBySymbol } from '../blockchain/blockchainReducer';

/**
 * Replace existing transaction in the reducer.
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 */
export const replaceTransactionThunk = createThunk(
    `${modulePrefix}/replaceTransactionThunk`,
    (
        {
            tx,
            newTxid,
        }: {
            tx: PrecomposedTransactionFinal;
            newTxid: string;
        },
        { getState, dispatch },
    ) => {
        if (!tx.prevTxid) return; // ignore if it's not replacement tx

        const walletTransactions = selectTransactions(getState());

        // find all transactions to replace, they may be related to another account
        const transactions = findTransactions(tx.prevTxid, walletTransactions);
        const newBaseFee = parseInt(tx.fee, 10);

        // prepare replace actions for txs
        const actions = transactions.map(t => {
            // type: transactionsActions.replaceTransaction.type,
            const payload: { key: string; txid: string; tx: WalletAccountTransaction } = {
                key: t.key,
                txid: tx.prevTxid,
                tx: {
                    ...t.tx,
                    txid: newTxid,
                    fee: tx.fee,
                    rbf: !!tx.rbf,
                    blockTime: Math.round(new Date().getTime() / 1000),
                    // TODO: details: {}, is it worth it?
                },
            };
            // finalized and recv tx shouldn't have rbfParams
            if (!tx.rbf || t.tx.type === 'recv') {
                delete payload.tx.rbfParams;
                return transactionsActions.replaceTransaction(payload);
            }

            if (payload.tx.type === 'self') {
                payload.tx.amount = tx.fee;
            }
            // update tx rbfParams
            if (payload.tx.rbfParams) {
                payload.tx.rbfParams = {
                    ...payload.tx.rbfParams,
                    txid: newTxid,
                    baseFee: newBaseFee,
                    feeRate: tx.feePerByte,
                };
            }
            return transactionsActions.replaceTransaction(payload);
        });
        // dispatch replace actions
        actions.forEach(a => dispatch(a));
    },
);

export const addFakePendingTxThunk = createThunk(
    `${modulePrefix}/addFakePendingTransaction`,
    (
        {
            transaction,
            txid,
            account,
        }: {
            transaction: PrecomposedTransactionFinal;
            txid: string;
            account: Account;
        },
        { dispatch, getState },
    ) => {
        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);
        const accounts = selectAccounts(getState());
        const allAddresses = accounts.reduce<Address[]>(
            (accumulator, a) => [...accumulator, ...getAccountAddresses(a)],
            [],
        );

        const utxos = accounts.reduce<NonNullable<Account['utxo']>>(
            (accumulator, a) => [...accumulator, ...(a.utxo || [])],
            [],
        );

        const blockbookTransaction = PrecomposedTransactionFinal2Transaction(transaction, {
            txid,
            value: transaction.totalSpent,
            vin: transaction.transaction.inputs
                .filter(input => input.amount !== '0')
                .map(input =>
                    TxInputType2VinVout(input, {
                        // todo: consider removing this callback style and pass utxo set directly. but this would require
                        // importing getUtxoOutpoint inside conversions package. which is probably ok if we move
                        // getUtxoOutpoint from @suite-common/wallet-utils to @trezor/crypto-utils
                        getAddresses: i =>
                            utxos
                                .filter(
                                    utxo =>
                                        getUtxoOutpoint(utxo) ===
                                        getUtxoOutpoint({
                                            txid: i.prev_hash,
                                            vout: i.prev_index,
                                        }),
                                )
                                .map(utxo => utxo.address),
                    }),
                ),
            vout: transaction.transaction.outputs.map((output, index) =>
                TxOutputType2VinVout(output, {
                    getAddresses: o => [
                        o.address
                            ? o.address
                            : allAddresses.find(
                                  address => getSerializedPath(o.address_n!) === address.path,
                              )?.address || '',
                    ],
                    // todo: index is probably not correct
                    n: index,
                }),
            ),
            // and some made up data that should not matter
            blockHeight: 0,
            blockTime: Math.floor(new Date().getTime() / 1000),
            confirmations: 0,
            fees: '0',
            hex: '0',
            valueIn: '0',
            blockHash: '',
        });

        // todo: this part (updating sending account), could well be part of forEach lower, but there is a fixture
        // in useSendForm.test ("Success with: custom fee, 2 outputs, 0 utxo (ignored)")
        // that won't pass in that case and I did not want to change that
        const pendingAccount = getPendingAccount(account, transaction, txid);
        if (pendingAccount) {
            dispatch(accountsActions.updateAccount(pendingAccount));
            const accountTransaction = blockbookUtils.transformTransaction(
                account.descriptor,
                account.addresses,
                blockbookTransaction,
            );
            const prependingTx = { ...accountTransaction, deadline: blockHeight + 2 };
            dispatch(
                transactionsActions.addTransaction({
                    transactions: [prependingTx],
                    account,
                }),
            );
        }

        // only 1 fake tx may be created per affected account,
        const affectedAccounts = blockbookTransaction.vout.reduce<{
            [affectedAccountKey: string]: Account;
        }>((result, output) => {
            if (output.addresses) {
                // todo: reduce addresses
                findAccountsByAddress(output.addresses[0], accounts).forEach(affectedAccount => {
                    // sending account is always affected and is solved above
                    if (affectedAccount.key === account.key) return accounts;
                    if (!result[affectedAccount.key]) {
                        result[affectedAccount.key] = affectedAccount;
                    }
                });
            }
            // output.address_n -> change -> ignore
            return result;
        }, {});

        Object.keys(affectedAccounts).forEach(key => {
            const affectedAccount = affectedAccounts[key];
            const accountTransaction = blockbookUtils.transformTransaction(
                affectedAccount.descriptor,
                affectedAccount.addresses,
                blockbookTransaction,
            );
            const prependingTx = { ...accountTransaction, deadline: blockHeight + 2 };
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
            const pendingReceivingAccount = getPendingReceivingAccount(
                affectedAccount,
                transaction,
            );
            if (pendingReceivingAccount) {
                dispatch(accountsActions.updateAccount(pendingReceivingAccount));
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
            totalSpent: precomposedTx.totalSpent,
            feeRate: '0',
            targets: [],
            tokens: [],
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
