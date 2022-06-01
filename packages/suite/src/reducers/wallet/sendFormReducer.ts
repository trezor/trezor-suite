import produce from 'immer';
import { STORAGE } from '@suite-actions/constants';
import { ACCOUNT, SEND } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import { FormState, PrecomposedTransactionFinal, TxFinalCardano } from '@wallet-types/sendForm';

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
                action.payload?.sendFormDrafts.forEach(d => {
                    draft.drafts[d.key] = d.value;
                });
                break;
            case SEND.STORE_DRAFT:
                draft.drafts[action.key] = action.formState;
                break;
            case SEND.REMOVE_DRAFT:
                delete draft.drafts[action.key];
                break;
            case ACCOUNT.REMOVE:
                action.payload.forEach(account => {
                    delete draft.drafts[account.key];
                });
                break;
            case SEND.REQUEST_SIGN_TRANSACTION:
                if (action.payload) {
                    draft.precomposedTx = action.payload.transactionInfo;
                    draft.precomposedForm = action.payload.formValues;
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
