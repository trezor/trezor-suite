import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import {
    type SelectedAccountRootState,
    selectIsSelectedAccountLoaded,
    selectSelectedAccountKey,
} from '@suite/account';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import {
    type GetSendFormContactOutputsThunkState,
    getSendFormContactOutputsThunk,
} from '@suite/contacts';
import { processLegacyMetadataIntoSuiteSyncThunk } from '@suite/labeling';
import {
    type MetadataRootState,
    metadataLabelingActions,
    selectMetadataEnabled,
} from '@suite/metadata';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import {
    type MarkContactAddressesSpentThunkDeps,
    type MarkContactAddressesSpentThunkState,
    markContactAddressesSpentThunk,
} from '@suite-common/contacts';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { type WithSuiteSyncState, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type CancelSignSendFormTransactionThunkDeps,
    type CancelSignSendFormTransactionThunkState,
    type EnhancePrecomposedTransactionThunkState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    type ReplaceTransactionThunkState,
    type SendRootState,
    type SignTransactionThunkState,
    type YieldRootState,
    cancelSignSendFormTransactionThunk,
    enhancePrecomposedTransactionThunk,
    isEarnSigningCancelled,
    pushSendFormTransactionThunk,
    replaceTransactionThunk,
    selectIsMevProtectionEnabled,
    selectPrecomposedSendForm,
    selectSendFormDrafts,
    selectYieldApprovalInReview,
    sendFormActions,
    signTransactionThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
} from '@suite-common/wallet-types';
import { isCardanoTx, isRbfBumpFeeTransaction } from '@suite-common/wallet-utils';
import { type PROTO, type StaticSessionId } from '@trezor/connect';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { getSynchronize } from '@trezor/utils';

import { RBF_ERROR_ALREADY_MINED } from './replaceByFeeErrorThunk';
import { MODULE_PREFIX } from './sendThunksConsts';
import {
    type MoveLabelsForRbfThunkDeps,
    type MoveLabelsForRbfThunkState,
    type StateBeforePush,
    asStateBeforePush,
    moveLabelsForRbfThunk,
} from '../../labels/moveLabelsForRbfThunk';

type SaveSendFormDraftThunkParams = { formState: FormState };

type SaveSendFormDraftThunkState = SelectedAccountRootState;

export const saveSendFormDraftThunk = createThunk<
    null | undefined,
    SaveSendFormDraftThunkParams,
    { state: SaveSendFormDraftThunkState }
>(`${MODULE_PREFIX}/saveSendFormDraftThunk`, ({ formState }, { dispatch, getState }) => {
    const selectedAccountKey = selectSelectedAccountKey(getState());
    const isSelectedAccountLoaded = selectIsSelectedAccountLoaded(getState());

    if (!isSelectedAccountLoaded || G.isNullable(selectedAccountKey)) return null;

    dispatch(sendFormActions.storeDraft({ accountKey: selectedAccountKey, formState }));
});

type GetSendFormDraftThunkState = SelectedAccountRootState & SendRootState;

export const getSendFormDraftThunk = createThunk<
    FormState | undefined,
    void,
    { state: GetSendFormDraftThunkState }
>(`${MODULE_PREFIX}/getSendFormDraftThunk`, (_, { getState }) => {
    const isSelectedAccountLoaded = selectIsSelectedAccountLoaded(getState());
    const selectedAccountKey = selectSelectedAccountKey(getState());
    const sendFormDrafts = selectSendFormDrafts(getState());

    if (!isSelectedAccountLoaded || G.isNullable(selectedAccountKey)) return;

    const accountDraft = sendFormDrafts[selectedAccountKey];
    if (accountDraft) {
        // draft is a read-only redux object. make a copy to be able to modify values
        return JSON.parse(JSON.stringify(accountDraft)) as FormState;
    }
});

type RemoveSendFormDraftThunkState = SelectedAccountRootState;

export const removeSendFormDraftThunk = createThunk<
    0 | undefined,
    void,
    { state: RemoveSendFormDraftThunkState }
>(`${MODULE_PREFIX}/removeSendFormDraftThunk`, (_, { dispatch, getState }) => {
    const isSelectedAccountLoaded = selectIsSelectedAccountLoaded(getState());
    const selectedAccountKey = selectSelectedAccountKey(getState());

    if (!isSelectedAccountLoaded || G.isNullable(selectedAccountKey)) return 0;

    dispatch(sendFormActions.removeDraft({ accountKey: selectedAccountKey }));
});

type UpdateRbfLabelsThunkParams = {
    precomposedTransaction: PrecomposedTransactionFinalBumpFeeRbf;
    txid: string;
    prevTxid: string;
    deviceStaticSessionId: StaticSessionId;
    stateBeforePush: StateBeforePush;
};

type UpdateRbfLabelsThunkState = MoveLabelsForRbfThunkState & ReplaceTransactionThunkState;

type UpdateRbfLabelsThunkDeps = MoveLabelsForRbfThunkDeps;

