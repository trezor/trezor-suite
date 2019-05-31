import { LOCATION_CHANGE } from '@suite/actions/routerActions';
import * as routerUtils from '@suite/utils/router';
import { Action } from '@suite/types';

interface Params {
    [key: string]: string;
}

interface RouterState {
    url: string;
    pathname: string;
    hash?: string;
    params: Params;
    app: string;
}

const initialState: RouterState = {
    url: '/',
    pathname: '/',
    params: {},
    app: '/',
};

const onLocationChange = (url: string) => {
    const [pathname, hash] = url.split('#');
    return {
        url,
        pathname,
        hash,
        params: routerUtils.getParams(url),
        app: routerUtils.getApp(url),
    };
};

export default (state: RouterState = initialState, action: Action): RouterState => {
    switch (action.type) {
        case LOCATION_CHANGE:
            return onLocationChange(action.url);
        default:
            return state;
    }
};
