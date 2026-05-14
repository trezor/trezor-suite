import { createAction } from '@reduxjs/toolkit';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import type { TranslationKey } from '@suite/intl';
import { openDeferredModal } from '@suite/modal';
import { selectRouterUrl } from '@suite/router';
import { suiteSettingsActions } from '@suite/settings';
import { type deviceActions } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { type HandshakeElectron, desktopApi } from '@trezor/suite-desktop-api';

import { type EvmSettings } from 'src/reducers/suite/suiteReducer';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import type { Dispatch, GetState, TorBootstrap } from 'src/types/suite';
import { TorStatus } from 'src/types/suite';
import { isOnionUrl } from 'src/utils/suite/tor';

import { SUITE } from './constants';

export const setSendFormPrefill = createAction<
    { contractAddress: string | undefined },
    typeof SUITE.SET_SEND_FORM_PREFILL
>(SUITE.SET_SEND_FORM_PREFILL);

type SetSendFormPrefillAction = ReturnType<typeof setSendFormPrefill>;

export type SuiteAction =
    | { type: typeof SUITE.INIT }
    | { type: typeof SUITE.READY }
    | { type: typeof SUITE.ERROR; error: string }
    | { type: typeof SUITE.DESKTOP_HANDSHAKE; payload: HandshakeElectron }
    | { type: typeof SUITE.ONLINE_STATUS; payload: boolean }
    | { type: typeof SUITE.TOR_STATUS; payload: TorStatus }
    | { type: typeof SUITE.TOR_BOOTSTRAP; payload: TorBootstrap | null }
    | {
          type: typeof SUITE.SET_RECENTLY_CONNECTED_DEVICE;
          payload: string | null;
      }
    | {
          type: typeof SUITE.SET_RECENTLY_DISCONNECTED_DEVICE;
          payload: string | null;
      }
    | {
          type: typeof SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION;
          payload: { deviceId: string };
      }
    | {
          type: typeof SUITE.EVM_CONFIRM_EXPLANATION_MODAL;
          symbol: keyof EvmSettings['confirmExplanationModalClosed'];
          route: string;
      }
    | {
          type: typeof SUITE.EVM_CLOSE_EXPLANATION_BANNER;
          symbol: keyof EvmSettings['explanationBannerClosed'];
      }
    | {
          type: typeof SUITE.SET_TRANSACTION_HISTORY_PREFILL;
          payload: string;
      }
    | { type: typeof deviceActions.requestDeviceReconnect.type }
    | SetSendFormPrefillAction;

export const desktopHandshake = (payload: HandshakeElectron): SuiteAction => ({
    type: SUITE.DESKTOP_HANDSHAKE,
    payload,
});

export const setRecentlyConnectedDevicePath = (payload: string | null): SuiteAction => ({
    type: SUITE.SET_RECENTLY_CONNECTED_DEVICE,
    payload,
});
export const setRecentlyDisconnectedDevice = (payload: string | null): SuiteAction => ({
    type: SUITE.SET_RECENTLY_DISCONNECTED_DEVICE,
    payload,
});
export const addDeviceIdToSeenDisconnectNotification = (deviceId: string): SuiteAction => ({
    type: SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION,
    payload: { deviceId },
});

/**
 * Triggered by `@suite-support/OnlineStatus` or `@suite-native/support/OnlineStatus`
 * Set `online` status in suite reducer
 * @param {boolean} payload
 * @returns {SuiteAction}
 */
export const updateOnlineStatus = (payload: boolean): SuiteAction => ({
    type: SUITE.ONLINE_STATUS,
    payload,
});

/**
 * Triggered by `@suite/tor-status`
 * Set `tor` status in suite reducer
 * @param {boolean} payload
 * @returns {Action}
 */
export const updateTorStatus = (payload: TorStatus): SuiteAction => ({
    type: SUITE.TOR_STATUS,
    payload,
});

export const toggleTor =
    (shouldEnable: boolean, modal: string | undefined) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { torBootstrap } = selectTorState(getState());

        const backends = getCustomBackends(getState().wallet.blockchain);
        // Is there any network with only onion custom backends?
        const hasOnlyOnionBackends = backends.some(
            ({ urls }) => urls.length && urls.every(isOnionUrl),
        );

        if (!shouldEnable && hasOnlyOnionBackends) {
            const res = await dispatch(openDeferredModal({ type: 'disable-tor' }));
            if (!res) return;
        }

        if (shouldEnable && torBootstrap) {
            // Reset Tor Bootstrap before starting it.
            dispatch({
                type: SUITE.TOR_BOOTSTRAP,
                payload: null,
            });
        }

        if (shouldEnable) {
            // Updating here TorStatus to Enabling so user gets faster feedback that something is happening
            // instead of wait for the event coming from request-manager in useTor.
            dispatch(updateTorStatus(TorStatus.Enabling));
        }

        const ipcResponse = await desktopApi.toggleTor(shouldEnable);

        if (ipcResponse.success) {
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.settingsTorEvent.name,
                payload: {
                    value: shouldEnable,
                    location: selectRouterUrl(getState()),
                    modal,
                },
            });
        }

        if (!ipcResponse.success && ipcResponse.error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'tor-toggle-error',
                    error: ipcResponse.error as TranslationKey,
                }),
            );

            return Promise.reject();
        }
    };

export const setTorBootstrap =
    (torBootstrap: TorBootstrap) => (dispatch: Dispatch, getState: GetState) => {
        const { torBootstrap: previousTorBootstrap } = selectTorState(getState());

        const payload: TorBootstrap = {
            current: torBootstrap.current,
            total: torBootstrap.total,
            isSlow: previousTorBootstrap ? previousTorBootstrap.isSlow : false,
        };

        dispatch({
            type: SUITE.TOR_BOOTSTRAP,
            payload,
        });
    };

export const setTorBootstrapSlow =
    (isSlow: boolean) => (dispatch: Dispatch, getState: GetState) => {
        const { torBootstrap: previousTorBootstrap } = selectTorState(getState());

        if (!previousTorBootstrap) {
            // Does not make sense to set bootstrap to slow when there is no bootstrap happening.
            return;
        }

        if (isSlow && !previousTorBootstrap?.isSlow) {
            dispatch(
                notificationsActions.addToast({
                    type: 'tor-is-slow',
                    autoClose: false,
                }),
            );
        }

        const payload: TorBootstrap = {
            current: previousTorBootstrap.current,
            total: previousTorBootstrap.total,
            isSlow,
        };

        dispatch({
            type: SUITE.TOR_BOOTSTRAP,
            payload,
        });
    };

export const hideCoinjoinReceiveWarning = () => (dispatch: Dispatch) =>
    dispatch(suiteSettingsActions.setCoinjoinReceiveWarningHidden(true));

export const toggleDeviceAuthenticityCheck = (enable: boolean) => (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
    dispatch(suiteSettingsActions.toggleDeviceAuthenticityCheck(enable));
};

export const toggleFirmwareAuthenticityChecks = (enable: boolean) => (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
    dispatch(suiteSettingsActions.toggleFirmwareRevisionCheck(enable));
    dispatch(suiteSettingsActions.toggleFirmwareHashCheck(enable));
    dispatch(suiteSettingsActions.toggleDeviceMetaChecks(enable));
};

/**
 * Called from `suiteMiddleware`
 * Set `loaded` field in suite reducer
 * @returns {SuiteAction}
 */
export const onSuiteReady = (): SuiteAction => ({
    type: SUITE.READY,
});
