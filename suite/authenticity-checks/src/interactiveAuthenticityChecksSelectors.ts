import { type RouterRootState, selectRouterApp } from '@suite/router';

import { SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS } from './config';

export const selectShouldRouterAppSkipInteractiveDeviceChecks = (state: RouterRootState): boolean =>
    SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS[selectRouterApp(state)];
