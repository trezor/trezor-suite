import {
    fetchResource,
    getFirmware,
    getLocalization,
} from '@suite/actions/onboarding/fetchActions';

export interface FetchReducer {
    name: null | string;
    isProgress: boolean;
    error: null | string;
    result: null | Record<string, any>;
}

export interface FetchActions {
    fetchResource: typeof fetchResource;
    getFirmware: typeof getFirmware;
    getLocalization: typeof getLocalization;
}

export const FETCH_START = '@onboarding/fetch-start';
export const FETCH_SUCCESS = '@onboarding/fetch-success';
export const FETCH_ERROR = '@onboarding/fetch-error';

interface FetchStartAction {
    type: typeof FETCH_START;
    name: string;
}

interface FetchSuccessAction {
    type: typeof FETCH_SUCCESS;
    result: Record<string, any>;
}

interface FetchErrorAction {
    type: typeof FETCH_ERROR;
    error: string;
}

export type FetchActionTypes = FetchStartAction | FetchSuccessAction | FetchErrorAction;
