import { isAnyOf } from '@reduxjs/toolkit';

import { METADATA } from '@suite/metadata';
import { recoveryActions } from '@suite/recovery';
import { deviceActions, isTrezorDeviceWithState } from '@suite-common/device';
import { AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectIsDeviceAutoEjectEnabled,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';

import { ROUTER, SUITE } from 'src/actions/suite/constants';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { goto } from 'src/actions/suite/routerActions';
import { appChanged, setRecentlyDisconnectedDevice } from 'src/actions/suite/suiteActions';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            deviceActions.selectDevice,
            deviceActions.addButtonRequest,
            deviceActions.removeButtonRequests,
            deviceActions.setRememberDevice,
            deviceActions.forgetDevice,
            // ?
            deviceActions.setDeviceState,
            deviceActions.setDiscovered,
        )(action)
    ) {
        return true;
    }

    if (action.type === METADATA.SET_DEVICE_METADATA) return true;
    if (action.type === METADATA.SET_DEVICE_METADATA_PASSWORDS) return true;

    if (isAnyDeviceEventAction(action)) return true;

    return false;
};

export const prepareSuiteMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState, extra }) => {
        const prevApp = getState().router.app;
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== prevApp) {
            dispatch(appChanged(action.payload.app));
        }

        if (
            action.type === SUITE.APP_CHANGED &&
            (action.payload === 'recovery' || action.payload === 'onboarding')
        ) {
            dispatch(recoveryActions.resetReducer());
        }

        // this action needs to be processed before propagation to deviceReducer
        // otherwise device will not be accessible and related data will not be removed (accounts, txs...)
        if (action.type === DEVICE.DISCONNECT) {
            const state = getState();
            const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(state);
            dispatch(
                forgetDisconnectedDevices({
                    device: action.payload,
                    forceForget: isAutoEjectEnabled,
                }),
            );

            if (!isAutoEjectEnabled) {
                if (action.payload.id) {
                    dispatch(setRecentlyDisconnectedDevice(action.payload.id));
                }

                setTimeout(() => {
                    const hasModalContext = state.modal.context !== '@modal/context-none';
                    const { route } = state.router;
                    const isForegroundApp = !!route?.isForegroundApp;
                    const isModalActive = hasModalContext || isForegroundApp;

                    if (
                        !state.suite.flags.hasSeenDisconnectTooltip &&
                        state.wallet.accounts.length > 0 &&
                        !isModalActive
                    ) {
                        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));
                    }
                }, 1000);
            }
        }

        // pass action to reducers
        next(action);

        if (deviceActions.forgetDevice.match(action)) {
            const { device } = action.payload;

            dispatch(handleDeviceDisconnect(device));
            if (isTrezorDeviceWithState(device)) {
                extra.services.suiteSync.turnOffSuiteSyncForWallet({
                    deviceStaticSessionId: device.state.staticSessionId,
                });
            }
        }

        switch (action.type) {
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.protocol) {
                    dispatch(handleProtocolRequest(action.payload.protocol));
                }
                if (action.payload.desktopUpdate?.firstRun) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'auto-updater-new-version-first-run',
                            version: action.payload.desktopUpdate.firstRun,
                        }),
                    );
                }
                break;
            case DEVICE.DISCONNECT:
                dispatch(handleDeviceDisconnect(action.payload));
                break;
            case SUITE.ONLINE_STATUS:
                // Restart discovery to reconnect to backends when user goes offline -> online.
                if (action.payload === true) {
                    dispatch(startOrRestartDiscoveryThunk());
                }
                break;

            default:
                break;
        }
        if (isActionDeviceRelated(action)) {
            // keep suite reducer synchronized with other reducers (selected device)
            dispatch(observeSelectedDevice());
        }

        return action;
    },
);
