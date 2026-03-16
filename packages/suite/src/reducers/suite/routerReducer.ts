import { createWeakMapSelector } from '@suite-common/redux-utils';

import { ROUTER } from 'src/actions/suite/constants';
import type { AnchorType } from 'src/constants/suite/anchors';
import { RouterAppWithParams, SettingsBackRoute } from 'src/constants/suite/routes';
import { Action } from 'src/types/suite';
import type { RouterPath } from 'src/utils/suite/router';

export const ACCOUNT_TABS = [
    'wallet-index',
    'wallet-details',
    'wallet-tokens',
    'wallet-nfts',
    'wallet-nfts-hidden',
    'wallet-tokens-hidden',
    'wallet-tokens-inactive',
    'wallet-staking',
];

export type RouterState = RouterPath & {
    loaded: boolean;
    settingsBackRoute: SettingsBackRoute; // TODO: Probably not needed with the new router
    anchor?: AnchorType;
} & RouterAppWithParams;

export type RouterRootState = {
    router: RouterState;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<RouterRootState>();

const initialState: RouterState = {
    loaded: false,
    pathname: '/',
    hash: '',
    search: '',
    app: 'unknown',
    route: undefined,
    params: undefined,
    settingsBackRoute: {
        name: 'suite-index',
    },
};

export const routerInitialState = initialState;

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

export const selectRouter = (state: RouterRootState) => state.router;
export const selectRoute = (state: RouterRootState): RouterState['route'] => state.router.route;
export const selectRouterParams = (state: RouterRootState) => state.router.params;
export const selectRouteName = (state: RouterRootState) => state.router.route?.name;
export const selectRouterUrl = (state: RouterRootState) =>
    `${state.router.pathname}${state.router.search}${state.router.hash}`;
export const selectURLSearchParams = createMemoizedSelector(
    [state => state.router.search],
    (search): URLSearchParams | null => (search ? new URLSearchParams(search) : null),
);

// TODO: perhaps TabPage is not the most ideal name...
// however currently there are account pages accessible via tabs on the "front page"
// and the rest, like send page or the trade section
export const selectIsAccountTabPage = (state: RouterRootState) => {
    const routeName = selectRouteName(state);

    return routeName !== undefined && ACCOUNT_TABS.includes(routeName);
};

export const selectRouterApp = (state: RouterRootState) => state.router.app;

export default routerReducer;
