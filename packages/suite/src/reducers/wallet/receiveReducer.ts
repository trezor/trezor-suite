import { UI } from 'trezor-connect';
import produce from 'immer';
import { ACCOUNT, RECEIVE } from '@wallet-actions/constants';
import { Action } from '@suite-types/index';

export interface State {
    addressVerified: boolean;
    addressUnverified: boolean;
}

const initialState = {
    addressVerified: false,
    addressUnverified: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RECEIVE.INIT:
                return action.state;

            case ACCOUNT.DISPOSE:
                return initialState;

            case RECEIVE.SHOW_ADDRESS:
                draft.addressVerified = true;
                draft.addressUnverified = false;
                break;

            case RECEIVE.HIDE_ADDRESS:
                return initialState;

            case RECEIVE.SHOW_UNVERIFIED_ADDRESS:
                draft.addressVerified = false;
                draft.addressUnverified = true;
                break;

            case UI.REQUEST_BUTTON:
                if (action.payload.code === 'ButtonRequest_Address') {
                    draft.addressVerified = true;
                }
            // no default
        }
    });
};
