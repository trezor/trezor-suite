import produce from 'immer';
import { PROTOCOL } from '@suite-actions/constants';
import type { Action } from '@suite-types';
import type { PROTOCOL_SCHEME } from '@suite-constants/protocol';

export interface SendFormState {
    scheme: PROTOCOL_SCHEME;
    address: string;
    amount?: number;
}

type Autofill<T> = Partial<T> & {
    shouldFill?: boolean;
};

export interface State {
    sendForm: Autofill<SendFormState>;
}

export const initialState: State = {
    sendForm: {},
};

const protocolReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case PROTOCOL.FILL_SEND_FORM:
                draft.sendForm.shouldFill = action.payload;
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                draft.sendForm.address = action.payload.address;
                draft.sendForm.scheme = action.payload.scheme;
                draft.sendForm.amount = action.payload.amount;
                draft.sendForm.shouldFill = false;
                break;
            case PROTOCOL.RESET:
                return initialState;
            // no default
        }
    });

export default protocolReducer;
