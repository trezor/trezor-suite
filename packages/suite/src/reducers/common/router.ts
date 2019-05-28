import { LOCATION_CHANGE } from '@suite/actions/routerActions';
import { Action } from '@suite/types';

interface RouterState {
    pathname: string | undefined;
    params: any;
}

const initialState: RouterState = {
    pathname: undefined,
    params: {},
};

const onLocationChange = (pathname: string) => {
    // TODO:
    // - add more fields (ulr, hash)
    // - parse hash to params
    return {
        pathname,
        params: {},
    };
};

export default (state: RouterState = initialState, action: Action): RouterState => {
    switch (action.type) {
        case LOCATION_CHANGE:
            return onLocationChange(action.pathname);
        default:
            return state;
    }
};
