import { connectPopupCallThunkInner } from '@suite-common/connect-popup';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import {
    accountsActions,
    changeNetworks,
    deviceActions,
    runAdditionalDiscoveryThunk,
    selectSelectedDevice,
    selectShouldRediscoverNetworks,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';

import { SUITE } from 'src/actions/suite/constants';
import { selectIsDeviceLocked } from 'src/reducers/suite/suiteReducer';

// todo: this is crazy. needs some consideration
export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState, extra }) => {
        const prevState = getState();

        // Pass action to next middleware, meaning that the code below runs *only after* the action has been completely processed in Redux.
        // Note: TS says next(action) generally isn't async, but the action may return anything; sometimes it's a Promise → needs to be awaited
        await next(action);

        const nextState = getState();
        if (nextState.router.app !== 'wallet' && nextState.router.app !== 'dashboard')
            return action;

        const device = selectSelectedDevice(nextState);
        const isDeviceLocked = selectIsDeviceLocked(nextState);
        // 1. selected device is acquired but doesn't have a state

        // 2. selected device becomes acquired from unacquired or connected from disconnected
        let becomesAcquired = false;
        let becomesConnected = false;
        if (deviceActions.updateSelectedDevice.match(action)) {
            const prevDevice = prevState.device.selectedDevice;
            becomesAcquired = !!(prevDevice && !prevDevice.features && device && device.features);
            becomesConnected = !!(
                prevDevice &&
                !prevDevice.connected &&
                device &&
                device.connected
            );
        }

        // device becomesAcquired (device-change event) and is locked at the same time.
        // device-change is emitted right before acquireDevice ends (and unlocks)
        const isDeviceReady =
            device?.connected && isDeviceAcquired(device) && (!isDeviceLocked || becomesAcquired);

        if (
            becomesAcquired ||
            becomesConnected ||
            action.type === SUITE.APP_CHANGED ||
            connectPopupCallThunkInner.fulfilled.match(action) ||
            deviceActions.selectDevice.match(action) ||
            changeNetworks.match(action) ||
            accountsActions.changeAccountVisibility.match(action)
        ) {
            if (isDeviceReady) {
                if (!device?.state) {
                    // note: currently this is only used in Suite. If a Suite Lite implementation is needed,
                    // refactor this to a parameter because suiteSettings is a suite-only reducer.
                    const isAddingHiddenWalletWithRespectToSettings =
                        extra.selectors.selectSuiteSettings(getState()).defaultWalletLoading ===
                        'passphrase';

                    dispatch(
                        startDiscoveryThunk({
                            device,
                            isAddingHiddenWalletWithRespectToSettings,
                            isAddingExistingWallet: true,
                            isAddingHiddenWallet: isAddingHiddenWalletWithRespectToSettings,
                        }),
                    );
                } else if (device.state.staticSessionId) {
                    const shouldRediscover = selectShouldRediscoverNetworks(
                        getState(),
                        device.state.staticSessionId,
                    );

                    if (shouldRediscover) {
                        dispatch(runAdditionalDiscoveryThunk(device.state.staticSessionId));
                    }
                }
            }
        }

        return action;
    },
);
