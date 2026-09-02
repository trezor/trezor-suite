import { type UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import type { Protocol } from '@trezor/network-module-suite-common-types';

import { fillSendForm, resetProtocol, saveCoinProtocol } from 'src/actions/suite/protocolActions';

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

const protocolReducer = (
    state: ProtocolState = initialState,
    action: UnknownAction,
): ProtocolState =>
    produce(state, draft => {
        if (fillSendForm.match(action)) {
            draft.sendForm.shouldFill = action.payload;
        } else if (saveCoinProtocol.match(action)) {
            draft.sendForm.address = action.payload.address;
            draft.sendForm.scheme = action.payload.scheme;
            draft.sendForm.amount = action.payload.amount;
            draft.sendForm.label = action.payload.label;
            draft.sendForm.token = action.payload.token;
            draft.sendForm.tokenAmount = action.payload.tokenAmount;
            draft.sendForm.shouldFill = false;
        } else if (resetProtocol.match(action)) {
            return initialState;
        }
    });

export default protocolReducer;
