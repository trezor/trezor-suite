import { LOCATION_CHANGE } from '@suite-actions/routerActions';
import * as routerUtils from '@suite-utils/router';
import { Action } from '@suite-types/index';
import produce from 'immer';

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
    return produce(state, _draft => {
        switch (action.type) {
            case LOCATION_CHANGE:
                return onLocationChange(action.url);
            // no default
        }
    });
};
