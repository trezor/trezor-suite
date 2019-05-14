import { INIT, READY, ERROR } from '@suite/actions/SuiteActions';
import { Action } from '@suite/types';

interface SuiteState {
    loading: boolean;
    loaded: boolean;
    error: string | null;
}

const initialState: SuiteState = {
    loading: true,
    loaded: false,
    error: null,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    switch (action.type) {
        case INIT:
            return initialState;
        case READY:
            return {
                loading: false,
                loaded: true,
                error: null,
            };
        case ERROR:
            return {
                loading: false,
                loaded: false,
                error: action.error,
            };
        default:
            return state;
    }
};
