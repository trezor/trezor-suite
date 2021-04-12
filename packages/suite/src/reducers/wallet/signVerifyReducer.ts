import produce from 'immer';
import { SIGN_VERIFY } from '@wallet-actions/constants';
import { WalletAction } from '@wallet-types';

interface Error {
    inputName: string;
    message?: string;
}

interface State {
    signAddress: string;
    signMessage: string;
    signSignature: string;
    verifyAddress: string;
    verifyMessage: string;
    verifySignature: string;
    touched: string[];
    errors: Error[];
}

export const initialState: State = {
    signAddress: '',
    signMessage: '',
    signSignature: '',
    verifyAddress: '',
    verifyMessage: '',
    verifySignature: '',
    touched: [],
    errors: [],
};

const signVerifyReducer = (state: State = initialState, action: WalletAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case SIGN_VERIFY.SIGN_SUCCESS:
                draft.signSignature = action.signSignature;
                break;

            case SIGN_VERIFY.ERROR:
                if (!state.errors.some(e => e.inputName === action.inputName)) {
                    const error = {
                        inputName: action.inputName,
                        message: action.message,
                    };
                    draft.errors.push(error);
                }
                break;

            case SIGN_VERIFY.TOUCH:
                if (!state.touched.includes(action.inputName)) {
                    draft.touched.push(action.inputName);
                    // reset errors for the input even if it was not touched before
                    draft.errors = state.errors.filter(
                        error => error.inputName !== action.inputName,
                    );
                }
                draft.errors = draft.errors.filter(error => error.inputName !== action.inputName);
                break;

            case SIGN_VERIFY.INPUT_CHANGE:
                draft[action.inputName] = action.value;
                break;

            case SIGN_VERIFY.CLEAR_SIGN:
                draft.signAddress = '';
                draft.signMessage = '';
                draft.signSignature = '';
                break;

            case SIGN_VERIFY.CLEAR_VERIFY:
                draft.verifyAddress = '';
                draft.verifyMessage = '';
                draft.verifySignature = '';
                break;

            // no default
        }
    });

export default signVerifyReducer;