const updateRbfLabelsThunk = createThunk<
    void,
    UpdateRbfLabelsThunkParams,
    { state: UpdateRbfLabelsThunkState; extra: UpdateRbfLabelsThunkDeps }
>(
    `${MODULE_PREFIX}/updateReplacedTransactionThunk`,
    (
        { deviceStaticSessionId, precomposedTransaction, txid, stateBeforePush, prevTxid },
        { dispatch },
    ) => {
        dispatch(
            moveLabelsForRbfThunk({
                deviceStaticSessionId,
                newTxId: txid,
                stateBeforePush,
                prevTxId: prevTxid,
            }),
        );

        // notification from the backend may be delayed.
        // modify affected transaction(s) in the reducer until the real account update occurs.
        // this will update transaction details (like time, fee etc.)
        dispatch(
            replaceTransactionThunk({
                precomposedTransaction,
                newTxid: txid,
            }),
        );
    },
);

type ApplySendFormMetadataLabelsThunkParams = {
    selectedAccount: Account;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    txid: string;
};

type ApplySendFormMetadataLabelsThunkState = DeviceRootState &
    MessageSystemRootState &
    MetadataRootState &
    SendRootState &
    WithSuiteSyncState;

type ApplySendFormMetadataLabelsThunkDeps = WithServices<SuiteSyncDep>;

const applySendFormMetadataLabelsThunk = createThunk<
    void,
    ApplySendFormMetadataLabelsThunkParams,
    {
        state: ApplySendFormMetadataLabelsThunkState;
        extra: ApplySendFormMetadataLabelsThunkDeps;
    }
>(
    `${MODULE_PREFIX}/applyMetadataLabelsThunk`,
    ({ selectedAccount, precomposedTransaction, txid }, { dispatch, getState }) => {
        const metadataEnabled = selectMetadataEnabled(getState());
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(getState());

        if (!metadataEnabled && !isSuiteSyncEnabled) {
            return;
        }

        const precomposedForm = selectPrecomposedSendForm(getState());
        const outputsPermutation = isCardanoTx(selectedAccount, precomposedTransaction)
            ? precomposedTransaction?.outputs.map((_o, i) => i) // cardano preserves order of outputs
            : precomposedTransaction?.outputsPermutation;

        const synchronize = getSynchronize();

        precomposedForm?.outputs
            // create array of metadata objects
            .map((formOutput, index) => {
                const { label } = formOutput;
                // final ordering of outputs differs from order in send form
                // outputsPermutation contains mapping from @trezor/utxo-lib outputs to send form outputs
                // mapping goes like this: Array<@trezor/utxo-lib index : send form index>
                const outputIndex = outputsPermutation.findIndex(p => p === index);
                const outputMetadata: Extract<MetadataAddPayload, { type: 'outputLabel' }> = {
                    type: 'outputLabel',
                    entityKey: selectedAccount.key,
                    txid,
                    outputIndex: `${outputIndex}`,
                    value: label,
                    defaultValue: '',
                    networkSymbol: selectedAccount.symbol,
                    accountDescriptor: selectedAccount.descriptor,
                };

                return outputMetadata;
            })
            // filter out empty values AFTER creating metadata objects (see outputs mapping above)
            .filter(output => output.value)
            // propagate metadata to reducers and persistent storage
            .forEach((output, index, arr) => {
                const isLast = index === arr.length - 1;

                synchronize(() => {
                    if (isSuiteSyncEnabled) {
                        return dispatch(
                            processLegacyMetadataIntoSuiteSyncThunk({
                                payload: output,
                                deviceStaticSessionId: selectedAccount.deviceState,
                                value: output.value,
                            }),
                        );
                    } else {
                        return dispatch(
                            metadataLabelingActions.addAccountMetadataThunk({
                                ...output,
                                skipSave: !isLast,
                            }),
                        );
                    }
                });
            });
    },
);

type SignAndPushSendFormTransactionThunkParams = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    selectedAccount?: Account;
    paymentRequests?: PROTO.PaymentRequest[];
    shouldShowApprovalToast?: boolean;
};

// The toast prefixes the signing error, so this is only the reason.
const CONTACT_ADDRESS_PAID_ERROR =
    'This contact address was already paid. Ask the contact for a new address.';

export type SignAndPushSendFormTransactionThunkState = ApplySendFormMetadataLabelsThunkState &
    CancelSignSendFormTransactionThunkState &
    EnhancePrecomposedTransactionThunkState &
    GetSendFormContactOutputsThunkState &
    MarkContactAddressesSpentThunkState &
    MessageSystemRootState &
    PushSendFormTransactionThunkState &
    SignTransactionThunkState &
    UpdateRbfLabelsThunkState &
    YieldRootState;

export type SignAndPushSendFormTransactionThunkDeps = ApplySendFormMetadataLabelsThunkDeps &
    CancelSignSendFormTransactionThunkDeps &
    MarkContactAddressesSpentThunkDeps &
    PushSendFormTransactionThunkDeps &
    UpdateRbfLabelsThunkDeps &
    WithServices<DesktopAnalyticsDep>;

