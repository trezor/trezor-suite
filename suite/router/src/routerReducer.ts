import { type PayloadAction, createAction, createSlice } from '@reduxjs/toolkit';

import { LocksRootState, selectIsRouterOrUiLocked } from '@suite/locks';
import { ModalRootState, selectHasActiveModal } from '@suite/modal';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type AnchorType } from './anchors';
import { type RouterPath, type RouterPathOptional } from './router';
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

export const ROUTER_PREFIX = 'router';

export type RouterState = RouterPath & {
    loaded: boolean;
    settingsBackRoute: SettingsBackRoute; // TODO: Probably not needed with the new router
    anchor?: AnchorType;
} & RouterAppWithParams;

export type RouterRootState = {
    router: RouterState;
};

export type LocationChangePayload = RouterPathOptional & {
    anchor?: AnchorType;
    settingsBackRoute?: SettingsBackRoute;
} & RouterAppWithParams;

const createMemoizedSelector = createWeakMapSelector.withTypes<RouterRootState>();

// This action is meant only as an event. Actually no state changes here, it's used as an event and middlewares react to it throughout suite packages.
export const routerAppChanged = createAction(
    '@router/appChanged',
    (payload: RouterAppWithParams['app']) => ({
        payload,
    }),
);

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

export const routerSlice = createSlice({
    name: ROUTER_PREFIX,
    initialState: initialState as RouterState,
    reducers: {
        routerLocationChange: (state, action: PayloadAction<LocationChangePayload>) => {
            state.loaded = true;
            Object.assign(state, action.payload);
        },
        anchorChange: (state, action: PayloadAction<AnchorType | undefined>) => {
            state.anchor = action.payload;
        },
    },
});

export const routerReducer = routerSlice.reducer;
export const { routerLocationChange, anchorChange } = routerSlice.actions;

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

export const selectCanNavigate = (state: LocksRootState & ModalRootState) =>
    !selectIsRouterOrUiLocked(state) && !selectHasActiveModal(state);

export type RouterAction =
    | {
          type: typeof routerLocationChange.type;
          payload: RouterPathOptional & {
              anchor?: AnchorType;
              settingsBackRoute?: SettingsBackRoute;
          } & RouterAppWithParams;
      }
    | {
          type: typeof anchorChange.type;
          payload: AnchorType | undefined;
      }
    | ReturnType<typeof routerAppChanged>;
