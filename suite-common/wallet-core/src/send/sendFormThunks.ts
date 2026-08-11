import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { type AnalyticsDep } from '@suite-common/analytics';
import { Calldata } from '@suite-common/calldata';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type ActionsFromAsyncThunk, createThunk } from '@suite-common/redux-utils';
import { type GetIsWindowVisibleDep, type OnModalCancelDep } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type ComposeActionContext,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type GetTradedAccountKeysDep,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type PrecomposedTransactionFinalCancelRbf,
    type PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    getAccountDecimals,
    getAreSatoshisUsed,
    getEvmTransactionTextSignature,
    getMevProtectedTxData,
    getPendingAccount,
    hasNetworkFeatures,
    isAllowanceUnlimited,
    isCardanoTx,
    isEvmApprovalTxByTextSignature,
    isEvmYieldTxByTextSignature,
    isExchangeTradingForm,
    isRbfCancelTransaction,
    subunitsToUnits,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import TrezorConnect, { type PROTO } from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: blocked on blockchain plugin modularisation; remove this exception once Solana helpers are exposed via a public API (see #27376 deferred work)
import { getSolanaTokenDefinition } from '@trezor/connect/src/api/solana/solanaDefinitions';
import { asCoinSymbol } from '@trezor/connect-common';
import { type Ok, exhaustive } from '@trezor/type-utils';
import { BigNumber, cloneObject, typedObjectEntries } from '@trezor/utils';

import { sendFormActions } from './sendFormActions';
import {
    composeBitcoinTransactionFeeLevelsThunk,
    signBitcoinSendFormTransactionThunk,
} from './sendFormBitcoinThunks';
import {
    composeCardanoTransactionFeeLevelsThunk,
    signCardanoSendFormTransactionThunk,
} from './sendFormCardanoThunks';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    composeEthereumTransactionFeeLevelsThunk,
    signEthereumSendFormTransactionThunk,
} from './sendFormEthereumThunks';
import { type SendRootState } from './sendFormReducer';
import {
    composeRippleStellarTransactionFeeLevelsThunk,
    signRippleStellarSendFormTransactionThunk,
} from './sendFormRippleStellarThunks';
import {
    selectPrecomposedSendForm,
    selectResolvedEthereumNonce,
    selectSendFormDrafts,
    selectSendPrecomposedTx,
    selectSendSerializedTx,
} from './sendFormSelectors';
import {
    composeSolanaTransactionFeeLevelsThunk,
    signSolanaSendFormTransactionThunk,
} from './sendFormSolanaThunks';
import {
    type ComposeFeeLevelsError,
    type PushTransactionError,
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from './sendFormTypes';
import { accountsActions } from '../accounts/accountsActions';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { type BlockchainRootState } from '../blockchain/blockchainReducer';
import {
    type SyncAccountsWithBlockchainThunkState,
    syncAccountsWithBlockchainThunk,
} from '../blockchain/blockchainThunks';
import { type FeesRootState } from '../fees/feesReducer';
import {
    type WalletSettingsRootState,
    selectAreSatsAmountUnit,
    selectBitcoinAmountUnit,
    selectIsNetworkReserveEnabled,
} from '../settings/walletSettingsReducer';
import { transactionsActions } from '../transactions/transactionsActions';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import {
    addFakePendingCardanoTxThunk,
    addFakePendingEvmTxThunk,
    addFakePendingTxThunk,
} from '../transactions/transactionsThunks';
import {
    composeTronTransactionFeeLevelsThunk,
    signTronSendFormTransactionThunk,
} from './tron/sendFormTronThunks';

type ConvertSendFormDraftsBtcAmountUnitsThunkState = AccountsRootState &
    SendRootState &
    WalletSettingsRootState;
type ConvertSendFormDraftsBtcAmountUnitsThunkParams = {
    selectedAccountKey?: AccountKey;
    isOnSendPage?: boolean;
};

export const convertSendFormDraftsBtcAmountUnitsThunk = createThunk<
    void,
    ConvertSendFormDraftsBtcAmountUnitsThunkParams,
    { state: ConvertSendFormDraftsBtcAmountUnitsThunkState }
>(
    `${SEND_MODULE_PREFIX}/convertSendFormDraftsBtcAmountUnitsThunk`,
    ({ selectedAccountKey, isOnSendPage }, { dispatch, getState, rejectWithValue }) => {
        const sendFormDrafts = selectSendFormDrafts(getState());
        const areSatsAmountUnit = selectAreSatsAmountUnit(getState());

        const draftEntries = typedObjectEntries(sendFormDrafts);

        if (G.isNullable(selectedAccountKey)) {
            return rejectWithValue('Account not found.');
        }

        draftEntries.forEach(([accountKey, draft]) => {
            // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
            const relatedAccount = selectAccountByKey(getState(), accountKey as AccountKey);

            const isSelectedAccount = selectedAccountKey === accountKey;

            if ((isSelectedAccount && isOnSendPage) || !relatedAccount) {
                return;
            }

            const areSatsSupported = hasNetworkFeatures(relatedAccount, 'amount-unit');

            const amountFormatter =
                areSatsAmountUnit && areSatsSupported
                    ? convertAmountUnitsToSubunits
                    : convertAmountSubunitsToUnits;

            const updatedDraft = cloneObject(draft);
            const amountDecimals = getAccountDecimals(relatedAccount.symbol);

            updatedDraft.outputs.forEach(output => {
                if (output.amount && areSatsSupported) {
                    output.amount = amountFormatter(output.amount, amountDecimals);
                }
            });

            dispatch(
                sendFormActions.storeDraft({
                    // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
                    accountKey: accountKey as AccountKey,
                    formState: updatedDraft,
                }),
            );
        });
    },
);

type CoinSpecificComposeResponse = ActionsFromAsyncThunk<
    | typeof composeBitcoinTransactionFeeLevelsThunk
    | typeof composeEthereumTransactionFeeLevelsThunk
    | typeof composeCardanoTransactionFeeLevelsThunk
    | typeof composeSolanaTransactionFeeLevelsThunk
    | typeof composeTronTransactionFeeLevelsThunk
>;
type ComposeSendFormTransactionFeeLevelsThunkState = BlockchainRootState &
    DeviceRootState &
    WalletSettingsRootState;

export const composeSendFormTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels | PrecomposedLevelsCardano,
    { formState: FormState; composeContext: ComposeActionContext },
    {
        rejectValue: ComposeFeeLevelsError;
        state: ComposeSendFormTransactionFeeLevelsThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/composeSendFormTransactionThunk`,
    async ({ formState, composeContext }, { getState, dispatch, rejectWithValue }) => {
        const { account } = composeContext;
        let response: CoinSpecificComposeResponse | undefined;
        const isNetworkReserveEnabled = selectIsNetworkReserveEnabled(getState());

        const { networkType } = account;

        if (networkType === 'bitcoin') {
            response = await dispatch(
                composeBitcoinTransactionFeeLevelsThunk({
                    formState,
                    composeContext,
                }),
            );
        } else if (networkType === 'ethereum') {
            response = await dispatch(
                composeEthereumTransactionFeeLevelsThunk({
                    formState,
                    composeContext,
                    isNetworkReserveEnabled,
                }),
            );
        } else if (networkType === 'ripple' || networkType == 'stellar') {
            response = await dispatch(
                composeRippleStellarTransactionFeeLevelsThunk({
                    formState,
                    composeContext,
                }),
            );
        } else if (networkType === 'cardano') {
            response = await dispatch(
                composeCardanoTransactionFeeLevelsThunk({ formState, composeContext }),
            );
        } else if (networkType === 'solana') {
            response = await dispatch(
                composeSolanaTransactionFeeLevelsThunk({
                    formState,
                    composeContext,
                    isNetworkReserveEnabled,
                }),
            );
        } else if (networkType === 'tron') {
            response = await dispatch(
                composeTronTransactionFeeLevelsThunk({ formState, composeContext }),
            );
        } else {
            return exhaustive(networkType);
        }

        if (isRejected(response) || !response?.payload) {
            return rejectWithValue(
                response?.payload ?? {
                    error: 'fee-levels-compose-failed',
                    message: isRejected(response) ? response.error.message : undefined,
                },
            );
        }

        return response.payload;
    },
);

export type CancelSignSendFormTransactionThunkDeps = {
    actions: OnModalCancelDep;
};
export type CancelSignSendFormTransactionThunkState = SendRootState;

export const cancelSignSendFormTransactionThunk = createThunk<
    void,
    void,
    {
        state: CancelSignSendFormTransactionThunkState;
        extra: CancelSignSendFormTransactionThunkDeps;
        rejectValue: string;
    }
>(
    `${SEND_MODULE_PREFIX}/cancelSignSendFormTransactionThunk`,
    (_, { dispatch, getState, extra, rejectWithValue }) => {
        const {
            actions: { onModalCancel },
        } = extra;
        const serializedTx = selectSendSerializedTx(getState());
        dispatch(sendFormActions.discardTransaction());
        // if transaction is not signed yet interrupt signing in TrezorConnect
        if (!serializedTx) {
            TrezorConnect.cancel({ reason: 'tx-cancelled' });

            return;
        }
        // otherwise just close modal
        dispatch(onModalCancel());

        return rejectWithValue('No active signing process found.');
    },
);

type SynchronizeSentTransactionThunkParams = {
    selectedAccount: Account;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    precomposedForm?: FormState;
    txid: string;
    // The nonce the EVM tx was actually signed with. Forwarded to the fake pending tx so it
    // shows the true nonce instead of a value re-derived from the pending-inclusive
    // account.misc.nonce (which reads one too high until the backend picks up the real tx).
    ethereumNonce?: string;
};
export type SynchronizeSentTransactionThunkState = FeesRootState &
    SendRootState &
    SyncAccountsWithBlockchainThunkState;
export type SynchronizeSentTransactionThunkDeps = {
    services: AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep;
};

export const synchronizeSentTransactionThunk = createThunk<
    void,
    SynchronizeSentTransactionThunkParams,
    {
        state: SynchronizeSentTransactionThunkState;
        extra: SynchronizeSentTransactionThunkDeps;
    }
>(
    `${SEND_MODULE_PREFIX}/synchronizePendingTransactionsThunk`,
    (
        { selectedAccount, precomposedTransaction, precomposedForm, txid, ethereumNonce },
        { dispatch },
    ) => {
        // notification from the backend may be delayed.
        // modify affected account balance.
        if (isCardanoTx(selectedAccount, precomposedTransaction)) {
            const pendingAccount = getPendingAccount({
                account: selectedAccount,
                tx: precomposedTransaction,
                txid,
            });
            if (pendingAccount) {
                // manually add fake pending tx as we don't have the data about mempool txs
                dispatch(
                    addFakePendingCardanoTxThunk({
                        precomposedTransaction,
                        txid,
                        account: selectedAccount,
                    }),
                );
                dispatch(accountsActions.updateAccount(pendingAccount));
            }
        } else if (selectedAccount.networkType === 'bitcoin') {
            dispatch(
                addFakePendingTxThunk({
                    precomposedTransaction,
                    account: selectedAccount,
                }),
            );
        } else if (selectedAccount.networkType === 'ethereum') {
            // manually add fake pending tx as we don't have the data about mempool txs
            dispatch(
                addFakePendingEvmTxThunk({
                    precomposedTransaction,
                    precomposedForm,
                    txid,
                    account: selectedAccount,
                    ethereumNonce,
                }),
            );
            dispatch(accountsActions.updateAccount(selectedAccount));

            // EVM cancel/bump: when the precomposed tx replaces a prior pending tx (identified by
            // prevTxid), evict the old tx from the store immediately. The backend notification is
            // delayed, and keeping the replaced tx visible would show the user a stale pending entry.
            // blockchainGetTransactions is called to confirm the old tx is truly gone from the
            // mempool before the local removal takes effect; its response is not awaited because we
            // dispatch removeTransaction optimistically and the backend will correct any discrepancy
            // on the next account sync.
            if ('prevTxid' in precomposedTransaction && precomposedTransaction.prevTxid) {
                const { prevTxid } = precomposedTransaction;
                void TrezorConnect.blockchainGetTransactions({
                    txs: [prevTxid],
                    coin: asCoinSymbol(selectedAccount.symbol),
                });
                dispatch(
                    transactionsActions.removeTransaction({
                        account: selectedAccount,
                        txs: [{ txid: prevTxid }],
                    }),
                );
            }
        } else {
            // there is no point in fetching account data right after tx submit
            //  as the account will update only after the tx is confirmed
            dispatch(syncAccountsWithBlockchainThunk(selectedAccount.symbol));
        }
    },
);

export type PushSendFormTransactionThunkState = SynchronizeSentTransactionThunkState;
export type PushSendFormTransactionThunkDeps = {
    actions: OnModalCancelDep;
    services: AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep;
};

export const pushSendFormTransactionThunk = createThunk<
    Ok<{ txid: string }>,
    { selectedAccount: Account; isMevProtectionEnabled: boolean },
    {
        rejectValue: PushTransactionError;
        state: PushSendFormTransactionThunkState;
        extra: PushSendFormTransactionThunkDeps;
    }
>(
    `${SEND_MODULE_PREFIX}/pushSendFormTransactionThunk`,
    async (
        { selectedAccount, isMevProtectionEnabled },
        { dispatch, getState, extra, rejectWithValue, fulfillWithValue },
    ) => {
        const {
            actions: { onModalCancel },
        } = extra;
        const precomposedForm = selectPrecomposedSendForm(getState());
        const precomposedTransaction = selectSendPrecomposedTx(getState());
        const serializedTx = selectSendSerializedTx(getState());
        const device = selectSelectedDevice(getState());
        const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());
        // Read the signed-with nonce before onModalCancel() so the fake pending tx (added in
        // synchronizeSentTransactionThunk) shows the true nonce rather than a re-derived one.
        const resolvedEthereumNonce = selectResolvedEthereumNonce(getState());

        if (!serializedTx || !precomposedTransaction)
            return rejectWithValue({
                error: 'push-transaction-failed',
                metadata: {
                    success: false,
                    error: { message: 'Transaction not found.', code: 'Failure_UnknownCode' },
                },
            });

        const txData = getMevProtectedTxData(
            serializedTx.symbol,
            serializedTx.tx,
            isMevProtectionEnabled,
        );

        const pushTxResponse = await TrezorConnect.pushTransaction({
            tx: txData,
            coin: asCoinSymbol(serializedTx.symbol),
            identity: tryGetAccountIdentity(selectedAccount),
        });

        // close modal regardless result
        dispatch(onModalCancel());

        const { token } = precomposedTransaction;
        const spentWithoutFee = !token
            ? new BigNumber(precomposedTransaction.totalSpent)
                  .minus(precomposedTransaction.fee)
                  .toString()
            : '0';

        const areSatoshisUsed = getAreSatoshisUsed(bitcoinAmountUnit, selectedAccount);
        const evmApprovalData = Calldata.evm.erc20.approve.decode(precomposedForm?.transactionData);

        if (pushTxResponse.success) {
            const { txid } = pushTxResponse.payload;

            if (evmApprovalData && token) {
                const amountString = evmApprovalData.amount.toString();
                const isInfiniteApproval = isAllowanceUnlimited({
                    amount: amountString,
                    decimals: token.decimals,
                    isSubunit: true,
                });
                const amount = subunitsToUnits({
                    value: asAmountSubunit(new BigNumber(amountString)),
                    decimals: token.decimals,
                }).toString();

                dispatch(
                    notificationsActions.addToast({
                        type: evmApprovalData.amount === 0n ? 'tx-revoked' : 'tx-approved',
                        isInfiniteApproval,
                        formattedAmount: amount,
                        token,
                        device,
                        descriptor: selectedAccount.descriptor,
                        symbol: selectedAccount.symbol,
                        txid,
                        style: { maxWidth: 'auto' },
                    }),
                );
            } else if (isExchangeTradingForm(precomposedForm?.trading)) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'tx-exchange',
                        metadata: precomposedForm.trading,
                        formattedAmount: precomposedForm.trading.send.amount,
                        device,
                        descriptor: selectedAccount.descriptor,
                        symbol: selectedAccount.symbol,
                        txid,
                        style: { maxWidth: 'auto' },
                    }),
                );
            } else {
                const amount = token
                    ? subunitsToUnits({
                          value: asAmountSubunit(new BigNumber(precomposedTransaction.totalSpent)),
                          decimals: token.decimals,
                      })
                    : null;

                // get total amount without fee OR token amount
                const formattedAmount =
                    token && amount
                        ? `${amount} ${token.symbol}`
                        : formatNetworkAmount(
                              spentWithoutFee,
                              selectedAccount.symbol,
                              true,
                              areSatoshisUsed,
                          );
                dispatch(
                    notificationsActions.addToast({
                        type: 'tx-sent',
                        formattedAmount,
                        device,
                        token,
                        descriptor: selectedAccount.descriptor,
                        symbol: selectedAccount.symbol,
                        txid,
                        style: { maxWidth: 'auto' },
                    }),
                );
            }

            dispatch(
                synchronizeSentTransactionThunk({
                    selectedAccount,
                    precomposedTransaction,
                    precomposedForm,
                    txid,
                    ethereumNonce: resolvedEthereumNonce,
                }),
            );
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: pushTxResponse.error.message,
                }),
            );
        }

        if (pushTxResponse.success) {
            return fulfillWithValue(pushTxResponse);
        }

        const isPendingConflict = pushTxResponse.error.message.includes(
            'could not replace existing tx',
        );

        return rejectWithValue({
            error: isPendingConflict
                ? 'push-transaction-pending-conflict'
                : 'push-transaction-failed',
            metadata: pushTxResponse,
        });
    },
);

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
type PushSendFormRawTransactionThunkParams = {
    tx: string;
    symbol: NetworkSymbol;
    descriptor: string;
    identity?: string;
    isMevProtectionEnabled: boolean;
};
type PushSendFormRawTransactionThunkState = DeviceRootState & SyncAccountsWithBlockchainThunkState;
type PushSendFormRawTransactionThunkDeps = {
    services: AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep;
};

export const pushSendFormRawTransactionThunk = createThunk<
    boolean,
    PushSendFormRawTransactionThunkParams,
    {
        state: PushSendFormRawTransactionThunkState;
        extra: PushSendFormRawTransactionThunkDeps;
        rejectValue: string;
    }
>(
    `${SEND_MODULE_PREFIX}/pushSendFormRawTransactionThunk`,
    async (payload, { dispatch, getState, fulfillWithValue, rejectWithValue }) => {
        const txData = getMevProtectedTxData(
            payload.symbol,
            payload.tx,
            payload.isMevProtectionEnabled,
        );

        const sentTx = await TrezorConnect.pushTransaction({
            tx: txData,
            coin: asCoinSymbol(payload.symbol),
            identity: payload.identity,
        });

        if (sentTx.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    device: selectSelectedDevice(getState()),
                    descriptor: payload.descriptor,
                    symbol: payload.symbol,
                    txid: sentTx.payload.txid,
                    style: { maxWidth: 'auto' },
                }),
            );
            dispatch(syncAccountsWithBlockchainThunk(payload.symbol));

            return fulfillWithValue(true);
        } else {
            console.warn(sentTx.error.message);

            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: sentTx.error.message,
                }),
            );

            return rejectWithValue(sentTx.error.message);
        }
    },
);

type CoinSpecificSignResponse = ActionsFromAsyncThunk<
    | typeof signBitcoinSendFormTransactionThunk
    | typeof signCardanoSendFormTransactionThunk
    | typeof signEthereumSendFormTransactionThunk
    | typeof signRippleStellarSendFormTransactionThunk
    | typeof signSolanaSendFormTransactionThunk
    | typeof signTronSendFormTransactionThunk
>;

type SignTransactionThunkParams = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano;
    selectedAccount: Account;
    paymentRequests?: PROTO.PaymentRequest[];
};
export type SignTransactionThunkState = AccountsRootState &
    DeviceRootState &
    TransactionsRootState &
    WalletSettingsRootState;

export const signTransactionThunk = createThunk<
    { serializedTx: string; signedTx?: BlockbookTransaction },
    SignTransactionThunkParams,
    {
        rejectValue: SignTransactionError | SignTransactionTimeoutError | undefined;
        state: SignTransactionThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, paymentRequests },
        { dispatch, rejectWithValue, getState },
    ) => {
        const device = selectSelectedDevice(getState());

        if (!device || precomposedTransaction?.type !== 'final')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid input data.',
            });

        let response: CoinSpecificSignResponse | undefined;

        // Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
        if (isCardanoTx(selectedAccount, precomposedTransaction)) {
            response = await dispatch(
                signCardanoSendFormTransactionThunk({
                    precomposedTransaction,
                    device,
                    selectedAccount,
                    paymentRequests,
                }),
            );
        } else {
            const { networkType } = selectedAccount;
            const thunkArguments = {
                formState,
                precomposedTransaction,
                selectedAccount,
                device,
                paymentRequests,
            };

            if (networkType === 'bitcoin') {
                response = await dispatch(signBitcoinSendFormTransactionThunk(thunkArguments));
            } else if (networkType === 'ethereum') {
                response = await dispatch(signEthereumSendFormTransactionThunk(thunkArguments));
            } else if (networkType === 'solana') {
                response = await dispatch(signSolanaSendFormTransactionThunk(thunkArguments));
            } else if (['ripple', 'stellar'].includes(networkType)) {
                response = await dispatch(
                    signRippleStellarSendFormTransactionThunk(thunkArguments),
                );
            } else if (networkType === 'tron') {
                response = await dispatch(signTronSendFormTransactionThunk(thunkArguments));
            }
        }

        if (isRejected(response) || !response?.payload) {
            // catch manual error from TransactionReviewModal
            const message = response?.payload?.message ?? 'unknown-error';
            if (message === 'tx-timeout') {
                return rejectWithValue({
                    error: 'sign-transaction-timeout',
                    message: 'Signing process timed out.',
                });
            }

            if (message === 'tx-cancelled') {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'User canceled the signing process.',
                });
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: message,
                }),
            );

            return rejectWithValue(response?.payload);
        }

        const { serializedTx } = response.payload;
        const signedTx =
            'signedTransaction' in response.payload
                ? response.payload.signedTransaction
                : undefined;

        if (response?.payload?.serializedTx)
            // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: {
                        tx: serializedTx,
                        symbol: selectedAccount.symbol,
                    },
                    signedTx,
                }),
            );

        return { serializedTx, signedTx };
    },
);

export type EnhancePrecomposedTransactionThunkState = DeviceRootState;

export const enhancePrecomposedTransactionThunk = createThunk<
    GeneralPrecomposedTransactionFinal,
    {
        transactionFormValues: FormState;
        precomposedTransaction: GeneralPrecomposedTransactionFinal;
        selectedAccount: Account;
    },
    { rejectValue: string; state: EnhancePrecomposedTransactionThunkState }
>(
    `${SEND_MODULE_PREFIX}/enhancePrecomposedTransactionThunk`,
    async (
        { transactionFormValues: formValues, precomposedTransaction, selectedAccount },
        { getState, dispatch, rejectWithValue },
    ) => {
        const device = selectSelectedDevice(getState());
        const selectedAccountNetwork = getNetwork(selectedAccount.symbol);
        if (!device) return rejectWithValue('Device not found');

        // native RBF is available since FW 1.9.4/2.3.5
        const nativeRbfAvailable =
            selectedAccount.networkType === 'bitcoin' &&
            formValues.rbfParams &&
            !device.unavailableCapabilities?.replaceTransaction;
        // decrease output is available since FW 1.10.0/2.4.0
        const decreaseOutputAvailable =
            selectedAccount.networkType === 'bitcoin' &&
            formValues.rbfParams &&
            !device.unavailableCapabilities?.decreaseOutput;

        const hasDecreasedOutput =
            formValues.rbfParams && typeof formValues.setMaxOutputId === 'number';
        // in case where native RBF is NOT available fallback to "legacy" way of signing (regular signing):
        // - do not enhance inputs/outputs in signFormBitcoinActions
        // - do not display "rbf mode" in TransactionReviewModal
        const useNativeRbf =
            (!hasDecreasedOutput && nativeRbfAvailable) ||
            (hasDecreasedOutput && decreaseOutputAvailable);

        const createRbfEnhancedTransaction = (): GeneralPrecomposedTransactionFinal => {
            if (!isCardanoTx(selectedAccount, precomposedTransaction) && formValues.rbfParams) {
                // A cancel (zero-value replace) tx is already tagged rbfType: 'cancel' by its own
                // compose step (e.g. useEthereumCancelTxCompose) — preserve that instead of always
                // relabeling as 'bump-fee', which mislabels the review modal/analytics for cancels.
                if (isRbfCancelTransaction(precomposedTransaction)) {
                    const enhancedCancelPrecomposedTx: PrecomposedTransactionFinalCancelRbf = {
                        ...precomposedTransaction,
                        rbfType: 'cancel',
                        prevTxid: formValues.rbfParams.txid,
                    };

                    return enhancedCancelPrecomposedTx;
                }

                const enhancedRbfPrecomposedTx: PrecomposedTransactionFinalBumpFeeRbf = {
                    ...precomposedTransaction,
                    rbfType: 'bump-fee',
                    prevTxid: formValues.rbfParams.txid,
                    feeDifference: new BigNumber(precomposedTransaction.fee)
                        .minus(
                            formValues.rbfParams.type === 'bitcoin'
                                ? formValues.rbfParams.baseFee
                                : 0,
                        )
                        .toFixed(),
                    useNativeRbf: !!useNativeRbf,
                    useDecreaseOutput: !!hasDecreasedOutput,
                };

                return enhancedRbfPrecomposedTx;
            }

            return precomposedTransaction;
        };

        let enhancedPrecomposedTransaction = createRbfEnhancedTransaction();

        // Contract calldata (e.g. DEX swap) must not carry `token` on the precomposed object:
        // signing uses prepareEthereumTransaction, which would replace calldata with an ERC-20
        // transfer if `token` is set.
        const sig = getEvmTransactionTextSignature(formValues.transactionData);
        if (
            selectedAccount.networkType === 'ethereum' &&
            formValues.transactionData &&
            !isEvmApprovalTxByTextSignature(sig) &&
            !isEvmYieldTxByTextSignature(sig)
        ) {
            enhancedPrecomposedTransaction = cloneObject(enhancedPrecomposedTransaction);
            delete (enhancedPrecomposedTransaction as { token?: unknown }).token;
        }

        let isTokenKnown;
        if (
            !isCardanoTx(selectedAccount, enhancedPrecomposedTransaction) &&
            selectedAccount.networkType === 'ethereum' &&
            enhancedPrecomposedTransaction.token?.contract &&
            selectedAccountNetwork.chainId
        ) {
            isTokenKnown = await fetch(
                `https://data.trezor.io/firmware/definitions/eth/chain-id/${
                    selectedAccountNetwork.chainId
                }/token-${enhancedPrecomposedTransaction.token.contract.substring(2).toLowerCase()}.dat`,
                { method: 'HEAD' },
            )
                .then(response => response.ok)
                .catch(() => false);
        }

        if (
            selectedAccount.networkType === 'solana' &&
            enhancedPrecomposedTransaction.token?.contract
        ) {
            const tokenDefinition = await getSolanaTokenDefinition({
                mintAddress: enhancedPrecomposedTransaction.token.contract,
            });

            isTokenKnown = !!tokenDefinition;
        }

        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: formValues,
                precomposedTransaction: {
                    ...enhancedPrecomposedTransaction,
                    createdTimestamp: new Date().getTime(),
                    isTokenKnown,
                },
                accountKey: selectedAccount.key,
            }),
        );

        return enhancedPrecomposedTransaction;
    },
);
