import { G } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import {
    Account,
    FormState,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';

import * as modalActions from 'src/actions/suite/modalActions';
import {
    selectSelectedAccountKey,
    selectIsSelectedAccountLoaded,
} from 'src/reducers/wallet/selectedAccountReducer';

import {
    prepareTransactionForSigningThunk,
    pushSendFormTransactionThunk,
    selectDevice,
    selectSendFormDrafts,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { sendFormActions } from '@suite-common/wallet-core';

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

export const signAndPushSendFormTransactionThunk = createThunk(
    `${MODULE_PREFIX}/signSendFormTransactionThunk`,
    async (
        {
            formValues,
            transactionInfo,
            selectedAccount,
        }: {
            formValues: FormState;
            transactionInfo: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano;
            selectedAccount?: Account;
        },
        { dispatch, getState },
    ) => {
        const device = selectDevice(getState());
        if (!device || !selectedAccount) return;

        const enhancedTxInfo = await dispatch(
            prepareTransactionForSigningThunk({
                transactionFormValues: formValues,
                transactionInfo,
                selectedAccount,
            }),
        ).unwrap();

        if (!enhancedTxInfo) {
            return;
        }

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI.CLOSE_UI.WINDOW after the signing process
        // this action is blocked by modalActions.preserve()
        dispatch(modalActions.preserve());

        const { serializedTx, signedTransaction } = await dispatch(
            signTransactionThunk({
                formValues,
                transactionInfo: enhancedTxInfo,
                selectedAccount,
            }),
        ).unwrap();

        if (!serializedTx) {
            // close modal manually since UI.CLOSE_UI.WINDOW was blocked
            dispatch(modalActions.onCancel());

            return;
        }

        // Open a deferred modal and get the decision
        const decision = await dispatch(
            modalActions.openDeferredModal({ type: 'review-transaction' }),
        );
        if (decision) {
            // push tx to the network
            return dispatch(
                pushSendFormTransactionThunk({
                    signedTransaction,
                    selectedAccount,
                }),
            ).unwrap();
        }
    },
);
