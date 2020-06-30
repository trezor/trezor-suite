import produce from 'immer';
import { SEND } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import { FormState, ContextStateValues } from '@wallet-types/sendForm';

export interface State {
    localCurrency: string;
}

interface Drafts {
    [key: string]: {
        sendContext: ContextStateValues;
        formState: FormState;
    };
}

export const initialState: Drafts = {};

export default (state: Drafts = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case SEND.STORE_DRAFT:
                draft[action.key] = {
                    sendContext: action.sendContext,
                    formState: action.formState,
                };
                break;
            // no default
        }
    });
};
