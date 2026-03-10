import type { AnyAction } from '@reduxjs/toolkit';

import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type AnchorType } from './anchors';
import { type RouterPath, type RouterPathOptional } from './router';
import * as ROUTER from './routerConstants';
import { type RouterAppWithParams, type SettingsBackRoute } from './routes';

const ACCOUNT_TABS = [
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

export type RouterAction =
    | {
          type: typeof ROUTER.LOCATION_CHANGE;
          payload: RouterPathOptional & {
              anchor?: AnchorType;
              settingsBackRoute?: SettingsBackRoute;
          } & RouterAppWithParams;
      }
    | {
          type: typeof ROUTER.ANCHOR_CHANGE;
          payload: AnchorType | undefined;
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

export const routerReducer = (
    state: RouterState = initialState,
    action: RouterAction | AnyAction,
): RouterState => {
    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            return {
                ...state,
                loaded: true,
                ...action.payload,
            };
        case ROUTER.ANCHOR_CHANGE:
            return {
                ...state,
                anchor: action.payload,
            };
        default:
            return state;
    }
};

export const selectRouter = (state: RouterRootState) => state.router;
export const selectRouterLoaded = (state: RouterRootState) => state.router.loaded;
export const selectRouterHash = (state: RouterRootState) => state.router.hash;
export const selectRouterAnchor = (state: RouterRootState) => state.router.anchor;
export const selectRoute = (state: RouterRootState): RouterState['route'] => state.router.route;
export const selectRouterParams = (state: RouterRootState) => state.router.params;
export const selectRouteName = (state: RouterRootState) => state.router.route?.name;
export const selectSettingsBackRoute = (state: RouterRootState) => state.router.settingsBackRoute;
export const selectRouterUrl = (state: RouterRootState) =>
    `${state.router.pathname}${state.router.search}${state.router.hash}`;
export const selectURLSearchParams = createMemoizedSelector(
    [state => state.router.search],
    (search): URLSearchParams | null => (search ? new URLSearchParams(search) : null),
);

export const selectIsAccountTabPage = (state: RouterRootState) => {
    const routeName = selectRouteName(state);

    return routeName !== undefined && ACCOUNT_TABS.includes(routeName);
};

export const selectRouterApp = (state: RouterRootState) => state.router.app;
