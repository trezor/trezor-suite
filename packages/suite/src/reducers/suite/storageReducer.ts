import { SUITE } from '@suite-actions/constants';
import produce from 'immer';
import { Action } from '@suite-types';

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

const storageReducer = (state: SuiteState = initialState, action: Action): SuiteState => {
    return produce(state, draft => {
        switch (action.type) {
            case SUITE.INIT:
                return initialState;
            case SUITE.READY:
                draft.loading = false;
                draft.loaded = true;
                draft.error = null;
                break;
            case SUITE.ERROR:
                draft.loading = false;
                draft.loaded = false;
                draft.error = action.error;
            // no default
        }
    });
};

export default storageReducer;
