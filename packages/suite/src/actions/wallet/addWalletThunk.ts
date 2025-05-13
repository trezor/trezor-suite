import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInstances } from '@suite-common/suite-utils';
import {
    DEVICE_MODULE_PREFIX,
    createDeviceInstanceThunk,
    deviceActions,
    selectDeviceThunk,
    selectDevices,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';

import { getBackgroundRoute } from 'src/utils/suite/router';

import { getDiscoveryStatus } from '../../utils/wallet/getDiscoveryStatus';
import { goto } from '../suite/routerActions';

export const redirectAfterWalletSelectedThunk = createThunk<
    void,
    { forceDeviceDashboard?: boolean } | undefined,
    void
>(`${DEVICE_MODULE_PREFIX}/redirectAfterWalletSelectedThunk`, async (options, { dispatch }) => {
    const backgroundRoute = getBackgroundRoute();

    // NOTE: the URL is being static when you switch device like /btc/4/norma
    // when you switch to other device (wallet), there might not be /btc/4, but just /btc/1
    // this causes Account not found error, so we allow this option
    if (options?.forceDeviceDashboard) {
        dispatch(goto('suite-index'));

        return;
    }
    // Preserve route for dashboard or wallet context only. Redirect from other routes to dashboard index.
    const isWalletOrDashboardContext =
        backgroundRoute && ['wallet', 'dashboard'].includes(backgroundRoute.app);
    if (!isWalletOrDashboardContext) {
        await dispatch(goto('suite-index'));
    }

    // Subpaths of wallet are not available to all account types (e.g. Tokens tab not available to BTC accounts).
    const isWalletSubpath =
        backgroundRoute?.app === 'wallet' && backgroundRoute?.name !== 'wallet-index';
    if (isWalletSubpath) {
        await dispatch(goto('wallet-index'));
    }
});

export const openSwitchDeviceDialog = createThunk<void, void, void>(
    `${DEVICE_MODULE_PREFIX}/openSwitchDeviceDialog`,
    (_, { dispatch }) => {
        dispatch(
            goto('suite-switch-device', {
                params: {
                    cancelable: true,
                },
            }),
        );
    },
);
