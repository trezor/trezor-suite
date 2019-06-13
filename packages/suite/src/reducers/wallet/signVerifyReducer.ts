import * as ACTION from '@wallet-actions/constants';

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

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACTION.SIGN_SUCCESS:
            return {
                ...state,
                signSignature: action.signSignature,
            };

        case ACTION.ERROR: {
            const { inputName } = action;
            if (!state.errors.some(e => e.inputName === inputName)) {
                const error = {
                    inputName,
                    message: action.message,
                };
                return {
                    ...state,
                    errors: [...state.errors, error],
                };
            }
            return state;
        }

        case ACTION.TOUCH: {
            const { inputName } = action;
            if (!state.touched.includes(inputName)) {
                return {
                    ...state,
                    touched: [...state.touched, action.inputName],
                    // reset errors for the input even if it was not touched before
                    errors: state.errors.filter(error => error.inputName !== inputName),
                };
            }
            return {
                ...state,
                errors: state.errors.filter(error => error.inputName !== inputName),
            };
        }

        case ACTION.INPUT_CHANGE: {
            const change = {
                [action.inputName]: action.value,
            };
            return {
                ...state,
                ...change,
            };
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
