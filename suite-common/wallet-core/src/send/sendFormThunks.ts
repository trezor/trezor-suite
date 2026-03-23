import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { type ActionsFromAsyncThunk, createThunk } from '@suite-common/redux-utils';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type ComposeActionContext,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    getAccountDecimals,
    getAreSatoshisUsed,
    getEvmApprovalTxData,
    getMevProtectedTxData,
    getPendingAccount,
    hasNetworkFeatures,
    isCardanoTx,
    isExchangeTradingForm,
    subunitsToUnits,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import TrezorConnect, { type PROTO } from '@trezor/connect';
import { getSolanaTokenDefinition } from '@trezor/connect/src/api/solana/solanaDefinitions';
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
import {
    composeRippleStellarTransactionFeeLevelsThunk,
    signRippleStellarSendFormTransactionThunk,
} from './sendFormRippleStellarThunks';
import {
    selectPrecomposedSendForm,
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
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { syncAccountsWithBlockchainThunk } from '../blockchain/blockchainThunks';
import {
    selectAreSatsAmountUnit,
    selectBitcoinAmountUnit,
    selectIsNetworkReserveEnabled,
} from '../settings/walletSettingsReducer';
import {
    addFakePendingCardanoTxThunk,
    addFakePendingEvmTxThunk,
    addFakePendingTxThunk,
} from '../transactions/transactionsThunks';

export const convertSendFormDraftsBtcAmountUnitsThunk = createThunk(
    `${SEND_MODULE_PREFIX}/convertSendFormDraftsBtcAmountUnitsThunk`,
    (
        {
            selectedAccountKey,
            isOnSendPage,
        }: { selectedAccountKey?: AccountKey; isOnSendPage?: boolean },
        { dispatch, getState, rejectWithValue },
    ) => {
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
            const amountDecimals = getAccountDecimals(relatedAccount.symbol)!;

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
>;

export const composeSendFormTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels | PrecomposedLevelsCardano,
    { formState: FormState; composeContext: ComposeActionContext },
    { rejectValue: ComposeFeeLevelsError }
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
            // TODO: Tron send not yet implemented
        } else {
            return exhaustive(networkType);
        }

        if (isRejected(response) || !response?.payload) {
            return rejectWithValue(
                response?.payload ?? {
                    error: 'fee-levels-compose-failed',
                },
            );
        }

        return response.payload;
    },
);

export const cancelSignSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/cancelSignSendFormTransactionThunk`,
    (_, { dispatch, getState, extra, rejectWithValue }) => {
        const {
            actions: { onModalCancel },
        } = extra;
        const serializedTx = selectSendSerializedTx(getState());
        dispatch(sendFormActions.discardTransaction());
        // if transaction is not signed yet interrupt signing in TrezorConnect
        if (!serializedTx) {
            TrezorConnect.cancel('tx-cancelled');

            return;
        }
        // otherwise just close modal
        dispatch(onModalCancel());

        return rejectWithValue('No active signing process found.');
    },
);

const synchronizeSentTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/synchronizePendingTransactionsThunk`,
    (
        {
            selectedAccount,
            precomposedTransaction,
            precomposedForm,
            txid,
        }: {
            selectedAccount: Account;
            precomposedTransaction: GeneralPrecomposedTransactionFinal;
            precomposedForm?: FormState;
            txid: string;
        },
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
                }),
            );
            dispatch(accountsActions.updateAccount(selectedAccount));
        } else {
            // there is no point in fetching account data right after tx submit
            //  as the account will update only after the tx is confirmed
            dispatch(syncAccountsWithBlockchainThunk(selectedAccount.symbol));
        }
    },
);

