import { RouterAppWithParams } from '@suite-constants/routes';
import { ROUTER } from '@suite-actions/constants';
import { getAppWithParams } from '@suite-utils/router';
import { Action } from '@suite-types';

type State = {
    loaded: boolean;
    url: string;
    pathname: string;
    hash?: string;
} & RouterAppWithParams;

const initialState: State = {
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

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            return onLocationChange(action.url);
        default:
            return state;
    }
};
