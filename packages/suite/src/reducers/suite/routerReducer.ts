import { RouterAppWithParams, SettingsBackRoute } from 'src/constants/suite/routes';
import { ROUTER } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import type { AnchorType } from 'src/constants/suite/anchors';
import { ACCOUNT_TABS } from 'src/components/wallet/WalletLayout/AccountTopPanel/AccountNavigation';

export type RouterState = {
    loaded: boolean;
    url: string;
    pathname: string;
    hash?: string;
    settingsBackRoute: SettingsBackRoute; // TODO: Probably not needed with the new router
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

export const selectRouter = (state: RouterRootState) => state.router;
export const selectRouterParams = (state: RouterRootState) => state.router.params;
export const selectRouteName = (state: RouterRootState) => state.router.route?.name;

// TODO: perhaps TabPage is not the most ideal name...
// however currently there are account pages accessible via tabs on the "front page"
// and the rest, like send page or the trade section
export const selectIsAccountTabPage = (state: RouterRootState) => {
    const routeName = selectRouteName(state);

    return routeName !== undefined && ACCOUNT_TABS.includes(routeName);
};

export const selectRouterApp = (state: RouterRootState) => state.router.app;

export default routerReducer;
