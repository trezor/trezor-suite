import { type WalletParams } from '@suite-common/wallet-types';
import { type OptionalKey } from '@trezor/type-utils';

import { getRoute } from '../src/router';
import { type LocationChangePayload, type RouterState, routerReducer } from '../src/routerReducer';

export { mockSuiteRouterHistory } from './mockSuiteRouterHistory';

const TEST_INIT_ACTION = { type: '@tests/init' };

export type RouterStateOverrides = OptionalKey<RouterState, keyof RouterState>;

type RouteName = NonNullable<LocationChangePayload['route']>['name'];

// RouterState is a large discriminated union. Letting object-spread inference merge its members
// with overrides creates thousands of possible object types. Applying overrides after the initial
// state is contextually typed preserves selective overrides while returning the original union.
export const createRouterStateMock = (overrides?: RouterStateOverrides): RouterState => {
    const state: RouterState = {
        ...routerReducer(undefined, TEST_INIT_ACTION),
    };

    if (overrides) {
        Object.assign(state, overrides);
    }

    return state;
};

export const getRequiredRoute = <TName extends RouteName>(name: TName) => {
    const route = getRoute(name);

    if (!route) {
        throw new Error(`Missing route ${name}`);
    }

    return route as Extract<NonNullable<LocationChangePayload['route']>, { name: TName }>;
};

export const createRouterStateMockForRoute = (
    name: RouteName,
    params?: WalletParams,
): RouterState => {
    const route = getRequiredRoute(name);

    return createRouterStateMock({
        app: route.app,
        route,
        params,
        pathname: route.pattern,
        loaded: true,
    });
};
