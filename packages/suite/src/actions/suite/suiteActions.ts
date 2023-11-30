import { createAction } from '@reduxjs/toolkit';

import { notificationsActions } from '@suite-common/toast-notifications';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { desktopApi, HandshakeElectron } from '@trezor/suite-desktop-api';
import { analytics, EventType } from '@trezor/suite-analytics';
import { deviceActions } from '@suite-common/wallet-core';

import { TorStatus } from 'src/types/suite';
import { isOnionUrl } from 'src/utils/suite/tor';
import * as modalActions from 'src/actions/suite/modalActions';
import type { Locale } from 'src/config/suite/languages';
import type { Dispatch, GetState, AppState, TorBootstrap } from 'src/types/suite';
import {
    DebugModeOptions,
    AutodetectSettings,
    selectTorState,
} from 'src/reducers/suite/suiteReducer';
import type { TranslationKey } from 'src/components/suite/Translation';

import { SUITE } from './constants';

export type SuiteAction =
    | { type: typeof SUITE.INIT }
    | { type: typeof SUITE.READY }
    | { type: typeof SUITE.ERROR; error: string }
    | { type: typeof SUITE.DESKTOP_HANDSHAKE; payload: HandshakeElectron }
    | { type: typeof requestAuthConfirm.type }
    | {
          type: typeof SUITE.SET_LANGUAGE;
          locale: Locale;
      }
    | { type: typeof SUITE.SET_DEBUG_MODE; payload: Partial<DebugModeOptions> }
    | { type: typeof SUITE.ONLINE_STATUS; payload: boolean }
    | { type: typeof SUITE.TOR_STATUS; payload: TorStatus }
    | { type: typeof SUITE.TOR_BOOTSTRAP; payload: TorBootstrap | null }
    | { type: typeof SUITE.ONION_LINKS; payload: boolean }
    | { type: typeof SUITE.COINJOIN_RECEIVE_WARNING; payload: boolean }
    | { type: typeof SUITE.DEVICE_AUTHENTICITY_OPT_OUT; payload: boolean }
    | { type: typeof SUITE.LOCK_UI; payload: boolean }
    | ReturnType<typeof lockDevice>
    | { type: typeof SUITE.LOCK_ROUTER; payload: boolean }
    | {
          type: typeof SUITE.SET_FLAG;
          key: keyof AppState['suite']['flags'];
          value: boolean;
      }
    | { type: typeof SUITE.APP_CHANGED; payload: AppState['router']['app'] }
    | {
          type: typeof SUITE.SET_THEME;
          variant: AppState['suite']['settings']['theme']['variant'];
      }
    | {
          type: typeof SUITE.SET_ADDRESS_DISPLAY_TYPE;
          option: AppState['suite']['settings']['addressDisplayType'];
      }
    | {
          type: typeof SUITE.SET_AUTODETECT;
          payload: Partial<AutodetectSettings>;
      }
    | { type: typeof deviceActions.requestDeviceReconnect.type };

export const appChanged = createAction(
    SUITE.APP_CHANGED,
    (payload: AppState['router']['app'] | unknown) => ({
        payload,
    }),
);

export const desktopHandshake = (payload: HandshakeElectron): SuiteAction => ({
    type: SUITE.DESKTOP_HANDSHAKE,
    payload,
});

export const requestAuthConfirm = createAction(SUITE.REQUEST_AUTH_CONFIRM);

export const setTheme = (
    variant: AppState['suite']['settings']['theme']['variant'],
): SuiteAction => ({
    type: SUITE.SET_THEME,
    variant,
});

export const setAddressDisplayType = (
    option: AppState['suite']['settings']['addressDisplayType'],
): SuiteAction => ({
    type: SUITE.SET_ADDRESS_DISPLAY_TYPE,
    option,
});

export const setAutodetect = (payload: Partial<AutodetectSettings>): SuiteAction => ({
    type: SUITE.SET_AUTODETECT,
    payload,
});

export const setFlag = (key: keyof AppState['suite']['flags'], value: boolean): SuiteAction => ({
    type: SUITE.SET_FLAG,
    key,
    value,
});

export const initialRunCompleted = () => (dispatch: Dispatch, getState: GetState) => {
    if (getState().suite.flags.initialRun) {
        dispatch(setFlag('initialRun', false));
    }
};

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
    (shouldEnable: boolean) => async (dispatch: Dispatch, getState: GetState) => {
        const { torBootstrap } = selectTorState(getState());

        const backends = getCustomBackends(getState().wallet.blockchain);
        // Is there any network with only onion custom backends?
        const hasOnlyOnionBackends = backends.some(
            ({ urls }) => urls.length && urls.every(isOnionUrl),
        );

        if (!shouldEnable && hasOnlyOnionBackends) {
            const res = await dispatch(modalActions.openDeferredModal({ type: 'disable-tor' }));
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
            analytics.report({
                type: EventType.SettingsTor,
                payload: {
                    value: shouldEnable,
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

export const setOnionLinks = (payload: boolean): SuiteAction => ({
    type: SUITE.ONION_LINKS,
    payload,
});

/**
 * Triggered by `@suite/tor-bootstrap`
 * Set torBootstrap in suite reducer
 * @returns
 */
export const updateTorBootstrap = (payload: TorBootstrap | null): SuiteAction => ({
    type: SUITE.TOR_BOOTSTRAP,
    payload,
});

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
    dispatch({
        type: SUITE.COINJOIN_RECEIVE_WARNING,
        payload: true,
    });

export const deviceAutenticityOptOut = (payload: boolean) => (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'settings-applied' }));

    dispatch({
        type: SUITE.DEVICE_AUTHENTICITY_OPT_OUT,
        payload,
    });
};

/**
 * Called from `suiteMiddleware`
 * Set `loaded` field in suite reducer
 * @returns {SuiteAction}
 */
export const onSuiteReady = (): SuiteAction => ({
    type: SUITE.READY,
});

/**
 * Triggered by user action in:
 * - Debug Settings
 * Set `debug` object in suite reducer
 * @param {boolean} payload
 * @returns {SuiteAction}
 */
export const setDebugMode = (payload: Partial<DebugModeOptions>): SuiteAction => ({
    type: SUITE.SET_DEBUG_MODE,
    payload,
});

/**
 * Called from multiple places before and after TrezorConnect call
 * Prevent from mad clicking
 * Set `lock` field in suite reducer
 * @returns {SuiteAction}
 */
export const lockUI = (payload: boolean): SuiteAction => ({
    type: SUITE.LOCK_UI,
    payload,
});

/**
 * Prevent TrezorConnect multiple calls
 * Called before and after specific process, like onboarding
 * Set `lock` field in suite reducer
 * @returns {SuiteAction}
 */
export const lockDevice = createAction(SUITE.LOCK_DEVICE, (payload: boolean) => ({ payload }));

/**
 * Prevent route change and rendering
 * Called before and after specific process, like onboarding
 * Set `lock` field in suite reducer
 * @returns {SuiteAction}
 */
export const lockRouter = (payload: boolean): SuiteAction => ({
    type: SUITE.LOCK_ROUTER,
    payload,
});
