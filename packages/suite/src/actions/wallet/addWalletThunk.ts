import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInstances } from '@suite-common/suite-utils';
import {
    DEVICE_MODULE_PREFIX,
    createDeviceInstanceThunk,
    deviceActions,
    selectDeviceThunk,
    selectDevices,
} from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';

import { getBackgroundRoute } from 'src/utils/suite/router';

import { goto } from '../suite/routerActions';

export const redirectAfterWalletSelectedThunk = createThunk<void, void, void>(
    `${DEVICE_MODULE_PREFIX}/redirectAfterWalletSelectedThunk`,
    async (_, { dispatch }) => {
        const backgroundRoute = getBackgroundRoute();
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
    },
);

export const addWalletThunk = createThunk<
    void,
    { walletType: WalletType; device: TrezorDevice },
    void
>(`${DEVICE_MODULE_PREFIX}/addWalletThunk`, ({ walletType, device }, { dispatch, getState }) => {
    const addDeviceInstance = async () => {
        await dispatch(
            createDeviceInstanceThunk({
                device,
                useEmptyPassphrase: walletType === WalletType.STANDARD,
            }),
        );
    };

    const selectDeviceInstance = ({ device }: { device: TrezorDevice }) => {
        dispatch(
            deviceActions.updatePassphraseMode({
                device,
                hidden: walletType === WalletType.PASSPHRASE,
            }),
        );
        dispatch(selectDeviceThunk({ device }));
    };

    const devices = selectDevices(getState());
    const instances = getDeviceInstances(device, devices);
    const hasAtLeastOneWallet = instances.find(d => d.state) !== undefined;

    if (hasAtLeastOneWallet) {
        addDeviceInstance();
    } else {
        selectDeviceInstance({ device: instances[0] });
    }
    dispatch(redirectAfterWalletSelectedThunk());
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
