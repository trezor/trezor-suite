import { type Dispatch, type UnknownAction, createAction } from '@reduxjs/toolkit';

import { suiteSettingsActions } from '@suite/settings';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type HandshakeElectron } from '@trezor/suite-desktop-api';

import { SUITE } from './constants';

export const setSendFormPrefill = createAction(
    SUITE.SET_SEND_FORM_PREFILL,
    (payload: { contractAddress: string | undefined }) => ({ payload }),
);

export const desktopHandshake = createAction(
    SUITE.DESKTOP_HANDSHAKE,
    (payload: HandshakeElectron) => ({ payload }),
);

export const setRecentlyConnectedDevicePath = createAction(
    SUITE.SET_RECENTLY_CONNECTED_DEVICE,
    (payload: string | null) => ({ payload }),
);

export const setRecentlyDisconnectedDevice = createAction(
    SUITE.SET_RECENTLY_DISCONNECTED_DEVICE,
    (payload: string | null) => ({ payload }),
);

export const addDeviceIdToSeenDisconnectNotification = createAction(
    SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION,
    (deviceId: string) => ({ payload: { deviceId } }),
);

export const setTransactionHistoryPrefill = createAction<string>(
    SUITE.SET_TRANSACTION_HISTORY_PREFILL,
);

export const setSuiteError = createAction<string>(SUITE.ERROR);

export const confirmEvmExplanationModal = createAction<{
    symbol: NetworkSymbol;
    route: string;
}>(SUITE.EVM_CONFIRM_EXPLANATION_MODAL);

export const closeEvmExplanationBanner = createAction<NetworkSymbol>(
    SUITE.EVM_CLOSE_EXPLANATION_BANNER,
);

export const hideCoinjoinReceiveWarning = () => (dispatch: Dispatch<UnknownAction>) =>
    dispatch(suiteSettingsActions.setCoinjoinReceiveWarningHidden(true));

export const toggleDeviceAuthenticityCheck =
    (enable: boolean) => (dispatch: Dispatch<UnknownAction>) => {
        dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
        dispatch(suiteSettingsActions.toggleDeviceAuthenticityCheck(enable));
    };

export const toggleFirmwareAuthenticityChecks =
    (enable: boolean) => (dispatch: Dispatch<UnknownAction>) => {
        dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
        dispatch(suiteSettingsActions.toggleFirmwareRevisionCheck(enable));
        dispatch(suiteSettingsActions.toggleFirmwareHashCheck(enable));
        dispatch(suiteSettingsActions.toggleDeviceMetaChecks(enable));
    };
