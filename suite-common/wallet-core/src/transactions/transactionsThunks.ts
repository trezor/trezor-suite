import { createSingleInstanceThunk, createThunk } from '@suite-common/redux-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type Account,
    type AccountKey,
    type FormState,
    type PrecomposedTransactionCardanoFinal,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type Timestamp,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    enhanceTransaction,
    ensureHexPrefix,
    findAccountsByAddress,
    findTransactions,
    fromGwei,
    getEvmTransactionTextSignature,
    getPendingAccount,
    getRbfParams,
    isEip1559,
    isEvmYieldTxByTextSignature,
    isRbfBumpFeeTransaction,
    isTrezorConnectBackendType,
    replaceEthereumSpecific,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import TrezorConnect, {
    type AccountInfo,
    type AccountTransaction,
    type TokenTransfer,
} from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- temporary diagnostic
import { __btcUnknownTxDebug__ } from '@trezor/connect/src/utils/pathUtils';
import { asCoinSymbol } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

import { TRANSACTIONS_MODULE_PREFIX, transactionsActions } from './transactionsActions';
import { type TransactionsRootState } from './transactionsReducerTypes';
import {
    selectAccountTransactions,
    selectAccountTransactionsFromNowUntilTimestamp,
    selectAreAllAccountTransactionsLoaded,
    selectAreAllAccountTransactionsLoadedFromNowUntilTimestamp,
    selectIsPageAlreadyFetched,
    selectTransactions,
} from './transactionsSelectors';
import { accountsActions } from '../accounts/accountsActions';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey, selectAccounts } from '../accounts/accountsSelectors';
import {
    type BlockchainRootState,
    selectBlockchainHeightBySymbol,
    selectGapLimit,
} from '../blockchain/blockchainReducer';
import { type FeesRootState, selectRawNetworkFeeInfo } from '../fees/feesReducer';
import { ethereumGetCurrentNonceThunk } from '../send/sendFormEthereumThunks';
import { type SendRootState } from '../send/sendFormReducer';
import { selectSendSignedTx } from '../send/sendFormSelectors';

/**
 * Replace existing transaction in the reducer (RBF)
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 */
interface ReplaceTransactionThunkParams {
    // transaction input parameters. It has to be passed as argument rather than obtained form send-form state, because this thunk is used also by eth-staking module that uses different redux state.
    precomposedTransaction: PrecomposedTransactionFinalBumpFeeRbf;
    newTxid: string;
}
export type ReplaceTransactionThunkState = AccountsRootState &
    SendRootState &
    TransactionsRootState;

