import produce from 'immer';
import { ROUTER } from '@suite-actions/constants';
import { ParamsProps, getApp, getParams } from '@suite-utils/router';
import { Action } from '@suite-types';

interface State {
    url: string;
    pathname: string;
    hash?: string;
    params: ParamsProps;
    app: ReturnType<typeof getApp>;
}

const initialState: State = {
    url: '/',
    pathname: '/',
    params: {},
    app: 'unknown',
};

const onLocationChange = (draft: State, url: string) => {
    const [pathname, hash] = url.split('#');
    draft.url = url;
    draft.pathname = pathname;
    draft.hash = hash;
    draft.params = getParams(url);
    draft.app = getApp(url);
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ROUTER.LOCATION_CHANGE:
                onLocationChange(draft, action.url);
                break;
            // no default
        }
    });
};
