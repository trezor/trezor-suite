import { RouterAppWithParams, SettingsBackRoute } from '@suite-constants/routes';
import { ROUTER } from '@suite-actions/constants';
import { Action } from '@suite-types';

import type { AnchorType } from '@suite-constants/anchors';

type State = {
    loaded: boolean;
    url: string;
    pathname: string;
    hash?: string;
    settingsBackRoute: SettingsBackRoute;
    anchor?: AnchorType;
} & RouterAppWithParams;

const initialState: State = {
    loaded: false,
    url: '/',
    pathname: '/',
    app: 'unknown',
    route: undefined,
    params: undefined,
    settingsBackRoute: {
        name: 'suite-index',
    },
};

const routerReducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ROUTER.LOCATION_CHANGE: {
            return {
                ...state,
                loaded: true,
                ...action.payload,
            };
        }
        case ROUTER.ANCHOR_CHANGE: {
            return {
                ...state,
                anchor: action.payload,
            };
        }
        default:
            return state;
    }
};

export default routerReducer;
