import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import {
    type SelectedAccountRootState,
    selectIsSelectedAccountLoaded,
    selectSelectedAccountKey,
} from '@suite/account';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { processLegacyMetadataIntoSuiteSyncThunk } from '@suite/labeling';
import { type MetadataRootState, metadataLabelingActions, selectMetadata } from '@suite/metadata';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type WithSuiteSyncState, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    type CancelSignSendFormTransactionThunkDeps,
    type CancelSignSendFormTransactionThunkState,
    type EnhancePrecomposedTransactionThunkState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    type ReplaceTransactionThunkState,
    type SendRootState,
    type SignTransactionThunkState,
    cancelSignSendFormTransactionThunk,
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    replaceTransactionThunk,
    selectIsMevProtectionEnabled,
    selectPrecomposedSendForm,
    selectSendFormDrafts,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
} from '@suite-common/wallet-types';
import { isCardanoTx, isRbfBumpFeeTransaction } from '@suite-common/wallet-utils';
import { type PROTO, type StaticSessionId } from '@trezor/connect';
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
        const metadata = selectMetadata(getState());
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(getState());

        if (!metadata.enabled && !isSuiteSyncEnabled) {
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
                            metadataLabelingActions.addAccountMetadata({
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
};

type SignAndPushSendFormTransactionThunkState = ApplySendFormMetadataLabelsThunkState &
    CancelSignSendFormTransactionThunkState &
    EnhancePrecomposedTransactionThunkState &
    MessageSystemRootState &
    PushSendFormTransactionThunkState &
    SignTransactionThunkState &
    UpdateRbfLabelsThunkState;

type SignAndPushSendFormTransactionThunkDeps = ApplySendFormMetadataLabelsThunkDeps &
    CancelSignSendFormTransactionThunkDeps &
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
        { formState, precomposedTransaction, selectedAccount, paymentRequests },
        { dispatch, getState, extra },
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device || !selectedAccount) return;

        const enhancedPrecomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction,
                selectedAccount,
            }),
        ).unwrap();

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI.CLOSE_UI.WINDOW after the signing process
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
            }),
        );

        extra.services.analytics.report({
            type: events.sendConfirmedOnDeviceEvent.name,
            payload: {
                assetSymbol: selectedAccount.symbol,
            },
        });

        if (isRejected(signResponse)) {
            // Do not close the modal, as we need that modal to display the error state.
            if (signResponse.payload?.message === RBF_ERROR_ALREADY_MINED) {
                return;
            }

            // Do not close the modal if the transaction signing timed out
            if (signResponse.payload?.error === 'sign-transaction-timeout') {
                // TODO: this is some kinda bizarre hack
                return { type: signResponse.error.message };
            }

            // Close the modal manually since UI.CLOSE_UI.WINDOW was
            // blocked by preserveModal() above.
            dispatch(closeModal());

            return;
        }

        // Open a deferred modal and get the decision
        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
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
            pushSendFormTransactionThunk({ selectedAccount, isMevProtectionEnabled }),
        );

        if (isRejected(pushResponse)) {
            dispatch(sendFormActions.clearSignedTransactionData());

            return pushResponse.payload?.metadata;
        }

        const result = pushResponse.payload;
        const { txid } = result.payload;

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
