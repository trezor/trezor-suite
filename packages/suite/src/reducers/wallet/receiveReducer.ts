// import { UI } from 'trezor-connect';
import produce from 'immer';
import { RECEIVE, ACCOUNT } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';

export interface State {
    isAddressVerified: boolean;
    isAddressUnverified: boolean;
}

export const initialState = {
    isAddressVerified: false,
    isAddressUnverified: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RECEIVE.INIT:
                return action.state;

            case ACCOUNT.DISPOSE:
                return initialState;

            case RECEIVE.SHOW_ADDRESS:
                draft.isAddressVerified = true;
                draft.isAddressUnverified = false;
                break;

            case RECEIVE.HIDE_ADDRESS:
                return initialState;

            case RECEIVE.SHOW_UNVERIFIED_ADDRESS:
                draft.isAddressVerified = false;
                draft.isAddressUnverified = true;
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
