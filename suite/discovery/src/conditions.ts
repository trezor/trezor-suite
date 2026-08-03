import { type RouterRootState, selectRouterApp } from '@suite/router';

import { SHOULD_ROUTER_APP_START_DISCOVERY } from './config';

export const selectShouldRouterAppStartDiscovery = (state: RouterRootState) =>
    SHOULD_ROUTER_APP_START_DISCOVERY[selectRouterApp(state)];
