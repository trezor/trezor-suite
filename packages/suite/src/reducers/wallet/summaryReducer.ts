import produce from 'immer';
// import { SUMMARY, ACCOUNT } from '@wallet-actions/constants';
import { SUMMARY } from '@wallet-actions/constants';
import { Action } from '@suite-types/index';
import { NetworkToken } from '@wallet-types/index';

export interface State {
    details: boolean;
    selectedToken?: NetworkToken | null;
}

export const initialState: State = {
    details: true,
    selectedToken: null,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            // case ACCOUNT.DISPOSE:
            //     return initialState;

            case SUMMARY.INIT:
                draft.details = action.payload.details;
                draft.selectedToken = action.payload.selectedToken;
                break;

            case SUMMARY.DISPOSE:
                return initialState;

            case SUMMARY.DETAILS_TOGGLE:
                draft.details = !state.details;
                break;

            default:
                return state;
        }
    });
};
