/**
 * Use override for react-native (@suite-native/app/src/actions)
 */

import {
    type AnchorType,
    RouterAppWithParams,
    RouterPathOptional,
    SettingsBackRoute,
    anchorChange,
    findRoute,
    goto,
    routerAppChanged,
    routerLocationChange,
} from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';

import { asSuiteServices } from 'src/support/extraDependencies';

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

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to requested modal app or welcome screen if `suite.flags.initialRun` is set to true
 */
export const initialRedirection = createThunk(
    '@suite/initial-redirection',
    (_, { dispatch, getState, extra }) => {
        const location = asSuiteServices(extra.services).suiteRouterHistory.getLocation();
        const route = findRoute(location.pathname);

        const { initialRun } = getState().suite.flags;
        // only do initial redirection of route is valid
        // otherwise do nothing -> just show 404 page
        if (!route) {
            return;
        }

        if (route.isForegroundApp) {
            dispatch(goto({ routeName: route.name }));
        } else if (initialRun) {
            dispatch(goto({ routeName: 'suite-start' }));
        }
    },
);