export const pushSendFormTransactionThunk = createThunk<
    Ok<{ txid: string }>,
    { selectedAccount: Account; isMevProtectionEnabled: boolean },
    { rejectValue: PushTransactionError }
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
            coin: serializedTx.symbol,
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
        const evmApprovalData = getEvmApprovalTxData(precomposedForm?.transactionData);

        if (pushTxResponse.success) {
            const { txid } = pushTxResponse.payload;

            if (evmApprovalData && token) {
                const isInfiniteApproval = new BigNumber(evmApprovalData.amount).eq(UINT256_MAX);
                const amount = subunitsToUnits({
                    value: asAmountSubunit(new BigNumber(evmApprovalData.amount)),
                    decimals: token.decimals,
                }).toString();

                dispatch(
                    notificationsActions.addToast({
                        type: evmApprovalData.type === 'approve' ? 'tx-approved' : 'tx-revoked',
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

        return pushTxResponse.success
            ? fulfillWithValue(pushTxResponse)
            : rejectWithValue({
                  error: 'push-transaction-failed',
                  metadata: pushTxResponse,
              });
    },
);

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
export const pushSendFormRawTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/pushSendFormRawTransactionThunk`,
    async (
        payload: {
            tx: string;
            symbol: NetworkSymbol;
            identity?: string;
            isMevProtectionEnabled: boolean;
        },
        { dispatch, fulfillWithValue, rejectWithValue },
    ) => {
        const txData = getMevProtectedTxData(
            payload.symbol,
            payload.tx,
            payload.isMevProtectionEnabled,
        );

        const sentTx = await TrezorConnect.pushTransaction({
            tx: txData,
            coin: payload.symbol,
            identity: payload.identity,
        });

        if (sentTx.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    txid: sentTx.payload.txid,
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
>;

type SignTransactionThunkParams = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano;
    selectedAccount: Account;
    paymentRequests?: PROTO.PaymentRequest[];
};

export const signTransactionThunk = createThunk<
    { serializedTx: string; signedTx?: BlockbookTransaction },
    SignTransactionThunkParams,
    { rejectValue: SignTransactionError | SignTransactionTimeoutError | undefined }
>(
    `${SEND_MODULE_PREFIX}/signTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, paymentRequests },
        { dispatch, rejectWithValue, getState },
    ) => {
        const device = selectSelectedDevice(getState());

        if (!device || !precomposedTransaction || precomposedTransaction.type !== 'final')
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
                }),
            );
        } else {
            const { networkType } = selectedAccount;
            const thunkArguments = {
                formState,
                precomposedTransaction,
                selectedAccount,
                device,
            };
            // TODO: slip24 - can be moved into thinkArguments when slip24 is enabled for all networks
            const thunkArgumentsWithPaymentRequests = {
                ...thunkArguments,
                paymentRequests,
            };
            if (networkType === 'bitcoin') {
                response = await dispatch(
                    signBitcoinSendFormTransactionThunk(thunkArgumentsWithPaymentRequests),
                );
            } else if (networkType === 'ethereum') {
                response = await dispatch(
                    signEthereumSendFormTransactionThunk(thunkArgumentsWithPaymentRequests),
                );
            } else if (networkType === 'solana') {
                response = await dispatch(signSolanaSendFormTransactionThunk(thunkArguments));
            } else if (['ripple', 'stellar'].includes(networkType)) {
                response = await dispatch(
                    signRippleStellarSendFormTransactionThunk(thunkArguments),
                );
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

export const enhancePrecomposedTransactionThunk = createThunk<
    GeneralPrecomposedTransactionFinal,
    {
        transactionFormValues: FormState;
        precomposedTransaction: GeneralPrecomposedTransactionFinal;
        selectedAccount: Account;
    },
    { rejectValue: string }
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

        const enhancedPrecomposedTransaction = createRbfEnhancedTransaction();

        let isTokenKnown;
        if (
            !isCardanoTx(selectedAccount, enhancedPrecomposedTransaction) &&
            selectedAccount.networkType === 'ethereum' &&
            enhancedPrecomposedTransaction.token?.contract &&
            selectedAccountNetwork.chainId
        ) {
            isTokenKnown = await fetch(
                `https://data.trezor.io/firmware/eth-definitions/chain-id/${
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
