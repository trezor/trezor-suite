import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { metadataLabelingActions, selectMetadata } from '@suite/metadata';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import {
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

import {
    selectIsSelectedAccountLoaded,
    selectSelectedAccountKey,
} from 'src/reducers/wallet/selectedAccountReducer';

import { RBF_ERROR_ALREADY_MINED } from './replaceByFeeErrorThunk';
import { MODULE_PREFIX } from './sendThunksConsts';
import {
    type StateBeforePush,
    asStateBeforePush,
    moveLabelsForRbfThunk,
} from '../../labels/moveLabelsForRbfThunk';
import { processLegacyMetadataIntoSuiteSyncThunk } from '../processLegacyMetadataIntoSuiteSyncThunk';

export const saveSendFormDraftThunk = createThunk(
    `${MODULE_PREFIX}/saveSendFormDraftThunk`,
    ({ formState }: { formState: FormState }, { dispatch, getState }) => {
        const selectedAccountKey = selectSelectedAccountKey(getState());
        const isSelectedAccountLoaded = selectIsSelectedAccountLoaded(getState());

        if (!isSelectedAccountLoaded || G.isNullable(selectedAccountKey)) return null;

        dispatch(sendFormActions.storeDraft({ accountKey: selectedAccountKey, formState }));
    },
);

export const getSendFormDraftThunk = createThunk(
    `${MODULE_PREFIX}/getSendFormDraftThunk`,
    (_, { getState }) => {
        const isSelectedAccountLoaded = selectIsSelectedAccountLoaded(getState());
        const selectedAccountKey = selectSelectedAccountKey(getState());
        const sendFormDrafts = selectSendFormDrafts(getState());

        if (!isSelectedAccountLoaded || G.isNullable(selectedAccountKey)) return;

        const accountDraft = sendFormDrafts[selectedAccountKey];
        if (accountDraft) {
            // draft is a read-only redux object. make a copy to be able to modify values
            return JSON.parse(JSON.stringify(accountDraft)) as FormState;
        }
    },
);

export const removeSendFormDraftThunk = createThunk(
    `${MODULE_PREFIX}/removeSendFormDraftThunk`,
    (_, { dispatch, getState }) => {
        const isSelectedAccountLoaded = selectIsSelectedAccountLoaded(getState());
        const selectedAccountKey = selectSelectedAccountKey(getState());

        if (!isSelectedAccountLoaded || G.isNullable(selectedAccountKey)) return 0;

        dispatch(sendFormActions.removeDraft({ accountKey: selectedAccountKey }));
    },
);

type UpdateRbfLabelsThunkParams = {
    precomposedTransaction: PrecomposedTransactionFinalBumpFeeRbf;
    txid: string;
    prevTxid: string;
    deviceStaticSessionId: StaticSessionId;
    stateBeforePush: StateBeforePush;
};

const updateRbfLabelsThunk = createThunk<void, UpdateRbfLabelsThunkParams, void>(
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

const applySendFormMetadataLabelsThunk = createThunk<
    void,
    ApplySendFormMetadataLabelsThunkParams,
    void
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

export const signAndPushSendFormTransactionThunk = createThunk(
    `${MODULE_PREFIX}/signSendFormTransactionThunk`,
    async (
        {
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: SignAndPushSendFormTransactionThunkParams,
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

        asTypedDesktopAnalytics(extra.services.analytics).report({
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

        asTypedDesktopAnalytics(extra.services.analytics).report({
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
                return { type: signResponse.error.message } as any;
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
