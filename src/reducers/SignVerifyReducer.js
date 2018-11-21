/* @flow */
import type { Action } from 'flowtype';
import * as SIGN_VERIFY from 'actions/constants/signVerify';

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
        case SIGN_VERIFY.SIGN_SUCCESS:
            return {
                ...initialState,
                signature: action.signature,
            };

        case SIGN_VERIFY.TOUCH: {
            if (!state.touched.includes(action.name)) {
                return {
                    ...state,
                    touched: [...state.touched, action.name],
                };
            }
            return state;
        }

        case SIGN_VERIFY.INPUT_CHANGE: {
            const changes = { [action.name]: action.value };
            return { ...state, ...changes };
        }

        case SIGN_VERIFY.CLEAR:
            return {
                ...initialState,
            };

        default:
            return state;
    }
};