import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import { FormState } from '@wallet-types/sendForm';
import { FeeLevel } from 'trezor-connect';

interface State {
    drafts: {
        [key: string]: {
            formState: FormState;
        };
    };
    precomposedTx: any; // TODO create type
    lastUsedFeeLevel: {
        [key: string]: FeeLevel['label'];
    };
}

export const initialState: State = {
    drafts: {},
    precomposedTx: null,
    lastUsedFeeLevel: {},
};

export default (state: State = initialState, action: Action) => {
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
            case SEND.SAVE_PRECOMPOSED_TX:
                draft.precomposedTx = action.precomposedTx;
                break;
            // no default
        }
    });
};
