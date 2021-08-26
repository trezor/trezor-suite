import produce from 'immer';
import { PROTOCOL } from '@suite-actions/constants';
import { Action } from '@suite-types';

export interface State {
    sendForm: {
        address?: string;
        amount?: number;
        scheme?: 'bitcoin';
        shouldFillSendForm?: boolean;
    };
}

export const initialState: State = {
    sendForm: {},
};

const protocolReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case PROTOCOL.FILL_SEND_FORM:
                draft.sendForm.shouldFillSendForm = action.payload;
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                draft.sendForm.address = action.payload.address;
                draft.sendForm.amount = action.payload.amount;
                draft.sendForm.scheme = action.payload.scheme;
                draft.sendForm.shouldFillSendForm = false;
                break;
            case PROTOCOL.RESET:
                return initialState;
            // no default
        }
    });

export default protocolReducer;
