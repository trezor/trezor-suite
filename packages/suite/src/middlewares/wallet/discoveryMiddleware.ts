import * as discoveryActions from '@suite-common/wallet-core';
import {
    accountsActions,
    disableAccountsThunk,
    createDiscoveryThunk,
    startDiscoveryThunk,
    stopDiscoveryThunk,
    updateNetworkSettingsThunk,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { SUITE, ROUTER, MODAL } from 'src/actions/suite/constants';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { selectDevice, selectDiscoveryForDevice } from 'src/reducers/suite/suiteReducer';
import { getApp } from 'src/utils/suite/router';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState }) => {
        const prevState = getState();
        const prevDiscovery = selectDiscoveryForDevice(prevState);
        const discoveryIsRunning =
            prevDiscovery &&
            prevDiscovery.status > DiscoveryStatus.IDLE &&
            prevDiscovery.status < DiscoveryStatus.STOPPING;

        if (action.type === SUITE.FORGET_DEVICE && action.payload.state) {
            dispatch(discoveryActions.removeDiscovery(action.payload.state));
        }

        // do not close user context modals during discovery
        if (action.type === UI.CLOSE_UI_WINDOW && discoveryIsRunning) {
            const { modal } = prevState;
            if (modal.context === MODAL.CONTEXT_USER) {
                return action;
            }
        }

        // consider if discovery should be interrupted
        let interruptionIntent = action.type === SUITE.SELECT_DEVICE;
        if (action.type === ROUTER.LOCATION_CHANGE) {
            interruptionIntent =
                getApp(action.payload.url) !== 'wallet' &&
                getApp(action.payload.url) !== 'dashboard';
        }

        // discovery interruption ends after DISCOVERY.STOP action
        // action which triggers this interruption will be propagated AFTER stop
        if (interruptionIntent && discoveryIsRunning) {
            await dispatch(stopDiscoveryThunk());
        }

        // pass action
        await next(action);

        if (walletSettingsActions.changeNetworks.match(action)) {
            // update Discovery fields
            dispatch(updateNetworkSettingsThunk());
            // remove accounts which are no longer part of Discovery
            dispatch(disableAccountsThunk());
        }

        const nextState = getState();
        if (nextState.router.app !== 'wallet' && nextState.router.app !== 'dashboard')
            return action;

        let authorizationIntent = false;
        const { locks } = nextState.suite;
        const device = selectDevice(nextState);
        // 1. selected device is acquired but doesn't have a state
        if (
            device &&
            device.features &&
            !device.state &&
            !locks.includes(SUITE.LOCK_TYPE.DEVICE) &&
            (action.type === SUITE.SELECT_DEVICE || action.type === SUITE.APP_CHANGED)
        ) {
            authorizationIntent = true;
        }

        // 2. selected device becomes acquired from unacquired or connected from disconnected
        let becomesConnected = false;
        if (action.type === SUITE.UPDATE_SELECTED_DEVICE) {
            const prevDevice = prevState.suite.device;
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
            dispatch(suiteActions.authorizeDevice());
        }

        // 4. device state received
        if (action.type === SUITE.AUTH_DEVICE) {
            // `device` is always present here
            // to avoid typescript conditioning use device from action as a fallback (never used)
            dispatch(
                createDiscoveryThunk({
                    deviceState: action.state,
                    device: device || action.payload,
                }),
            );
        }

        // 5. device state confirmation received
        if (action.type === SUITE.RECEIVE_AUTH_CONFIRM && action.payload.state) {
            // from discovery point of view it's irrelevant if authConfirm fails
            // it's a device matter now
            dispatch(
                discoveryActions.updateDiscovery({
                    deviceState: action.payload.state,
                    authConfirm: false,
                }),
            );
        }

        // 6. start or restart discovery
        if (
            becomesConnected ||
            action.type === SUITE.APP_CHANGED ||
            action.type === SUITE.SELECT_DEVICE ||
            action.type === SUITE.AUTH_DEVICE ||
            walletSettingsActions.changeNetworks.match(action) ||
            accountsActions.changeAccountVisibility.match(action)
        ) {
            const discovery = selectDiscoveryForDevice(getState());
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
