import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    Account,
    FormState,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
    RbfLabelsToBeUpdated,
} from '@suite-common/wallet-types';
import {
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    replaceTransactionThunk,
    selectDevice,
    selectPrecomposedSendForm,
    selectSendFormDrafts,
    signTransactionThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import { isCardanoTx } from '@suite-common/wallet-utils';
import { MetadataAddPayload } from '@suite-common/metadata-types';
import { Unsuccessful } from '@trezor/connect';
import { getSynchronize } from '@trezor/utils';

import {
    selectSelectedAccountKey,
    selectIsSelectedAccountLoaded,
} from 'src/reducers/wallet/selectedAccountReducer';
import { findLabelsToBeMovedOrDeleted } from '../moveLabelsForRbfActions';
import { selectMetadata } from 'src/reducers/suite/metadataReducer';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import * as modalActions from 'src/actions/suite/modalActions';

export const MODULE_PREFIX = '@send';

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

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Address component
export const scanOrRequestSendFormThunk = createThunk(
    `${MODULE_PREFIX}/scanOrRequestSendFormThunk`,
    (_, { dispatch }) => dispatch(modalActions.openDeferredModal({ type: 'qr-reader' })),
);

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Header component
export const importSendFormRequestThunk = createThunk(
    `${MODULE_PREFIX}/importSendFormRequestThunk`,
    (_, { dispatch }) => dispatch(modalActions.openDeferredModal({ type: 'import-transaction' })),
);

const updateRbfLabelsThunk = createThunk(
    `${MODULE_PREFIX}/updateReplacedTransactionThunk`,
    (
        {
            labelsToBeEdited,
            precomposedTx,
            txid,
        }: {
            labelsToBeEdited: RbfLabelsToBeUpdated;
            precomposedTx: PrecomposedTransactionFinal;
            txid: string;
        },
        { dispatch, extra },
    ) => {
        const {
            thunks: { moveLabelsForRbfAction },
        } = extra;

        dispatch(
            moveLabelsForRbfAction({
                toBeMovedOrDeletedList: labelsToBeEdited,
                newTxid: txid,
            }),
        );

        // notification from the backend may be delayed.
        // modify affected transaction(s) in the reducer until the real account update occurs.
        // this will update transaction details (like time, fee etc.)
        dispatch(
            replaceTransactionThunk({
                precomposedTx,
                newTxid: txid,
            }),
        );
    },
);

const applySendFormMetadataLabelsThunk = createThunk(
    `${MODULE_PREFIX}/applyMetadataLabelsThunk`,
    (
        {
            selectedAccount,
            precomposedTx,
            txid,
        }: {
            selectedAccount: Account;
            precomposedTx: GeneralPrecomposedTransactionFinal;
            txid: string;
        },
        { dispatch, getState },
    ) => {
        const metadata = selectMetadata(getState());
        if (metadata.enabled) {
            const precomposedForm = selectPrecomposedSendForm(getState());
            let outputsPermutation: number[];
            if (isCardanoTx(selectedAccount, precomposedTx)) {
                // cardano preserves order of outputs
                outputsPermutation = precomposedTx?.outputs.map((_o, i) => i);
            } else {
                outputsPermutation = precomposedTx?.outputsPermutation;
            }

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
                        outputIndex,
                        value: label,
                        defaultValue: '',
                    };

                    return outputMetadata;
                })
                // filter out empty values AFTER creating metadata objects (see outputs mapping above)
                .filter(output => output.value)
                // propagate metadata to reducers and persistent storage
                .forEach((output, index, arr) => {
                    const isLast = index === arr.length - 1;

                    synchronize(() =>
                        dispatch(
                            metadataLabelingActions.addAccountMetadata({
                                ...output,
                                skipSave: !isLast,
                            }),
                        ),
                    );
                });
        }
    },
);

export const signAndPushSendFormTransactionThunk = createThunk(
    `${MODULE_PREFIX}/signSendFormTransactionThunk`,
    async (
        {
            formValues,
            precomposedTransaction,
            selectedAccount,
        }: {
            formValues: FormState;
            precomposedTransaction: GeneralPrecomposedTransactionFinal;
            selectedAccount?: Account;
        },
        { dispatch, getState },
    ) => {
        const device = selectDevice(getState());
        if (!device || !selectedAccount) return;

        const enhancedPrecomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formValues,
                precomposedTransaction,
                selectedAccount,
            }),
        ).unwrap();

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI.CLOSE_UI.WINDOW after the signing process
        // this action is blocked by modalActions.preserve()
        dispatch(modalActions.preserve());

        const { serializedTx } = await dispatch(
            signTransactionThunk({
                formValues,
                precomposedTransaction: enhancedPrecomposedTransaction,
                selectedAccount,
            }),
        ).unwrap();

        if (!serializedTx) {
            // close modal manually since UI.CLOSE_UI.WINDOW was blocked
            dispatch(modalActions.onCancel());

            return;
        }

        // Open a deferred modal and get the decision
        const isPushConfirmed = await dispatch(
            modalActions.openDeferredModal({ type: 'review-transaction' }),
        );
        if (isPushConfirmed) {
            const isRbf = precomposedTransaction.prevTxid !== undefined;

            // This has to be executed prior to pushing the transaction!
            const rbfLabelsToBeEdited = isRbf
                ? dispatch(
                      findLabelsToBeMovedOrDeleted({ prevTxid: precomposedTransaction.prevTxid }),
                  )
                : null;

            // push tx to the network
            const pushResponse = await dispatch(
                pushSendFormTransactionThunk({
                    selectedAccount,
                }),
            );

            if (isRejected(pushResponse)) {
                return pushResponse.payload as Unsuccessful;
            }

            const result = pushResponse.payload;
            const { txid } = result.payload;

            if (isRbf && rbfLabelsToBeEdited) {
                await dispatch(
                    updateRbfLabelsThunk({
                        labelsToBeEdited: rbfLabelsToBeEdited,
                        precomposedTx: precomposedTransaction,
                        txid,
                    }),
                );
            }

            dispatch(
                applySendFormMetadataLabelsThunk({
                    selectedAccount,
                    precomposedTx: precomposedTransaction,
                    txid,
                }),
            );

            return result;
        }
    },
);