export const replaceTransactionThunk = createThunk<
    void,
    ReplaceTransactionThunkParams,
    {
        state: ReplaceTransactionThunkState;
    }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/replaceTransactionThunk`,
    ({ precomposedTransaction, newTxid }, { getState, dispatch }) => {
        if (!isRbfBumpFeeTransaction(precomposedTransaction)) return; // ignore if it's not a replacement tx

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
                    blockTime: Math.round(new Date().getTime() / 1000),
                    // TODO: details: {}, is it worth it?
                };

                // update ethereumSpecific values
                newTx.ethereumSpecific = replaceEthereumSpecific(newTx, precomposedTransaction);

                // finalized and recv tx shouldn't have rbfParams
                if (origTx.tx.type === 'recv') {
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
type AddFakePendingTxThunkState = AccountsRootState & BlockchainRootState & SendRootState;

export const addFakePendingTxThunk = createThunk<
    void,
    AddFakePendingTransactionParams,
    { state: AddFakePendingTxThunkState }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/addFakePendingTransaction`,
    ({ precomposedTransaction, account }, { dispatch, getState, rejectWithValue }) => {
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
                    const { addresses } = output;
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const firstAddress: string = addresses[0];
                    findAccountsByAddress(account.symbol, firstAddress, accounts).forEach(
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
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const affectedAccount: Account = affectedAccounts[key];
            if (!isRbfBumpFeeTransaction(precomposedTransaction)) {
                // create and profile pending transaction for affected account if it's not a replacement tx
                const affectedAccountTransaction = blockbookUtils.transformTransaction(
                    signedTransaction,
                    affectedAccount.addresses ?? affectedAccount.descriptor,
                );
                if (affectedAccountTransaction.type === 'unknown') {
                    __btcUnknownTxDebug__(
                        'addFakePendingTxThunk',
                        precomposedTransaction.inputs,
                        affectedAccount.addresses,
                    );
                }
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

const buildFakePendingEvmTx = ({
    precomposedTransaction,
    precomposedForm,
    txid,
    account,
    nonce,
    blockHeight,
    deadline,
    token,
}: {
    precomposedTransaction: PrecomposedTransactionFinal;
    precomposedForm: FormState;
    txid: string;
    account: Account;
    nonce: string;
    blockHeight: number;
    deadline: number;
    token?: TokenInfo;
}): AccountTransaction & Partial<WalletAccountTransaction> => {
    const { outputs: precomposedOutputs } = precomposedTransaction;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const output: (typeof precomposedOutputs)[number] = precomposedOutputs[0];
    const fromAddress = account.descriptor;
    const toAddress = output.address!;
    const amount = output.amount.toString();
    const isLegacyTx = !isEip1559(precomposedTransaction);

    const blockTime = Math.floor(Date.now() / 1000);
    const common = {
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        type: 'sent' as const,
        txid,
        blockTime,
        blockHash: undefined,
        deadline: blockHeight + deadline,
        fee: precomposedTransaction.fee,
        rbf: false,
        internalTransfers: [],
        ethereumSpecific: {
            status: -1,
            nonce: parseInt(nonce),
            gasLimit: parseInt(precomposedTransaction.feeLimit ?? '0'),
            gasPrice: isLegacyTx ? fromGwei(precomposedTransaction.feePerByte).toWei() : undefined,
            maxFeePerGas: isLegacyTx
                ? undefined
                : fromGwei(precomposedTransaction.maxFeePerGas ?? '0').toWei(),
            maxPriorityFeePerGas: isLegacyTx
                ? undefined
                : fromGwei(precomposedTransaction.maxPriorityFeePerGas ?? '0').toWei(),
            data: ensureHexPrefix(precomposedForm?.transactionData),
        },
        details: {
            vin: [
                {
                    n: 0,
                    addresses: [fromAddress],
                    isAddress: true,
                    isOwn: true,
                    isAccountOwned: true,
                },
            ],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: token ? '0' : amount,
        },
        // rbf not yet available for fake pending txs
        // rbfParams: getRbfParams(tx, account),
    };

    if (token) {
        const tokenTransfer: TokenTransfer = {
            type: 'sent',
            standard: token.standard,
            amount,
            from: fromAddress,
            to: toAddress,
            contract: token.contract,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            multiTokenValues: token.multiTokenValues,
        };

        const voutAddress = precomposedForm?.transactionData ? toAddress : token.contract;

        return {
            ...common,
            amount: '0',
            targets: [],
            tokens: [tokenTransfer],
            details: {
                ...common.details,
                vout: [
                    {
                        value: '0',
                        n: 0,
                        addresses: [voutAddress],
                        isAddress: true,
                    },
                ],
            },
        };
    }

    return {
        ...common,
        amount,
        targets: [
            {
                n: 0,
                addresses: [toAddress],
                isAddress: true,
                amount,
            },
        ],
        tokens: [],
        details: {
            ...common.details,
            vout: [
                {
                    value: amount,
                    n: 0,
                    addresses: [toAddress],
                    isAddress: true,
                },
            ],
        },
    };
};

type AddFakePendingEvmTxThunkParams = {
    precomposedTransaction: PrecomposedTransactionFinal;
    precomposedForm?: FormState;
    txid: string;
    account: Account;
    // The nonce the tx was actually signed with. Preferred source: re-deriving it here from
    // account.misc.nonce reads one too high while the just-broadcast tx sits in the mempool
    // but isn't yet in the local tx list — blockbook's misc.nonce is pending-inclusive
    // (trezor/blockbook#1562), so the lowestPendingNonce clamp in getEvmNonceInfo can't
    // correct it yet.
    ethereumNonce?: string;
};
type AddFakePendingEvmTxThunkState = AccountsRootState &
    BlockchainRootState &
    FeesRootState &
    TransactionsRootState;

export const addFakePendingEvmTxThunk = createThunk<
    void,
    AddFakePendingEvmTxThunkParams,
    {
        state: AddFakePendingEvmTxThunkState;
    }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/addFakePendingTransaction`,
    async (
        { precomposedTransaction, precomposedForm, txid, account, ethereumNonce },
        { dispatch, getState },
    ) => {
        if (
            account.networkType !== 'ethereum' ||
            !precomposedForm ||
            !precomposedTransaction.outputs.length
        ) {
            return;
        }

        // Prefer the nonce the tx was actually signed with. Fall back to deriving it from the
        // account's (untrusted, pending-inclusive) nonce only when the caller can't supply it. This
        // is a display-only fake pending tx rendered after the real tx was already pushed, so a
        // confirmed-nonce backend round-trip is unwarranted, and any transient mismatch self-corrects
        // once the backend picks up the real tx.
        const nonce =
            ethereumNonce ??
            (
                await dispatch(
                    ethereumGetCurrentNonceThunk({
                        selectedAccount: account,
                        fetchConfirmedNonce: false,
                    }),
                ).unwrap()
            ).nonce;

        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);
        const rawFeeInfo = selectRawNetworkFeeInfo(getState(), account.symbol);

        const FAKE_TX_TTL_SECONDS = 15 * 60; // keep fake tx for 15 minutes
        const deadline = FAKE_TX_TTL_SECONDS / rawFeeInfo!.blockTime;

        const sig = getEvmTransactionTextSignature(precomposedForm.transactionData);
        const transfersToken =
            !precomposedForm.transactionData ||
            sig === 'transfer' ||
            isEvmYieldTxByTextSignature(sig);

        const fakeTx = buildFakePendingEvmTx({
            precomposedTransaction,
            precomposedForm,
            token: transfersToken ? precomposedTransaction.token : undefined,
            txid,
            account,
            nonce,
            blockHeight,
            deadline,
        });

        dispatch(transactionsActions.addTransaction({ transactions: [fakeTx], account }));
    },
);

type AddFakePendingCardanoTxThunkParams = {
    precomposedTransaction: Pick<PrecomposedTransactionCardanoFinal, 'totalSpent' | 'fee'>;
    txid: string;
    account: Account;
    cardanoSpecific?: WalletAccountTransaction['cardanoSpecific'];
};
type AddFakePendingCardanoTxThunkState = BlockchainRootState;

export const addFakePendingCardanoTxThunk = createThunk<
    void,
    AddFakePendingCardanoTxThunkParams,
    { state: AddFakePendingCardanoTxThunkState }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/addFakePendingTransaction`,
    ({ precomposedTransaction, txid, account, cardanoSpecific }, { dispatch, getState }) => {
        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);

        // Used in cardano send form and staking tab until Blockfrost supports pending txs on its backend
        // https://github.com/trezor/trezor-suite/issues/4932
        const fakeTx = {
            type: 'sent' as const,
            txid,
            blockTime: Math.floor(new Date().getTime() / 1000),
            blockHash: undefined,
            // fee is excluded to match the amount of the confirmed tx from blockfrost
            amount: new BigNumber(precomposedTransaction.totalSpent)
                .minus(precomposedTransaction.fee)
                .toString(),
            fee: precomposedTransaction.fee,
            feeRate: '0',
            totalSpent: precomposedTransaction.totalSpent,
            targets: [],
            tokens: [],
            internalTransfers: [],
            cardanoSpecific: cardanoSpecific || {},
            details: {
                vin: [],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
            deadline: blockHeight + 10,
        };
        dispatch(transactionsActions.addTransaction({ transactions: [fakeTx], account }));
    },
);

interface AddFakePendingTronTxThunkParams {
    txid: string;
    account: Account;
    amount: string;
    fee: string;
    type: WalletAccountTransaction['type'];
    target?: { addresses: string[]; amount: string };
    tronSpecific?: WalletAccountTransaction['tronSpecific'];
}
export type AddFakePendingTronTxThunkState = BlockchainRootState & FeesRootState;

export const addFakePendingTronTxThunk = createThunk<
    void,
    AddFakePendingTronTxThunkParams,
    { state: AddFakePendingTronTxThunkState }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/addFakePendingTransaction`,
    ({ txid, account, amount, fee, type, target, tronSpecific }, { dispatch, getState }) => {
        if (account.networkType !== 'tron') return;

        const FAKE_TX_TTL_SECONDS = 15 * 60;
        const blockTime = selectRawNetworkFeeInfo(getState(), account.symbol)?.blockTime ?? 0;
        const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol) ?? 0;
        const deadline = blockHeight + Math.ceil(FAKE_TX_TTL_SECONDS / blockTime);

        const fakeTx = {
            type,
            txid,
            blockTime: Math.floor(Date.now() / 1000),
            blockHash: undefined,
            amount,
            fee,
            feeRate: undefined,
            targets: target
                ? [{ n: 0, addresses: target.addresses, isAddress: true, amount: target.amount }]
                : [],
            tokens: [],
            internalTransfers: [],
            tronSpecific,
            details: {
                vin: target
                    ? [
                          {
                              n: 0,
                              addresses: target.addresses,
                              isAddress: true,
                              isOwn: true,
                              isAccountOwned: true,
                          },
                      ]
                    : [],
                vout: target
                    ? [{ value: target.amount, n: 0, addresses: target.addresses, isAddress: true }]
                    : [],
                size: 0,
                totalInput: '0',
                totalOutput: target?.amount ?? '0',
            },
            deadline,
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
type FetchTransactionsPageThunkState = AccountsRootState &
    BlockchainRootState &
    TransactionsRootState;

export const fetchTransactionsPageThunk = createThunk<
    AccountInfo | 'ALREADY_FETCHED',
    FetchTransactionsPageThunkParams,
    {
        state: FetchTransactionsPageThunkState;
    }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchTransactionsPageThunk`,
    async ({ accountKey, page, perPage, forceRefetch }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            throw new Error(`Account not found: ${accountKey}`);
        }
        if (!isTrezorConnectBackendType(account.backendType)) {
            throw new Error(`Unsupported backend type: ${account.backendType}`);
        }

        const isFirstPage = page === 1;
        const isPageAlreadyFetched = selectIsPageAlreadyFetched(
            getState(),
            accountKey,
            page,
            perPage,
        );

        if (isPageAlreadyFetched && !isFirstPage && !forceRefetch) {
            return 'ALREADY_FETCHED' as const;
        }

        const { marker, stellarCursor } = account;
        const result = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: 'txs',
            page, // useful for every network except ripple and stellar
            pageSize: perPage,
            pageCursor: stellarCursor,
            // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
            // if back on first page, the marker is reset
            ...(marker && !isFirstPage ? { marker } : {}),
            suppressBackupWarning: true,
            protocols: account.networkType === 'ethereum' ? ['erc4626'] : undefined,
            gap:
                account.networkType === 'bitcoin'
                    ? selectGapLimit(getState(), account.symbol)
                    : undefined,
        });

        // Account might have changed during async getAccountInfo call, so we fetch current state
        const currentAccount = selectAccountByKey(getState(), accountKey);

        if (!currentAccount) {
            throw new Error(`Account not found: ${accountKey}`);
        }

        if (result?.success) {
            const updateAction = accountsActions.updateAccount(currentAccount, result.payload);
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
            const error = result ? result.error.message : 'unknown error';

            throw new Error(error);
        }
    },
);

