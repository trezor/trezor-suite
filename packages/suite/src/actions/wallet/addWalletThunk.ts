import { findRoute, goto } from '@suite/router';
import { DEVICE_MODULE_PREFIX } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';

import { asSuiteServices } from 'src/support/extraDependencies';

export const redirectAfterWalletSelectedThunk = createThunk<
    void,
    { forceDeviceDashboard?: boolean } | undefined,
    void
>(
    `${DEVICE_MODULE_PREFIX}/redirectAfterWalletSelectedThunk`,
    async (options, { dispatch, extra }) => {
        const location = asSuiteServices(extra.services).suiteRouterHistory.getLocation();
        const backgroundRoute = findRoute(location.pathname);

        // NOTE: the URL is being static when you switch device like /btc/4/norma
        // when you switch to other device (wallet), there might not be /btc/4, but just /btc/1
        // this causes Account not found error, so we allow this option
        if (options?.forceDeviceDashboard) {
            dispatch(goto({ routeName: 'suite-index' }));

            return;
        }
        // Preserve route for dashboard or wallet context only. Redirect from other routes to dashboard index.
        const isWalletOrDashboardContext =
            backgroundRoute && ['wallet', 'dashboard'].includes(backgroundRoute.app);
        if (!isWalletOrDashboardContext) {
            await dispatch(goto({ routeName: 'suite-index' }));
        }

        // Subpaths of wallet are not available to all account types (e.g. Tokens tab not available to BTC accounts).
        const isWalletSubpath =
            backgroundRoute?.app === 'wallet' && backgroundRoute?.name !== 'wallet-index';
        if (isWalletSubpath) {
            await dispatch(goto({ routeName: 'wallet-index' }));
        }
    },
);

export const openSwitchDeviceDialog = createThunk<void, void, void>(
    `${DEVICE_MODULE_PREFIX}/openSwitchDeviceDialog`,
    (_, { dispatch }) => {
        dispatch(goto({ routeName: 'suite-switch-device', params: { cancelable: true } }));
    },
);
