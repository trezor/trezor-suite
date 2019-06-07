import {
    FETCH_START,
    FETCH_SUCCESS,
    FETCH_ERROR,
    FetchReducer,
    FetchActionTypes,
} from '@suite/types/onboarding/fetch';

const initialState: FetchReducer = {
    name: null,
    isProgress: false,
    error: null,
    result: null,
};

const fetch = (state: FetchReducer = initialState, action: FetchActionTypes): FetchReducer => {
    switch (action.type) {
        case FETCH_START:
            return {
                ...state,
                name: action.name,
                isProgress: true,
            };
        case FETCH_SUCCESS:
            return {
                ...state,
                isProgress: false,
                error: null,
                result: action.result,
            };
        case FETCH_ERROR:
            return {
                ...state,
                isProgress: false,
                error: action.error,
                result: null,
            };
        default:
            return state;
    }
};

export default fetch;
