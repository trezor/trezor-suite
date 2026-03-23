import { selectIsDeviceLocked } from '@suite/locks';
import { routerAppChanged } from '@suite/router';
import { connectPopupCallThunkInner } from '@suite-common/connect-popup';
import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectThpAutoconnectStep, thpActions } from '@suite-common/thp';
import {
    accountsActions,
    changeNetworks,
    selectShouldRediscover,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';

// todo: this is crazy. needs some consideration
export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState }) => {
        const prevState = getState();

        // Pass action to next middleware, meaning that the code below runs *only after* the action has been completely processed in Redux.
        // Note: TS says next(action) generally isn't async, but the action may return anything; sometimes it's a Promise → needs to be awaited
        await next(action);

        const nextState = getState();
        if (
            nextState.router.app !== 'wallet' &&
            nextState.router.app !== 'dashboard' &&
            nextState.router.app !== 'earn'
        )
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

        // delay discovery if THP Autoconnect modal is open (discovery executed by the modal), as it is the only
        // THP step that takes place *after* device acquisition, and also needs device interaction to complete.
        const isTHPAutoconnectModal = selectThpAutoconnectStep(getState()) === 'AutoconnectInfo';
        const isTHPAutoconnectFinished = thpActions.finishAutoconnectFlow.match(action);
        const isUIReady = !isTHPAutoconnectModal;

        if (
            becomesAcquired ||
            becomesConnected ||
            isTHPAutoconnectFinished ||
            action.type === routerAppChanged.type ||
            connectPopupCallThunkInner.fulfilled.match(action) ||
            deviceActions.selectDevice.match(action) ||
            changeNetworks.match(action) ||
            accountsActions.updateAccount.match(action) || // empty account can become nonempty
            accountsActions.changeAccountVisibility.match(action)
        ) {
            if (isDeviceReady && isUIReady) {
                const shouldRediscover = selectShouldRediscover(getState(), device);
                if (shouldRediscover) {
                    dispatch(startOrRestartDiscoveryThunk());
                }
            }
        }

        return action;
    },
);
