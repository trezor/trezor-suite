import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type SendFormDraftKey,
} from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import { cloneObject } from '@trezor/utils';

import { sendFormActions } from './sendFormActions';
import { type SerializedTx } from './sendFormTypes';
import { accountsActions } from '../accounts/accountsActions';

export type SendState = {
    drafts: {
        // Note: suite-native store drafts per tokens, desktop and web store drafts per accountKey only
        [key: SendFormDraftKey]: FormState;
    };
    sendRaw?: boolean;
    precomposedTx?: GeneralPrecomposedTransactionFinal;
    precomposedForm?: FormState; // Used to pass the form state to the review modal. Holds similar data as drafts, but drafts are not used in RBF form.
    signedTx?: BlockbookTransaction;
    serializedTx?: SerializedTx; // Hexadecimal representation of signed transaction (payload for TrezorConnect.pushTransaction).
    accountKey?: AccountKey; // Account key for the transaction being processed.
};

export const initialState: SendState = {
    drafts: {},
    precomposedTx: undefined,
    serializedTx: undefined,
    signedTx: undefined,
    accountKey: undefined,
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
        .addCase(
            sendFormActions.removeDraft,
            (state, { payload: { accountKey, tokenContract } }) => {
                const draftKey = getSendFormDraftKey(accountKey, tokenContract);

                delete state.drafts[draftKey];
            },
        )
        .addCase(
            sendFormActions.storePrecomposedTransaction,
            (state, { payload: { precomposedTransaction, formState, accountKey } }) => {
                state.precomposedTx = precomposedTransaction;
                // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                // TypeError: Cannot assign to read only property of object '#<Object>'
                // This might not be necessary in the future when the dependencies are upgraded.
                state.precomposedForm = cloneObject(formState);
                state.accountKey = accountKey;
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
            delete state.accountKey;
        })
        .addCase(sendFormActions.clearSignedTransactionData, state => {
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
            delete state.accountKey;
        })
        .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFormDrafts)
        .addCase(accountsActions.removeAccount, (state, { payload }) => {
            payload.forEach(account => {
                delete state.drafts[account.key];
            });
        });
});
