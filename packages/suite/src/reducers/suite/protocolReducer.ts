import { type UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { fillSendForm, resetProtocol, saveCoinProtocol } from '#src/actions/suite/protocolActions';

import { type ProtocolState } from './protocolState';

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
