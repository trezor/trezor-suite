import { produce } from 'immer';
import { type Action as ReduxAction } from 'redux';

import type { Protocol } from '@suite-common/suite-constants';
import { isArrayMember } from '@trezor/utils';

import { PROTOCOL } from 'src/actions/suite/constants';
import { type ProtocolAction } from 'src/actions/suite/protocolActions';

const PROTOCOL_ACTION_TYPES = Object.values(PROTOCOL);

const isProtocolAction = (action: ReduxAction): action is ProtocolAction =>
    isArrayMember(action.type, PROTOCOL_ACTION_TYPES);

export interface SendFormState {
    scheme: Protocol;
    address: string;
    amount?: string;
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

const protocolReducer = (
    state: ProtocolState = initialState,
    action: ReduxAction,
): ProtocolState => {
    if (!isProtocolAction(action)) {
        return state;
    }

    const protocolAction: ProtocolAction = action;

    return produce(state, draft => {
        switch (protocolAction.type) {
            case PROTOCOL.FILL_SEND_FORM:
                draft.sendForm.shouldFill = protocolAction.payload;
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                draft.sendForm.address = protocolAction.payload.address;
                draft.sendForm.scheme = protocolAction.payload.scheme;
                draft.sendForm.amount = protocolAction.payload.amount;
                draft.sendForm.token = protocolAction.payload.token;
                draft.sendForm.tokenAmount = protocolAction.payload.tokenAmount;
                draft.sendForm.shouldFill = false;
                break;
            case PROTOCOL.RESET:
                return initialState;
            // no default
        }
    });
};

export default protocolReducer;
