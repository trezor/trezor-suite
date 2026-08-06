import { createAction } from '@reduxjs/toolkit';

import { suiteSettingsActions } from '@suite/settings';
import { type deviceActions } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type HandshakeElectron } from '@trezor/suite-desktop-api';

import { type EvmSettings } from 'src/reducers/suite/suiteReducer';
import { type Dispatch } from 'src/types/suite';

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
