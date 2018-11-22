/* @flow */
import type { Action } from 'flowtype';

import * as ACCOUNT from 'actions/constants/account';
import * as ACTION from 'actions/constants/signVerify';

export type State = {
    signAddress: string,
    signMessage: string,
    signSignature: string,
    verifyAddress: string,
    verifyMessage: string,
    verifySignature: string,
    touched: Array<string>
}

export const initialState: State = {
    signAddress: '',
    signMessage: '',
    signSignature: '',
    verifyAddress: '',
    verifyMessage: '',
    verifySignature: '',
    touched: [],
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACTION.SIGN_SUCCESS:
            return {
                ...state,
                signSignature: action.signSignature,
            };

        case ACTION.TOUCH: {
            if (!state.touched.includes(action.name)) {
                return {
                    ...state,
                    touched: [...state.touched, action.name],
                };
            }
            return state;
        }

        case ACTION.INPUT_CHANGE: {
            const change = { [action.name]: action.value };
            return { ...state, ...change };
        }

        case ACCOUNT.DISPOSE:
            return initialState;

        case ACTION.CLEAR_SIGN:
            return {
                ...state,
                signAddress: '',
                signMessage: '',
                signSignature: '',
            };

        case ACTION.CLEAR_VERIFY:
            return {
                ...state,
                verifyAddress: '',
                verifyMessage: '',
                verifySignature: '',
            };

        default:
            return state;
    }
};