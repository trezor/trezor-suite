import produce from 'immer';
import { STORAGE } from 'src/actions/suite/constants';
import { SEND } from 'src/actions/wallet/constants';
import { Action } from 'src/types/suite';
import { FormState, PrecomposedTransactionFinal, TxFinalCardano } from 'src/types/wallet/sendForm';
import { accountsActions } from '@suite-common/wallet-core';
import { cloneObject } from '@trezor/utils';

export interface SendState {
    drafts: {
        [key: string]: FormState; // Key: account key
    };
    sendRaw?: boolean;
    precomposedTx?: PrecomposedTransactionFinal | TxFinalCardano;
    precomposedForm?: FormState;
    signedTx?: { tx: string; coin: string }; // payload for TrezorConnect.pushTransaction
}

export const initialState: SendState = {
    drafts: {},
    precomposedTx: undefined,
    signedTx: undefined,
};

const sendFormReducer = (state: SendState = initialState, action: Action): SendState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                action.payload.sendFormDrafts.forEach(d => {
                    draft.drafts[d.key] = d.value;
                });
                break;
            case SEND.STORE_DRAFT:
                // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                // TypeError: Cannot assign to read only property of object '#<Object>'
                // This might not be necessary in the future when the dependencies are upgraded.
                draft.drafts[action.key] = cloneObject(action.formState);
                break;
            case SEND.REMOVE_DRAFT:
                delete draft.drafts[action.key];
                break;
            case accountsActions.removeAccount.type: {
                if (accountsActions.removeAccount.match(action)) {
                    action.payload.forEach(account => {
                        delete draft.drafts[account.key];
                    });
                }
                break;
            }
            case SEND.REQUEST_SIGN_TRANSACTION:
                if (action.payload) {
                    draft.precomposedTx = action.payload.transactionInfo;
                    // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                    // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                    // TypeError: Cannot assign to read only property of object '#<Object>'
                    // This might not be necessary in the future when the dependencies are upgraded.
                    draft.precomposedForm = cloneObject(action.payload.formValues);
                } else {
                    delete draft.precomposedTx;
                    delete draft.precomposedForm;
                }
                break;
            case SEND.REQUEST_PUSH_TRANSACTION:
                if (action.payload) {
                    draft.signedTx = action.payload;
                } else {
                    delete draft.signedTx;
                }
                break;
            case SEND.SEND_RAW:
                draft.sendRaw = action.payload;
                break;
            case SEND.DISPOSE:
                delete draft.sendRaw;
                delete draft.precomposedTx;
                delete draft.precomposedForm;
                delete draft.signedTx;
                break;
            // no default
        }
    });

export default sendFormReducer;
