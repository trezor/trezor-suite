import { READY, ERROR } from '@suite/actions/SuiteActions';
import { Action } from '@suite/types';

interface SuiteState {
    ready: boolean;
}

const initialState: SuiteState = {
    ready: false,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    switch (action.type) {
        case READY:
            return {
                ready: true,
            };
        case ERROR:
            return {
                ready: false,
            };
        default:
            return state;
    }
};
