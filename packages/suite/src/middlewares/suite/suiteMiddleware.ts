import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { type FlagsRootState } from '@suite/flags';
import { METADATA } from '@suite/metadata';
import { type ModalRootState } from '@suite/modal';
import { recoveryActions } from '@suite/recovery';
import { type RouterRootState, goto, routerAppChanged } from '@suite/router';
import { updateOnlineStatus } from '@suite/suite-lifecycle';
import { deviceActions, isTrezorDeviceWithState } from '@suite-common/device';
import { type WithServices, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectIsDeviceAutoEjectEnabled,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';

import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { desktopHandshake, setRecentlyDisconnectedDevice } from 'src/actions/suite/suiteActions';

type SuiteMiddlewareState = AccountsRootState &
    WalletSettingsRootState & {
        flags: Pick<FlagsRootState['flags'], 'hasSeenDisconnectTooltip'>;
        modal: Pick<ModalRootState['modal'], 'context'>;
        router: Pick<RouterRootState['router'], 'route'>;
    };

const isActionDeviceRelated = (action: UnknownAction): boolean => {
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

export type PrepareSuiteMiddlewareDeps = WithServices<SuiteSyncDep>;

const createSuiteMiddleware = createMiddlewareWithExtraDeps<
    PrepareSuiteMiddlewareDeps,
    UnknownAction,
    SuiteMiddlewareState
>;

export const prepareSuiteMiddleware = createSuiteMiddleware(
    (action, { dispatch, next, getState, extra }) => {
        if (
            routerAppChanged.match(action) &&
            (action.payload === 'recovery' || action.payload === 'onboarding')
        ) {
            dispatch(recoveryActions.resetReducer());
        }

        // this action needs to be processed before propagation to deviceReducer
        // otherwise device will not be accessible and related data will not be removed (accounts, txs...)
        if (deviceActions.deviceDisconnect.match(action)) {
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
                        !state.flags.hasSeenDisconnectTooltip &&
                        state.wallet.accounts.length > 0 &&
                        !isModalActive
                    ) {
                        dispatch(
                            goto({
                                routeName: 'suite-switch-device',
                                params: { cancelable: true },
                            }),
                        );
                    }
                }, 1000);
            }
        }

        // pass action to reducers
        next(action);

        if (deviceActions.forgetDevice.match(action)) {
            const { device } = action.payload;

            if (isTrezorDeviceWithState(device)) {
                extra.services.suiteSync.turnOffSuiteSyncForWallet({
                    deviceStaticSessionId: device.state.staticSessionId,
                });
            }

            dispatch(handleDeviceDisconnect(device));
        }

        if (desktopHandshake.match(action)) {
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
        } else if (deviceActions.deviceDisconnect.match(action)) {
            dispatch(handleDeviceDisconnect(action.payload));
        } else if (updateOnlineStatus.match(action) && action.payload) {
            // Restart discovery to reconnect to backends when user goes offline -> online.
            dispatch(startOrRestartDiscoveryThunk());
        }
        if (isActionDeviceRelated(action)) {
            // keep suite reducer synchronized with other reducers (selected device)
            dispatch(observeSelectedDevice());
        }

        return action;
    },
);
