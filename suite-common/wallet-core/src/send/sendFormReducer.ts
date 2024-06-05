import {
    AccountKey,
    FormState,
    GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { cloneObject } from '@trezor/utils';
import { SerializedTx } from '@suite-common/wallet-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';

import { sendFormActions } from './sendFormActions';
import { accountsActions } from '../accounts/accountsActions';

export type SendState = {
    drafts: {
        [key: AccountKey]: FormState;
    };
    sendRaw?: boolean;
    precomposedTx?: GeneralPrecomposedTransactionFinal;
    signedTx?: BlockbookTransaction;
    serializedTx?: SerializedTx; // hexadecimal representation of signed transaction (payload for TrezorConnect.pushTransaction)
};

export const initialState: SendState = {
    drafts: {},
    precomposedTx: undefined,
    serializedTx: undefined,
    signedTx: undefined,
};

export type SendRootState = {
    wallet: {
        send: SendState;
    };
};

export const prepareSendFormReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(sendFormActions.storeDraft, (state, { payload: { accountKey, formState } }) => {
            // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
            // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
            // TypeError: Cannot assign to read only property of object '#<Object>'
            // This might not be necessary in the future when the dependencies are upgraded.
            state.drafts[accountKey] = cloneObject(formState);
        })
        .addCase(sendFormActions.removeDraft, (state, { payload: { accountKey } }) => {
            delete state.drafts[accountKey];
        })
        .addCase(
            sendFormActions.storePrecomposedTransaction,
            (state, { payload: { precomposedTransaction, accountKey, enhancedFormDraft } }) => {
                state.precomposedTx = precomposedTransaction;
                // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                // TypeError: Cannot assign to read only property of object '#<Object>'
                // This might not be necessary in the future when the dependencies are upgraded.
                state.drafts[accountKey] = cloneObject(enhancedFormDraft);
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
            delete state.serializedTx;
            delete state.signedTx;
        })
        .addCase(sendFormActions.sendRaw, (state, { payload: sendRaw }) => {
            state.sendRaw = sendRaw;
        })
        .addCase(sendFormActions.dispose, state => {
            delete state.sendRaw;
            delete state.precomposedTx;
            delete state.serializedTx;
            delete state.signedTx;
        })
        .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFormDrafts)
        .addCase(accountsActions.removeAccount, (state, { payload }) => {
            payload.forEach(account => {
                delete state.drafts[account.key];
            });
        });
});

export const selectSendPrecomposedTx = (state: SendRootState) => state.wallet.send.precomposedTx;
export const selectSendSerializedTx = (state: SendRootState) => state.wallet.send.serializedTx;
export const selectSendSignedTx = (state: SendRootState) => state.wallet.send.signedTx;
export const selectSendFormDrafts = (state: SendRootState) => state.wallet.send.drafts;
export const selectSendFormDraftByAccountKey = (state: SendRootState, accountKey: AccountKey) =>
    state.wallet.send.drafts[accountKey];