export const signAndPushSendFormTransactionThunk = createThunk<
    any,
    SignAndPushSendFormTransactionThunkParams,
    {
        state: SignAndPushSendFormTransactionThunkState;
        extra: SignAndPushSendFormTransactionThunkDeps;
    }
>(
    `${MODULE_PREFIX}/signSendFormTransactionThunk`,
    async (
        {
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
            shouldShowApprovalToast,
        },
        { dispatch, getState, extra },
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device || !selectedAccount) return;

        const yieldApproval = selectYieldApprovalInReview(getState());
        const reportYieldCancellation = (stage: 'signing' | 'review') => {
            if (!yieldApproval) return;

            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: { txType: 'yield', networkSymbol: selectedAccount.symbol, stage },
            });
        };

        const enhancedPrecomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction,
                selectedAccount,
            }),
        ).unwrap();

        // Checked right before signing: another Suite of the wallet may have paid the contact
        // address since it was picked.
        const contactOutputs = await dispatch(
            getSendFormContactOutputsThunk({
                accountKey: selectedAccount.key,
                formState,
                paymentRequests,
            }),
        ).unwrap();

        if (!contactOutputs.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: CONTACT_ADDRESS_PAID_ERROR,
                }),
            );

            return;
        }

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI_EVENTS.CLOSE_UI_WINDOW after the signing process
        // this action is blocked by preserveModal()
        dispatch(preserveModal());

        extra.services.analytics.report({
            type: events.sendInitialisedEvent.name,
            payload: {
                assetSymbol: selectedAccount.symbol,
            },
        });

        const signResponse = await dispatch(
            signTransactionThunk({
                formState,
                precomposedTransaction: enhancedPrecomposedTransaction,
                selectedAccount,
                paymentRequests,
                contactOutputs: contactOutputs.payload,
            }),
        );

        if (isRejected(signResponse)) {
            // Do not close the modal, as we need that modal to display the error state.
            if (signResponse.payload?.message === RBF_ERROR_ALREADY_MINED) {
                return;
            }

            // Keep the modal open to show the expired transaction state.
            if (signResponse.payload?.error === 'sign-transaction-timeout') {
                return {
                    success: false,
                    error: {
                        code: 'sign-transaction-timeout',
                        message: signResponse.payload.message,
                    },
                };
            }

            if (
                isEarnSigningCancelled({
                    code: signResponse.payload?.errorCode,
                    message: signResponse.payload?.message,
                })
            ) {
                reportYieldCancellation('signing');
            }

            // Close the modal manually since UI_EVENTS.CLOSE_UI_WINDOW was
            // blocked by preserveModal() above.
            dispatch(closeModal());

            return;
        }

        extra.services.analytics.report({
            type: events.sendConfirmedOnDeviceEvent.name,
            payload: {
                assetSymbol: selectedAccount.symbol,
            },
        });

        // Open a deferred modal and get the decision
        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
            reportYieldCancellation('review');

            return;
        }

        const isBumpFeeRbf = isRbfBumpFeeTransaction(enhancedPrecomposedTransaction);

        const isMevProtectionEnabled =
            selectIsMevProtectionEnabled(getState()) &&
            selectIsMevProtectionFeatureEnabled(getState());

        // NOTE: due to need of the gathering state of the transaction before push, we need to cache the state here and pass it on
        const stateBeforePush = asStateBeforePush(getState());

        // push tx to the network
        const pushResponse = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount,
                isMevProtectionEnabled,
                shouldShowApprovalToast,
            }),
        );

        if (yieldApproval) {
            dispatch(
                transactionsActions.transactionBroadcastStatus({
                    account: selectedAccount,
                    flow: yieldApproval.txType,
                    ...(isRejected(pushResponse)
                        ? ({ status: 'error' } as const)
                        : ({
                              status: 'success',
                              txid: pushResponse.payload.payload.txid,
                          } as const)),
                }),
            );
        }

        if (isRejected(pushResponse)) {
            dispatch(sendFormActions.clearSignedTransactionData());

            return pushResponse.payload?.metadata;
        }

        const result = pushResponse.payload;
        const { txid } = result.payload;

        if (contactOutputs.payload.length > 0) {
            dispatch(
                markContactAddressesSpentThunk({
                    accountKey: selectedAccount.key,
                    addresses: contactOutputs.payload.map(({ address }) => address),
                }),
            );
        }

        if (isBumpFeeRbf && device.state?.staticSessionId) {
            dispatch(
                updateRbfLabelsThunk({
                    deviceStaticSessionId: device.state.staticSessionId,
                    precomposedTransaction: enhancedPrecomposedTransaction,
                    txid,
                    stateBeforePush,
                    prevTxid: enhancedPrecomposedTransaction.prevTxid,
                }),
            );
        }

        // This thunk uses precomposedForm so it must be called before cleanup.
        dispatch(
            applySendFormMetadataLabelsThunk({
                selectedAccount,
                precomposedTransaction,
                txid,
            }),
        );

        // Clean send form state and close review modal.
        dispatch(cancelSignSendFormTransactionThunk());

        return result;
    },
);
