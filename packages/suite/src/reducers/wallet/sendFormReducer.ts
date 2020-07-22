import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import { FormState } from '@wallet-types/sendForm';
import { FeeLevel, PrecomposedTransaction } from 'trezor-connect';

interface SendState {
    drafts: {
        [key: string]: {
            formState: FormState;
        };
    };
    precomposedTx?: Extract<PrecomposedTransaction, { type: 'final' }>;
    signedTx?: { tx: string; coin: string }; // payload for TrezorConnect.pushTransaction
    lastUsedFeeLevel: {
        [key: string]: FeeLevel['label'];
    };
}

export const initialState: SendState = {
    drafts: {},
    precomposedTx: undefined,
    signedTx: undefined,
    lastUsedFeeLevel: {},
};

export default (state: SendState = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case SEND.STORE_DRAFT:
                draft.drafts[action.key] = {
                    formState: action.formState,
                };
                break;
            case SEND.REMOVE_DRAFT:
                delete draft.drafts[action.key];
                break;
            case SEND.SET_LAST_USED_FEE_LEVEL:
                draft.lastUsedFeeLevel[action.symbol] = action.feeLevelLabel;
                break;
            case SEND.REQUEST_SIGN_TRANSACTION:
                if (action.payload) {
                    draft.precomposedTx = action.payload;
                } else {
                    delete draft.precomposedTx;
                }
                break;
            case SEND.REQUEST_PUSH_TRANSACTION:
                if (action.payload) {
                    draft.signedTx = action.payload;
                } else {
                    delete draft.signedTx;
                }
                break;
            // no default
        }
    });
};
