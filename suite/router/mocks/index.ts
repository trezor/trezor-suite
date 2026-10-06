import { type OptionalKey } from '@trezor/type-utils';

import { type RouterState, routerReducer } from '../src/routerReducer';

export { mockSuiteRouterHistory } from './mockSuiteRouterHistory';

const TEST_INIT_ACTION = { type: '@tests/init' };

export type RouterStateOverrides = OptionalKey<RouterState, keyof RouterState>;

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
