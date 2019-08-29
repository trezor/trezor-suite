import { WALLET } from '@wallet-actions/constants';
import produce from 'immer';
import { Action } from '@suite-types';

export interface SuiteState {
    loading: boolean;
    loaded: boolean;
    error: string | null;
}

const initialState: SuiteState = {
    loading: false,
    loaded: false,
    error: null,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    return produce(state, draft => {
        switch (action.type) {
            case WALLET.INIT:
                return initialState;

            case WALLET.INIT_SUCCESS:
                draft.loading = false;
                draft.loaded = true;
                draft.error = null;
                break;

            case WALLET.INIT_FAIL:
                draft.loading = false;
                draft.loaded = false;
                draft.error = action.error;
                break;
            // no default
        }
    });
};
