// import { UI } from 'trezor-connect';
import produce from 'immer';
import { RECEIVE } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';

export interface State {
    addressVerified: boolean;
    addressUnverified: boolean;
}

export const initialState = {
    addressVerified: false,
    addressUnverified: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RECEIVE.INIT:
                return action.state;

            // TODO: uncomment once we have AccountActions
            // case ACCOUNT.DISPOSE:
            //     return initialState;

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

            // @ts-ignore
            // need fix in connect?
            // case UI.REQUEST_BUTTON:
            //     if (action.payload.code === 'ButtonRequest_Address') {
            //         draft.addressVerified = true;
            //     }
            // no default
        }
    });
};
