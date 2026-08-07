import { produce } from 'immer';

import type { Protocol } from '@trezor/network-module-suite-common-types';

import { PROTOCOL } from 'src/actions/suite/constants';
import type { Action } from 'src/types/suite';

export interface SendFormState {
    scheme: Protocol;
    address: string;
    amount?: string;
    label?: string;
    token?: string; // ERC-681: token contract address
    tokenAmount?: string; // ERC-681: amount in token's smallest unit (uint256)
}

type Autofill<T> = Partial<T> & {
    shouldFill?: boolean;
};

export interface ProtocolState {
    sendForm: Autofill<SendFormState>;
}

export const initialState: ProtocolState = {
    sendForm: {},
};

const protocolReducer = (state: ProtocolState = initialState, action: Action): ProtocolState =>
    produce(state, draft => {
        switch (action.type) {
            case PROTOCOL.FILL_SEND_FORM:
                draft.sendForm.shouldFill = action.payload;
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                draft.sendForm.address = action.payload.address;
                draft.sendForm.scheme = action.payload.scheme;
                draft.sendForm.amount = action.payload.amount;
                draft.sendForm.label = action.payload.label;
                draft.sendForm.token = action.payload.token;
                draft.sendForm.tokenAmount = action.payload.tokenAmount;
                draft.sendForm.shouldFill = false;
                break;
            case PROTOCOL.RESET:
                return initialState;
            // no default
        }
    });

export default protocolReducer;
