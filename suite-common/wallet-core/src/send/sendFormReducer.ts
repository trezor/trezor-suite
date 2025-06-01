import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import {
    FormState,
    GeneralPrecomposedTransactionFinal,
    SendFormDraftKey,
} from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';
import { cloneObject } from '@trezor/utils';

import { sendFormActions } from './sendFormActions';
import { SerializedTx } from './sendFormTypes';
import { accountsActions } from '../accounts/accountsActions';

export type SendState = {
    drafts: {
        [key: SendFormDraftKey]: FormState;
    };
    sendRaw?: boolean;
    precomposedTx?: GeneralPrecomposedTransactionFinal;
    precomposedForm?: FormState; // Used to pass the form state to the review modal. Holds similar data as drafts, but drafts are not used in RBF form.
    signedTx?: BlockbookTransaction;
    serializedTx?: SerializedTx; // Hexadecimal representation of signed transaction (payload for TrezorConnect.pushTransaction).
    areFeesLoading: boolean; // visual indication of fees being loaded, independent of the fees state
};

export const initialState: SendState = {
    drafts: {},
    precomposedTx: undefined,
    serializedTx: undefined,
    signedTx: undefined,
    areFeesLoading: false,
};

export type SendRootState = {
    wallet: {
        send: SendState;
    };
};

export const prepareSendFormReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(
            sendFormActions.storeDraft,
            (state, { payload: { accountKey, tokenContract, formState } }) => {
                const draftKey = getSendFormDraftKey(accountKey, tokenContract);

                // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                // TypeError: Cannot assign to read only property of object '#<Object>'
                // This might not be necessary in the future when the dependencies are upgraded.
                state.drafts[draftKey] = cloneObject(formState);
            },
        )
        .addCase(sendFormActions.removeDraft, (state, { payload: { accountKey } }) => {
            delete state.drafts[accountKey];
        })
        .addCase(
            sendFormActions.storePrecomposedTransaction,
            (state, { payload: { precomposedTransaction, formState } }) => {
                state.precomposedTx = precomposedTransaction;
                // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                // TypeError: Cannot assign to read only property of object '#<Object>'
                // This might not be necessary in the future when the dependencies are upgraded.
                state.precomposedForm = cloneObject(formState);
            },
        )
        .addCase(
            sendFormActions.storeSignedTransaction,
            (state, { payload: { serializedTx, signedTx } }) => {
                state.serializedTx = serializedTx;
                state.signedTx = signedTx;
            },
        )
        .addCase(sendFormActions.discardTransaction, state => {
            delete state.precomposedTx;
            delete state.precomposedForm;
            delete state.serializedTx;
            delete state.signedTx;
        })
        .addCase(sendFormActions.sendRaw, (state, { payload: sendRaw }) => {
            state.sendRaw = sendRaw;
        })
        .addCase(sendFormActions.dispose, state => {
            delete state.sendRaw;
            delete state.precomposedTx;
            delete state.precomposedForm;
            delete state.serializedTx;
            delete state.signedTx;
        })
        .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFormDrafts)
        .addCase(accountsActions.removeAccount, (state, { payload }) => {
            payload.forEach(account => {
                delete state.drafts[account.key];
            });
        })
        .addCase(sendFormActions.setAreFeesLoading, (state, { payload: { areFeesLoading } }) => {
            state.areFeesLoading = areFeesLoading;
        });
});