type FetchUtxoTransactionsForAccountThunkParams = {
    accountKey: AccountKey;
};
type FetchUtxoTransactionsForAccountThunkState = AccountsRootState & TransactionsRootState;

export const fetchUtxoTransactionsForAccountThunk = createSingleInstanceThunk<
    FetchUtxoTransactionsForAccountThunkParams,
    WalletAccountTransaction[],
    { state: FetchUtxoTransactionsForAccountThunkState }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchUtxoTransactionsForAccountThunk`,
    async (
        { accountKey }: FetchUtxoTransactionsForAccountThunkParams,
        { dispatch, getState, signal },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            throw new Error(`Account not found: ${accountKey}`);
        }

        if (account.utxo === undefined || account.utxo.length === 0) {
            return selectAccountTransactions(getState(), accountKey);
        }

        const result = await TrezorConnect.blockchainGetTransactions({
            coin: asCoinSymbol(account.symbol),
            txs: account.utxo.map(utxo => utxo.txid),
            descriptor: account.descriptor,
        });

        if (signal.aborted) {
            throw new Error('Aborted');
        }

        if (!result.success) {
            throw new Error(result.error.message);
        }

        dispatch(
            transactionsActions.addTransaction({
                transactions: result.payload,
                account,
            }),
        );

        return selectAccountTransactions(getState(), accountKey);
    },
);

/**
 * @param noLoading - disable loading indicator, it's not used directly in this thunk, but it's used in reducer
 */
type FetchAllTransactionsForAccountThunkParams = {
    accountKey: AccountKey;
    noLoading?: boolean;
};
type FetchAllTransactionsForAccountThunkState = AccountsRootState &
    TransactionsRootState &
    FetchTransactionsPageThunkState;

export const fetchAllTransactionsForAccountThunk = createSingleInstanceThunk<
    FetchAllTransactionsForAccountThunkParams,
    WalletAccountTransaction[],
    { state: FetchAllTransactionsForAccountThunkState }
>(
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
            const areThereMorePages =
                page < totalPages || !!result.marker || !!result.stellarCursor;

            if (!areThereMorePages) {
                break;
            }

            marker = result.marker;
            page += 1;
        }

        return selectAccountTransactions(getState(), accountKey);
    },
);

type FetchTransactionsFromNowUntilTimestampParams = {
    accountKey: AccountKey;
    timestamp: Timestamp | null;
};
export type FetchTransactionsFromNowUntilTimestampState = AccountsRootState &
    TransactionsRootState &
    FetchAllTransactionsForAccountThunkState &
    FetchTransactionsPageThunkState;

export const fetchTransactionsFromNowUntilTimestamp = createSingleInstanceThunk<
    FetchTransactionsFromNowUntilTimestampParams,
    WalletAccountTransaction[],
    { state: FetchTransactionsFromNowUntilTimestampState }
>(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchTransactionsForAccount`,
    async ({ accountKey, timestamp }, { dispatch, getState }) => {
        if (!timestamp) {
            return dispatch(fetchAllTransactionsForAccountThunk({ accountKey })).unwrap();
        }
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) {
            throw new Error(`Account not found: ${accountKey}`);
        }

        const areTransactionsAlreadyFetched =
            selectAreAllAccountTransactionsLoadedFromNowUntilTimestamp(
                getState(),
                accountKey,
                timestamp,
            );

        if (areTransactionsAlreadyFetched) {
            return selectAccountTransactionsFromNowUntilTimestamp(
                getState(),
                accountKey,
                timestamp,
            );
        }

        let page = 1;
        let marker: AccountInfo['marker'] | undefined;
        let totalPages = 0;
        // Some reasonable number of transactions per page, that user could have in given time period.
        // If necessary this could be improved for example by checking how many transactions account has in total etc, how far in past is the timestamp etc.
        const perPage = 7;

        while (true) {
            const result = await dispatch(
                fetchTransactionsPageThunk({
                    accountKey,
                    page,
                    perPage,
                    // Loading here MUST be always disabled, because loading is handled by this thunk a not by fetchTransactionsPageThunk
                    noLoading: true,
                    ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
                }),
            ).unwrap();

            const areNowTransactionsAlreadyFetched =
                selectAreAllAccountTransactionsLoadedFromNowUntilTimestamp(
                    getState(),
                    accountKey,
                    timestamp,
                );

            if (areNowTransactionsAlreadyFetched) {
                break;
            }

            if (result === 'ALREADY_FETCHED') {
                page += 1;
                continue;
            }

            totalPages = result.page?.total || totalPages;
            const areThereMorePages = page < totalPages || !!result.marker;

            if (!areThereMorePages) {
                // This should never happen because of previous checks, but just it won't hurt to have it here as a safety net.
                break;
            }

            marker = result.marker;
            page += 1;
        }

        return selectAccountTransactionsFromNowUntilTimestamp(getState(), accountKey, timestamp);
    },
);
