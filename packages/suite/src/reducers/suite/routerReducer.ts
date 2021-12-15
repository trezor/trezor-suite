import { RouterAppWithParams, SettingsBackRoute } from '@suite-constants/routes';
import { ROUTER } from '@suite-actions/constants';
import { Action } from '@suite-types';

type State = {
    loaded: boolean;
    url: string;
    pathname: string;
    hash?: string;
    settingsBackRoute: SettingsBackRoute;
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
        default:
            return state;
    }
};

export default routerReducer;
