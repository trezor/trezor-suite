import { connectPopupCallThunkInner } from '@suite-common/connect-popup';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import {
    accountsActions,
    authorizeDeviceThunk,
    createDiscoveryThunk,
    deviceActions,
    disableAccountsThunk,
    removeFeeInfoThunk,
    selectDeviceDiscovery,
    selectSelectedDevice,
    startDiscoveryThunk,
    stopDiscoveryThunk,
    updateNetworkSettingsThunk,
} from '@suite-common/wallet-core';
import * as discoveryActions from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { MODAL, ROUTER, SUITE } from 'src/actions/suite/constants';
import { selectIsDeviceLocked } from 'src/reducers/suite/suiteReducer';
import { getApp } from 'src/utils/suite/router';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState }) => {
        const prevState = getState();
        const prevDiscovery = selectDeviceDiscovery(prevState);
        const discoveryIsRunningAndNotCanceled =
            prevDiscovery &&
            // condition excludes STOPPING state, so that `stopDiscoveryThunk` isn't called more than once
            prevDiscovery.status === DiscoveryStatus.RUNNING;

        if (
            deviceActions.forgetDevice.match(action) &&
            action.payload.device.state?.staticSessionId
        ) {
            dispatch(discoveryActions.removeDiscovery(action.payload.device.state.staticSessionId));
        }

        // do not close user context modals during discovery
        if (action.type === UI.CLOSE_UI_WINDOW && discoveryIsRunningAndNotCanceled) {
            const { modal } = prevState;
            if (modal.context === MODAL.CONTEXT_USER) {
                return action;
            }
        }

        // consider if discovery should be interrupted
        let interruptionIntent = false;
        if (action.type === deviceActions.selectDevice.type) {
            interruptionIntent = true;
        }
        if (
            action.type === ROUTER.LOCATION_CHANGE &&
            getApp(action.payload.url) !== 'wallet' &&
            getApp(action.payload.url) !== 'dashboard' &&
            getApp(action.payload.url) !== 'settings'
        ) {
            interruptionIntent = true;
        }
        if (action.type === MODAL.OPEN_USER_CONTEXT && action.payload.type === 'connect-popup') {
            interruptionIntent = true;
        }

        /*
         Some of the redux actions passing through here can:
         - interrupt discovery if RUNNING, and not already STOPPING
         - start a new discovery - must be neither RUNNING nor STOPPING
         Most difficult case is when an action does both (e.g. change device/passphrase):
         We need to interrupt discovery and delay this action until Connect cofirms it is cleared.
         Only then we may finish processing the action in redux and start a new discovery.
         Note: TrezorConnect.cancel is not awaitable; see `stopDiscoveryThunk` how it is circumvented
        */
        if (interruptionIntent && discoveryIsRunningAndNotCanceled) {
            await dispatch(stopDiscoveryThunk());
        }

        // Pass action to next middleware, meaning that the code below runs *only after* the action has been completely processed in Redux.
        // Note: TS says next(action) generally isn't async, but the action may return anything; sometimes it's a Promise → needs to be awaited
        await next(action);

        if (discoveryActions.changeNetworks.match(action)) {
            // update Discovery fields
            dispatch(updateNetworkSettingsThunk());
            // remove accounts which are no longer part of Discovery
            dispatch(disableAccountsThunk());
            // remove fees which are no longer part of Discovery
            dispatch(removeFeeInfoThunk({ networks: action.payload }));
        }

        const nextState = getState();
        if (nextState.router.app !== 'wallet' && nextState.router.app !== 'dashboard')
            return action;

        let authorizationIntent = false;
        const device = selectSelectedDevice(nextState);
        const isDeviceLocked = selectIsDeviceLocked(nextState);
        // 1. selected device is acquired but doesn't have a state
        if (
            isDeviceAcquired(device) &&
            !device.state?.staticSessionId &&
            !isDeviceLocked &&
            (deviceActions.selectDevice.match(action) || action.type === SUITE.APP_CHANGED)
        ) {
            authorizationIntent = true;
        }

        // 2. selected device becomes acquired from unacquired or connected from disconnected
        let becomesConnected = false;
        if (deviceActions.updateSelectedDevice.match(action)) {
            const prevDevice = prevState.device.selectedDevice;
            const becomesAcquired = !!(
                prevDevice &&
                !prevDevice.features &&
                device &&
                device.features
            );
            becomesConnected = !!(
                prevDevice &&
                !prevDevice.connected &&
                device &&
                device.connected
            );
            if (becomesAcquired) {
                authorizationIntent = true;
            }
        }

        // 3. begin auth process
        if (authorizationIntent) {
            dispatch(authorizeDeviceThunk());
        }

        // 4. device state received
        if (authorizeDeviceThunk.fulfilled.match(action)) {
            // `device` is always present here
            // to avoid typescript conditioning use device from action as a fallback (never used)
            dispatch(
                createDiscoveryThunk({
                    deviceState: action.payload.state.staticSessionId!,
                    device: device || action.payload.device,
                }),
            );
        }

        // 5. device state confirmation received
        if (
            deviceActions.receiveAuthConfirm.match(action) &&
            action.payload.device.state?.staticSessionId
        ) {
            // from discovery point of view it's irrelevant if authConfirm fails
            // it's a device matter now
            dispatch(
                discoveryActions.updateDiscovery({
                    deviceState: action.payload.device.state.staticSessionId,
                    authConfirm: false,
                }),
            );
        }

        // 6. start or restart discovery
        if (
            becomesConnected ||
            action.type === SUITE.APP_CHANGED ||
            connectPopupCallThunkInner.fulfilled.match(action) ||
            deviceActions.selectDevice.match(action) ||
            authorizeDeviceThunk.fulfilled.match(action) ||
            discoveryActions.changeNetworks.match(action) ||
            accountsActions.changeAccountVisibility.match(action)
        ) {
            const discovery = selectDeviceDiscovery(getState());
            if (
                device &&
                device.connected &&
                !device.authFailed &&
                !device.authConfirm &&
                discovery &&
                (discovery.status === DiscoveryStatus.IDLE ||
                    discovery.status >= DiscoveryStatus.STOPPED)
            ) {
                dispatch(startDiscoveryThunk());
            }
        }

        return action;
    },
);
