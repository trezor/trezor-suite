import { SUITE } from '@suite-actions/constants';
import { Action } from '@suite-types/index';

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
        case SUITE.INIT:
            return initialState;
        case SUITE.READY:
            return {
                loading: false,
                loaded: true,
                error: null,
            };
        case SUITE.ERROR:
            return {
                loading: false,
                loaded: false,
                error: action.error,
            };
        default:
            return state;
    }
};
