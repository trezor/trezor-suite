/* @flow */
import type { Action } from 'flowtype';
import * as ACTION from 'actions/constants/signVerify';

export type State = {
    signAddress: string,
    signMessage: string,
    signSignature: string,
    verifyAddress: string,
    verifyMessage: string,
    verifySignature: string,
    touched: Array<String>
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
                ...initialState,
                signature: action.signature,
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
            const changes = { [action.name]: action.value };
            return { ...state, ...changes };
        }

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