import { ROUTER } from '@suite-actions/constants';
import { getAppWithParams } from '@suite-utils/router';
import type { RouterAppWithParams } from '@suite-constants/routes';
import type { Action } from '@suite-types';

type RouterState = {
    loaded: boolean;
    url: string;
    pathname: string;
    hash?: string;
} & RouterAppWithParams;

const initialState: RouterState = {
    loaded: false,
    url: '/',
    pathname: '/',
    app: 'unknown',
    route: undefined,
    params: undefined,
};

const onLocationChange = (url: string) => {
    const [pathname, hash] = url.split('#');
    return {
        loaded: true,
        url,
        pathname,
        hash,
        ...getAppWithParams(url),
    };
};

const routerReducer = (state: RouterState = initialState, action: Action): RouterState => {
    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            return onLocationChange(action.url);
        default:
            return state;
    }
};

export default routerReducer;
