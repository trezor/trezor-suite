import { RouterAppWithParams, SettingsBackRoute } from 'src/constants/suite/routes';
import { ROUTER } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

import type { AnchorType } from 'src/constants/suite/anchors';

export type RouterState = {
    loaded: boolean;
    url: string;
    pathname: string;
    hash?: string;
    settingsBackRoute: SettingsBackRoute;
    anchor?: AnchorType;
} & RouterAppWithParams;

export type RouterRootState = {
    router: RouterState;
};

const initialState: RouterState = {
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

const routerReducer = (state: RouterState = initialState, action: Action): RouterState => {
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

export const selectRouterParams = (state: RouterRootState) => state.router.params;

export const selectRouteName = (state: RouterRootState) => state.router.route?.name;

export default routerReducer;
